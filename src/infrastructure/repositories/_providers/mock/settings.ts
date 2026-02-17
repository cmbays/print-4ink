import {
  mockupTemplates,
  brandPreferences,
  displayPreference,
  autoPropagationConfig,
  dtfSheetTiers,
} from '@/lib/mock-data';
import type { MockupTemplate } from '@domain/entities/mockup-template';
import type { BrandPreference, DisplayPreference, PropagationConfig } from '@domain/entities/color-preferences';
import type { DTFSheetTier } from '@domain/entities/dtf-pricing';

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

/** Phase 1 only: returns the raw mutable brandPreferences array for in-place mock data mutations. */
export function getBrandPreferencesMutable(): BrandPreference[] {
  return brandPreferences;
}

/** Phase 1 only: returns the raw mutable autoPropagationConfig object for in-place mock data mutations. */
export function getAutoPropagationConfigMutable(): PropagationConfig {
  return autoPropagationConfig;
}

/** Synchronous copy of dtfSheetTiers for use in client components. */
export function getDtfSheetTiersSync(): DTFSheetTier[] {
  return dtfSheetTiers.map((t) => ({ ...t }));
}
