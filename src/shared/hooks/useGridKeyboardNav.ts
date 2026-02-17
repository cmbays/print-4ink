import { useCallback, type RefObject } from 'react'

/**
 * Keyboard arrow navigation for grid layouts (swatch grids, chip grids, etc.).
 * Supports ArrowRight/Left/Down/Up + Home/End.
 *
 * @param gridRef  - ref to the grid container element
 * @param selector - CSS selector for focusable items within the grid
 * @param itemWidth - approximate pixel width of one item (used to compute column count)
 */
export function useGridKeyboardNav(
  gridRef: RefObject<HTMLElement | null>,
  selector: string,
  itemWidth: number
) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const items = gridRef.current?.querySelectorAll<HTMLElement>(selector)
      if (!items || items.length === 0) return

      const active = document.activeElement as HTMLElement
      const currentIndex = Array.from(items).indexOf(active)
      if (currentIndex === -1) return

      const gridWidth = gridRef.current?.offsetWidth ?? 0
      const cols = Math.max(1, Math.floor(gridWidth / itemWidth))

      let nextIndex = currentIndex

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 1, items.length - 1)
          break
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 1, 0)
          break
        case 'ArrowDown':
          nextIndex = Math.min(currentIndex + cols, items.length - 1)
          break
        case 'ArrowUp':
          nextIndex = Math.max(currentIndex - cols, 0)
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = items.length - 1
          break
        default:
          return
      }

      e.preventDefault()
      items[nextIndex]?.focus()
    },
    // gridRef is stable (useRef), selector and itemWidth are caller constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selector, itemWidth]
  )
}
