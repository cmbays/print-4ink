# Pipeline Architecture Research — DevX Workflow Redesign

**Date**: 2026-02-15
**Source**: Interview session with project owner + codebase audit
**Related Issues**: #189 (explore structured DB), #190 (config centralization)
**Pipeline**: DevX infrastructure

---

## Executive Summary

The current `work` CLI pipeline system is over-sessionized for pre-build stages and under-engineered for the build stage. This research documents the gaps found, design decisions made, and the revised pipeline architecture that will replace the current system.

### Key Decisions Made

1. **Products ≠ Verticals**: Products are app feature suites (Quotes, Jobs). Verticals are operational pipeline instances that build/improve features. A vertical can cross products.
2. **Pipeline types are extensible**: Vertical, polish cycle, horizontal, bug fix — each a workflow type with different stage sets.
3. **Pre-build stages are over-sessionized**: Research → Interview → Shaping → Breadboard → Plan should be one session, one worktree, one Claude session.
4. **Build uses base branch + stacked PRs**: All build session PRs merge to a base branch. Human merges the base branch to main as the approval signal.
5. **Polish is a cycle, not a stage**: Polish becomes its own pipeline type (mini-pipeline) that bridges the 20% gap between vision and first build.
6. **Cooldown is batched**: Runs after N pipelines complete, not per-pipeline. Reads pipeline wrap-up docs.
7. **Hot file updates deferred to cooldown**: Pipeline wrap-up writes its own doc, doesn't touch PROGRESS.md.
8. **Auto mode**: `--auto` flag skips BOTH plan approval and merge approval. Binary choice.
9. **Claude session 1:1 coupling broken**: Sessions align to phases (shape, build, wrap-up), not to worktrees.
10. **Agent memory recommendations in wrap-up**: Each pipeline wrap-up doc includes a section for recommended memory updates scoped to specific agents.

---

## Problem Statement

The `work` CLI system has the right pieces (worktrees, Zellij sessions, Claude sessions, phase commands, manifests, registry) but they don't enforce a coherent end-to-end flow:

- **Verticals list defined in 5 places**, already drifting (KB Sidebar missing dtf-gang-sheet, devx)
- **Stage naming conflicts**: KB uses "breadboarding" / "implementation-planning", work.sh uses "breadboard" / "plan"
- **No stage gates**: Nothing validates stage N outputs before stage N+1
- **No manifest enforcement**: Garment mockup engine had an impl plan but no YAML manifest — `work build` couldn't use it
- **Pre-build overhead**: 4 worktrees + 4 npm installs + 4 Zellij tabs for doc-only stages
- **No vertical state tracking**: Must read PROGRESS.md to know where a vertical is
- **Cleanup is manual and risky**: Per-topic cleanup, sessions accidentally delete other sessions

---

## Canonical Product Names

Products match what the app shows to users:

| Product | Route | Slug | Notes |
|---|---|---|---|
| Dashboard | `/dashboard` | `dashboard` | |
| Quotes | `/quotes` | `quotes` | Includes DTF Gang Sheet Builder as a feature |
| Customers | `/customers` | `customers` | |
| Invoices | `/invoices` | `invoices` | |
| Jobs | `/jobs` | `jobs` | |
| Garments | `/garments` | `garments` | |
| Screens | (integrated) | `screens` | May change after demo feedback |
| Pricing | `/settings/pricing` | `pricing` | |

**Not products** (cross-cutting / tooling): mobile-optimization, devx, meta

