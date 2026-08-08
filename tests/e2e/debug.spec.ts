import { test, expect } from '@playwright/test';

test.describe('Debug Login text', () => {
  test('dump body text', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(3000);
    const text = await page.locator('body').innerText();
    console.log('BODY TEXT:', text);
  });
});
