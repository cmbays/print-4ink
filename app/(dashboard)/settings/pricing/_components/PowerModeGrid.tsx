"use client";

import { useState, useMemo, useCallback, createContext, useContext } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CostBreakdownTooltip } from "@/components/features/CostBreakdownTooltip";
import { cn } from "@/lib/utils";
import {
  buildFullMatrixData,
  formatCurrency,
} from "@/lib/pricing-engine";
import type {
  PricingTemplate,
  MarginIndicator,
  MarginBreakdown,
} from "@/lib/schemas/price-matrix";
import { useSpreadsheetEditor } from "@/lib/hooks/useSpreadsheetEditor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Grid3x3, X, ToggleRight, ToggleLeft, Settings2, Minus, Plus } from "lucide-react";

const dotColors: Record<MarginIndicator, string> = {
  healthy: "bg-success",
  caution: "bg-warning",
  unprofitable: "bg-error",
};

interface MatrixRow {
  tierIndex: number;
  tierLabel: string;
  cells: { price: number; margin: MarginBreakdown }[];
}

interface PowerModeGridProps {
  template: PricingTemplate;
  garmentBaseCost: number;
  onCellEdit: (tierIndex: number, colIndex: number, newPrice: number) => void;
  onBulkEdit: (cells: Array<{ row: number; col: number }>, value: number) => void;
  onMaxColorsChange: (maxColors: number) => void;
}

// ---------------------------------------------------------------------------
// Context — passes spreadsheet interaction state to PriceCell without
// coupling column definitions to mutable state. This prevents TanStack from
// recreating cell DOM elements on every keystroke (which was destroying the
// edit input and losing focus).
// ---------------------------------------------------------------------------

type SpreadsheetState = ReturnType<typeof useSpreadsheetEditor>;
const SpreadsheetCtx = createContext<SpreadsheetState | null>(null);

// ---------------------------------------------------------------------------
// PriceCell — reads interaction state from context, not column closure.
// Column definitions stay stable → TanStack preserves DOM → focus preserved.
// ---------------------------------------------------------------------------

function PriceCell({
  rowIdx,
  colIdx,
  cell,
}: {
  rowIdx: number;
  colIdx: number;
  cell: { price: number; margin: MarginBreakdown };
}) {
  const {
    editingCell, focusedCell, selectedCells, isManualEditOn,
    editValue, setEditValue, editInputRef, editInputKeyDown,
    handleEditBlur, handleCellMouseDown, handleCellMouseEnter,
    handleCellMouseUp, handleCellDoubleClick,
  } = useContext(SpreadsheetCtx)!;

  const key = `${rowIdx}-${colIdx}`;
  const isEditing =
    editingCell?.row === rowIdx && editingCell?.col === colIdx;
  const isFocused =
    focusedCell?.row === rowIdx && focusedCell?.col === colIdx;
  const isSelected = selectedCells.has(key);

  if (isEditing) {
    return (
      <input
        ref={editInputRef}
        inputMode="decimal"
        pattern="[0-9.]*"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={editInputKeyDown}
        onBlur={handleEditBlur}
        className="h-7 w-20 rounded-md border-0 bg-surface text-center text-xs tabular-nums ring-2 ring-action outline-none"
      />
    );
  }

  return (
    <CostBreakdownTooltip breakdown={cell.margin}>
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 rounded px-2 py-1 transition-colors select-none",
          isManualEditOn && "cursor-pointer",
          isFocused && !isSelected && "ring-2 ring-action",
          isSelected && "bg-action/10",
          isFocused && isSelected && "ring-2 ring-action bg-action/10",
          isManualEditOn && !isFocused && !isSelected && "hover:bg-action/5"
        )}
        onMouseDown={(e) => handleCellMouseDown(rowIdx, colIdx, e)}
        onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
        onMouseUp={() => handleCellMouseUp(rowIdx, colIdx)}
        onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
      >
        <span
          className={cn(
            "inline-block size-1.5 shrink-0 rounded-full",
            dotColors[cell.margin.indicator]
          )}
          role="img"
          aria-label={`Margin: ${Math.round(cell.margin.percentage * 10) / 10}%`}
        />
        <span className="text-foreground tabular-nums">
          {formatCurrency(cell.price)}
        </span>
      </div>
    </CostBreakdownTooltip>
  );
}

// ---------------------------------------------------------------------------
// Column builder — creates columns for a given maxColors count.
// NO interaction state in closures. PriceCell reads state from context.
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<MatrixRow>();

