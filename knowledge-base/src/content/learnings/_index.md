# Learnings Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Engineering gotchas, reusable patterns, and one-time decisions discovered during builds. These are
the things that bit us or surprised us — captured so they don't repeat.

**Good deposit candidates:**

- A bug caused by IEEE 754 float arithmetic (financial/)
- A Tailwind v4 class that doesn't work as expected (ui/)
- A TypeScript type gotcha with Zod inference (typing/)
- A git worktree CWD trap (deployment/)
- A React 19 behavior that differed from React 18 (architecture/)
- A mobile touch target issue that required a specific pattern (mobile/)

**Does NOT belong here:**

- Domain rules (how pricing works) → `domain/`
- Engineering decisions about project architecture → `strategy/`
- Ongoing patterns that should inform every build → `CLAUDE.md` Lessons Learned

## Subdirectory guide

| Subdir          | Contents                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| `financial/`    | Money arithmetic gotchas, big.js patterns, Zod schema invariants for monetary fields |
| `architecture/` | Clean arch layer violations, ESLint boundary rules, import patterns, React patterns  |
| `mobile/`       | Breakpoint gotchas, touch target enforcement, safe area, hover visibility on touch   |
| `typing/`       | TypeScript Zod inference, interface vs type, UUID validation edge cases              |
| `ui/`           | Radix primitives, shadcn/ui dark mode, Tailwind v4 token patterns, Tooltip provider  |
| `deployment/`   | Vercel build quirks, git worktree CWD traps, CI env setup, Astro build gotchas       |

## Mutation model

**Append-only.** Never edit an existing learnings file. Each discovery gets a new file.

If a learnings entry becomes outdated (e.g., the gotcha was fixed in a new library version):

- Create a new file documenting the resolution
- Set `status: superseded` in the new file and reference the old one
- Leave the old file unchanged

## Naming convention

```
{subdir}/YYYY-MM-DD-kebab-topic.md

Examples:
  financial/2026-02-16-ieee754-multiply-zero.md
  ui/2026-02-15-tooltip-dark-mode-override.md
  deployment/2026-02-17-worktree-cwd-trap.md
  architecture/2026-02-14-domain-cannot-import-shared.md
```

## Frontmatter template

```yaml
---
title: 'Short descriptive title — what you hit and what fixed it'
type: 'gotcha' # gotcha | pattern | decision
status: 'active' # active | superseded
date: YYYY-MM-DD
---
```

## Writing good learnings

A learnings file should answer:

1. **What happened** — the symptom, in concrete terms
2. **Why it happened** — the root cause
3. **What fixed it** — the solution
4. **The rule** — one sentence that prevents it next time

Avoid vague titles like "Tailwind gotcha". Use "Tailwind v4 — `text-muted` class doesn't exist,
use `text-muted-foreground`". An agent should understand the learnings from the title alone.
