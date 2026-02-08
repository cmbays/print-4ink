# quality-gate

Audit a completed screen against the quality checklist. Produces a structured pass/fail report.

## Trigger

Use after completing a screen, before marking an IMPLEMENTATION_PLAN step done, or before user review checkpoints.

## Workflow

### 1. Identify Target

Determine what to audit:
- Read the screen's page file(s): `app/(dashboard)/<route>/page.tsx`
- Read all components imported by the page (both `components/features/` and `components/ui/`)
- Read the APP_FLOW entry for this route

### 2. Run Audit

Evaluate the screen against each checklist in `.claude/skills/quality-gate/checklists/`. For each category:

1. Read the checklist file
2. Examine the actual code against each criterion
3. Record: **Pass**, **Warn** (minor issue, optional fix), or **Fail** (must fix)
4. For Warn/Fail: note the specific file, line number, and what needs to change

Audit categories (10 total):

| # | Category | Checklist file |
|---|----------|----------------|
| 1 | Visual Hierarchy | `visual-hierarchy.md` |
| 2 | Spacing & Layout | `spacing-layout.md` |
| 3 | Typography | `typography.md` |
| 4 | Color Usage | `color-usage.md` |
| 5 | Interactive States | `interactive-states.md` |
| 6 | Icons | `icons.md` |
| 7 | Motion & Animation | `motion-animation.md` |
| 8 | Empty & Error States | `empty-error-states.md` |
| 9 | Accessibility | `accessibility.md` |
| 10 | Jobs Filter (Density) | `jobs-filter.md` |

### 3. Run Build Checks

```bash
npx tsc --noEmit    # Must pass
npm run lint        # Must pass
npm run build       # Must pass
```

Any build failure = automatic Fail.

### 4. Output Report

Use the template from `.claude/skills/quality-gate/rubric/scoring-guide.md`:

```markdown
## Quality Gate: [Screen Name]

**Route**: /path
**Date**: YYYY-MM-DD
**Files audited**: [list]

### Results

| # | Category | Result | Notes |
|---|----------|--------|-------|
| 1 | Visual Hierarchy | Pass/Warn/Fail | ... |
| 2 | Spacing & Layout | Pass/Warn/Fail | ... |
| ... | ... | ... | ... |

### Failures (must fix)

- [specific issue + file:line + fix instruction]

### Warnings (optional)

- [specific issue + file:line + suggested improvement]

### Verdict

- **Pass** (0 failures): Ready for next step
- **Conditional Pass** (0 failures, has warnings): Proceed, address warnings when convenient
- **Fail** (1+ failures): Fix all failures before proceeding
```

### 5. Enforce

- **Fail** items must be fixed before the step is marked complete in IMPLEMENTATION_PLAN
- **Warn** items are logged but don't block progress
- After fixing failures, re-run the audit on the fixed items only
