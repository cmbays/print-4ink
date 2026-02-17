import { describe, it, expect } from 'vitest'
import { validateUUID } from '@infra/repositories/_shared/validation'

describe('validateUUID()', () => {
  it('returns the UUID for a valid v4 UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(validateUUID(uuid)).toBe(uuid)
  })

  it('returns the UUID for another valid UUID', () => {
    const uuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    expect(validateUUID(uuid)).toBe(uuid)
  })

  it('returns null for an empty string', () => {
    expect(validateUUID('')).toBeNull()
  })

  it('returns null for a non-UUID string', () => {
    expect(validateUUID('not-a-uuid')).toBeNull()
  })

  it('returns null for a UUID missing a section', () => {
    expect(validateUUID('550e8400-e29b-41d4-a716')).toBeNull()
  })

  it('returns null for a UUID with invalid characters', () => {
    expect(validateUUID('550e8400-e29b-41d4-a716-44665544000g')).toBeNull()
  })

  it('returns null for a number', () => {
    expect(validateUUID('12345')).toBeNull()
  })
})
