import type { CSSProperties } from "react";

/** Shared inline style for color-name text inside 10×10 swatches. */
export function swatchTextStyle(textColor: string): CSSProperties {
  return {
    color: textColor,
    fontSize: "8px",
    lineHeight: "1.1",
    padding: "1px",
    wordBreak: "break-word",
  };
}
