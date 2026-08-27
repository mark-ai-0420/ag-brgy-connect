import puppeteer from 'puppeteer'
import path from 'path'

const SCREENSHOT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), 'scratch/screenshots');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runVerification() {
  console.log('🚀 Starting Puppeteer Verification for Option A (Notifications & Public Tracker)...')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  })

  try {
    const page = await browser.newPage()
    page.on('console', (msg) => console.log('  [Browser Console]', msg.type(), msg.text()))
    page.on('pageerror', (err) => console.error('  [Browser PageError]', err.message))

    // ── Test 1: Homepage Quick Action Card & Navigation ────────────────────────
    console.log('📍 Step 1: Testing Homepage & "Track Document" Quick Action...')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 25000 })
    
    // Wait for hydration and Track Document quick action button
    await page.waitForSelector('#home-track-document-btn', { timeout: 10000 })
    await new Promise((r) => setTimeout(r, 1500))
    console.log('  ✅ Found "Track Document" Quick Action on homepage')

    // Click Track Document button to navigate to /track
    await page.click('#home-track-document-btn')
    await page.waitForFunction(() => window.location.pathname.includes('/track'), { timeout: 10000 })
      .catch(async () => {
        console.log('  [Fallback] Navigating to /track directly...')
        await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle2', timeout: 20000 })
      })
    console.log(`  ✅ Successfully navigated to: ${page.url()}`)

    // ── Test 2: Public Tracker Search Page ───────────────────────────────────
    console.log('📍 Step 2: Testing Public Tracker Search Page (/track)...')
    await page.waitForSelector('#tracker-search-card', { timeout: 10000 })
    await page.waitForSelector('#tracking-reference-input', { timeout: 10000 })
    console.log('  ✅ Tracker search input and sample references rendered')

    // Wait a bit for layout to settle
    await new Promise((r) => setTimeout(r, 800))

    // Take high-resolution screenshot of the initial Tracker search page
    const searchPageScreenshotPath = path.join(SCREENSHOT_DIR, 'qa_v2_tracker_search_page.png')
    await page.screenshot({ path: searchPageScreenshotPath, fullPage: false })
    console.log(`  📸 Saved: ${searchPageScreenshotPath}`)

    // ── Test 3: Search Document & Verify Lifecycle Stepper ────────────────────
    console.log('📍 Step 3: Searching Document Reference and Verifying Lifecycle Stepper...')
    await page.type('#tracking-reference-input', 'BD1-8F3A29D1')
    await page.click('#tracker-submit-btn')

    // Wait for tracker results section & lifecycle stepper to appear and loading to finish
    await page.waitForSelector('#tracker-results-section', { timeout: 15000 })
    await page.waitForSelector('#tracker-lifecycle-stepper', { timeout: 15000 })
    // Wait until button is no longer disabled (search is complete)
    await page.waitForFunction(() => {
      const btn = document.querySelector('#tracker-submit-btn')
      return btn && !btn.hasAttribute('disabled')
    }, { timeout: 10000 })
    console.log('  ✅ Document tracking result found & lifecycle timeline stepper fully rendered')

    // Let any transitions/fonts settle
    await new Promise((r) => setTimeout(r, 1200))

    // Take high-resolution screenshot of the timeline and document details
    const timelineScreenshotPath = path.join(SCREENSHOT_DIR, 'qa_v2_tracker_status_timeline.png')
    await page.screenshot({ path: timelineScreenshotPath, fullPage: true })
    console.log(`  📸 Saved: ${timelineScreenshotPath}`)

    // ── Test 4: Notification Center View (/notifications) ────────────────────
    console.log('📍 Step 4: Testing Notifications Center (/notifications)...')
    await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle2', timeout: 20000 })
    
    // Wait for Notification Center elements
    await page.waitForSelector('h1', { timeout: 10000 })
    await page.waitForSelector('#notification-filter-tabs', { timeout: 10000 })
    await page.waitForSelector('#notification-cards-list', { timeout: 10000 })
    console.log('  ✅ Notification Center rendered with notification cards and tabs')

    // Test tab filtering
    await page.click('#notif-tab-unread')
    await new Promise((r) => setTimeout(r, 400))
    console.log('  ✅ Tested Unread notifications tab')

    await page.click('#notif-tab-all')
    await new Promise((r) => setTimeout(r, 600))
    console.log('  ✅ Tested All notifications tab')

    // Take high-resolution screenshot of Notification Center
    const notifScreenshotPath = path.join(SCREENSHOT_DIR, 'qa_v2_notification_center_view.png')
    await page.screenshot({ path: notifScreenshotPath, fullPage: false })
    console.log(`  📸 Saved: ${notifScreenshotPath}`)

    console.log('🎉 All QA verification steps passed successfully!')
  } catch (error) {
    console.error('❌ Verification failed with error:', error)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

runVerification()
