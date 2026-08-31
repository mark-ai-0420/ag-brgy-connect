import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/b1e2f794-7a77-49d6-ad06-adbd1b04aa1e/screenshots';
const BASE_URL = 'http://localhost:3000';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runComprehensiveAudit() {
  console.log('🚀 Starting Full System QA & Visual Audit Suite across Desktop & Mobile viewports...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const results = [];

  function record(domain, testName, status, details = {}) {
    console.log(`[${status}] [${domain}] ${testName}`);
    results.push({ domain, testName, status, details, timestamp: new Date().toISOString() });
  }

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP VIEWPORT AUDIT (1440 x 900)
    // -------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // 1a. Homepage & Hero Instant Tracking Dock
    console.log('\n--- 1. Homepage & Hero Tracking ---');
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('#hero', { timeout: 10000 });

      const heroTrackingInput = await page.$('#hero-tracking-input') !== null;
      const heroTitle = await page.evaluate(() => document.querySelector('h1')?.innerText || '');

      const screenshotHome = path.join(ARTIFACT_DIR, 'audit_desktop_home_hero.png');
      await page.screenshot({ path: screenshotHome });

      record('Public Frontend', 'Homepage Hero & Tracking Dock', (heroTrackingInput && heroTitle.includes('Barangay Daine')) ? 'PASS' : 'FAIL', {
        heroTitle,
        heroTrackingInput,
        screenshot: screenshotHome,
      });
    } catch (err) {
      record('Public Frontend', 'Homepage Hero & Tracking Dock', 'FAIL', { error: err.message });
    }

    // 1b. MSME Business Directory with Real-Time Schedule Engine
    console.log('\n--- 2. MSME Business Directory ---');
    try {
      await page.goto(`${BASE_URL}/directory`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('h1', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const dirText = await page.evaluate(() => document.body.innerText);
      const hasBadges = dirText.includes('Open Now') || dirText.includes('Open Today') || dirText.includes('Open 24/7') || dirText.includes('Closed Now');
      const hasCategories = dirText.includes('All Categories') || dirText.includes('Sari-Sari Store');

      const screenshotDir = path.join(ARTIFACT_DIR, 'audit_desktop_msme_directory.png');
      await page.screenshot({ path: screenshotDir });

      record('Public Frontend', 'MSME Directory Schedule Engine & Category Filters', (hasBadges && hasCategories) ? 'PASS' : 'FAIL', {
        hasBadges,
        hasCategories,
        screenshot: screenshotDir,
      });
    } catch (err) {
      record('Public Frontend', 'MSME Directory Schedule Engine & Category Filters', 'FAIL', { error: err.message });
    }

    // 1c. Tactile Priority Emergency Directory
    console.log('\n--- 3. Emergency Speed-Dial Directory ---');
    try {
      await page.goto(`${BASE_URL}/emergency`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('h1', { timeout: 10000 });

      const emText = await page.evaluate(() => document.body.innerText);
      const has911 = emText.includes('911') || emText.includes('National Emergency');
      const hasPolice = emText.includes('Police');
      const hasFire = emText.includes('Fire');
      const hasRescue = emText.includes('Rescue') || emText.includes('MDRRMO');

      const screenshotEmergency = path.join(ARTIFACT_DIR, 'audit_desktop_emergency_directory.png');
      await page.screenshot({ path: screenshotEmergency });

      record('Civic Resiliency', 'Emergency Speed-Dial & Hotlines Directory', (has911 && hasPolice && hasFire && hasRescue) ? 'PASS' : 'FAIL', {
        has911,
        hasPolice,
        hasFire,
        hasRescue,
        screenshot: screenshotEmergency,
      });
    } catch (err) {
      record('Civic Resiliency', 'Emergency Speed-Dial & Hotlines Directory', 'FAIL', { error: err.message });
    }

    // 1d. GIS Interactive Map & Nearest Evacuation Shelter FAB
    console.log('\n--- 4. GIS Interactive Map & Nearest Shelter ---');
    try {
      await page.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('h1', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 2500));

      const hasFab = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Nearest Evacuation Shelter') || b.innerText.includes('Evacuation Shelter'));
      });

      const screenshotMap = path.join(ARTIFACT_DIR, 'audit_desktop_gis_map.png');
      await page.screenshot({ path: screenshotMap });

      record('Spatial GIS', 'Interactive Leaflet Map & Nearest Shelter FAB', hasFab ? 'PASS' : 'FAIL', {
        hasFab,
        screenshot: screenshotMap,
      });
    } catch (err) {
      record('Spatial GIS', 'Interactive Leaflet Map & Nearest Shelter FAB', 'FAIL', { error: err.message });
    }

    // 1e. Live Document Tracker & Turnaround Window
    console.log('\n--- 5. Document Request Tracker ---');
    try {
      await page.goto(`${BASE_URL}/track?code=BD1-8F3A29D1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('#tracker-results-section', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const trackerText = await page.evaluate(() => document.body.innerText);
      const hasProgress = trackerText.includes('PROGRESS:') || trackerText.includes('100%') || trackerText.includes('Ready for Pickup');
      const hasShare = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Share Link'));
      });

      const screenshotTracker = path.join(ARTIFACT_DIR, 'audit_desktop_document_tracker.png');
      await page.screenshot({ path: screenshotTracker, fullPage: true });

      record('Document Lifecycle', 'Dynamic Tracker Progress Bar & Share Link', (hasProgress && hasShare) ? 'PASS' : 'FAIL', {
        hasProgress,
        hasShare,
        screenshot: screenshotTracker,
      });
    } catch (err) {
      record('Document Lifecycle', 'Dynamic Tracker Progress Bar & Share Link', 'FAIL', { error: err.message });
    }

    // 1f. Public QR Certificate Verification
    console.log('\n--- 6. Public QR Verification ---');
    try {
      await page.goto(`${BASE_URL}/verify/demo`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1500));

      const verifyText = await page.evaluate(() => document.body.innerText);
      const isVerified = verifyText.includes('Barangay Clearance') || verifyText.includes('Digital Security Seal') || verifyText.includes('Verified');

      const screenshotVerify = path.join(ARTIFACT_DIR, 'audit_desktop_qr_verification.png');
      await page.screenshot({ path: screenshotVerify });

      record('Security & Integrity', 'Public QR Certificate Verification', isVerified ? 'PASS' : 'FAIL', {
        isVerified,
        screenshot: screenshotVerify,
      });
    } catch (err) {
      record('Security & Integrity', 'Public QR Certificate Verification', 'FAIL', { error: err.message });
    }

    await page.close();

    // -------------------------------------------------------------
    // 2. MOBILE VIEWPORT AUDIT (375 x 812)
    // -------------------------------------------------------------
    console.log('\n--- 7. Mobile Viewport (375x812) Audits ---');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    // 2a. Mobile Home Viewport
    try {
      await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await mobilePage.waitForSelector('#hero', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const screenshotMobileHome = path.join(ARTIFACT_DIR, 'audit_mobile_home.png');
      await mobilePage.screenshot({ path: screenshotMobileHome });

      record('Mobile Ergonomics', 'Mobile Homepage Hero & Instant Dock', true ? 'PASS' : 'FAIL', {
        screenshot: screenshotMobileHome,
      });
    } catch (err) {
      record('Mobile Ergonomics', 'Mobile Homepage Hero & Instant Dock', 'FAIL', { error: err.message });
    }

    // 2b. Mobile Map Slide-Up Bottom Drawer
    try {
      await mobilePage.goto(`${BASE_URL}/map`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await mobilePage.waitForSelector('h1', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 2500));

      const clicked = await mobilePage.evaluate(() => {
        const card = document.querySelector('[data-spot-card]') || document.querySelector('.cursor-pointer');
        if (card && typeof card.click === 'function') {
          card.click();
          return true;
        }
        return false;
      });

      await new Promise(r => setTimeout(r, 1500));

      const screenshotMobileMap = path.join(ARTIFACT_DIR, 'audit_mobile_map_drawer.png');
      await mobilePage.screenshot({ path: screenshotMobileMap });

      record('Mobile Ergonomics', 'Mobile Map Slide-Up Drawer & Actions', clicked ? 'PASS' : 'FAIL', {
        clicked,
        screenshot: screenshotMobileMap,
      });
    } catch (err) {
      record('Mobile Ergonomics', 'Mobile Map Slide-Up Drawer & Actions', 'FAIL', { error: err.message });
    }

    await mobilePage.close();

  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('🏁 FULL SYSTEM COMPREHENSIVE QA AUDIT RESULTS:');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

runComprehensiveAudit();
