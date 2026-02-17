---
title: 'Breadboarding Skill'
subtitle: 'Promoted breadboarding from Phase 2 deferral to full Phase 1 skill. Maps UI affordances, code affordances, data stores, and wiring before any code is written.'
date: 2026-02-08
phase: 1
pipelineName: devx
pipelineType: horizontal
products: []
tools: [skills-framework]
stage: build
tags: [feature, decision]
sessionId: '09b70260-83ac-4830-9b02-ed8c0683f699'
branch: 'feat/breadboarding-skill'
status: complete
---

## Why This Decision

On Feb 7, we evaluated Ryan Singer's shaping-skills methodology and deferred breadboarding to Phase 2. The reasoning was sound at the time: we were using a linear 10-step implementation plan and breadboarding seemed like over-engineering for simple screens.

On Feb 8, we pivoted to **vertical-by-vertical development**. This changed the equation significantly:

- **Verticals are complex** -- each has 3+ screens with interconnected affordances, shared state, and wiring between pages
- **The breadboarding README literally says** "Good for slicing into vertical scopes" -- it was designed for exactly this workflow
- **Phase 2 will add backend** -- breadboards become even more valuable when mapping UI-to-API-to-database wiring
- **Consistency pays compound interest** -- having a structured planning step between scope and build prevents discovering wiring issues during implementation

## What Was Created

| Stat           | Value |
| -------------- | ----- |
| Skill Files    | 3     |
| Workflow Steps | 9     |
| Total Skills   | 8     |

### Skill Files

### SKILL.md

Main skill definition with 9-step workflow: Read Inputs -> Identify Places -> Map UI Affordances -> Map Code Affordances -> Map Data Stores -> Verify Wiring -> Identify Component Boundaries -> Define Build Order -> Write Breadboard Document. Includes quality gate checklist and Phase 1/Phase 2 awareness.

### templates/breadboard-template.md

Output template with YAML frontmatter (depends-on linking to scope definition and journey design). Sections: Places, UI Affordances, Code Affordances, Data Stores, Wiring Verification, Component Boundaries, Build Order, Scope Coverage, Phase 2 Extensions.

### reference/concepts.md

Key concepts reference: UI Affordances (U), Code Affordances (N), Data Stores (S), Places (blocking test, hierarchy), Wiring (control flow vs data flow), affordance naming rules, component boundary indicators, vertical slicing rules.

## Three Core Concepts

| Element         | Symbol | What It Represents                        | Example                                   |
| --------------- | ------ | ----------------------------------------- | ----------------------------------------- |
| UI Affordance   | `U`    | Things users see and interact with        | Customer Combobox, "Save as Draft" button |
| Code Affordance | `N`    | Functions that execute when triggered     | `calculateLineTotal()`, `filterQuotes()`  |
| Data Store      | `S`    | State that persists and gets read/written | URL params, form state, mock data imports |

## Workflow Integration

Breadboarding is now **Phase 2.5** in the vertical-by-vertical methodology, sitting between Scope Definition and Build Execution:

```
Discovery -> Scope Definition -> Breadboarding -> Build Execution -> Demo & Iteration
```

### What Changed

| File                               | Change                                                               |
| ---------------------------------- | -------------------------------------------------------------------- |
| `.claude/skills/breadboarding/`    | Created: SKILL.md, templates/, reference/                            |
| `docs/breadboards/`                | Created: output directory for breadboard documents                   |
| `vertical-by-vertical-strategy.md` | Added Phase 2.5: Breadboarding (with 2.5.1 and 2.5.2 sub-steps)      |
| `CLAUDE.md`                        | Architecture, pre-build ritual, skills table, orchestration patterns |
| `frontend-builder.md`              | Added breadboarding to skills, breadboard-first startup sequence     |
| `docs/AGENTS.md`                   | Vertical Build Chain pattern (Pattern 1), 5 orchestration patterns   |
| `progress.txt`                     | Skill count 6 -> 8, session log entry, breadboard as build step 1    |
| `MEMORY.md`                        | Updated skill count, 5-phase methodology, shaping skills status      |
| `STRATEGY_README.md`               | Added breadboarding phase section, updated document statuses         |

## Next Step

Create the **Quoting Breadboard** (`docs/breadboards/quoting-breadboard.md`) by running the breadboarding skill against the scope definition and improved journey design. This will produce the build blueprint for the frontend-builder agent to consume.
