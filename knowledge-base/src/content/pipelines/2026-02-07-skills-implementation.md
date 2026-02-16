---
title: "Skills Implementation"
subtitle: "Built two project-specific Claude Code skills -- screen-builder and quality-gate -- encoding design system, quality checklist, and domain knowledge into repeatable workflows for all 10 remaining screens."
date: 2026-02-07
phase: 1
pipeline: devx
pipelineType: horizontal
products: []
tools: [skills-framework]
stage: build
tags: [feature, build]
sessionId: "58358bf9-61aa-4451-a184-c3d91d1871bd"
branch: "main"
status: complete
---

## What Was Built

**2 skills, 20 files** in `.claude/skills/`. Skills are folders, not just markdown -- each contains a workflow (SKILL.md), templates, checklists, and reference docs.

### screen-builder

Build any of the 10 remaining screens with consistent design system, patterns, and quality. 5-step workflow: Preflight -> Template -> Build -> Verify -> Update.

8 files . 3 templates . 2 checklists . 2 ref docs

### quality-gate

Audit completed screens against 10 quality categories. Produces structured pass/warn/fail report with specific fix instructions and line references.

12 files . 10 checklists . 1 scoring rubric

## Directory Structure

### screen-builder

```
.claude/skills/screen-builder/
  SKILL.md -- 5-step workflow
  templates/
    data-table-screen.tsx -- list pages (Jobs, Quotes, Customers, etc.)
    detail-screen.tsx -- detail pages (Job, Quote, Customer)
    form-screen.tsx -- form pages (New Quote)
  checklists/
    quality-checklist.md -- 10-item quality pass/fail
    cross-link-checklist.md -- navigation verification
  reference/
    design-tokens-quick-ref.md -- colors, spacing, typography
    component-inventory.md -- what's available in components/
```

### quality-gate

```
.claude/skills/quality-gate/
  SKILL.md -- audit workflow
  checklists/
    visual-hierarchy.md
    spacing-layout.md
    typography.md
    color-usage.md
    interactive-states.md
    icons.md
    motion-animation.md
    empty-error-states.md
    accessibility.md
    jobs-filter.md
  rubric/
    scoring-guide.md -- pass/warn/fail criteria + report template
```

## The Insight

An X post argued that **skills are folders, not markdown files**. The SKILL.md is just the README -- the folder is the actual product. Inside: scripts for deterministic work, templates for consistent output, LLM instructions for creative/judgment work. The key insight is **deterministic + non-deterministic layering**:

| Layer | What Provides It | Example |
|-------|------------------|---------|
| Deterministic | Templates, checklists, reference docs | Quality checklist, screen templates, design tokens |
| Non-deterministic | AI judgment within constraints | Layout decisions, component composition, UX tradeoffs |
| Reproducible | Consistent directory structure | Same workflow, same quality gates, every time |

## What We Didn't Build

- **Domain context skill** -- CLAUDE.md + docs already provide rich domain context automatically
- **Workflow orchestration skill** -- the superpowers chain (brainstorming -> writing-plans -> executing-plans) already handles this
- **Generic frontend patterns** -- existing plugins cover this
- **Scripts** -- deferred to Phase 2 when real APIs exist. Phase 1 doesn't benefit from scripted automation.
- **continuous-learning** -- deferred. Requires Stop hook, adds complexity.

## Projected ROI

| Skill | Applies To | Estimated Impact |
|-------|------------|------------------|
| screen-builder | 9 remaining screens (Steps 2-10) | 30-50% time savings per screen via templates + preflight workflow |
| quality-gate | Every screen before marking done | 100% checklist coverage, fewer review cycles |

## Design Token Fix

CodeRabbit flagged `shadow-cyan-400` in template code as a hardcoded Tailwind palette color violating our design token guidelines. Replaced all occurrences with `shadow-action`.

| Approach | Pros | Cons |
|----------|------|------|
| `shadow-cyan-400` | Guaranteed Tailwind utility | Hardcoded -- won't update if action color changes. Violates our own "no colors outside design tokens" rule. |
| `shadow-action` | Semantic, future-proof, consistent with `text-action`/`bg-action` | None -- Tailwind v4 auto-generates `shadow-*` for any `--color-*` in `@theme inline` |

Fixed in 4 files: `FRONTEND_GUIDELINES.md`, `interactive-states.md`, `design-tokens-quick-ref.md`, `form-screen.tsx`. The root cause was FRONTEND_GUIDELINES.md -- all other files copied the pattern from there.

## Other Changes

| File | Change |
|------|--------|
| `CLAUDE.md` | Added "Project Skills" section documenting both skills |
| `progress.txt` | Added skills to "What's Built" and session log |
| `eslint.config.mjs` | Excluded `.claude/skills/**/templates/**` from linting (templates have intentional unused imports) |

## Verification

- **Pass** -- `npx tsc --noEmit`
- **Pass** -- `npm run lint` (0 errors, 0 warnings after ESLint exclusion)
- **Pass** -- `npm run build`

## Next Steps

- Build Step 1 (Shared Layout Polish) using `screen-builder` skill
- Run `quality-gate` on the completed screen
- Compare time/quality against Step 0 (built without skills)
- Iterate skill content based on findings
