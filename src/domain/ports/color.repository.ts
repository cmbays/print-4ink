import type { Color } from '@domain/entities/color'

export type IColorRepository = {
  getAll(): Promise<Color[]>
  getById(id: string): Promise<Color | null>
}
