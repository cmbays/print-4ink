'use client'

import { useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function useColorFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const selectedColorIds = useMemo(() => {
    const p = searchParams.get('colors') ?? ''
    return p ? p.split(',').filter(Boolean) : []
  }, [searchParams])

  const updateColorsParam = useCallback(
    (colorIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (colorIds.length === 0) {
        params.delete('colors')
      } else {
        params.set('colors', colorIds.join(','))
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const toggleColor = useCallback(
    (colorId: string) => {
      const next = selectedColorIds.includes(colorId)
        ? selectedColorIds.filter((id) => id !== colorId)
        : [...selectedColorIds, colorId]
      updateColorsParam(next)
    },
    [selectedColorIds, updateColorsParam]
  )

  const clearColors = useCallback(() => {
    updateColorsParam([])
  }, [updateColorsParam])

  return { selectedColorIds, toggleColor, clearColors }
}
