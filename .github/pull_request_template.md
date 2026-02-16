## Summary

-

## Related Issues

Closes #

## Type

- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Tooling
- [ ] Docs

## Product/Tool

<!-- Which product(s) or tool(s) does this touch? Sync with config/products.json + config/tools.json -->

- [ ] Dashboard
- [ ] Quotes
- [ ] Customers
- [ ] Invoices
- [ ] Jobs
- [ ] Garments
- [ ] Screens
- [ ] Pricing
- [ ] Work Orchestrator
- [ ] Skills Framework
- [ ] Agent System
- [ ] Knowledge Base
- [ ] CI Pipeline
- [ ] PM System

## Screenshots

<!-- For UI changes: before/after screenshots or a short screen recording -->

## Test Plan

-

## Quality Checklist

### All PRs

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes

### UI Changes (skip if no visual changes)

<!-- Source: CLAUDE.md Quality Checklist -->

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
