import puppeteer from 'puppeteer';

const ARTIFACT_DIR = '/Users/markhuelgas/.gemini/antigravity/brain/3544ab40-f53a-4478-938c-4ffadf8dc6b5';
const routes = [
  { name: 'Auth Sign-in', path: '/auth/sign-in' },
  { name: 'Barangay Officials', path: '/officials' },
  { name: 'Announcements', path: '/announcements' },
  { name: 'Community Events', path: '/events' },
];

async function testRemaining() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const r of routes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    console.log(`Auditing ${r.name} (${r.path})...`);
    await page.goto('http://localhost:3000' + r.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 600));

    const slug = r.path.replace(/\//g, '_').replace(/^_/, '');
    await page.screenshot({ path: `${ARTIFACT_DIR}/audit_${slug}_desktop.png` });

    const mPage = await browser.newPage();
    await mPage.setViewport({ width: 375, height: 812 });
    await mPage.goto('http://localhost:3000' + r.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(res => setTimeout(res, 600));
    await mPage.screenshot({ path: `${ARTIFACT_DIR}/audit_${slug}_mobile.png` });

    const overflow = await mPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`✓ ${r.name} complete! Mobile H-Scroll overflow: ${overflow ? '❌ FAIL' : '✓ PASS'}`);
    
    await page.close();
    await mPage.close();
  }
  await browser.close();
}

testRemaining().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
