import { z } from "zod";
import rawStages from "../stages.json";

const validStageSlugs = rawStages.map((s) => s.slug) as [string, ...string[]];
const gateTypeEnum = z.enum(["artifact-exists", "human-confirms", "human-approves-manifest"]);

const gateStageEntry = z.object({
  description: z.string().min(1),
  artifacts: z.array(z.string().regex(/^[a-z0-9][a-z0-9._-]*\.[a-z0-9]+$/)),
  gate: gateTypeEnum,
  next: z.enum(validStageSlugs).nullable(),
});

export const pipelineGatesConfigSchema = z.object({
  stages: z.record(z.string(), gateStageEntry),
  "auto-overrides": z.record(z.string(), z.string()),
});

export type PipelineGatesConfig = z.infer<typeof pipelineGatesConfigSchema>;
