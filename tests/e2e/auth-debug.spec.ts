import { test, expect } from '@playwright/test';

test.describe('Resident & Admin Login', () => {
  test('Admin login and dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Wait for the form to be hydrated (button is enabled)
    const submitBtn = page.locator('form button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
    
    await page.fill('input[name="email"]', 'markhersonhuelgas@gmail.com');
    await page.fill('input[name="password"]', 'brgyconnectadmin');
    await submitBtn.click();
    
    await page.waitForURL('**/admin/businesses');
    const url = page.url();
    console.log('Admin logged in URL:', url);
  });
});
