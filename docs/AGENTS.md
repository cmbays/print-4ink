# Agent Registry

**Last Verified**: 2026-02-08

This document is the canonical reference for Screen Print Pro's agent architecture. It defines which agents exist, when to use them, how they orchestrate together, and how to create new ones.

## Agents vs Skills

**Agents** (`.claude/agents/`) are specialized AI assistants that run in their own context window with custom system prompts, restricted tool access, and preloaded skills. They are invoked via the Task tool or explicit delegation.

**Skills** (`.claude/skills/`) are domain expertise containers with instructions, templates, scripts, and reference docs. They get discovered and loaded by Claude when relevant, or preloaded into agents at startup.

**Relationship**: Agents preload skills for domain expertise. Skills provide the "how to do X" knowledge. Agents provide the persona, workflow, and tool restrictions that ensure the knowledge is applied correctly.

## Quick Reference

| Agent | Use When | Example Invocation | Preloaded Skills | Output |
|-------|----------|-------------------|------------------|--------|
| `frontend-builder` | Building screens or components | "Use frontend-builder agent to build PageHeader" | breadboarding, screen-builder, quality-gate | Screen/component files |
| `requirements-interrogator` | Before building complex features | "Ask requirements-interrogator about Kanban workflow" | pre-build-interrogator | Spike doc in `docs/spikes/` |
| `design-auditor` | Design review checkpoint | "Have design-auditor review the jobs screen" | design-audit | Audit report in `agent-outputs/` |
| `feature-strategist` | Competitive analysis, feature planning | "Use feature-strategist for quote system analysis" | feature-strategy | Feature plan in `docs/` |
| `doc-sync` | Sync docs with code changes | "Have doc-sync check APP_FLOW against built screens" | doc-sync | Updated canonical docs |

## Agent Details

### frontend-builder

**Purpose**: Build frontend screens and components following project standards. Consolidates screen and component building into one agent that knows the full design system, schema layer, and mock data patterns. Uses breadboard documents as primary build blueprints — every UI affordance, code affordance, and wiring connection is pre-mapped before code is written.

**Tools**: Read, Write, Edit, Bash, Grep, Glob
**Preloaded skills**: breadboarding, screen-builder, quality-gate
**Reads**: Breadboard docs, scope definitions, all frontend code, schemas, mock data, design system docs
**Writes**: Screen files in `app/(dashboard)/`, component files in `components/features/`, `progress.txt`
**Never touches**: Backend, docs (except progress.txt)

**When to use**:
- Building any screen within a vertical (uses breadboard as build blueprint)
- Creating shared components (StatusBadge, DataTable, PageHeader, etc.)
- Wiring navigation, breadcrumbs, and cross-links

### requirements-interrogator

**Purpose**: Ask clarifying questions before building complex or ambiguous features. Prevents "we built the wrong thing" rework by surfacing all assumptions upfront.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: pre-build-interrogator
**Reads**: IMPLEMENTATION_PLAN, APP_FLOW, PRD, schemas
**Writes**: Spike docs in `docs/spikes/`
**Never touches**: Code, design system files

**When to use**:
- Before Steps 4 (Kanban board) and 6 (Quote form) — pre-build ritual
- Any screen where behavior is ambiguous or has complex interactions
- When the user describes a feature that isn't fully specified in APP_FLOW

### design-auditor

**Purpose**: Audit screens against the design system. Produces phased refinement plans (Critical > Refinement > Polish) following Jobs/Ive design philosophy.

**Tools**: Read, Grep, Glob (read-only)
**Preloaded skills**: design-audit
**Reads**: All screens, design system docs, FRONTEND_GUIDELINES
**Writes**: Audit reports in `agent-outputs/`
**Never touches**: Code (read-only)

**When to use**:
- After completing Steps 3, 6, 10 (major checkpoints in IMPLEMENTATION_PLAN)
- Before user acceptance testing
- When the user asks "how does this screen look?"

### feature-strategist

**Purpose**: Analyze competitor screens and identify feature opportunities. Thinks in user journeys, compounding value, and phases — not feature lists.

**Tools**: Read, Grep, Glob, WebFetch (research capable)
**Preloaded skills**: feature-strategy
**Reads**: All code, competitor screenshots, PRD, APP_FLOW
**Writes**: Feature plans in `docs/`
**Never touches**: Code (read-only for source)

**When to use**:
- When analyzing Print Life screenshots for competitive advantages
- When planning new features based on user feedback (Phase 2)
- When the user asks "what should we build next?"

### doc-sync

**Purpose**: Keep canonical docs synchronized as code evolves. Detects drift between docs and reality, proposes updates, and maintains the documentation as a living system.

**Tools**: Read, Write, Edit, Grep, Glob
**Preloaded skills**: doc-sync
**Reads**: All code + all docs
**Writes**: Updated canonical docs with changelogs
**Never touches**: Code (read-only for source)

