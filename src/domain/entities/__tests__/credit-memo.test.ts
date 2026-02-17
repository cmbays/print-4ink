import { describe, it, expect } from 'vitest'
import { creditMemoReasonEnum, creditMemoLineItemSchema, creditMemoSchema } from '../credit-memo'

describe('credit memo enums', () => {
  it('creditMemoReasonEnum accepts all valid reasons', () => {
    const reasons = ['shortage', 'misprint', 'defect', 'overcharge', 'return', 'other']
    for (const reason of reasons) {
      expect(creditMemoReasonEnum.parse(reason)).toBe(reason)
    }
  })

  it('creditMemoReasonEnum rejects invalid values', () => {
    expect(() => creditMemoReasonEnum.parse('invalid')).toThrow()
  })
})

describe('creditMemoLineItemSchema', () => {
  it('validates a valid line item', () => {
    const valid = {
      id: 'f6e60001-e5f6-4a01-8b01-0d1e2f3a5001',
      description: '3 hoodies short',
      quantity: 3,
      unitCredit: 32,
      lineTotal: 96,
    }
    expect(() => creditMemoLineItemSchema.parse(valid)).not.toThrow()
  })

  it('rejects zero unit credit', () => {
    const invalid = {
      id: 'f6e60001-e5f6-4a01-8b01-0d1e2f3a5001',
      description: 'Test',
      quantity: 1,
      unitCredit: 0,
      lineTotal: 0,
    }
    expect(() => creditMemoLineItemSchema.parse(invalid)).toThrow()
  })
})

describe('creditMemoSchema', () => {
  const validCM = {
    id: 'f5e50001-e5f6-4a01-8b01-0d1e2f3a4f01',
    creditMemoNumber: 'CM-0001',
    invoiceId: 'b1a10001-e5f6-4a01-8b01-0d1e2f3a4b01',
    customerId: 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    reason: 'shortage',
    lineItems: [
      {
        id: 'f6e60001-e5f6-4a01-8b01-0d1e2f3a5001',
        description: '3 hoodies short',
        quantity: 3,
        unitCredit: 32,
        lineTotal: 96,
      },
    ],
    totalCredit: 96,
    createdAt: '2026-01-05T10:00:00Z',
    createdBy: 'Gary',
  }

  it('validates a valid credit memo', () => {
    expect(() => creditMemoSchema.parse(validCM)).not.toThrow()
  })

  it('rejects credit memo number with wrong format', () => {
    expect(() => creditMemoSchema.parse({ ...validCM, creditMemoNumber: 'CM0001' })).toThrow()
    expect(() => creditMemoSchema.parse({ ...validCM, creditMemoNumber: 'INV-0001' })).toThrow()
  })

  it('requires at least 1 line item', () => {
    expect(() => creditMemoSchema.parse({ ...validCM, lineItems: [] })).toThrow()
  })

  it('requires positive totalCredit', () => {
    expect(() => creditMemoSchema.parse({ ...validCM, totalCredit: 0 })).toThrow()
    expect(() => creditMemoSchema.parse({ ...validCM, totalCredit: -10 })).toThrow()
  })
})
