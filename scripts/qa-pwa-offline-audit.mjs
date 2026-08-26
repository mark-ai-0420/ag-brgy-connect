import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/b1e2f794-7a77-49d6-ad06-adbd1b04aa1e/screenshots';
const BASE_URL = 'http://localhost:3000';

async function runPwaOfflineAudit() {
  console.log('🚀 Starting PWA & Offline Resiliency QA Audit...');

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
    // 1. PWA Manifest Validation
    // -----------------------------------------------------------------------
    console.log('\n--- 1. Testing Web App Manifest (/manifest.json) ---');
    const pageManifest = await browser.newPage();
    try {
      const res = await pageManifest.goto(`${BASE_URL}/manifest.json`, { waitUntil: 'networkidle2' });
      const manifestText = await res.text();
      const manifest = JSON.parse(manifestText);

      const hasName = manifest.name === 'Barangay Daine Connect';
      const hasShortName = manifest.short_name === 'BrgyConnect';
      const hasStartUrl = manifest.start_url === '/?source=pwa';
      const hasDisplay = manifest.display === 'standalone';
      const hasThemeColor = manifest.theme_color === '#0038A8';
      const hasShortcuts = Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3;

      const passManifest = hasName && hasShortName && hasStartUrl && hasDisplay && hasThemeColor && hasShortcuts;
      recordResult('PWA Standards', 'Web App Manifest', '/manifest.json Schema', passManifest ? 'PASS' : 'FAIL', {
        name: manifest.name,
        display: manifest.display,
        shortcutsCount: manifest.shortcuts?.length,
      });
    } catch (err) {
      recordResult('PWA Standards', 'Web App Manifest', '/manifest.json Schema', 'FAIL', { error: err.message });
    } finally {
      await pageManifest.close();
    }

    // -----------------------------------------------------------------------
    // 2. Service Worker Registration & Installation
    // -----------------------------------------------------------------------
    console.log('\n--- 2. Testing Service Worker Registration ---');
    const pageSw = await browser.newPage();
    try {
      await pageSw.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));

      const swRegistered = await pageSw.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        const reg = await navigator.serviceWorker.getRegistration();
        return Boolean(reg);
      });

      const screenshotHome = path.join(ARTIFACT_DIR, 'pwa_homepage_sw_registered.png');
      await pageSw.screenshot({ path: screenshotHome });

      recordResult('PWA Standards', 'Service Worker Lifecycle', 'Registration on Root Mount', swRegistered ? 'PASS' : 'FAIL', {
        swRegistered,
        screenshot: screenshotHome,
      });
    } catch (err) {
      recordResult('PWA Standards', 'Service Worker Lifecycle', 'Registration on Root Mount', 'FAIL', { error: err.message });
    } finally {
      await pageSw.close();
    }

    // -----------------------------------------------------------------------
    // 3. Emergency Directory & Offline Hotline Rendering
    // -----------------------------------------------------------------------
    console.log('\n--- 3. Testing Emergency Directory (/emergency) ---');
    const pageEmergency = await browser.newPage();
    try {
      await pageEmergency.goto(`${BASE_URL}/emergency`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageEmergency.waitForSelector('h1', { timeout: 10000 });

      const pageText = await pageEmergency.evaluate(() => document.body.innerText);
      const hasDaine1 = pageText.includes('Barangay Daine 1 Operations');
      const hasDaine2 = pageText.includes('Barangay Daine 2 Operations');
      const hasPolice = pageText.includes('Indang Municipal Police Station');
      const hasBFP = pageText.includes('BFP Indang Fire Station');
      const hasRHU = pageText.includes('Indang Rural Health Unit');

      const passEmergency = hasDaine1 && hasDaine2 && hasPolice && hasBFP && hasRHU;
      const screenshotEmergency = path.join(ARTIFACT_DIR, 'emergency_hotlines_directory.png');
      await pageEmergency.screenshot({ path: screenshotEmergency, fullPage: true });

      recordResult('Offline Resiliency', 'Emergency Directory', 'Built-in Emergency Hotlines Grid', passEmergency ? 'PASS' : 'FAIL', {
        hasDaine1,
        hasDaine2,
        hasPolice,
        hasBFP,
        hasRHU,
        screenshot: screenshotEmergency,
      });
    } catch (err) {
      recordResult('Offline Resiliency', 'Emergency Directory', 'Built-in Emergency Hotlines Grid', 'FAIL', { error: err.message });
    } finally {
      await pageEmergency.close();
    }

    // -----------------------------------------------------------------------
    // 4. Document Tracker LocalStorage Caching & Offline Mirror
    // -----------------------------------------------------------------------
    console.log('\n--- 4. Testing Document Tracker Offline Mirror ---');
    const pageTrack = await browser.newPage();
    try {
      // 4a. Initial search to populate cache
      await pageTrack.goto(`${BASE_URL}/track?code=BD1-8F3A29D1`, { waitUntil: 'networkidle2', timeout: 20000 });
      await pageTrack.waitForSelector('#tracker-results-section', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 1000));

      const cachePopulated = await pageTrack.evaluate(() => {
        const cached = localStorage.getItem('cached_tracking_records');
        if (!cached) return false;
        const list = JSON.parse(cached);
        return Array.isArray(list) && list.some((r) => r.code === 'BD1-8F3A29D1');
      });

      const screenshotTrack = path.join(ARTIFACT_DIR, 'tracker_cached_record_online.png');
      await pageTrack.screenshot({ path: screenshotTrack, fullPage: true });

      recordResult('Offline Resiliency', 'Tracker Local Caching', 'Populate localStorage on query', cachePopulated ? 'PASS' : 'FAIL', {
        cachePopulated,
        screenshot: screenshotTrack,
      });
    } catch (err) {
      recordResult('Offline Resiliency', 'Tracker Local Caching', 'Populate localStorage on query', 'FAIL', { error: err.message });
    } finally {
      await pageTrack.close();
    }

    // -----------------------------------------------------------------------
    // 5. Offline Simulation & Banner Check
    // -----------------------------------------------------------------------
    console.log('\n--- 5. Testing Offline Network Simulation ---');
    const pageOffline = await browser.newPage();
    try {
      await pageOffline.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      await pageOffline.setOfflineMode(true);
      await new Promise((r) => setTimeout(r, 500));

      // Trigger offline event in browser
      await pageOffline.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
      });
      await new Promise((r) => setTimeout(r, 600));

      const offlineBannerVisible = await pageOffline.evaluate(() => {
        const alert = document.querySelector('[role="alert"]');
        return alert !== null && alert.innerText.includes('Offline Mode Active');
      });

      const screenshotOffline = path.join(ARTIFACT_DIR, 'offline_banner_alert_simulation.png');
      await pageOffline.screenshot({ path: screenshotOffline });

      recordResult('Offline Resiliency', 'Network Status Hook & Alert', 'Realtime Offline Banner Detection', offlineBannerVisible ? 'PASS' : 'FAIL', {
        offlineBannerVisible,
        screenshot: screenshotOffline,
      });
    } catch (err) {
      recordResult('Offline Resiliency', 'Network Status Hook & Alert', 'Realtime Offline Banner Detection', 'FAIL', { error: err.message });
    } finally {
      await pageOffline.close();
    }

  } finally {
    await browser.close();
  }

  console.log('\n=========================================');
  console.log('🏁 PWA & OFFLINE QA AUDIT COMPLETE:');
  console.log('=========================================');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

runPwaOfflineAudit();
