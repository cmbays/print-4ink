import Big from "big.js";

/**
 * Decimal-safe currency helper — all financial math goes through Big.
 * Round to 2 decimal places using half-up rounding (not banker's rounding).
 */
export function money(value: number | Big): number {
  const b = value instanceof Big ? value : new Big(value);
  return Number(b.round(2, Big.roundHalfUp));
}
