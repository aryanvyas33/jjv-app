import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Aryan/.gemini/antigravity/brain/7fb27091-567b-417e-9158-7387e658daec';

async function capture() {
  console.log('Launching browser for visual verification...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // 1. Dashboard View
  console.log('Navigating to Dashboard...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_1_dashboard.png') });
  console.log('Captured screen_1_dashboard.png');

  // 2. Dogs View
  console.log('Navigating to Dogs Page...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Dog Profiles') || b.textContent.includes('कुत्तों'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_2_dogs.png') });
  console.log('Captured screen_2_dogs.png');

  // 3. Animal Modal (View First Dog)
  console.log('Opening Animal Detail Modal...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const viewBtn = buttons.find(b => b.textContent.trim() === 'View');
    if (viewBtn) viewBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_3_detail_modal.png') });
  console.log('Captured screen_3_detail_modal.png');

  // Close modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent.trim() === 'Close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 4. Cows View
  console.log('Navigating to Cows Page...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Cow Profiles') || b.textContent.includes('गौशाला'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_4_cows.png') });
  console.log('Captured screen_4_cows.png');

  // 5. Mobile Simulator
  console.log('Opening Mobile App Simulator...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Mobile App View') || b.textContent.includes('मोबाइल ऐप'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_5_mobile_sim.png') });
  console.log('Captured screen_5_mobile_sim.png');

  await browser.close();
  console.log('All visual artifacts captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
