import { z } from 'zod'
import { domainsConfigSchema, productsConfigSchema } from '@config/schemas'
import {
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
  pipelineFieldsConfigSchema,
} from '../../tools/orchestration/schemas'

import rawDomains from '../../src/config/domains.json'
import rawProducts from '../../src/config/products.json'
import rawTools from '../../tools/orchestration/config/tools.json'
import rawStages from '../../tools/orchestration/config/stages.json'
import rawTags from '../../tools/orchestration/config/tags.json'
import rawPipelineTypes from '../../tools/orchestration/config/pipeline-types.json'
import rawPipelineGates from '../../tools/orchestration/config/pipeline-gates.json'
import rawPipelineFields from '../../tools/orchestration/config/pipeline-fields.json'

// ── Parse Helper (adds file name to validation errors) ──────────────

function parseConfig<T>(schema: z.ZodType<T>, data: unknown, fileName: string): T {
  try {
    return schema.parse(data)
  } catch (err) {
    throw new Error(
      `Config validation failed for ${fileName}:\n${err instanceof z.ZodError ? err.message : String(err)}`
    )
  }
}

// ── Validated Typed Arrays ──────────────────────────────────────────

export const domains = parseConfig(domainsConfigSchema, rawDomains, 'src/config/domains.json')
export const products = parseConfig(productsConfigSchema, rawProducts, 'src/config/products.json')
export const tools = parseConfig(
  toolsConfigSchema,
  rawTools,
  'tools/orchestration/config/tools.json'
)
export const stages = parseConfig(
  stagesConfigSchema,
  rawStages,
  'tools/orchestration/config/stages.json'
)
export const tags = parseConfig(tagsConfigSchema, rawTags, 'tools/orchestration/config/tags.json')
export const pipelineTypes = parseConfig(
  pipelineTypesConfigSchema,
  rawPipelineTypes,
  'tools/orchestration/config/pipeline-types.json'
)
export const pipelineGates = parseConfig(
  pipelineGatesConfigSchema,
  rawPipelineGates,
  'tools/orchestration/config/pipeline-gates.json'
)
export const pipelineFields = parseConfig(
  pipelineFieldsConfigSchema,
  rawPipelineFields,
  'tools/orchestration/config/pipeline-fields.json'
)

// ── Slug Tuples (for z.enum() consumers) ────────────────────────────

export const domainSlugs = domains.map((d) => d.slug) as [string, ...string[]]
export const productSlugs = products.map((p) => p.slug) as [string, ...string[]]
export const toolSlugs = tools.map((t) => t.slug) as [string, ...string[]]
export const stageSlugs = stages.map((s) => s.slug) as [string, ...string[]]
export const tagSlugs = tags.map((t) => t.slug) as [string, ...string[]]
export const pipelineTypeSlugs = pipelineTypes.map((p) => p.slug) as [string, ...string[]]

// ── Label Lookups ───────────────────────────────────────────────────

/** Convert kebab-case slug to Title Case (fallback for unknown slugs) */
function labelFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildLabelMap(entries: { slug: string; label: string }[]): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [e.slug, e.label]))
}

const domainLabelMap = buildLabelMap(domains)
const productLabelMap = buildLabelMap(products)
const toolLabelMap = buildLabelMap(tools)
const stageLabelMap = buildLabelMap(stages)
const tagLabelMap = buildLabelMap(tags)
const pipelineTypeLabelMap = buildLabelMap(pipelineTypes)

function lookupLabel(map: Record<string, string>, slug: string, configName: string): string {
  const label = map[slug]
  if (!label) {
    console.warn(`[config] ${configName}Label called with unknown slug "${slug}"`)
    return labelFromSlug(slug)
  }
  return label
}

export function domainLabel(slug: string): string {
  return lookupLabel(domainLabelMap, slug, 'domain')
}

export function productLabel(slug: string): string {
  return lookupLabel(productLabelMap, slug, 'product')
}

export function toolLabel(slug: string): string {
  return lookupLabel(toolLabelMap, slug, 'tool')
}

export function stageLabel(slug: string): string {
  return lookupLabel(stageLabelMap, slug, 'stage')
}

export function tagLabel(slug: string): string {
  return lookupLabel(tagLabelMap, slug, 'tag')
}

export function pipelineTypeLabel(slug: string): string {
  return lookupLabel(pipelineTypeLabelMap, slug, 'pipelineType')
}

// ── Re-export types ─────────────────────────────────────────────────

export type { ConfigEntry, ProductEntry } from '@config/schemas'

export type {
  StageEntry,
  ToolEntry,
  TagEntry,
  PipelineTypeEntry,
  PipelineGatesConfig,
  FieldDisplay,
  PipelineFieldEntry,
  PipelineFieldsConfig,
} from '../../tools/orchestration/schemas'

export { configEntryBase, domainsConfigSchema, productsConfigSchema } from '@config/schemas'

export {
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
  pipelineFieldsConfigSchema,
} from '../../tools/orchestration/schemas'
