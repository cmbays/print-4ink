import { test, expect } from '@playwright/test'

test.describe('Job Board Journey', () => {
  test('navigates to job board', async ({ page }) => {
    await page.goto('/')
    await page.goto('/jobs')
    await expect(page).toHaveURL('/jobs')
  })

  test.skip('moves job through production stages', async () => {})
  test.skip('filters jobs by status', async () => {})
  test.skip('marks job as shipped', async () => {})
})
