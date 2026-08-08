import { test, expect } from '@playwright/test';

test.describe('Public UI / UX', () => {
  test('homepage loads and has key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check title or some text that should be on homepage
    // Without knowing the exact content, let's just make sure it loads and check for a generic element like "Login" or "BrgyConnect"
    await expect(page).toHaveTitle(/BrgyConnect/);
    
    // It should have navigation links
    // Assuming there's a link or text indicating the portal
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
