# Strategy Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Cooldown retrospectives and planning documents — the synthesis layer between build cycles. Strategy
docs capture the state of the project at a point in time, what was completed, what was learned, and
what comes next.

**Good deposit candidates:**

- End-of-cycle cooldown: what shipped, what worked, what to change
- Planning docs: bets, priorities, sequencing decisions for the next cycle
- Architecture decisions with significant trade-off discussion
- Phase transition documents (Phase 1 → Phase 2 handoff)

**Does NOT belong here:**

- Session-level narrative → `pipelines/`
- Individual engineering learnings → `learnings/`
- Domain rules → `domain/`

## Mutation model

**Append-only.** Each cooldown or planning doc is a dated artifact. Never edit a strategy doc
after it's committed — the historical record matters.

## Naming convention

```
YYYY-MM-DD-kebab-topic.md

Examples:
  2026-02-16-phase-1-cooldown.md
  2026-02-17-phase-2-planning.md
  2026-02-15-pipeline-architecture-decisions.md
```

## Frontmatter template

```yaml
---
title: 'Cooldown or Planning Title'
subtitle: 'One-line summary'
date: YYYY-MM-DD
docType: cooldown # cooldown | planning
phase: 1
tags: []
status: complete # complete | in-progress
---
```
