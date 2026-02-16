---
title: "Phase 1 Cool-Down — Cross-Vertical Learnings"
subtitle: "Synthesis of patterns, velocity data, and demo week shaping from the full Phase 1 build cycle"
date: 2026-02-14
phase: 1
vertical: meta
verticalSecondary: [quoting, customer-management, invoicing, price-matrix, jobs, garments, screen-room, mobile-optimization]
stage: learnings
tags: [learning, decision]
sessionId: "0ba68ef8-1b02-40be-a039-2c63d6d15cd1"
branch: "session/0214-cooldown"
status: complete
---

## Context

Phase 1 is effectively complete. 7 verticals built and demo-ready, 434 tests passing, 24 PRs merged on the final day alone. This cool-down synthesizes cross-cutting patterns from the entire build cycle and shapes the demo week plan.

## Phase 1 By The Numbers

| Metric | Value |
|--------|-------|
| Verticals built | 7 (6 standalone + Screen Room integrated) |
| PRs merged (Feb 14 alone) | 24 |
| Issues closed (Feb 14 alone) | 15 |
| Total tests | 434 (19 files) |
| KB session docs | 36+ |
| Agents | 8 |
| Skills | 14 |
| Lines added (Feb 14) | ~21,000 |
| Rollbacks | 0 |

## Pattern A: Breadboard-First Pays Back 3x

Every vertical that went through the full 7-step pipeline (Discovery → Scope → Breadboard → Plan → Build → Review → Demo) shipped cleaner and faster than those that didn't. The three verticals that moved fastest — Jobs, Invoicing, Garments — all had tight breadboards with explicit build orders before the first line of code.

**Evidence**:
- Price Matrix breadboard: 167 affordances → 3-agent parallel build with zero rework
- Invoicing breadboard: 99 UI + 44 code affordances → 30 new files, 10/10 quality gate
- Garments breadboard: mapped integration gaps (location normalization, artwork-to-location mapping) that would have been costly to find during build

**New rule added to CLAUDE.md**: Breadboard build orders must explicitly mark parallelization windows.

## Pattern B: Parallel Agent Execution Is The Force Multiplier

The constraint isn't agent count — it's dependency graph clarity. Breadboards that explicitly mark which tasks can run concurrently produce the best results.

**Evidence**:
- Price Matrix Phase B: 3 agents (Wizard + SP Editor + DTF Editor) built simultaneously
- Garment Catalog: 18-task subagent-driven development with two-stage review
- Mobile Sprint 2: 3 responsive page adaptations in parallel

**New rule added to CLAUDE.md**: For 10+ task plans, use `superpowers:subagent-driven-development`.

## Pattern C: CodeRabbit Catches Real Issues

Across all reviewed PRs, CodeRabbit consistently flagged:
- Tailwind token violations (raw colors → semantic tokens)
- Missing touch targets (< 44px mobile minimum)
- Sort mutation bugs (`.sort()` without `.slice()` or spread)
- Timezone-unsafe date handling

These aren't nitpicks — they're production bugs that survive to release.

## Pattern D: The Design System Compounds

The "second time" pattern appeared repeatedly — things done twice were done better and faster:
- Customer list → Jobs list (same DataTable + ColumnHeaderMenu, Jobs added service type filtering)
- Invoicing schema → Credit Memo schema (learned bounded sub-documents need refinements)
- Mobile Sprint 1 tokens → Sprint 2 screens (tokens made responsive adaptations trivial)

**New rule added to CLAUDE.md**: Define mobile CSS tokens in a foundation sprint before building responsive screens.

## Pattern E: Gary Questions Cluster Around Garments + Mobile

Of 9 tracked Gary questions, the 2 that still need Gary directly are:
1. **garments-q3**: "Which 5 garment styles do you use most?" (determines SVG template priority)
2. **mobile-q4**: "What other apps do you use on your phone?" (reveals UX expectations)

Both verticals are where 4Ink's real-world workflow diverges most from what competitors can teach us.

## Stale Doc Triage

| Document | Issue | Resolution |
|----------|-------|------------|
| IMPLEMENTATION_PLAN.md | Showed "Step 0 complete" — all 10 steps were done | **Rewritten** with Phase 1 build record + Phase 1.5 demo plan |
| ROADMAP.md | Current Bets outdated, strategic questions answered | **Updated** — new bets, resolved questions, vertical inventory expanded |
| CLAUDE.md Lessons Learned | Missing 3 cross-vertical patterns | **Added** breadboard parallelization, mobile tokens, subagent-driven dev |
| Gary questions in KB | 7 of 9 answered but marked "unanswered" | **Updated** with answer text and dates |

## Demo Week Plan (Shaped)

Three must-haves, ranked:
1. **Mobile Polish** (Sprints 3-4) — forms, detail views, animation
2. **Onboarding Wizards** (#145) — 3 demo journeys: view job board, close invoice, create customer
3. **DTF Gang Sheet Builder** (#144) — new vertical, full pipeline, `priority/now`

Demo-blocking bugs: #128 (leading zeros), #129 (tier validation), #138 (color pricing doubles)

Demo goal: Walk through the FULL process interactively. Create → Quote → Job Board → Invoice → Close.

## Decisions Made

1. **DTF Gang Sheet Builder upgraded to priority/now** — was stretch/parallel, now must-have #3 for demo week
2. **Cool-down is 1 day, not 2** — velocity supports tight timelines
3. **Phase 1.5 introduced** — demo prep is its own phase between Phase 1 (build) and Phase 2 (backend)
4. **3 resolved strategic questions** documented in ROADMAP.md (backend scope, demo timing, mobile path)