**When to use**:
- After completing a step in IMPLEMENTATION_PLAN
- When docs feel stale or out of sync with built code
- At the start of Phase 2 (full doc audit before user iteration)

## Orchestration Patterns

### Pattern 1: Vertical Build Chain (Standard for Verticals)

```text
vertical-discovery → scope definition → breadboarding → frontend-builder → quality-gate → demo
```

**Use for**: Every new vertical (Quoting, Invoicing, Customer Management, etc.)

This is the standard 5-phase workflow. Breadboarding produces the build blueprint that frontend-builder consumes. The breadboard maps all UI affordances, code affordances, data stores, and wiring before any code is written.

### Pattern 2: Linear Chain (Simple Screens)

```text
frontend-builder → quality-gate → progress update
```

**Use for**: Straightforward table/detail screens within a vertical (when breadboard already exists)

The frontend-builder preloads breadboarding, screen-builder, and quality-gate skills, so this chain runs within a single agent invocation.

### Pattern 3: Pre-Build Chain (Complex Screens)

```text
breadboarding → requirements-interrogator → spike doc → frontend-builder → quality-gate → progress update
```

**Use for**: Complex screens with ambiguous behavior (e.g., Kanban board, Quote form)

Breadboarding maps the affordances first, then the interrogator surfaces unknowns and documents them. The builder uses both the breadboard and spike as context.

### Pattern 4: Checkpoint Chain (Milestones)

```text
design-auditor → audit report → user approval → frontend-builder (fixes) → quality-gate
```

**Use for**: After completing a vertical's build phase (major checkpoints)

The auditor reviews all screens built so far and produces a phased improvement plan. User approves which phases to execute. Builder implements approved changes.

### Pattern 5: Competitive Analysis Chain

```text
feature-strategist → feature plan → user approval → update IMPLEMENTATION_PLAN
```

**Use for**: When analyzing Print Life screenshots, planning Phase 2 features

## Handoff Protocol

### Input

All agents receive context through their preloaded skills and the task prompt. Provide:

```text
Vertical: [name of vertical]
Description: [what to build/audit/interrogate]
Context files: [specific files to read]
```

### Output

All agents produce structured markdown:

```markdown
# [Agent Name] Output — [Vertical/Task]

## Summary
[1-2 sentences]

## Deliverables
- File created/modified: [path]
- Quality gate: [pass/warn/fail] (if applicable)

## Next Step
[What agent should run next OR "Ready for user review"]
```

Agent outputs are stored in `agent-outputs/[vertical]/` for audit trail.

## Agent Design Principles

1. **Single Responsibility** — One agent, one job
2. **Composability** — Agents chain via structured output
3. **Idempotency** — Running twice produces the same result
4. **Context Isolation** — Agents read from canonical docs, not prior agent state
5. **Auditability** — Every agent writes structured output to `agent-outputs/`

## Calling Convention

### Method 1: Explicit delegation (recommended)

Ask Claude to use a specific agent:

```text
Use the frontend-builder agent to build PageHeader
Have the design-auditor agent review the jobs screen
Ask the requirements-interrogator about the Kanban board workflow
```

### Method 2: Let Claude decide (automatic)

Describe the task and Claude matches it to the right agent:

```text
Build the PageHeader component
Review the design of the dashboard
What questions should we answer before building the Kanban board?
```

### Method 3: Direct Task tool (programmatic)

Used by agents calling other agents or in scripts:

```python
Task(
  subagent_type="frontend-builder",
  prompt="Build PageHeader component from Quoting breadboard",
  description="Building PageHeader"
)
```

## Creating New Agents

Use this template for new agent files in `.claude/agents/`:

```markdown
---
name: agent-name
description: One-line description of what this agent does
skills:
  - skill-1
  - skill-2
tools: Read, Write, Edit, Bash, Grep, Glob
---

## Role

[1-2 paragraph philosophical framing — what is this agent's obsession?]

## Startup Sequence

1. Read [doc 1] — [why]
2. Read [doc 2] — [why]
3. Internalize [rules]

## Workflow

### Step 1: [Action]
[Instructions]

### Step 2: [Action]
[Instructions]

## Rules

- [Hard constraint 1]
- [Hard constraint 2]

## Output Format

[Template for structured output]
```

## Maintenance Protocol

- **When to update**: After adding/retiring agents, refining patterns, or transitioning phases
- **Who updates**: Main Claude session after user approval
- **Verification**: Each agent entry has a "Last Verified" date
- **Drift prevention**: Compare agent registry to actual `.claude/agents/` directory monthly

## Deferred to Phase 2

- **Agent nesting** — Agents calling subagents (complexity not justified in Phase 1)
- **Continuous learning** — `~/.claude/skills/learned/` integration
- **Multi-agent teams** — Parallel agent execution with coordination
- **Script-heavy agents** — Bash scripts for repetitive backend operations
