const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(10000);
    
    // Intercept requests to mock Supabase Auth
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      const method = request.method();
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      };

      if (method === 'OPTIONS') {
        request.respond({
          status: 204,
          headers: corsHeaders
        });
        return;
      }

      if (url.includes('/auth/v1/signup')) {
        console.log('Mocking Supabase Sign Up response...');
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'mock-user-id',
              aud: 'authenticated',
              role: 'authenticated',
              email: 'testuser@gmail.com',
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              identities: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })
        });
      } else if (url.includes('/auth/v1/token?grant_type=password')) {
        console.log('Mocking Supabase Sign In response...');
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'mock-user-id',
              aud: 'authenticated',
              role: 'authenticated',
              email: 'testuser@gmail.com',
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              identities: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })
        });
      } else if (url.includes('/auth/v1/user')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            id: 'mock-user-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'testuser@gmail.com',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
            identities: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        });
      } else {
        request.continue();
      }
    });
    
    // Test Sign Up
    console.log('--- Testing Sign Up Flow ---');
    await page.goto('http://localhost:3001/auth/sign-up', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const email = `testuser@gmail.com`;
    const inputs = await page.$$('input');
    await inputs[0].type(email);
    await inputs[1].type('Testpassword123!');
    await inputs[2].type('Testpassword123!');
    
    await inputs[2].press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    
    let urlAfterSignup = page.url();
    console.log('URL after sign up:', urlAfterSignup);
    
    // Check if it successfully redirected to /auth/sign-in after sign up as per code
    const alertMessagesSignup = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.toast, .alert, [role="alert"], [data-sonner-toast]')).map(el => el.innerText);
    });
    console.log('Alert messages after signup:', alertMessagesSignup);

    // Test Sign In
    console.log('--- Testing Sign In Flow ---');
    await page.goto('http://localhost:3001/auth/sign-in', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const signInInputs = await page.$$('input');
    await signInInputs[0].type(email);
    await signInInputs[1].type('Testpassword123!');
    await signInInputs[1].press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    
    let urlAfterSignin = page.url();
    console.log('URL after sign in:', urlAfterSignin);

    const alertMessagesSignin = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.toast, .alert, [role="alert"], [data-sonner-toast]')).map(el => el.innerText);
    });
    console.log('Alert messages after signin:', alertMessagesSignin);
    
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
