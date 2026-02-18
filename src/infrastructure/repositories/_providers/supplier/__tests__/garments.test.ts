import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  canonicalCategoryToGarmentCategory,
  canonicalStyleToGarmentCatalog,
  getGarmentCatalog,
  getGarmentById,
  getAvailableBrands,
} from '../garments'
import type { CanonicalStyle } from '@lib/suppliers/types'

// ─── Mock registry ────────────────────────────────────────────────────────────

vi.mock('@lib/suppliers/registry', () => ({
  getSupplierAdapter: vi.fn(),
}))

import { getSupplierAdapter } from '@lib/suppliers/registry'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeStyle(overrides: Partial<CanonicalStyle> = {}): CanonicalStyle {
  return {
    supplierId: '3001',
    styleNumber: 'BC3001',
    styleName: 'Unisex Jersey Tee',
    brand: 'Bella+Canvas',
    description: 'Super soft jersey tee',
    categories: ['T-Shirts'],
    colors: [
      { name: 'Black', hex1: '#000000', hex2: null, images: [] },
      { name: 'White', hex1: '#FFFFFF', hex2: null, images: [] },
    ],
    sizes: [
      { name: 'S', sortOrder: 0, priceAdjustment: 0 },
      { name: 'M', sortOrder: 1, priceAdjustment: 0 },
      { name: 'XL', sortOrder: 3, priceAdjustment: 2 },
    ],
    pricing: { piecePrice: 4.5, dozenPrice: 3.8, casePrice: null },
    gtin: null,
    supplier: 'ss-activewear',
    lastSynced: new Date('2026-02-19'),
    ...overrides,
  }
}

// ─── canonicalCategoryToGarmentCategory ──────────────────────────────────────

describe('canonicalCategoryToGarmentCategory', () => {
  it('maps "T-Shirts" to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory(['T-Shirts'])).toBe('t-shirts')
  })

  it('maps "Fleece" to fleece', () => {
    expect(canonicalCategoryToGarmentCategory(['Fleece'])).toBe('fleece')
  })

  it('maps "Outerwear" to outerwear', () => {
    expect(canonicalCategoryToGarmentCategory(['Outerwear'])).toBe('outerwear')
  })

  it('maps "Pants" to pants', () => {
    expect(canonicalCategoryToGarmentCategory(['Pants'])).toBe('pants')
  })

  it('maps "Headwear" to headwear', () => {
    expect(canonicalCategoryToGarmentCategory(['Headwear'])).toBe('headwear')
  })

  it('defaults unknown category to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory(['Accessories'])).toBe('t-shirts')
  })

  it('defaults empty categories array to t-shirts', () => {
    expect(canonicalCategoryToGarmentCategory([])).toBe('t-shirts')
  })

  it('uses first category only', () => {
    expect(canonicalCategoryToGarmentCategory(['Fleece', 'Outerwear'])).toBe('fleece')
  })
})

// ─── canonicalStyleToGarmentCatalog ──────────────────────────────────────────

describe('canonicalStyleToGarmentCatalog', () => {
  it('maps all fields from a full CanonicalStyle', () => {
    const style = makeStyle()
    const result = canonicalStyleToGarmentCatalog(style)

    expect(result.id).toBe('3001')
    expect(result.brand).toBe('Bella+Canvas')
    expect(result.sku).toBe('BC3001')
    expect(result.name).toBe('Unisex Jersey Tee')
    expect(result.baseCategory).toBe('t-shirts')
    expect(result.basePrice).toBe(4.5)
    expect(result.availableColors).toEqual(['Black', 'White'])
    expect(result.availableSizes).toEqual([
      { name: 'S', order: 0, priceAdjustment: 0 },
      { name: 'M', order: 1, priceAdjustment: 0 },
      { name: 'XL', order: 3, priceAdjustment: 2 },
    ])
    expect(result.isEnabled).toBe(true)
    expect(result.isFavorite).toBe(false)
  })

  it('maps piecePrice null to basePrice 0', () => {
    const style = makeStyle({ pricing: { piecePrice: null, dozenPrice: null, casePrice: null } })
    expect(canonicalStyleToGarmentCatalog(style).basePrice).toBe(0)
  })

  it('handles empty colors array', () => {
    const style = makeStyle({ colors: [] })
    expect(canonicalStyleToGarmentCatalog(style).availableColors).toEqual([])
  })

  it('handles empty sizes array (browse-mode style with no detail)', () => {
    const style = makeStyle({ sizes: [] })
    expect(canonicalStyleToGarmentCatalog(style).availableSizes).toEqual([])
  })

  it('always sets isEnabled to true', () => {
    expect(canonicalStyleToGarmentCatalog(makeStyle()).isEnabled).toBe(true)
  })

  it('always sets isFavorite to false', () => {
    expect(canonicalStyleToGarmentCatalog(makeStyle()).isFavorite).toBe(false)
  })
})

// ─── getGarmentCatalog ────────────────────────────────────────────────────────

describe('getGarmentCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls searchCatalog and maps results', async () => {
    const style = makeStyle()
    const mockAdapter = {
      searchCatalog: vi.fn().mockResolvedValue({ styles: [style], total: 1, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentCatalog()

    expect(mockAdapter.searchCatalog).toHaveBeenCalledWith({ limit: 100, offset: 0 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3001')
  })

  it('returns empty array when adapter returns no styles', async () => {
    const mockAdapter = {
      searchCatalog: vi.fn().mockResolvedValue({ styles: [], total: 0, hasMore: false }),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentCatalog()
    expect(result).toEqual([])
  })
})

// ─── getGarmentById ───────────────────────────────────────────────────────────

describe('getGarmentById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped GarmentCatalog when adapter finds the style', async () => {
    const style = makeStyle()
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(style),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentById('3001')

    expect(mockAdapter.getStyle).toHaveBeenCalledWith('3001')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('3001')
  })

  it('returns null when adapter returns null', async () => {
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(null),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null for empty id', async () => {
    const mockAdapter = {
      getStyle: vi.fn(),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentById('')
    expect(mockAdapter.getStyle).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('accepts non-UUID supplier style IDs', async () => {
    const style = makeStyle({ supplierId: '42' })
    const mockAdapter = {
      getStyle: vi.fn().mockResolvedValue(style),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getGarmentById('42')
    expect(result?.id).toBe('42')
  })
})

// ─── getAvailableBrands ───────────────────────────────────────────────────────

describe('getAvailableBrands', () => {
  it('delegates to adapter.getBrands', async () => {
    const mockAdapter = {
      getBrands: vi.fn().mockResolvedValue(['Bella+Canvas', 'Gildan', 'Next Level']),
    }
    vi.mocked(getSupplierAdapter).mockReturnValue(mockAdapter as never)

    const result = await getAvailableBrands()
    expect(mockAdapter.getBrands).toHaveBeenCalledOnce()
    expect(result).toEqual(['Bella+Canvas', 'Gildan', 'Next Level'])
  })
})
