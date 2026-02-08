---
title: "CLAUDE.md"
description: "AI operating rules, design system, coding standards, and canonical doc registry. Loaded every session."
category: canonical
status: active
phase: all
last_updated: 2026-02-08
last_verified: 2026-02-08
depends_on: []
---

# Screen Print Pro — CLAUDE.md

## Project Overview

Screen Print Pro is production management software for 4Ink, a screen-printing shop. It manages the full garment lifecycle: Quote → Artwork Approval → Screen Room → Production → Shipping. The primary user is the shop owner/operator who needs instant clarity on job status, blocked items, and next actions.

**Current Phase**: Phase 1 — Mockup with mock data for user acceptance testing. No backend yet.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest (schema tests)
npm run test:watch   # Vitest in watch mode
npx tsc --noEmit     # Type check
npx shadcn@latest add <component>  # Add shadcn/ui component
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, TypeScript, Turbopack)
- **Styling**: Tailwind CSS — utility-first, no separate CSS files
- **UI Components**: shadcn/ui (Radix primitives). Always check `@/components/ui/` first.
- **Icons**: Lucide React only — no emoji icons, no custom SVGs
- **Forms**: React Hook Form + Zod — schema-first validation
- **Tables**: TanStack Table — sortable, filterable job queues
- **Drag & Drop**: dnd-kit — Kanban production board
- **Animation**: Framer Motion — spring transitions, respect `prefers-reduced-motion`
- **State**: URL query params for filters/search. No global state libraries.

## Architecture

```
app/                        # Pages & layouts (file-based routing)
  (dashboard)/              # Dashboard route group
  layout.tsx                # Root layout (fonts, metadata)
  globals.css               # Tailwind directives + CSS custom properties
components/
  ui/                       # shadcn/ui primitives (auto-generated)
  features/                 # Domain components (QuoteCalculator, KanbanBoard)
  layout/                   # Shell components (Sidebar, Topbar)
lib/
  schemas/                  # Zod schemas — single source of truth for types
  constants.ts              # Enums, status mappings
  mock-data.ts              # Realistic sample data
  utils.ts                  # shadcn/ui cn() helper
docs/
  PROJECT_BIBLE.md          # Full project context
  AGENTS.md                 # Agent registry & orchestration guide
  spikes/                   # Pre-build research spikes
  reference/                # Archived design system docs, UX research
agent-outputs/              # Structured output from agent runs (audit trail)
.claude/
  agents/                   # Agent definitions (YAML frontmatter + system prompts)
  skills/                   # Skill definitions (SKILL.md + templates/reference)
```

## Domain Context

- **Quote Matrix**: Pricing = f(quantity, colors, print locations). Line items with setup fees.
- **Garment Sourcing**: SKU selection by style/brand/color, sizes as record (S: 10, M: 25, L: 15).
- **Screen Room**: Track mesh count, emulsion type, burn status per screen, linked to jobs.
- **Production States**: `design → approval → burning → press → finishing → shipped`

## Design System

**Philosophy**: "Linear Calm + Raycast Polish + Neobrutalist Delight"

- **Base layer** (Linear): Monochrome, opacity-based text hierarchy, extreme restraint
- **Polish layer** (Raycast): Glass effects, responsive transitions, OS-native feel
- **Attention layer** (Neobrutalist): Bold borders, vibrant status colors, springy animations

### Color Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg-primary` | `#09090b` | Main background |
| `--color-bg-elevated` | `#18181b` | Cards, panels |
| `--color-bg-surface` | `#1c1c1f` | Interactive surfaces |
| `--color-text-primary` | `rgba(255,255,255,0.87)` | High-emphasis text |
| `--color-text-secondary` | `rgba(255,255,255,0.60)` | Medium-emphasis text |
| `--color-text-muted` | `rgba(255,255,255,0.38)` | Hints, disabled |
| `--color-action` | `#22d3ee` (cyan) | Primary CTAs |
| `--color-success` | `#34d399` (green) | Completions |
| `--color-error` | `#f87171` (red) | Failures |
| `--color-warning` | `#fbbf24` (amber) | Cautions |

### Typography & Spacing

- **Fonts**: Inter (UI), JetBrains Mono (code) — loaded via `next/font`
- **Spacing**: 8px base scale. Use Tailwind spacing utilities.
- **Border radius**: `sm: 4px`, `md: 8px`, `lg: 12px`
- **Neobrutalist shadow**: `4px 4px 0px` on primary CTAs

## Coding Standards

