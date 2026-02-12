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
import { Grid3x3, X, ToggleRight, ToggleLeft } from "lucide-react";

const COLOR_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

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
// Stable column definitions — defined at module level, NO interaction state.
// PriceCell reads state from SpreadsheetCtx at render time.
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<MatrixRow>();

const stableColumns = [
  columnHelper.accessor("tierLabel", {
    header: "Qty Tier",
    cell: (info) => (
      <span className="font-medium text-foreground whitespace-nowrap">
        {info.getValue()}
      </span>
    ),
    enableSorting: false,
  }),
  ...COLOR_COLUMNS.map((colorCount, colIdx) =>
    columnHelper.accessor((row) => row.cells[colIdx]?.price ?? 0, {
      id: `color-${colorCount}`,
      header: () => `${colorCount} ${colorCount === 1 ? "Color" : "Colors"}`,
      cell: (info) => {
        const cell = info.row.original.cells[colIdx];
        if (!cell) return null;
        return <PriceCell rowIdx={info.row.index} colIdx={colIdx} cell={cell} />;
      },
      enableSorting: false,
    })
  ),
];

// ---------------------------------------------------------------------------
// PowerModeGrid — thin rendering layer over useSpreadsheetEditor
// ---------------------------------------------------------------------------

export function PowerModeGrid({
  template,
  garmentBaseCost,
  onCellEdit,
  onBulkEdit,
}: PowerModeGridProps) {
  const [bulkValue, setBulkValue] = useState("");

  const matrixData: MatrixRow[] = useMemo(
    () =>
      buildFullMatrixData(template, garmentBaseCost).map((row, i) => ({
        tierIndex: i,
        tierLabel: row.tierLabel,
        cells: row.cells,
      })),
    [template, garmentBaseCost]
  );

  const getCellValue = useCallback(
    (row: number, col: number) => matrixData[row]?.cells[col]?.price ?? 0,
    [matrixData]
  );

  const ss = useSpreadsheetEditor({
    rowCount: matrixData.length,
    colCount: COLOR_COLUMNS.length,
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
    columns: stableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <SpreadsheetCtx.Provider value={ss}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Grid3x3 className="size-4 text-action" />
              <CardTitle className="text-base">Full Pricing Matrix</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Inline bulk edit controls — visible when cells are selected */}
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-success" />
              Healthy (&ge;30%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-warning" />
              Caution (15&ndash;30%)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-error" />
              Unprofitable (&lt;15%)
            </div>
          </div>

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
                      // colIdx for color columns: header 0 is "Qty Tier", 1..8 are colors
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
