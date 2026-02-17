# Config-Driven `work update` — Design Document

**Date**: 2026-02-16
**Issue**: #306 (sub-issue of epic #325)
**Branch**: `session/0216-issue-306`
**Status**: Approved

## Problem

The `work update` command was initially implemented with hardcoded `case` branches for each flag (`--type`, `--auto`, `--issue`, `--products`, `--tools`). This approach:

- Requires code changes to add new updatable fields
- Duplicates validation logic already present in `work define`
- Doesn't leverage the project's config-driven architecture
- Misses field protection for `id`, `name`, `stage`, `worktrees`, `prs`, `artifacts`

## Decision

Adopt a **config-driven schema** approach: a new `config/pipeline-fields.json` file declares every pipeline entity field with its type, constraints, updatability, CLI flag, and description. The `work update` command reads this schema at runtime and dispatches generically.

This is the pilot for the broader Schema-Driven Configuration Design epic (#325).

## Approach

**Approach A: Field Definition File** was selected over two alternatives:

| Approach                     | Description                                           | Verdict                                                                      |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| **A: Field Definition File** | `config/pipeline-fields.json` read at runtime by `jq` | **Selected** — matches project conventions, zero build step, portable schema |
| B: Inline Metadata           | Bash heredoc function returning schema JSON           | Rejected — fragile, not consumable by non-shell tools                        |
| C: Code Generation           | Node.js/jq script generates static shell code         | Rejected — adds build step, drift risk, over-engineered for ~6 fields        |

## Schema Design — `config/pipeline-fields.json`

Top-level object keyed by field name. Every field on a pipeline entity gets a declaration:

```json
{
  "type": {
    "jsonType": "string",
    "description": "Pipeline type — determines which stages are available",
    "updatable": true,
    "required": true,
    "default": "vertical",
    "flag": "--type",
    "validate": { "source": "config/pipeline-types.json", "key": "slug" }
  },
  "auto": {
    "jsonType": "boolean",
    "description": "Skip human approval gates during pipeline advancement",
    "updatable": true,
    "required": false,
    "default": false,
    "flag": "--auto",
    "negateFlag": "--no-auto"
  },
  "issue": {
    "jsonType": "number",
    "description": "Linked GitHub issue number for tracking",
    "updatable": true,
    "required": false,
    "default": null,
    "flag": "--issue",
    "validate": { "type": "github-issue" }
  },
  "products": {
    "jsonType": "array",
    "description": "Product areas this pipeline touches",
    "updatable": true,
    "required": false,
    "default": [],
    "flag": "--products",
    "inputFormat": "csv",
    "validate": { "source": "config/products.json", "key": "slug" }
  },
  "tools": {
    "jsonType": "array",
    "description": "Tools and frameworks used in this pipeline",
    "updatable": true,
    "required": false,
    "default": [],
    "flag": "--tools",
    "inputFormat": "csv",
    "validate": { "source": "config/tools.json", "key": "slug" }
  }
}
```

Non-updatable fields (`id`, `name`, `stage`, `state`, `baseBranch`, `worktrees`, `prs`, `artifacts`, `kbDocs`, `createdAt`, `startedAt`, `completedAt`) are also declared with `"updatable": false` — this makes the schema a complete description of the entity shape and structurally prevents unauthorized updates.

### Schema Field Reference

| Schema Key        | Type                                                       | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `jsonType`        | `"string" \| "boolean" \| "number" \| "array" \| "object"` | Determines dispatch handler and jq update function         |
| `description`     | string                                                     | Human-readable description for help text and documentation |
| `updatable`       | boolean                                                    | Whether `work update` can modify this field                |
| `required`        | boolean                                                    | Whether `work define` requires this field                  |
| `default`         | any                                                        | Default value when field is not specified                  |
| `flag`            | string                                                     | CLI flag name (e.g., `"--type"`)                           |
| `negateFlag`      | string                                                     | Negation flag for booleans (e.g., `"--no-auto"`)           |
| `inputFormat`     | `"csv"`                                                    | How CLI input is parsed before storage                     |
| `validate.source` | string                                                     | Path to config file for slug validation                    |
| `validate.key`    | string                                                     | JSON key to validate against in source file                |
| `validate.type`   | string                                                     | Special validator name (e.g., `"github-issue"`)            |

## Runtime Architecture

### `_work_update()` — Three Phases

**Phase 1 — Load schema**:

```bash
local schema
schema=$(jq -r 'to_entries[] | select(.value.updatable == true)' "$PIPELINE_FIELDS_CONFIG")
```

**Phase 2 — Flag dispatch**:
Loop over `$@` arguments. For each flag:

1. Look up which field it maps to (match against `flag` or `negateFlag`)
2. Read the field's `jsonType`
3. Delegate to type-specific handler:
   - `string` → validate against `validate.source` if present → `_pipeline_update`
   - `boolean` → `_pipeline_update_json` with `true`/`false`
   - `number` → validate numeric → optional GitHub issue check → `_pipeline_update_json`
   - `array` → split CSV → trim whitespace → validate slugs → `_pipeline_update_json`

**Phase 3 — Report**: Print count + `_work_pipeline_status`.

### `_work_update_help()` — Auto-Generated

Reads schema, filters to `updatable: true`, formats each field's `flag`, `negateFlag`, `inputFormat`, and `description` into a usage block. Adding a new updatable field to the schema automatically updates help output.

## Shared Helpers (DRY Extraction)

Extracted into `pipeline-entity.sh` for reuse by `define`, `update`, and future commands:

| Helper                         | Signature                   | Purpose                                                       |
| ------------------------------ | --------------------------- | ------------------------------------------------------------- |
| `_pipeline_validate_csv_slugs` | `<config_file> <key> <csv>` | Split CSV, trim whitespace, validate each slug against config |
| `_pipeline_validate_issue`     | `<issue_num>`               | Validate numeric, best-effort GitHub check with `--` safety   |

## Review Fixes Addressed

| #   | Finding                            | Fix                                                |
| --- | ---------------------------------- | -------------------------------------------------- |
| 1   | `((updated++))` exit code 1 when 0 | `updated=$((updated + 1))`                         |
| 2   | `${2:?}` ugly error messages       | Explicit `if [[ -z ... ]]` with clear message      |
| 3   | Non-numeric `--issue` input        | `[[ "$val" =~ ^[0-9]+$ ]]` before `gh` call        |
| 4   | Missing field blocklist            | Structural: only `updatable: true` fields accepted |
| 5   | Flag injection on `gh issue view`  | Numeric validation + `-- "$issue_num"`             |
| 6   | No product/tool slug validation    | Validate against `validate.source` config          |
| 7   | Whitespace in CSV                  | `jq` trim with `gsub`                              |

## Files Changed

| File                             | Change                                                               |
| -------------------------------- | -------------------------------------------------------------------- |
| `config/pipeline-fields.json`    | **NEW** — field schema for all pipeline entity fields                |
| `scripts/lib/pipeline-update.sh` | **REWRITE** — config-driven flag dispatch, auto-help                 |
| `scripts/lib/pipeline-entity.sh` | **ADD** — `_pipeline_validate_csv_slugs`, `_pipeline_validate_issue` |
| `scripts/work.sh`                | **MINOR** — help text delegates to `_work_update_help`               |

## Testing

Manual verification:

- `work update <id> --type bug-fix` — validates against pipeline-types.json
- `work update <id> --auto` / `--no-auto` — toggles boolean
- `work update <id> --issue 306` — validates numeric + GitHub check
- `work update <id> --products quotes,garments` — validates slugs against products.json
- `work update <id> --tools nextjs,tailwind` — validates slugs against tools.json
- `work update <id> --state active` — rejected (not updatable)
- `work update <id> --bogus` — rejected (unknown flag)
- `work update --help` — shows auto-generated help from schema

## Future (Epic #325)

This pilot validates the schema shape. Subsequent sub-issues apply the same pattern to:

- `work define` (#327) — reads `required`, `default`, `flag` from schema
- `work status` (#326) — reads `description` for field labels
- Help text generation (#332) — unified `--help` across all commands
- GitHub issue templates (#329) — auto-generate dropdown options from configs
- Strategy doc (#331) — document the pattern for the team
