import {
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
} from "./schemas";

import rawDomains from "../../config/domains.json";
import rawProducts from "../../config/products.json";
import rawTools from "../../config/tools.json";
import rawStages from "../../config/stages.json";
import rawTags from "../../config/tags.json";
import rawPipelineTypes from "../../config/pipeline-types.json";
import rawPipelineGates from "../../config/pipeline-gates.json";

// ── Validated Typed Arrays ──────────────────────────────────────────

export const domains = domainsConfigSchema.parse(rawDomains);
export const products = productsConfigSchema.parse(rawProducts);
export const tools = toolsConfigSchema.parse(rawTools);
export const stages = stagesConfigSchema.parse(rawStages);
export const tags = tagsConfigSchema.parse(rawTags);
export const pipelineTypes = pipelineTypesConfigSchema.parse(rawPipelineTypes);
export const pipelineGates = pipelineGatesConfigSchema.parse(rawPipelineGates);

// ── Slug Tuples (for z.enum() consumers) ────────────────────────────

export const domainSlugs = domains.map((d) => d.slug) as [string, ...string[]];
export const productSlugs = products.map((p) => p.slug) as [string, ...string[]];
export const toolSlugs = tools.map((t) => t.slug) as [string, ...string[]];
export const stageSlugs = stages.map((s) => s.slug) as [string, ...string[]];
export const tagSlugs = tags.map((t) => t.slug) as [string, ...string[]];
export const pipelineTypeSlugs = pipelineTypes.map((p) => p.slug) as [string, ...string[]];

// ── Label Lookups ───────────────────────────────────────────────────

/** Convert kebab-case slug to Title Case (fallback for unknown slugs) */
function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildLabelMap(entries: { slug: string; label: string }[]): Record<string, string> {
  return Object.fromEntries(entries.map((e) => [e.slug, e.label]));
}

const domainLabelMap = buildLabelMap(domains);
const productLabelMap = buildLabelMap(products);
const toolLabelMap = buildLabelMap(tools);
const stageLabelMap = buildLabelMap(stages);
const tagLabelMap = buildLabelMap(tags);
const pipelineTypeLabelMap = buildLabelMap(pipelineTypes);

export function domainLabel(slug: string): string {
  return domainLabelMap[slug] || labelFromSlug(slug);
}

export function productLabel(slug: string): string {
  return productLabelMap[slug] || labelFromSlug(slug);
}

export function toolLabel(slug: string): string {
  return toolLabelMap[slug] || labelFromSlug(slug);
}

export function stageLabel(slug: string): string {
  return stageLabelMap[slug] || labelFromSlug(slug);
}

export function tagLabel(slug: string): string {
  return tagLabelMap[slug] || labelFromSlug(slug);
}

export function pipelineTypeLabel(slug: string): string {
  return pipelineTypeLabelMap[slug] || labelFromSlug(slug);
}

// ── Re-export types ─────────────────────────────────────────────────

export type {
  ConfigEntry,
  ProductEntry,
  StageEntry,
  TagEntry,
  PipelineTypeEntry,
  PipelineGatesConfig,
} from "./schemas";

export {
  configEntryBase,
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
} from "./schemas";
