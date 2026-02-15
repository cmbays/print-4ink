---
title: "CLAUDE.md"
description: "AI operating rules, design system, coding standards, and canonical doc registry. Loaded every session."
category: canonical
status: active
phase: all
last_updated: 2026-02-14
last_verified: 2026-02-14
depends_on: []
---

# Screen Print Pro — CLAUDE.md

## Project Overview

Screen Print Pro is production management software for 4Ink, a screen-printing shop. It manages the full garment lifecycle: Quote → Artwork Approval → Screen Room → Production → Shipping. The primary user is the shop owner/operator who needs instant clarity on job status, blocked items, and next actions.

**Current Phase**: Phase 1 — Mockup with mock data for user acceptance testing. No backend yet.

## Commands

```bash
# Dev
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest (schema tests)
npm run test:watch   # Vitest in watch mode
npx tsc --noEmit     # Type check
npx shadcn@latest add <component>  # Add shadcn/ui component

# Version Control (git worktrees)
git worktree list                    # List all active worktrees
git worktree add <path> -b <branch>  # Create worktree + branch from main
git worktree add <path> -b <branch> <base>  # Stacked: branch from another branch
git worktree remove <path>           # Remove worktree after PR merges
git push -u origin <branch>          # Push branch to remote
gh pr create --title "..." --body "..."  # Create PR
npm run kb:dev                       # Knowledge base dev server (Astro)
npm run kb:build                     # Knowledge base production build
npm run kb:preview                   # Knowledge base preview

# Session Orchestration (requires: source scripts/work.sh in .zshrc)
work <topic>                          # New workstream: detached tmux session + worktree
work <topic> <base-branch>           # Related work: window in parent's tmux session
work <topic> --prompt "task desc"     # Seed new Claude with initial prompt
work --stack <topic>                  # Stack from current branch (auto-detects $PWD)
work list                             # Show sessions, windows, ports
work focus                            # Read-only tiled monitor of windows
work unfocus                          # Close monitor, back to original
work clean <topic>                    # Remove worktree + tmux + branch
# New workstream: user splits Ghostty pane, runs "tmux attach -t <topic>"
# Related work: Claude runs work automatically, new window appears as tab
```

## Session Startup (Required)

Every Claude session that will modify code MUST create its own worktree.

### Standard Session (branch from main)

1. **Pull latest main**: `git -C ~/Github/print-4ink pull origin main`
2. **Create worktree**: `git -C ~/Github/print-4ink worktree add ~/Github/print-4ink-worktrees/session-MMDD-topic -b session/MMDD-topic`
3. **Install deps**: `cd ~/Github/print-4ink-worktrees/session-MMDD-topic && npm install`
4. **Create scratchpad**: Write `.session-context.md` with task context (gitignored)
5. **Work normally** — edit files, run tests, dev server (`PORT=300X npm run dev`)
6. **Commit and push frequently** — after each logical chunk of work (a completed component, a passing test suite, a schema change), commit and push immediately. Don't batch commits until the end.
   - `git add <files> && git commit -m "description" && git push -u origin session/MMDD-topic`
   - First push uses `-u` to set upstream; subsequent pushes just need `git push`
7. **Open PR when ready**: `gh pr create --title "..." --body "..."`

### Stacked PR (branch from worktree branch)

1. **Create worktree from branch**: `git -C ~/Github/print-4ink worktree add ~/Github/print-4ink-worktrees/session-MMDD-v2 -b session/MMDD-v2 session/MMDD-parent`
2. **Install deps**: `cd ~/Github/print-4ink-worktrees/session-MMDD-v2 && npm install`
3. When creating PR, set base to parent branch (not main)

### Cleanup (after PR merges)

1. `git -C ~/Github/print-4ink pull origin main`
2. `git -C ~/Github/print-4ink worktree remove ~/Github/print-4ink-worktrees/session-MMDD-topic`
3. `git -C ~/Github/print-4ink branch -d session/MMDD-topic`

### Rules

- **Worktree location**: Always `~/Github/print-4ink-worktrees/<branch-name>/`
- **Main repo** (`~/Github/print-4ink/`) stays on `main` — never switch branches there
- Branch name format: `session/<MMDD>-<kebab-case-topic>`
- **NEVER push directly to main** — always branch + PR
- **Push after every commit** — work should always be on the remote. Local-only commits are at risk if a worktree is lost. Commit+push is one action, not two separate steps.
- **No worktree limit** — accumulate worktrees freely during active work. The user will run a batch cleanup when ready.
- **NEVER remove worktrees you didn't create** — agents must only clean up their own worktree, and only when explicitly asked. Other worktrees may belong to concurrent sessions.
- **Dev server ports**: Each worktree uses a unique port (`PORT=3001`, `3002`, etc.)
- If session is read-only (research, questions), no worktree needed

