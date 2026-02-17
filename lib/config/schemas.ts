import { z } from "zod";

// ── Shared Base ─────────────────────────────────────────────────────

/** Base schema for config entries: slug (kebab-case) + label */
export const configEntryBase = z.object({
  slug: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
});

export type ConfigEntry = z.infer<typeof configEntryBase>;

// ── Simple Configs (slug + label only) ──────────────────────────────

export const domainsConfigSchema = z.array(configEntryBase).nonempty();
export const toolsConfigSchema = z.array(configEntryBase).nonempty();

// ── Extended Configs ────────────────────────────────────────────────

const productEntry = configEntryBase.extend({
  route: z.string().min(1),
});
export const productsConfigSchema = z.array(productEntry).nonempty();
export type ProductEntry = z.infer<typeof productEntry>;

const stageEntry = configEntryBase.extend({
  core: z.boolean().optional(),
  pipeline: z.boolean().optional(),
});
export const stagesConfigSchema = z.array(stageEntry).nonempty();
export type StageEntry = z.infer<typeof stageEntry>;

const tagEntry = configEntryBase.extend({
  color: z.string().min(1),
});
export const tagsConfigSchema = z.array(tagEntry).nonempty();
export type TagEntry = z.infer<typeof tagEntry>;

const pipelineTypeEntry = configEntryBase.extend({
  description: z.string().min(1),
  stages: z.array(z.string().min(1)).nonempty(),
});
export const pipelineTypesConfigSchema = z.array(pipelineTypeEntry).nonempty();
export type PipelineTypeEntry = z.infer<typeof pipelineTypeEntry>;

// ── Pipeline Gates (unique object shape) ────────────────────────────

const gateStageEntry = z.object({
  artifacts: z.array(z.string()),
  gate: z.string().min(1),
  next: z.string().nullable(),
});

export const pipelineGatesConfigSchema = z.object({
  stages: z.record(z.string(), gateStageEntry),
  "auto-overrides": z.record(z.string(), z.string()),
});
export type PipelineGatesConfig = z.infer<typeof pipelineGatesConfigSchema>;
