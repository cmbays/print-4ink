import type { MockupTemplate } from '@domain/entities/mockup-template'
import type {
  BrandPreference,
  DisplayPreference,
  PropagationConfig,
} from '@domain/entities/color-preferences'
import type { DTFSheetTier } from '@domain/entities/dtf-pricing'

export type ISettingsRepository = {
  getMockupTemplates(): Promise<MockupTemplate[]>
  getBrandPreferences(): Promise<BrandPreference[]>
  getDisplayPreference(): Promise<DisplayPreference>
  getAutoPropagationConfig(): Promise<PropagationConfig>
  getDtfSheetTiers(): Promise<DTFSheetTier[]>
}
