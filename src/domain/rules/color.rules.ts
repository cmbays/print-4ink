const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Convert a hex color string to RGB components (0-255).
 * Returns {0,0,0} for malformed input instead of producing NaN.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!HEX_COLOR_RE.test(hex)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * Convert a hex color to an SVG feColorMatrix "matrix" values string.
 *
 * This produces a 4x5 matrix that transforms a greyscale image into
 * the target color while preserving luminance (shading/highlights).
 *
 * The matrix maps greyscale luminance -> target color channels:
 *   R' = luminance * targetR
 *   G' = luminance * targetG
 *   B' = luminance * targetB
 *   A' = A (unchanged)
 *
 * Luminance weights: R=0.2126, G=0.7152, B=0.0722 (Rec. 709)
 */
export function hexToColorMatrix(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  // Luminance extraction weights (Rec. 709)
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;

  // 4x5 matrix (rows: R, G, B, A; columns: R, G, B, A, offset)
  // Each row computes: output = (lr*R + lg*G + lb*B) * targetChannel
  const matrix = [
    // R output
    rn * lr, rn * lg, rn * lb, 0, 0,
    // G output
    gn * lr, gn * lg, gn * lb, 0, 0,
    // B output
    bn * lr, bn * lg, bn * lb, 0, 0,
    // A output (pass through)
    0, 0, 0, 1, 0,
  ];

  return matrix.map((v) => v.toFixed(4)).join(" ");
}
