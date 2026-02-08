---
title: "{Vertical} — Breadboard"
description: "UI affordances, code affordances, wiring, and component boundaries for the {Vertical} vertical"
category: breadboard
status: draft
phase: 1
created: YYYY-MM-DD
last-verified: YYYY-MM-DD
depends-on:
  - docs/strategy/{vertical}-scope-definition.md
  - docs/strategy/screen-print-pro-journey-{vertical}.md
---

# {Vertical} — Breadboard

**Purpose**: Map all UI affordances, code affordances, and wiring for the {Vertical} vertical before building
**Input**: Scope definition, improved journey design, APP_FLOW
**Status**: {Draft | Complete}

---

## Places

| ID | Place | Type | Entry Point | Description |
|----|-------|------|-------------|-------------|
| P1 | | Page | | |
| P2 | | Page | | |
| P2.1 | | Modal | | |

---

## UI Affordances

### P1 — {Place Name}

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U1 | | click | | |
| U2 | | type | | |

### P2 — {Place Name}

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U10 | | click | | |
| U11 | | type | | |

### P2.1 — {Modal Name}

| ID | Affordance | Control | Wires Out | Returns To |
|----|------------|---------|-----------|------------|
| U20 | | click | | |

---

## Code Affordances

| ID | Place | Affordance | Phase | Trigger | Wires Out | Returns To |
|----|-------|------------|-------|---------|-----------|------------|
| N1 | | | 1 | | | |
| N2 | | | 1 | | | |

---

## Data Stores

| ID | Place | Store | Type | Read By | Written By |
|----|-------|-------|------|---------|------------|
| S1 | | | URL state | | |
| S2 | | | React state | | |
| S3 | | | Mock data | | |

---

## Wiring Verification

- [ ] Every U has at least one Wires Out or Returns To
- [ ] Every N has a trigger
- [ ] Every S has at least one reader and one writer
- [ ] No dangling wire references
- [ ] Every CORE feature from scope definition has corresponding affordances

---

## Component Boundaries

| Component | Place(s) | Contains Affordances | Location | Shared? |
|-----------|----------|---------------------|----------|---------|
| | | | `components/features/` | Yes |
| | | | `app/(dashboard)/{route}/` | No |

---

## Build Order

| # | Component/Screen | Depends On | Blocks | Est. Complexity |
|---|-----------------|------------|--------|-----------------|
| 1 | | | | Low/Medium/High |
| 2 | | | | |

---

## Scope Coverage

Verify every CORE feature from the scope definition is represented:

| Scope Feature | Affordances | Covered? |
|---------------|-------------|----------|
| | U-, N-, S- | Yes/No |
| | | |

---

## Phase 2 Extensions

Code affordances that will be added in Phase 2:

| ID | Place | Affordance | Replaces | Description |
|----|-------|------------|----------|-------------|
| N- | | | N- (Phase 1) | |

---

## Related Documents

- `docs/strategy/{vertical}-scope-definition.md` (scope boundaries)
- `docs/strategy/screen-print-pro-journey-{vertical}.md` (improved journey)
- `docs/APP_FLOW.md` (routes and navigation)
- `CLAUDE.md` (design system, quality checklist)
