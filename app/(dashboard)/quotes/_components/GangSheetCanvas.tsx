"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CanvasLayout, CanvasDesign } from "@/lib/schemas/dtf-sheet-calculation";

// ---------------------------------------------------------------------------
// Design color palette — muted fills cycling by design type (label)
// ---------------------------------------------------------------------------

const DESIGN_COLORS = [
  { fill: "rgba(42,185,255,0.10)", stroke: "rgba(42,185,255,0.40)" },   // action
  { fill: "rgba(84,202,116,0.10)", stroke: "rgba(84,202,116,0.40)" },   // success
  { fill: "rgba(255,198,99,0.10)", stroke: "rgba(255,198,99,0.40)" },   // warning
  { fill: "rgba(210,62,8,0.10)", stroke: "rgba(210,62,8,0.40)" },       // error/destructive
  { fill: "rgba(42,185,255,0.06)", stroke: "rgba(42,185,255,0.25)" },   // action (lighter variant)
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GangSheetCanvasProps {
  canvasLayout: CanvasLayout[];
  activeSheetIndex: number;
  setActiveSheetIndex: React.Dispatch<React.SetStateAction<number>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a stable label → color index map so the same design type always gets the same color. */
function buildColorMap(designs: CanvasDesign[]): Map<string, number> {
  const map = new Map<string, number>();
  let idx = 0;
  for (const d of designs) {
    if (!map.has(d.label)) {
      map.set(d.label, idx % DESIGN_COLORS.length);
      idx++;
    }
  }
  return map;
}

/** Find a representative horizontal spacing gap for indicator rendering. */
function findSpacingGap(
  designs: CanvasDesign[],
  margins: number
): { x1: number; x2: number; y: number } | null {
  if (designs.length < 2) return null;

  // Find two designs on the same shelf (same y) with a gap between them
  const byY = new Map<number, CanvasDesign[]>();
  for (const d of designs) {
    const key = d.y;
    const group = byY.get(key) ?? [];
    group.push(d);
    byY.set(key, group);
  }

  for (const [, group] of byY) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.x - b.x);
    const d1 = sorted[0];
    const d2 = sorted[1];
    const gapStart = d1.x + d1.width;
    const gapEnd = d2.x;
    if (gapEnd - gapStart >= margins * 0.5) {
      return {
        x1: gapStart,
        x2: gapEnd,
        y: d1.y + Math.max(d1.height, d2.height) / 2,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GangSheetCanvas({
  canvasLayout,
  activeSheetIndex,
  setActiveSheetIndex,
}: GangSheetCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // N52 — scaleToViewport: ResizeObserver tracks container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = canvasLayout[activeSheetIndex];
  if (!layout) return null;

  const { sheetWidth, sheetHeight, designs, margins } = layout;
  const colorMap = buildColorMap(designs);

  // pxPerInch for adaptive rendering decisions (label visibility)
  const pxPerInch = containerWidth > 0 ? containerWidth / sheetWidth : 30;
  const minLabelPx = 40; // minimum px width to show label text

  // Stroke width scales inversely with container size for consistent visual weight
  const strokeW = Math.max(0.03, 0.5 / pxPerInch);

  // Spacing indicator
  const spacingGap = findSpacingGap(designs, margins);

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      {/* Header: multi-sheet tabs + dimensions */}
      <div className="flex items-center justify-between gap-3">
        {/* U92 — Multi-sheet tab bar */}
        {canvasLayout.length > 1 ? (
          <div
            className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5"
            role="tablist"
            aria-label="Sheet navigation"
          >
            {canvasLayout.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeSheetIndex}
                aria-controls="gang-sheet-canvas"
                onClick={() => setActiveSheetIndex(i)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  i === activeSheetIndex
                    ? "bg-elevated text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sheet {i + 1}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            Sheet 1
          </span>
        )}

        {/* Sheet dimensions */}
        <span className="text-xs text-muted-foreground font-mono">
          {sheetWidth}&quot; &times; {sheetHeight}&quot;
        </span>
      </div>

      {/* U88 — SVG Canvas */}
      <div ref={containerRef} className="w-full" id="gang-sheet-canvas">
        {containerWidth > 0 && (
          <svg
            viewBox={`0 0 ${sheetWidth} ${sheetHeight}`}
            className="w-full"
            preserveAspectRatio="xMidYMin meet"
            role="img"
            aria-label={`Gang sheet layout: ${designs.length} design${designs.length !== 1 ? "s" : ""} on ${sheetWidth}" × ${sheetHeight}" sheet`}
          >
            {/* U91 — Sheet boundary */}
            <rect
              x={strokeW / 2}
              y={strokeW / 2}
              width={sheetWidth - strokeW}
              height={sheetHeight - strokeW}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={strokeW}
              rx={0.15}
            />

            {/* Edge margin zones */}
            <rect
              x={0}
              y={0}
              width={sheetWidth}
              height={margins}
              fill="rgba(255,255,255,0.03)"
            />
            <rect
              x={0}
              y={sheetHeight - margins}
              width={sheetWidth}
              height={margins}
              fill="rgba(255,255,255,0.03)"
            />
            <rect
              x={0}
              y={margins}
              width={margins}
              height={sheetHeight - margins * 2}
              fill="rgba(255,255,255,0.03)"
            />
            <rect
              x={sheetWidth - margins}
              y={margins}
              width={margins}
              height={sheetHeight - margins * 2}
              fill="rgba(255,255,255,0.03)"
            />

            {/* U89 — Design rectangles */}
            {designs.map((d, i) => {
              const ci = colorMap.get(d.label) ?? 0;
              const color = DESIGN_COLORS[ci];
              const designPxWidth = d.width * pxPerInch;
              const showLabel = designPxWidth >= minLabelPx;

              return (
                <g key={`${d.id}-${i}`}>
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.width}
                    height={d.height}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={strokeW}
                    rx={0.1}
                  />
                  {showLabel && (
                    <>
                      <text
                        x={d.x + d.width / 2}
                        y={d.y + d.height / 2 - 0.2}
                        textAnchor="middle"
                        dominantBaseline="auto"
                        fill="rgba(255,255,255,0.87)"
                        fontSize={Math.min(0.55, d.height * 0.25)}
                        fontFamily="Inter, system-ui, sans-serif"
                        fontWeight={500}
                      >
                        {d.label.length > 12
                          ? d.label.slice(0, 11) + "\u2026"
                          : d.label}
                      </text>
                      <text
                        x={d.x + d.width / 2}
                        y={d.y + d.height / 2 + 0.5}
                        textAnchor="middle"
                        dominantBaseline="auto"
                        fill="rgba(255,255,255,0.60)"
                        fontSize={Math.min(0.4, d.height * 0.18)}
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {d.width}&quot; &times; {d.height}&quot;
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* U90 — Spacing indicators */}
            {/* Left edge margin indicator */}
            {designs.length > 0 && (
              <g>
                <line
                  x1={0}
                  y1={designs[0].y + designs[0].height / 2}
                  x2={margins}
                  y2={designs[0].y + designs[0].height / 2}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={strokeW * 0.7}
                  strokeDasharray={`${0.15} ${0.1}`}
                />
                <text
                  x={margins / 2}
                  y={designs[0].y + designs[0].height / 2 - 0.25}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.40)"
                  fontSize={0.3}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {margins}&quot;
                </text>
              </g>
            )}

            {/* Horizontal gap indicator between adjacent designs */}
            {spacingGap && (
              <g>
                <line
                  x1={spacingGap.x1}
                  y1={spacingGap.y}
                  x2={spacingGap.x2}
                  y2={spacingGap.y}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={strokeW * 0.7}
                  strokeDasharray={`${0.15} ${0.1}`}
                />
                <text
                  x={(spacingGap.x1 + spacingGap.x2) / 2}
                  y={spacingGap.y - 0.25}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.40)"
                  fontSize={0.3}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {margins}&quot;
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Legend: color mapping */}
      {colorMap.size > 1 && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {Array.from(colorMap.entries()).map(([label, ci]) => {
            const color = DESIGN_COLORS[ci];
            const count = designs.filter((d) => d.label === label).length;
            return (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block size-2.5 rounded-sm border"
                  style={{
                    backgroundColor: color.fill,
                    borderColor: color.stroke,
                  }}
                />
                <span>
                  {label} <span className="text-foreground font-medium">&times;{count}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
