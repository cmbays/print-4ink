import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import verticalsConfig from '../../config/verticals.json';
import stagesConfig from '../../config/stages.json';
import tagsConfig from '../../config/tags.json';

// Derive enum tuples from canonical config files
const verticals = verticalsConfig.map((v) => v.slug) as [string, ...string[]];
// All stages are valid for session frontmatter (including non-pipeline stages like cooldown).
// Pipeline-only filtering is done in display components, not in data validation.
const stages = stagesConfig.map((s) => s.slug) as [string, ...string[]];
const tags = tagsConfig.map((t) => t.slug) as [string, ...string[]];

const sessions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sessions' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    date: z.coerce.date(),
    phase: z.number().int().min(1).max(3),
    vertical: z.enum(verticals),
    verticalSecondary: z.array(z.string()).optional().default([]),
    stage: z.enum(stages),
    tags: z.array(z.enum(tags)),
    sessionId: z.string().optional(),
    branch: z.string().optional(),
    pr: z.string().optional(),
    status: z.enum(['complete', 'in-progress', 'superseded']).default('complete'),
  }),
});

export const collections = { sessions };
