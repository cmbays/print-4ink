import { z } from "zod";
import { dtfSheetTierSchema } from "./dtf-pricing";

// ---------------------------------------------------------------------------
// Canvas Layout — positioned design rectangles for SVG rendering (S24)
// ---------------------------------------------------------------------------

export const canvasDesignSchema = z.object({
  id: z.string(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  label: z.string(),
});

export const canvasLayoutSchema = z.object({
  sheetWidth: z.number().positive(),
  sheetHeight: z.number().positive(),
  designs: z.array(canvasDesignSchema),
  margins: z.number().nonnegative(),
});

// ---------------------------------------------------------------------------
// Sheet Calculation — optimized sheet assignments with costs (S22)
// ---------------------------------------------------------------------------

export const optimizedSheetSchema = z.object({
  tier: dtfSheetTierSchema,
  designs: z.array(canvasDesignSchema),
  utilization: z.number().min(0).max(100),
  cost: z.number().nonnegative(),
});

export const sheetCalculationSchema = z.object({
  sheets: z.array(optimizedSheetSchema),
  totalCost: z.number().nonnegative(),
  totalSheets: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CanvasDesign = z.infer<typeof canvasDesignSchema>;
export type CanvasLayout = z.infer<typeof canvasLayoutSchema>;
export type OptimizedSheet = z.infer<typeof optimizedSheetSchema>;
export type SheetCalculation = z.infer<typeof sheetCalculationSchema>;
