# Tools Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

How **dev tools work in this specific project** — configuration patterns, project-specific gotchas,
and conventions that agents need when working with each tool. This is not generic tool documentation
(that lives in the tool's own docs). It's how we use the tool here.

**Good deposit candidates:**

- How Vitest is configured and what the test patterns look like
- How Astro content collections are structured and validated
- How the CI pipeline is configured and what it checks
- How git worktrees are used in this project
- How Drizzle will be set up in Phase 2 (once decided)
- How the `work` orchestrator commands work

**Does NOT belong here:**

- Generic Vitest or Astro documentation → read official docs
- Engineering gotchas (tool bugs, unexpected behavior) → `learnings/`
- Deployment strategy decisions → `strategy/`

## Mutation model

**Living docs.** Tool configuration evolves as we upgrade versions and add new tools. When updating:

1. Read the existing file
2. Update the relevant section
3. Synthesize — remove outdated content
4. Update `lastUpdated` in frontmatter

## Naming convention

```
{tool-name}.md

Examples:
  vitest.md
  astro-kb.md
  github-actions.md
  work-orchestrator.md
```

## Frontmatter template

```yaml
---
title: 'Tool Name — Project Usage Guide'
type: 'reference' # reference | overview | decisions
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```
