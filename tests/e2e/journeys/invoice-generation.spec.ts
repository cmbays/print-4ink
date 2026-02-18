import { test, expect } from '@playwright/test'

test.describe('Invoice Generation Journey', () => {
  test('navigates to invoices page', async ({ page }) => {
    await page.goto('/')
    await page.goto('/invoices')
    await expect(page).toHaveURL('/invoices')
  })

  test.skip('generates invoice from completed job', async () => {})
  test.skip('invoice total matches quote total', async () => {})
  test.skip('sends invoice to customer', async () => {})
})
