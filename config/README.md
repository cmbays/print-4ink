# Config Schema Contract

Every config file in this directory follows a standard contract so that CLI commands, help text, KB pages, and documentation can be auto-generated from config metadata.

## Array configs

Files: `stages.json`, `products.json`, `tools.json`, `tags.json`, `pipeline-types.json`

Every entry **must** have:

| Field | Type | Convention |
|-------|------|------------|
| `slug` | string | `kebab-case` machine identifier, stable across renames |
| `label` | string | Title Case human-readable display name |
| `description` | string | What this value represents and when to use it |

Domain-specific fields (`route`, `color`, `stages`, `core`, `pipeline`) follow after the three required fields.

**Array order is significant** — it defines display order in UI, pipeline stage sequences, and Zod enum defaults. Do not reorder without checking consumers.

## Object configs

File: `pipeline-gates.json`

Keyed by stage slug. Each entry **must** have a `description` field. Labels are derived from the parent stage config.

## Consumers

| Consumer | Reads | Location |
|----------|-------|----------|
| KB Zod schema | `slug` (enum derivation) | `knowledge-base/src/content.config.ts` |
| KB utils | `slug`, `label`, `color`, `core`, `pipeline` | `knowledge-base/src/lib/utils.ts` |
| KB pages | `slug`, `label`, `route` | `knowledge-base/src/pages/` |
| Pipeline entity | `slug`, `stages` | `scripts/lib/pipeline-entity.sh` |
| Pipeline gates | `artifacts`, `gate`, `next` | `scripts/lib/pipeline-gates.sh` |
| CLI help (planned) | `slug`, `label`, `description`, `flag` | `scripts/lib/pipeline-update.sh` |

## Adding a new config file

1. Use the array-of-objects pattern with `slug`, `label`, `description` as the first three fields
2. Add domain-specific fields after the required three
3. Update this README's consumer table if the file has new consumers
4. Ensure KB `content.config.ts` imports the new file if it backs a Zod enum

## Related

- Epic: [#325](https://github.com/cmbays/print-4ink/issues/325) (Schema-Driven Configuration Design)
- Design doc: `docs/plans/2026-02-16-config-driven-work-update-design.md`
