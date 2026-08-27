import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'scratch/screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runMajorUiAudit() {
  console.log('🚀 Starting Deep QA Audit for the 3 Major UI/UX Milestones...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const results = [];

  function recordResult(milestone, feature, testCase, status, details = {}) {
    console.log(`[${status}] [${milestone}] ${feature} > ${testCase}`);
    results.push({ milestone, feature, testCase, status, details, timestamp: new Date().toISOString() });
  }

  try {
    // =======================================================================
    // MILESTONE 1: Navigation & Hero Elevation
    // =======================================================================
    console.log('\n--- MILESTONE 1: Navigation & Hero Elevation ---');
    
    // 1a. Hero Instant Tracking Dock on Homepage
    const pageHero = await browser.newPage();
    try {
      await pageHero.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageHero.waitForSelector('#hero-tracking-input', { timeout: 10000 });

      const trackingInputExists = await pageHero.$('#hero-tracking-input') !== null;
      const trackBtnExists = await pageHero.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Track Document'));
      });
      
      // Type a sample code and capture screenshot
      await pageHero.type('#hero-tracking-input', 'BD1-8F3A29D1');
      await new Promise(r => setTimeout(r, 500));

      const screenshotHero = path.join(ARTIFACT_DIR, 'milestone1_hero_tracking_dock.png');
      await pageHero.screenshot({ path: screenshotHero });

      recordResult('Milestone 1', 'Hero Tracking Dock', 'Homepage Instant Tracking Form', (trackingInputExists && trackBtnExists) ? 'PASS' : 'FAIL', {
        trackingInputExists,
        trackBtnExists,
        screenshot: screenshotHero,
      });
    } catch (err) {
      recordResult('Milestone 1', 'Hero Tracking Dock', 'Homepage Instant Tracking Form', 'FAIL', { error: err.message });
    } finally {
      await pageHero.close();
    }

    // =======================================================================
    // MILESTONE 2: MSME Directory, Citizen Dashboard & Emergency Speed-Dial
    // =======================================================================
    console.log('\n--- MILESTONE 2: MSME Directory, Citizen Dashboard & Emergency ---');

    // 2a. MSME Business Directory with Real-Time Schedule Engine
    const pageDir = await browser.newPage();
    try {
      await pageDir.goto(`${BASE_URL}/directory`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageDir.waitForSelector('h1', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const dirText = await pageDir.evaluate(() => document.body.innerText);
      const hasOpenBadges = dirText.includes('Open Now') || dirText.includes('Open Today') || dirText.includes('Open 24/7') || dirText.includes('Closed Now');
      const hasCategories = dirText.includes('All Categories') || dirText.includes('Sari-Sari Store') || dirText.includes('Eatery');

      const screenshotDir = path.join(ARTIFACT_DIR, 'milestone2_msme_directory_schedule_badges.png');
      await pageDir.screenshot({ path: screenshotDir, fullPage: false });

      recordResult('Milestone 2', 'MSME Directory', 'Real-Time Open/Closed Schedule Engine & Category Chips', (hasOpenBadges && hasCategories) ? 'PASS' : 'FAIL', {
        hasOpenBadges,
        hasCategories,
        screenshot: screenshotDir,
      });
    } catch (err) {
      recordResult('Milestone 2', 'MSME Directory', 'Real-Time Open/Closed Schedule Engine & Category Chips', 'FAIL', { error: err.message });
    } finally {
      await pageDir.close();
    }

    // 2b. Tactile Emergency Speed-Dial Grid
    const pageEmergency = await browser.newPage();
    try {
      await pageEmergency.goto(`${BASE_URL}/emergency`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageEmergency.waitForSelector('h1', { timeout: 10000 });

      const emText = await pageEmergency.evaluate(() => document.body.innerText);
      const hasNational = emText.includes('National Emergency') && emText.includes('911');
      const hasPolice = emText.includes('PNP Indang Police') && emText.includes('(046) 415-0211');
      const hasFire = emText.includes('BFP Indang Fire') && emText.includes('(046) 415-0322');
      const hasRescue = emText.includes('MDRRMO Rescue') && emText.includes('0998-555-0100');

      const passSpeedDial = hasNational && hasPolice && hasFire && hasRescue;
      const screenshotSpeedDial = path.join(ARTIFACT_DIR, 'milestone2_emergency_speed_dial_grid.png');
      await pageEmergency.screenshot({ path: screenshotSpeedDial });

      recordResult('Milestone 2', 'Emergency Speed-Dial', 'Tactile 4-Card Speed-Dial Grid (911/Police/Fire/MDRRMO)', passSpeedDial ? 'PASS' : 'FAIL', {
        hasNational,
        hasPolice,
        hasFire,
        hasRescue,
        screenshot: screenshotSpeedDial,
      });
    } catch (err) {
      recordResult('Milestone 2', 'Emergency Speed-Dial', 'Tactile 4-Card Speed-Dial Grid', 'FAIL', { error: err.message });
    } finally {
      await pageEmergency.close();
    }

    // =======================================================================
    // MILESTONE 3: Spatial GIS Map & Document Tracker Transparency
    // =======================================================================
    console.log('\n--- MILESTONE 3: Spatial GIS Map & Document Tracker Transparency ---');

    // 3a. GIS Map Floating "Nearest Evacuation Shelter" FAB Button
    const pageMap = await browser.newPage();
    try {
      await pageMap.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2', timeout: 25000 });
      await pageMap.waitForSelector('.leaflet-container', { timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));

      const fabBtn = await pageMap.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const found = btns.find(b => b.innerText.includes('Nearest Evacuation Shelter') || b.innerText.includes('Evacuation Shelter'));
        return found !== undefined;
      });

      const screenshotMap = path.join(ARTIFACT_DIR, 'milestone3_gis_map_nearest_shelter_fab.png');
      await pageMap.screenshot({ path: screenshotMap });

      recordResult('Milestone 3', 'GIS Map Nearest Shelter', 'Floating "Nearest Evacuation Shelter" FAB', fabBtn ? 'PASS' : 'FAIL', {
        fabBtn,
        screenshot: screenshotMap,
      });
    } catch (err) {
      recordResult('Milestone 3', 'GIS Map Nearest Shelter', 'Floating "Nearest Evacuation Shelter" FAB', 'FAIL', { error: err.message });
    } finally {
      await pageMap.close();
    }

    // 3b. Document Tracker Progress Bar, Turnaround Estimator & 1-Tap Share Link
    const pageTracker = await browser.newPage();
    try {
      await pageTracker.goto(`${BASE_URL}/track?code=BD1-8F3A29D1`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageTracker.waitForSelector('#tracker-results-section', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));

      const trackerText = await pageTracker.evaluate(() => document.body.innerText);
      const hasProgressBar = trackerText.includes('PROGRESS:') && (trackerText.includes('100%') || trackerText.includes('75%'));
      const hasTurnaround = trackerText.includes('Official Document is Certified') || trackerText.includes('Ready for Hall Pickup') || trackerText.includes('Turnaround');
      const hasShareBtn = await pageTracker.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Share Link'));
      });

      const passTracker = hasProgressBar && hasTurnaround && hasShareBtn;
      const screenshotTracker = path.join(ARTIFACT_DIR, 'milestone3_tracker_progress_bar_turnaround.png');
      await pageTracker.screenshot({ path: screenshotTracker, fullPage: true });

      recordResult('Milestone 3', 'Document Tracker Transparency', 'Dynamic Progress Bar, Turnaround Estimator & Share Link', passTracker ? 'PASS' : 'FAIL', {
        hasProgressBar,
        hasTurnaround,
        hasShareBtn,
        screenshot: screenshotTracker,
      });
    } catch (err) {
      recordResult('Milestone 3', 'Document Tracker Transparency', 'Dynamic Progress Bar, Turnaround Estimator & Share Link', 'FAIL', { error: err.message });
    } finally {
      await pageTracker.close();
    }

    // 3c. Mobile GIS Map Slide-Up Bottom Drawer
    const pageMobileMap = await browser.newPage();
    try {
      await pageMobileMap.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      await pageMobileMap.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2', timeout: 25000 });
      await pageMobileMap.waitForSelector('.leaflet-container', { timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));

      const clickedCard = await pageMobileMap.evaluate(() => {
        const card = document.querySelector('[data-spot-card]') || document.querySelector('.cursor-pointer');
        if (card && typeof card.click === 'function') {
          card.click();
          return true;
        }
        return false;
      });

      await new Promise(r => setTimeout(r, 1500));

      const screenshotMobileMap = path.join(ARTIFACT_DIR, 'milestone3_mobile_map_bottom_drawer.png');
      await pageMobileMap.screenshot({ path: screenshotMobileMap });

      recordResult('Milestone 3', 'Mobile Spatial UX', 'Mobile Slide-Up Facility Drawer', clickedCard ? 'PASS' : 'FAIL', {
        clickedCard,
        screenshot: screenshotMobileMap,
      });
    } catch (err) {
      recordResult('Milestone 3', 'Mobile Spatial UX', 'Mobile Slide-Up Facility Drawer', 'FAIL', { error: err.message });
    } finally {
      await pageMobileMap.close();
    }

  } finally {
    await browser.close();
  }

  console.log('\n=========================================');
  console.log('🏁 MAJOR UI/UX MILESTONES QA AUDIT COMPLETE:');
  console.log('=========================================');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

runMajorUiAudit();
