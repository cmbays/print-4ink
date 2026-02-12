/**
 * Shared formatting helpers used across UI components.
 */

/** Parse a date string safely (avoids UTC day-shift for date-only strings). */
function parseDate(dateStr: string): Date {
  if (dateStr.includes("T")) return new Date(dateStr);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string as "Feb 12, 2026".
 */
export function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date string as "Feb 12" (no year — compact for cards).
 */
export function formatShortDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
