/**
 * DTF sheet dimension constants.
 *
 * Extracted here so that both dtf.service.ts (algorithm) and
 * dtf.rules.ts (cost optimization) can import from a single source
 * without creating a bidirectional dependency between service and rules.
 */

/** Fixed DTF sheet width in inches */
export const DTF_SHEET_WIDTH = 22;

/** Recommended spacing between designs in inches */
export const DTF_DEFAULT_MARGIN = 1;

/** Maximum sheet length in inches (largest tier) */
export const DTF_MAX_SHEET_LENGTH = 60;
