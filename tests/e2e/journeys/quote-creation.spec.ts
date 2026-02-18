import { test, expect } from '@playwright/test'

test.describe('Quote Creation Journey', () => {
  test('navigates to quotes page', async ({ page }) => {
    await page.goto('/')
    await page.goto('/quotes')
    await expect(page).toHaveURL('/quotes')
  })

  test.skip('creates a new quote with garment line items', async () => {})
  test.skip('calculates pricing correctly with quantity breaks', async () => {})
  test.skip('generates quote PDF', async () => {})
})
