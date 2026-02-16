import { describe, it, expect } from "vitest";
import { optimizeCost } from "../cost-optimize";
import type { DTFSheetTier } from "@/lib/schemas/dtf-pricing";
import type { PackedSheet } from "../shelf-pack";

const MOCK_TIERS: DTFSheetTier[] = [
  { width: 22, length: 12, retailPrice: 8.99 },
  { width: 22, length: 24, retailPrice: 14.99 },
  { width: 22, length: 36, retailPrice: 19.99 },
  { width: 22, length: 48, retailPrice: 24.99 },
  { width: 22, length: 60, retailPrice: 29.99 },
];

function makePackedSheet(
  designs: PackedSheet["designs"],
  usedHeight: number
): PackedSheet {
  return { designs, usedHeight };
}

describe("optimizeCost", () => {
  it("picks cheapest tier that fits the used height", () => {
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 4, height: 4, label: "Logo" }],
      10
    );

    const result = optimizeCost([sheet], MOCK_TIERS);

    expect(result.sheets).toHaveLength(1);
    // usedHeight=10 fits in 22x12 tier
    expect(result.sheets[0].tier.length).toBe(12);
    expect(result.sheets[0].cost).toBe(8.99);
  });

  it("picks larger tier when height exceeds smallest", () => {
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 10, height: 12, label: "Tiger" }],
      20
    );

    const result = optimizeCost([sheet], MOCK_TIERS);

    // usedHeight=20 exceeds 12" tier, fits in 24" tier
    expect(result.sheets[0].tier.length).toBe(24);
    expect(result.sheets[0].cost).toBe(14.99);
  });

  it("uses largest tier when height exceeds all", () => {
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 20, height: 55, label: "Huge" }],
      65
    );

    const result = optimizeCost([sheet], MOCK_TIERS);

    // usedHeight=65 exceeds all tiers — fallback to largest (60")
    expect(result.sheets[0].tier.length).toBe(60);
    expect(result.sheets[0].cost).toBe(29.99);
  });

  it("calculates utilization percentage correctly", () => {
    // One design: 10 x 12 = 120 sq inches
    // Tier: 22 x 24 = 528 sq inches
    // Utilization: (120 / 528) * 100 = 22.727... → Math.round → 23
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 10, height: 12, label: "Tiger" }],
      20
    );

    const result = optimizeCost([sheet], MOCK_TIERS);

    expect(result.sheets[0].utilization).toBe(23);
  });

  it("sums total cost across multiple sheets with big.js precision", () => {
    const sheet1 = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 4, height: 4, label: "Logo" }],
      10
    );
    const sheet2 = makePackedSheet(
      [{ id: "d2-0", x: 1, y: 1, width: 10, height: 12, label: "Tiger" }],
      20
    );

    const result = optimizeCost([sheet1, sheet2], MOCK_TIERS);

    // $8.99 + $14.99 = $23.98 (exact with big.js)
    expect(result.totalCost).toBe(23.98);
    // Verify no floating-point drift
    expect(result.totalCost.toString()).toBe("23.98");
  });

  it("returns correct totalSheets count", () => {
    const sheets = [
      makePackedSheet(
        [{ id: "d1-0", x: 1, y: 1, width: 4, height: 4, label: "A" }],
        10
      ),
      makePackedSheet(
        [{ id: "d2-0", x: 1, y: 1, width: 4, height: 4, label: "B" }],
        10
      ),
      makePackedSheet(
        [{ id: "d3-0", x: 1, y: 1, width: 4, height: 4, label: "C" }],
        10
      ),
    ];

    const result = optimizeCost(sheets, MOCK_TIERS);
    expect(result.totalSheets).toBe(3);
  });

  it("handles empty packed sheets", () => {
    const result = optimizeCost([], MOCK_TIERS);

    expect(result.sheets).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.totalSheets).toBe(0);
  });

  it("handles tiers passed in non-ascending order", () => {
    // Pass tiers in reverse order — algorithm should still pick cheapest fit
    const reversedTiers = [...MOCK_TIERS].reverse();
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 4, height: 4, label: "Logo" }],
      10
    );

    const result = optimizeCost([sheet], reversedTiers);

    // Should still pick 22x12 ($8.99), not 22x60 ($29.99)
    expect(result.sheets[0].tier.length).toBe(12);
    expect(result.sheets[0].cost).toBe(8.99);
  });

  it("selects exact-fit tier without upgrading", () => {
    // usedHeight exactly equals a tier length
    const sheet = makePackedSheet(
      [{ id: "d1-0", x: 1, y: 1, width: 10, height: 10, label: "M" }],
      12
    );

    const result = optimizeCost([sheet], MOCK_TIERS);

    // usedHeight=12 exactly fits 22x12 tier
    expect(result.sheets[0].tier.length).toBe(12);
    expect(result.sheets[0].cost).toBe(8.99);
  });

  it("accumulates cost for many sheets without floating-point drift", () => {
    // 10 sheets at $8.99 each = $89.90 (exact)
    const sheets = Array.from({ length: 10 }, (_, i) =>
      makePackedSheet(
        [{ id: `d${i}-0`, x: 1, y: 1, width: 4, height: 4, label: "X" }],
        10
      )
    );

    const result = optimizeCost(sheets, MOCK_TIERS);

    expect(result.totalCost).toBe(89.9);
    expect(result.totalSheets).toBe(10);
  });
});
