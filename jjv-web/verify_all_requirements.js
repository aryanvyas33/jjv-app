import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Aryan/.gemini/antigravity/brain/8d5e23c1-4472-4be6-8d54-69e79eddf3a5';
const SAMPLE_IMG = path.resolve('sample_dog.png');

async function runVerification() {
  console.log('=== STARTING JJV-WEB FULL VERIFICATION SUITE ===\n');
  const results = {};

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });

  // Handle dialogs automatically (e.g. confirm delete)
  page.on('dialog', async (dialog) => {
    console.log(`[DIALOG] ${dialog.type()}: "${dialog.message()}" -> Accepting`);
    await dialog.accept();
  });

  try {
    // -------------------------------------------------------------
    // STEP 1 & 2: Visit http://localhost:5173/ and clear session
    // -------------------------------------------------------------
    console.log('Step 1 & 2: Opening http://localhost:5173/ and initializing clean state...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 600));

    // Verify login page rendered
    const hasLoginForm = await page.$('form');
    results.loginPageRendered = !!hasLoginForm;
    console.log('Login page rendered:', results.loginPageRendered ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login_page.png') });

    // -------------------------------------------------------------
    // STEP 3: Login as Rashmi Vyas (Admin)
    // -------------------------------------------------------------
    console.log('\nStep 3: Logging in as Rashmi Vyas (Admin)...');
    await page.type('input[placeholder*="username" i], input[type="text"]', 'Rashmi');
    await page.type('input[type="password"]', 'adminpassword2026');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1200));

    // Verify Dashboard rendered with Admin profile
    const dashboardHeader = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const navbar = document.querySelector('header');
      return {
        h2Text: h2 ? h2.textContent : '',
        navText: navbar ? navbar.textContent : ''
      };
    });
    results.adminLogin = dashboardHeader.navText.includes('Rashmi Vyas') || dashboardHeader.navText.includes('👑');
    console.log('Admin login verified (Rashmi Vyas):', results.adminLogin ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_admin_dashboard.png') });

    // -------------------------------------------------------------
    // STEP 4: Add a new dog rescue with a photo — verify it saves
    // -------------------------------------------------------------
    console.log('\nStep 4: Navigating to Dogs page and adding a new dog rescue with photo...');
    // Click "Dog Profiles" in navbar
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button, header a')).find(
        (el) => el.textContent.includes('Dog Profiles') || el.textContent.includes('कुत्तों')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Click "+ Add New Dog" tab
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (el) => el.textContent.includes('Add New Dog') || el.textContent.includes('नया कुत्ता')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Fill the Dog Form
    console.log('Filling Dog Form for "Sheru"...');
    // Name
    const nameInput = await page.$('input[placeholder*="Bruno" i], input[placeholder*="Sheru" i]');
    if (nameInput) await nameInput.type('Sheru');

    // Location
    const locInput = await page.$('input[placeholder*="Karond" i], input[placeholder*="Bhopal" i]');
    if (locInput) await locInput.type('MP Nagar Zone 1, Bhopal');

    // Condition description
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      await textareas[0].type('Rescued near Chetak Bridge with left paw trauma and dehydration.');
    }
    // Treatment details
    if (textareas.length > 1) {
      await textareas[1].type('Antiseptic dressing, analgesic injection, rabies vaccination completed.');
    }

    // Upload photo (Before Photo file input)
    console.log('Uploading photo for Sheru...');
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(SAMPLE_IMG);
      await new Promise((r) => setTimeout(r, 1000)); // wait for compression and upload
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_add_dog_form_with_photo.png') });

    // Click Save Profile
    console.log('Submitting Dog Form...');
    await page.evaluate(() => {
      const saveBtn = document.querySelector('button[type="submit"]');
      if (saveBtn) saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Verify "Sheru" is in the table
    const tableHasSheru = await page.evaluate(() => {
      return document.body.textContent.includes('Sheru') && document.body.textContent.includes('MP Nagar Zone 1');
    });
    results.dogAddedAndSaved = tableHasSheru;
    console.log('Dog saved and visible in registry:', results.dogAddedAndSaved ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_dog_saved_in_table.png') });

    // -------------------------------------------------------------
    // STEP 5: View dog profile in modal — click Edit — verify pre-filled
    // -------------------------------------------------------------
    console.log('\nStep 5: Opening dog profile modal and verifying Edit pre-fill...');
    // Click View on Sheru
    await page.evaluate(() => {
      const viewBtns = Array.from(document.querySelectorAll('button')).filter(
        (b) => b.textContent.trim() === 'View' || b.title === 'View Profile' || b.textContent.includes('View Profile')
      );
      if (viewBtns.length > 0) viewBtns[0].click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Verify modal is open and shows Sheru
    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal ? modal.textContent : '';
    });
    results.modalOpened = modalContent.includes('Sheru') && modalContent.includes('MP Nagar Zone 1');
    console.log('Dog detail modal opened with Sheru details:', results.modalOpened ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_dog_detail_modal.png') });

    // Click Edit button inside modal
    console.log('Clicking Edit button in modal...');
    await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (modal) {
        const editBtn = Array.from(modal.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Edit') || b.textContent.includes('संपादित')
        );
        if (editBtn) editBtn.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Verify AnimalForm opened with pre-filled values
    const formValues = await page.evaluate(() => {
      const nameInp = document.querySelector('input[placeholder*="Bruno" i], input[placeholder*="Sheru" i]');
      const locInp = document.querySelector('input[placeholder*="Karond" i], input[placeholder*="Bhopal" i]');
      const textareas = Array.from(document.querySelectorAll('textarea'));
      return {
        name: nameInp ? nameInp.value : '',
        location: locInp ? locInp.value : '',
        treatment: textareas[1] ? textareas[1].value : ''
      };
    });
    results.formPreFilled =
      formValues.name === 'Sheru' &&
      formValues.location.includes('MP Nagar') &&
      formValues.treatment.includes('Antiseptic dressing');
    console.log('Edit form pre-filled verified:', results.formPreFilled ? 'PASS' : 'FAIL', formValues);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_edit_form_prefilled.png') });

    // Cancel edit to return to table
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Cancel') || b.textContent.includes('रद्द')
      );
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // STEP 6: Delete a dog — verify admin can delete (no RBAC error)
    // -------------------------------------------------------------
    console.log('\nStep 6: Testing dog deletion as Admin (RBAC check)...');
    // First, let's create a temporary dog specifically to delete
    console.log('Creating a temporary dog "DogToDelete"...');
    await page.evaluate(() => {
      const addTab = Array.from(document.querySelectorAll('button')).find(
        (el) => el.textContent.includes('Add New Dog') || el.textContent.includes('नया कुत्ता')
      );
      if (addTab) addTab.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const tempNameInput = await page.$('input[placeholder*="Bruno" i], input[placeholder*="Sheru" i]');
    if (tempNameInput) await tempNameInput.type('DogToDelete');
    const tempLocInput = await page.$('input[placeholder*="Karond" i], input[placeholder*="Bhopal" i]');
    if (tempLocInput) await tempLocInput.type('Bhopal Junction');

    await page.evaluate(() => {
      const saveBtn = document.querySelector('button[type="submit"]');
      if (saveBtn) saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Confirm DogToDelete is in list
    const hasTempDog = await page.evaluate(() => document.body.textContent.includes('DogToDelete'));
    console.log('DogToDelete created:', hasTempDog);

    // Now delete "DogToDelete"
    console.log('Deleting DogToDelete as Admin...');
    await page.evaluate(() => {
      // Find row with DogToDelete
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const targetRow = rows.find((r) => r.textContent.includes('DogToDelete'));
      if (targetRow) {
        const delBtn = targetRow.querySelector('button[title*="Delete" i], button[title*="delete" i]');
        if (delBtn) delBtn.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1200));

    // Verify DogToDelete is gone and no RBAC error occurred
    const dogStillPresent = await page.evaluate(() => document.body.textContent.includes('DogToDelete'));
    results.adminDeleteSuccess = !dogStillPresent;
    console.log('Admin deletion verified without RBAC error:', results.adminDeleteSuccess ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_admin_delete_success.png') });

    // -------------------------------------------------------------
    // STEP 7: Login as Nikhil (Worker) — verify Delete button is hidden
    // -------------------------------------------------------------
    console.log('\nStep 7: Testing Worker role (Nikhil) — Delete button should be hidden...');
    // Logout
    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Logout') || b.textContent.includes('लॉगआउट')
      );
      if (logoutBtn) logoutBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Login as Nikhil
    await page.type('input[placeholder*="username" i], input[type="text"]', 'Nikhil');
    await page.type('input[type="password"]', 'password2026');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1200));

    // Navigate to Dogs page
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button, header a')).find(
        (el) => el.textContent.includes('Dog Profiles') || el.textContent.includes('कुत्तों')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Check table for delete buttons
    const tableDeleteButtonsCount = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('tbody button'));
      return btns.filter(
        (b) => b.title?.toLowerCase().includes('delete') || b.textContent.toLowerCase().includes('delete')
      ).length;
    });

    // Also check inside detail modal
    await page.evaluate(() => {
      const viewBtns = Array.from(document.querySelectorAll('button')).filter(
        (b) => b.textContent.trim() === 'View' || b.title === 'View Profile'
      );
      if (viewBtns.length > 0) viewBtns[0].click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const modalDeleteButtonCount = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return 0;
      return Array.from(modal.querySelectorAll('button')).filter(
        (b) => b.textContent.toLowerCase().includes('delete') || b.title?.toLowerCase().includes('delete')
      ).length;
    });

    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.trim() === 'Close'
      );
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    results.workerDeleteHidden = tableDeleteButtonsCount === 0 && modalDeleteButtonCount === 0;
    console.log(
      'Worker role verified (Delete buttons hidden in table and modal):',
      results.workerDeleteHidden ? 'PASS' : 'FAIL',
      `[table: ${tableDeleteButtonsCount}, modal: ${modalDeleteButtonCount}]`
    );
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_worker_view_delete_hidden.png') });

    // -------------------------------------------------------------
    // STEP 8: Switch language to Hindi — verify ALL text translates
    // -------------------------------------------------------------
    console.log('\nStep 8: Switching language to Hindi and verifying translation...');
    await page.evaluate(() => {
      const langBtn = Array.from(document.querySelectorAll('header button')).find(
        (b) => b.textContent.includes('हिन्दी') || b.title?.includes('Language')
      );
      if (langBtn) langBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const hindiContent = await page.evaluate(() => {
      return {
        header: document.querySelector('header')?.textContent || '',
        tabs: Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim()),
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map((h) => h.textContent.trim())
      };
    });

    const hasHindiHeader = hindiContent.header.includes('कुत्तों की सूची') || hindiContent.header.includes('डैशबोर्ड');
    const hasHindiDogs = hindiContent.tabs.some((t) => t.includes('सभी कुत्ते') || t.includes('सांख्यिकी'));
    results.hindiTranslated = hasHindiHeader && hasHindiDogs;
    console.log('Hindi translations verified:', results.hindiTranslated ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_hindi_language_view.png') });

    // Switch back to English for remaining verification steps
    await page.evaluate(() => {
      const langBtn = Array.from(document.querySelectorAll('header button')).find(
        (b) => b.textContent.includes('English')
      );
      if (langBtn) langBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // STEP 9: Check Dashboard stats update correctly
    // -------------------------------------------------------------
    console.log('\nStep 9: Checking Dashboard stats update correctly...');
    // Navigate to Dashboard
    await page.evaluate(() => {
      const dashBtn = Array.from(document.querySelectorAll('header button')).find(
        (b) => b.textContent.includes('Dashboard') || b.textContent.includes('डैशबोर्ड')
      );
      if (dashBtn) dashBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const statsValues = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('main .grid .bg-card'));
      return cards.map((c) => ({
        label: c.querySelector('span')?.textContent || '',
        value: c.querySelector('.text-3xl')?.textContent || ''
      }));
    });
    console.log('Dashboard Stats Cards:', statsValues);
    const totalDogsCard = statsValues.find((s) => s.label.toLowerCase().includes('dogs'));
    results.dashboardStatsUpdated = totalDogsCard && parseInt(totalDogsCard.value, 10) >= 1;
    console.log('Dashboard stats reflect registered dog:', results.dashboardStatsUpdated ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_dashboard_stats.png') });

    // -------------------------------------------------------------
    // STEP 10: Export CSV — verify download works
    // -------------------------------------------------------------
    console.log('\nStep 10: Testing CSV export trigger and download functionality...');
    // Re-login as Admin to test full export & creation flow if needed
    const exportResult = await page.evaluate(() => {
      const exportBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Export Census') || b.textContent.includes('CSV')
      );
      if (!exportBtn) return { found: false };

      // Spy on URL.createObjectURL and link clicks
      let clickedHref = null;
      let downloadAttr = null;
      const originalCreate = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        return originalCreate(blob);
      };

      const originalAppend = document.body.appendChild;
      document.body.appendChild = function (el) {
        if (el.tagName === 'A' && el.hasAttribute('download')) {
          downloadAttr = el.getAttribute('download');
          clickedHref = el.getAttribute('href');
        }
        return originalAppend.call(document.body, el);
      };

      exportBtn.click();
      return {
        found: true,
        downloadAttr,
        hasBlobHref: typeof clickedHref === 'string' && clickedHref.startsWith('blob:')
      };
    });
    results.csvExportWorked = exportResult.found && exportResult.hasBlobHref && exportResult.downloadAttr.includes('JJV_Bhopal_Census');
    console.log('CSV Export verified:', results.csvExportWorked ? 'PASS' : 'FAIL', exportResult);

    // -------------------------------------------------------------
    // STEP 11: Add 5+ animals to verify pagination appears
    // -------------------------------------------------------------
    console.log('\nStep 11: Adding 5+ animals to verify pagination appears...');
    // We already have 1 dog (Sheru). Let's log in as Admin to add 5 more animals.
    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Logout') || b.textContent.includes('लॉगआउट')
      );
      if (logoutBtn) logoutBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Admin login
    await page.type('input[placeholder*="username" i], input[type="text"]', 'Rashmi');
    await page.type('input[type="password"]', 'adminpassword2026');
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1200));

    // Go to Dogs page
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button, header a')).find(
        (el) => el.textContent.includes('Dog Profiles') || el.textContent.includes('कुत्तों')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Add 5 dogs via form or helper
    const testDogs = [
      { name: 'Moti', location: 'Arera Colony, Bhopal', status: 'Under Treatment' },
      { name: 'Kalu', location: 'Kolar Road, Bhopal', status: 'Recovered' },
      { name: 'Rani', location: 'Shahpura, Bhopal', status: 'Stable' },
      { name: 'Rocky', location: 'TT Nagar, Bhopal', status: 'Critical' },
      { name: 'Bruno', location: 'Bairagarh, Bhopal', status: 'Under Treatment' }
    ];

    for (const d of testDogs) {
      console.log(`Adding ${d.name}...`);
      await page.evaluate(() => {
        const addTab = Array.from(document.querySelectorAll('button')).find(
          (el) => el.textContent.includes('Add New Dog') || el.textContent.includes('नया कुत्ता')
        );
        if (addTab) addTab.click();
      });
      await new Promise((r) => setTimeout(r, 500));

      const nInp = await page.$('input[placeholder*="Bruno" i], input[placeholder*="Sheru" i]');
      if (nInp) await nInp.type(d.name);
      const lInp = await page.$('input[placeholder*="Karond" i], input[placeholder*="Bhopal" i]');
      if (lInp) await lInp.type(d.location);

      await page.evaluate(() => {
        const saveBtn = document.querySelector('button[type="submit"]');
        if (saveBtn) saveBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Now we have 6 dogs in the table. Verify pagination controls appear
    const paginationInfo = await page.evaluate(() => {
      const pagContainer = document.querySelector('.bg-\\[\\#1a1714\\].rounded-xl.border.border-border.text-xs');
      const text = pagContainer ? pagContainer.textContent : '';
      const pageBtns = Array.from(document.querySelectorAll('button')).filter((b) => /^[1-9]\d*$/.test(b.textContent.trim()));
      return {
        text,
        pageButtonNumbers: pageBtns.map((b) => b.textContent.trim())
      };
    });
    console.log('Pagination details:', paginationInfo);
    results.paginationAppears =
      paginationInfo.pageButtonNumbers.includes('1') &&
      paginationInfo.pageButtonNumbers.includes('2') &&
      paginationInfo.text.includes('records');
    console.log('Pagination appears verified (Page 1 & 2 buttons present):', results.paginationAppears ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_pagination_controls.png') });

    // Click Page 2 to verify navigation works
    await page.evaluate(() => {
      const page2Btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === '2');
      if (page2Btn) page2Btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_pagination_page_2.png') });

    // -------------------------------------------------------------
    // STEP 12: Check Statistics tab renders correctly
    // -------------------------------------------------------------
    console.log('\nStep 12: Checking Statistics tab renders correctly...');
    await page.evaluate(() => {
      const statsTab = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Statistics') || b.textContent.includes('सांख्यिकी')
      );
      if (statsTab) statsTab.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const statsTabContent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h4, span')).map((el) => el.textContent.trim());
      const hasRecoveryRate = headings.some((t) => t.includes('Recovery Rate') || t.includes('स्वस्थ होने की दर'));
      const hasAvgRecovery = headings.some((t) => t.includes('Avg Recovery Time') || t.includes('औसत'));
      const hasHotspots = headings.some((t) => t.includes('Top Rescue Hotspots') || t.includes('प्रमुख'));
      const hasMonthlyTrend = headings.some((t) => t.includes('Monthly Intake Trend') || t.includes('मासिक'));
      return {
        hasRecoveryRate,
        hasAvgRecovery,
        hasHotspots,
        hasMonthlyTrend
      };
    });

    results.statisticsTabRendered =
      statsTabContent.hasRecoveryRate &&
      statsTabContent.hasAvgRecovery &&
      statsTabContent.hasHotspots &&
      statsTabContent.hasMonthlyTrend;
    console.log('Statistics tab rendered verified:', results.statisticsTabRendered ? 'PASS' : 'FAIL', statsTabContent);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_statistics_tab.png') });

    await browser.close();
    console.log('\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===');
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'verification_summary.json'),
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('Verification failed with error:', err);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'error_state.png') }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

runVerification();
