import { describe, it, expect } from 'vitest'
import { contactSchema, contactRoleEnum } from '../contact'

describe('contactRoleEnum', () => {
  it.each(['ordering', 'art-approver', 'billing', 'owner', 'other'])("accepts '%s'", (role) => {
    expect(contactRoleEnum.parse(role)).toBe(role)
  })

  it('rejects invalid role', () => {
    expect(() => contactRoleEnum.parse('manager')).toThrow()
  })
})

describe('contactSchema', () => {
  const validContact = {
    id: '01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    name: 'Marcus Rivera',
    email: 'marcus@example.com',
    phone: '(512) 555-0147',
    role: 'ordering' as const,
    isPrimary: true,
  }

  it('accepts a valid contact', () => {
    const result = contactSchema.parse(validContact)
    expect(result.name).toBe('Marcus Rivera')
    expect(result.role).toBe('ordering')
    expect(result.isPrimary).toBe(true)
  })

  it('accepts contact without optional fields', () => {
    const minimal = {
      id: '01a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
      name: 'Test Contact',
      role: 'other' as const,
      isPrimary: false,
    }
    const result = contactSchema.parse(minimal)
    expect(result.email).toBeUndefined()
    expect(result.phone).toBeUndefined()
    expect(result.groupId).toBeUndefined()
  })

  it('accepts contact with groupId', () => {
    const withGroup = {
      ...validContact,
      groupId: '91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }
    const result = contactSchema.parse(withGroup)
    expect(result.groupId).toBe('91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c')
  })

  it('rejects empty name', () => {
    expect(() => contactSchema.parse({ ...validContact, name: '' })).toThrow()
  })

  it('rejects invalid email', () => {
    expect(() => contactSchema.parse({ ...validContact, email: 'not-an-email' })).toThrow()
  })

  it('rejects invalid role', () => {
    expect(() => contactSchema.parse({ ...validContact, role: 'manager' })).toThrow()
  })

  it('defaults isPrimary to false', () => {
    const noPrimary = { ...validContact }
    delete (noPrimary as Record<string, unknown>).isPrimary
    const result = contactSchema.parse(noPrimary)
    expect(result.isPrimary).toBe(false)
  })
})
