'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CellPosition = {
  row: number
  col: number
}

type EditMode = 'replace' | 'cursor'

export type UseSpreadsheetEditorProps = {
  rowCount: number
  colCount: number
  getCellValue: (row: number, col: number) => number
  onCellEdit: (row: number, col: number, value: number) => void
  onBulkEdit: (cells: Array<{ row: number; col: number }>, value: number) => void
  /** When provided, manual-edit state is externally controlled by the parent. */
  externalManualEdit?: { isOn: boolean; onToggle: () => void }
}

function cellKey(row: number, col: number) {
  return `${row}-${col}`
}

function parseCellKey(key: string): CellPosition {
  const [row, col] = key.split('-').map(Number)
  return { row, col }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpreadsheetEditor({
  rowCount,
  colCount,
  getCellValue,
  onCellEdit,
  onBulkEdit,
  externalManualEdit,
}: UseSpreadsheetEditorProps) {
  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null)
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('replace')
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [selectionAnchor, setSelectionAnchor] = useState<CellPosition | null>(null)
  const [_internalManualEdit, _setInternalManualEdit] = useState(false)
  const isManualEditOn = externalManualEdit ? externalManualEdit.isOn : _internalManualEdit
  const [editValue, setEditValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const editInputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Guard: when a keyboard handler commits, skip the subsequent blur commit
  const skipNextBlur = useRef(false)
  // Guard: track whether mouse actually moved to a different cell during drag
  const dragDidMove = useRef(false)
  // Ref mirror of editingCell — checked in rAF callbacks to avoid stale closures
  const editingCellRef = useRef<CellPosition | null>(null)
  editingCellRef.current = editingCell
  // Guard: when type-to-replace starts with an initialChar, skip select() so
  // subsequent keystrokes append instead of replacing the first character.
  const skipSelect = useRef(false)

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      if (editMode === 'replace' && !skipSelect.current) {
        editInputRef.current.select()
      }
      skipSelect.current = false
    }
  }, [editingCell, editMode])

  // When editing ends and we have a focused cell, re-focus the wrapper div
  // so keyboard events keep flowing to handleTableKeyDown.
  // Uses editingCellRef in the rAF callback to avoid a stale-closure race:
  // mouseDown schedules rAF, then dblclick sets editingCell before rAF fires.
  useEffect(() => {
    if (!editingCell && focusedCell && isManualEditOn) {
      requestAnimationFrame(() => {
        if (!editingCellRef.current) {
          wrapperRef.current?.focus()
        }
      })
    }
  }, [editingCell, focusedCell, isManualEditOn])

  // Document-level mouseup listener to end drag
  useEffect(() => {
    if (!isDragging) return
    const handleUp = () => {
      setIsDragging(false)
    }
    document.addEventListener('mouseup', handleUp)
    return () => document.removeEventListener('mouseup', handleUp)
  }, [isDragging])

  // -- Helpers ---------------------------------------------------------------

  const clampRow = useCallback((r: number) => Math.max(0, Math.min(r, rowCount - 1)), [rowCount])
  const clampCol = useCallback((c: number) => Math.max(0, Math.min(c, colCount - 1)), [colCount])

  // -- Commit / Cancel -------------------------------------------------------

  const commitEdit = useCallback(() => {
    if (!editingCell) return
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed) && parsed >= 0) {
      if (pendingBulkCells.current && pendingBulkCells.current.size > 0) {
        // Bulk commit: apply to all cells that were selected when typing started
        const cells = Array.from(pendingBulkCells.current).map(parseCellKey)
        onBulkEdit(cells, parsed)
      } else {
        onCellEdit(editingCell.row, editingCell.col, parsed)
      }
    }
    const pos = { ...editingCell }
    pendingBulkCells.current = null
    setEditingCell(null)
    setEditValue('')
    setEditMode('replace')
    setSelectedCells(new Set())
    return pos
  }, [editingCell, editValue, onCellEdit, onBulkEdit])

  const cancelEdit = useCallback(() => {
    pendingBulkCells.current = null
    setEditingCell(null)
    setEditValue('')
    setEditMode('replace')
  }, [])

  // Called by the <input> onBlur — skips if a keyboard handler already committed
  const handleEditBlur = useCallback(() => {
    if (skipNextBlur.current) {
      skipNextBlur.current = false
      return
    }
    commitEdit()
  }, [commitEdit])

  // Keyboard-driven commit: sets the skip flag so blur doesn't double-fire
  const keyboardCommit = useCallback(() => {
    skipNextBlur.current = true
    return commitEdit()
  }, [commitEdit])

  const keyboardCancel = useCallback(() => {
    skipNextBlur.current = true
    cancelEdit()
  }, [cancelEdit])

  // -- Start editing ---------------------------------------------------------

  const startReplaceEdit = useCallback(
    (row: number, col: number, initialChar?: string) => {
      if (initialChar !== undefined) skipSelect.current = true
      setEditingCell({ row, col })
      setEditMode('replace')
      setEditValue(initialChar ?? getCellValue(row, col).toFixed(2))
      setSelectedCells(new Set())
    },
    [getCellValue]
  )

  // Bulk type-to-replace: when multiple cells are selected and the user types,
  // open an edit input on the focused cell but remember the selection so we can
  // apply the final value to all selected cells on commit.
  const pendingBulkCells = useRef<Set<string> | null>(null)

  const startBulkReplaceEdit = useCallback(
    (row: number, col: number, initialChar: string, cells: Set<string>) => {
      skipSelect.current = true
      pendingBulkCells.current = cells
      setEditingCell({ row, col })
      setEditMode('replace')
      setEditValue(initialChar)
      // Keep selection visible while editing
    },
    []
  )

  const startCursorEdit = useCallback(
    (row: number, col: number) => {
      setEditingCell({ row, col })
      setEditMode('cursor')
      setEditValue(getCellValue(row, col).toFixed(2))
      setSelectedCells(new Set())
    },
    [getCellValue]
  )

  // -- Navigation helpers ----------------------------------------------------

  const moveFocus = useCallback(
    (dr: number, dc: number, extend?: boolean) => {
      setFocusedCell((prev) => {
        if (!prev) return { row: 0, col: 0 }
        let newRow = prev.row + dr
        let newCol = prev.col + dc
        // Tab wrapping
        if (dc !== 0 && newCol >= colCount) {
          newCol = 0
          newRow = Math.min(newRow + 1, rowCount - 1)
        } else if (dc !== 0 && newCol < 0) {
          newCol = colCount - 1
          newRow = Math.max(newRow - 1, 0)
        }
        return { row: clampRow(newRow), col: clampCol(newCol) }
      })
      if (!extend) {
        setSelectedCells(new Set())
      }
    },
    [colCount, rowCount, clampRow, clampCol]
  )

  // Shift+Arrow: extend rectangular selection from anchor to new focus
  const extendSelection = useCallback(
    (dr: number, dc: number) => {
      if (!focusedCell) return
      const newRow = clampRow(focusedCell.row + dr)
      const newCol = clampCol(focusedCell.col + dc)
      setFocusedCell({ row: newRow, col: newCol })
      // Use selectionAnchor if set, otherwise anchor from current focused cell
      const anchor = selectionAnchor ?? focusedCell
      if (!selectionAnchor) setSelectionAnchor(focusedCell)
      const minRow = Math.min(anchor.row, newRow)
      const maxRow = Math.max(anchor.row, newRow)
      const minCol = Math.min(anchor.col, newCol)
      const maxCol = Math.max(anchor.col, newCol)
      const sel = new Set<string>()
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          sel.add(cellKey(r, c))
        }
      }
      setSelectedCells(sel)
    },
    [focusedCell, selectionAnchor, clampRow, clampCol]
  )

  // -- Clipboard -------------------------------------------------------------

  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0 && !focusedCell) return

    const cells =
      selectedCells.size > 0
        ? Array.from(selectedCells).map(parseCellKey)
        : focusedCell
          ? [focusedCell]
          : []

    if (cells.length === 0) return

    cells.sort((a, b) => a.row - b.row || a.col - b.col)

    const minRow = Math.min(...cells.map((c) => c.row))
    const maxRow = Math.max(...cells.map((c) => c.row))

    const lines: string[] = []
    for (let r = minRow; r <= maxRow; r++) {
      const rowCells = cells.filter((c) => c.row === r).sort((a, b) => a.col - b.col)
      lines.push(rowCells.map((c) => getCellValue(c.row, c.col).toFixed(2)).join('\t'))
    }

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      toast.success(`Copied ${cells.length} cell${cells.length > 1 ? 's' : ''}`)
    })
  }, [selectedCells, focusedCell, getCellValue])

  const handlePaste = useCallback(async () => {
    if (!focusedCell && selectedCells.size === 0) return

    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      toast.error('Cannot access clipboard')
      return
    }

    const rows = text
      .trim()
      .split('\n')
      .map((line) => {
        if (line.includes('\t')) return line.split('\t')
        return line.split(',')
      })

    const pasteRows = rows.length
    const pasteCols = Math.max(...rows.map((r) => r.length))

    const values: number[][] = []
    for (const row of rows) {
      const parsed: number[] = []
      for (const cell of row) {
        const num = parseFloat(cell.trim().replace(/^\$/, ''))
        if (isNaN(num) || num < 0) {
          toast.error('Cannot paste: values must be numbers')
          return
        }
        parsed.push(num)
      }
      values.push(parsed)
    }

    let startRow: number
    let startCol: number

    if (selectedCells.size > 0) {
      const selArr = Array.from(selectedCells).map(parseCellKey)
      const selMinRow = Math.min(...selArr.map((c) => c.row))
      const selMaxRow = Math.max(...selArr.map((c) => c.row))
      const selMinCol = Math.min(...selArr.map((c) => c.col))
      const selMaxCol = Math.max(...selArr.map((c) => c.col))
      const selRows = selMaxRow - selMinRow + 1
      const selCols = selMaxCol - selMinCol + 1

      if (pasteRows !== selRows || pasteCols !== selCols) {
        toast.error(
          `Cannot paste: clipboard has ${pasteRows}\u00d7${pasteCols} cells but selection is ${selRows}\u00d7${selCols}`
        )
        return
      }
      startRow = selMinRow
      startCol = selMinCol
    } else if (focusedCell) {
      startRow = focusedCell.row
      startCol = focusedCell.col
    } else {
      return
    }

    let count = 0
    for (let r = 0; r < pasteRows; r++) {
      for (let c = 0; c < pasteCols; c++) {
        const tr = startRow + r
        const tc = startCol + c
        if (tr < rowCount && tc < colCount && values[r]?.[c] !== undefined) {
          onCellEdit(tr, tc, values[r][c])
          count++
        }
      }
    }

    toast.success(`Pasted ${count} cell${count > 1 ? 's' : ''}`)
  }, [focusedCell, selectedCells, rowCount, colCount, onCellEdit])

  const handleSelectAll = useCallback(() => {
    const all = new Set<string>()
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        all.add(cellKey(r, c))
      }
    }
    setSelectedCells(all)
  }, [rowCount, colCount])

  const selectColumn = useCallback(
    (col: number) => {
      const sel = new Set<string>()
      for (let r = 0; r < rowCount; r++) {
        sel.add(cellKey(r, col))
      }
      setSelectedCells(sel)
      setFocusedCell({ row: 0, col })
      setSelectionAnchor({ row: 0, col })
    },
    [rowCount]
  )

  // -- Edit input keydown handler (attached directly to the <input>) ---------
  // This runs on the input element itself — no bubbling needed.

  const commitAndMove = useCallback(
    (dr: number, dc: number) => {
      const pos = keyboardCommit()
      if (!pos) return
      let newRow = pos.row + dr
      let newCol = pos.col + dc
      // Tab wrapping
      if (dc !== 0 && newCol >= colCount) {
        newCol = 0
        newRow = clampRow(newRow + 1)
      }
      if (dc !== 0 && newCol < 0) {
        newCol = colCount - 1
        newRow = clampRow(newRow - 1)
      }
      setFocusedCell({ row: clampRow(newRow), col: clampCol(newCol) })
    },
    [keyboardCommit, colCount, clampRow, clampCol]
  )

  const editInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Replace edit mode: all navigation keys commit and move
      if (editMode === 'replace') {
        switch (e.key) {
          case 'Enter':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, 1)
            return
          case 'Tab':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, e.shiftKey ? -1 : 1)
            return
          case 'Escape':
            e.preventDefault()
            e.stopPropagation()
            keyboardCancel()
            return
          case 'ArrowUp':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(-1, 0)
            return
          case 'ArrowDown':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(1, 0)
            return
          case 'ArrowLeft':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, -1)
            return
          case 'ArrowRight':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, 1)
            return
        }
        return
      }

      // Cursor edit mode: arrow keys move within text, only Enter/Escape/Tab exit
      if (editMode === 'cursor') {
        switch (e.key) {
          case 'Enter':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, 1)
            return
          case 'Tab':
            e.preventDefault()
            e.stopPropagation()
            commitAndMove(0, e.shiftKey ? -1 : 1)
            return
          case 'Escape':
            e.preventDefault()
            e.stopPropagation()
            keyboardCancel()
            return
        }
        // Other keys (arrows, typing) pass through to the native input
      }
    },
    [editMode, commitAndMove, keyboardCancel]
  )

  // -- Table keydown handler (wrapper div — navigate mode only) -------------

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isManualEditOn) return

      // If editing, the editInputKeyDown handler on the input handles keys.
      // This handler only fires for the wrapper div (navigate mode).
      if (editingCell) return

      const isCmd = e.metaKey || e.ctrlKey

      // Clipboard shortcuts
      if (isCmd) {
        if (e.key === 'c') {
          e.preventDefault()
          handleCopy()
          return
        }
        if (e.key === 'v') {
          e.preventDefault()
          handlePaste()
          return
        }
        if (e.key === 'a') {
          e.preventDefault()
          handleSelectAll()
          return
        }
      }

      // ----- Navigate mode -----
      if (!focusedCell) return

      // Cmd+Enter: toggle focused cell in multi-select
      if (isCmd && e.key === 'Enter') {
        e.preventDefault()
        const key = cellKey(focusedCell.row, focusedCell.col)
        setSelectedCells((prev) => {
          const next = new Set(prev)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
        return
      }

      // Shift+Arrow: extend rectangular selection
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const dirs: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        }
        const [dr, dc] = dirs[e.key]
        extendSelection(dr, dc)
        return
      }

      // Cmd+Arrow: move focus without clearing selection (for Cmd+Enter toggling)
      if (isCmd && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const dirs: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        }
        const [dr, dc] = dirs[e.key]
        moveFocus(dr, dc, true)
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          moveFocus(-1, 0)
          return
        case 'ArrowDown':
          e.preventDefault()
          moveFocus(1, 0)
          return
        case 'ArrowLeft':
          e.preventDefault()
          moveFocus(0, -1)
          return
        case 'ArrowRight':
          e.preventDefault()
          moveFocus(0, 1)
          return
        case 'Tab':
          e.preventDefault()
          moveFocus(0, e.shiftKey ? -1 : 1)
          return
        case 'Enter':
          e.preventDefault()
          startReplaceEdit(focusedCell.row, focusedCell.col)
          return
        case 'Escape':
          e.preventDefault()
          setSelectedCells(new Set())
          setSelectionAnchor(null)
          return
        case 'Backspace':
        case 'Delete':
          e.preventDefault()
          if (selectedCells.size > 1) {
            startBulkReplaceEdit(focusedCell.row, focusedCell.col, '', selectedCells)
          } else {
            startReplaceEdit(focusedCell.row, focusedCell.col, '')
          }
          return
      }

      // Type-to-replace: digits, dot, dollar sign
      if (/^[0-9.$]$/.test(e.key) && !isCmd) {
        e.preventDefault()
        const char = e.key === '$' ? '' : e.key
        if (selectedCells.size > 1) {
          // Multi-select: bulk replace all selected cells
          startBulkReplaceEdit(focusedCell.row, focusedCell.col, char, selectedCells)
        } else {
          startReplaceEdit(focusedCell.row, focusedCell.col, char)
        }
        return
      }
    },
    [
      isManualEditOn,
      editingCell,
      focusedCell,
      selectedCells,
      moveFocus,
      extendSelection,
      startReplaceEdit,
      startBulkReplaceEdit,
      handleCopy,
      handlePaste,
      handleSelectAll,
    ]
  )

  // -- Mouse handlers for cells ----------------------------------------------

  // Builds a rectangular selection from anchor to (row, col)
  const buildRangeSelection = useCallback((anchor: CellPosition, row: number, col: number) => {
    const minRow = Math.min(anchor.row, row)
    const maxRow = Math.max(anchor.row, row)
    const minCol = Math.min(anchor.col, col)
    const maxCol = Math.max(anchor.col, col)
    const sel = new Set<string>()
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        sel.add(cellKey(r, c))
      }
    }
    return sel
  }, [])

  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (!isManualEditOn) return
      if (e.button !== 0) return // left button only

      // Commit any pending edit before starting a new interaction
      if (editingCell) {
        skipNextBlur.current = true
        commitEdit()
      }

      const isCmd = e.metaKey || e.ctrlKey
      const key = cellKey(row, col)

      if (e.shiftKey && selectionAnchor) {
        // Shift+click: range select from anchor
        setSelectedCells(buildRangeSelection(selectionAnchor, row, col))
        setFocusedCell({ row, col })
      } else if (isCmd) {
        // Cmd+click: toggle cell in multi-select
        setSelectedCells((prev) => {
          const next = new Set(prev)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })
        setFocusedCell({ row, col })
        setSelectionAnchor({ row, col })
      } else {
        // Plain click: start potential drag
        setSelectionAnchor({ row, col })
        setSelectedCells(new Set([key]))
        setFocusedCell({ row, col })
        setIsDragging(true)
        dragDidMove.current = false
      }

      // Keep focus on the wrapper so keyboard events keep firing
      wrapperRef.current?.focus()
    },
    [isManualEditOn, editingCell, selectionAnchor, buildRangeSelection, commitEdit]
  )

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging || !selectionAnchor) return
      // If mouse entered a different cell, it's a drag
      if (row !== selectionAnchor.row || col !== selectionAnchor.col) {
        dragDidMove.current = true
      }
      setSelectedCells(buildRangeSelection(selectionAnchor, row, col))
      setFocusedCell({ row, col })
    },
    [isDragging, selectionAnchor, buildRangeSelection]
  )

  const handleCellMouseUp = useCallback(
    (row: number, col: number) => {
      if (!isManualEditOn) return
      setIsDragging(false)

      // If mouse didn't move (single click, not a drag):
      if (!dragDidMove.current) {
        // Click on an already-focused cell → start editing
        if (focusedCell?.row === row && focusedCell?.col === col) {
          // Was it already focused before this mousedown? Check if selection is just this one cell
          // (i.e., user clicked the same cell that was already focused)
          // We set focus in mouseDown, so we need a way to know if it was ALREADY focused.
          // Use a simple heuristic: if there's exactly 1 selected cell and it's this one,
          // and we're not in a multi-select scenario, start editing on the second click.
          // But since mouseDown already sets focus, every first click makes it "focused".
          // Solution: don't auto-start editing from single click. Use double-click for that.
        }
      }
    },
    [isManualEditOn, focusedCell]
  )

  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      if (!isManualEditOn) return
      startCursorEdit(row, col)
    },
    [isManualEditOn, startCursorEdit]
  )

  // -- Toggle ----------------------------------------------------------------

  const toggleManualEdit = useCallback(() => {
    // When turning off, clear all spreadsheet interaction state
    if (isManualEditOn) {
      setFocusedCell(null)
      setEditingCell(null)
      setSelectedCells(new Set())
      setSelectionAnchor(null)
      setEditValue('')
      setIsDragging(false)
    }

    if (externalManualEdit) {
      externalManualEdit.onToggle()
    } else {
      _setInternalManualEdit((prev) => !prev)
    }
  }, [isManualEditOn, externalManualEdit])

  // -- Selection management ---------------------------------------------------

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set())
    setSelectionAnchor(null)
  }, [])

  // -- Bulk apply from toolbar -----------------------------------------------

  const applyBulkValue = useCallback(
    (value: number) => {
      if (selectedCells.size === 0) return
      const cells = Array.from(selectedCells).map(parseCellKey)
      onBulkEdit(cells, value)
      setSelectedCells(new Set())
      setSelectionAnchor(null)
    },
    [selectedCells, onBulkEdit]
  )

  return {
    // State
    focusedCell,
    editingCell,
    editMode,
    selectedCells,
    isManualEditOn,
    editValue,
    setEditValue,
    isDragging,
    editInputRef,
    wrapperRef,

    // Handlers
    handleTableKeyDown,
    editInputKeyDown,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    handleCellDoubleClick,
    handleEditBlur,
    commitEdit,
    cancelEdit,
    toggleManualEdit,
    applyBulkValue,
    clearSelection,
    selectColumn,

    // Utilities
    cellKey,
    startReplaceEdit,
  }
}
