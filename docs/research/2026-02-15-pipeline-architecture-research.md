# Pipeline Architecture Research — DevX Workflow Redesign

**Date**: 2026-02-15
**Source**: Interview session with project owner + codebase audit + shaping skills alignment review
**Related Issues**: #192 (pipeline arch), #201 (research skills), #214 (extensibility), #193 (session naming, icebox)
**Pipeline**: DevX infrastructure

---

## Executive Summary

The current `work` CLI pipeline system is over-sessionized for pre-build stages and under-engineered for the build stage. This research documents the gaps found, design decisions made, and the revised pipeline architecture that will replace the current system.

### Key Decisions Made

1. **Pipelines are first-class entities**: Pipelines have a type, ID, name, and lifecycle. They link to products and tools via arrays, not 1:1 mappings.
2. **Products ≠ Pipelines**: Products are app feature suites (Quotes, Jobs). Pipelines are operational instances that build/improve products and tools. A pipeline can cross products.
3. **Eliminate `verticals.json`**: Pipeline names are free text labels, not config-backed enums. Products and tools provide the structured validation layer.
4. **Pipeline types are extensible**: Vertical, polish cycle, horizontal, bug fix — each a type with different stage sets. Config lives in `pipeline-types.json`.
5. **Three phases**: Pre-build (research → plan), Build (waves), Post-build (review → wrap-up). No naming overlap with stages.
6. **`work define` / `work start` split**: Define creates the pipeline entity (ready state). Start executes it. Enables pooled work, future automation, and configuration before execution.
7. **Canonical stage slugs**: 8 short, un-tensed names: research, interview, shape, breadboard, plan, build, review, wrap-up. Stage names ≠ skill names.
8. **BB reflection is a sub-step of breadboard**: Not its own stage. Produces an artifact (`reflection.md`) tracked under the breadboard stage.
9. **Pipeline ID format**: `YYYYMMDD-topic` (e.g., `20260215-colors`). Human-readable, sortable, unique at the day+topic level.
10. **Build uses base branch + stacked PRs**: All build session PRs merge to a base branch. Human merges the base branch to main.
11. **Cooldown is batched**: Runs after N pipelines complete. Reads all wrap-up docs since last cooldown.
12. **Auto mode**: `--auto` flag set at define time, skips BOTH plan approval and merge approval. Binary choice.
13. **Agent memory recommendations in wrap-up**: Each pipeline wrap-up doc includes recommended memory updates scoped to specific agents.
14. **Entity-first artifact directories**: Artifacts organized by entity (product/tool) → pipeline ID. Deferred to #192 implementation.

---

## Problem Statement

The `work` CLI system has the right pieces (worktrees, sessions, Claude sessions, phase commands, manifests, registry) but they don't enforce a coherent end-to-end flow:

- **Verticals list defined in 5 places**, already drifting (KB Sidebar missing dtf-gang-sheet, devx)
- **Stage naming conflicts**: KB uses "breadboarding" / "implementation-planning", work.sh uses "breadboard" / "plan"
- **No stage gates**: Nothing validates stage N outputs before stage N+1
- **No manifest enforcement**: Garment mockup engine had an impl plan but no YAML manifest — `work build` couldn't use it
- **Pre-build overhead**: 4 worktrees + 4 npm installs + 4 tabs for doc-only stages
- **No pipeline state tracking**: Must read PROGRESS.md to know where things are
- **Cleanup is manual and risky**: Per-topic cleanup, sessions accidentally delete other sessions

---

## Entity Types

### Products (App Feature Suites)

Products match what the app shows to users. Config: `config/products.json`

| Product   | Route               | Slug        |
| --------- | ------------------- | ----------- |
| Dashboard | `/dashboard`        | `dashboard` |
| Quotes    | `/quotes`           | `quotes`    |
| Customers | `/customers`        | `customers` |
| Invoices  | `/invoices`         | `invoices`  |
| Jobs      | `/jobs`             | `jobs`      |
| Garments  | `/garments`         | `garments`  |
| Screens   | `/screens`          | `screens`   |
| Pricing   | `/settings/pricing` | `pricing`   |

### Tools (Dev Infrastructure)

Dev-facing systems and tooling. Config: `config/tools.json`

