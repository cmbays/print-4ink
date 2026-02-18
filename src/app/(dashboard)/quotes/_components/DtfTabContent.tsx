'use client'

import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@shared/ui/primitives/button'
import { DtfLineItemRow } from './DtfLineItemRow'
import { DTF_SIZE_PRESETS } from '@domain/rules/dtf.rules'
import { getDtfSheetTiersSync } from '@infra/repositories/settings'
import { SheetCalculationPanel } from './SheetCalculationPanel'
import { GangSheetCanvas } from './GangSheetCanvas'
import type { DtfLineItem } from '@domain/entities/dtf-line-item'
import type { SheetCalculation, CanvasLayout } from '@domain/entities/dtf-sheet-calculation'

const DTF_SHEET_TIERS = getDtfSheetTiersSync()

type DtfTabContentProps = {
  lineItems: DtfLineItem[]
  setLineItems: React.Dispatch<React.SetStateAction<DtfLineItem[]>>
  sheetCalculation: SheetCalculation | null
  splitMode: 'combine' | 'split'
  setSplitMode: React.Dispatch<React.SetStateAction<'combine' | 'split'>>
  packMode: 'tight' | 'clean'
  setPackMode: React.Dispatch<React.SetStateAction<'tight' | 'clean'>>
  canvasLayout: CanvasLayout[] | null
  activeSheetIndex: number
  setActiveSheetIndex: React.Dispatch<React.SetStateAction<number>>
  setSheetCalculation: React.Dispatch<React.SetStateAction<SheetCalculation | null>>
  setCanvasLayout: React.Dispatch<React.SetStateAction<CanvasLayout[] | null>>
}

// Default to Small preset resolved dimensions
const DEFAULT_PRESET = DTF_SIZE_PRESETS[0] // Small: 4x4

export function DtfTabContent({
  lineItems,
  setLineItems,
  sheetCalculation,
  splitMode,
  setSplitMode,
  packMode,
  setPackMode,
  canvasLayout,
  activeSheetIndex,
  setActiveSheetIndex,
  setSheetCalculation,
  setCanvasLayout,
}: DtfTabContentProps) {
  // N43 — addDtfLineItem
  const handleAddLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        artworkName: '',
        shape: 'box' as const,
        width: DEFAULT_PRESET.width,
        height: DEFAULT_PRESET.height,
        quantity: 1,
        sizePreset: 'small',
      },
    ])
  }, [setLineItems])

  // N44 — removeDtfLineItem
  const handleRemoveLineItem = useCallback(
    (id: string) => {
      setLineItems((prev) => prev.filter((item) => item.id !== id))
    },
    [setLineItems]
  )

  // N45 — updateDtfLineItem
  const handleUpdateLineItem = useCallback(
    (id: string, field: keyof DtfLineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      )
    },
    [setLineItems]
  )

  return (
    <div className="space-y-4">
      {/* U71 — DTF line item list */}
      <div className="space-y-3">
        {lineItems.map((item) => (
          <DtfLineItemRow
            key={item.id}
            item={item}
            onUpdate={handleUpdateLineItem}
            onRemove={handleRemoveLineItem}
            canRemove={lineItems.length > 1}
          />
        ))}
      </div>

      {/* U72 — Add Design button */}
      <Button type="button" variant="outline" onClick={handleAddLineItem} className="w-full">
        <Plus size={16} className="mr-2" />
        Add Design
      </Button>

      {/* U82-U87 — Sheet Calculation Panel (Wave 3) — includes subtotal in summary row */}
      <SheetCalculationPanel
        lineItems={lineItems}
        sheetCalculation={sheetCalculation}
        setSheetCalculation={setSheetCalculation}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        packMode={packMode}
        setPackMode={setPackMode}
        setCanvasLayout={setCanvasLayout}
        setActiveSheetIndex={setActiveSheetIndex}
        tiers={DTF_SHEET_TIERS}
      />

      {/* U88-U92 — Gang Sheet Canvas (Wave 4) */}
      {canvasLayout && canvasLayout.length > 0 && sheetCalculation && (
        <GangSheetCanvas
          canvasLayout={canvasLayout}
          activeSheetIndex={activeSheetIndex}
          setActiveSheetIndex={setActiveSheetIndex}
        />
      )}
    </div>
  )
}
