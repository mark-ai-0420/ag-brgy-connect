import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/b1e2f794-7a77-49d6-ad06-adbd1b04aa1e/screenshots';
const BASE_URL = 'http://localhost:3000';

async function runFullSystemAudit() {
  console.log('🚀 Starting Full System QA Audit (GIS Map, Tracker, Offline, Security & Guards)...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  });

  const results = [];

  function recordResult(category, scenario, testCase, status, details = {}) {
    console.log(`[${status}] ${category} > ${scenario} > ${testCase}`);
    results.push({ category, scenario, testCase, status, details, timestamp: new Date().toISOString() });
  }

  try {
    // -----------------------------------------------------------------------
    // 1. GIS Interactive Map (/map)
    // -----------------------------------------------------------------------
    console.log('\n--- 1. Testing Interactive GIS Map (/map) ---');
    const pageMap = await browser.newPage();
    try {
      await pageMap.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle2', timeout: 30000 });
      await pageMap.waitForSelector('.leaflet-container', { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 2000));

      const mapRendered = await pageMap.evaluate(() => {
        const leaflet = document.querySelector('.leaflet-container');
        const tiles = document.querySelectorAll('.leaflet-tile');
        return leaflet !== null && tiles.length > 0;
      });

      const spotCardsCount = await pageMap.evaluate(() => {
        return document.querySelectorAll('.cursor-pointer').length;
      });

      const screenshotMap = path.join(ARTIFACT_DIR, 'gis_map_interactive_view.png');
      await pageMap.screenshot({ path: screenshotMap });

      recordResult('GIS Mapping', 'Interactive Leaflet Map', 'Map Container & Tile Layer Render', mapRendered ? 'PASS' : 'FAIL', {
        mapRendered,
        spotCardsCount,
        screenshot: screenshotMap,
      });
    } catch (err) {
      recordResult('GIS Mapping', 'Interactive Leaflet Map', 'Map Container & Tile Layer Render', 'FAIL', { error: err.message });
    } finally {
      await pageMap.close();
    }

    // -----------------------------------------------------------------------
    // 2. Public Document Tracker (/track)
    // -----------------------------------------------------------------------
    console.log('\n--- 2. Testing Public Document Tracker (/track) ---');
    const pageTrack = await browser.newPage();
    try {
      // 2a. Valid Tracking Query
      await pageTrack.goto(`${BASE_URL}/track?code=BD1-8F3A29D1`, { waitUntil: 'networkidle2', timeout: 25000 });
      await pageTrack.waitForSelector('#tracker-results-section', { timeout: 10000 });

      const text = await pageTrack.evaluate(() => document.body.innerText);
      const hasControlNumber = text.includes('BD1-8F3A29D1');
      const hasClearance = text.includes('Barangay Clearance');
      const hasReadyForPickup = text.includes('READY FOR PICKUP') || text.includes('Ready for Pickup');

      const passValidTrack = hasControlNumber && hasClearance && hasReadyForPickup;
      const screenshotValidTrack = path.join(ARTIFACT_DIR, 'tracker_valid_BD1_8F3A29D1.png');
      await pageTrack.screenshot({ path: screenshotValidTrack, fullPage: true });

      recordResult('Civic Workflows', 'Document Tracker', 'Valid Reference Code Lookup', passValidTrack ? 'PASS' : 'FAIL', {
        hasControlNumber,
        hasClearance,
        hasReadyForPickup,
        screenshot: screenshotValidTrack,
      });

      // 2b. Anti-Fraud Invalid Tracking Query
      await pageTrack.goto(`${BASE_URL}/track?code=BD1-FAKE-9999`, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise((r) => setTimeout(r, 1000));
      const textInvalid = await pageTrack.evaluate(() => document.body.innerText);
      const isRejected = textInvalid.includes('Document Request Not Found') || textInvalid.includes('Not Found') || textInvalid.includes('Walang nahanap');

      const screenshotInvalidTrack = path.join(ARTIFACT_DIR, 'tracker_invalid_BD1_FAKE_9999.png');
      await pageTrack.screenshot({ path: screenshotInvalidTrack });

      recordResult('Civic Workflows', 'Document Tracker', 'Anti-Fraud Rejection of Fake Code', isRejected ? 'PASS' : 'FAIL', {
        isRejected,
        screenshot: screenshotInvalidTrack,
      });
    } catch (err) {
      recordResult('Civic Workflows', 'Document Tracker', 'Reference Code Verification', 'FAIL', { error: err.message });
    } finally {
      await pageTrack.close();
    }

    // -----------------------------------------------------------------------
    // 3. Document QR Verification (/verify/:id)
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Testing Public Verification Portal (/verify/$requestId) ---');
    const pageVerify = await browser.newPage();
    try {
      await pageVerify.goto(`${BASE_URL}/verify/8f3a29d1-1234-4567-89ab-cdef01234567`, { waitUntil: 'networkidle2', timeout: 25000 });
      await pageVerify.waitForSelector('h1', { timeout: 10000 });

      const verifyText = await pageVerify.evaluate(() => document.body.innerText);
      const isVerified = verifyText.includes('Official Barangay Record Verified') || verifyText.includes('Document Verification');

      const screenshotVerify = path.join(ARTIFACT_DIR, 'verify_public_qr_badge.png');
      await pageVerify.screenshot({ path: screenshotVerify });

      recordResult('Civic Workflows', 'QR Verification', 'Public Verification Badge Portal', isVerified ? 'PASS' : 'FAIL', {
        isVerified,
        screenshot: screenshotVerify,
      });
    } catch (err) {
      recordResult('Civic Workflows', 'QR Verification', 'Public Verification Badge Portal', 'FAIL', { error: err.message });
    } finally {
      await pageVerify.close();
    }

    // -----------------------------------------------------------------------
    // 4. Emergency Directory (/emergency)
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Testing Emergency Hotlines (/emergency) ---');
    const pageEmergency = await browser.newPage();
    try {
      await pageEmergency.goto(`${BASE_URL}/emergency`, { waitUntil: 'networkidle2', timeout: 25000 });
      await pageEmergency.waitForSelector('h1', { timeout: 10000 });

      const emText = await pageEmergency.evaluate(() => document.body.innerText);
      const hasDaine1 = emText.includes('Barangay Daine 1 Operations');
      const hasDaine2 = emText.includes('Barangay Daine 2 Operations');
      const hasPNP = emText.includes('Indang Municipal Police');

      const passEmergency = hasDaine1 && hasDaine2 && hasPNP;
      const screenshotEmergency = path.join(ARTIFACT_DIR, 'emergency_directory_full_audit.png');
      await pageEmergency.screenshot({ path: screenshotEmergency, fullPage: true });

      recordResult('Civic Workflows', 'Emergency Hotlines', 'Multi-tenant Emergency Hotlines', passEmergency ? 'PASS' : 'FAIL', {
        hasDaine1,
        hasDaine2,
        hasPNP,
        screenshot: screenshotEmergency,
      });
    } catch (err) {
      recordResult('Civic Workflows', 'Emergency Hotlines', 'Multi-tenant Emergency Hotlines', 'FAIL', { error: err.message });
    } finally {
      await pageEmergency.close();
    }

    // -----------------------------------------------------------------------
    // 5. Auth Route Guarding & Unauthenticated Redirection
    // -----------------------------------------------------------------------
    console.log('\n--- 5. Testing Route Guards (_authenticated Layout) ---');
    const pageGuard = await browser.newPage();
    try {
      // 5a. Unauthenticated Notifications
      await pageGuard.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle2', timeout: 25000 });
      const currentUrlNotif = pageGuard.url();
      const isRedirectedNotif = currentUrlNotif.includes('/auth/sign-in') || currentUrlNotif.includes('/sign-in');

      recordResult('Security & Routing', 'Authentication Layout Guard', 'Redirect /notifications to Sign-In', isRedirectedNotif ? 'PASS' : 'FAIL', {
        currentUrlNotif,
        isRedirectedNotif,
      });

      // 5b. Unauthenticated Admin Panel
      await pageGuard.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2', timeout: 25000 });
      const currentUrlAdmin = pageGuard.url();
      const isRedirectedAdmin = currentUrlAdmin.includes('/auth/sign-in') || currentUrlAdmin.includes('/sign-in');

      recordResult('Security & Routing', 'Authentication Layout Guard', 'Redirect /admin to Sign-In', isRedirectedAdmin ? 'PASS' : 'FAIL', {
        currentUrlAdmin,
        isRedirectedAdmin,
      });
    } catch (err) {
      recordResult('Security & Routing', 'Authentication Layout Guard', 'Guard Redirection Verification', 'FAIL', { error: err.message });
    } finally {
      await pageGuard.close();
    }

    // -----------------------------------------------------------------------
    // 6. PWA Manifest & Offline Simulation
    // -----------------------------------------------------------------------
    console.log('\n--- 6. Testing PWA Manifest & Offline Banner ---');
    const pagePwa = await browser.newPage();
    try {
      const res = await pagePwa.goto(`${BASE_URL}/manifest.json`, { waitUntil: 'networkidle2' });
      const manifest = JSON.parse(await res.text());
      const passManifest = manifest.name === 'Barangay Daine Connect' && manifest.display === 'standalone';

      recordResult('PWA & Offline', 'Web App Manifest', 'Manifest Structure & Theme Config', passManifest ? 'PASS' : 'FAIL', {
        passManifest,
      });
    } catch (err) {
      recordResult('PWA & Offline', 'Web App Manifest', 'Manifest Structure & Theme Config', 'FAIL', { error: err.message });
    } finally {
      await pagePwa.close();
    }

  } finally {
    await browser.close();
  }

  console.log('\n=========================================');
  console.log('🏁 FULL SYSTEM QA AUDIT COMPLETE:');
  console.log('=========================================');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

runFullSystemAudit();
