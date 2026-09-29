import { expect, test } from '@playwright/test'

test.describe('T-42 Cataloguer component management lifecycle', () => {
  test('cataloguer logs in, creates a component with keywords, edits and deletes it', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const componentName = `E2E Component ${timestamp}`
    const updatedName = `${componentName} Updated`

    // 1. Cataloguer logs in
    await page.goto('/login')
    await page.fill('#email', 'cat@sccs.local')
    await page.fill('#password', 'changeme123')
    await page.click('button[type="submit"]')

    // Verify cataloguer nav
    await expect(page.locator('nav[aria-label="Main"]')).toContainText('cataloguer')
    await expect(page.locator('nav[aria-label="Main"]')).toContainText('Console')

    // 2. Navigate to new component form
    await page.goto('/console/components/new')
    await expect(page.locator('h1')).toContainText('New component')

    // 3. Fill and submit form
    await page.fill('#name', componentName)
    await page.fill('#description', 'A test component for end to end verification')
    await page.selectOption('#kind', 'DESIGN')

    // Select notation and category by index (index 1 is first non-placeholder option)
    await page.locator('#notationId option').nth(1).waitFor({ state: 'attached' })
    await page.selectOption('#notationId', { index: 1 })

    await page.locator('#categoryId option').nth(1).waitFor({ state: 'attached' })
    await page.selectOption('#categoryId', { index: 1 })

    // Add keywords
    const kwInput = page.locator('#keywords')
    await kwInput.fill('e2e-keyword')
    await kwInput.press('Enter')

    await page.click('button:has-text("Create component")')

    // 4. Redirects to detail page
    await expect(page).toHaveURL(/.*\/components\/.*/)
    await expect(page.locator('h1')).toContainText(componentName)

    // 5. Edit component
    await page.click('a:has-text("Edit")')
    await expect(page).toHaveURL(/.*\/console\/components\/.*/)
    await page.fill('#name', updatedName)
    await page.click('button:has-text("Save changes")')

    // Detail reflects updated name
    await expect(page).toHaveURL(/.*\/components\/.*/)
    await expect(page.locator('h1')).toContainText(updatedName)

    // 6. Delete component
    page.once('dialog', (dialog) => dialog.accept())
    await page.click('button:has-text("Delete")')

    // Redirects to browse page after deletion
    await expect(page).toHaveURL(/.*\/browse/)
  })
})
