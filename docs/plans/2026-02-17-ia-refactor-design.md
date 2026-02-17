# Information Architecture Refactor — Design Document

**Date**: 2026-02-17
**Status**: Approved
**Branch**: `session/0217-ia-refactor`

---

## Problem

The repository has accumulated multiple overlapping locations for process artifacts — research docs, shaping outputs, breadboards, spikes, competitive analysis, and plans — spread across `docs/research/`, `docs/spikes/`, `docs/competitive-analysis/`, `docs/shaping/`, `docs/breadboards/`, `docs/plans/`, and `.claude/plans/`. These grew organically as the process evolved and now create:

1. **Agent confusion** — different skills and agents write to different locations with no consistent rule
2. **PR noise** — research and planning artifacts intermixed with code changes
3. **No lifecycle** — artifacts accumulate indefinitely with no retention policy
4. **KB underutilized** — `knowledge-base/src/content/strategy/` has only 2 files; pipelines (82 files) don't absorb their artifacts

Additionally, `root/components/` (33 files) predates `src/` and belongs in the clean architecture. `root/agent-outputs/` was aspirational and never used. `discovery-screenshots/` was a one-time Phase 1 research artifact.

---

## Design: Three-Zone Model

### Zone 1 — `tmp/` (gitignored, ephemeral)

Working scratch space. Nothing here is committed.

```
tmp/
  inbox/          ← drop zone (replaces root inbox/)
  outbox/         ← agent output for human review
  screenshots/    ← playwright screenshots, discovery captures
```

**Retention**: Delete at will. No process required.

### Zone 2 — `docs/workspace/` (committed, scoped by pipeline)

Active working artifacts during a pipeline. Committed so parallel Claude sessions can see in-progress research. Deleted on wrap-up after the KB doc absorbs key content.

```
docs/workspace/
  {YYYYMMDD-pipeline-id}/     ← one dir per pipeline
    research.md
    competitive-analysis.md
    interview.md
    frame.md
    shaping.md
    breadboard.md
    spike-*.md
    plan.md                   ← impl plan stays here during work
  adhoc-{MMDD-topic}/         ← for work without a pipeline ID
  legacy-phase1/              ← migration home for existing docs/* artifacts
    research/
    spikes/
    shaping/
    breadboards/
    competitive-analysis/
    strategy/
```

**Lifecycle**:

- Created: start of pipeline
- Committed: throughout (push after every logical chunk)
- Deleted: on wrap-up, after KB pipeline doc is written

### Zone 3 — `knowledge-base/` (committed, permanent)

The single durable record of what was built and why.

```
knowledge-base/src/content/
  pipelines/    ← one doc per pipeline session (existing)
  strategy/     ← cross-cutting architectural decisions
  products/     ← (future) per-product knowledge docs
  tools/        ← (future) per-tool knowledge docs
```

**The KB pipeline doc is the archive.** It absorbs key content from the workspace (not just links) so that workspace deletion loses nothing important.

---

## Wrap-Up Protocol (updated)

On pipeline wrap-up, before closing:

1. Write `knowledge-base/src/content/pipelines/YYYY-MM-DD-{pipeline-id}.md`
   - Absorb key findings from research, shaping, breadboard, decisions
   - Include links to PR(s) and commit SHAs
2. Delete `docs/workspace/{YYYYMMDD-pipeline-id}/`
3. Commit both the KB doc and the workspace deletion together

---

## Impl Plans — Special Case

Implementation plans (`.md` + `.yaml` manifests) stay in `docs/plans/` as committed artifacts **until the pipeline completes**, then are deleted during wrap-up (absorbed into the KB pipeline doc). This preserves cross-session coordination — a parallel Claude session can see what's being planned.

---

## Immediate Light Migration (Phase 0)

Changes that can happen now without touching agents/skills:

1. **Create `tmp/`**: `inbox/`, `outbox/`, `screenshots/`. Add to `.gitignore`. Move `discovery-screenshots/` contents → `tmp/screenshots/`. Move `root/inbox/` contents → `tmp/inbox/`. Delete original dirs.
2. **Delete `agent-outputs/`**: Was aspirational, never used.
3. **Move `docs/AGENTS.md` → `.claude/agents/AGENTS.md`**: Agents doc belongs next to agents.
4. **Update `.gitignore`**: Add `tmp/`, ensure `inbox/` entry is updated.

---

## Full Migration Plan (Phase 1–3)

**Phase 1 — Convention (must complete before migration)**
Define `docs/workspace/` as the canonical working location. Update `CLAUDE.md`, all agents, and all skills to reference `docs/workspace/{pipeline-id}/` instead of `docs/research/`, `docs/spikes/`, etc.

**Phase 2 — Migration**
Move all existing `docs/research/`, `docs/spikes/`, `docs/shaping/`, `docs/breadboards/`, `docs/competitive-analysis/` → `docs/workspace/legacy-phase1/`. Delete empty source dirs.

**Phase 3 — KB Backfill (long-term)**
For each major historical pipeline, write a KB pipeline doc that absorbs key content. Once written, delete `docs/workspace/legacy-phase1/` and `docs/plans/` (historical).

---

## What Does NOT Change

- `docs/` root-level canonical docs (`ROADMAP.md`, `PRD.md`, `APP_FLOW.md`, `ARCHITECTURE.md`, etc.) — these are permanent rules, not process artifacts
- `docs/reference/` — permanent reference material
- `docs/build-prompts/` — keep for now (assess later)
- `config/` — root-level, consumed by CLI tools and CI
- `root/components/` — migration tracked separately under clean architecture epic

---

## Success Criteria

- No agent or skill references `docs/research/`, `docs/spikes/`, `docs/competitive-analysis/`, `docs/shaping/`, or `docs/breadboards/`
- Every pipeline creates a `docs/workspace/{pipeline-id}/` directory at start
- Every pipeline writes a KB pipeline doc and deletes its workspace on wrap-up
- `tmp/` is gitignored and understood as ephemeral by all agents
- PR diffs contain code, config, KB docs, and workspace artifacts — no noise from undifferentiated research files
