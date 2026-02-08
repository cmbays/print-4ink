# Screen Print Pro — CLAUDE.md

## Project Overview

Screen Print Pro is production management software for 4Ink, a screen-printing shop. It manages the full garment lifecycle: Quote → Artwork Approval → Screen Room → Production → Shipping. The primary user is the shop owner/operator who needs instant clarity on job status, blocked items, and next actions.

**Current Phase**: Phase 1 — Mockup with mock data for user acceptance testing. No backend yet.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npx shadcn@latest add <component>  # Add shadcn/ui component
```

## Tech Stack

- **Framework**: Next.js 15+ (App Router, TypeScript, Turbopack)
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
  reference/                # Archived design system docs, UX research
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

## Reference Documents

Extended context lives in `docs/reference/` — consult only when needed:

- `FRONTEND_GUIDELINES.md` — Full design token definitions, component CSS patterns
- `PLAYGROUND_AUDIT_PROTOCOL.md` — 15-point quality audit checklist
- `UX_USER_RESEARCH.md` — User pain points, "Love Factor" criteria
- `UX_HEURISTICS.md` — 10 UX heuristics for evaluation
- `UX_TASK_FLOWS.md` — Ideal user journey mappings
- `APP_FLOW_STANDARD.md` — User flow documentation standard
