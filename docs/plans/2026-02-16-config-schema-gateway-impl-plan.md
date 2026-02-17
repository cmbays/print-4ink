# Config Schema Gateway — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Create a validated config gateway (`lib/config/`) that validates all 7 config JSON files against Zod schemas and re-exports typed data as the single public API for config consumers.

**Architecture:** Four-layer pattern — Raw JSON (Layer 1) → Zod schemas (Layer 2) → Loader/Gateway (Layer 3) → Consumers (Layer 4). Schemas compose from a shared `configEntryBase`. Gateway validates at import time and exports three forms: typed arrays, slug tuples, and label lookup functions. See `knowledge-base/src/content/strategy/2026-02-16-config-schema-gateway.md` for full architectural rationale.

**Tech Stack:** Zod (validation), Vitest (testing), TypeScript strict mode. No new dependencies — Zod is already in use.

---

## Wave 0: Config Schema Gateway (serial — 1 session)

> This is a single-session task. All tasks are sequential within the session — each builds on the previous.

### Task 0.1: Zod Schemas

**Files:**
- `lib/config/schemas.ts` — NEW

**Steps:**
1. Define `configEntryBase` — shared base for most config files:
   ```typescript
   const configEntryBase = z.object({
     slug: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/),
     label: z.string().min(1),
   });
   ```
2. Define array schemas for simple configs (domains, tools):
   - `domainsConfigSchema` = `z.array(configEntryBase).nonempty()`
   - `toolsConfigSchema` = `z.array(configEntryBase).nonempty()`
3. Define extended schemas:
   - `productsConfigSchema` — extends base with `route: z.string().min(1)`
   - `stagesConfigSchema` — extends base with `core: z.boolean().optional()`, `pipeline: z.boolean().optional()`
   - `tagsConfigSchema` — extends base with `color: z.string().min(1)`
   - `pipelineTypesConfigSchema` — extends base with `description: z.string().min(1)`, `stages: z.array(z.string().min(1)).nonempty()`
4. Define `pipelineGatesConfigSchema` — unique object shape:
   ```typescript
   z.object({
     stages: z.record(z.string(), z.object({
       artifacts: z.array(z.string()),
       gate: z.string().min(1),
       next: z.string().nullable(),
     })),
     "auto-overrides": z.record(z.string(), z.string()),
   })
   ```
5. Export all schemas and inferred types.

### Task 0.2: Gateway Loader

**Files:**
- `lib/config/index.ts` — NEW

**Steps:**
1. Import all 7 raw JSON files from `../../config/`.
2. Parse each through its schema — validation runs at import time:
   ```typescript
   export const domains = domainsConfigSchema.parse(rawDomains);
   ```
3. Export **typed arrays** (7 exports):
   - `domains`, `products`, `tools`, `stages`, `tags`, `pipelineTypes`, `pipelineGates`
4. Export **slug tuples** for Zod enum generation (6 exports — gates has no slugs):
   - `domainSlugs`, `productSlugs`, `toolSlugs`, `stageSlugs`, `tagSlugs`, `pipelineTypeSlugs`
   - Each typed as `[string, ...string[]]` for `z.enum()` compatibility
5. Export **label lookup functions** (6 exports):
   - `domainLabel(slug)`, `productLabel(slug)`, `toolLabel(slug)`, `stageLabel(slug)`, `tagLabel(slug)`, `pipelineTypeLabel(slug)`
   - Each returns the label for a slug, with kebab-to-title fallback
6. Export inferred types from schemas for consumer use.

### Task 0.3: Tests

**Files:**
- `lib/config/__tests__/config.test.ts` — NEW

**Steps:**
1. **Schema validation tests** — one `describe` block per config file:
   - Validates the actual JSON file parses successfully against its schema
   - Tests that the parsed result has expected shape (non-empty array, correct fields)
2. **Structural invariant tests**:
   - No duplicate slugs within any config file
   - All slugs match kebab-case format (`/^[a-z][a-z0-9-]*$/`)
   - All arrays non-empty
3. **Cross-file consistency tests**:
   - Every stage slug in `pipeline-types.json` exists in `stages.json`
   - Every stage key in `pipeline-gates.json` exists in `stages.json`
   - Every `next` value in pipeline gates (non-null) exists in `stages.json`
4. **Label lookup tests**:
   - Known slug returns correct label
   - Unknown slug returns kebab-to-title fallback
5. **Slug tuple tests**:
   - Each tuple is non-empty
   - Tuple matches slugs from the corresponding typed array
6. Run: `npm test` — all tests pass

### Task 0.4: Wire Domains into KB

**Files:**
- `knowledge-base/src/content.config.ts` — MODIFY
- `knowledge-base/src/lib/utils.ts` — MODIFY

**Steps:**
1. In `content.config.ts`:
   - Add `import domainsConfig from '../../config/domains.json';`
   - Derive `const domains = domainsConfig.map((d) => d.slug) as [string, ...string[]];`
   - Add `domain: z.enum(domains).optional()` field to `pipelines` schema (optional — not all pipelines have a domain)
2. In `lib/utils.ts`:
   - Add `import domainsConfig from '../../../config/domains.json';`
   - Add `domainLabelMap` following the existing pattern (stageLabel, productLabel, toolLabel)
   - Add `export function domainLabel(slug: string): string` with fallback to `labelFromSlug`
3. KB keeps importing raw JSON directly (Astro build boundary — does NOT import from `lib/config/`)

### Task 0.5: Verify All Green

**Steps:**
1. `npm test` — all Vitest tests pass (existing + new config tests)
2. `npx tsc --noEmit` — type check passes
3. `cd knowledge-base && npm run build` — KB builds cleanly with new domain field
4. Commit and push

---

## Merge Conflicts

**Risk: None.** All new files (`lib/config/*`) are unique to this session. KB modifications add new imports and fields — no overlap with other sessions' work.

## Post-Build

- Update PR #348 with implementation commits
- Update strategy doc status from `in-progress` to `complete`
- Create KB session doc for this work
