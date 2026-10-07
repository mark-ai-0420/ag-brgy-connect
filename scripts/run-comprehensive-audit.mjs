import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/audit_screenshots';
const BASE_URL = 'http://localhost:3000';

const publicRoutes = [
  { group: 'public', name: 'homepage', path: '/' },
  { group: 'public', name: 'track', path: '/track' },
  { group: 'public', name: 'emergency', path: '/emergency' },
  { group: 'public', name: 'officials', path: '/officials' },
  { group: 'public', name: 'announcements', path: '/announcements' },
  { group: 'public', name: 'events', path: '/events' },
  { group: 'public', name: 'directory', path: '/directory' },
  { group: 'public', name: 'map', path: '/map' }
];

const residentRoutes = [
  { group: 'resident', name: 'resident_dashboard', path: '/dashboard' },
  { group: 'resident', name: 'resident_document_request', path: '/documents/request' },
  { group: 'resident', name: 'resident_complaints', path: '/complaints' },
  { group: 'resident', name: 'resident_profile', path: '/settings/profile' },
  { group: 'resident', name: 'resident_notifications', path: '/notifications' }
];

const adminRoutes = [
  { group: 'admin', name: 'admin_overview', path: '/admin' },
  { group: 'admin', name: 'admin_documents', path: '/admin/documents' },
  { group: 'admin', name: 'admin_complaints', path: '/admin/complaints' },
  { group: 'admin', name: 'admin_users', path: '/admin/users' },
  { group: 'admin', name: 'admin_businesses', path: '/admin/businesses' },
  { group: 'admin', name: 'admin_announcements', path: '/admin/announcements' },
  { group: 'admin', name: 'admin_events', path: '/admin/events' },
  { group: 'admin', name: 'admin_emergency', path: '/admin/emergency' },
  { group: 'admin', name: 'admin_barangays', path: '/admin/barangays' }
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 }
];

async function measureRoute(page, r, vp) {
  const consoleErrors = [];
  const failedRequests = [];

  const consoleListener = msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };
  const reqFailedListener = req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText || 'failed'}`);
  };

  page.on('console', consoleListener);
  page.on('requestfailed', reqFailedListener);

  console.log(`Auditing [${r.group}] ${r.name} (${r.path}) on ${vp.name}...`);
  let loadSuccess = true;
  let errorMsg = null;

  try {
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (err) {
    console.warn(`Timeout/Warning on ${r.path}:`, err.message);
    loadSuccess = false;
    errorMsg = err.message;
  }

  await page.waitForTimeout(1000);

  const overflowMetrics = await page.evaluate(() => {
    const docElem = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
    const clientWidth = Math.max(docElem.clientWidth, body.clientWidth);
    const innerWidth = window.innerWidth;
    const overflowX = scrollWidth > innerWidth ? scrollWidth - innerWidth : 0;

    const overflowingElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > innerWidth + 1) {
        overflowingElements.push({
          tag: el.tagName.toLowerCase(),
          className: el.className?.toString?.().slice(0, 50) || '',
          id: el.id || '',
          right: Math.round(rect.right),
          overflow: Math.round(rect.right - innerWidth)
        });
      }
    }

    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      overflowX,
      overflowingElements: overflowingElements.slice(0, 5)
    };
  });

  const screenshotFilename = `${r.name}_${vp.name}.png`;
  const screenshotPath = path.join(ARTIFACT_DIR, screenshotFilename);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  page.off('console', consoleListener);
  page.off('requestfailed', reqFailedListener);

  return {
    group: r.group,
    route: r.name,
    path: r.path,
    viewport: vp.name,
    width: vp.width,
    height: vp.height,
    loadSuccess,
    errorMsg,
    consoleErrors,
    failedRequests,
    overflowMetrics,
    screenshotFile: screenshotFilename,
    screenshotPath
  };
}

async function loginAs(context, email, password) {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  
  // Wait for redirect away from sign-in to confirm authentication succeeded
  await page.waitForURL((url) => !url.pathname.includes('/auth/sign-in'), { timeout: 10000 });
  console.log(`Successfully authenticated as ${email}. Landed on: ${page.url()}`);
  await page.close();
}

async function runComprehensiveAudit() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  for (const vp of viewports) {
    console.log(`\n=================== TESTING VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===================\n`);

    // 1. Audit Public Routes
    const publicContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    for (const r of publicRoutes) {
      const page = await publicContext.newPage();
      const res = await measureRoute(page, r, vp);
      allResults.push(res);
      await page.close();
    }
    await publicContext.close();

    // 2. Audit Resident Routes
    const residentContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    await loginAs(residentContext, 'juan.delacruz@gmail.com', 'Password123!');
    for (const r of residentRoutes) {
      const page = await residentContext.newPage();
      const res = await measureRoute(page, r, vp);
      allResults.push(res);
      await page.close();
    }
    await residentContext.close();

    // 3. Audit Admin Routes
    const adminContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    await loginAs(adminContext, 'admin_daine1@brgyconnect.app', 'Password123!');
    for (const r of adminRoutes) {
      const page = await adminContext.newPage();
      const res = await measureRoute(page, r, vp);
      allResults.push(res);
      await page.close();
    }
    await adminContext.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'comprehensive_audit_report.json'),
    JSON.stringify(allResults, null, 2)
  );

  console.log('\n✅ Comprehensive audit finished! Saved to comprehensive_audit_report.json');
}

runComprehensiveAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
