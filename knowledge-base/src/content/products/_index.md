# Product Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Per-vertical **product decisions** — the "why" behind each vertical's scope, UX choices, and
constraints. This is where we record what we built, what we intentionally left out, and what
questions remain open.

Product docs reference domain rules but don't repeat them. They explain **our software's choices**
in the context of domain knowledge.

**Good deposit candidates:**

- Why a vertical was scoped the way it was (what was deferred, what was included)
- UX decisions: why we chose a Kanban board vs. a table for jobs
- Mock data decisions: what the test fixtures represent
- Open questions for Phase 2 (e.g., "multi-location support deferred")
- Acceptance criteria agreed with Gary

**Does NOT belong here:**

- Domain rules that apply regardless of product → `domain/`
- Build session narrative → `pipelines/`
- Competitive inspiration → `market/`

## Subdirectory guide

Each subdir matches a vertical: `customers/`, `dashboard/`, `invoices/`, `jobs/`, `quotes/`.
Add new subdirs when new verticals are built.

Each vertical has (at minimum) an `overview.md` covering:

- What the vertical does
- Scope decisions (in/out of Phase 1)
- Key UX decisions made
- Open questions for Phase 2

## Mutation model

**Living docs.** Product scope evolves as Gary gives feedback and Phase 2 begins. When updating:

1. Read the existing file
2. Update the relevant section (scope, decisions, open questions)
3. Synthesize — remove outdated information, don't layer corrections
4. Update `lastUpdated` in frontmatter

## Naming convention

```
{vertical}/{topic}.md

Examples:
  quotes/overview.md
  jobs/kanban-design-decisions.md
  invoices/deposit-calculation.md
```

## Frontmatter template

```yaml
---
title: 'Topic Name'
type: 'overview' # overview | decisions | history | reference
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```
