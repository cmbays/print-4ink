import type { DtfLineItem } from "@/lib/schemas/dtf-line-item";

/**
 * Check if a single DTF line item has valid data for calculation.
 * Used by SheetCalculationPanel (filter + gate) and QuoteForm (tab validation).
 */
export function isValidDtfLineItem(item: DtfLineItem): boolean {
  return (
    item.artworkName.trim().length > 0 &&
    item.width > 0 &&
    item.height > 0 &&
    item.quantity >= 1
  );
}