| Tool              | Slug                |
| ----------------- | ------------------- |
| Work Orchestrator | `work-orchestrator` |
| Skills Framework  | `skills-framework`  |
| Agent System      | `agent-system`      |
| Knowledge Base    | `knowledge-base`    |
| CI Pipeline       | `ci-pipeline`       |

### Pipelines (Work Instances)

Pipelines are operational instances that build/improve products and tools. They are NOT defined in a config file — pipeline names are free text labels that emerge from the work itself. Products and tools provide the structured enum validation.

---

## Pipeline Model

| Concept           | What It Is                           | Example                                       | Source                              |
| ----------------- | ------------------------------------ | --------------------------------------------- | ----------------------------------- |
| **Pipeline**      | An instance of development work      | —                                             | Pipeline registry                   |
| **Pipeline Type** | Workflow template defining stages    | `vertical`, `polish`, `horizontal`, `bug-fix` | `config/pipeline-types.json` (enum) |
| **Pipeline ID**   | Unique identifier (`YYYYMMDD-topic`) | `20260215-colors`                             | Generated at `work define`          |
| **Pipeline Name** | Human-friendly label (= topic)       | `colors`, `quotes-backend`                    | Free text at `work define`          |

### Pipeline ID Generation

Format: `YYYYMMDD-topic`

- **YYYYMMDD**: Date the pipeline is defined
- **topic**: The name provided by the human (kebab-case, 1-3 words)
- **Uniqueness**: Enforced at the ID level. Same topic on the same day → refine the name
- **Usage**: Branch names, directory names, CLI commands, KB frontmatter, URLs

```
Branch:      build/20260215-colors
Directory:   docs/products/garments/20260215-colors/
CLI:         work build 20260215-colors
Frontmatter: pipelineId: "20260215-colors"
```

### Pipeline Lifecycle States

```
ready → active → building → reviewing → wrapped → cooled
```

| State       | Meaning                                    | Transition                  |
| ----------- | ------------------------------------------ | --------------------------- |
| `ready`     | Defined and configured, waiting to start   | `work define` creates       |
| `active`    | Pre-build stages running (research → plan) | `work start` transitions    |
| `building`  | Build waves running                        | Auto after plan approval    |
| `reviewing` | Final review, waiting for human merge      | Auto after build complete   |
| `wrapped`   | Wrap-up done, waiting for cooldown batch   | `work end` transitions      |
| `cooled`    | Cooldown processed, pipeline complete      | `work cooldown` transitions |

---

## Pipeline Types

Config: `config/pipeline-types.json` (renamed from `workflows.json`)

```json
[
  {
    "slug": "vertical",
    "label": "Vertical",
    "description": "Full end-to-end feature development pipeline",
    "stages": ["research", "interview", "shape", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "polish",
    "label": "Polish",
    "description": "Bridging the gap between vision and first build (the other 20%)",
    "stages": ["interview", "shape", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "horizontal",
    "label": "Horizontal",
    "description": "Cross-cutting infrastructure work affecting multiple products",
    "stages": ["research", "plan", "build", "review", "wrap-up"]
  },
  {
    "slug": "bug-fix",
    "label": "Bug Fix",
    "description": "Fixing broken functionality",
    "stages": ["build", "review", "wrap-up"]
  }
]
```

Pipeline types are extensible — new types added to config as needs arise.

---

## Canonical Stage Slugs

Config: `config/stages.json`

