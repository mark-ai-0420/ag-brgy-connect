import { test, expect } from '@playwright/test';

test.describe('Pluggable Multi-Tenant Barangay Architecture', () => {
  test('Navbar renders tenant switcher and switches barangay cookie', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify page loads with default barangay
    await expect(page.locator('body')).toBeVisible();

    // Check cookies initially
    const initialCookies = await context.cookies();
    console.log('Initial cookies count:', initialCookies.length);

    // Look for barangay selector / switcher in navigation
    const switcher = page.locator('button[aria-label*="Select Barangay View"]').first();
    await expect(switcher).toBeVisible();
    await switcher.click();

    // Verify dropdown options exist
    const daine2Option = page.locator('button:has-text("Barangay Daine 2")').first();
    await expect(daine2Option).toBeVisible();
    await daine2Option.click();
    await page.waitForTimeout(1000);

    // Check if cookie was set
    const updatedCookies = await context.cookies();
    const tenantCookie = updatedCookies.find((c) => c.name === 'brgy_tenant_slug');
    console.log('Tenant cookie after switch:', tenantCookie?.value);
    expect(tenantCookie?.value).toBe('daine-2');
  });

  test('Locate Me GPS detection selects closest barangay', async ({ page, context }) => {
    // Grant geolocation permissions and mock coordinates near Daine 2 (lat: 14.197, lng: 120.886)
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 14.1971, longitude: 120.8862 });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Open barangay dropdown
    const switcher = page.locator('button[aria-label*="Select Barangay View"]').first();
    await expect(switcher).toBeVisible();
    await switcher.click();

    // Click Locate Me
    const locateBtn = page.locator('button:has-text("Locate Me (GPS)")').first();
    await expect(locateBtn).toBeVisible();
    await locateBtn.click();

    // Verify toast or cookie switch
    await page.waitForTimeout(1500);
    const updatedCookies = await context.cookies();
    const tenantCookie = updatedCookies.find((c) => c.name === 'brgy_tenant_slug');
    expect(tenantCookie?.value).toBe('daine-2');
  });
});

