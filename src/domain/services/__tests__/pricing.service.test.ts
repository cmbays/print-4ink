import { describe, it, expect } from 'vitest'
import { calculateDTFPrice } from '../pricing.service'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'

// ---------------------------------------------------------------------------
// Shared fixture — retail $18.00, contractPrice $15.30 (~15% below retail)
// Contract tier discount is also 15% — the bug was applying BOTH.
// ---------------------------------------------------------------------------
const template: DTFPricingTemplate = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Template',
  serviceType: 'dtf',
  sheetTiers: [
    {
      width: 22,
      length: 10,
      retailPrice: 18.0,
      contractPrice: 15.3, // ~15% below retail; must NOT be discounted again
    },
    {
      width: 22,
      length: 5,
      retailPrice: 10.0,
      // no contractPrice — contract tier falls back to tier-discount on retail
    },
  ],
  rushFees: [
    { turnaround: 'standard', percentageUpcharge: 0 },
    { turnaround: '2-day', percentageUpcharge: 25 },
    { turnaround: 'next-day', percentageUpcharge: 50 },
    { turnaround: 'same-day', percentageUpcharge: 100 },
  ],
  filmTypes: [
    { type: 'standard', multiplier: 1.0 },
    { type: 'glossy', multiplier: 1.2 },
    { type: 'metallic', multiplier: 1.3 },
    { type: 'glow', multiplier: 1.5 },
  ],
  customerTierDiscounts: [
    { tier: 'standard', discountPercent: 0 },
    { tier: 'preferred', discountPercent: 5 },
    { tier: 'contract', discountPercent: 15 }, // same % as embedded in contractPrice
    { tier: 'wholesale', discountPercent: 10 },
  ],
  costConfig: {
    filmCostPerSqFt: 0.5,
    inkCostPerSqIn: 0.01,
    powderCostPerSqFt: 0.25,
    laborRatePerHour: 25,
    equipmentOverheadPerSqFt: 0.1,
  },
  isDefault: false,
  isIndustryDefault: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// calculateDTFPrice — customer tier discount / contract price behavior
// ---------------------------------------------------------------------------

describe('calculateDTFPrice — contract price (issue #490)', () => {
  it('gives contract customer exactly contractPrice — no tier discount on top', () => {
    // Bug: contractPrice ($15.30) × (1 − 0.15) = $13.01 was the broken behavior.
    // Fix: contractPrice is already the negotiated rate; skip the tier discount.
    const { price } = calculateDTFPrice(10, 'contract', 'standard', 'standard', template)
    expect(price).toBe(15.3)
  })

  it('does NOT produce the double-discount amount', () => {
    // Regression sentinel: if the bug returns, this explicit assertion catches it.
    const { price } = calculateDTFPrice(10, 'contract', 'standard', 'standard', template)
    expect(price).not.toBe(13.01) // contractPrice × 0.85 — the old broken value
  })

  it('gives standard customer full retail price (0% discount)', () => {
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'standard', template)
    expect(price).toBe(18.0)
  })

  it('gives wholesale customer retail minus 10% tier discount', () => {
    // $18.00 × (1 − 0.10) = $16.20
    const { price } = calculateDTFPrice(10, 'wholesale', 'standard', 'standard', template)
    expect(price).toBe(16.2)
  })

  it('gives preferred customer retail minus 5% tier discount', () => {
    // $18.00 × (1 − 0.05) = $17.10
    const { price } = calculateDTFPrice(10, 'preferred', 'standard', 'standard', template)
    expect(price).toBe(17.1)
  })

  it('falls back to tier discount on retail when contractPrice is absent', () => {
    // Sheet tier for length=5 has no contractPrice — contract tier applies 15% on retail.
    // $10.00 × (1 − 0.15) = $8.50
    const { price } = calculateDTFPrice(5, 'contract', 'standard', 'standard', template)
    expect(price).toBe(8.5)
  })
})

// ---------------------------------------------------------------------------
// calculateDTFPrice — rush fee behavior
// ---------------------------------------------------------------------------

describe('calculateDTFPrice — rush fees', () => {
  it('standard rush adds no upcharge', () => {
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'standard', template)
    expect(price).toBe(18.0)
  })

  it('2-day rush adds 25% on top of contract price', () => {
    // contractPrice $15.30 × 1.25 = $19.125 → rounds to $19.13
    const { price } = calculateDTFPrice(10, 'contract', '2-day', 'standard', template)
    expect(price).toBe(19.13)
  })

  it('next-day rush adds 50% on retail price', () => {
    // $18.00 × 1.50 = $27.00
    const { price } = calculateDTFPrice(10, 'standard', 'next-day', 'standard', template)
    expect(price).toBe(27.0)
  })

  it('same-day rush doubles the retail price', () => {
    // $18.00 × 2.00 = $36.00
    const { price } = calculateDTFPrice(10, 'standard', 'same-day', 'standard', template)
    expect(price).toBe(36.0)
  })
})

// ---------------------------------------------------------------------------
// calculateDTFPrice — film type multiplier
// ---------------------------------------------------------------------------

describe('calculateDTFPrice — film types', () => {
  it('standard film applies no multiplier', () => {
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'standard', template)
    expect(price).toBe(18.0)
  })

  it('glossy film applies 1.2× multiplier to retail price', () => {
    // $18.00 × 1.20 = $21.60
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'glossy', template)
    expect(price).toBe(21.6)
  })

  it('metallic film applies 1.3× multiplier to contract price', () => {
    // contractPrice $15.30 × 1.30 = $19.89
    const { price } = calculateDTFPrice(10, 'contract', 'standard', 'metallic', template)
    expect(price).toBe(19.89)
  })

  it('glow film applies 1.5× multiplier', () => {
    // $18.00 × 1.50 = $27.00
    const { price } = calculateDTFPrice(10, 'standard', 'standard', 'glow', template)
    expect(price).toBe(27.0)
  })
})

// ---------------------------------------------------------------------------
// calculateDTFPrice — edge cases
// ---------------------------------------------------------------------------

describe('calculateDTFPrice — edge cases', () => {
  it('returns price 0 for unknown sheet length', () => {
    const { price } = calculateDTFPrice(999, 'standard', 'standard', 'standard', template)
    expect(price).toBe(0)
  })

  it('returned margin has non-negative totalCost for valid inputs', () => {
    const { margin } = calculateDTFPrice(10, 'contract', 'standard', 'standard', template)
    expect(margin.totalCost).toBeGreaterThan(0)
    expect(margin.revenue).toBe(15.3)
  })
})
