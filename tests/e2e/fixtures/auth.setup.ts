import { test as setup } from '@playwright/test'

// Auth is only enforced in NODE_ENV === 'production' (see middleware.ts).
// In development and CI, all routes are open — no setup needed.
setup('auth setup (no-op in development)', async () => {
  // No-op: authentication is bypassed outside production
})
