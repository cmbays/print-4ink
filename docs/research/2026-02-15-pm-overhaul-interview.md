# Project Management Overhaul — Interview Notes

**Pipeline**: `20260215-pm-overhaul`
**Stage**: Interview
**Date**: 2026-02-16
**Issue**: #216
**Branch**: `session/0215-pm-overhaul-research`
**Interviewee**: Christopher Bays (solo dev, project owner)

---

## Executive Summary

This interview clarified 15 decision areas for the PM overhaul, covering label strategy, dependency encoding, project board setup, pipeline lifecycle, GitHub Actions, and the broader operating rhythm for AI-agent-driven development. The key theme: **build infrastructure that enables agent autonomy while keeping humans at three strategic touchpoints (Bet, Interview, Smoke Test).**

---

## Decisions

### 1. Label Rename (`vertical/*` → `product/*` + `tool/*`)

**Decision**: Defer to #202.

Labels stay `vertical/*` for now. The rename happens in #202 (codebase-wide `vertical` → `pipeline` rename) to keep terminology consistent across labels, code, and config simultaneously.

### 2. Sub-Issue Migration

**Decision**: Batch convert all 23 task-list issues now.

All issues currently using task-list checkboxes (`- [ ] #123`) get converted to native GitHub sub-issues during backlog grooming. Clean break — everything uses the new pattern.

### 3. Project Board Ownership

**Decision**: User-owned project (`users/cmbays/projects/`).

Survives repo transfers, supports Projects v2 fully. Requires PAT with `project` scope for Actions. Run `gh auth refresh -s project` before setup.

### 4. PROGRESS.md Strategy

**Decision**: Auto-generate (gitignored) + Project board for visual.

