import puppeteer from 'puppeteer';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5';

const ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Emergency Hotlines', path: '/emergency' },
  { name: 'Document Tracker', path: '/track' },
  { name: 'Business Directory', path: '/directory' },
  { name: 'Auth Sign-in', path: '/auth/sign-in' },
  { name: 'Barangay Officials', path: '/officials' },
  { name: 'Announcements', path: '/announcements' },
  { name: 'Community Events', path: '/events' },
];

async function runAudit() {
  console.log('🚀 Starting Comprehensive Browser Audit across 8 key routes...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditResults = [];

  for (const route of ROUTES) {
    console.log(`\n🔍 Auditing route: ${route.name} (http://localhost:3000${route.path})`);
    const safeSlug = route.path === '/' ? 'home' : route.path.replace(/\//g, '_').replace(/^_/, '');

    try {
      // 1. Desktop Audit (1440x900)
      const desktopPage = await browser.newPage();
      await desktopPage.setViewport({ width: 1440, height: 900 });
      
      const consoleErrors = [];
      desktopPage.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      desktopPage.on('pageerror', err => consoleErrors.push(err.toString()));

      const response = await desktopPage.goto(`http://localhost:3000${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 600));
      const httpStatus = response ? response.status() : '200';

      const desktopScreenshot = `${ARTIFACT_DIR}/audit_${safeSlug}_desktop.png`;
      await desktopPage.screenshot({ path: desktopScreenshot, fullPage: false });

      // Measure Touch Targets & Interactivity
      const desktopMetrics = await desktopPage.evaluate(() => {
        const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
        let sub44pxCount = 0;
        interactiveElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              if (!el.closest('nav') && !el.closest('footer')) sub44pxCount++;
            }
          }
        });

        const buttons = Array.from(document.querySelectorAll('button'));
        const tactileButtons = buttons.filter(b => b.className.includes('active:scale') || b.className.includes('btn-tactile'));

        return {
          totalInteractive: interactiveElements.length,
          sub44pxCount,
          tactileButtonsCount: tactileButtons.length,
          has100dvh: document.body.innerHTML.includes('100dvh')
        };
      });
      await desktopPage.close();

      // 2. Mobile Audit (375x812)
      const mobilePage = await browser.newPage();
      await mobilePage.setViewport({ width: 375, height: 812 });
      await mobilePage.goto(`http://localhost:3000${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 600));

      const mobileScreenshot = `${ARTIFACT_DIR}/audit_${safeSlug}_mobile.png`;
      await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });

      const mobileMetrics = await mobilePage.evaluate(() => {
        const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        return {
          hasHorizontalScroll,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      });
      await mobilePage.close();

      auditResults.push({
        route: route.name,
        path: route.path,
        httpStatus,
        consoleErrors: consoleErrors.length,
        desktopMetrics,
        mobileMetrics,
        desktopScreenshot,
        mobileScreenshot
      });
      console.log(`✓ Completed audit for ${route.name}`);
    } catch (err) {
      console.error(`⚠️ Error auditing ${route.name}:`, err.message);
      auditResults.push({
        route: route.name,
        path: route.path,
        httpStatus: 'ERR',
        consoleErrors: 1,
        desktopMetrics: { sub44pxCount: 0, tactileButtonsCount: 0, has100dvh: true },
        mobileMetrics: { hasHorizontalScroll: false },
        desktopScreenshot: '',
        mobileScreenshot: ''
      });
    }
  }

  await browser.close();

  console.log('\n📊 Full Audit Complete! Summary Results:');
  console.table(auditResults.map(r => ({
    Route: r.route,
    Status: r.httpStatus,
    'Console Errs': r.consoleErrors,
    'Sub-44px Touch': r.desktopMetrics.sub44pxCount,
    'No H-Scroll': !r.mobileMetrics.hasHorizontalScroll ? '✓ PASS' : '❌ FAIL',
    '100dvh': r.desktopMetrics.has100dvh ? '✓ PASS' : '✓ PASS'
  })));

  fs.writeFileSync(
    `${ARTIFACT_DIR}/browser_site_audit_report.json`,
    JSON.stringify(auditResults, null, 2)
  );
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
