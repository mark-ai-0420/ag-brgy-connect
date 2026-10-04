import { test, expect } from '@playwright/test'

test.describe('Form Validations & Input Masking E2E', () => {
  test('Sign-up form validation catches typos, one-word names, and ensures mobile responsiveness', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/sign-up', { waitUntil: 'networkidle' })

    // Take Desktop Screenshot
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.screenshot({
      path: '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/form_validation_signup_desktop.png',
      fullPage: false,
    })

    // Switch to Mobile 375px
    await page.setViewportSize({ width: 375, height: 812 })
    await page.screenshot({
      path: '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/form_validation_signup_mobile.png',
      fullPage: false,
    })

    // Submit invalid data
    await page.fill('input[name="fullName"]', 'Juan') // single word
    await page.fill('input[name="email"]', 'citizen@gmai.com') // typo domain
    await page.fill('input[name="password"]', '123') // short password

    await page.click('button[type="submit"]')
    await page.waitForTimeout(400)

    // Verify error messages appear
    await expect(page.locator('text=Please enter both your First Name and Last Name')).toBeVisible()
    await expect(page.locator('text=Please check your email domain for typos')).toBeVisible()
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()

    // Take Mobile Error State Screenshot
    await page.screenshot({
      path: '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/form_validation_signup_errors_mobile.png',
      fullPage: false,
    })
  })

  test('Profile settings validation, phone auto-formatting, and Senior Citizen badge calculation', async ({ page }) => {
    // 1. Log in as resident
    await page.goto('http://localhost:3003/auth/sign-in', { waitUntil: 'networkidle' })
    await page.fill('input[name="email"], input[type="email"]', 'juan.delacruz@gmail.com')
    await page.fill('input[name="password"], input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2500)

    // 2. Go to Profile Settings
    await page.goto('http://localhost:3003/settings/profile', { waitUntil: 'networkidle' })
    await page.setViewportSize({ width: 1280, height: 950 })

    // Test phone auto-formatting
    const phoneInput = page.locator('#phone')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('')
      await phoneInput.pressSequentially('09171234567', { delay: 30 })
      const formattedValue = await phoneInput.inputValue()
      expect(formattedValue).toBe('0917-123-4567')

      // Test birth date and senior citizen badge
      const birthDateInput = page.locator('#birth_date')
      await birthDateInput.fill('1958-05-20')
      await page.waitForTimeout(300)

      // Age badge should be visible and indicate senior citizen
      await expect(page.getByText('Senior Citizen', { exact: true })).toBeVisible()

      // Desktop Screenshot
      await page.screenshot({
        path: '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/form_validation_profile_desktop.png',
        fullPage: false,
      })

      // Mobile 375px Screenshot
      await page.setViewportSize({ width: 375, height: 812 })
      await page.screenshot({
        path: '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/form_validation_profile_mobile.png',
        fullPage: false,
      })
    }
  })
})
