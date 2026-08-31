import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3007;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'scratch');

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function checkServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function runVisualAudit() {
  console.log('🚀 Starting Visual Audit on Nitro Production Server (Port 3007)...');

  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    env: { ...process.env, PORT: `${PORT}`, NODE_ENV: 'production' },
    stdio: 'ignore',
    detached: true,
  });

  let ready = false;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await checkServer(`${BASE_URL}/`)) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    console.error('Failed to start Nitro server.');
    if (serverProcess) try { process.kill(-serverProcess.pid); } catch (e) {}
    process.exit(1);
  }

  console.log(`✅ Nitro Server running at ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 }
  ];

  const routes = [
    { name: 'homepage', path: '/' },
    { name: 'directory', path: '/directory' },
    { name: 'emergency', path: '/emergency' },
    { name: 'tracker', path: '/track' },
    { name: 'sign_in', path: '/auth/sign-in' },
    { name: 'sign_up', path: '/auth/sign-up' },
    { name: 'officials', path: '/officials' },
    { name: 'events', path: '/events' },
    { name: 'announcements', path: '/announcements' },
  ];

  const captures = [];

  for (const r of routes) {
    const page = await browser.newPage();
    console.log(`📸 Capturing screenshots for [${r.name}] (${r.path})...`);

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((res) => setTimeout(res, 500));

      const screenshotFile = `stitch_${r.name}_${vp.name}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotFile);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      captures.push({ route: r.name, viewport: vp.name, file: screenshotFile });
    }
    await page.close();
  }

  await browser.close();
  try { process.kill(-serverProcess.pid); } catch (e) {}

  console.log('\n✅ Visual audit complete! Total screenshots captured:', captures.length);
  return captures;
}

runVisualAudit().catch(console.error);
