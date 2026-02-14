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

### Phase 1: Frontend Mockups (Current)

**Goal**: High-fidelity UI with mock data for user acceptance testing. No backend.

**Status**: 6 of 7 verticals built and demo-ready. Screen Room integrated into existing verticals (customer screens tab, job detail) rather than standalone page.

**Remaining**:
- Screen intelligence integration — quote-time reuse detection, setup fee auto-discount, job detail linked screens
- First demo with Gary (4Ink owner) for feedback
- Polish pass and tech debt (#15-#18, #52-#57, #70-#78)

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
| Dashboard | Built | Demo | — |
| Quoting | Built | Demo | `docs/verticals/quoting/BRIEF.md` (TODO) |
| Customer Management | Built | Demo | TODO |
| Invoicing | Built | Demo | TODO |
| Price Matrix | Built | Demo | TODO |
| Jobs | Built | Demo | TODO |
| Screen Room | Integrated | Demo | TODO |
| Garments | Built | Demo | TODO |

## Current Bets (What We're Working On)

1. **Screen intelligence integration** — Quote-time reuse detection, setup fee auto-discount, job detail linked screens
2. **Gary demo** — First real user feedback session (6 verticals + screen integration ready)
3. **Garment Mockup Engine** — SVG composition engine, 16-task TDD plan ready
4. **Mobile Optimization Sprint 2** — Responsive page adaptations
5. **Tooling improvements** — hookify (#80), firecrawl integration (#81), review workflow (#88)

## Forward Planning (Shaped But Not Started)

These are shaped ideas waiting for a betting decision during cool-down:

- **Backend horizontal foundation** (#84) — Supabase architecture, data model, auth, migration patterns
- **Vertical BRIEF system** (#89) — Per-vertical state documents consolidating feedback, dependencies, pipeline stage
- **Cool-down skill** (#83) — Automated cycle retrospective and forward planning
- **Multi-team competitive cool-down** — Extension of cool-down skill with N agent teams proposing competing pitches

## Open Strategic Questions

- How should backend verticals be scoped? One-at-a-time (quoting backend, then jobs backend) or horizontal foundation first?
- When to demo to Gary? After remaining 2 verticals are built, or demo what we have now?
- Mobile optimization: responsive web first, or plan for React Native / Expo from Phase 3?
- Multi-user: when does 4Ink need other employees using the system? This affects auth architecture timing.

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
- `docs/IMPLEMENTATION_PLAN.md` — Sequenced build steps (needs update, #87)
- `docs/PRD.md` — Feature definitions and acceptance criteria
- `docs/APP_FLOW.md` — Routes and navigation paths
- `docs/TECH_STACK.md` — Tool choices, versions, decisions
- `knowledge-base/src/content/sessions/` — Historical session records
