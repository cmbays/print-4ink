'use client'

import { useState, useMemo, useCallback, useRef, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Plus,
  Save,
  Send,
  StickyNote,
  ImageIcon,
  User,
  ShoppingBag,
  DollarSign,
  Tag,
  Monitor,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/primitives/button'
import { Label } from '@shared/ui/primitives/label'
import { Textarea } from '@shared/ui/primitives/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/primitives/tooltip'
import { Switch } from '@shared/ui/primitives/switch'
import {
  CustomerCombobox,
  type CustomerOption,
} from '@features/customers/components/CustomerCombobox'
import { AddCustomerModal } from '@features/customers/components/AddCustomerModal'
import { LineItemRow } from './LineItemRow'
import { PricingSummary } from './PricingSummary'
import { CollapsibleSection } from './CollapsibleSection'
import { ArtworkLibrary } from './ArtworkLibrary'
import { ArtworkUploadModal } from './ArtworkUploadModal'
import { QuoteReviewSheet } from './QuoteReviewSheet'
import { ServiceTypeTabBar } from './ServiceTypeTabBar'
import { DtfTabContent } from './DtfTabContent'
import type { Color } from '@domain/entities/color'
import type { GarmentCatalog } from '@domain/entities/garment'

import {
  CUSTOMER_TAG_LABELS,
  SERVICE_TYPE_LABELS,
  TAX_RATE,
  CONTRACT_DISCOUNT_RATE,
} from '@domain/constants'
import { money, round2, toNumber, formatCurrency } from '@domain/lib/money'
import { deriveScreensFromJobs } from '@domain/rules/screen.rules'
import { getJobsMutable } from '@infra/repositories/jobs'
import {
  type LineItemData,
  calculateGarmentCost,
  calculateDecorationCost,
  calculateLineItemSetupFee,
  calculateQuoteSetupFee,
} from './LineItemRow'
import type { Discount, ServiceType } from '@domain/entities/quote'
import type { DtfLineItem } from '@domain/entities/dtf-line-item'
import type { SheetCalculation, CanvasLayout } from '@domain/entities/dtf-sheet-calculation'
import type { Artwork, ArtworkTag } from '@domain/entities/artwork'
import type { Customer, CustomerTag, CustomerTypeTag } from '@domain/entities/customer'
import { cn } from '@shared/lib/cn'
import { scrollToFirstError } from '@shared/lib/scroll-to-error'

export type QuoteFormInitialData = {
  customerId?: string
  lineItems?: LineItemData[]
  discounts?: Discount[]
  shipping?: number
  artworkIds?: string[]
  internalNotes?: string
  customerNotes?: string
}

type QuoteFormProps = {
  mode: 'create' | 'edit'
  customers: Customer[]
  colors: Color[]
  garmentCatalog: GarmentCatalog[]
  artworks: Artwork[]
  initialData?: QuoteFormInitialData
  quoteId?: string
}

function createEmptyLineItem(): LineItemData {
  return {
    id: crypto.randomUUID(),
    garmentId: '',
    colorId: '',
    sizes: {},
    serviceType: 'screen-print',
    printLocationDetails: [],
  }
}

export function QuoteForm({
  mode,
  customers: initialCustomers,
  colors,
  garmentCatalog,
  artworks,
  initialData,
  quoteId,
}: QuoteFormProps) {
  const router = useRouter()

  // Customer state — local copy + any newly-added customers within this form session
  const [localCustomers, setLocalCustomers] = useState([...initialCustomers])
  const [customerId, setCustomerId] = useState(initialData?.customerId || '')
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  // Line items
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    initialData?.lineItems || [createEmptyLineItem()]
  )

  // Pricing — setup fees and tax are computed, not stateful
  const [discounts, setDiscounts] = useState<Discount[]>(
    // Filter out contract discounts from initialData — those are auto-computed now
    (initialData?.discounts || []).filter((d) => d.type !== 'contract')
  )
  const [shipping, setShipping] = useState(initialData?.shipping || 0)

  // Artwork
  const [artworkIds, setArtworkIds] = useState<string[]>(initialData?.artworkIds || [])
  const [showUploadArtwork, setShowUploadArtwork] = useState(false)
  const [localArtworks, setLocalArtworks] = useState<Artwork[]>([])

  // Notes
  const [internalNotes, setInternalNotes] = useState(initialData?.internalNotes || '')
  const [customerNotes, setCustomerNotes] = useState(initialData?.customerNotes || '')

  // Service type tabs (S19, S20)
  const [activeServiceTab, setActiveServiceTab] = useState<ServiceType>('screen-print')
  const [enabledServiceTypes, setEnabledServiceTypes] = useState<ServiceType[]>(['screen-print'])

  // DTF state — lifted to QuoteForm for tab switching preservation (R1.2)
  const [dtfLineItems, setDtfLineItems] = useState<DtfLineItem[]>([])
  const [sheetCalculation, setSheetCalculation] = useState<SheetCalculation | null>(null)
  const [splitMode, setSplitMode] = useState<'combine' | 'split'>('combine')
  const [canvasLayout, setCanvasLayout] = useState<CanvasLayout[] | null>(null)
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  // Screen reuse
  const customerScreens = useMemo(() => {
    if (!customerId) return []
    return deriveScreensFromJobs(customerId, getJobsMutable())
  }, [customerId])
  const [screenReuse, setScreenReuse] = useState(false)

  // Review sheet
  const [showReview, setShowReview] = useState(false)

  // Ref for scrolling to notes section
  const notesRef = useRef<HTMLDivElement>(null)
  // Track if notes section is open (for the sticky bar button)
  const [notesOpen, setNotesOpen] = useState(
    !!(initialData?.internalNotes || initialData?.customerNotes)
  )

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lineItemErrors, setLineItemErrors] = useState<Record<number, Record<string, string>>>({})

  // Derived values
  const selectedCustomer = localCustomers.find((c) => c.id === customerId)
  const customerTag: CustomerTag | undefined = selectedCustomer?.tag

  // Map full Customer objects to CustomerOption with derived contactRole
  const customerOptions: CustomerOption[] = useMemo(
    () =>
      localCustomers.map((c) => {
        const primaryContact = c.contacts.find((ct) => ct.isPrimary)
        return {
          id: c.id,
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone,
          tag: c.tag,
          lifecycleStage: c.lifecycleStage,
          typeTags: c.typeTags,
          contactRole: primaryContact?.role,
        }
      }),
    [localCustomers]
  )

  // Get artworks for selected customer
  const customerArtworks = useMemo(() => {
    if (!customerId) return []
    return [...artworks.filter((a) => a.customerId === customerId), ...localArtworks]
  }, [artworks, customerId, localArtworks])

  // Artworks selected for this quote — includes both quote-level selections
  // AND any artwork assigned to print locations in line items
  const quoteArtworks = useMemo(() => {
    const allReferencedIds = new Set(artworkIds)
    lineItems.forEach((item) => {
      item.printLocationDetails.forEach((d) => {
        if (d.artworkId) allReferencedIds.add(d.artworkId)
      })
    })
    return customerArtworks.filter((a) => allReferencedIds.has(a.id))
  }, [customerArtworks, artworkIds, lineItems])

  // Compute cost breakdowns for PricingSummary
  const pricingBreakdown = useMemo(() => {
    let garmentSubtotalBig = money(0)
    let decorationSubtotalBig = money(0)
    let lineItemSetupFeesBig = money(0)

    lineItems.forEach((item) => {
      const garment = garmentCatalog.find((g) => g.id === item.garmentId)
      const totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0)
      garmentSubtotalBig = garmentSubtotalBig.plus(calculateGarmentCost(garment, totalQty))
      decorationSubtotalBig = decorationSubtotalBig.plus(
        calculateDecorationCost(item.serviceType, item.printLocationDetails, totalQty)
      )
      lineItemSetupFeesBig = lineItemSetupFeesBig.plus(calculateLineItemSetupFee(item.serviceType))
    })

    const garmentSubtotal = toNumber(round2(garmentSubtotalBig))
    const decorationSubtotal = toNumber(round2(decorationSubtotalBig))
    const lineItemSetupFees = toNumber(round2(lineItemSetupFeesBig))
    const quoteSetupFee = screenReuse ? 0 : calculateQuoteSetupFee(lineItems)
    const screenReuseDiscount = screenReuse ? calculateQuoteSetupFee(lineItems) : 0
    const setupFees = toNumber(money(lineItemSetupFees).plus(quoteSetupFee))

    return { garmentSubtotal, decorationSubtotal, setupFees, screenReuseDiscount }
  }, [lineItems, screenReuse, garmentCatalog])

  // DTF subtotal (N54)
  const dtfSubtotal = sheetCalculation?.totalCost ?? 0

  // Grand total for sticky bar
  const grandTotal = useMemo(() => {
    const { garmentSubtotal, decorationSubtotal, setupFees } = pricingBreakdown
    const subtotal = money(garmentSubtotal).plus(decorationSubtotal).plus(dtfSubtotal)
    const contractDiscount =
      customerTag === 'contract' ? round2(subtotal.times(CONTRACT_DISCOUNT_RATE)) : money(0)
    const manualDiscountTotal = discounts.reduce((s, d) => money(s).plus(d.amount), money(0))
    const totalDiscountAmount = contractDiscount.plus(manualDiscountTotal)
    const preTaxTotal = subtotal.plus(setupFees).minus(totalDiscountAmount).plus(shipping)
    const tax = round2(preTaxTotal.times(TAX_RATE))
    return toNumber(preTaxTotal.plus(tax))
  }, [pricingBreakdown, dtfSubtotal, customerTag, discounts, shipping])

  // Handlers
  const handleLineItemChange = useCallback((index: number, data: LineItemData) => {
    setLineItems((prev) => {
      const next = [...prev]
      next[index] = data
      return next
    })
    setLineItemErrors((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }, [])

  const handleLineItemRemove = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
    setLineItemErrors((prev) => {
      const next: Record<number, Record<string, string>> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const k = parseInt(key, 10)
        if (k < index) next[k] = val
        else if (k > index) next[k - 1] = val
      })
      return next
    })
  }, [])

  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()])
  }, [])

  const handleCustomerSelect = useCallback(
    (id: string) => {
      setCustomerId(id)
      // Reset screen reuse when customer changes
      setScreenReuse(false)
      // Reset artwork selection when customer changes
      setArtworkIds([])
      setLocalArtworks([])
      // Clear artwork assignments and reset color counts from print location details
      setLineItems((prev) =>
        prev.map((item) => ({
          ...item,
          printLocationDetails: item.printLocationDetails.map((d) => ({
            ...d,
            artworkId: undefined,
            colorCount: 0,
          })),
        }))
      )

      // Free shipping for contract customers
      const customer = localCustomers.find((c) => c.id === id)
      if (customer?.tag === 'contract') {
        setShipping(0)
      }

      if (errors.customerId) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.customerId
          return next
        })
      }
    },
    [localCustomers, errors.customerId]
  )

  const handleAddNewCustomer = useCallback(
    (data: {
      company: string
      name: string
      email?: string
      phone?: string
      typeTags: CustomerTypeTag[]
      lifecycleStage: 'prospect' | 'new'
    }) => {
      const now = new Date().toISOString()
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email || '',
        company: data.company,
        phone: data.phone || '',
        address: '',
        tag: 'new' as CustomerTag,
        lifecycleStage: data.lifecycleStage,
        healthStatus: 'active',
        isArchived: false,
        typeTags: data.typeTags,
        contacts: [],
        groups: [],
        shippingAddresses: [],
        paymentTerms: 'upfront',
        pricingTier: 'standard',
        taxExempt: false,
        favoriteGarments: [],
        favoriteColors: [],
        favoriteBrandNames: [],
        createdAt: now,
        updatedAt: now,
      }
      setLocalCustomers((prev) => [...prev, newCustomer])
      handleCustomerSelect(newCustomer.id)
    },
    [handleCustomerSelect]
  )

  // N40 — handleTabSwitch
  const handleTabSwitch = useCallback((type: ServiceType) => {
    setActiveServiceTab(type)
  }, [])

  // N42 — addServiceType
  const handleAddServiceType = useCallback((type: ServiceType) => {
    setEnabledServiceTypes((prev) => [...prev, type])
    setActiveServiceTab(type)
  }, [])

  // N56 — validateDtfTab: check DTF line items + sheet calculation
  const validateDtfTab = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (dtfLineItems.length === 0) {
      errors.push('At least one DTF design is required')
      return { valid: false, errors }
    }

    dtfLineItems.forEach((item, i) => {
      const label = item.artworkName.trim() || `Design ${i + 1}`
      if (!item.artworkName.trim()) {
        errors.push(`${label}: artwork name is required`)
      }
      if (item.width <= 0 || item.height <= 0) {
        errors.push(`${label}: valid dimensions are required`)
      }
      if (item.quantity < 1) {
        errors.push(`${label}: quantity must be at least 1`)
      }
    })

    // TODO(Wave 3): Re-enable when sheet calculation UI is wired
    // if (!sheetCalculation) {
    //   errors.push("Sheet layout must be calculated before saving");
    // }

    return { valid: errors.length === 0, errors }
  }, [dtfLineItems])

  // N41 — validateTabCompletion (per-tab validation badges)
  const tabValidation = useMemo((): Record<ServiceType, boolean> => {
    // Screen print: at least one line item with garment and sizes
    const spValid = lineItems.some((item) => {
      if (!item.garmentId) return false
      const totalQty = Object.values(item.sizes).reduce((s, q) => s + q, 0)
      return totalQty > 0
    })

    // DTF: reuse N56 logic
    const { valid: dtfValid } = validateDtfTab()

    return {
      'screen-print': spValid,
      dtf: dtfValid,
      embroidery: false,
    }
  }, [lineItems, validateDtfTab])

  const handleToggleArtwork = useCallback((artworkId: string) => {
    setArtworkIds((prev) => {
      const isDeselecting = prev.includes(artworkId)
      if (isDeselecting) {
        // Also clear this artwork from any print location assignments and reset color count
        setLineItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            printLocationDetails: item.printLocationDetails.map((d) =>
              d.artworkId === artworkId ? { ...d, artworkId: undefined, colorCount: 0 } : d
            ),
          }))
        )
        return prev.filter((id) => id !== artworkId)
      }
      return [...prev, artworkId]
    })
  }, [])

  const handleUploadArtwork = useCallback(
    (data: { name: string; colorCount: number; tags: ArtworkTag[]; saveToLibrary: boolean }) => {
      const newArtwork: Artwork = {
        id: `art-new-${Date.now()}`,
        customerId: customerId || 'unknown',
        name: data.name,
        fileName: `${data.name.toLowerCase().replace(/\s+/g, '-')}.svg`,
        thumbnailUrl: '/mock-artwork/river-city-logo-full.svg',
        colorCount: data.colorCount,
        tags: data.tags,
        createdAt: new Date().toISOString(),
      }
      setLocalArtworks((prev) => [...prev, newArtwork])
      setArtworkIds((prev) => [...prev, newArtwork.id])
    },
    [customerId]
  )

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}
    const nextLineErrors: Record<number, Record<string, string>> = {}

    if (!customerId) {
      nextErrors.customerId = 'Customer is required'
    }

    // Validate screen print tab if enabled
    if (enabledServiceTypes.includes('screen-print')) {
      if (lineItems.length === 0) {
        nextErrors.lineItems = 'At least one line item is required'
      }

      lineItems.forEach((item, i) => {
        const itemErrors: Record<string, string> = {}
        if (!item.garmentId) {
          itemErrors.garmentId = 'Garment is required'
        }
        const totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0)
        if (totalQty === 0) {
          itemErrors.sizes = 'At least one size with qty > 0 is required'
        }
        if (Object.keys(itemErrors).length > 0) {
          nextLineErrors[i] = itemErrors
        }
      })
    }

    // Validate DTF tab if enabled (N56)
    const failedTabs: ServiceType[] = []
    if (enabledServiceTypes.includes('dtf')) {
      const dtfResult = validateDtfTab()
      if (!dtfResult.valid) {
        nextErrors.dtfTab = dtfResult.errors.join('. ')
        failedTabs.push('dtf')
        // Only show toast when user is NOT on DTF tab (inline error handles it otherwise)
        if (activeServiceTab !== 'dtf') {
          toast.error('DTF tab has errors', {
            description: dtfResult.errors.join('. '),
          })
        }
      }
    }

    setErrors(nextErrors)
    setLineItemErrors(nextLineErrors)

    if (enabledServiceTypes.includes('screen-print')) {
      const spHasErrors =
        Object.keys(nextErrors).some((k) => k === 'lineItems') ||
        Object.keys(nextLineErrors).length > 0

      if (spHasErrors) {
        failedTabs.push('screen-print')
      }
    }

    // Single tab-switch decision: only switch if current tab has no errors but another does.
    // Skip tab switch when quote-level errors (e.g. customerId) should take priority.
    const hasQuoteLevelErrors = !!nextErrors.customerId
    if (failedTabs.length > 0 && !failedTabs.includes(activeServiceTab) && !hasQuoteLevelErrors) {
      setActiveServiceTab(failedTabs[0])
    }

    return Object.keys(nextErrors).length === 0 && Object.keys(nextLineErrors).length === 0
  }

  const isEdit = mode === 'edit'

  // Build a Quote object for the review sheet
  function buildQuoteForReview() {
    const { garmentSubtotal, decorationSubtotal, setupFees } = pricingBreakdown
    const subtotalBig = money(garmentSubtotal).plus(decorationSubtotal).plus(dtfSubtotal)
    const subtotal = toNumber(subtotalBig)

    // Compute contract discount
    const contractDiscount =
      customerTag === 'contract' ? toNumber(round2(subtotalBig.times(CONTRACT_DISCOUNT_RATE))) : 0
    const manualDiscountTotal = toNumber(discounts.reduce((s, d) => s.plus(d.amount), money(0)))
    const totalDiscountAmount = toNumber(money(contractDiscount).plus(manualDiscountTotal))

    const preTaxTotal = toNumber(
      money(subtotal).plus(setupFees).minus(totalDiscountAmount).plus(shipping)
    )
    const tax = toNumber(round2(money(preTaxTotal).times(TAX_RATE)))
    const total = toNumber(money(preTaxTotal).plus(tax))

    // Build discount array for review
    const allDiscounts: Discount[] = [
      ...(customerTag === 'contract'
        ? [{ label: 'Contract Pricing (7%)', amount: contractDiscount, type: 'contract' as const }]
        : []),
      ...discounts,
    ]

    // N55 — mergeQuoteData: combine SP + DTF data
    return {
      id: quoteId || 'new-preview',
      quoteNumber: quoteId ? `Q-${quoteId.slice(0, 4)}` : 'Q-NEW',
      customerId: customerId,
      lineItems: lineItems.map((item) => {
        const garment = garmentCatalog.find((g) => g.id === item.garmentId)
        const totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0)
        const garmentCost = calculateGarmentCost(garment, totalQty)
        const decorationCost = calculateDecorationCost(
          item.serviceType,
          item.printLocationDetails,
          totalQty
        )
        const lineTotal = toNumber(money(garmentCost).plus(decorationCost))
        const unitPrice = totalQty > 0 ? toNumber(round2(money(lineTotal).div(totalQty))) : 0
        return {
          garmentId: item.garmentId,
          colorId: item.colorId,
          sizes: item.sizes,
          serviceType: item.serviceType,
          printLocationDetails: item.printLocationDetails,
          unitPrice,
          lineTotal,
        }
      }),
      // DTF data merged into quote payload
      dtfLineItems: enabledServiceTypes.includes('dtf') ? dtfLineItems : [],
      dtfSheetCalculation: enabledServiceTypes.includes('dtf') ? sheetCalculation : null,
      setupFees,
      subtotal,
      total,
      discounts: allDiscounts,
      shipping,
      tax,
      artworkIds: quoteArtworks.map((a) => a.id),
      isArchived: false,
      status: 'draft' as const,
      internalNotes: internalNotes || undefined,
      customerNotes: customerNotes || undefined,
      createdAt: new Date().toISOString(),
    }
  }

  function handleSave(sendToCustomer: boolean) {
    if (!validate()) {
      scrollToFirstError()
      return
    }

    // N55 — build merged data summary for toast
    const summaryParts: string[] = []
    if (enabledServiceTypes.includes('screen-print')) {
      const spQty = lineItems.reduce(
        (sum, item) => sum + Object.values(item.sizes).reduce((s, q) => s + q, 0),
        0
      )
      summaryParts.push(
        `${lineItems.length} SP line item${lineItems.length !== 1 ? 's' : ''} (${spQty} qty)`
      )
    }
    if (enabledServiceTypes.includes('dtf') && dtfLineItems.length > 0) {
      const sheetInfo = sheetCalculation
        ? ` on ${sheetCalculation.totalSheets} sheet${sheetCalculation.totalSheets !== 1 ? 's' : ''}`
        : ''
      summaryParts.push(
        `${dtfLineItems.length} DTF design${dtfLineItems.length !== 1 ? 's' : ''}${sheetInfo}`
      )
    }
    const dataSummary = summaryParts.join(' + ')

    if (sendToCustomer) {
      toast.success('Quote sent to customer', {
        description: `${dataSummary}. The customer will receive an email with the quote.`,
      })
    } else {
      toast.success(isEdit ? 'Quote updated' : 'Quote saved as draft', {
        description: isEdit
          ? `${dataSummary}. Quote ${quoteId ?? ''} has been updated.`
          : `${dataSummary}. You can continue editing this quote later.`,
      })
    }

    router.push('/quotes')
  }

  function handleReviewAndSend() {
    if (!validate()) {
      scrollToFirstError()
      return
    }
    setShowReview(true)
  }

  // Summaries for collapsed sections
  const customerSummary = selectedCustomer
    ? `${selectedCustomer.name} — ${selectedCustomer.company}${customerTag ? ` (${CUSTOMER_TAG_LABELS[customerTag]})` : ''}`
    : undefined

  const totalArtworkColors = useMemo(() => {
    return quoteArtworks.reduce((sum, a) => sum + a.colorCount, 0)
  }, [quoteArtworks])

  const artworkSummary =
    artworkIds.length > 0
      ? `${artworkIds.length} artwork${artworkIds.length !== 1 ? 's' : ''} | ${totalArtworkColors} total color${totalArtworkColors !== 1 ? 's' : ''}`
      : undefined

  // Line item summary grouped by service type (includes artwork + garment details)
  const serviceTypeBreakdown = useMemo(() => {
    const grouped: Record<
      string,
      {
        count: number
        qty: number
        garments: {
          garmentName: string
          colorHex: string
          colorName: string
          sizes: Record<string, number>
          locations: { location: string; artworkId?: string }[]
        }[]
      }
    > = {}
    lineItems.forEach((item) => {
      if (!item.garmentId) return
      const totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0)
      if (!grouped[item.serviceType]) {
        grouped[item.serviceType] = { count: 0, qty: 0, garments: [] }
      }
      grouped[item.serviceType].count += 1
      grouped[item.serviceType].qty += totalQty
      const garment = garmentCatalog.find((g) => g.id === item.garmentId)
      const color = colors.find((c) => c.id === item.colorId)
      if (color) {
        grouped[item.serviceType].garments.push({
          garmentName: garment ? `${garment.brand} ${garment.sku}` : 'Unknown',
          colorHex: color.hex,
          colorName: color.name,
          sizes: item.sizes,
          locations: item.printLocationDetails.map((d) => ({
            location: d.location,
            artworkId: d.artworkId,
          })),
        })
      }
    })
    return grouped
  }, [lineItems, garmentCatalog, colors])

  const lineItemSummary = useMemo(() => {
    const entries = Object.entries(serviceTypeBreakdown)
    if (entries.length === 0) return undefined
    return entries
      .map(
        ([type, { count, qty }]) =>
          `${count} ${SERVICE_TYPE_LABELS[type as keyof typeof SERVICE_TYPE_LABELS]}: ${qty} qty`
      )
      .join(' | ')
  }, [serviceTypeBreakdown])

  // Per-artwork usage: which service types + locations each artwork appears in
  // Pricing summary — itemized discounts + total
  const discountDetails = useMemo(() => {
    const { garmentSubtotal, decorationSubtotal } = pricingBreakdown
    const subtotal = money(garmentSubtotal).plus(decorationSubtotal).plus(dtfSubtotal)
    const contractAmount =
      customerTag === 'contract' ? toNumber(round2(subtotal.times(CONTRACT_DISCOUNT_RATE))) : 0
    const items: { label: string; amount: number }[] = []
    if (contractAmount > 0) {
      items.push({ label: 'Contract Pricing (7%)', amount: contractAmount })
    }
    discounts.forEach((d) => items.push({ label: d.label, amount: d.amount }))
    const total = toNumber(items.reduce((s, d) => s.plus(d.amount), money(0)))
    return { items, total }
  }, [pricingBreakdown, dtfSubtotal, customerTag, discounts])

  const pricingSummary =
    discountDetails.total > 0 ? `${formatCurrency(discountDetails.total)} in discounts` : undefined

  // Notes summary — indicators for which notes exist
  const notesSummary = useMemo(() => {
    const parts: string[] = []
    if (internalNotes) parts.push('Internal')
    if (customerNotes) parts.push('Customer')
    return parts.length > 0 ? parts.join(' + ') : undefined
  }, [internalNotes, customerNotes])

  function handleScrollToNotes() {
    notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setNotesOpen(true)
  }

  const hasNotes = !!(internalNotes || customerNotes)

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Sticky summary bar */}
        <div className="sticky top-0 z-20 -mx-1 rounded-lg border border-border bg-card/95 backdrop-blur-sm px-4 py-2 shadow-sm">
          {/* Top row: customer, notes, total */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={14} className="shrink-0 text-muted-foreground" />
              {selectedCustomer ? (
                <span className="text-sm font-medium text-foreground truncate">
                  {selectedCustomer.name}{' '}
                  <span className="text-muted-foreground font-normal">|</span>{' '}
                  {selectedCustomer.company}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">No customer</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Artwork icons */}
              {quoteArtworks.length > 0 && (
                <div className="flex items-center gap-1">
                  {quoteArtworks.map((art) => (
                    <Tooltip key={art.id} delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div className="flex size-6 items-center justify-center rounded border border-border bg-white/90 overflow-hidden cursor-default">
                          <Image
                            src={art.thumbnailUrl}
                            alt={art.name}
                            width={20}
                            height={20}
                            className="size-5 object-contain"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        className="w-48 p-0 overflow-hidden"
                      >
                        <div className="flex items-center justify-center bg-white p-3">
                          <Image
                            src={art.thumbnailUrl}
                            alt={art.name}
                            width={160}
                            height={160}
                            className="size-36 object-contain"
                          />
                        </div>
                        <div className="px-3 py-2 text-xs">
                          <p className="font-medium text-foreground">
                            {art.name} <span className="text-muted-foreground font-normal">|</span>{' '}
                            {art.colorCount} color{art.colorCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleScrollToNotes}
                    aria-label="Scroll to notes"
                    className={cn(
                      'flex items-center justify-center rounded-md size-7 transition-colors',
                      hasNotes
                        ? 'bg-action/10 text-action hover:bg-action/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <StickyNote size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="max-w-xs">
                  {hasNotes ? (
                    <div className="space-y-1.5 text-xs">
                      {internalNotes && (
                        <div>
                          <p className="font-medium text-foreground">Internal</p>
                          <p className="text-muted-foreground line-clamp-3">{internalNotes}</p>
                        </div>
                      )}
                      {customerNotes && (
                        <div>
                          <p className="font-medium text-foreground">Customer</p>
                          <p className="text-muted-foreground line-clamp-3">{customerNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No notes — click to add</p>
                  )}
                </TooltipContent>
              </Tooltip>
              {discountDetails.total > 0 && (
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success cursor-default">
                      <Tag size={12} />−{formatCurrency(discountDetails.total)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end" className="min-w-48">
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-foreground">Discounts Applied</p>
                      {discountDetails.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">
                            −{formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      {discountDetails.items.length > 1 && (
                        <>
                          <div className="border-t border-border my-1" />
                          <div className="flex items-center justify-between gap-4 font-medium">
                            <span className="text-foreground">Total</span>
                            <span className="text-success">
                              −{formatCurrency(discountDetails.total)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">Total</p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Service type summary row */}
          {Object.keys(serviceTypeBreakdown).length > 0 && (
            <div className="mt-1.5 border-t border-border pt-1.5">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
                {Object.entries(serviceTypeBreakdown).map(
                  ([type, { qty, garments }], typeIndex) => (
                    <Fragment key={type}>
                      {typeIndex > 0 && <span className="text-border mx-1">|</span>}
                      {/* Color swatches for this service type */}
                      {garments.map((g, gi) => {
                        const sizeEntries = Object.entries(g.sizes).filter(([, q]) => q > 0)
                        return (
                          <Tooltip key={gi} delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-block size-3.5 rounded-sm border border-border cursor-default"
                                style={{ backgroundColor: g.colorHex }}
                                aria-label={g.colorName}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              align="start"
                              className="w-72 p-0 overflow-hidden"
                            >
                              <div className="space-y-1.5 px-3 py-2 text-xs">
                                <p className="font-medium text-foreground">{g.garmentName}</p>
                                <p className="text-muted-foreground">{g.colorName}</p>
                                {sizeEntries.length > 0 && (
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-muted-foreground">
                                    {sizeEntries.map(([size, sQty]) => (
                                      <span key={size}>
                                        {size}:{' '}
                                        <span className="font-medium text-foreground">{sQty}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {g.locations.length > 0 && (
                                  <div className="border-t border-border pt-1.5 mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
                                    {g.locations.map((loc) => {
                                      const art = loc.artworkId
                                        ? quoteArtworks.find((a) => a.id === loc.artworkId)
                                        : undefined
                                      return (
                                        <Fragment key={loc.location}>
                                          <span className="text-foreground whitespace-nowrap">
                                            {loc.location}
                                          </span>
                                          <span className="text-muted-foreground truncate min-w-0">
                                            {art ? (
                                              <span className="inline-flex items-center gap-1 min-w-0">
                                                <Image
                                                  src={art.thumbnailUrl}
                                                  alt=""
                                                  width={14}
                                                  height={14}
                                                  className="size-3.5 shrink-0 rounded-sm object-contain bg-white/90"
                                                />
                                                <span className="truncate">{art.name}</span>
                                              </span>
                                            ) : (
                                              <span className="italic">No artwork</span>
                                            )}
                                          </span>
                                        </Fragment>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                      <span className="ml-0.5">
                        <span className="font-medium text-foreground">{qty}</span>{' '}
                        {SERVICE_TYPE_LABELS[type as keyof typeof SERVICE_TYPE_LABELS]}
                      </span>
                    </Fragment>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 1: Customer */}
        <CollapsibleSection
          title="Customer"
          icon={<User size={16} className="text-muted-foreground" />}
          summary={customerSummary}
          isComplete={!!customerId}
          defaultOpen={!customerId}
        >
          <div className="space-y-2 pt-2">
            <CustomerCombobox
              customers={customerOptions}
              selectedCustomerId={customerId || undefined}
              onSelect={handleCustomerSelect}
              onAddNew={() => setShowAddCustomer(true)}
            />
            {errors.customerId && (
              <p className="text-xs text-error" role="alert">
                {errors.customerId}
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* Screen reuse banner */}
        {customerId &&
          customerScreens.length > 0 &&
          lineItems.some((li) => li.serviceType === 'screen-print') && (
            <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3">
              <Monitor className="size-4 shrink-0 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {customerScreens.length} reusable screen{customerScreens.length !== 1 ? 's' : ''}{' '}
                  on file
                </p>
                <p className="text-xs text-muted-foreground">
                  From previous completed jobs — setup fee can be waived
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={screenReuse}
                  onCheckedChange={setScreenReuse}
                  aria-label="Reuse screens"
                />
                <span className="text-xs text-muted-foreground">Reuse</span>
              </label>
            </div>
          )}

        {/* Section 2: Artwork */}
        <CollapsibleSection
          title="Artwork"
          icon={<ImageIcon size={16} className="text-muted-foreground" />}
          summary={artworkSummary}
          isComplete={artworkIds.length > 0}
          defaultOpen={!!customerId && artworkIds.length === 0}
        >
          <div className="pt-2">
            {!customerId ? (
              <p className="text-sm text-muted-foreground">
                Select a customer first to access their artwork library.
              </p>
            ) : (
              <ArtworkLibrary
                artworks={customerArtworks}
                customerTag={customerTag}
                selectedArtworkIds={artworkIds}
                onToggleSelect={handleToggleArtwork}
                onUploadNew={() => setShowUploadArtwork(true)}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Service Type Tab Bar (P2.3) */}
        <ServiceTypeTabBar
          activeTab={activeServiceTab}
          enabledTypes={enabledServiceTypes}
          onTabSwitch={handleTabSwitch}
          onAddType={handleAddServiceType}
          tabValidation={tabValidation}
        />

        {/* Screen Print Tab Content */}
        {activeServiceTab === 'screen-print' && (
          <div id="tabpanel-screen-print" role="tabpanel">
            <CollapsibleSection
              title="Garments & Print Details"
              icon={<ShoppingBag size={16} className="text-muted-foreground" />}
              summary={lineItemSummary}
              isComplete={lineItems.some((li) => li.garmentId !== '')}
              defaultOpen
            >
              <div className="space-y-4 pt-2">
                {errors.lineItems && (
                  <p className="text-xs text-error" role="alert">
                    {errors.lineItems}
                  </p>
                )}
                {lineItems.map((item, i) => (
                  <LineItemRow
                    key={item.id}
                    index={i}
                    data={item}
                    onChange={handleLineItemChange}
                    onRemove={handleLineItemRemove}
                    canRemove={lineItems.length > 1}
                    garmentCatalog={garmentCatalog}
                    colors={colors}
                    quoteArtworks={quoteArtworks}
                    errors={lineItemErrors[i]}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLineItem}
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Add Another Line Item
                </Button>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* DTF Tab Content (P2.4) — Wave 2: DTF line items + size presets */}
        {activeServiceTab === 'dtf' && (
          <div id="tabpanel-dtf" role="tabpanel">
            {errors.dtfTab && dtfLineItems.length === 0 && (
              <p className="text-xs text-error" role="alert">
                {errors.dtfTab}
              </p>
            )}
            <DtfTabContent
              lineItems={dtfLineItems}
              setLineItems={setDtfLineItems}
              sheetCalculation={sheetCalculation}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
              canvasLayout={canvasLayout}
              activeSheetIndex={activeSheetIndex}
              setActiveSheetIndex={setActiveSheetIndex}
              setSheetCalculation={setSheetCalculation}
              setCanvasLayout={setCanvasLayout}
            />
          </div>
        )}

        {/* Section 4: Pricing Summary */}
        <CollapsibleSection
          title="Pricing"
          icon={<DollarSign size={16} className="text-muted-foreground" />}
          summary={pricingSummary}
          defaultOpen
        >
          <div className="pt-2">
            <PricingSummary
              garmentSubtotal={pricingBreakdown.garmentSubtotal}
              decorationSubtotal={pricingBreakdown.decorationSubtotal}
              dtfSubtotal={dtfSubtotal}
              setupFees={pricingBreakdown.setupFees}
              discounts={discounts}
              onDiscountsChange={setDiscounts}
              shipping={shipping}
              onShippingChange={setShipping}
              customerTag={customerTag}
              screenReuse={screenReuse}
              screenReuseDiscount={pricingBreakdown.screenReuseDiscount}
            />
          </div>
        </CollapsibleSection>

        {/* Section 5: Notes */}
        <div ref={notesRef}>
          <CollapsibleSection
            title="Notes"
            icon={<StickyNote size={16} className="text-muted-foreground" />}
            summary={notesSummary}
            isComplete={!!(internalNotes || customerNotes)}
            defaultOpen={false}
            open={notesOpen}
            onOpenChange={setNotesOpen}
          >
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="internal-notes" className="text-xs text-muted-foreground">
                  Internal Notes (not visible to customer)
                </Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Add internal notes..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-notes" className="text-xs text-muted-foreground">
                  Customer Notes (visible on quote)
                </Label>
                <Textarea
                  id="customer-notes"
                  placeholder="Add notes for the customer..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Section 6: Actions */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <div className="flex items-center justify-between md:pt-6 md:border-t md:border-border">
            <Button
              variant="link"
              onClick={() => router.push('/quotes')}
              className="text-muted-foreground hover:text-foreground min-h-(--mobile-touch-target) md:min-h-0"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                className="min-h-(--mobile-touch-target) md:min-h-0"
              >
                <Save size={16} className="mr-2" />
                {isEdit ? 'Update Quote' : 'Save as Draft'}
              </Button>
              <Button
                onClick={handleReviewAndSend}
                className="min-h-(--mobile-touch-target) md:min-h-0 bg-action text-primary-foreground font-medium shadow-brutal shadow-action/30 hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Send size={16} className="mr-2" />
                Review & Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSave={handleAddNewCustomer}
        lifecycleStage="prospect"
      />

      <ArtworkUploadModal
        open={showUploadArtwork}
        onOpenChange={setShowUploadArtwork}
        customerId={customerId}
        onSave={handleUploadArtwork}
      />

      {showReview && (
        <QuoteReviewSheet
          open={showReview}
          onOpenChange={setShowReview}
          quote={buildQuoteForReview()}
          customer={selectedCustomer ?? null}
          artworks={quoteArtworks}
          garmentCatalog={garmentCatalog}
          colors={colors}
        />
      )}
    </>
  )
}