## Hot File Protocol

These files cause merge conflicts in concurrent sessions. They are NEVER committed on feature branches.

| Hot File | Update Rule |
|----------|-------------|
| `PROGRESS.md` | Update on main after PR merge |
| `knowledge-base/dist/` | Build output — gitignored, never commit |

**What sessions CAN commit on their feature branch:**
- All source code changes
- New `knowledge-base/src/content/sessions/YYYY-MM-DD-*.md` session doc (unique filename, no conflicts)
- New docs (breadboards, spikes, strategy)
- Schema and test changes

**Per-worktree scratchpad**: Each session creates `.session-context.md` in its worktree root (gitignored). Task context, decisions, blockers, modified files.

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
  breadboards/              # Breadboard documents (affordance maps per vertical)
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

### Color Tokens (Ghostty Niji theme)

Colors are defined as CSS custom properties in `app/globals.css` and exposed via `@theme inline` for Tailwind. Use the **Tailwind class** column, not raw CSS variables.

| Tailwind Class | CSS Variable | Value | Use |
|----------------|-------------|-------|-----|
| `bg-background` | `--background` | `#141515` | Main background |
| `bg-elevated` | `--elevated` | `#1c1d1e` | Cards, panels |
| `bg-surface` | `--surface` | `#232425` | Interactive surfaces |
| `text-foreground` | `--foreground` | `rgba(255,255,255,0.87)` | High-emphasis text |
| `text-muted-foreground` | `--muted-foreground` | `rgba(255,255,255,0.60)` | Medium-emphasis text, hints |
| `text-action` | `--action` | `#2ab9ff` (Niji blue) | Primary CTAs, active states |
| `text-success` | `--success` | `#54ca74` (Niji green) | Completions |
| `text-error` / `text-destructive` | `--error` / `--destructive` | `#d23e08` (Niji red) | Failures |
| `text-warning` | `--warning` | `#ffc663` (Niji gold) | Cautions |
| `border-border` | `--border` | `rgba(255,255,255,0.12)` | Subtle borders |

> **Note:** There is no separate "text-secondary" or "text-muted" token. `text-foreground` (87% opacity) is high emphasis, `text-muted-foreground` (60% opacity) covers both medium emphasis and hint text. Do NOT use `text-text-muted` or `text-text-secondary` — these classes do not exist.

### Typography & Spacing

- **Fonts**: Inter (UI), JetBrains Mono (code) — loaded via `next/font`
- **Spacing**: 8px base scale. Use Tailwind spacing utilities.
- **Border radius**: `sm: 4px`, `md: 8px`, `lg: 12px`
- **Neobrutalist shadow**: `4px 4px 0px` on primary CTAs

### z-index Scale

| z-index | Usage | Notes |
|---------|-------|-------|
| `z-10` | Sticky headers, inline overlays | Within content flow |
| `z-40` | BottomActionBar, FAB | Above content, below navigation |
| `z-50` | BottomTabBar, Sheet/Dialog overlays | Navigation + modal layer (shadcn default) |

Sheet and Dialog components from shadcn/ui use z-50 with a backdrop overlay that covers the full viewport. Do not create new z-index values without checking this scale.

### Mobile Responsive Patterns

- **Breakpoint**: `md:` (768px) is the single responsive breakpoint. Below = mobile, above = desktop.
- **CSS-first responsive**: Use `md:hidden` / `hidden md:block` for show/hide. Avoid `useIsMobile()` unless JS logic requires it (e.g., FullScreenModal). CSS breakpoints have zero hydration risk.
- **Mobile tokens**: Defined in `globals.css @theme inline` — `--mobile-nav-height`, `--mobile-touch-target`, `--mobile-card-gap`, etc. Use via Tailwind: `h-(--mobile-nav-height)`.
- **Touch targets**: All mobile interactive elements must be ≥ 44px (`min-h-(--mobile-touch-target)`). Enforce per-component, NOT via global CSS.
- **Safe area**: Use `pb-safe` utility for bottom safe area on notched devices. Requires `viewport-fit=cover` in viewport meta.
- **Navigation constants**: Import from `lib/constants/navigation.ts` — shared between Sidebar, BottomTabBar, MobileDrawer.
- **Conditional rendering for state reset**: Bottom sheets and modals that have form state should be rendered conditionally: `{open && <Sheet />}`. This ensures React unmounts/remounts on close, resetting all `useState` hooks automatically.

