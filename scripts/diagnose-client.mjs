import puppeteer from 'puppeteer';

async function diagnose() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  console.log('🔍 Navigating to http://localhost:3000/ (or active dev server)...');
  
  // Try port 3000 first, or port 3006
  let url = 'http://localhost:3000/';
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
  } catch (e) {
    url = 'http://localhost:3006/';
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
    } catch (e2) {
      console.error('Could not connect to port 3000 or 3006');
    }
  }

  console.log('Connected to:', url);

  // Check top-level elements at (x, y) coordinates to see if an invisible overlay is intercepting clicks
  const hitTest = await page.evaluate(() => {
    const points = [
      { x: window.innerWidth / 2, y: 100 }, // Navbar / Hero area
      { x: window.innerWidth / 2, y: 300 }, // Center
      { x: 100, y: 20 }, // Top left
      { x: window.innerWidth - 50, y: window.innerHeight - 50 } // Bottom right FAB
    ];

    return points.map(p => {
      const el = document.elementFromPoint(p.x, p.y);
      return {
        point: p,
        tag: el?.tagName,
        id: el?.id,
        className: el?.className,
        outerHTML: el?.outerHTML?.slice(0, 150)
      };
    });
  });

  // Try clicking a button (e.g. Scope Selector or Theme Toggle or Emergency)
  const clickTest = await page.evaluate(async () => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const results = [];
    for (const b of buttons.slice(0, 5)) {
      const rect = b.getBoundingClientRect();
      const elAtPoint = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      results.push({
        text: b.innerText?.trim() || b.getAttribute('aria-label') || b.tagName,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        isTopElement: elAtPoint === b || b.contains(elAtPoint),
        topElementTag: elAtPoint?.tagName,
        topElementClass: elAtPoint?.className
      });
    }
    return results;
  });

  console.log('\n=== PAGE ERRORS ===');
  console.log(pageErrors);

  console.log('\n=== CONSOLE MESSAGES ===');
  console.log(consoleMessages.filter(m => m.type === 'error' || m.type === 'warning'));

  console.log('\n=== HIT TEST AT SCREEN POINTS ===');
  console.log(JSON.stringify(hitTest, null, 2));

  console.log('\n=== BUTTON CLICKABILITY TEST ===');
  console.log(JSON.stringify(clickTest, null, 2));

  await browser.close();
}

diagnose().catch(console.error);
