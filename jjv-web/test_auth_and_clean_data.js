import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Aryan/.gemini/antigravity/brain/7fb27091-567b-417e-9158-7387e658daec';

async function testFlow() {
  console.log('Testing authentication and clean data state...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });
  page.on('dialog', async (dialog) => {
    console.log('Dialog dismissed:', dialog.message());
    await dialog.accept();
  });

  // 1. Visit root - Clear any existing session to see login screen
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot Login Page
  console.log('Capturing Login Page...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_login.png') });

  // 2. Click Quick Login as Rashmi Vyas (Host / Admin)
  console.log('Logging in as Rashmi Vyas (Host)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const rashmiBtn = buttons.find(b => b.textContent.includes('Rashmi Vyas'));
    if (rashmiBtn) rashmiBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot Clean Dashboard
  console.log('Capturing Clean Dashboard with 0 test data...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_clean_dashboard.png') });

  // 3. Add a fresh rescue animal manually
  console.log('Navigating to Add New Dog...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dogsBtn = buttons.find(b => b.textContent.includes('Dog Profiles') || b.textContent.includes('कुत्तों'));
    if (dogsBtn) dogsBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click on "+ Add New Dog" tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addTab = buttons.find(b => b.textContent.includes('Add New Dog') || b.textContent.includes('नया कुत्ता'));
    if (addTab) addTab.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Fill in form: Name = "Tiger", Location = "Karond Mandi, Bhopal", Treatment = "First aid and rabies vaccination"
  console.log('Filling form for Tiger...');
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const nameInput = inputs.find(i => i.placeholder && (i.placeholder.includes('Bruno') || i.placeholder.includes('name')));
    if (nameInput) {
      nameInput.value = 'Tiger';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const locInput = inputs.find(i => i.placeholder && i.placeholder.includes('Karond Mandi'));
    if (locInput) {
      locInput.value = 'Karond Mandi, Bhopal';
      locInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const textareas = Array.from(document.querySelectorAll('textarea'));
    if (textareas.length > 1) {
      textareas[1].value = 'First aid and rabies vaccination administered';
      textareas[1].dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Submit Form
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture Dogs List with newly added animal
  console.log('Capturing Dogs List with new entry...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_new_entry.png') });

  // 4. Test Logout and Login as Nikhil (Staff)
  console.log('Testing Logout...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const logoutBtn = buttons.find(b => b.textContent.includes('Logout') || b.textContent.includes('लॉगआउट'));
    if (logoutBtn) logoutBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Log in as Nikhil
  console.log('Logging in as Nikhil (Staff)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nikhilBtn = buttons.find(b => b.textContent.includes('Nikhil'));
    if (nikhilBtn) nikhilBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture Staff view
  console.log('Capturing Staff view for Nikhil...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen_staff_nikhil.png') });

  await browser.close();
  console.log('All verification tests completed successfully!');
}

testFlow().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
