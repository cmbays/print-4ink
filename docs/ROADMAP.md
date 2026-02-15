---
title: "ROADMAP"
description: "Strategic planning document. Vision, phases, vertical inventory, current bets, and forward planning. Every Claude session reads this for strategic context."
category: canonical
status: active
phase: all
last_updated: 2026-02-14
last_verified: 2026-02-14
depends_on:
  - docs/PRD.md
  - docs/IMPLEMENTATION_PLAN.md
  - PROGRESS.md
---

# Screen Print Pro — Roadmap

## Vision

Production management software for 4Ink, a screen-printing shop. Manages the full garment lifecycle: Quote > Artwork Approval > Screen Room > Production > Shipping. The primary user is the shop owner/operator who needs instant clarity on job status, blocked items, and next actions.

**Long-term trajectory**: Web app > user feedback iteration > production backend > mobile optimization > native mobile app (app stores).

## Methodology: Shape Up (Adapted for Solo Dev + AI)

We follow a Shape Up cycle adapted for one developer working with Claude Code agents:

| Phase | What Happens | Artifacts |
|-------|-------------|-----------|
| **Shaping** | Define the problem, research competitors, map affordances, set boundaries | Vertical BRIEF, breadboard, spike docs |
| **Betting** | Decide what to build next and in what order | Updated ROADMAP, IMPLEMENTATION_PLAN |
| **Building** | Execute the vertical through the 7-step pipeline | Code, KB sessions, PR |
| **Cool-down** | Synthesize feedback, review progress, shape next cycle | Updated BRIEFs, new issues, shaped pitches |

### 7-Step Vertical Pipeline

```
Discovery > Scope > Breadboard > Implementation Planning > Build > Review > Demo
```

Each vertical passes through these stages. The KB tracks progress per vertical per stage.

## Phases

### Phase 1: Frontend Mockups (COMPLETE)

**Goal**: High-fidelity UI with mock data for user acceptance testing. No backend.

**Status**: All 7 verticals built and demo-ready. 434 tests, 19 test files, zero rollbacks. Screen Room integrated into existing verticals (customer screens tab, job detail, quote-time reuse detection) rather than standalone page. Mobile nav shell + responsive page adaptations shipped (Sprints 1-2). Garment mockup SVG composition engine designed and built. 36+ KB session docs.

### Phase 1.5: Demo Prep (CURRENT — Feb 15-21)

**Goal**: Polish mobile, add onboarding wizards, build DTF Gang Sheet Builder, fix demo-blocking bugs. Demo with Gary on February 21.

