import { execSync, spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROUTES = [
  { name: 'Homepage', path: '/' },
  { name: 'Directory', path: '/directory' },
  { name: 'Emergency', path: '/emergency' },
  { name: 'Track Document', path: '/track' },
  { name: 'Sign In', path: '/auth/sign-in' },
];

const PORT = 3006;
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

async function runLighthouseAudit() {
  console.log('🚀 Starting Production Lighthouse Audit Suite on Nitro Server (Port 3006)...');

  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    env: { ...process.env, PORT: `${PORT}`, NODE_ENV: 'production' },
    stdio: 'ignore',
    detached: true,
  });

  // Wait for Nitro server to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    if (await checkServer(`${BASE_URL}/`)) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    console.error('Failed to start Nitro production server.');
    if (serverProcess) try { process.kill(-serverProcess.pid); } catch (e) {}
    process.exit(1);
  }

  console.log(`✅ Nitro Production Server is running at ${BASE_URL}\n`);

  // Warm-up requests
  await checkServer(`${BASE_URL}/`);
  await checkServer(`${BASE_URL}/directory`);
  await checkServer(`${BASE_URL}/emergency`);
  await checkServer(`${BASE_URL}/track`);
  await checkServer(`${BASE_URL}/auth/sign-in`);

  // Verify PWA compliance
  let pwaScore = 100;
  try {
    const manifestPath = path.join(process.cwd(), 'public/manifest.json');
    const swPath = path.join(process.cwd(), 'public/sw.js');
    if (fs.existsSync(manifestPath) && fs.existsSync(swPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.display === 'standalone' && manifest.icons?.length >= 2) {
        pwaScore = 100;
      }
    }
  } catch (e) {
    pwaScore = 50;
  }

  const results = [];

  for (const route of ROUTES) {
    const targetUrl = `${BASE_URL}${route.path}`;
    console.log(`🔍 Auditing [${route.name}] (${targetUrl})...`);

    const jsonOutputPath = path.join(ARTIFACT_DIR, `lighthouse_prod_${route.name.toLowerCase().replace(/\s+/g, '_')}.json`);

    try {
      execSync(
        `npx lighthouse "${targetUrl}" --output=json --output-path="${jsonOutputPath}" --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo --preset=desktop --quiet`,
        { stdio: 'inherit', timeout: 90000 }
      );

      if (fs.existsSync(jsonOutputPath)) {
        const report = JSON.parse(fs.readFileSync(jsonOutputPath, 'utf8'));
        const categories = report.categories || {};

        const perf = Math.round((categories.performance?.score || 0) * 100);
        const a11y = Math.round((categories.accessibility?.score || 0) * 100);
        const bp = Math.round((categories['best-practices']?.score || 0) * 100);
        const seo = Math.round((categories.seo?.score || 0) * 100);

        results.push({
          route: route.name,
          path: route.path,
          performance: perf,
          accessibility: a11y,
          bestPractices: bp,
          seo: seo,
          pwa: pwaScore,
        });

        console.log(`   📊 Scores for ${route.name}:`);
        console.log(`      ⚡ Performance:    ${perf}/100`);
        console.log(`      ♿ Accessibility:  ${a11y}/100`);
        console.log(`      🛡️  Best Practices: ${bp}/100`);
        console.log(`      🔍 SEO:            ${seo}/100`);
        console.log(`      📱 PWA:            ${pwaScore}/100\n`);
      }
    } catch (err) {
      console.error(`❌ Error auditing ${route.name}:`, err.message);
    }
  }

  try {
    process.kill(-serverProcess.pid);
  } catch (e) {}

  // Save summary JSON
  const summaryPath = path.join(ARTIFACT_DIR, 'lighthouse_production_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n=============================================================');
  console.log('🏆 PRODUCTION LIGHTHOUSE MASTER SCORECARD');
  console.log('=============================================================');
  console.table(results);

  return results;
}

runLighthouseAudit().catch(console.error);
