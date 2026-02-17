import { describe, it, expect } from 'vitest'
import { artworkSchema, artworkTagEnum } from '../artwork'

describe('artworkTagEnum', () => {
  it.each(['corporate', 'event', 'seasonal', 'promotional', 'sports', 'custom'])(
    "accepts '%s'",
    (tag) => {
      expect(artworkTagEnum.parse(tag)).toBe(tag)
    }
  )

  it('rejects invalid tag', () => {
    expect(() => artworkTagEnum.parse('logo')).toThrow()
  })
})

describe('artworkSchema', () => {
  const validArtwork = {
    id: 'art-001',
    customerId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    name: 'River City Logo',
    fileName: 'river-city-logo.svg',
    thumbnailUrl: '/mock-artwork/river-city-logo.svg',
    colorCount: 3,
    tags: ['corporate'],
    createdAt: '2025-08-15T10:00:00Z',
  }

  it('accepts a valid artwork', () => {
    const result = artworkSchema.parse(validArtwork)
    expect(result.name).toBe('River City Logo')
    expect(result.colorCount).toBe(3)
  })

  it('accepts optional fields', () => {
    const result = artworkSchema.parse({
      ...validArtwork,
      lastUsedAt: '2026-01-15T14:00:00Z',
      width: 800,
      height: 600,
    })
    expect(result.lastUsedAt).toBe('2026-01-15T14:00:00Z')
    expect(result.width).toBe(800)
    expect(result.height).toBe(600)
  })

  it('rejects empty name', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, name: '' })).toThrow()
  })

  it('rejects zero colorCount', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, colorCount: 0 })).toThrow()
  })

  it('rejects negative colorCount', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, colorCount: -1 })).toThrow()
  })

  it('rejects invalid customerId', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, customerId: 'not-uuid' })).toThrow()
  })

  it('accepts multiple tags', () => {
    const result = artworkSchema.parse({
      ...validArtwork,
      tags: ['event', 'sports', 'custom'],
    })
    expect(result.tags).toHaveLength(3)
  })

  it('accepts empty tags array', () => {
    const result = artworkSchema.parse({ ...validArtwork, tags: [] })
    expect(result.tags).toEqual([])
  })

  it('rejects invalid datetime', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, createdAt: 'not-a-date' })).toThrow()
  })

  it('rejects zero width', () => {
    expect(() => artworkSchema.parse({ ...validArtwork, width: 0 })).toThrow()
  })
})
