import { test, expect } from '@playwright/test';

test.describe('Resident & Admin Login', () => {
  test('Admin login and dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Attempt to login using the provided credentials
    await page.fill('input[type="email"], input[name="email"]', 'markhersonhuelgas@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'brgyconnectadmin');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for URL to change or dashboard to load
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log('Admin logged in URL:', url);
    
    const bodyText = await page.locator('body').innerText();
    console.log('Admin Dashboard text snippet:', bodyText.substring(0, 150));
  });

  test('Resident login and document request', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Attempt to login
    await page.fill('input[type="email"], input[name="email"]', 'markai0420@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'resident');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForTimeout(3000);
    console.log('Resident logged in URL:', page.url());
    
    // Navigate to documents
    await page.goto('/documents');
    await page.waitForTimeout(2000);
    const docText = await page.locator('body').innerText();
    console.log('Documents page text:', docText.substring(0, 150));
  });
});
