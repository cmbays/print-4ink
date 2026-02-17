import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import tagsConfig from '../../config/tags.json';
import productsConfig from '../../config/products.json';
import toolsConfig from '../../config/tools.json';
import domainsConfig from '../../config/domains.json';
import pipelineTypesConfig from '../../config/pipeline-types.json';
import { pipelineStageSlugs } from './lib/utils';

// Derive enum tuples from canonical config files
const tags = tagsConfig.map((t) => t.slug) as [string, ...string[]];
const products = productsConfig.map((p) => p.slug) as [string, ...string[]];
const tools = toolsConfig.map((t) => t.slug) as [string, ...string[]];
const domains = domainsConfig.map((d) => d.slug) as [string, ...string[]];
const pipelineTypes = pipelineTypesConfig.map((w) => w.slug) as [string, ...string[]];
const stageSlugs = pipelineStageSlugs as [string, ...string[]];

// ── Pipelines ─────────────────────────────────────────────────────
const pipelines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pipelines' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    phase: z.number().int().min(1).max(3),
    pipelineName: z.string(),
    pipelineId: z.string().optional(),
    pipelineType: z.enum(pipelineTypes),
    domain: z.enum(domains).optional(),
    products: z.array(z.enum(products)).optional().default([]),
    tools: z.array(z.enum(tools)).optional().default([]),
    stage: z.enum(stageSlugs),
    tags: z.array(z.enum(tags)),
    sessionId: z.string().optional(),
    branch: z.string().optional(),
    pr: z.string().optional(),
    status: z.enum(['complete', 'in-progress', 'superseded']).default('complete'),
  }),
});

// ── Products ──────────────────────────────────────────────────────
const productDocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    product: z.enum(products),
    docType: z.enum(['overview', 'history', 'decisions', 'reference']),
    lastUpdated: z.coerce.date(),
    status: z.enum(['current', 'draft', 'deprecated']).default('current'),
  }),
});

// ── Tools ─────────────────────────────────────────────────────────
const toolDocs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    tool: z.enum(tools),
    docType: z.enum(['overview', 'history', 'decisions']),
    lastUpdated: z.coerce.date(),
    status: z.enum(['current', 'draft', 'deprecated']).default('current'),
  }),
});

// ── Strategy ──────────────────────────────────────────────────────
// Pipeline names are free text (not config-backed enums).
const strategy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/strategy' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    docType: z.enum(['cooldown', 'planning']),
    phase: z.number().int().min(1).max(3),
    pipelinesCompleted: z.array(z.string()).optional().default([]),
    pipelinesLaunched: z.array(z.string()).optional().default([]),
    tags: z.array(z.enum(tags)),
    sessionId: z.string().optional(),
    branch: z.string().optional(),
    pr: z.string().optional(),
    status: z.enum(['complete', 'in-progress']).default('complete'),
  }),
});

export const collections = { pipelines, productDocs, toolDocs, strategy };
