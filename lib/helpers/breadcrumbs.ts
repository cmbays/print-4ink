/**
 * Centralized breadcrumb builder.
 *
 * The Topbar component always renders "Dashboard" as the root breadcrumb.
 * Pages pass only the segments *after* Dashboard via buildBreadcrumbs().
 */

export type BreadcrumbSegment = { label: string; href?: string };

/**
 * Build a type-safe breadcrumb array for the Topbar component.
 * Validates that no segment duplicates the root "Dashboard" crumb
 * (which Topbar renders automatically).
 */
export function buildBreadcrumbs(
  ...segments: BreadcrumbSegment[]
): BreadcrumbSegment[] {
  if (process.env.NODE_ENV !== "production") {
    for (const seg of segments) {
      if (seg.label === "Dashboard") {
        throw new Error(
          'Breadcrumb segment must not include "Dashboard" — Topbar renders it automatically. ' +
            "Use buildBreadcrumbs() with only the segments after Dashboard."
        );
      }
    }
  }
  return segments;
}
