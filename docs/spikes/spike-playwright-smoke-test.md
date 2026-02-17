# Spike: Playwright CI Smoke Test

## Context

PR #291 fixed a crash where `<Tooltip>` rendered without `<TooltipProvider>`. This class of bug (missing provider = runtime crash) is invisible to TypeScript and ESLint — only caught by actually rendering the page. A Playwright smoke test that navigates every route and asserts zero `console.error` calls would catch these before they reach production.

## Goal

Design a Playwright smoke test suite that:

1. Navigates every dashboard route
2. Asserts zero `console.error` calls on each page
3. Runs in CI after `npm run build`

## Route Discovery

Derive the route list from the `app/(dashboard)/` filesystem:

```bash
fd 'page.tsx' app/\(dashboard\) --type f | sed 's|app/\(dashboard\)/||;s|/page.tsx||;s|\[.*\]|:param|g' | sort
```

Expected routes (with mock params for dynamic segments):

| Route                                | Params                     |
| ------------------------------------ | -------------------------- |
| `/`                                  | —                          |
| `/jobs/board`                        | —                          |
| `/quotes`                            | —                          |
| `/quotes/new`                        | —                          |
| `/quotes/:id`                        | Use first mock quote ID    |
| `/garments`                          | —                          |
| `/customers`                         | —                          |
| `/invoices`                          | —                          |
| `/invoices/new`                      | —                          |
| `/settings/colors`                   | —                          |
| `/settings/pricing/screen-print`     | —                          |
| `/settings/pricing/screen-print/:id` | Use first mock template ID |

## Test Design

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

const routes = [
  '/',
  '/jobs/board',
  '/quotes',
  '/quotes/new',
  '/garments',
  '/customers',
  '/invoices',
  '/settings/colors',
  '/settings/pricing/screen-print',
]

for (const route of routes) {
  test(`${route} loads without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto(route)
    await page.waitForLoadState('networkidle')

    expect(errors).toEqual([])
  })
}
```

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
playwright:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: npm
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run build
    - run: npx playwright test e2e/smoke.spec.ts
      env:
        CI: true
```

## Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

## Prerequisites

- `@playwright/test` is already a devDependency (`^1.58.2`)
- No `playwright.config.ts` or `e2e/` directory exists yet
- No browser binaries installed (need `npx playwright install chromium`)

## Implementation Scope

This spike is design-only. Actual implementation (creating config, test files, CI job) is a separate PR.

## Recommendation

Start with the smoke test (zero-error assertion per route), then layer on:

1. Visual regression snapshots for key screens
2. Interaction tests for critical flows (create quote, drag kanban card)
3. Accessibility audits via `@axe-core/playwright`
