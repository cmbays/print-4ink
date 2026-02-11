"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
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
import { Grid3x3, ArrowUp, ArrowDown, X } from "lucide-react";

const COLOR_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const dotColors: Record<MarginIndicator, string> = {
  healthy: "bg-success",
  caution: "bg-warning",
  unprofitable: "bg-error",
};

// Row data shape for TanStack Table
interface MatrixRow {
  tierIndex: number;
  tierLabel: string;
  cells: { price: number; margin: MarginBreakdown }[];
}

interface PowerModeGridProps {
  template: PricingTemplate;
  garmentBaseCost: number;
  onCellEdit: (tierIndex: number, colorCount: number, newPrice: number) => void;
}

const columnHelper = createColumnHelper<MatrixRow>();

function cellKey(row: number, col: number) {
  return `${row}-${col}`;
}

export function PowerModeGrid({
  template,
  garmentBaseCost,
  onCellEdit,
}: PowerModeGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionAnchor, setSelectionAnchor] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [bulkValue, setBulkValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Build matrix data
  const matrixData: MatrixRow[] = useMemo(
    () =>
      buildFullMatrixData(template, garmentBaseCost).map((row, i) => ({
        tierIndex: i,
        tierLabel: row.tierLabel,
        cells: row.cells,
      })),
    [template, garmentBaseCost]
  );

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Start editing a cell
  const startEditing = useCallback(
    (rowIdx: number, colIdx: number, currentPrice: number) => {
      setEditingCell({ row: rowIdx, col: colIdx });
      setEditValue(currentPrice.toFixed(2));
    },
    []
  );

  // Commit an edit
  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const newPrice = parseFloat(editValue);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const colorCount = editingCell.col + 1;
      onCellEdit(editingCell.row, colorCount, newPrice);
    }
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, onCellEdit]);

  // Cancel an edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // Handle cell click (selection + editing)
  const handleCellClick = useCallback(
    (
      rowIdx: number,
      colIdx: number,
      currentPrice: number,
      e: React.MouseEvent
    ) => {
      if (e.shiftKey && selectionAnchor) {
        // Range select
        const minRow = Math.min(selectionAnchor.row, rowIdx);
        const maxRow = Math.max(selectionAnchor.row, rowIdx);
        const minCol = Math.min(selectionAnchor.col, colIdx);
        const maxCol = Math.max(selectionAnchor.col, colIdx);

        const newSelection = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(cellKey(r, c));
          }
        }
        setSelectedCells(newSelection);
      } else if (e.detail === 2) {
        // Double-click to edit
        startEditing(rowIdx, colIdx, currentPrice);
        setSelectedCells(new Set());
      } else {
        // Single click — select single cell and set anchor
        setSelectedCells(new Set([cellKey(rowIdx, colIdx)]));
        setSelectionAnchor({ row: rowIdx, col: colIdx });
      }
    },
    [selectionAnchor, startEditing]
  );

  // Apply bulk edit
  const applyBulkEdit = useCallback(() => {
    const price = parseFloat(bulkValue);
    if (isNaN(price) || price < 0) return;

    selectedCells.forEach((key) => {
      const [rowStr, colStr] = key.split("-");
      const rowIdx = parseInt(rowStr, 10);
      const colIdx = parseInt(colStr, 10);
      const colorCount = colIdx + 1;
      onCellEdit(rowIdx, colorCount, price);
    });

    setSelectedCells(new Set());
    setSelectionAnchor(null);
    setBulkValue("");
  }, [bulkValue, selectedCells, onCellEdit]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setSelectionAnchor(null);
  }, []);

  // Build TanStack columns
  const columns = useMemo(
    () => [
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
            const rowIdx = info.row.index;
            const cell = info.row.original.cells[colIdx];
            if (!cell) return null;

            const isEditing =
              editingCell?.row === rowIdx && editingCell?.col === colIdx;
            const isSelected = selectedCells.has(cellKey(rowIdx, colIdx));

            if (isEditing) {
              return (
                <Input
                  ref={editInputRef}
                  type="number"
                  step={0.01}
                  min={0}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={commitEdit}
                  className="h-7 w-20 text-center text-xs tabular-nums ring-2 ring-action bg-surface"
                />
              );
            }

            return (
              <CostBreakdownTooltip breakdown={cell.margin}>
                <div
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded px-2 py-1 cursor-pointer transition-colors",
                    isSelected && "ring-2 ring-action/50 bg-action/5"
                  )}
                  onClick={(e) =>
                    handleCellClick(rowIdx, colIdx, cell.price, e)
                  }
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditing(rowIdx, colIdx, cell.price);
                    setSelectedCells(new Set());
                  }}
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
          },
          sortingFn: "basic",
        })
      ),
    ],
    [
      editingCell,
      editValue,
      selectedCells,
      commitEdit,
      cancelEdit,
      handleCellClick,
      startEditing,
    ]
  );

  const table = useReactTable({
    data: matrixData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Full Pricing Matrix</CardTitle>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Click a cell to select, double-click to edit. Shift+click to select a
          range. Click column headers to sort.
        </p>
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

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "border border-border bg-surface px-3 py-2 font-medium text-muted-foreground",
                        header.id === "tierLabel"
                          ? "text-left"
                          : "text-center",
                        header.column.getCanSort() && "cursor-pointer select-none hover:bg-surface/80"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
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
                        {header.column.getIsSorted() === "asc" && (
                          <ArrowUp className="size-3" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ArrowDown className="size-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface/50">
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

        {/* Bulk edit toolbar */}
        {selectedCells.size > 1 && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-elevated p-3 shadow-lg">
            <span className="text-xs text-muted-foreground">
              {selectedCells.size} cells selected
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Set all to</span>
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step={0.01}
                  min={0}
                  placeholder="0.00"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyBulkEdit();
                  }}
                  className="h-7 pl-5 text-xs"
                />
              </div>
              <Button size="xs" onClick={applyBulkEdit} disabled={!bulkValue}>
                Apply
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
