# Market Collection — Agent Guide

> This file is for agents. Astro ignores `_`-prefixed files and will not load it as content.

## What belongs here

Intelligence about the **market landscape**: competitors, customers, and UX patterns observed in
peer products. This informs product decisions but is distinct from domain knowledge (which is about
physics and rules) and product docs (which are about our own choices).

**Good deposit candidates:**

- Competitor product walkthroughs and feature analysis
- Customer pain points and mental models from Gary interviews
- UX patterns observed in ShopVox, InkSoft, OrderMyGear, DecoNetwork, Printavo
- Pricing model comparisons across competitors
- Customer workflow observations from shop visits or demo sessions

**Does NOT belong here:**

- How we decided to solve a problem differently → `product/` or `strategy/`
- Domain rules about pricing → `domain/pricing/`
- Gary's specific feature requests → GitHub issues

## Subdirectory guide

| Subdir         | Contents                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `competitors/` | One file per competitor. Covers: product scope, pricing model, UX strengths/weaknesses, target customer   |
| `consumer/`    | Customer mental models, pain points, workflow observations. Covers the 4Ink operator persona deeply       |
| `ux-patterns/` | Patterns observed across peer tools — job board layouts, quoting flows, approval UX, status communication |

## Mutation model

**Living docs.** Market intelligence changes as competitors ship and customers evolve. When updating:

1. Read the existing file
2. Add new findings in the relevant section
3. Synthesize — don't append "UPDATE: new thing found on Feb 17"
4. Update `lastUpdated` in frontmatter

## Naming convention

```
{subdir}/{topic}.md

Examples:
  competitors/printavo.md
  competitors/shopvox.md
  consumer/shop-operator-mental-model.md
  ux-patterns/job-board-layouts.md
```

## Frontmatter template

```yaml
---
title: 'Topic Name'
type: 'analysis' # analysis | overview | patterns
status: 'current' # current | draft | deprecated
lastUpdated: YYYY-MM-DD
---
```
