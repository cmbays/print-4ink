import { describe, it, expect, vi } from 'vitest'

// server-only guard must be mocked before importing any server-only module
vi.mock('server-only', () => ({}))

// canonicalCategoryToGarmentCategory is a pure function — inline the real
// implementation so tests don't depend on the full supplier adapter chain.
vi.mock('@infra/repositories/_providers/supplier/garments', () => ({
  canonicalCategoryToGarmentCategory: (categories: string[]) => {
    const CATEGORY_MAPPING: Record<string, string> = {
      'bags-&-accessories': 'accessories',
      'bags-accessories': 'accessories',
      bags: 'accessories',
      'woven-shirts': 'wovens',
      'knits-&-layering': 'knits-layering',
    }
    const valid = new Set([
      't-shirts',
      'polos',
      'fleece',
      'knits-layering',
      'outerwear',
      'pants',
      'shorts',
      'headwear',
      'activewear',
      'accessories',
      'wovens',
      'other',
    ])
    const raw = (categories[0] ?? '').toLowerCase().replace(/\s+/g, '-')
    if (CATEGORY_MAPPING[raw]) return CATEGORY_MAPPING[raw]
    return valid.has(raw) ? raw : 'other'
  },
}))

import {
  extractSubcategory,
  extractBaseCategory,
  buildBrandUpsertValue,
  buildStyleUpsertValue,
} from '../catalog-sync-normalized'

describe('extractSubcategory', () => {
  it('extracts subcategory after " - " delimiter', () => {
    expect(extractSubcategory('T-Shirts - Premium')).toBe('Premium')
  })
  it('returns null when no delimiter', () => {
    expect(extractSubcategory('T-Shirts')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(extractSubcategory('')).toBeNull()
  })
})

describe('extractBaseCategory', () => {
  it('returns the string before " - "', () => {
    expect(extractBaseCategory('Fleece - Quarter Zip')).toBe('Fleece')
  })
  it('returns full string when no delimiter', () => {
    expect(extractBaseCategory('Headwear')).toBe('Headwear')
  })
})

describe('buildBrandUpsertValue', () => {
  it('creates a brand upsert value', () => {
    const val = buildBrandUpsertValue('Bella+Canvas')
    expect(val.canonicalName).toBe('Bella+Canvas')
    expect(val.isActive).toBe(true)
  })
})

describe('buildStyleUpsertValue', () => {
  it('creates a style upsert value from a CanonicalStyle', () => {
    const style = {
      supplierId: '3001',
      styleNumber: 'BC3001',
      styleName: 'Unisex Jersey Tee',
      brand: 'Bella+Canvas',
      description: '',
      categories: ['T-Shirts - Premium'],
      colors: [],
      sizes: [],
      pricing: { piecePrice: 4.25, dozenPrice: null, casePrice: null },
      gtin: null,
      supplier: 'ss-activewear' as const,
    }
    const brandId = '00000000-0000-4000-8000-000000000001'
    const val = buildStyleUpsertValue(style, brandId, 'ss-activewear')
    expect(val.externalId).toBe('3001')
    expect(val.source).toBe('ss-activewear')
    expect(val.brandId).toBe(brandId)
    expect(val.category).toBe('t-shirts')
    expect(val.subcategory).toBe('Premium')
    expect(val.piecePrice).toBe(4.25)
  })
})
