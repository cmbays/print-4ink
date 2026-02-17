import { describe, it, expect } from 'vitest'
import { customerScreenSchema } from '../customer-screen'

describe('customerScreenSchema', () => {
  const valid = {
    id: 'cs-001',
    customerId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    jobId: 'f1a00001-e5f6-4a01-8b01-0d1e2f3a4b01',
    artworkName: 'River City Logo',
    colorIds: ['clr-black', 'clr-white'],
    meshCount: 160,
    createdAt: '2026-01-15T10:00:00Z',
  }

  it('accepts a valid customer screen record', () => {
    expect(customerScreenSchema.parse(valid)).toEqual(valid)
  })

  it('rejects zero mesh count', () => {
    expect(() => customerScreenSchema.parse({ ...valid, meshCount: 0 })).toThrow()
  })

  it('rejects negative mesh count', () => {
    expect(() => customerScreenSchema.parse({ ...valid, meshCount: -5 })).toThrow()
  })

  it('accepts empty colorIds', () => {
    const result = customerScreenSchema.parse({ ...valid, colorIds: [] })
    expect(result.colorIds).toEqual([])
  })

  it('rejects empty artworkName', () => {
    expect(() => customerScreenSchema.parse({ ...valid, artworkName: '' })).toThrow()
  })
})
