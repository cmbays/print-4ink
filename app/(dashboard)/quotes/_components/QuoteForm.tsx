"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Save, Send, StickyNote, ImageIcon, User, ShoppingBag, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerCombobox } from "@/components/features/CustomerCombobox";
import { AddCustomerModal } from "@/components/features/AddCustomerModal";
import { LineItemRow } from "./LineItemRow";
import { PricingSummary } from "./PricingSummary";
import { CollapsibleSection } from "./CollapsibleSection";
import { ArtworkLibrary } from "./ArtworkLibrary";
import { ArtworkUploadModal } from "./ArtworkUploadModal";
import { QuoteReviewSheet } from "./QuoteReviewSheet";
import {
  customers as mockCustomers,
  colors as mockColors,
  garmentCatalog,
  artworks as mockArtworks,
} from "@/lib/mock-data";
import { CUSTOMER_TAG_LABELS } from "@/lib/constants";
import { type LineItemData, calculateGarmentCost, calculateDecorationCost, calculateLineItemSetupFee, calculateQuoteSetupFee } from "./LineItemRow";
import type { Discount } from "@/lib/schemas/quote";
import type { Artwork, ArtworkTag } from "@/lib/schemas/artwork";
import type { CustomerTag } from "@/lib/schemas/customer";
import { cn } from "@/lib/utils";

interface QuoteFormProps {
  mode: "create" | "edit";
  initialData?: {
    customerId?: string;
    lineItems?: LineItemData[];
    discounts?: Discount[];
    shipping?: number;
    artworkIds?: string[];
    internalNotes?: string;
    customerNotes?: string;
  };
  quoteId?: string;
}

let lineItemCounter = 0;
function createEmptyLineItem(): LineItemData {
  lineItemCounter += 1;
  return {
    id: `li-${Date.now()}-${lineItemCounter}`,
    garmentId: "",
    colorId: "",
    sizes: {},
    serviceType: "screen-print",
    printLocationDetails: [],
  };
}