**Three must-haves** (ranked):
1. **Mobile Polish** (Sprints 3-4) — forms, detail views, animation
2. **Onboarding Wizards** (#145) — guided first-time experience across verticals
3. **DTF Gang Sheet Builder** (#144) — new vertical, direct user request

**Demo-blocking bugs**: #128 (leading zeros), #129 (tier validation), #138 (color pricing doubles)

### Phase 2: Feedback Iteration + Backend Foundation

**Goal**: Incorporate user feedback, build backend horizontal foundation, connect first vertical end-to-end.

**Key bets** (to be shaped during cool-down):
- Process Gary's demo feedback into vertical BRIEFs
- Backend horizontal: Supabase setup, auth, data model, API patterns (#84)
- Quoting vertical backend (reference implementation for other verticals)
- Sentry error monitoring (#86)

### Phase 3: Production App

**Goal**: All verticals connected to real backend. Production-grade reliability.

**Key bets** (not yet shaped):
- Remaining vertical backends
- Real-time updates (WebSockets or Supabase realtime)
- Multi-user support (future employees)
- Mobile optimization

### Phase 4: Mobile

**Goal**: Native mobile app on app stores.

**Not yet scoped.** Will be shaped after Phase 3 is stable.

## Vertical Inventory

| Vertical | Phase 1 Status | Pipeline Stage | Vertical BRIEF |
|----------|---------------|----------------|----------------|
| Dashboard | Complete | Demo | — |
| Quoting | Complete | Demo | TODO |
| Customer Management | Complete | Demo | TODO |
| Invoicing | Complete | Demo | TODO |
| Price Matrix | Complete | Demo | TODO |
| Jobs | Complete | Demo | TODO |
| Screen Room | Integrated | Demo | TODO |
| Garments | Complete | Demo | TODO |
| Mobile Optimization | Sprint 2 done | Build (Sprints 3-4) | — |
| DTF Gang Sheet | Not started | Discovery (#144) | — |

## Current Bets (What We're Working On)

1. **Mobile Polish** (Sprints 3-4) — forms, detail views, animation. Patterns established in Sprints 1-2.
2. **Onboarding Wizards** (#145) — guided first-time experience for Gary demo. 3 journeys: view job board, close invoice, create customer.
3. **DTF Gang Sheet Builder** (#144) — new vertical, direct user request. Full pipeline: discovery → build.
4. **Demo-blocking bug fixes** — #128 (leading zeros), #129 (tier validation), #138 (color pricing doubles)
5. **Gary demo** (Feb 21) — First real user feedback session. All 7 verticals + mobile + wizards.

## Forward Planning (Shaped But Not Started)

These are shaped ideas waiting for a betting decision post-demo:

- **Backend horizontal foundation** (#84) — Supabase architecture, data model, auth, migration patterns
- **Vertical BRIEF system** (#89) — Per-vertical state documents consolidating feedback, dependencies, pipeline stage
- **Mockup integration** — Wire garment mockup thumbnails into Quote Detail, Job Detail, Kanban Board. Auto-attach mockups to quote emails.
- **Minimal backend** — Supabase for seamless demo user journey (stretch goal if time allows)
- **Shop floor display** — Auto-refreshing Kanban board for TV/tablet (replaces physical whiteboard)

## Resolved Strategic Questions

- **Backend scope**: Horizontal foundation first, then vertical backends. Decided during PM Foundation (#91).
- **Demo timing**: Demo Feb 21 with all 7 verticals built. Decided during 1:1 (2026-02-14).
- **Mobile path**: Responsive web (Phase 1) → PWA (Phase 2) → Native (Phase 3, when scale justifies). Confirmed via mobile research.

## Open Strategic Questions

- Multi-user: when does 4Ink need other employees using the system? This affects auth architecture timing.
- DTF vs Screen Print quoting: will DTF Gang Sheet Builder require revisions to the existing quoting flow?

## Label Taxonomy

Issues are tagged with a consistent multi-dimensional taxonomy:

| Dimension | Labels | Purpose |
|-----------|--------|---------|
| **Vertical** | `vertical/quoting`, `vertical/jobs`, `vertical/invoicing`, `vertical/customers`, `vertical/price-matrix`, `vertical/screen-room`, `vertical/garments`, `vertical/dashboard`, `vertical/infrastructure` | Where does this belong? |
| **Type** | `type/bug`, `type/feature`, `type/research`, `type/feedback`, `type/tech-debt`, `type/refactor`, `type/tooling` | What kind of thing is it? |
| **Priority** | `priority/now`, `priority/next`, `priority/later`, `priority/icebox` | When should we address it? |
| **Source** | `source/testing`, `source/interview`, `source/idea`, `source/review`, `source/cool-down` | Where did it come from? |
| **Phase** | `phase/1`, `phase/2`, `phase/3` | Which development phase? |

## Information Hierarchy

```
ROADMAP.md (this file)          — Strategic: where are we going?
docs/verticals/{name}/BRIEF.md  — Per-vertical: what do we know?
GitHub Issues (labeled)          — Tactical: what specific work is identified?
KB Sessions                      — Historical: what happened and why?
```

Each layer answers a different question. Fresh Claude sessions read top-down for context.

## Related Documents

- `PROGRESS.md` — What's been built (updated after PR merges)
- `docs/IMPLEMENTATION_PLAN.md` — Phase 1 build record + demo week plan (updated 2026-02-14)
- `docs/PRD.md` — Feature definitions and acceptance criteria
- `docs/APP_FLOW.md` — Routes and navigation paths
- `docs/TECH_STACK.md` — Tool choices, versions, decisions
- `knowledge-base/src/content/sessions/` — Historical session records
