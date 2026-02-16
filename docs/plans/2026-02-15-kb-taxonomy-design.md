# Knowledge Base Taxonomy Restructure — Design

**Date**: 2026-02-15
**Status**: Approved
**Related Issues**: #192 (pipeline architecture), #190 (config audit), #202 (vertical→pipeline rename)

---

## Problem

The KB has a single flat collection (`sessions`) with 53 docs. Everything is a "session" regardless of whether it documents a build process, a tool, or a product feature. The taxonomy conflates app products (Quotes, Jobs) with dev infrastructure (devx, meta) and cross-cutting concerns (mobile-optimization) under the same `vertical` field. As the project matures with distinct pipeline types (vertical, polish, horizontal, bug-fix) and the need for living product/tool documentation, the flat model doesn't scale.

## Design

### Four Content Collections

| Collection | Purpose | Temporal Model |
|---|---|---|
| **pipelines** | Build process history (renamed from `sessions`) | Historical — ordered by date |
| **products** | App feature suite documentation | Living — kept current |
| **tools** | Dev infrastructure documentation | Living — kept current |
| **strategy** | Strategic planning & cooldowns | Historical — ordered by date |

### Config Files (DRY Enums)

All collection schemas derive enums from canonical JSON config files. No hardcoded lists.

**`config/products.json`** — canonical app feature suites:
```json
[
  { "slug": "dashboard", "label": "Dashboard", "route": "/dashboard" },
  { "slug": "quotes", "label": "Quotes", "route": "/quotes" },
  { "slug": "customers", "label": "Customers", "route": "/customers" },
  { "slug": "invoices", "label": "Invoices", "route": "/invoices" },
  { "slug": "jobs", "label": "Jobs", "route": "/jobs" },
  { "slug": "garments", "label": "Garments", "route": "/garments" },
  { "slug": "screens", "label": "Screens", "route": "/screens" },
  { "slug": "pricing", "label": "Pricing", "route": "/settings/pricing" }
]
```

**`config/tools.json`** — dev infrastructure tools:
```json
[
  { "slug": "work-orchestrator", "label": "Work Orchestrator" },
  { "slug": "skills-framework", "label": "Skills Framework" },
  { "slug": "agent-system", "label": "Agent System" },
  { "slug": "knowledge-base", "label": "Knowledge Base" },
  { "slug": "ci-pipeline", "label": "CI Pipeline" }
]
```

**`config/workflows.json`** — pipeline types with stage sequences:
```json
[
  {
    "slug": "vertical",
    "label": "Vertical",
    "stages": ["research", "interview", "shape", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "polish",
    "label": "Polish",
    "stages": ["interview", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "horizontal",
    "label": "Horizontal",
    "stages": ["research", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "bug-fix",
    "label": "Bug Fix",
    "stages": ["build", "review", "wrap-up"]
  }
]
```

Note: `stages.json` needs `shape` and `wrap-up` added as part of this work, since the KB schema derives from it.

### Schemas

#### Pipelines (renamed from sessions)

```yaml
title: string                         # required
subtitle: string                      # required
date: date                            # required
phase: 1-3                            # required
pipeline: enum(verticals.json slugs)  # required — replaces "vertical"
pipelineType: enum(workflows.json)    # required — vertical|polish|horizontal|bug-fix
products: [enum(products.json)]       # optional — which products this touches
tools: [enum(tools.json)]             # optional — which tools this touches
stage: enum(stages.json)              # required
tags: [enum(tags.json)]               # required
sessionId: string                     # optional
branch: string                        # optional
pr: string                            # optional
status: complete|in-progress|superseded  # default: complete
```

Changes from current session schema:
- `vertical` → `pipeline` (same enum source for now)
- `verticalSecondary` → removed (replaced by `products` + `tools` arrays)
- NEW: `pipelineType` — classifies the workflow type
- NEW: `products` — explicit product cross-references
- NEW: `tools` — explicit tool cross-references

#### Products

```yaml
title: string                         # required
subtitle: string                      # required
product: enum(products.json)          # required — canonical slug
docType: overview|history|decisions|reference  # required
lastUpdated: date                     # required
status: current|draft|deprecated      # default: current
```

Doc types:
- `overview` — living landing page (current state, how it works)
- `history` — changelog linking to pipeline docs + PRs
- `decisions` — timeline of key decisions with links to source docs
- `reference` — future domain docs (data model, UX flows, etc.)

#### Tools

```yaml
title: string                         # required
subtitle: string                      # required
tool: enum(tools.json)                # required — canonical slug
docType: overview|history|decisions   # required
lastUpdated: date                     # required
status: current|draft|deprecated      # default: current
```

Same pattern as products but without `reference` (tools are more self-contained).

#### Strategy

