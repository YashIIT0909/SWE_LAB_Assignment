import { expect, test } from '@playwright/test'

test.describe('T-41 End-to-end browse, search and use journey', () => {
  test('user registers, browses categories, searches by keyword and uses component', async ({
    page,
  }) => {
    const timestamp = Date.now()
    const email = `user_${timestamp}@example.com`
    const name = `Test User ${timestamp}`

    // 1. User registers
    await page.goto('/register')
    await page.fill('#name', name)
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')

    // Verify logged in
    await expect(page.locator('nav[aria-label="Main"]')).toContainText(name)

    // 2. Browse category tree
    await page.goto('/browse')
    await expect(page.locator('aside[aria-label="Categories"]')).toBeVisible()
    const categoryLink = page.locator('aside[aria-label="Categories"] a').first()
    await expect(categoryLink).toBeVisible()
    await categoryLink.click()
    await expect(page.locator('section[aria-label="Components"]')).toBeVisible()

    // 3. Search by keyword
    await page.goto('/search')
    const kwInput = page.locator('#search-keywords')
    await kwInput.fill('parser')
    await kwInput.press('Enter')
    await page.click('button:has-text("Search")')

    // Verify search results
    await expect(page.locator('section[aria-label="Results"]')).toBeVisible()
    const resultsHeading = page.locator('h2[role="status"]')
    await expect(resultsHeading).toContainText('found')

    // 4. Open result and mark as used (Screen 1: Search -> Screen 2: Detail -> Use <= 3 screens)
    const firstResultLink = page.locator('section[aria-label="Results"] a').first()
    await firstResultLink.click()
    await expect(page).toHaveURL(/.*\/components\/.*/)

    // Mark as used
    const useButton = page.locator('button:has-text("Use this component")')
    await expect(useButton).toBeVisible()
    await useButton.click()

    // Verify feedback and counter increment
    await expect(page.locator('span[role="status"]')).toContainText('Marked as used')
  })
})
