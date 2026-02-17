import { z } from "zod";
import {
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
} from "@/config/schemas";

import rawDomains from "../../config/domains.json";
import rawProducts from "../../config/products.json";
import rawTools from "../../config/tools.json";
import rawStages from "../../config/stages.json";
import rawTags from "../../config/tags.json";
import rawPipelineTypes from "../../config/pipeline-types.json";
import rawPipelineGates from "../../config/pipeline-gates.json";

// ── Parse Helper (adds file name to validation errors) ──────────────

function parseConfig<T>(schema: z.ZodType<T>, data: unknown, fileName: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    throw new Error(
      `Config validation failed for ${fileName}:\n${err instanceof z.ZodError ? err.message : String(err)}`,
    );
  }
}

// ── Validated Typed Arrays ──────────────────────────────────────────

export const domains = parseConfig(domainsConfigSchema, rawDomains, "config/domains.json");
export const products = parseConfig(productsConfigSchema, rawProducts, "config/products.json");
export const tools = parseConfig(toolsConfigSchema, rawTools, "config/tools.json");
export const stages = parseConfig(stagesConfigSchema, rawStages, "config/stages.json");
export const tags = parseConfig(tagsConfigSchema, rawTags, "config/tags.json");
export const pipelineTypes = parseConfig(pipelineTypesConfigSchema, rawPipelineTypes, "config/pipeline-types.json");
export const pipelineGates = parseConfig(pipelineGatesConfigSchema, rawPipelineGates, "config/pipeline-gates.json");

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

function lookupLabel(map: Record<string, string>, slug: string, configName: string): string {
  const label = map[slug];
  if (!label) {
    console.warn(`[config] ${configName}Label called with unknown slug "${slug}"`);
    return labelFromSlug(slug);
  }
  return label;
}

export function domainLabel(slug: string): string {
  return lookupLabel(domainLabelMap, slug, "domain");
}

export function productLabel(slug: string): string {
  return lookupLabel(productLabelMap, slug, "product");
}

export function toolLabel(slug: string): string {
  return lookupLabel(toolLabelMap, slug, "tool");
}

export function stageLabel(slug: string): string {
  return lookupLabel(stageLabelMap, slug, "stage");
}

export function tagLabel(slug: string): string {
  return lookupLabel(tagLabelMap, slug, "tag");
}

export function pipelineTypeLabel(slug: string): string {
  return lookupLabel(pipelineTypeLabelMap, slug, "pipelineType");
}

// ── Re-export types ─────────────────────────────────────────────────

export type {
  ConfigEntry,
  ProductEntry,
  StageEntry,
  ToolEntry,
  TagEntry,
  PipelineTypeEntry,
  PipelineGatesConfig,
} from "@/config/schemas";

export {
  configEntryBase,
  domainsConfigSchema,
  productsConfigSchema,
  toolsConfigSchema,
  stagesConfigSchema,
  tagsConfigSchema,
  pipelineTypesConfigSchema,
  pipelineGatesConfigSchema,
} from "@/config/schemas";
