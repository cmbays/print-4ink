---
title: "Agent Architecture"
subtitle: "5 specialized agents, 4 new skills, orchestration patterns, and an agent registry. Agents preload skills for domain expertise and chain together for complex workflows."
date: 2026-02-08
phase: 1
pipelineName: meta
pipelineType: horizontal
products: []
tools: [knowledge-base]
stage: build
tags: [feature, build]
sessionId: "5799011a-0503-4ea3-b856-2d19cf66b9ac"
branch: "infra/agent-architecture"
status: complete
---

## Agents vs Skills

**Agents** (`.claude/agents/`) are specialized AI assistants with their own context windows, system prompts, tool restrictions, and preloaded skills. They run isolated from the main conversation.

**Skills** (`.claude/skills/`) are domain expertise containers with instructions, templates, and references. Agents preload skills at startup for domain knowledge.

Think of agents as specialists hired for specific jobs, and skills as the training manuals they carry.

## Agents Created

5 agents in `.claude/agents/`:

| Agent | Purpose | Skills |
|-------|---------|--------|
| frontend-builder | Build screens & components | screen-builder, quality-gate |
| requirements-interrogator | Question features before building | pre-build-interrogator |
| design-auditor | Audit screens against design system | design-audit |
| feature-strategist | Competitive analysis & feature planning | feature-strategy |
| doc-sync | Keep docs synchronized with code | doc-sync |

### How to Invoke

Use explicit delegation (recommended):

- `Use the frontend-builder agent to build PageHeader`
- `Have the design-auditor agent review the jobs screen`
- `Ask requirements-interrogator about the Kanban board workflow`
- `Use feature-strategist for quote system competitive analysis`
- `Have doc-sync check APP_FLOW against built screens`

---

## Skills Created

4 new skills in `.claude/skills/`:

| Skill | Files | Purpose |
|-------|-------|---------|
| pre-build-interrogator | SKILL.md + spike template | Exhaustive questioning before building |
| design-audit | SKILL.md + 15-dimension audit ref | Jobs/Ive-style design review |
| feature-strategy | SKILL.md + frameworks ref + plan template | Product strategy & feature discovery |
| doc-sync | SKILL.md + drift detection checklist | Documentation synchronization |

Added to existing 2 skills (screen-builder, quality-gate). Total: 6 skills.

---

## Orchestration Patterns

4 workflow chains:

| Pattern | Chain | Use For |
|---------|-------|---------|
| Linear | builder -> quality-gate -> progress | Steps 2, 3, 5, 7, 8, 9 |
| Pre-Build | interrogator -> spike -> builder -> gate | Steps 4, 6 |
| Checkpoint | auditor -> report -> approval -> fixes | After Steps 3, 6, 10 |
| Competitive | strategist -> plan -> approval | Print Life analysis |

---

## Files Created & Modified

### Created (18 files)

- `docs/AGENTS.md` -- Agent registry, orchestration, calling conventions
- `.claude/agents/frontend-builder.md`
- `.claude/agents/requirements-interrogator.md`
- `.claude/agents/design-auditor.md`
- `.claude/agents/feature-strategist.md`
- `.claude/agents/doc-sync.md`
- `.claude/skills/pre-build-interrogator/SKILL.md`
- `.claude/skills/pre-build-interrogator/templates/spike-template.md`
- `.claude/skills/design-audit/SKILL.md`
- `.claude/skills/design-audit/reference/audit-dimensions.md`
- `.claude/skills/feature-strategy/SKILL.md`
- `.claude/skills/feature-strategy/reference/feature-frameworks.md`
- `.claude/skills/feature-strategy/templates/feature-plan-template.md`
- `.claude/skills/doc-sync/SKILL.md`
- `.claude/skills/doc-sync/checklists/drift-detection.md`
- `agent-outputs/README.md`
- `agent-outputs/.gitkeep`
- `for_human/session-2026-02-08-agent-architecture.html` (this file)

### Modified

- `CLAUDE.md` -- Added AGENTS.md to canonical docs, updated "Project Skills" -> "Agent & Skill Infrastructure", added agent-outputs/ and .claude/ to architecture tree

---

## Decision Rationale

- **5 agents, not 3**: doc-sync and feature-strategist seem "nice to have" but they prevent the two biggest Phase 1 risks: stale docs and building a "me too" product.
- **Skills as knowledge, agents as workflow**: Skills are reusable across agents. The design-audit skill could be preloaded into a different agent in Phase 2 without rewriting it.
- **Read-only where possible**: interrogator, auditor, and strategist are read-only by design. This prevents accidental code changes from analysis agents.
- **agent-outputs/ for audit trail**: Every agent run produces structured markdown. This makes debugging agent behavior possible and creates a project history.
- **Deferred to Phase 2**: Agent nesting, continuous learning, multi-agent teams, and script-heavy agents add complexity not justified for Phase 1 mockup work.
