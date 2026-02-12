/**
 * Shared formatting helpers used across UI components.
 */

/**
 * Format a date string as "Feb 12, 2026".
 *
 * Date-only strings ("YYYY-MM-DD") are parsed as local dates to avoid
 * the UTC day-shift that `new Date("2025-01-15")` can cause.
 */
export function formatDate(dateStr: string): string {
  const date = dateStr.includes("T")
    ? new Date(dateStr)
    : (() => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      })();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
