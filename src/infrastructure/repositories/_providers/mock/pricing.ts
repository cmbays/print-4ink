// Auth classification: AUTHENTICATED — pricing template configuration.
// Phase 2: All functions must call verifySession() before returning data.
import type { PricingTemplate } from '@domain/entities/price-matrix'
import type { DTFPricingTemplate } from '@domain/entities/dtf-pricing'
import type { TagTemplateMapping } from '@domain/entities/tag-template-mapping'
import {
  spStandardTemplate,
  spContractTemplate,
  spSchoolsTemplate,
  dtfRetailTemplate,
  dtfContractTemplate,
  allScreenPrintTemplates,
  allDTFTemplates,
  tagTemplateMappings,
} from './data-pricing'

export async function getScreenPrintTemplates(): Promise<PricingTemplate[]> {
  return allScreenPrintTemplates
}

export async function getDTFTemplates(): Promise<DTFPricingTemplate[]> {
  return allDTFTemplates
}

export async function getTagTemplateMappings(): Promise<TagTemplateMapping[]> {
  return tagTemplateMappings
}

export async function getScreenPrintTemplateById(id: string): Promise<PricingTemplate | null> {
  return allScreenPrintTemplates.find((t) => t.id === id) ?? null
}

export async function getDTFTemplateById(id: string): Promise<DTFPricingTemplate | null> {
  return allDTFTemplates.find((t) => t.id === id) ?? null
}

// Synchronous exports for components that need direct access during Phase 1
// TODO: Phase 3 — replace with async repository calls
export {
  spStandardTemplate,
  spContractTemplate,
  spSchoolsTemplate,
  dtfRetailTemplate,
  dtfContractTemplate,
  allScreenPrintTemplates,
  allDTFTemplates,
  tagTemplateMappings,
}
