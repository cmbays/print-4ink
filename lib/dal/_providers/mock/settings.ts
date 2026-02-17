import {
  mockupTemplates,
  brandPreferences,
  displayPreference,
  autoPropagationConfig,
  dtfSheetTiers,
} from '@/lib/mock-data';
import type { MockupTemplate } from '@/lib/schemas/mockup-template';
import type { BrandPreference, DisplayPreference, PropagationConfig } from '@/lib/schemas/color-preferences';
import type { DTFSheetTier } from '@/lib/schemas/dtf-pricing';

export async function getMockupTemplates(): Promise<MockupTemplate[]> {
  return mockupTemplates.map((t) => ({ ...t }));
}

export async function getBrandPreferences(): Promise<BrandPreference[]> {
  return brandPreferences.map((bp) => ({ ...bp }));
}

export async function getDisplayPreference(): Promise<DisplayPreference> {
  return displayPreference;
}

export async function getAutoPropagationConfig(): Promise<PropagationConfig> {
  return { ...autoPropagationConfig };
}

export async function getDtfSheetTiers(): Promise<DTFSheetTier[]> {
  return dtfSheetTiers.map((t) => ({ ...t }));
}
