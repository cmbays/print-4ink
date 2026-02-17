---
title: "DDD Wave 3: Issue-Driven work define + domains field"
subtitle: "Label inference, name derivation, and domains as first-class pipeline field"
date: 2026-02-17
phase: 1
pipelineName: "DDD Enablement Epic"
pipelineType: horizontal
products: []
tools: ["work-orchestrator", "pm-system", "ci-pipeline"]
domains: ["garments", "screens", "pricing"]
stage: wrap-up
tags: [build, decision]
sessionId: "0a1b62cb-84e6-46ff-b178-9021bb5a09ae"
branch: "session/0217-ddd-324"
status: complete
---

## What Shipped

**PR #428 — `feat(pipeline): issue-driven work define — label inference + domains field (#324)`**

Closes the DDD Enablement Epic (#315). The last piece: making the pipeline system aware of domains as a first-class entity, and wiring GitHub issue labels into `work define`.

### `work define --issue <N>` — label inference

When `--issue N` is provided, the command fetches the issue's labels and title, then auto-populates fields:

| Label pattern | Field |
|---|---|
| `pipeline/<type>` | type (falls back to `vertical` with warning) |
| `product/<slug>` | products |
| `tool/<slug>` | tools |
| `domain/<slug>` | domains |
| Issue title (derived) | name (if not explicitly given) |

The output shows what was inferred AND any explicit overrides:

```
=== Inferred from issue #324 ===
  Title:    Implement work launch command for label-driven…
  Name:     work-launch-label-driven  (derived)
  Type:     horizontal            (from pipeline/* label)
  Products: (none)
  Tools:    work-orchestrator     (from tool/* label)
  Domains:  (none)
  ⚠  No pipeline/* label found — defaulting type to 'vertical'

=== Explicit overrides ===
  type: 'polish'  (flag overrides inferred: 'vertical')

=== Pipeline Defined ===
  ...
```

### Name derivation from issue title

A `_derive_name_from_issue_title` helper strips noise then takes 5 words:
1. Strip backtick code spans, angle-bracket refs, `(#N)` refs
2. Strip conventional-commit prefix (`feat(x):`, `fix(y):`)
3. Lowercase, replace non-alphanumeric with spaces
4. Take first 5 meaningful words → join with hyphens

### `domains` as first-class pipeline field

Added to `config/pipeline-fields.json` with `--domains csv` flag and validation against `config/domains.json`. `_pipeline_create` now initializes `domains: []` in entity JSON. The final summary block in `work define` shows products, tools, and domains together.

## Design Decisions

### `work launch` was not created

After reading `work.sh`, `pipeline-define.sh`, and `pipeline-fields.json`, it was clear that `work launch` would have been a thin wrapper around `work define` with zero new capability. Enhancing `--issue` directly keeps the CLI surface flat.

The "automation loop" (`work launch <issue>` → `work define`) described in memory note #303 is now implemented as just `work define --issue <N>`. No new verb needed.

### Explicit overrides shown in output

When the user provides flags that differ from what labels infer, both are shown side-by-side. This gives transparency without being prescriptive — the user can see exactly what was read from labels and what they chose to change.

### `pipeline/*` label fallback

No `pipeline/*` label → type defaults to `vertical` with a warning, not an error. This is appropriate because:
1. Most issues are about product verticals
2. The label taxonomy is still being rolled out
3. Failing would be annoying when the label is just missing

## Files Changed

- `config/pipeline-fields.json` — `domains` field added (order 5, validates against domains.json)
- `scripts/lib/pipeline-entity.sh` — `--domains` in `_pipeline_create`, `domains: []` in entity JSON
- `scripts/lib/pipeline-define.sh` — `_derive_name_from_issue_title` helper, issue inference block, explicit_keys tracking, override output, domains extraction
- `lib/config/__tests__/config.test.ts` — updated updatable-fields allowlist to include domains

## Related

- DDD Wave 1: #315 / PR #400 — config + KB schema foundation
- DDD Wave 2: #318 (issue migration), #319 (GitHub automation), #320 (docs)
- DDD Wave 3a: #321 / PR #415 — products.json restructure + domainDocs KB collection
- DDD Wave 3b: #322, #323 — label triage (vertical/infrastructure, vertical/devx)
- DDD Wave 3c: #324 / PR #428 — THIS SESSION
- Backlog: #427 — issue title/name standardization
