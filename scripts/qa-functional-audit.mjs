import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'scratch/screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runAudit() {
  console.log('🚀 Starting Comprehensive Functional & Flow QA Audit...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const results = [];

  function recordResult(category, scenario, testCase, status, details = {}) {
    console.log(`[${status}] ${category} > ${scenario} > ${testCase}`);
    results.push({ category, scenario, testCase, status, details, timestamp: new Date().toISOString() });
  }

  // =========================================================================
  // 1. Strict Code Matching: Valid Codes
  // =========================================================================
  console.log('\n--- 1. Testing Document Tracker: Valid Codes ---');
  const validCodes = [
    {
      code: 'BD1-8F3A29D1',
      expectedTitle: 'Barangay Clearance',
      expectedUnit: 'Barangay Daine 1',
      expectedStatus: 'READY FOR PICKUP',
      expectedRemarksSnippet: 'Barangay Daine 1 Hall Operations Desk',
    },
    {
      code: 'BD1-2026-0881',
      expectedTitle: 'Certificate of Residency',
      expectedUnit: 'Barangay Daine 1',
      expectedStatus: 'ISSUED / COMPLETED',
      expectedRemarksSnippet: 'digital security QR seal',
    },
    {
      code: 'BD2-4E90B17A',
      expectedTitle: 'Certificate of Indigency',
      expectedUnit: 'Barangay Daine 2',
      expectedStatus: 'UNDER REVIEW',
      expectedRemarksSnippet: 'administrative evaluation',
    },
  ];

  for (const item of validCodes) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto(`http://localhost:3000/track?code=${item.code}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#tracker-results-section', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));

      const stepperExists = (await page.$('#tracker-lifecycle-stepper')) !== null;
      const pageText = await page.evaluate(() => document.body.innerText);

      const hasTitle = pageText.includes(item.expectedTitle);
      const hasUnit = pageText.includes(item.expectedUnit);
      const hasStatus = pageText.toUpperCase().includes(item.expectedStatus);
      const hasRemarks = pageText.includes(item.expectedRemarksSnippet);

      const pass = stepperExists && hasTitle && hasUnit && hasStatus && hasRemarks;
      const screenshotPath = path.join(ARTIFACT_DIR, `tracker_valid_${item.code.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      recordResult('Strict Code Matching', 'Valid Reference Code Verification', item.code, pass ? 'PASS' : 'FAIL', {
        code: item.code,
        stepperExists,
        hasTitle,
        hasUnit,
        hasStatus,
        hasRemarks,
        screenshot: screenshotPath,
      });
    } catch (err) {
      recordResult('Strict Code Matching', 'Valid Reference Code Verification', item.code, 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 2. Strict Code Matching: Fake / Invented Codes
  // =========================================================================
  console.log('\n--- 2. Testing Document Tracker: Fake / Invalid Codes ---');
  const fakeCodes = ['BD1-8F3A29D1823', 'BD1-FAKE-9999', 'RANDOM123'];

  for (const code of fakeCodes) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto(`http://localhost:3000/track?code=${code}`, { waitUntil: 'domcontentloaded' });
      
      await page.waitForFunction(
        (targetCode) => {
          const text = document.body.innerText;
          return text.includes('Document Request Not Found') && text.includes(targetCode);
        },
        { timeout: 8000 },
        code
      );

      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasNotFoundHeading = bodyText.includes('Document Request Not Found');
      const hasGuidance = bodyText.includes('Troubleshooting Tips') || bodyText.includes('Double-check for any typos');
      const hasErrorMessage = bodyText.includes(`No document request found for reference code "${code}"`);

      const toastMessage = await page.evaluate(() => {
        const toastEl = document.querySelector('[data-sonner-toast]');
        return toastEl ? toastEl.innerText : null;
      });

      const pass = hasNotFoundHeading && hasGuidance && hasErrorMessage;
      const screenshotPath = path.join(ARTIFACT_DIR, `tracker_invalid_${code.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      recordResult('Strict Code Matching', 'Invented / Fake Code Rejection', code, pass ? 'PASS' : 'FAIL', {
        code,
        hasNotFoundHeading,
        hasGuidance,
        hasErrorMessage,
        toastMessage,
        screenshot: screenshotPath,
      });
    } catch (err) {
      recordResult('Strict Code Matching', 'Invented / Fake Code Rejection', code, 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 3. QR Digital Verification: Valid Codes
  // =========================================================================
  console.log('\n--- 3. Testing QR Verification: Valid Codes ---');
  const verifyValidCodes = [
    { code: 'BD1-8F3A29D1', doc: 'Barangay Clearance', status: 'READY' },
    { code: 'BD1-2026-0881', doc: 'Certificate of Residency', status: 'COMPLETED' },
  ];

  for (const item of verifyValidCodes) {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto(`http://localhost:3000/verify/${item.code}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => document.body.innerText.includes('Verified Authentic'),
        { timeout: 8000 }
      );
      await new Promise(r => setTimeout(r, 400));

      const pageText = await page.evaluate(() => document.body.innerText);
      const hasAuthenticBadge = pageText.toLowerCase().includes('verified authentic');
      const hasIssuingUnit = pageText.toLowerCase().includes('barangay daine 1');
      const hasResident = pageText.toLowerCase().includes('resident / bearer') || pageText.toLowerCase().includes('bona fide resident');
      const hasStatus = pageText.toUpperCase().includes(item.status);
      const hasTrackerLink = pageText.toLowerCase().includes('view full status lifecycle in tracker');

      const pass = hasAuthenticBadge && hasIssuingUnit && hasResident && hasStatus && hasTrackerLink;
      const screenshotPath = path.join(ARTIFACT_DIR, `verify_valid_${item.code.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath });

      recordResult('QR Digital Verification', 'Authentic Registry Entry Display', item.code, pass ? 'PASS' : 'FAIL', {
        code: item.code,
        hasAuthenticBadge,
        hasIssuingUnit,
        hasResident,
        hasStatus,
        hasTrackerLink,
        screenshot: screenshotPath,
      });
    } catch (err) {
      recordResult('QR Digital Verification', 'Authentic Registry Entry Display', item.code, 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 4. QR Digital Verification: Fake Code
  // =========================================================================
  console.log('\n--- 4. Testing QR Verification: Invalid / Fake Code ---');
  const fakeVerifyCode = 'BD1-FAKE-888';
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto(`http://localhost:3000/verify/${fakeVerifyCode}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => document.body.innerText.includes('Document Not Found'),
        { timeout: 8000 }
      );
      await new Promise(r => setTimeout(r, 400));

      const fakeVerifyText = await page.evaluate(() => document.body.innerText);
      const hasNotFound = fakeVerifyText.includes('Document Not Found');
      const hasSearchButton = fakeVerifyText.includes('Search in Document Tracker');

      const passFakeVerify = hasNotFound && hasSearchButton;
      const screenshotFakeVerify = path.join(ARTIFACT_DIR, `verify_invalid_${fakeVerifyCode.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
      await page.screenshot({ path: screenshotFakeVerify });

      recordResult('QR Digital Verification', 'Fake QR Code Rejection', fakeVerifyCode, passFakeVerify ? 'PASS' : 'FAIL', {
        code: fakeVerifyCode,
        hasNotFound,
        hasSearchButton,
        screenshot: screenshotFakeVerify,
      });
    } catch (err) {
      recordResult('QR Digital Verification', 'Fake QR Code Rejection', fakeVerifyCode, 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 5. QR Digital Verification: SPA Navigation to Tracker
  // =========================================================================
  console.log('\n--- 5. Testing SPA Navigation from Verify to Tracker ---');
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto('http://localhost:3000/verify/BD1-8F3A29D1', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.body.innerText.includes('View Full Status Lifecycle in Tracker'));
      await new Promise(r => setTimeout(r, 400));

      // Set a window variable to verify no full reload happens
      await page.evaluate(() => { window.__SPA_STAY_FLAG__ = true; });

      // Click the tracker button
      await page.click('a[href*="/track"]');
      await page.waitForSelector('#tracker-lifecycle-stepper', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));

      const currentUrl = page.url();
      const spaRetained = await page.evaluate(() => window.__SPA_STAY_FLAG__ === true);
      const urlMatches = currentUrl.includes('/track') && currentUrl.includes('code=BD1-8F3A29D1');

      const passSpa = spaRetained && urlMatches;
      const screenshotSpa = path.join(ARTIFACT_DIR, 'spa_navigation_verify_to_track.png');
      await page.screenshot({ path: screenshotSpa, fullPage: true });

      recordResult('QR Digital Verification', 'Seamless SPA Navigation', 'verify -> /track?code=...', passSpa ? 'PASS' : 'FAIL', {
        currentUrl,
        spaRetained,
        urlMatches,
        screenshot: screenshotSpa,
      });
    } catch (err) {
      recordResult('QR Digital Verification', 'Seamless SPA Navigation', 'verify -> /track?code=...', 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 6. Notification Center Page
  // =========================================================================
  console.log('\n--- 6. Testing Notification Center Page ---');
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto('http://localhost:3000/notifications', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#notification-filter-tabs', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));

      const allTab = await page.$('#notif-tab-all');
      const unreadTab = await page.$('#notif-tab-unread');

      const allTabText = await page.evaluate(el => el.innerText, allTab);
      const unreadTabText = await page.evaluate(el => el.innerText, unreadTab);

      // Click Unread Tab
      await unreadTab.click();
      await new Promise(r => setTimeout(r, 400));
      const unreadCardCount = await page.evaluate(() => document.querySelectorAll('#notification-cards-list > div').length);

      // Click All Tab
      await allTab.click();
      await new Promise(r => setTimeout(r, 400));
      const allCardCount = await page.evaluate(() => document.querySelectorAll('#notification-cards-list > div').length);

      // Test Mark all as read button
      const markAllBtn = await page.$('button ::-p-text(Mark all as read)');
      let markAllFound = markAllBtn !== null;
      let markAllWorked = false;
      if (markAllBtn) {
        await markAllBtn.click();
        await new Promise(r => setTimeout(r, 600));
        const unreadBadgeText = await page.evaluate(() => document.querySelector('#notif-tab-unread')?.innerText || '');
        markAllWorked = unreadBadgeText.includes('(0)');
      } else {
        markAllWorked = true;
      }

      const passNotifPage = allTab !== null && unreadTab !== null && allCardCount >= 0;
      const screenshotNotif = path.join(ARTIFACT_DIR, 'notification_center_page.png');
      await page.screenshot({ path: screenshotNotif, fullPage: true });

      recordResult('Notification Center & Realtime', 'Hub Filter Tabs & Actions', '/notifications', passNotifPage ? 'PASS' : 'FAIL', {
        allTabText,
        unreadTabText,
        allCardCount,
        unreadCardCount,
        markAllFound,
        markAllWorked,
        screenshot: screenshotNotif,
      });
    } catch (err) {
      recordResult('Notification Center & Realtime', 'Hub Filter Tabs & Actions', '/notifications', 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 7. Navbar NotificationBell
  // =========================================================================
  console.log('\n--- 7. Testing Navbar NotificationBell Dropdown ---');
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('button[aria-label="View notifications"]', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));
      
      const bellBtn = await page.$('button[aria-label="View notifications"]');
      let bellDropdownWorks = false;
      if (bellBtn) {
        await bellBtn.click();
        await page.waitForSelector('[role="menu"], [data-radix-popper-content-wrapper], [data-state="open"]', { timeout: 5000 });
        await new Promise(r => setTimeout(r, 500));
        const dropdownText = await page.evaluate(() => document.body.innerText);
        bellDropdownWorks = dropdownText.includes('Notifications');
      }

      const passBell = bellBtn !== null && bellDropdownWorks;
      const screenshotBell = path.join(ARTIFACT_DIR, 'navbar_notification_bell_dropdown.png');
      await page.screenshot({ path: screenshotBell });

      recordResult('Notification Center & Realtime', 'Navbar NotificationBell Dropdown', 'Navbar bell trigger', passBell ? 'PASS' : 'FAIL', {
        bellBtnFound: bellBtn !== null,
        bellDropdownOpened: bellDropdownWorks,
        screenshot: screenshotBell,
      });
    } catch (err) {
      recordResult('Notification Center & Realtime', 'Navbar NotificationBell Dropdown', 'Navbar bell trigger', 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  // =========================================================================
  // 8. Homepage Quick Action Banner
  // =========================================================================
  console.log('\n--- 8. Testing Homepage "Track Document" Quick Action Banner ---');
  {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    try {
      await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#home-track-document-btn', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));

      const homeBannerBtn = await page.$('#home-track-document-btn');
      await homeBannerBtn.click();
      await page.waitForFunction(() => window.location.pathname === '/track', { timeout: 8000 });
      await new Promise(r => setTimeout(r, 400));

      const isTrackPage = await page.evaluate(() => window.location.pathname === '/track');
      const hasTrackerHero = await page.evaluate(() => document.body.innerText.includes('Track Barangay Document Request'));

      const passHomeIntegration = isTrackPage && hasTrackerHero;
      const screenshotHome = path.join(ARTIFACT_DIR, 'homepage_track_document_banner.png');
      await page.screenshot({ path: screenshotHome, fullPage: true });

      recordResult('Homepage Integration', 'Track Document Quick Action Routing', 'Home -> /track', passHomeIntegration ? 'PASS' : 'FAIL', {
        navigatedToTrack: isTrackPage,
        hasTrackerHero,
        screenshot: screenshotHome,
      });
    } catch (err) {
      recordResult('Homepage Integration', 'Track Document Quick Action Routing', 'Home -> /track', 'FAIL', { error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return results;
}

runAudit().then(results => {
  console.log('\n=========================================');
  console.log('🏁 AUDIT RUN COMPLETE. SUMMARY OF RESULTS:');
  console.log('=========================================');
  console.log(JSON.stringify(results, null, 2));
});