PROGRESS.md becomes a **compiled artifact**, not a source file:
- Gitignored — not tracked in version control
- Generated on-the-fly by `work progress` command at session start
- Queries GitHub API: milestones, priorities, blocked items, recent PRs
- Agents read the file (fast, no API calls needed during session)
- No hot file conflicts, no staleness, no merge friction
- KB sessions handle historical documentation (not PROGRESS.md's job)

Project board provides the visual layer for the human:
- Board, Table, Roadmap views (set up once, self-maintaining)
- Auto-add Action keeps board complete
- GraphQL API available for targeted agent queries when needed

**Key insight**: Different consumers, different formats. Agents read files. Humans read boards. Both generated from the same source of truth (GitHub Issues).

### 5. GitHub Native Issue Types

**Decision**: Adopt native types, replace `type/*` labels (spike CLI support first).

Clean separation of concerns:
- **Issue types** (native) → what kind of work (Bug, Feature, Research, Tech Debt, Tooling, Refactor, Feedback)
- **Labels** → categorical dimensions (`priority/*`, `product/*`, `tool/*`, `phase/*`, `source/*`)
- **Project fields** → runtime/contextual data (Pipeline ID, Pipeline Stage, Effort, Status)
- **Milestones** → time-boxed goals (D-Day, PM Foundation, etc.)

No dual metadata — delete `type/*` labels after enabling native types. One mechanism per dimension.

**Prerequisite**: Quick spike to verify CLI support on personal repos:
```bash
gh issue create --type "Bug" --title "test" --body "test"
gh issue type list
gh issue list --type "Bug"
```

### 6. Priority Triage

**Decision**: Triage labels + milestones (both).

Hard triage `priority/next` down to ~8-10 truly-next items. Milestones provide goal-oriented grouping. Two orthogonal signals: urgency (labels) + goal (milestones) = maximum agent autonomy.

### 7. Milestones — Shape Up Cycles

**Decision**: Milestones represent Shape Up cycles. Cooldown concludes a milestone. Enables future releases.

**Cycle flow**:
```
Milestone opens → Pipelines run → All work done →
Cooldown (smoke test → polish → push to prod → close milestone → tag release) →
Bet (review backlog → groom issues → open new milestone) →
Next milestone begins
```

**Three human touchpoints per cycle**:
1. **Bet** (during Cooldown): Strategy, priority setting, issue selection
2. **Interview** (during Pipeline): Domain decisions, requirements validation
3. **Smoke Test** (during Cooldown): Human QA on preview deployment

**First milestone**: D-Day (Feb 21) — contains #145 (Wizards), #144 (DTF Pricing), #177 (Pricing Mobile).

### 8. Cross-Cutting Issues

**Decision**: Multiple labels OK, project field = primary.

Issues can have multiple `product/*` or `tool/*` labels. Project SINGLE_SELECT field tracks the primary product/tool for board grouping. Future: consider `scope/cross-cutting` or `scope/mobile` labels for truly cross-product work (#202 scope).

### 9. Cycle Formalization

**Decision**: Cooldown includes Bet phase. Bet involves human issue selection + agent-assisted grooming.

**Bet phase workflow**:
1. Human selects issues from backlog ("let's do X, Y, Z next")
2. Agent assists grooming: adds labels, links dependencies, fills "Files to Read", drafts acceptance criteria
3. Agent asks human async questions where context is missing (posted as `@cmbays` comments on issues)
4. Human answers async questions (could be over hours/days)
5. Issues are context-rich and ready for research phase

**Grooming goal**: Issues that enter research are fully contextualized — agents don't need to guess scope.

### 10. Epic Pattern

**Decision**: Adopt epic pattern. Parent issue = goal/pipeline. Sub-issues = pipeline stages + build tasks.

**Structure**:
```
Milestone: D-Day
├── Epic #144: DTF Pricing (parent issue)
│   ├── Sub-issue: Research
│   ├── Sub-issue: Interview
│   ├── Sub-issue: Shape
│   ├── Sub-issue: Breadboard
│   ├── Sub-issue: Plan
│   ├── Sub-issue: Build Wave 1 (parallel tasks)
│   ├── Sub-issue: Build Wave 2 (blocked by Wave 1)
│   ├── Sub-issue: Review (blocked by all Build)
│   └── Sub-issue: Wrap-up (blocked by Review)
├── Epic #145: Wizards
└── Epic #177: Pricing Mobile
```

**Progress measurement**:
- Milestone progress = closed epics / total epics
- Epic progress = closed sub-issues / total sub-issues

**Issue creation is progressive**, not front-loaded:
- Epic creation → only Research issue exists
- Each stage completion → creates next stage issue
- Plan completion → creates all Build + Review + Wrap-up issues with wave dependencies

**Epic-to-epic dependencies** supported for strategic sequencing.

### 11. Dependency Encoding

**Decision**: Use formal dependencies as pipeline backbone, not sparingly.

**Three relationship types** (clear separation of concerns):

| Relationship | GitHub Mechanism | Purpose |
|-------------|-----------------|---------|
| **Hierarchy** | Sub-issues | Decomposition: "this is part of that" |
| **Dependency** | Blocked-by / Blocking | Sequencing: "this must finish before that starts" |
| **Context** | Issue mentions (`#123`) | Narrative: "this relates to that" |

**Where to use formal dependencies**:
- Between pipeline stages (research → interview → shape → ...)
- Between build waves (wave 1 → wave 2 → wave 3)
- Between epics (epic A → epic B)
- NOT within a wave (parallel tasks are concurrent)

**Wrapper commands** needed: `work deps add`, `work deps list` to abstract the ID-heavy API.

### 12. Cross-Epic Dependency Management

**Decision**: Three layers of defense, built incrementally.

| Layer | Description | Build when |
|-------|------------|-----------|
| Agent discovery protocol | Convention: agents create shared issues + `@cmbays` flag when crossing epics | PM doc now |
| Implementation plan conflict check | Before build, check for overlapping file sets with other merged plans | Near-term (post D-Day) |
| Pre-flight overlap check | At epic creation, cross-reference "Files to Read" across active epics | Medium-term |
| Runtime file-touch tracking | Periodic scan of modified files across active builds | Medium-term |
| PM monitoring agent | Cron-style conflict detection across all active work | Long-term |

### 13. Agent Comment Routing

**Decision**: Use `@cmbays` mentions to distinguish human-needed comments from agent chatter.

- **Agent-to-agent**: Regular comments, no `@mention`. No notification.
- **Needs human**: Comment includes `@cmbays`. GitHub sends notification.
- Convention documented in PM doc.

### 14. GitHub Actions Scope

**Decision**: Tier 1 Actions before D-Day. Prioritized backlog for Tiers 2-3.

**Before D-Day**:
- Auto-add to project (every new issue/PR → board)
- Auto-label PRs (by file path)
- Auto-label issues from templates (built into YAML forms)

**Prioritized backlog**:
1. Sub-issue cascade check (when sub-issue closes → update parent status)
2. PROGRESS.md auto-generation (on push to main)
3. Stale issue management (weekly schedule)
4. Milestone progress notification
5. Pipeline stage advance (backup to `work stage complete`)

**Architecture principle**: `work` CLI = agent happy path. Actions = safety net + async events.

### 15. PM Doc

**Decision**: New canonical doc (`docs/PM.md`), added to CLAUDE.md's doc table.

Covers: issue lifecycle, label taxonomy, dependency patterns, comment conventions (agent routing), pipeline flow, epic structure, milestone cycles, agent discovery protocol.

### 16. Backlog Grooming

**Decision**: Aggressive — close/icebox borderline issues.

Close stale issues, icebox anything not Phase 1 or Phase 2, consolidate duplicates (#15/#73). Target ~40-45 clean, correctly-labeled open issues.

### 17. Template Terminology

**Decision**: Keep `vertical` for now.

Matches current label taxonomy. Update templates when #202 renames to `product/*` + `tool/*`. Consistent with deferred label rename decision.

---

## Scope Summary

### Before D-Day (this pipeline, #216)

1. Project board creation + custom fields
2. Issue templates (4 YAML forms)
3. Label cleanup (fold ad-hoc labels)
4. D-Day milestone creation
5. PM doc (`docs/PM.md`)
6. Tier 1 Actions (auto-add, auto-label PRs, auto-label from templates)
7. `work progress` command (PROGRESS.md generator)
8. Batch sub-issue migration (23 issues)
9. Issue type spike (test CLI on personal repo)
10. Aggressive backlog grooming (close/icebox → ~40-45 issues)

### After D-Day (PM Foundation milestone)

**Near-term**:
1. Sub-issue cascade check (Action)
2. PROGRESS.md auto-generation (Action on push to main)
3. Implementation plan conflict check (`work plan check-conflicts`)
4. Agent discovery protocol tooling (wrapper for `work deps`)
5. Epic management commands (`work epic create`, `work stage complete`)

**Medium-term**:
6. Stale issue management (Action)
7. Milestone progress notification (Action)
8. Pipeline stage advance (Action)
9. Pre-flight overlap check
10. Runtime file-touch tracking

**Long-term**:
11. PM monitoring agent
12. Cross-epic agent resolution protocol
13. Dependency graph visualization
14. Async question system for bet phase
15. Preview deployment staging model

---

## Key Principles Established

1. **Structure IS memory** for AI agents — what's overhead for humans is context for agents
2. **Different consumers, different formats** — agents read files, humans read boards
3. **CLI is the happy path, Actions are the safety net** — agents use `work` commands, Actions catch what they miss
4. **Progressive issue creation** — don't front-load, create as pipeline advances
5. **Three human touchpoints** — Bet, Interview, Smoke Test. Everything else is automatable.
6. **One mechanism per metadata dimension** — types for "what", labels for "where/when/how", fields for "live state", milestones for "toward what goal"
7. **`@mention` for human routing** — agent-to-agent comments don't notify, human-needed comments `@cmbays`

---

## Open Items for Shaping

1. **Issue type CLI support** — spike needed before committing to `type/*` label deprecation
2. **`work progress` script design** — what exactly does it query, what format does it output?
3. **PM doc structure** — detailed outline needed during shaping
4. **Sub-issue cascade check** — exact trigger logic and status update behavior
5. **Implementation plan conflict detection** — file overlap algorithm, false positive tolerance
6. **Template field contents** — exact dropdown options for each template
7. **Cross-product label strategy** — how `scope/mobile` or `scope/cross-cutting` works (deferred to #202)
