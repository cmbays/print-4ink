import type { PrintZone } from "@/lib/schemas/mockup-template";

/**
 * Human-readable labels for print positions.
 */
export const PRINT_POSITION_LABELS: Record<string, string> = {
  "front-chest": "Front Chest",
  "left-chest": "Left Chest",
  "right-chest": "Right Chest",
  "full-front": "Full Front",
  "full-back": "Full Back",
  "upper-back": "Upper Back",
  "nape": "Nape",
  "left-sleeve": "Left Sleeve",
  "right-sleeve": "Right Sleeve",
};

/**
 * Alias map: normalizes freeform location strings (from quote/job mock data)
 * to canonical kebab-case position IDs used by the mockup engine.
 *
 * BREADBOARD GAP #1: Quote data uses "Front", "Back", "Left Sleeve".
 * Job data uses "Front Center", "Back Full", "Left Chest".
 * Mockup engine expects "front-chest", "full-back", etc.
 */
export const PRINT_POSITION_ALIASES: Record<string, string> = {
  // Quote-style short names
  "Front": "front-chest",
  "Back": "full-back",
  "Left Sleeve": "left-sleeve",
  "Right Sleeve": "right-sleeve",
  // Job-style descriptive names
  "Front Center": "front-chest",
  "Front Left Chest": "left-chest",
  "Left Chest": "left-chest",
  "Right Chest": "right-chest",
  "Back Full": "full-back",
  "Back Number": "upper-back",
  "Full Front": "full-front",
  "Full Back": "full-back",
  "Upper Back": "upper-back",
  "Nape": "nape",
};

/**
 * Normalize a freeform location/position string to a canonical position ID.
 * Returns the alias match if found. For unknown input, logs a warning and
 * falls back to kebab-case conversion.
 */
export function normalizePosition(input: string): string {
  const aliased = PRINT_POSITION_ALIASES[input];
  if (aliased) return aliased;

  // Check if already a canonical position
  if (PRINT_POSITION_LABELS[input]) return input;

  // Unknown input — warn and fall back to kebab-case
  const kebab = input.toLowerCase().replace(/\s+/g, "-");
  console.warn(
    `[mockup] Unknown print position "${input}", falling back to "${kebab}". ` +
    `Consider adding it to PRINT_POSITION_ALIASES.`
  );
  return kebab;
}

/**
 * Print zone geometry per garment category and view.
 * Coordinates are percentages of the template viewBox.
 */
export const PRINT_ZONES: Record<
  string,
  Partial<Record<string, PrintZone[]>>
> = {
  "t-shirts": {
    front: [
      { position: "front-chest", x: 28, y: 18, width: 44, height: 35 },
      { position: "left-chest", x: 52, y: 18, width: 16, height: 16 },
      { position: "right-chest", x: 32, y: 18, width: 16, height: 16 },
      { position: "full-front", x: 22, y: 15, width: 56, height: 50 },
    ],
    back: [
      { position: "full-back", x: 22, y: 18, width: 56, height: 50 },
      { position: "upper-back", x: 25, y: 12, width: 50, height: 15 },
      { position: "nape", x: 42, y: 5, width: 16, height: 10 },
    ],
  },
  fleece: {
    front: [
      { position: "front-chest", x: 26, y: 22, width: 48, height: 32 },
      { position: "left-chest", x: 52, y: 22, width: 16, height: 16 },
    ],
    back: [
      { position: "full-back", x: 20, y: 22, width: 60, height: 45 },
    ],
  },
  outerwear: {
    front: [
      { position: "left-chest", x: 52, y: 22, width: 16, height: 16 },
      { position: "front-chest", x: 28, y: 22, width: 44, height: 30 },
    ],
    back: [
      { position: "full-back", x: 20, y: 20, width: 60, height: 48 },
    ],
  },
  pants: {
    front: [
      { position: "left-chest", x: 30, y: 10, width: 20, height: 20 },
    ],
    back: [],
  },
  headwear: {
    front: [
      { position: "front-chest", x: 20, y: 25, width: 60, height: 40 },
    ],
    back: [
      { position: "full-back", x: 20, y: 25, width: 60, height: 40 },
    ],
  },
};

/** Get all print zones for a garment category and view. */
export function getZonesForCategory(
  category: string,
  view: string
): PrintZone[] {
  return PRINT_ZONES[category]?.[view] ?? [];
}

/** Get a specific zone by position within a category and view. */
export function getZoneForPosition(
  category: string,
  view: string,
  position: string
): PrintZone | undefined {
  return getZonesForCategory(category, view).find(
    (z) => z.position === position
  );
}
