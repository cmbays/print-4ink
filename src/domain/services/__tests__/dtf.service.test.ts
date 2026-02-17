import { describe, it, expect } from "vitest";
import { shelfPack } from "../dtf.service";
import { DTF_MAX_SHEET_LENGTH } from "@domain/constants/dtf";

describe("shelfPack", () => {
  it("returns empty array for empty input", () => {
    const result = shelfPack([]);
    expect(result).toEqual([]);
  });

  it("places a single design on one sheet", () => {
    const result = shelfPack([
      { id: "d1", width: 4, height: 4, quantity: 1, label: "Logo" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].designs).toHaveLength(1);
    expect(result[0].designs[0]).toEqual({
      id: "d1-0",
      x: 1, // margin
      y: 1, // margin
      width: 4,
      height: 4,
      label: "Logo",
    });
    // usedHeight = top margin (1) + design height (4) + bottom margin (1) = 6
    expect(result[0].usedHeight).toBe(6);
  });

  it("fills a row left-to-right with margin spacing", () => {
    // 22" sheet, 1" margin each side, designs 4" wide + 1" gap each
    // Usable width from margin=1 to edge: placing at x=1, 6, 11, 16
    // 4 designs at 4" each, spaced by 1" margin between them
    const result = shelfPack([
      { id: "d1", width: 4, height: 4, quantity: 4, label: "Small" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].designs).toHaveLength(4);

    // First design at (1, 1)
    expect(result[0].designs[0].x).toBe(1);
    expect(result[0].designs[0].y).toBe(1);

    // Second at (6, 1): 1 + 4 + 1 = 6
    expect(result[0].designs[1].x).toBe(6);
    expect(result[0].designs[1].y).toBe(1);

    // Third at (11, 1)
    expect(result[0].designs[2].x).toBe(11);
    expect(result[0].designs[2].y).toBe(1);

    // Fourth at (16, 1)
    expect(result[0].designs[3].x).toBe(16);
    expect(result[0].designs[3].y).toBe(1);
  });

  it("wraps to next shelf when row is full", () => {
    // 5 designs at 4" wide on 22" sheet (4 fit per row)
    // 5th should wrap to next shelf
    const result = shelfPack([
      { id: "d1", width: 4, height: 4, quantity: 5, label: "Small" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].designs).toHaveLength(5);

    // 5th design should be on a new shelf (y = 1 + 4 + 1 = 6)
    const fifthDesign = result[0].designs[4];
    expect(fifthDesign.x).toBe(1); // back to left margin
    expect(fifthDesign.y).toBe(6); // second shelf
  });

  it("creates new sheet when vertical space exceeded", () => {
    // Design is 15" tall. On a 60" max sheet with 1" margins:
    // Shelf 1: y=1, height=15 → usedHeight=1+15=16
    // Shelf 2: y=17, height=15 → usedHeight=17+15=32
    // Shelf 3: y=33, height=15 → usedHeight=33+15=48
    // Shelf 4: y=49, height=15 → usedHeight=49+15=64 > 60, so new sheet
    // Each row fits 1 design (width 20 + margins = fills row)
    const result = shelfPack([
      { id: "d1", width: 20, height: 15, quantity: 4, label: "Big" },
    ]);

    expect(result).toHaveLength(2);
    // First sheet has 3 designs, second has 1
    expect(result[0].designs).toHaveLength(3);
    expect(result[1].designs).toHaveLength(1);

    // Second sheet starts fresh at (1, 1)
    expect(result[1].designs[0].x).toBe(1);
    expect(result[1].designs[0].y).toBe(1);
  });

  it("sorts designs by height descending for better packing", () => {
    // Input: short design first, tall design second
    // After sorting, tall should be placed first
    const result = shelfPack([
      { id: "short", width: 4, height: 2, quantity: 1, label: "Short" },
      { id: "tall", width: 4, height: 10, quantity: 1, label: "Tall" },
    ]);

    expect(result).toHaveLength(1);
    // Tall design (height 10) should be placed first (index 0)
    expect(result[0].designs[0].label).toBe("Tall");
    expect(result[0].designs[0].height).toBe(10);
    // Short design (height 2) placed second (index 1)
    expect(result[0].designs[1].label).toBe("Short");
    expect(result[0].designs[1].height).toBe(2);
  });

  it("expands designs by quantity", () => {
    const result = shelfPack([
      { id: "tiger", width: 4, height: 4, quantity: 5, label: "Tiger" },
    ]);

    const allDesigns = result.flatMap((s) => s.designs);
    expect(allDesigns).toHaveLength(5);

    // Each design has a unique id suffix
    const ids = allDesigns.map((d) => d.id);
    expect(ids).toEqual([
      "tiger-0",
      "tiger-1",
      "tiger-2",
      "tiger-3",
      "tiger-4",
    ]);

    // All share the same label
    for (const d of allDesigns) {
      expect(d.label).toBe("Tiger");
    }
  });

  it("enforces margins from edges", () => {
    const result = shelfPack([
      { id: "d1", width: 4, height: 4, quantity: 1, label: "Logo" },
    ]);

    const design = result[0].designs[0];
    // Design must start at (margin, margin), not (0, 0)
    expect(design.x).toBe(1);
    expect(design.y).toBe(1);
    // usedHeight includes bottom margin
    expect(result[0].usedHeight).toBe(1 + 4 + 1);
  });

  it("handles design wider than available row space", () => {
    // 20" wide design on 22" sheet (1" margin each side → 20" usable)
    // Exactly fits one design per row
    const result = shelfPack([
      { id: "wide", width: 20, height: 4, quantity: 2, label: "Wide" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].designs).toHaveLength(2);

    // First design fills the row
    expect(result[0].designs[0].x).toBe(1);
    expect(result[0].designs[0].y).toBe(1);

    // Second wraps to next shelf
    expect(result[0].designs[1].x).toBe(1);
    expect(result[0].designs[1].y).toBe(6); // 1 + 4 + 1
  });

  it("handles custom margin value", () => {
    const result = shelfPack(
      [{ id: "d1", width: 4, height: 4, quantity: 1, label: "Logo" }],
      22,
      2 // 2" margin
    );

    const design = result[0].designs[0];
    expect(design.x).toBe(2);
    expect(design.y).toBe(2);
    // usedHeight = 2 + 4 + 2 = 8
    expect(result[0].usedHeight).toBe(8);
  });

  it("respects DTF_MAX_SHEET_LENGTH boundary", () => {
    // A design that is exactly max length minus margins should fit on one sheet
    const maxDesignHeight = DTF_MAX_SHEET_LENGTH - 2; // minus top + bottom margin
    const result = shelfPack([
      {
        id: "maxh",
        width: 4,
        height: maxDesignHeight,
        quantity: 1,
        label: "Tall",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].usedHeight).toBe(DTF_MAX_SHEET_LENGTH);
  });

  it("ignores designs with zero quantity", () => {
    const result = shelfPack([
      { id: "d1", width: 4, height: 4, quantity: 0, label: "Ghost" },
      { id: "d2", width: 4, height: 4, quantity: 1, label: "Real" },
    ]);

    const allDesigns = result.flatMap((s) => s.designs);
    expect(allDesigns).toHaveLength(1);
    expect(allDesigns[0].label).toBe("Real");
  });

  it("rejects designs wider than usable sheet width", () => {
    expect(() =>
      shelfPack([{ id: "d1", width: 25, height: 4, quantity: 1, label: "Too Wide" }])
    ).toThrow(/exceeds usable sheet width/);
  });

  it("rejects designs taller than max sheet height", () => {
    // Default margin=1, so max design height = 60 - 2*1 = 58
    expect(() =>
      shelfPack([{ id: "d1", width: 4, height: 59, quantity: 1, label: "Too Tall" }])
    ).toThrow(/exceeds max sheet height/);
  });

  it("handles multiple design types mixed together", () => {
    const result = shelfPack([
      { id: "tiger", width: 10, height: 12, quantity: 2, label: "Tiger" },
      { id: "logo", width: 4, height: 4, quantity: 3, label: "Logo" },
    ]);

    const allDesigns = result.flatMap((s) => s.designs);
    // Total placements: 2 tigers + 3 logos = 5
    expect(allDesigns).toHaveLength(5);

    // After sorting by height, tigers (12") should appear before logos (4")
    expect(allDesigns[0].height).toBe(12);
    expect(allDesigns[1].height).toBe(12);
    expect(allDesigns[2].height).toBe(4);
  });
});