| #   | Stage        | Skill(s)                                  | Agent(s)                           | Notes                                            |
| --- | ------------ | ----------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| 1   | `research`   | _(future, #201)_                          | `feature-strategist` + sub-agents  | Internal + external research                     |
| 2   | `interview`  | `pre-build-interrogator`                  | `requirements-interrogator`        | Human required                                   |
| 3   | `shape`      | `shaping`                                 | _(main session)_                   | Stage ≠ skill name                               |
| 4   | `breadboard` | `breadboarding` + `breadboard-reflection` | _(main session)_                   | Reflection is sub-step, produces `reflection.md` |
| 5   | `plan`       | `implementation-planning`                 | _(main session)_                   | Produces manifest                                |
| 6   | `build`      | `screen-builder`, `quality-gate`          | `frontend-builder`                 | Base branch + stacked PRs                        |
| 7   | `review`     | `design-audit`                            | `design-auditor`, `build-reviewer` | Human merges PR                                  |
| 8   | `wrap-up`    | `doc-sync` _(partial)_                    | _(main session)_                   | Learnings + doc sync + summary                   |

**Non-pipeline operations**: `cooldown` (batched across completed pipelines, not per-pipeline)

**Stage names ≠ skill names**: The `shaping` skill is invoked during the `shape` stage. The `breadboarding` skill is invoked during the `breadboard` stage. Skills come from external packages and don't need to match stage slugs 1:1.

---

## Pipeline Entity Design

```json
{
  "id": "20260215-colors",
  "name": "colors",
  "type": "vertical",
  "products": ["garments", "customers"],
  "tools": [],
  "stage": "build",
  "state": "building",
  "issue": 42,
  "auto": false,
  "artifacts": {
    "research": "docs/products/garments/20260215-colors/research-findings.md",
    "shape": {
      "frame": "docs/products/garments/20260215-colors/frame.md",
      "shaping": "docs/products/garments/20260215-colors/shaping.md"
    },
    "breadboard": {
      "breadboard": "docs/products/garments/20260215-colors/breadboard.md",
      "reflection": "docs/products/garments/20260215-colors/reflection.md"
    },
    "plan": "docs/products/garments/20260215-colors/manifest.yaml",
    "wrap-up": "docs/products/garments/20260215-colors/wrap-up.md"
  },
  "baseBranch": "build/20260215-colors",
  "worktrees": ["session-0215-colors-schemas", "session-0215-colors-list"],
  "prs": {
    "pre-build": 200,
    "build": [201, 202, 203],
    "final": 204
  },
  "kbDocs": ["2026-02-15-colors-research.md", "2026-02-15-colors-breadboard.md"],
  "claudeSessions": {
    "pre-build": "session-id-abc",
    "build": ["session-id-def", "session-id-ghi"],
    "post-build": "session-id-jkl"
  },
  "createdAt": "2026-02-15T10:00:00Z",
  "startedAt": "2026-02-15T10:05:00Z",
  "completedAt": null
}
```

**Products/tools are updated throughout**: Not required at define time. Updated at each stage handoff as scope becomes clearer. Part of stage gate: before transitioning, pipeline config for products/tools should reflect current scope. Can be auto-derived from diffs in future (#214).

---

## Phase Architecture

Three phases, three commands, no naming overlap with stages.

### Pre-build (research → interview → shape → breadboard → plan)

**Command**: `work start <id>`
**Session architecture**:

- One worktree for the entire pre-build phase
- One branch, one PR (or stacked commits)
- Each stage = a commit on the same branch
- One Claude session (resumable — good context to preserve)

**Human involvement**:

- Research: automated (team of sub-agents for internal + external research)
- Interview: HUMAN REQUIRED (the only mandatory human stage)
- Shape: automated (shaping skill)
- Breadboard: automated (breadboarding + reflection skills, produces mermaid visuals)
- Plan: automated (human approves manifest BY DEFAULT, skip with `--auto`)

**Outputs**: Research findings, interview notes, frame + shaping docs, breadboard + reflection, impl plan + YAML manifest

### Build (build waves)

**Command**: `work build <id>`
**Session architecture**:

- Base branch: `build/<pipeline-id>`
- Each wave spawns N session branches stacked on base
- Each session: code → test → self-review → PR (draft) → thorough self-review → mark ready → CodeRabbit → address issues → merge to base

**CodeRabbit merge rules**:

1. Keep PR in draft mode during self-review
2. Mark ready for review when self-review complete
3. CodeRabbit reviews
4. If NO critical/major issues: address ALL issues, merge to base
5. If critical/major issues: fix, resubmit for re-review
6. Once no critical/major remaining: address all remaining issues, merge (don't wait for another review cycle)

**Wave progression**:

- Wave 0 must merge to base before Wave 1 starts
- Within a wave: sessions are parallel
- Auto-wave advancement when all sessions in wave N merge

**Human involvement**: NONE during build phase

**Stacked PR flow**:

```
main
  └── build/20260215-colors              ← base branch
        ├── session/0215-colors-schemas  ← Wave 0, PR → base (merged)
        ├── session/0215-colors-list     ← Wave 1, PR → base (parallel)
        ├── session/0215-colors-detail   ← Wave 1, PR → base (parallel)
        └── (final review fixes committed directly on base)

        PR: build/20260215-colors → main  ← HUMAN MERGES THIS
```

### Post-build (review → wrap-up)

**Command**: `work end <id>`

**Review stage**:

- All breadboard affordances implemented?
- Canonical docs compliance (design system, coding standards)
- Integration: do the pieces work together?
- KB docs created for each build session?
- Tests pass, types check, build succeeds (Vercel build MUST pass)
- Human involvement: MERGE THE PR (this is the approval signal)

**Claude merge detection**:

```bash
while true; do
  state=$(gh pr view "$PR_NUMBER" --json state -q '.state')
  [[ "$state" == "MERGED" ]] && break
  sleep 90
done
# Continue to wrap-up
```

**Wrap-up stage**:

- Creates wrap-up doc in pipeline artifact directory
- Contents: what was built, plan deviations, patterns discovered, review issues, learnings, PR/KB doc links, recommended agent memory updates
- Does NOT update PROGRESS.md (deferred to cooldown)
- Updates pipeline state → `wrapped`

### Cooldown (batched, periodic)

**Command**: `work cooldown`

- Runs after N pipelines reach `wrapped` state
- Reads all wrap-up docs since last cooldown
- Synthesizes cross-cutting themes
- Updates PROGRESS.md (one update, not per-pipeline)
- Shapes next cycle's bets
- Updates ROADMAP.md if strategic direction shifts
- Human: strategic decisions on next bets
- Transitions pipelines from `wrapped` → `cooled`

---

## Work Command Set

| Command              | Phase      | What It Does                                                 | Who Triggers            |
| -------------------- | ---------- | ------------------------------------------------------------ | ----------------------- |
| `work define <name>` | —          | Create pipeline entity, link to issue, configure type/flags  | Human                   |
| `work start <id>`    | Pre-build  | Create worktree, launch Claude, run research → plan          | Human (future: agent)   |
| `work build <id>`    | Build      | Read manifest, run build waves                               | Automated (after plan)  |
| `work end <id>`      | Post-build | Run review + wrap-up, mark as wrapped                        | Automated (after merge) |
| `work status [<id>]` | —          | Dashboard (no id) or deep dive (with id)                     | Human or agent          |
| `work list`          | —          | Infrastructure view: worktrees, sessions, ports per pipeline | Human                   |
| `work clean <id>`    | —          | Remove worktrees, branches for completed pipeline            | Human                   |
| `work cooldown`      | —          | Batch process wrapped pipelines, update PROGRESS.md          | Human                   |

### `work define` — Pipeline Creation

```bash
work define <name> [--type <type>] [--issue <number>] [--prompt "<text>"] [--auto]
```

- `<name>`: The pipeline name/topic (becomes part of the ID)
- `--type`: Pipeline type (default: `vertical`)
- `--issue`: GitHub issue number to link (preferred input method)
- `--prompt`: Inline prompt as seed context (creates issue automatically)
- `--auto`: Skip plan approval and merge approval
- Products/tools: NOT specified at define time. Updated during stages.

Creates pipeline in `ready` state. Does NOT start execution.

### `work start` — Pipeline Execution

Picks up a `ready` pipeline:

1. Creates worktree + branch from main
2. Launches Claude session
3. Claude reads: linked issue, product/tool entity docs, prior pipeline wrap-ups, ROADMAP.md
4. Evaluates issue against research agent menu, launches relevant sub-agents (#201)
5. Runs through pre-build stages sequentially: research → interview → shape → breadboard → plan

### `work status` — Pipeline Visibility

- **`work status`** (no args): Dashboard — all pipelines grouped by state (ready/active/building/reviewing/wrapped), progress indicators, quality gate checkpoints, staleness alerts
- **`work status <id>`**: Deep dive — single pipeline detail, all completed stages with artifacts, current stage progress, products/tools, linked issue, PRs, KB docs

### `work list` — Infrastructure View

Worktrees, sessions, ports organized per pipeline. Evolution of today's `work list` format but grouped by pipeline instead of separate lists.

---

## Stage Gates

Artifact-based completion. Each stage has required outputs that must exist before transitioning.

```json
{
  "stages": {
    "research": {
      "artifacts": ["research-findings.md"],
      "gate": "artifact-exists",
      "next": "interview"
    },
    "interview": {
      "artifacts": ["interview-notes.md"],
      "gate": "human-confirms",
      "next": "shape"
    },
    "shape": {
      "artifacts": ["frame.md", "shaping.md"],
      "gate": "artifact-exists",
      "next": "breadboard"
    },
    "breadboard": {
      "artifacts": ["breadboard.md", "reflection.md"],
      "gate": "artifact-exists",
      "next": "plan"
    },
    "plan": {
      "artifacts": ["manifest.yaml"],
      "gate": "human-approves-manifest",
      "next": "build"
    }
  },
  "auto-overrides": {
    "human-confirms": "artifact-exists",
    "human-approves-manifest": "artifact-exists"
  }
}
```

Pipeline state file tracks completion:

```json
{
  "pipelineId": "20260215-colors",
  "currentStage": "shape",
  "completed": {
    "research": { "at": "2026-02-15T10:00:00Z", "artifacts": ["research-findings.md"] },
    "interview": { "at": "2026-02-15T11:00:00Z", "artifacts": ["interview-notes.md"] }
  }
}
```

When an agent finishes a stage:

1. Writes required artifacts
2. Updates pipeline state with completion metadata
3. Updates products/tools in pipeline config if scope changed
4. Orchestrator checks if all artifacts exist and gates pass
5. If yes → triggers next stage automatically
6. If no → reports what's missing

In `--auto` mode, all `human-*` gates fall through to `artifact-exists`. Interview inherently needs human input regardless.

---

## Automation Boundaries

```
PRE-BUILD:
  Research    → Automated (team of sub-agents for internal + external)
  Interview   → HUMAN REQUIRED (only mandatory human stage)
  Shape       → Automated (shaping skill)
  Breadboard  → Automated (breadboarding + reflection skills)
  Plan        → Automated (human approves manifest by default, skip with --auto)

BUILD:
  All waves   → Fully automated (build → self-review → CodeRabbit → merge to base)

POST-BUILD:
  Review      → Automated audit, HUMAN MERGES PR (or skip with --auto)
  Wrap-up     → Fully automated

AUTO MODE (--auto, set at work define):
  Skips BOTH plan approval AND merge approval
  Pipeline runs end-to-end unattended
  Binary: either human is in the loop at both checkpoints or neither
```

---

## Entity-First Artifact Directory Structure

Artifacts organized by entity first, pipeline ID second. All artifacts for a pipeline run co-located in one directory.

```
docs/
  products/
    garments/                           # Product entity
      20260215-colors/                  # Pipeline instance
        research-findings.md            # from research stage
        interview-notes.md              # from interview stage
        frame.md                        # from shape stage
        shaping.md                      # from shape stage
        spike-brand-detail.md           # from shape stage
        breadboard.md                   # from breadboard stage
        reflection.md                   # from breadboard stage (sub-step)
        manifest.yaml                   # from plan stage
        wrap-up.md                      # from wrap-up stage
      20260301-garments-polish/         # Another pipeline on same entity
        ...
  tools/
    work-orchestrator/                  # Tool entity
      20260220-work-v3/
        ...
```

**Implementation**: Deferred to #192. Skills need path injection from the pipeline orchestrator. Existing artifacts (docs/breadboards/, docs/shaping/) grandfathered — new structure for pipeline-managed work only.

---

## Polish Cycle (Pipeline Type)

Not a pipeline stage — its own pipeline type. Triggered by feedback after initial build.

**Purpose**: Bridges the 20% gap between vision and what was built. NOT just bug fixes — includes:

- Pivots from experience/learnings
- Communication gaps (vision wasn't fully conveyed)
- UX improvements that emerge from seeing the built product

**Stages**: interview → shape → breadboard → plan → build → review → wrap-up

**KB docs**: Tracked as pipeline docs, referencing the same products as the original build.

---

## Config Architecture

### Tier 1: Project Identity

```
config/products.json          # App products (enum: Dashboard, Quotes, Customers, ...)
config/tools.json             # Dev tools (enum: Work Orchestrator, Skills Framework, ...)
config/pipeline-types.json    # Pipeline types (enum: vertical, polish, horizontal, bug-fix)
config/stages.json            # Pipeline stages (enum: research, interview, shape, ...)
config/tags.json              # KB tags (enum: feature, build, plan, decision, ...)
```

### Tier 2: Pipeline Definition

```
config/pipeline-gates.json    # Stage prerequisites, required artifacts, gate rules
```

### Tier 3: Pipeline State

```
Pipeline registry (JSON or DB) — instances of pipelines with state
Session registry — child sessions within pipelines
```

### Tier 4: App-Domain Constants

```
config/navigation.json        # Nav items shared between sidebar, bottom tab, mobile drawer
config/service-types.json     # screen-print, dtf, embroidery
```

**Eliminated**: `verticals.json` — pipeline names are free text, not config-backed enums.
**Renamed**: `workflows.json` → `pipeline-types.json`

---

## KB Frontmatter Evolution

### Pipeline Docs

**Current:**

```yaml
pipeline: quoting # enum → verticals.json
pipelineType: vertical # enum → workflows.json
products: [quotes]
tools: []
stage: shaping
```

**New:**

```yaml
pipelineName: quoting # free text label (human-readable)
pipelineId: '20260208-quoting' # unique ID (optional for legacy docs)
pipelineType: vertical # enum → config/pipeline-types.json
products: [quotes] # enum → config/products.json
tools: [] # enum → config/tools.json
stage: shape # enum → config/stages.json (short names)
```

**Migration**: ~60+ pipeline docs need `pipeline` → `pipelineName` rename and stage slug updates. Mechanical, scriptable.

**Route generation**: `/pipelines/[pipelineName]` routes derived from unique `pipelineName` values in content via `getStaticPaths()`. No config file needed.

---

## Gaps Identified

1. **No stage gates**: Nothing validates stage N outputs before stage N+1
2. **No manifest enforcement**: Plans exist without manifests (mockup engine example)
3. **Pre-build over-sessionized**: 4 worktrees for doc-only work
4. **No pipeline state tracking**: Must read PROGRESS.md manually
5. **Session cleanup manual and risky**: Per-topic, sessions can delete each other
6. **Config duplication**: Verticals in 5 places, stages in 3, naming conflicts
7. **Product naming inconsistent**: quoting vs quotes, invoicing vs invoices
8. **No base branch pattern for builds**: Each session PR goes to main, no holistic review
9. **No automated post-merge flow**: Learnings and wrap-up are manual
10. **Cooldown per-pipeline instead of batched**: Inefficient, misses cross-cutting themes

---

## Implementation Streams

### Stream A: Config Foundation (#190) — MERGED

Config centralization done. Canonical slug migration, products.json, tools.json created.

### Stream B: KB Taxonomy Restructure (#206) — MERGED

Products, tools, strategy collections. Pipeline docs renamed from sessions. Route restructure.

### Stream C: Shaping Skills Suite (#199) — MERGED

Shaping skill (R × S), breadboarding upgrade (vertical slicing), breadboard reflection, ripple hook.

### Stream D: Pipeline Architecture (#192) — NEXT

Pipeline entity design, config updates (stage slugs, pipeline-types.json, eliminate verticals.json), `work` command updates (define/start/build/end), stage gates, merge detection, wrap-up automation.

### Stream E: Research Skills (#201) — AFTER D

Research agent/skills for the pipeline research stage. Multiple research modalities with sub-agents.

### Stream F: Pipeline Extensibility (#214) — BACKLOG

Cron-triggered agents, headless sessions, interview queuing, auto flag propagation.

### Sequencing

```
DONE:    Stream A (config) + Stream B (KB) + Stream C (shaping)
NEXT:    Stream D (pipeline architecture)
AFTER D: Stream E (research skills)
BACKLOG: Stream F (extensibility)
```

---

## Open Questions for Future

- Multi-user: when does 4Ink need other employees? Affects auth architecture.
- DTF vs Screen Print quoting integration
- Agent memory architecture: shared memory groups, scoped access per agent type
- Claude session naming (human-friendly names — requires CLI changes, #193)
- Work status dashboard visual design
- Pipeline auto-derive products/tools from git diffs
- Interview queuing for headless sessions
