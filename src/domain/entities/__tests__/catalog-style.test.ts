import { describe, it, expect } from 'vitest'
import {
  catalogColorSchema,
  catalogImageSchema,
  normalizedGarmentCatalogSchema,
} from '../catalog-style'

describe('catalogColorSchema', () => {
  it('accepts a color with images', () => {
    const result = catalogColorSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      styleId: '00000000-0000-4000-8000-000000000002',
      name: 'Athletic Heather',
      hex1: '#9e9e9e',
      hex2: null,
      images: [{ imageType: 'front', url: 'https://www.ssactivewear.com/images/img.jpg' }],
    })
    expect(result.success).toBe(true)
  })
})

describe('normalizedGarmentCatalogSchema', () => {
  it('accepts a full normalized style', () => {
    const result = normalizedGarmentCatalogSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000001',
      source: 'ss-activewear',
      externalId: '3001',
      brand: 'Bella+Canvas',
      styleNumber: 'BC3001',
      name: 'Unisex Jersey Short Sleeve Tee',
      description: '',
      category: 't-shirts',
      subcategory: null,
      piecePrice: 4.25,
      colors: [],
      sizes: [],
      isEnabled: true,
      isFavorite: false,
    })
    expect(result.success).toBe(true)
  })
})