function buildColumns(maxColors: number) {
  return [
    columnHelper.accessor("tierLabel", {
      header: "Qty Tier",
      cell: (info) => (
        <span className="font-medium text-foreground whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
      enableSorting: false,
    }),
    ...Array.from({ length: maxColors }, (_, colIdx) => {
      const colorCount = colIdx + 1;
      return columnHelper.accessor((row) => row.cells[colIdx]?.price ?? 0, {
        id: `color-${colorCount}`,
        header: () => `${colorCount} ${colorCount === 1 ? "Color" : "Colors"}`,
        cell: (info) => {
          const cell = info.row.original.cells[colIdx];
          if (!cell) return null;
          return <PriceCell rowIdx={info.row.index} colIdx={colIdx} cell={cell} />;
        },
        enableSorting: false,
      });
    }),
  ];
}

// ---------------------------------------------------------------------------
// PowerModeGrid — thin rendering layer over useSpreadsheetEditor
// ---------------------------------------------------------------------------

export function PowerModeGrid({
  template,
  garmentBaseCost,
  onCellEdit,
  onBulkEdit,
  onMaxColorsChange,
}: PowerModeGridProps) {
  const [bulkValue, setBulkValue] = useState("");

  const maxColors = template.matrix.maxColors ?? 8;

  const matrixData: MatrixRow[] = useMemo(
    () =>
      buildFullMatrixData(template, garmentBaseCost).map((row, i) => ({
        tierIndex: i,
        tierLabel: row.tierLabel,
        cells: row.cells,
      })),
    [template, garmentBaseCost]
  );

  const columns = useMemo(() => buildColumns(maxColors), [maxColors]);

  const getCellValue = useCallback(
    (row: number, col: number) => matrixData[row]?.cells[col]?.price ?? 0,
    [matrixData]
  );

  const ss = useSpreadsheetEditor({
    rowCount: matrixData.length,
    colCount: maxColors,
    getCellValue,
    onCellEdit,
    onBulkEdit,
  });

  const { applyBulkValue } = ss;

  const handleBulkApply = useCallback(() => {
    const price = parseFloat(bulkValue);
    if (isNaN(price) || price < 0) return;
    applyBulkValue(price);
    setBulkValue("");
  }, [bulkValue, applyBulkValue]);

  const table = useReactTable({
    data: matrixData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <SpreadsheetCtx.Provider value={ss}>
      <Card>
        <CardHeader className="pb-3">
          {/* Row 1: Title + legend (inline) + controls */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Title */}
            <div className="flex items-center gap-2">
              <Grid3x3 className="size-4 text-action" />
              <CardTitle className="text-base">Full Pricing Matrix</CardTitle>
            </div>

            {/* Legend — inline with title, tooltips explain each status */}
            <TooltipProvider skipDelayDuration={300}>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-success" />
                      Healthy
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    Margin is 30% or above — price comfortably covers costs
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-warning" />
                      Caution
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    Margin is 15–30% — covers costs but leaves little room for error
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-error" />
                      Unprofitable
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6}>
                    Margin is below 15% — may not cover ink, labor, and overhead
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bulk edit controls — visible when cells selected */}
            {ss.selectedCells.size > 1 && ss.isManualEditOn && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-elevated px-2 py-1">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {ss.selectedCells.size} cells
                </span>
                <div className="relative w-20">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    placeholder="0.00"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBulkApply();
                      if (e.key === "Escape") {
                        setBulkValue("");
                        ss.wrapperRef.current?.focus();
                      }
                    }}
                    className="h-6 pl-4 pr-1 text-xs"
                  />
                </div>
                <Button size="xs" className="h-6 text-xs" onClick={handleBulkApply} disabled={!bulkValue}>
                  Set
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-5"
                  onClick={ss.clearSelection}
                  aria-label="Clear selection"
                >
                  <X className="size-3" />
                </Button>
              </div>
            )}

            {/* Settings popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Settings2 className="size-3.5" />
                  {maxColors} Colors
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3" align="end">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Max Colors</p>
                  <p className="text-xs text-muted-foreground">
                    Number of color columns in the matrix (1–12).
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="size-6"
                      disabled={maxColors <= 1}
                      onClick={() => onMaxColorsChange(maxColors - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {maxColors}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="size-6"
                      disabled={maxColors >= 12}
                      onClick={() => onMaxColorsChange(maxColors + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Manual Edit toggle */}
            <Button
              variant={ss.isManualEditOn ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={ss.toggleManualEdit}
            >
              {ss.isManualEditOn ? (
                <ToggleRight className="size-3.5" />
              ) : (
                <ToggleLeft className="size-3.5" />
              )}
              Manual Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Grid wrapper — captures keyboard events for the entire spreadsheet */}
          <div
            ref={ss.wrapperRef}
            role="grid"
            aria-label="Pricing matrix spreadsheet"
            className={cn(
              "overflow-x-auto outline-none",
              ss.isDragging && "cursor-crosshair"
            )}
            tabIndex={ss.isManualEditOn ? 0 : undefined}
            onKeyDown={ss.handleTableKeyDown}
          >
            <table className="w-full border-collapse text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, headerIdx) => {
                      // colIdx for color columns: header 0 is "Qty Tier", 1..N are colors
                      const colIdx = headerIdx - 1;
                      const isColorHeader = header.id.startsWith("color-");
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "border border-border bg-surface px-3 py-2 font-medium text-muted-foreground",
                            header.id === "tierLabel"
                              ? "text-left"
                              : "text-center",
                            isColorHeader && ss.isManualEditOn && "cursor-pointer select-none hover:bg-action/5 hover:text-action transition-colors"
                          )}
                          onClick={() => {
                            if (!isColorHeader || !ss.isManualEditOn) return;
                            ss.selectColumn(colIdx);
                          }}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              header.id !== "tierLabel" && "justify-center"
                            )}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <tr key={row.id} className={cn(
                    "hover:bg-action/[0.03] transition-colors",
                    rowIndex % 2 === 1 && "bg-surface/30"
                  )}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "border border-border px-3 py-2 transition-colors",
                          cell.column.id === "tierLabel"
                            ? "bg-surface"
                            : "text-center"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </SpreadsheetCtx.Provider>
  );
}
