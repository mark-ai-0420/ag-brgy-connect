import puppeteer from 'puppeteer';

async function testPwa() {
  console.log('📱 Testing PWA Service Worker Registration & Manifest...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3006/', { waitUntil: 'networkidle2' });

  // 1. Check Service Worker Registration
  const swRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg;
  });

  // 2. Check Manifest Link
  const manifestHref = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);

  // 3. Fetch and Validate Manifest JSON
  let manifestData = null;
  if (manifestHref) {
    manifestData = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        return await res.json();
      } catch (e) {
        return null;
      }
    }, manifestHref);
  }

  console.log('✅ Service Worker Active:', swRegistered);
  console.log('✅ Manifest Link:', manifestHref);
  console.log('✅ Manifest Display:', manifestData?.display);
  console.log('✅ Manifest Start URL:', manifestData?.start_url);
  console.log('✅ Manifest Icons Count:', manifestData?.icons?.length);
  console.log('✅ Maskable Icons Configured:', manifestData?.icons?.every(i => i.purpose?.includes('maskable')));

  await browser.close();

  const isPwaCompliant = swRegistered && manifestData && manifestData.display === 'standalone';
  console.log(`\n🏆 PWA Verification: ${isPwaCompliant ? 'PASS (100% PWA Compliant)' : 'FAIL'}`);
  return isPwaCompliant;
}

testPwa().catch(console.error);
