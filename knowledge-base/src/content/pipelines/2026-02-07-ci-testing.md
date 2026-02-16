---
title: "CI & Testing Setup"
subtitle: "GitHub Actions CI workflow, Vitest schema tests, and mock data UUID fix. Catches build/lint/type/test failures on every push and PR."
date: 2026-02-07
phase: 1
pipeline: meta
pipelineType: horizontal
products: []
tools: [knowledge-base]
stage: build
tags: [feature, build, learning]
sessionId: "29d21a39-94a9-4cb3-8ac1-bcc442a85d68"
branch: "infra/ci-testing-setup"
status: complete
---

## What Was Built

### GitHub Actions CI

Runs on every push/PR to `main`. Four sequential checks:

| Step | Command | Catches |
|------|---------|---------|
| Type check | `tsc --noEmit` | TypeScript errors |
| Lint | `eslint` | Code quality issues |
| Test | `vitest run` | Schema validation failures |
| Build | `next build` | Broken imports, bad JSX |

File: `.github/workflows/ci.yml`

### Vitest Schema Tests

66 tests across 6 test files:

| File | Tests | Validates |
|------|-------|-----------|
| garment.test.ts | 8 | Valid garment, empty strings, negative/fractional sizes |
| customer.test.ts | 6 | Valid customer, invalid UUID, invalid email |
| job.test.ts | 21 | All 6 production states, 4 priorities, print locations |
| quote.test.ts | 14 | All 4 statuses, line items, negative prices, datetime |
| screen.test.ts | 10 | All 3 burn statuses, mesh count, UUID validation |
| mock-data.test.ts | 7 | All mock data parses, referential integrity (FK links) |

Tests live in `lib/schemas/__tests__/`

---

## Bug Discovered & Fixed

**Bug: Mock Data UUIDs Invalid**

The schema tests immediately caught that **8 mock data UUIDs** were not RFC-4122 compliant. Zod v4 validates the full UUID format strictly:

- **Version byte** (3rd group): must start with `1-8`
- **Variant byte** (4th group): must start with `8`, `9`, `a`, or `b`

Hand-crafted UUIDs like `q1a2b3c4-...` and `s1a2b3c4-...` used non-hex characters (`q`, `s`) and invalid variant bytes (`0`, `1`, `2`, `3`). All 8 were fixed in `lib/mock-data.ts`.

This validates the decision to test schemas early -- these would have broken Phase 3 backend validation silently.

---

## Docs Updated

- `CLAUDE.md` -- Added `npm test` and `npm run test:watch` to Commands, Zod UUID lesson to Lessons Learned
- `docs/TECH_STACK.md` -- Added Testing section with Vitest entry
- `progress.txt` -- Added CI + Testing infrastructure and session log

---

## Decision Rationale

Phase 1 is a UI mockup -- testing strategy is intentionally minimal and targeted:

- **Schema tests now**: High ROI -- schemas carry forward to Phase 3 backend. 66 tests cost minutes to write.
- **E2E deferred**: UI changes heavily at each checkpoint. Writing Playwright tests now means rewriting after every review.
- **Component tests skipped**: The components ARE the deliverable and they're changing rapidly. Negative ROI.
- **No Claude Code hooks**: CI catches the same issues asynchronously. Hooks add friction during rapid prototyping.
