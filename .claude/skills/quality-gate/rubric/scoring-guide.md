# Scoring Guide

## Result Levels

| Result | Meaning | Action |
|--------|---------|--------|
| **Pass** | Meets all criteria | No action needed |
| **Warn** | Minor issue, doesn't block | Log it, fix when convenient |
| **Fail** | Violates a requirement | Must fix before proceeding |

## Automatic Failures

These are always Fail regardless of other results:

- Build doesn't pass (`npm run build`)
- Type check fails (`npx tsc --noEmit`)
- Lint fails (`npm run lint`)
- No empty state designed when APP_FLOW specifies one
- Hardcoded hex/rgb colors in component code
- Non-Lucide icons used

## Verdict Rules

| Failures | Warnings | Verdict |
|----------|----------|---------|
| 0 | 0 | **Pass** — Ready for next step |
| 0 | 1+ | **Conditional Pass** — Proceed, address warnings when convenient |
| 1+ | any | **Fail** — Fix all failures before proceeding |

## Report Template

```markdown
## Quality Gate: [Screen Name]

**Route**: /path
**Date**: YYYY-MM-DD
**Files audited**: [list of files read]

### Results

| # | Category | Result | Notes |
|---|----------|--------|-------|
| 1 | Visual Hierarchy | | |
| 2 | Spacing & Layout | | |
| 3 | Typography | | |
| 4 | Color Usage | | |
| 5 | Interactive States | | |
| 6 | Icons | | |
| 7 | Motion & Animation | | |
| 8 | Empty & Error States | | |
| 9 | Accessibility | | |
| 10 | Jobs Filter | | |

### Build Checks

- [ ] `npx tsc --noEmit` — pass/fail
- [ ] `npm run lint` — pass/fail
- [ ] `npm run build` — pass/fail

### Failures (must fix)

1. [Category]: [issue] at `file:line` — [fix instruction]

### Warnings (optional)

1. [Category]: [issue] at `file:line` — [suggestion]

### Verdict: Pass / Conditional Pass / Fail
```
