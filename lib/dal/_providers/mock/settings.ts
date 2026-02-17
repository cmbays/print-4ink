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
  return mockupTemplates.map((t) => structuredClone(t));
}

export async function getBrandPreferences(): Promise<BrandPreference[]> {
  return brandPreferences.map((bp) => structuredClone(bp));
}

// DisplayPreference is a string literal union — primitives are inherently copied.
export async function getDisplayPreference(): Promise<DisplayPreference> {
  return displayPreference;
}

export async function getAutoPropagationConfig(): Promise<PropagationConfig> {
  return structuredClone(autoPropagationConfig);
}

export async function getDtfSheetTiers(): Promise<DTFSheetTier[]> {
  return dtfSheetTiers.map((t) => structuredClone(t));
}