1. **Zod-first types**: Define Zod schema, derive type via `z.infer<typeof schema>`. No separate interfaces.
2. **Server components default**: Only add `"use client"` when using hooks, event handlers, or browser APIs.
3. **DRY components**: Wrap repeated UI into reusable components in `@/components/`.
4. **Separation of concerns**: Keep logic (hooks) separate from presentation (Tailwind classes).
5. **URL state**: Filters, search, pagination live in URL query params.
6. **Breadcrumb navigation**: Deep views use breadcrumbs (Home > Jobs > #1024 > Mockups).

## Quality Checklist

Before considering any screen done:

- [ ] Visual hierarchy clear — primary action is most prominent
- [ ] Spacing uses Tailwind tokens — no hardcoded px values
- [ ] Typography: max 3-4 sizes per screen, Inter for UI, JetBrains Mono for code only
- [ ] Color: monochrome base, status colors only for meaning (not decoration)
- [ ] All interactive elements have hover, focus-visible, active, disabled states
- [ ] Icons from Lucide only, consistent sizes (16/20/24px)
- [ ] Motion uses design tokens, respects `prefers-reduced-motion`
- [ ] Empty, loading, and error states designed
- [ ] Keyboard navigable, proper ARIA labels, 4.5:1 contrast minimum
- [ ] Apply Jobs Filter: "Can this be removed without losing meaning?" If yes, remove it.

## UX Principles

- **5-second rule**: User understands the screen's state in 5 seconds
- **3-click max**: Any action reachable within 3 clicks from dashboard
- **Progressive disclosure**: Start simple, expand details on demand
- **Jobs Filter**: Every element must earn its place — remove until it breaks
- **Priority order on dashboard**: (1) What's blocked, (2) Recent activity, (3) In progress
- **Love Factor**: Always correct data, saves time, guided workflow, zero friction

## Pre-Build Ritual (Complex Steps Only)

For steps flagged as complex (currently Steps 4 and 6):

1. **Spike unknowns**: Write a spike file in `docs/spikes/` investigating technical questions
   - Structure: Context → Goal → Questions → Findings → Recommendation
   - Name: `spike-{topic}.md` (e.g., `spike-kanban-dnd.md`)
   - Questions should ask about mechanics ("How does X work?"), not effort ("How long?")
2. **Decompose affordances**: List UI elements, code mechanisms, and wiring in a simple table
3. **Ask 3-5 clarifying questions** before building (use AskUserQuestion)
4. **Document answers** in progress.txt session log

## Development Workflow

1. **Phase 1 (current)**: Build high-fidelity UI with mock data. No backend, no API calls.
2. **Phase 2**: Iterate with user (4Ink owner) based on feedback.
3. **Phase 3**: Lock Zod schemas → build backend, database, real API integration.

## What NOT to Do

- No separate CSS files — Tailwind utilities only
- No emoji icons — Lucide React only
- No global state (Redux, Zustand) — URL params + React state
- No backend/API calls in Phase 1 — mock data only
- No `any` types — use Zod inference or explicit types
- No colors outside the design token palette
- No decorative gradients — color communicates meaning
- No `className` string concatenation — use `cn()` from `@/lib/utils`

## Canonical Documents

These documents define the project. Reference them, keep them current, and never contradict them.

| Document | Purpose | Update When |
|----------|---------|-------------|
| `CLAUDE.md` | AI operating rules, loaded every session | Any pattern/rule changes |
| `docs/AGENTS.md` | Agent registry, orchestration, calling conventions | Adding/retiring agents |
| `docs/TECH_STACK.md` | Tool choices, versions, decision context | Adding/removing/upgrading deps |
| `docs/PRD.md` | Features, scope, acceptance criteria | Scope changes or new features |
| `docs/APP_FLOW.md` | Screens, routes, navigation paths | Adding/changing pages or flows |
| `docs/IMPLEMENTATION_PLAN.md` | Sequenced build steps | Completing steps or re-prioritizing |
| `progress.txt` | Session-to-session state | After every completed feature |

**Rules:**
- Before adding a dependency, check `TECH_STACK.md`. If it's not listed, ask first.
- Before building a screen, check `APP_FLOW.md` for its route, purpose, and connections.
- Before starting work, check `IMPLEMENTATION_PLAN.md` for the current step.
- After completing work, update `progress.txt` with what was built and what's next.
- After completing work, create or update the appropriate `for_human/` HTML doc (see For Human Docs below).
- When a doc becomes stale, update it — don't ignore it.
- Every canonical doc has a `Last Verified` date. Update it when you confirm the doc still matches reality.

## Reference Documents

Extended context lives in `docs/reference/` — consult only when needed:

- `FRONTEND_GUIDELINES.md` — Design tokens, component patterns, Tailwind + shadcn/ui usage
- `SCREEN_AUDIT_PROTOCOL.md` — 15-point visual quality audit checklist
- `UX_HEURISTICS.md` — 10-point UX quality checklist with Screen Print Pro examples
- `APP_FLOW_STANDARD.md` — Template for writing APP_FLOW documentation

## Agent & Skill Infrastructure

Agents and skills are different primitives. **Agents** (`.claude/agents/`) are specialized AI assistants with own context windows and system prompts. **Skills** (`.claude/skills/`) are domain expertise containers with instructions, templates, and references. Agents preload skills for domain expertise.

Full details: `docs/AGENTS.md` (canonical reference for agent registry, orchestration patterns, and calling conventions).

### Agents

| Agent | Use When | Preloaded Skills |
|-------|----------|------------------|
| `frontend-builder` | Building screens or components | screen-builder, quality-gate |
| `requirements-interrogator` | Before building complex features | pre-build-interrogator |
| `design-auditor` | Design review checkpoints | design-audit |
| `feature-strategist` | Competitive analysis, feature planning | feature-strategy |
| `doc-sync` | Syncing docs with code changes | doc-sync |

**Calling convention**: "Use the [agent-name] agent to [task]" — e.g., "Use the frontend-builder agent to build PageHeader"

### Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `vertical-discovery` | Start of each new vertical | 7-step competitor research + user interview + journey design methodology |
| `screen-builder` | Starting Steps 1-10 | Build screens with design system + quality checklist + templates |
| `quality-gate` | After completing a screen | Audit against 10-category quality checklist with pass/fail report |
| `pre-build-interrogator` | Before complex features | Exhaustive questioning to eliminate assumptions |
| `design-audit` | Design review checkpoints | 15-dimension audit against design system |
| `feature-strategy` | Feature planning | Product strategy frameworks and feature plan templates |
| `doc-sync` | After completing steps | Drift detection and doc synchronization |

### Orchestration Patterns

- **Linear Chain** (simple screens): `frontend-builder → quality-gate → progress update`
- **Pre-Build Chain** (complex screens): `requirements-interrogator → spike → frontend-builder → quality-gate`
- **Checkpoint Chain** (milestones): `design-auditor → audit report → user approval → fixes`
- **Competitive Analysis**: `feature-strategist → feature plan → user approval`

## For Human Docs

After every feature build, plan, or decision, create or update an HTML doc in `for_human/`.

**Template**: Use `for_human/_template.html` as the reference. Every file must have the standardized header:
1. Back navigation (`← Back to Index`)
2. Tag pills (1-3 per session)
3. Title + subtitle
4. Meta grid: Date, Branch, Phase, Vertical
5. Session resume: `claude --resume <id>`
6. Related sessions (navigation buttons to related `for_human/` docs, if any)
7. Divider before body content

**Tags** (apply 1-3 per session):

| Tag | Color | Use When |
|-----|-------|----------|
| Feature | Green | New functionality built |
| Build | Green | Infrastructure, tooling, scaffold |
| Plan | Cyan | Strategy or roadmap created |
| Decision | Amber | Choice made between alternatives |
| Research | Purple | Competitive analysis, exploration |
| Learning | Amber | Lesson learned or gotcha documented |

**Rules:**
- **Bundle** related content into the same file (e.g., multi-session work on one screen)
- **Separate** distinct features, standalone decisions, different project phases
- **Update `for_human/index.html`** with a new entry card (insert above `<!-- NEW ENTRIES GO HERE -->`) with matching tags
- **Update `for_human/README.md`** index table to match
- **Include**: session resume command, artifact links, PR links, decision rationale
- **Session ID**: Find the current session ID by running `ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1` — the filename (without `.jsonl`) is the ID. Never use IDs from plan text or prior sessions.
- **Style**: use project design tokens (dark theme, cyan accent, Inter font) — copy from `_template.html`
- **Related sessions**: Link to other `for_human/` docs that share the same workflow chain (e.g., discovery → build → demo)

## Lessons Learned

Capture mistakes and patterns here so they aren't repeated. Update as you go.

- **Tailwind v4**: Uses `@theme inline` in CSS, not `tailwind.config.ts`. Design tokens go in `globals.css`.
- **shadcn/ui init**: Works after scaffold files are in place and `npm install` has run.
- **create-next-app**: Refuses non-empty directories — scaffold in temp dir and copy files.
- **Zod v4 UUID validation**: Validates full RFC-4122 format — version byte (3rd group must start with 1-8) AND variant byte (4th group must start with 8, 9, a, or b). Hand-crafted UUIDs often fail the variant check.
