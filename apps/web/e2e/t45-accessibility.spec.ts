import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('T-45 Accessibility and keyboard navigation', () => {
  const publicPaths = ['/', '/search', '/browse', '/login', '/register']

  for (const path of publicPaths) {
    test(`axe scan on ${path}`, async ({ page }) => {
      await page.goto(path)
      const results = await new AxeBuilder({ page }).analyze()
      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      )
      expect(criticalOrSerious).toEqual([])
    })
  }

  test('keyboard-only search flow', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[name="k"]')
    await searchInput.focus()
    await page.keyboard.type('parser')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/.*\/search\?k=parser/)
    await expect(page.locator('section[aria-label="Results"]')).toBeVisible()
  })
})
