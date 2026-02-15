import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const verticals = [
  'quoting',
  'customer-management',
  'invoicing',
  'price-matrix',
  'jobs',
  'screen-room',
  'garments',
  'dashboard',
  'mobile-optimization',
  'dtf-gang-sheet',
  'devx',
  'meta',
] as const;

const stages = [
  'research',
  'interview',
  'breadboarding',
  'implementation-planning',
  'build',
  'polish',
  'review',
  'learnings',
] as const;

const tags = [
  'feature',
  'build',
  'plan',
  'decision',
  'research',
  'learning',
] as const;

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
