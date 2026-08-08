import puppeteer from 'puppeteer';

async function testLogin(email, password, roleLabel) {
  console.log(`\n--- Testing ${roleLabel} Login (${email}) ---`);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001/auth/sign-in', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const inputs = await page.$$('input');
    // Assuming 0 is email and 1 is password
    await inputs[0].type(email);
    await inputs[1].type(password);
    
    // Find the submit button or press Enter
    await inputs[1].press('Enter');
    
    console.log('Submitted login form. Waiting for navigation or alerts...');
    await new Promise(r => setTimeout(r, 4000));
    
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Check for sonner toasts/alerts
    const alertMessages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.toast, .alert, [role="alert"], [data-sonner-toast]')).map(el => el.innerText);
    });
    
    if (alertMessages.length > 0) {
      console.log('Alert/Toast messages found:', alertMessages);
    } else {
      console.log('No alerts found.');
    }
    
    // Check if we reached a specific dashboard or home page
    if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard') || currentUrl !== 'http://localhost:3001/auth/sign-in') {
      console.log(`SUCCESS: Logged in and redirected to ${currentUrl}`);
    } else {
      console.log('FAILED: Still on sign-in page.');
    }

  } catch (err) {
    console.error(`Error during ${roleLabel} login:`, err);
  } finally {
    await browser.close();
  }
}

async function run() {
  await testLogin('markhersonhuelgas@gmail.com', 'brgyconnectadmin', 'Admin');
  await testLogin('markai0420@gmail.com', 'resident', 'Resident');
}

run();
