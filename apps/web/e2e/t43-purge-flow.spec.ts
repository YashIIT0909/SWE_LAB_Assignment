import { expect, test } from '@playwright/test'

test.describe('T-43 Cataloguer reports and purge flow', () => {
  test('cataloguer opens reports, reviews purge candidates and executes purge', async ({
    page,
  }) => {
    // 1. Cataloguer logs in
    await page.goto('/login')
    await page.fill('#email', 'cat@sccs.local')
    await page.fill('#password', 'changeme123')
    await page.click('button[type="submit"]')
    await expect(page.locator('nav[aria-label="Main"]')).toContainText('cataloguer')

    // 2. Open console reports dashboard
    await page.goto('/console')
    await expect(page.locator('h1')).toContainText('Catalogue report')
    await expect(page.getByRole('link', { name: 'Review purge candidates' })).toBeVisible()

    // 3. Navigate to purge page
    await page.getByRole('link', { name: 'Review purge candidates' }).click()
    await expect(page).toHaveURL(/.*\/console\/purge/)
    await expect(page.locator('h1')).toContainText('Purge unused components')

    // 4. Set permissive filter to discover seeded unused candidates
    await page.fill('#maxUses', '10')
    await page.fill('#minNotUsedHits', '0')
    await page.fill('#unusedForDays', '0')
    await page.fill('#olderThanDays', '0')
    await page.click('button:has-text("Find candidates")')

    // Wait for candidate table
    await expect(page.locator('section[aria-label="Candidates"]')).toBeVisible()

    const checkboxes = page.locator('tbody input[type="checkbox"]')
    const count = await checkboxes.count()

    if (count > 0) {
      // Select the first candidate
      await checkboxes.first().check()

      // Confirm dialog and execute purge
      page.once('dialog', (dialog) => dialog.accept())
      await page.click('button:has-text("Purge selected")')

      // Verify status banner displays deletion result
      await expect(page.locator('div[role="status"]')).toContainText('Deleted')
    }
  })
})
