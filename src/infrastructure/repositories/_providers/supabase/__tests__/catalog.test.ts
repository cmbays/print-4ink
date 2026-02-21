import { describe, it, expect, vi } from 'vitest'

// Mock server-only module so tests can run outside Next.js server context
vi.mock('server-only', () => ({}))

import { parseNormalizedCatalogRow } from '../catalog'

describe('parseNormalizedCatalogRow', () => {
  it('maps db row to NormalizedGarmentCatalog', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      external_id: '3001',
      brand_canonical: 'Bella+Canvas',
      style_number: 'BC3001',
      name: 'Unisex Jersey Tee',
      description: null,
      category: 't-shirts',
      subcategory: null,
      piece_price: 4.25,
      colors: [],
      sizes: [],
      is_enabled: null,
      is_favorite: null,
    }
    const result = parseNormalizedCatalogRow(row)
    expect(result.brand).toBe('Bella+Canvas')
    expect(result.category).toBe('t-shirts')
    expect(result.isEnabled).toBe(true) // NULL → default true
    expect(result.isFavorite).toBe(false) // NULL → default false
  })
})
