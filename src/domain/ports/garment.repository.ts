import type { GarmentCatalog } from '@domain/entities/garment'

export type IGarmentRepository = {
  getAll(): Promise<GarmentCatalog[]>
  getById(id: string): Promise<GarmentCatalog | null>
  getAvailableBrands(): Promise<string[]>
}
