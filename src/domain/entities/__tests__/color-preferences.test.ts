import { describe, it, expect } from 'vitest'
import {
  inheritanceModeSchema,
  displayPreferenceSchema,
  propagationConfigSchema,
  brandPreferenceSchema,
  customerPreferenceSchema,
} from '../color-preferences'

describe('inheritanceModeSchema', () => {
  it.each(['inherit', 'customize'])("accepts '%s'", (mode) => {
    expect(inheritanceModeSchema.parse(mode)).toBe(mode)
  })

  it('rejects invalid mode', () => {
    expect(() => inheritanceModeSchema.parse('override')).toThrow()
  })
})

describe('displayPreferenceSchema', () => {
  it.each(['flat', 'grouped'])("accepts '%s'", (pref) => {
    expect(displayPreferenceSchema.parse(pref)).toBe(pref)
  })

  it('rejects invalid preference', () => {
    expect(() => displayPreferenceSchema.parse('tree')).toThrow()
  })
})

describe('propagationConfigSchema', () => {
  it('accepts valid config', () => {
    const result = propagationConfigSchema.parse({ autoPropagate: true })
    expect(result.autoPropagate).toBe(true)
  })

  it('accepts false', () => {
    const result = propagationConfigSchema.parse({ autoPropagate: false })
    expect(result.autoPropagate).toBe(false)
  })

  it('rejects missing autoPropagate', () => {
    expect(() => propagationConfigSchema.parse({})).toThrow()
  })
})

describe('brandPreferenceSchema', () => {
  const validBrandPref = {
    brandName: 'Gildan',
    inheritMode: 'customize' as const,
    favoriteColorIds: ['clr-black', 'clr-sport-grey'],
    explicitColorIds: ['clr-sport-grey'],
    removedInheritedColorIds: [],
  }

  it('accepts a valid brand preference', () => {
    const result = brandPreferenceSchema.parse(validBrandPref)
    expect(result.brandName).toBe('Gildan')
    expect(result.inheritMode).toBe('customize')
    expect(result.favoriteColorIds).toEqual(['clr-black', 'clr-sport-grey'])
  })

  it('accepts inherit mode', () => {
    const result = brandPreferenceSchema.parse({
      ...validBrandPref,
      inheritMode: 'inherit',
    })
    expect(result.inheritMode).toBe('inherit')
  })

  it('rejects empty brand name', () => {
    expect(() => brandPreferenceSchema.parse({ ...validBrandPref, brandName: '' })).toThrow()
  })

  it('rejects invalid inheritance mode', () => {
    expect(() => brandPreferenceSchema.parse({ ...validBrandPref, inheritMode: 'merge' })).toThrow()
  })

  it('accepts empty arrays', () => {
    const result = brandPreferenceSchema.parse({
      ...validBrandPref,
      favoriteColorIds: [],
      explicitColorIds: [],
      removedInheritedColorIds: [],
    })
    expect(result.favoriteColorIds).toEqual([])
    expect(result.explicitColorIds).toEqual([])
    expect(result.removedInheritedColorIds).toEqual([])
  })

  it('tracks removed inherited colors', () => {
    const result = brandPreferenceSchema.parse({
      ...validBrandPref,
      removedInheritedColorIds: ['clr-red'],
    })
    expect(result.removedInheritedColorIds).toEqual(['clr-red'])
  })
})

describe('customerPreferenceSchema', () => {
  const validCustomerPref = {
    inheritMode: 'inherit' as const,
    favoriteColorIds: [],
    favoriteBrandNames: [],
    favoriteGarmentIds: [],
  }

  it('accepts a valid customer preference', () => {
    const result = customerPreferenceSchema.parse(validCustomerPref)
    expect(result.inheritMode).toBe('inherit')
  })

  it('accepts customize mode with populated arrays', () => {
    const result = customerPreferenceSchema.parse({
      inheritMode: 'customize',
      favoriteColorIds: ['clr-royal', 'clr-white'],
      favoriteBrandNames: ['Gildan', 'Bella+Canvas'],
      favoriteGarmentIds: ['gc-001', 'gc-002'],
    })
    expect(result.favoriteColorIds).toEqual(['clr-royal', 'clr-white'])
    expect(result.favoriteBrandNames).toEqual(['Gildan', 'Bella+Canvas'])
    expect(result.favoriteGarmentIds).toEqual(['gc-001', 'gc-002'])
  })

  it('rejects missing fields', () => {
    expect(() => customerPreferenceSchema.parse({ inheritMode: 'inherit' })).toThrow()
  })

  it('allows independent axes — colors only', () => {
    const result = customerPreferenceSchema.parse({
      inheritMode: 'customize',
      favoriteColorIds: ['clr-black'],
      favoriteBrandNames: [],
      favoriteGarmentIds: [],
    })
    expect(result.favoriteColorIds).toEqual(['clr-black'])
    expect(result.favoriteBrandNames).toEqual([])
    expect(result.favoriteGarmentIds).toEqual([])
  })
})
