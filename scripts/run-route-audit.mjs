import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5/audit_screenshots';
const BASE_URL = 'http://localhost:3000';

const routes = [
  { name: 'homepage', path: '/' },
  { name: 'track', path: '/track' },
  { name: 'emergency', path: '/emergency' },
  { name: 'officials', path: '/officials' },
  { name: 'announcements', path: '/announcements' },
  { name: 'events', path: '/events' },
  { name: 'directory', path: '/directory' },
  { name: 'map', path: '/map' }
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const auditResults = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });

    for (const r of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('requestfailed', request => {
        failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || 'failed'}`);
      });

      console.log(`Auditing ${r.name} (${r.path}) on ${vp.name}...`);
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

      // Check overflow
      const overflowMetrics = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
        const clientWidth = Math.max(docElem.clientWidth, body.clientWidth);
        const innerWidth = window.innerWidth;
        const overflowX = scrollWidth > innerWidth ? scrollWidth - innerWidth : 0;

        // Elements exceeding viewport
        const overflowingElements = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > innerWidth + 1) { // tolerance of 1px
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

      // Screenshot
      const screenshotFilename = `${r.name}_${vp.name}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      auditResults.push({
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
      });

      await page.close();
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'audit_report.json'),
    JSON.stringify(auditResults, null, 2)
  );

  console.log('Audit completed successfully. Report saved.');
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