**Slug renames needed** (part of #190 config audit):
- `quoting` → `quotes`
- `invoicing` → `invoices`
- `customer-management` → `customers`
- `price-matrix` → `pricing`
- `screen-room` → `screens`

---

## Pipeline Types

```json
{
  "vertical": {
    "label": "Vertical",
    "description": "Full end-to-end feature development pipeline",
    "stages": ["research", "interview", "shaping", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  "polish": {
    "label": "Polish Cycle",
    "description": "Bridging the gap between vision and first build (the other 20%)",
    "stages": ["interview", "shaping", "breadboard", "plan", "build", "review", "wrap-up"]
  },
  "horizontal": {
    "label": "Horizontal",
    "description": "Cross-cutting infrastructure work affecting multiple products",
    "stages": ["research", "plan", "build", "review", "wrap-up"]
  },
  "bug-fix": {
    "label": "Bug Fix",
    "description": "Fixing broken functionality",
    "stages": ["build", "review", "wrap-up"]
  }
}
```

Pipeline types are extensible — new types added to config as workflow needs arise.

---

## Pipeline Entity Design

```json
{
  "id": "pl-0215-quotes-v2",
  "type": "vertical",
  "products": ["quotes", "invoices"],
  "stage": "build",
  "manifest": "docs/plans/2026-02-15-quotes-v2-manifest.yaml",
  "baseBranch": "build/quotes-v2",
  "worktrees": ["session-0215-quotes-v2-schemas", "session-0215-quotes-v2-list"],
  "prs": {
    "shaping": 200,
    "build": [201, 202, 203],
    "final": 204
  },
  "kbDocs": ["2026-02-15-quotes-v2-research.md", "2026-02-15-quotes-v2-breadboard.md"],
  "claudeSessions": {
    "shaping": "session-id-abc",
    "wrapUp": "session-id-def"
  },
  "status": "active",
  "createdAt": "2026-02-15T10:00:00Z",
  "completedAt": null
}
```

---

## Revised Pipeline Architecture

### Phase 1: SHAPING (one worktree, one Claude, sequential stages)

**Stages**: Research → Interview → Shaping Skill → Breadboard → Plan

**Session architecture**:
- One worktree for the entire shaping phase
- One branch, one PR (or stacked commits with staged merges)
- Each stage = a commit on the same branch
- One Claude session (resumable — good context to preserve)

**Human involvement**:
- Research: automated, human reviews KB doc later if needed
- Interview: HUMAN REQUIRED (sequential, full attention)
- Shaping skill: automated (synthesis of interview findings)
- Breadboard: automated, produces mermaid visuals in KB doc
- Plan: automated, human approves manifest BY DEFAULT (skippable with `--auto`)

**Outputs**: Research docs, interview findings, shaped problem definition, breadboard, impl plan + YAML manifest

**Command**: `work shape <product-or-topic>` — runs all stages in sequence

### Phase 2: BUILD (base branch + N stacked session branches)

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
  └── build/<pipeline-id>              ← base branch
        ├── session/MMDD-<topic-1>     ← Wave 0, PR → base (merged ✓)
        ├── session/MMDD-<topic-2>     ← Wave 1, PR → base (parallel)
        ├── session/MMDD-<topic-3>     ← Wave 1, PR → base (parallel)
        └── (final review fixes committed directly on base)

        PR: build/<pipeline-id> → main  ← HUMAN MERGES THIS
```

### Phase 3: FINAL REVIEW (base branch, holistic audit)

**What gets reviewed**:
- All breadboard affordances implemented?
- Canonical docs compliance (design system, coding standards)
- Integration: do the pieces work together?
- KB docs created for each build session?
- Tests pass, types check, build succeeds (Vercel build MUST pass)

**Human involvement**: MERGE THE PR (this is the approval signal)

**Claude merge detection**:
```bash
while true; do
  state=$(gh pr view "$PR_NUMBER" --json state -q '.state')
  [[ "$state" == "MERGED" ]] && break
  sleep 90
done
# Continue to wrap-up
```

### Phase 4: WRAP-UP (automated, no human)

**Creates**: `docs/pipelines/<pipeline-id>-wrap-up.md`

**Contents**:
- What was built (from manifest + PRs)
- What changed from the plan
- Patterns discovered
- Issues found during review
- Learnings for future pipelines
- Links to all PRs, KB docs, breadboard
- **Recommended agent memory updates** (which insights → which agents)

**Does NOT update**: PROGRESS.md (deferred to cooldown)
**Updates**: Pipeline state → "complete" in registry

### COOLDOWN (batched, periodic)

- Runs after N pipelines complete
- Reads all pipeline wrap-up docs since last cooldown
- Synthesizes cross-cutting themes
- Updates PROGRESS.md (one update, not per-pipeline)
- Shapes next cycle's bets
- Updates ROADMAP.md if strategic direction shifts
- Human: strategic decisions on next bets

---

## Polish Cycle (Workflow Type)

Not a pipeline stage — its own pipeline type. Triggered by feedback after initial build.

**Purpose**: Bridges the 20% gap between vision and what was built. NOT just bug fixes — includes:
- Pivots from experience/learnings
- Communication gaps (vision wasn't fully conveyed)
- UX improvements that emerge from seeing the built product

**Stages**: Interview (issues found) → Shaping → Breadboard → Plan → Build → Review → Wrap-up

**KB docs**: One per polish cycle, not split across stages. References the original build pipeline.

**Future**: May relate to versioning and git tags.

---

## Automation Boundaries

```
SHAPING:
  Research    → Automated (human reviews KB doc later if needed)
  Interview   → HUMAN REQUIRED
  Shaping     → Automated (shaping skill)
  Breadboard  → Automated (produces mermaid visuals)
  Plan        → Automated (human approves manifest by default, skip with --auto)

BUILD:
  All waves   → Fully automated (build → mini-review → CodeRabbit → merge)

FINAL REVIEW:
  Audit       → Automated (review agents)
  Merge       → HUMAN MERGES PR (or skip with --auto)

WRAP-UP:
  Everything  → Fully automated

AUTO MODE (--auto):
  Skips BOTH plan approval AND merge approval
  Pipeline runs end-to-end unattended
  Binary: either human is in the loop at both checkpoints or neither
```

---

## Config Architecture

### Tier 1: Project Identity
```
config/products.json       # App products (Dashboard, Quotes, Customers, etc.)
config/stages.json         # Pipeline stages (research, interview, shaping, etc.)
config/tags.json           # KB tags (feature, build, plan, decision, etc.)
```

### Tier 2: Pipeline Definition
```
config/workflows.json      # Pipeline types (vertical, polish, horizontal, bug-fix)
config/pipeline.json       # Stage prerequisites, required outputs, gate rules
```

### Tier 3: Pipeline State
```
Pipeline registry (JSON or DB) — instances of pipelines with state
Session registry — child sessions within pipelines
```

### Tier 4: App-Domain Constants
```
config/navigation.json     # Nav items shared between sidebar, bottom tab, mobile drawer
config/service-types.json  # screen-print, dtf, embroidery
```

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

### Stream A: Config Foundation (#190) — already running
Config audit, canonical slug migration, products.json, stages.json

### Stream B: Pipeline Architecture — new issue
Pipeline entity design, `work shape`, base branch builds, stage gates, merge detection, wrap-up automation, batch cleanup

### Stream C: Shaping Skill — parallelizable with B
Shaping skill between interview and breadboard

### Stream D: Demo Prep — independent
Mockup manifest + build, onboarding wizards, DTF gang sheet

### Sequencing
```
NOW:     Stream A (config) + Stream D (demo)
AFTER A: Stream B (pipeline) + Stream C (shaping)
AFTER B: All future work uses new pipeline system
```

---

## Open Questions for Future

- Multi-user: when does 4Ink need other employees? Affects auth architecture.
- DTF vs Screen Print quoting integration
- Agent memory architecture: shared memory groups, scoped access per agent type
- Claude session naming (human-friendly names — requires CLI changes)
- Vertical state vs pipeline state in registry (computed vs stored)
