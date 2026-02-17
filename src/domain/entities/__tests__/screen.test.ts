import { describe, it, expect } from 'vitest'
import { screenSchema, burnStatusEnum } from '../screen'

describe('burnStatusEnum', () => {
  it.each(['pending', 'burned', 'reclaimed'])("accepts '%s'", (status) => {
    expect(burnStatusEnum.parse(status)).toBe(status)
  })

  it('rejects invalid burn status', () => {
    expect(() => burnStatusEnum.parse('ready')).toThrow()
  })
})

describe('screenSchema', () => {
  const validScreen = {
    id: '51a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    meshCount: 160,
    emulsionType: 'Dual Cure',
    burnStatus: 'burned',
    jobId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  }

  it('accepts a valid screen', () => {
    expect(screenSchema.parse(validScreen)).toEqual(validScreen)
  })

  it('rejects zero mesh count', () => {
    expect(() => screenSchema.parse({ ...validScreen, meshCount: 0 })).toThrow()
  })

  it('rejects negative mesh count', () => {
    expect(() => screenSchema.parse({ ...validScreen, meshCount: -110 })).toThrow()
  })

  it('rejects fractional mesh count', () => {
    expect(() => screenSchema.parse({ ...validScreen, meshCount: 160.5 })).toThrow()
  })

  it('rejects empty emulsion type', () => {
    expect(() => screenSchema.parse({ ...validScreen, emulsionType: '' })).toThrow()
  })

  it('rejects invalid UUID for jobId', () => {
    expect(() => screenSchema.parse({ ...validScreen, jobId: 'not-uuid' })).toThrow()
  })
})