## Coding Standards

1. **Zod-first types**: Define Zod schema, derive type via `z.infer<typeof schema>`. No separate interfaces.
2. **Server components default**: Only add `"use client"` when using hooks, event handlers, or browser APIs. When a server component (e.g., `layout.tsx`) needs client interactivity, extract a `"use client"` wrapper component that receives `children` as a prop — keep the parent as a server component.
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

## Pre-Build Ritual

### Every Vertical (Required)

Before building any vertical's screens, produce a **breadboard document** using the `breadboarding` skill:

1. **Run breadboarding skill** → produces `docs/breadboards/{vertical}-breadboard.md`
   - Maps all Places (pages, modals, subplaces)
   - Lists every UI affordance with wiring (control flow + data flow)
   - Identifies code affordances (Phase 1: client-side, Phase 2: server-side)
   - Defines component boundaries (shared vs vertical-specific)
   - Establishes build order with dependency chain
2. **Verify scope coverage** — every CORE feature from scope definition has corresponding affordances
3. **Frontend-builder reads breadboard** as part of its startup sequence

### Complex Screens (Additional)

For screens with high interaction complexity (e.g., New Quote Form, Kanban Board):

1. **Spike unknowns**: Write a spike file in `docs/spikes/` investigating technical questions
   - Structure: Context → Goal → Questions → Findings → Recommendation
   - Name: `spike-{topic}.md` (e.g., `spike-kanban-dnd.md`)
   - Questions should ask about mechanics ("How does X work?"), not effort ("How long?")
2. **Ask 3-5 clarifying questions** before building (use AskUserQuestion)
3. **Document answers** in `.session-context.md` scratchpad

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
- No pushing directly to main — always branch + PR

## Canonical Documents

These documents define the project. Reference them, keep them current, and never contradict them.

| Document | Purpose | Update When |
|----------|---------|-------------|
| `CLAUDE.md` | AI operating rules, loaded every session | Any pattern/rule changes |
| `docs/ROADMAP.md` | Vision, phases, bets, forward planning | Cycle transitions, betting decisions |
| `docs/AGENTS.md` | Agent registry, orchestration, calling conventions | Adding/retiring agents |
| `docs/TECH_STACK.md` | Tool choices, versions, decision context | Adding/removing/upgrading deps |
| `docs/PRD.md` | Features, scope, acceptance criteria | Scope changes or new features |
| `docs/APP_FLOW.md` | Screens, routes, navigation paths | Adding/changing pages or flows |
| `docs/IMPLEMENTATION_PLAN.md` | Sequenced build steps | Completing steps or re-prioritizing |
| `PROGRESS.md` | Current state, what's built, what's next | After PR merges (on main only) |
| `docs/HISTORY.md` | Archived session logs and feature details | When archiving completed work |

**Rules:**
- Before starting any work, read `ROADMAP.md` for strategic context and current bets.
- Before adding a dependency, check `TECH_STACK.md`. If it's not listed, ask first.
- Before building a screen, check `APP_FLOW.md` for its route, purpose, and connections.
- Before starting work, check `IMPLEMENTATION_PLAN.md` for the current step.
- After PR merges, update `PROGRESS.md` on main with what was built and what's next.
- After completing work, create or update a session doc in `knowledge-base/src/content/sessions/` (see Knowledge Base section below).
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
| `frontend-builder` | Building screens or components | breadboarding, screen-builder, quality-gate |
| `requirements-interrogator` | Before building complex features | pre-build-interrogator |
| `design-auditor` | Design review checkpoints | design-audit |
| `feature-strategist` | Competitive analysis, feature planning | feature-strategy |
| `doc-sync` | Syncing docs with code changes | doc-sync |
| `secretary` (Ada) | Project pulse, 1:1 check-ins, strategic advice | one-on-one, cool-down |
| `finance-sme` | Self-review of financial calculations | — |
| `build-reviewer` | Self-review of code quality | — |

**Calling convention**: "Use the [agent-name] agent to [task]" — e.g., "Use the frontend-builder agent to build PageHeader"

### Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `vertical-discovery` | Start of each new vertical | 7-step competitor research + user interview + journey design methodology |
| `breadboarding` | After scope definition, before build | Map UI/code affordances, wiring, places, and component boundaries into a buildable blueprint |
| `screen-builder` | Starting Steps 1-10 | Build screens with design system + quality checklist + templates |
| `quality-gate` | After completing a screen | Audit against 10-category quality checklist with pass/fail report |
| `pre-build-interrogator` | Before complex features | Exhaustive questioning to eliminate assumptions |
| `design-audit` | Design review checkpoints | 15-dimension audit against design system |
| `feature-strategy` | Feature planning | Product strategy frameworks and feature plan templates |
| `doc-sync` | After completing steps | Drift detection and doc synchronization |
| `cool-down` | Between build cycles, after demos | Retrospective synthesis and forward planning (Shape Up) |

### Orchestration Patterns

> Simplified references. See `docs/AGENTS.md` for full pattern details.

- **Vertical Build Chain** (standard per-vertical): `vertical-discovery → scope definition → breadboarding → frontend-builder → quality-gate → demo`
- **Linear Chain** (simple screens): `frontend-builder → quality-gate → progress update`
- **Pre-Build Chain** (complex screens): `breadboarding → requirements-interrogator → spike doc → frontend-builder → quality-gate → progress update`
- **Checkpoint Chain** (milestones): `design-auditor → audit report → user approval → frontend-builder (fixes) → quality-gate`
- **Competitive Analysis**: `feature-strategist → feature plan → user approval → update IMPLEMENTATION_PLAN`

## Knowledge Base (Astro)

After every feature build, plan, or decision, create or update a Markdown file in `knowledge-base/src/content/sessions/`.

### File Format

Create `knowledge-base/src/content/sessions/YYYY-MM-DD-kebab-topic.md` with YAML frontmatter:

```yaml
---
title: "Document Title"
subtitle: "Short description"
date: YYYY-MM-DD
phase: 1
vertical: VERTICAL_SLUG
verticalSecondary: []
stage: STAGE_SLUG
tags: [feature, build]
sessionId: "UUID"
branch: "session/MMDD-topic"
status: complete
---

## Body Content

Write Markdown content here. Standard Markdown: headers, lists, tables, code blocks.
```

### Commands

```bash
npm run kb:dev       # Astro dev server (knowledge-base)
npm run kb:build     # Production build (50+ static pages + Pagefind search index)
npm run kb:preview   # Preview production build locally
```

Or from within `knowledge-base/`:
```bash
npm run dev          # Astro dev server
npm run build        # Production build
npm run preview      # Preview
```

### Schema

All frontmatter is validated by Zod at build time (`knowledge-base/src/content.config.ts`).

**Verticals, stages, and tags** are defined in canonical config files — see `config/verticals.json`, `config/stages.json`, and `config/tags.json`. All consumers (KB schema, KB UI, `work.sh`) import from these files. Do not duplicate the lists elsewhere.

**Status:** `complete`, `in-progress`, `superseded`

### Features

- **Full-text search** (Pagefind): Indexes all session content, sub-results link to headings, tag facet filters
- **Client-side filtering**: Vertical, phase, and status filters on the index page
- **Pipeline stepper**: 7-stage pipeline visualization per vertical
- **Workflow chains**: Auto-computed related sessions by vertical+stage on detail pages
- **Gary Tracker**: Aggregated questions from all sessions (embed HTML blocks in Markdown)
- **Decision log**: All sessions tagged with `decision`
- **Vertical health**: Stats per vertical with progress indicators

### Gary Questions

Embed in any session Markdown file:
```html
<div class="gary-question" data-question-id="VERTICAL-q1" data-vertical="VERTICAL_SLUG" data-status="unanswered">
  <p class="gary-question-text">Your question here?</p>
  <p class="gary-question-context">Why this matters</p>
  <div class="gary-answer" data-answered-date=""></div>
</div>
```

### Rules

- **One file per session**: `YYYY-MM-DD-kebab-topic.md` in `knowledge-base/src/content/sessions/`
- **Build validates**: `npm run kb:build` catches schema errors at build time
- **Session ID**: Find via `ls -t ~/.claude/projects/-Users-cmbays-Github-print-4ink/*.jsonl | head -1` — filename (without `.jsonl`) is the ID
- **Include**: session resume command, artifact links, PR links, decision rationale
- **Related sessions**: Workflow chains are auto-computed — no manual linking needed

