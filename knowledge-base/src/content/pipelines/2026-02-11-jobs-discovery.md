---
title: "Jobs Vertical Discovery"
subtitle: "Competitive analysis of Printavo and PrintLife, 12-question user interview, journey mapping with 12 friction points, and scope definition for the production backbone"
date: 2026-02-11
phase: 1
pipelineName: jobs
pipelineType: vertical
products: [jobs]
tools: []
stage: research
tags: [research, decision]
sessionId: "6df58e54-e1a6-4bef-ae1d-549e6e72ebf7"
branch: "session/0211-jobs-vertical"
status: complete
---

## At a Glance

| Stat | Value |
|------|-------|
| Discovery Steps | 7 |
| Competitors Analyzed | 2 (Printavo, PrintLife) |
| Screenshots Captured | 25 |
| Interview Questions | 12 |
| Friction Points Mapped | 12 |

Complete vertical discovery for the Jobs & Production vertical -- the core production backbone covering F2 (Jobs List), F3 (Job Detail), and F4 (Production Board/Kanban).

## 7-Step Discovery Process

1. **Web Research** -- Printavo + PrintLife competitor deep-dive
2. **Playwright Exploration** -- Printavo (18 screenshots), PrintLife (7 screenshots, ~70%)
3. **User Interview** -- 12 questions, one at a time
4. **Competitive Analysis Synthesis** -- Feature gaps, opportunities, what to steal vs. skip
5. **Current Journey Friction Map** -- 12-step happy path + variants + ranked friction points
6. **Improved Journey Design** -- Board architecture, card design, capacity model
7. **Scope Definition** -- CORE/PERIPHERAL/NOT BUILDING boundaries

## Competitors Analyzed

### Printavo
Market leader ($109-399/mo, 3,000+ shops). Calendar-centric, 13 customizable statuses, dual dates, preset task lists. **Gap:** No true Kanban board (gated behind $399 Premium), no capacity planning, no QC gates, no production analytics.

### PrintLife
Indie product by former shop owner. 4-lane fixed Kanban, quote=invoice conflation, customer portal strength. **Gap:** No sub-stages, no urgency indicators, single-user only, no service type visibility.

## Key Friction Points

| Severity | Friction | Frequency |
|----------|----------|-----------|
| Critical | No quick capture -- opportunities lost when busy | Daily |
| Critical | No capacity awareness -- can't confidently commit dates | Multiple times/week |
| Critical | No quality gate -- shipped bad work (embroidery incident) | Occasional but devastating |
| Critical | Screen prep invisible -- only Gary knows status | Every screen printing job |
| High | Wall calendar is single source of truth | Constant |
| High | DTF interrupts disrupt planned work | Several times/day |
| High | No "what do I work on today?" view | Every morning |
| High | Quote pipeline has no states | Multiple times/week |
| Medium | No blocked-item visibility | Weekly |
| Medium | Customer communication outside system | Constant |
| Medium | No production analytics | Ongoing blind spot |
| Medium | Payment disconnected from production | Per job |

## Board Architecture (User-Designed)

Through the 12-question interview, the user collaboratively designed the entire board architecture:

```
             Ready       In Progress    Review       Blocked       Done
  Quotes   | scratch    | drafting     | customer   | waiting on   | accepted   |
           | new leads  | building     | reviewing  | customer     | auto-clear |
  Jobs     | approved   | screen prep  | QC check   | blanks not   | shipped    |
           | not started| printing     | sign-off   | arrived      | awaiting   |
           |            | embroidery   |            | art issue    | payment    |
```

### 8 Design Principles

1. Board is single source of truth -- Today is a filter, not a dashboard
2. Universal lanes for all service types -- Ready / In Progress / Review / Blocked / Done
3. Service type = primary visual -- color + icon, instantly scannable
4. Cards are command centers -- tasks, actions, history, links
5. Quick capture over forced structure -- scratch notes for lightweight logging
6. Guardrails, not gates -- quality checkpoints that help without burdening
7. Conservative warnings only -- never false positives on capacity
8. Inferred intelligence -- productivity from state transitions, not manual logging

## Scope Definition

| Component | Scope |
|-----------|-------|
| Production Board | CORE -- 2 sections, 5 lanes, drag-drop, filters, capacity bar |
| Jobs List | CORE -- Table view, search, filter, sort, quick actions |
| Job Detail | CORE -- Tasks, notes, actions, linked entities, block tracking |
| Scratch Notes | CORE -- Quick text capture on board |
| Canonical Tasks | CORE -- 3 service type templates, auto-populate |
| Review Lane (QC) | CORE -- Mandatory checkpoint, pass/fail |
| Quote-to-Job | PERIPHERAL -- Conversion button with auto-inherit |
| Capacity Summary | PERIPHERAL -- Basic stats above board |
| What-If Picker | NOT BUILDING -- Phase 2 |
| Notifications | NOT BUILDING -- Phase 2 |

## Documents Produced

- `docs/competitive-analysis/printavo-jobs-exploration.md` -- 18 screenshots, detailed UI analysis
- `docs/competitive-analysis/printlife-jobs-exploration.md` -- 7 screenshots (~70% complete)
- `docs/competitive-analysis/jobs-vertical-synthesis.md` -- Cross-competitor synthesis
- `docs/competitive-analysis/jobs-journey-map.md` -- 12-step happy path, 3 variants, 12 friction points
- `docs/strategy/jobs-improved-journey.md` -- 10 principles, board architecture, card design
- `docs/strategy/jobs-scope-definition.md` -- Feature boundaries, schema changes, acceptance criteria
