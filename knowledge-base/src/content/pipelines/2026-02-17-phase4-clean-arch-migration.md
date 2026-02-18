---
title: 'Phase 4 Clean Architecture Migration'
subtitle: 'Feature layer, config/tools split, alias switch, ESLint boundaries'
date: 2026-02-17
phase: 1
pipelineName: 'Clean Architecture Epic'
pipelineType: horizontal
products: []
tools: ['ci-pipeline']
domains: ['garments', 'pricing']
stage: wrap-up
tags: [build, decision]
sessionId: 'f18cd13d-4390-4d6f-bf05-51aa8502fdf6'
branch: 'session/0217-phase4-clean-arch'
status: complete
---

## What Shipped

**PR #439 — Phase 4 Clean Architecture Migration** (branch `session/0217-phase4-clean-arch`)

Epic: PRI-254 / Issue: PRI-259

Completed 9 tasks that fully restructure the codebase into a 5-layer clean architecture:

| Task | Description                      | Outcome                                                                          |
| ---- | -------------------------------- | -------------------------------------------------------------------------------- |
| 4.4  | Move mock data                   | `src/infrastructure/repositories/_providers/mock/`                               |
| 4.3  | Move review engine               | `tools/orchestration/review/`                                                    |
| 4.2  | Split config directories         | `src/config/` (runtime) + `tools/orchestration/config/` (dev tooling)            |
| 4.1  | Distribute 36 feature components | `src/shared/ui/organisms/` (13) + `src/features/{domain}/components/` (23)       |
| 6    | Cleanup lib/ remnants            | `lib/constants/`, `lib/helpers/`, `lib/hooks/` → `src/`                          |
| 4.5  | Switch `@/*` alias               | `./` → `./src/` in tsconfig.json + vitest.config.ts                              |
| 4.6  | Add ESLint boundaries            | `import/no-restricted-paths` zones enforced at lint time                         |
| 4.7  | Delete old empty dirs            | `components/`, `config/`, `lib/constants/`, `lib/helpers/`, `lib/hooks/` removed |
| 4.8  | Update docs                      | CLAUDE.md Architecture section + docs/ARCHITECTURE.md updated                    |

## Architecture After Phase 4

```
src/
  app/             # Next.js thin shell
  domain/          # Pure business logic (entities, rules, ports)
  infrastructure/  # Repositories + providers + bootstrap
  features/        # Vertical slices (components/ + hooks/ per domain)
  shared/          # Cross-cutting (ui/organisms/, ui/primitives/, lib/, constants/)
  config/          # Runtime config (products.json, domains.json)
tools/orchestration/  # Dev tooling (review engine, pipeline config)
```

## Key Decisions

### Component Placement Rule

Components with 3+ consumers across multiple feature domains → `src/shared/ui/organisms/`.
Components with 1–2 consumers in a single domain → `src/features/{domain}/components/`.

Organisms moved: MoneyAmount (10 consumers), StatusBadge (5), MobileFilterSheet (4), LifecycleBadge (4), ColumnHeaderMenu (4), TypeTagBadges (3), and 7 more.

### ESLint Boundary Violations Caught and Fixed

The new `import/no-restricted-paths` rules immediately caught 2 real violations:

1. **GarmentImage** was in `src/features/garments/components/` but imported by GarmentMiniCard (shared). Moved to `src/shared/ui/organisms/GarmentImage.tsx`.
2. **ColorSwatchPicker** imported `getColorsMutable` from `@infra/repositories/colors`. Fixed by deriving `effectiveFavorites` from the `colors` prop: `colors.filter((c) => c.isFavorite === true).map((c) => c.id)`. The infra call was dead code — all consumers already passed colors explicitly.

### Alias Switch Safety

Fixed 4 pre-existing `@/src/app/` double-prefixed imports before switching `@/*` from `./` to `./src/`. Without fixing these first, the alias switch would have broken them silently.

### ESLint Flat Config Plugin Scoping

In ESLint v9 flat config, the correct way to restrict path rules to non-test files is via `files` + `ignores` on the same config block that registers the plugin. Adding `'import/no-restricted-paths': 'off'` in a separate override block without re-registering the plugin doesn't properly disable the rule.

### lib/suppliers Deferred

`lib/suppliers/` (8 TS + 4 test files — supplier registry, rate validation, adapter layer) was excluded from this PR. Too much cross-cutting complexity to safely restructure without a dedicated spike. Deferred to a follow-up issue.

## CI Results at PR Time

- `npx tsc --noEmit` — 0 errors
- `npm run lint` — 0 errors, 9 pre-existing warnings
- `npm test` — 52 test files, 1084 tests, all passing
- `npm run build` — clean

## Related Issues Closed

- PRI-268 ("fix: resolve @/src/app/ bridge imports") — completed as part of Task 4.5 → marked Done