```yaml
title: string                         # required
subtitle: string                      # required
date: date                            # required
docType: cooldown|planning            # required — extensible
phase: number                         # which phase this covers
pipelinesCompleted: [string]          # pipelines cooling down from
pipelinesLaunched: [string]           # pipelines decided for next cycle
tags: [enum(tags.json)]              # required
sessionId: string                    # optional
branch: string                       # optional
pr: string                           # optional
status: complete|in-progress         # default: complete
```

### Directory Structure

```
knowledge-base/src/content/
  pipelines/                          # renamed from sessions/
    2026-02-08-quoting-build.md
    2026-02-10-work-orchestrator.md
    ...53 migrated docs
  products/
    dashboard/
      overview.md
      history.md
      decisions.md
    quotes/
      overview.md
      history.md
      decisions.md
    customers/...
    invoices/...
    jobs/...
    garments/...
    screens/...
    pricing/...
  tools/
    work-orchestrator/
      overview.md
      history.md
      decisions.md
    skills-framework/
      overview.md
      history.md
      decisions.md
    agent-system/...
    knowledge-base/...
    ci-pipeline/...
  strategy/
    2026-02-14-phase1-cooldown.md     # migrated from pipelines
```

### Cross-Referencing

Linking works bidirectionally:

- **Pipeline → Product/Tool**: Frontmatter arrays (`products: [quotes]`, `tools: [work-orchestrator]`)
- **Product/Tool → Pipeline**: Auto-queried in Astro pages by filtering the pipelines collection where `products`/`tools` contains the target slug
- **Decisions**: Aggregate `/decisions` page pulls from all product/tool `decisions.md` docs into a unified timeline

### Routing

| Route | Purpose |
|---|---|
| `/` | Dashboard — overview of all collections |
| `/pipelines/[...slug]` | Pipeline doc detail |
| `/pipelines/[pipeline]` | Browse pipeline docs by pipeline name |
| `/pipelines/[pipeline]/[stage]` | Filter by pipeline name + stage |
| `/products` | Products index grid |
| `/products/[product]` | Product detail (overview + history + decisions + linked pipelines) |
| `/tools` | Tools index grid |
| `/tools/[tool]` | Tool detail (overview + history + decisions + linked pipelines) |
| `/strategy` | Strategy/cooldowns index |
| `/strategy/[...slug]` | Strategy doc detail |
| `/decisions` | Aggregate decision timeline across all products/tools |
| `/gary-tracker` | Gary questions (unchanged) |

### Migration Plan

**Pipeline docs (53 existing sessions):**
1. Move `content/sessions/` → `content/pipelines/`
2. Update all frontmatter: `vertical` → `pipeline`, add `pipelineType` + `products` + `tools`
3. Remove `verticalSecondary` field
4. Slug values stay as-is (rename to canonical slugs is #190)

**Pipeline classification:**

| Current `vertical` | `pipelineType` | `products` | `tools` |
|---|---|---|---|
| quoting | vertical | [quotes] | [] |
| customer-management | vertical | [customers] | [] |
| invoicing | vertical | [invoices] | [] |
| price-matrix | vertical | [pricing] | [] |
| jobs | vertical | [jobs] | [] |
| screen-room | vertical | [screens] | [] |
| garments | vertical | [garments] | [] |
| dashboard | vertical | [dashboard] | [] |
| mobile-optimization | horizontal | [dashboard, quotes, customers, invoices, jobs, garments, pricing] | [] |
| dtf-gang-sheet | vertical | [garments] | [] |
| devx | horizontal | [] | [work-orchestrator, skills-framework, agent-system, knowledge-base, ci-pipeline] |
| meta | horizontal | [] | [knowledge-base] |

**Strategy docs**: Migrate `2026-02-14-phase1-cooldown.md` from pipelines to strategy collection.

**Product placeholders**: Create overview.md, history.md, decisions.md for all 8 products (placeholder content).

**Tool placeholders**: Create overview.md, history.md, decisions.md for all 5 tools (placeholder content).

**Stages config update**: Add `shape` and `wrap-up` to `config/stages.json`.

### Workflow Integration (Future)

Pipeline wrap-up phase should:
1. Create pipeline history doc in `content/pipelines/` (new schema)
2. Update relevant product `overview.md` if product state changed
3. Update relevant tool `overview.md` if tool was modified
4. Add decision entries to relevant `decisions.md` docs

This gets built into the wrap-up skill as part of #192.

### Design Principles

- **Stages vs Skills**: Stages are pipeline checkpoints (coarse). Skills are activities within a stage (granular). Breadboard-reflection is a skill within the breadboard stage, not its own stage.
- **Products vs Pipelines**: Products represent what exists in the app. Pipelines represent the process of building/improving. A pipeline can cross multiple products.
- **DRY configs**: All enums from `config/*.json`. No hardcoded lists in schemas, components, or scripts.
- **Auto-linking**: Product/tool pages auto-query pipelines by frontmatter references. Minimal manual curation.
- **Placeholders now, content later**: Product/tool overview docs start as shells. Real content comes from future wrap-ups.