## Lessons Learned

Capture mistakes and patterns here so they aren't repeated. Update as you go.

- **Tailwind v4**: Uses `@theme inline` in CSS, not `tailwind.config.ts`. Design tokens go in `globals.css`.
- **shadcn/ui init**: Works after scaffold files are in place and `npm install` has run.
- **create-next-app**: Refuses non-empty directories — scaffold in temp dir and copy files.
- **Zod v4 UUID validation**: Validates full RFC-4122 format — version byte (3rd group must start with 1-8) AND variant byte (4th group must start with 8, 9, a, or b). Hand-crafted UUIDs often fail the variant check.
- **Radix Tooltip hover bugs**: Adjacent tooltips need a single shared `<TooltipProvider>` with `skipDelayDuration={300}`, base `sideOffset >= 6`, `data-[state=closed]:pointer-events-none` on content, and `pointer-events-none` on arrow. Do NOT use `disableHoverableContent` — it causes flickering on small targets.
- **shadcn/ui Tooltip dark mode**: Default `bg-foreground text-background` is invisible in dark mode. Override to `bg-elevated text-foreground border border-border shadow-lg`. Arrow: `bg-elevated fill-elevated`.
- **Git worktrees**: Main repo (`~/Github/print-4ink/`) always stays on `main`. Worktrees go in `~/Github/print-4ink-worktrees/`. Each worktree needs its own `npm install`. No limit on concurrent worktrees — user handles batch cleanup. Agents must NEVER remove worktrees they didn't create.
- **Hot files**: Never commit `PROGRESS.md` on feature branches. Update on main after merge. `knowledge-base/dist/` is gitignored.
- **CRITICAL — Financial arithmetic**: NEVER use JavaScript floating-point (`+`, `-`, `*`, `/`) for monetary calculations. IEEE 754 causes silent errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). Use `big.js` via the `lib/helpers/money.ts` wrapper (`money()`, `round2()`, `toNumber()`). Schema invariants use `Big.eq()` for exact comparison — no tolerance hacks. Integer-cents workarounds still fail on multiplication/division (tax rates, percentage deposits).
- **React 19 ESLint — no setState in effects**: Don't use `useEffect` to reset form state when a dialog opens. Instead, have the parent conditionally render the dialog (`{showDialog && <Dialog />}`) so React unmounts/remounts the component, naturally resetting all `useState` hooks.
- **KB sessionId is per-session, not per-document**: Multiple KB docs can share the same `sessionId` when created in the same Claude Code session. Don't "fix" duplicates without checking context.
- **astro-pagefind works without `build.format: 'file'`**: The astro-pagefind docs recommend adding `build: { format: 'file' }` but this breaks clean URLs (outputs `page.html` instead of `page/index.html`). Skip it.
- **KB links must be absolute**: Relative markdown links (`../docs/...`) won't resolve in the deployed KB. Use absolute GitHub URLs (`https://github.com/.../blob/main/...`) for repo file references. Prefer `main` or commit permalinks over branch URLs (branches get deleted after merge).
- **Astro CI needs `astro sync`**: The `knowledge-base/.astro/` directory is gitignored. CI must run `npx astro sync` in `knowledge-base/` before `tsc --noEmit`, or exclude KB from the root type check.
- **CRITICAL — Worktree removal order**: ALWAYS `cd` out of a worktree directory BEFORE removing it. The Bash tool's working directory persists between calls — if you `git worktree remove` while CWD is inside the worktree, every subsequent shell command fails because the directory no longer exists (orphaned CWD). Correct sequence: `cd ~/Github/print-4ink && git worktree remove <path>`.
- **Breadboard parallelization windows**: When writing breadboard build orders, explicitly mark which tasks can run concurrently. This enables `superpowers:subagent-driven-development` to parallelize correctly without re-analyzing the dependency graph. Every breadboard since Price Matrix has used this pattern — it's now required.
- **Mobile tokens before mobile screens**: Define CSS custom properties (`--mobile-nav-height`, `--mobile-touch-target`, etc.) in a foundation sprint before building responsive adaptations. Sprint 1's token layer made Sprint 2 trivially fast. Always establish the token vocabulary first.
- **Subagent-driven development for large plans**: For implementation plans with 10+ tasks, use `superpowers:subagent-driven-development` with spec-then-quality two-stage reviews. The Garment Catalog build (18 tasks, PR #109) was the cleanest execution pattern — validated across multiple verticals.
