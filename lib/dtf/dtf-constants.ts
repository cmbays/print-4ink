import type { JobTask } from "@/lib/schemas/job";

// ---------------------------------------------------------------------------
// DTF Size Presets (S26) — standalone presets, NOT artwork-tied
// ---------------------------------------------------------------------------

export const DTF_SIZE_PRESETS = [
  { label: "Small / Collectibles", shortLabel: "Small", width: 4, height: 4 },
  { label: "Medium / Pocket", shortLabel: "Medium", width: 6, height: 6 },
  { label: "Large / Shirts", shortLabel: "Large", width: 10, height: 12 },
] as const;

export type DtfSizePresetConfig = (typeof DTF_SIZE_PRESETS)[number];

// ---------------------------------------------------------------------------
// DTF Task Template (N53) — production steps for DTF jobs
// ---------------------------------------------------------------------------

export const DTF_TASK_TEMPLATE = [
  { name: "Gang sheet prepared" },
  { name: "DTF printed" },
  { name: "QC passed" },
  { name: "Shipped" },
] as const;

// ---------------------------------------------------------------------------
// DTF Task Template Factory
// ---------------------------------------------------------------------------

/** Generate DTF-specific production tasks matching jobTaskSchema shape. */
export function getDtfTaskTemplate(): JobTask[] {
  return DTF_TASK_TEMPLATE.map((t, i) => ({
    id: crypto.randomUUID(),
    label: t.name,
    isCompleted: false,
    isCanonical: true,
    sortOrder: i,
  }));
}

// ---------------------------------------------------------------------------
// Sheet Constants
// ---------------------------------------------------------------------------

/** Fixed DTF sheet width in inches */
export const DTF_SHEET_WIDTH = 22;

/** Recommended spacing between designs in inches */
export const DTF_DEFAULT_MARGIN = 1;

/** Maximum sheet length in inches (largest tier) */
export const DTF_MAX_SHEET_LENGTH = 60;