const TAX_RATE = 0.1;
const CONTRACT_DISCOUNT_RATE = 0.07;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function QuoteForm({ mode, initialData, quoteId }: QuoteFormProps) {
  const router = useRouter();

  // Customer state
  const [customers, setCustomers] = useState(
    mockCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      tag: c.tag,
    }))
  );
  const [customerId, setCustomerId] = useState(
    initialData?.customerId || ""
  );
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    initialData?.lineItems || [createEmptyLineItem()]
  );

  // Pricing — setup fees and tax are computed, not stateful
  const [discounts, setDiscounts] = useState<Discount[]>(
    // Filter out contract discounts from initialData — those are auto-computed now
    (initialData?.discounts || []).filter((d) => d.type !== "contract")
  );
  const [shipping, setShipping] = useState(initialData?.shipping || 0);

  // Artwork
  const [artworkIds, setArtworkIds] = useState<string[]>(
    initialData?.artworkIds || []
  );
  const [showUploadArtwork, setShowUploadArtwork] = useState(false);
  const [localArtworks, setLocalArtworks] = useState<Artwork[]>([]);

  // Notes
  const [internalNotes, setInternalNotes] = useState(
    initialData?.internalNotes || ""
  );
  const [customerNotes, setCustomerNotes] = useState(
    initialData?.customerNotes || ""
  );

  // Review sheet
  const [showReview, setShowReview] = useState(false);

  // Ref for scrolling to notes section
  const notesRef = useRef<HTMLDivElement>(null);
  // Track if notes section is open (for the sticky bar button)
  const [notesOpen, setNotesOpen] = useState(
    !!(initialData?.internalNotes || initialData?.customerNotes)
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineItemErrors, setLineItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Derived values
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerTag: CustomerTag | undefined = selectedCustomer?.tag;

  // Get artworks for selected customer
  const customerArtworks = useMemo(() => {
    if (!customerId) return [];
    return [...mockArtworks.filter((a) => a.customerId === customerId), ...localArtworks];
  }, [customerId, localArtworks]);

  // Artworks selected for this quote — includes both quote-level selections
  // AND any artwork assigned to print locations in line items
  const quoteArtworks = useMemo(() => {
    const allReferencedIds = new Set(artworkIds);
    lineItems.forEach((item) => {
      item.printLocationDetails.forEach((d) => {
        if (d.artworkId) allReferencedIds.add(d.artworkId);
      });
    });
    return customerArtworks.filter((a) => allReferencedIds.has(a.id));
  }, [customerArtworks, artworkIds, lineItems]);

  // Compute cost breakdowns for PricingSummary
  const pricingBreakdown = useMemo(() => {
    let garmentSubtotal = 0;
    let decorationSubtotal = 0;
    let lineItemSetupFees = 0;

    lineItems.forEach((item) => {
      const garment = garmentCatalog.find((g) => g.id === item.garmentId);
      const totalQty = Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0);
      garmentSubtotal += calculateGarmentCost(garment, totalQty);
      decorationSubtotal += calculateDecorationCost(item.serviceType, item.printLocationDetails, totalQty);
      lineItemSetupFees += calculateLineItemSetupFee(item.serviceType);
    });

    const quoteSetupFee = calculateQuoteSetupFee(lineItems);
    const setupFees = lineItemSetupFees + quoteSetupFee;

    return { garmentSubtotal, decorationSubtotal, setupFees };
  }, [lineItems]);

  // Grand total for sticky bar
  const grandTotal = useMemo(() => {
    const { garmentSubtotal, decorationSubtotal, setupFees } = pricingBreakdown;
    const subtotal = garmentSubtotal + decorationSubtotal;
    const contractDiscount = customerTag === "contract"
      ? Math.round(subtotal * CONTRACT_DISCOUNT_RATE * 100) / 100
      : 0;
    const manualDiscountTotal = discounts.reduce((s, d) => s + d.amount, 0);
    const totalDiscountAmount = contractDiscount + manualDiscountTotal;
    const preTaxTotal = subtotal + setupFees - totalDiscountAmount + shipping;
    const tax = Math.round(preTaxTotal * TAX_RATE * 100) / 100;
    return preTaxTotal + tax;
  }, [pricingBreakdown, customerTag, discounts, shipping]);

  // Handlers
  const handleLineItemChange = useCallback(
    (index: number, data: LineItemData) => {
      setLineItems((prev) => {
        const next = [...prev];
        next[index] = data;
        return next;
      });
      setLineItemErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    },
    []
  );

  const handleLineItemRemove = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setLineItemErrors((prev) => {
      const next: Record<number, Record<string, string>> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = parseInt(key, 10);
        if (k < index) next[k] = val;
        else if (k > index) next[k - 1] = val;
      });
      return next;
    });
  }, []);

  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const handleCustomerSelect = useCallback(
    (id: string) => {
      setCustomerId(id);
      // Reset artwork selection when customer changes
      setArtworkIds([]);
      setLocalArtworks([]);

      // Free shipping for contract customers
      const customer = customers.find((c) => c.id === id);
      if (customer?.tag === "contract") {
        setShipping(0);
      }

      if (errors.customerId) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.customerId;
          return next;
        });
      }
    },
    [customers, errors.customerId]
  );

  const handleAddNewCustomer = useCallback(
    (data: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
      tag?: CustomerTag;
    }) => {
      const newCustomer = {
        id: `new-${Date.now()}`,
        name: data.name,
        email: data.email,
        company: data.company || "",
        phone: data.phone || "",
        tag: (data.tag || "new") as CustomerTag,
      };
      setCustomers((prev) => [...prev, newCustomer]);
      handleCustomerSelect(newCustomer.id);
    },
    [handleCustomerSelect]
  );

  const handleToggleArtwork = useCallback((artworkId: string) => {
    setArtworkIds((prev) => {
      const isDeselecting = prev.includes(artworkId);
      if (isDeselecting) {
        // Also clear this artwork from any print location assignments
        setLineItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            printLocationDetails: item.printLocationDetails.map((d) =>
              d.artworkId === artworkId ? { ...d, artworkId: undefined } : d
            ),
          }))
        );
        return prev.filter((id) => id !== artworkId);
      }
      return [...prev, artworkId];
    });
  }, []);

  const handleUploadArtwork = useCallback(
    (data: {
      name: string;
      colorCount: number;
      tags: ArtworkTag[];
      saveToLibrary: boolean;
    }) => {
      const newArtwork: Artwork = {
        id: `art-new-${Date.now()}`,
        customerId: customerId || "unknown",
        name: data.name,
        fileName: `${data.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
        thumbnailUrl: "/mock-artwork/river-city-logo-full.svg",
        colorCount: data.colorCount,
        tags: data.tags,
        createdAt: new Date().toISOString(),
      };
      setLocalArtworks((prev) => [...prev, newArtwork]);
      setArtworkIds((prev) => [...prev, newArtwork.id]);
    },
    [customerId]
  );

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};
    const nextLineErrors: Record<number, Record<string, string>> = {};

    if (!customerId) {
      nextErrors.customerId = "Customer is required";
    }

    if (lineItems.length === 0) {
      nextErrors.lineItems = "At least one line item is required";
    }

    lineItems.forEach((item, i) => {
      const itemErrors: Record<string, string> = {};
      if (!item.garmentId) {
        itemErrors.garmentId = "Garment is required";
      }
      const totalQty = Object.values(item.sizes).reduce(
        (sum, qty) => sum + qty,
        0
      );
      if (totalQty === 0) {
        itemErrors.sizes = "At least one size with qty > 0 is required";
      }
      if (Object.keys(itemErrors).length > 0) {
        nextLineErrors[i] = itemErrors;
      }
    });

    setErrors(nextErrors);
    setLineItemErrors(nextLineErrors);

    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextLineErrors).length === 0
    );
  }

  const isEdit = mode === "edit";

  // Build a Quote object for the review sheet
  function buildQuoteForReview() {
    const { garmentSubtotal, decorationSubtotal, setupFees } = pricingBreakdown;
    const subtotal = garmentSubtotal + decorationSubtotal;

    // Compute contract discount
    const contractDiscount = customerTag === "contract"
      ? Math.round(subtotal * CONTRACT_DISCOUNT_RATE * 100) / 100
      : 0;
    const manualDiscountTotal = discounts.reduce((s, d) => s + d.amount, 0);
    const totalDiscountAmount = contractDiscount + manualDiscountTotal;

    const preTaxTotal = subtotal + setupFees - totalDiscountAmount + shipping;
    const tax = Math.round(preTaxTotal * TAX_RATE * 100) / 100;
    const total = preTaxTotal + tax;

    // Build discount array for review
    const allDiscounts: Discount[] = [
      ...(customerTag === "contract"
        ? [{ label: "Contract Pricing (7%)", amount: contractDiscount, type: "contract" as const }]
        : []),
      ...discounts,
    ];

    return {
      id: quoteId || "new-preview",
      quoteNumber: quoteId ? `Q-${quoteId.slice(0, 4)}` : "Q-NEW",
      customerId: customerId,
      lineItems: lineItems.map((item) => {
        const garment = garmentCatalog.find((g) => g.id === item.garmentId);
        const totalQty = Object.values(item.sizes).reduce(
          (sum, qty) => sum + qty,
          0
        );
        const garmentCost = calculateGarmentCost(garment, totalQty);
        const decoationCost = calculateDecorationCost(item.serviceType, item.printLocationDetails, totalQty);
        const lineTotal = garmentCost + decoationCost;
        const unitPrice = totalQty > 0 ? lineTotal / totalQty : 0;
        return {
          garmentId: item.garmentId,
          colorId: item.colorId,
          sizes: item.sizes,
          serviceType: item.serviceType,
          printLocationDetails: item.printLocationDetails,
          unitPrice,
          lineTotal,
        };
      }),
      setupFees,
      subtotal,
      total,
      discounts: allDiscounts,
      shipping,
      tax,
      artworkIds: quoteArtworks.map((a) => a.id),
      status: "draft" as const,
      internalNotes: internalNotes || undefined,
      customerNotes: customerNotes || undefined,
      createdAt: new Date().toISOString(),
    };
  }

  function handleSave(sendToCustomer: boolean) {
    if (!validate()) return;

    if (sendToCustomer) {
      toast.success("Quote sent to customer", {
        description: "The customer will receive an email with the quote.",
      });
    } else {
      toast.success(
        isEdit ? "Quote updated" : "Quote saved as draft",
        {
          description: isEdit
            ? `Quote ${quoteId ?? ""} has been updated.`
            : "You can continue editing this quote later.",
        }
      );
    }

    router.push("/quotes");
  }

  function handleReviewAndSend() {
    if (!validate()) return;
    setShowReview(true);
  }

  // Summaries for collapsed sections
  const customerSummary = selectedCustomer
    ? `${selectedCustomer.name} — ${selectedCustomer.company}${customerTag ? ` (${CUSTOMER_TAG_LABELS[customerTag]})` : ""}`
    : undefined;

  const artworkSummary =
    artworkIds.length > 0
      ? `${artworkIds.length} artwork${artworkIds.length !== 1 ? "s" : ""}`
      : undefined;

  const lineItemSummary =
    lineItems.length > 0 && lineItems[0].garmentId
      ? `${lineItems.length} item${lineItems.length !== 1 ? "s" : ""}`
      : undefined;

  function handleScrollToNotes() {
    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setNotesOpen(true);
  }

  const hasNotes = !!(internalNotes || customerNotes);

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Sticky summary bar */}
        <div className="sticky top-0 z-20 -mx-1 rounded-lg border border-border bg-card/95 backdrop-blur-sm px-4 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Left: customer + artwork thumbnails */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Customer */}
              <div className="flex items-center gap-1.5 min-w-0">
                <User size={14} className="shrink-0 text-muted-foreground" />
                {selectedCustomer ? (
                  <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {selectedCustomer.name}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No customer</span>
                )}
              </div>

              {/* Artwork thumbnails */}
              {quoteArtworks.length > 0 && (
                <>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-1">
                    {quoteArtworks.slice(0, 4).map((art) => (
                      <div
                        key={art.id}
                        className="flex size-6 items-center justify-center rounded border border-border bg-white/90 overflow-hidden"
                        title={art.name}
                      >
                        <Image
                          src={art.thumbnailUrl}
                          alt={art.name}
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                        />
                      </div>
                    ))}
                    {quoteArtworks.length > 4 && (
                      <span className="text-xs text-muted-foreground ml-0.5">
                        +{quoteArtworks.length - 4}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: notes button + total */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleScrollToNotes}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                  hasNotes
                    ? "bg-action/10 text-action hover:bg-action/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <StickyNote size={12} />
                Notes{hasNotes && " ●"}
              </button>
              <div className="text-right">
                <p className="text-xs text-muted-foreground leading-none">Total</p>
                <p className="text-sm font-bold text-foreground leading-tight">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
          </div>
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
              customers={customers}
              selectedCustomerId={customerId || undefined}
              onSelect={handleCustomerSelect}
              onAddNew={() => setShowAddCustomer(true)}
            />
            {errors.customerId && (
              <p className="text-xs text-error">{errors.customerId}</p>
            )}
          </div>
        </CollapsibleSection>

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

        {/* Section 3: Line Items */}
        <CollapsibleSection
          title="Garments & Print Details"
          icon={<ShoppingBag size={16} className="text-muted-foreground" />}
          summary={lineItemSummary}
          isComplete={lineItems.some((li) => li.garmentId !== "")}
          defaultOpen
        >
          <div className="space-y-4 pt-2">
            {errors.lineItems && (
              <p className="text-xs text-error">{errors.lineItems}</p>
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
                colors={mockColors}
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

        {/* Section 4: Pricing Summary */}
        <CollapsibleSection
          title="Pricing"
          icon={<DollarSign size={16} className="text-muted-foreground" />}
          defaultOpen
        >
          <div className="pt-2">
            <PricingSummary
              garmentSubtotal={pricingBreakdown.garmentSubtotal}
              decorationSubtotal={pricingBreakdown.decorationSubtotal}
              setupFees={pricingBreakdown.setupFees}
              discounts={discounts}
              onDiscountsChange={setDiscounts}
              shipping={shipping}
              onShippingChange={setShipping}
              customerTag={customerTag}
            />
          </div>
        </CollapsibleSection>

        {/* Section 5: Notes */}
        <div ref={notesRef}>
        <CollapsibleSection
          title="Notes"
          icon={<StickyNote size={16} className="text-muted-foreground" />}
          isComplete={!!(internalNotes || customerNotes)}
          defaultOpen={false}
          open={notesOpen}
          onOpenChange={setNotesOpen}
        >
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="internal-notes"
                className="text-xs text-muted-foreground"
              >
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
              <Label
                htmlFor="customer-notes"
                className="text-xs text-muted-foreground"
              >
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
        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="link"
            onClick={() => router.push("/quotes")}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
            >
              <Save size={16} className="mr-2" />
              {isEdit ? "Update Quote" : "Save as Draft"}
            </Button>
            <Button
              onClick={handleReviewAndSend}
              className="bg-action text-primary-foreground font-medium shadow-[4px_4px_0px] shadow-action/30 hover:shadow-[2px_2px_0px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Send size={16} className="mr-2" />
              Review & Send
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onSave={handleAddNewCustomer}
      />

      <ArtworkUploadModal
        open={showUploadArtwork}
        onOpenChange={setShowUploadArtwork}
        customerId={customerId}
        onSave={handleUploadArtwork}
      />

      {showReview && <QuoteReviewSheet
        open={showReview}
        onOpenChange={setShowReview}
        quote={buildQuoteForReview()}
        customer={selectedCustomer ? {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          company: selectedCustomer.company,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone || "",
          address: "",
          tag: selectedCustomer.tag || "new",
        } : null}
        artworks={quoteArtworks}
      />}
    </>
  );
}
