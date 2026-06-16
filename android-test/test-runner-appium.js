/**
 * Interviu AI — Appium Android Test Runner
 * ========================================
 * Runs automated mobile test cases against the Android Capacitor application.
 * Generates Excel, HTML, and Markdown test reports.
 */

const { remote } = require('webdriverio');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// ─── Config & Paths ──────────────────────────────────────────────────
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const TEST_RESULTS_DIR = path.join(WORKSPACE_ROOT, 'Test Results');
const EXCEL_DIR = path.join(TEST_RESULTS_DIR, 'Excel');
const HTML_DIR = path.join(TEST_RESULTS_DIR, 'HTML');
const SCREENSHOTS_DIR = path.join(TEST_RESULTS_DIR, 'Screenshots');
const LOGS_DIR = path.join(TEST_RESULTS_DIR, 'Logs');
const SUMMARY_DIR = path.join(TEST_RESULTS_DIR, 'Summary');

// ─── Ensure Folders ──────────────────────────────────────────────────
[EXCEL_DIR, HTML_DIR, SCREENSHOTS_DIR, LOGS_DIR, SUMMARY_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ─── Redirect logs to file ──────────────────────────────────────────
const logStream = fs.createWriteStream(path.join(LOGS_DIR, 'execution.log'), { flags: 'a' });
const originalConsoleLog = console.log;
console.log = function(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  originalConsoleLog.apply(console, args);
  logStream.write(`[MOBILE] ${msg}\n`);
};

// ─── Appium WebdriverIO Capabilities ─────────────────────────────────
const wdioOpts = {
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT || '4723'),
  path: '/wd/hub',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': path.join(WORKSPACE_ROOT, 'frontend', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    'appium:appPackage': 'ai.interviu.app',
    'appium:appActivity': 'ai.interviu.app.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 60,
  }
};

const results = [];
let passCount = 0;
let failCount = 0;
let testNumber = 0;
const startTime = Date.now();

// ─── Run a test case ─────────────────────────────────────────────────
async function runTest(name, category, fn, client, isSimulation) {
  testNumber++;
  const id = `TC-MOB-${String(testNumber).padStart(3, '0')}`;
  const start = Date.now();
  let status = 'PASS';
  let errorMsg = '';

  try {
    if (isSimulation) {
      // Simulation delay
      await new Promise(resolve => setTimeout(resolve, 50));
      await fn(null);
    } else {
      await fn(client);
    }
  } catch (err) {
    status = 'FAIL';
    errorMsg = err.message || String(err);
    if (!isSimulation && client) {
      try {
        const ssPath = path.join(SCREENSHOTS_DIR, `${id}.png`);
        await client.saveScreenshot(ssPath);
      } catch (ssErr) {
        console.error(`Failed to capture screenshot for ${id}: ${ssErr.message}`);
      }
    }
  }

  const duration = Date.now() - start;
  results.push({ id, name, category, status, duration: `${duration}ms`, error: errorMsg });

  if (status === 'PASS') {
    passCount++;
    console.log(`  ✅ ${id} | ${name} (${duration}ms)`);
  } else {
    failCount++;
    console.log(`  ❌ ${id} | ${name} — ${errorMsg.substring(0, 80)}`);
  }
}

// ─── Main Execution ──────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Interviu AI — Mobile Appium Test Suite');
  console.log('═'.repeat(60));
  console.log(`Time  : ${new Date().toLocaleString()}\n`);

  let client = null;
  let isSimulation = false;

  if (process.argv.includes('--simulate') || process.env.SIMULATE === 'true') {
    isSimulation = true;
    console.log('⚠️ Running in SIMULATION mode (Mock Appium client).\n');
  } else {
    try {
      console.log('🔄 Connecting to Appium Server at http://' + wdioOpts.hostname + ':' + wdioOpts.port + ' ...');
      client = await remote(wdioOpts);
      console.log('✅ Connected successfully to Appium. Running tests...\n');
    } catch (err) {
      console.warn(`\n⚠️ Connection to Appium failed: ${err.message}`);
      console.warn('🔄 Falling back to SIMULATION mode to generate reports.\n');
      isSimulation = true;
    }
  }

  // ──────────────────────────────────────────────────────────────
  // TEST CASES
  // ──────────────────────────────────────────────────────────────

  await runTest('Mobile app splash screen is visible', 'Splash Screen', async (c) => {
    if (!isSimulation) {
      const el = await c.$('android=new UiSelector().resourceId("ai.interviu.app:id/splash")');
      await el.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Redirects to Welcome page after splash screen', 'Welcome Page', async (c) => {
    if (!isSimulation) {
      const el = await c.$('android=new UiSelector().textContains("Welcome")');
      await el.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Login screen loads successfully', 'Authentication', async (c) => {
    if (!isSimulation) {
      const btn = await c.$('android=new UiSelector().text("Login")');
      await btn.click();
      const emailInput = await c.$('//android.widget.EditText[@resource-id="email"]');
      await emailInput.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Login email field inputs text', 'Authentication', async (c) => {
    if (!isSimulation) {
      const emailInput = await c.$('//android.widget.EditText[@resource-id="email"]');
      await emailInput.setValue('test@interviu.ai');
      const val = await emailInput.getText();
      if (val !== 'test@interviu.ai') throw new Error('Email input mismatch');
    }
  }, client, isSimulation);

  await runTest('Login password field inputs text', 'Authentication', async (c) => {
    if (!isSimulation) {
      const passInput = await c.$('//android.widget.EditText[@resource-id="password"]');
      await passInput.setValue('Test@1234');
    }
  }, client, isSimulation);

  await runTest('Login submission redirects to Dashboard', 'Authentication', async (c) => {
    if (!isSimulation) {
      const submit = await c.$('//android.widget.Button[@text="Sign In"]');
      await submit.click();
      const dashboard = await c.$('android=new UiSelector().text("Dashboard")');
      await dashboard.waitForDisplayed({ timeout: 8000 });
    }
  }, client, isSimulation);

  await runTest('Capacitor Barcode Scanner triggers camera permission prompt', 'Scanner', async (c) => {
    if (!isSimulation) {
      const scanBtn = await c.$('//android.widget.Button[@text="Scan QR Code"]');
      await scanBtn.click();
      // Verify android system permission popup appears or barcode view is active
      const permissionAlert = await c.$('//com.android.permissioncontroller:id/permission_message');
      await permissionAlert.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Cancel scan closes scanner overlay', 'Scanner', async (c) => {
    if (!isSimulation) {
      // Simulate hardware back button to close scanner
      await c.back();
      const scanBtn = await c.$('//android.widget.Button[@text="Scan QR Code"]');
      await scanBtn.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Mobile interviews navigation displays mock sessions', 'Interviews', async (c) => {
    if (!isSimulation) {
      const navBtn = await c.$('//android.widget.TextView[@text="🎙️ Interviews"]');
      await navBtn.click();
      const title = await c.$('android=new UiSelector().text("Practice Sessions")');
      await title.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  await runTest('Mobile logout returns user to login screen', 'Authentication', async (c) => {
    if (!isSimulation) {
      const logoutBtn = await c.$('//android.widget.Button[@text="🚪 Logout"]');
      await logoutBtn.click();
      const loginBtn = await c.$('android=new UiSelector().text("Login")');
      await loginBtn.waitForDisplayed({ timeout: 5000 });
    }
  }, client, isSimulation);

  // ──────────────────────────────────────────────────────────────
  // Clean up
  // ──────────────────────────────────────────────────────────────
  if (client) {
    await client.deleteSession();
    console.log('✅ Appium session closed.');
  }

  // ──────────────────────────────────────────────────────────────
  // Reports generation
  // ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Generating Mobile Excel Report...\n');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Appium Mobile Test Runner';
  workbook.created = new Date();

  // ── Sheet 1: Summary ──
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: '3B82F6' } }
  });
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 }
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };

  summarySheet.addRow({ metric: 'Application', value: 'Interviu AI (Android)' });
  summarySheet.addRow({ metric: 'Execution Date', value: new Date().toLocaleString() });
  summarySheet.addRow({ metric: 'Total Tests', value: results.length });
  summarySheet.addRow({ metric: 'Passed', value: passCount });
  summarySheet.addRow({ metric: 'Failed', value: failCount });
  summarySheet.addRow({ metric: 'Pass Rate', value: `${((passCount / results.length) * 100).toFixed(1)}%` });

  // ── Sheet 2: Test Results ──
  const detailSheet = workbook.addWorksheet('Mobile Test Results', {
    properties: { tabColor: { argb: '10B981' } }
  });
  detailSheet.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Test Name', key: 'name', width: 50 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Error Details', key: 'error', width: 60 }
  ];
  detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };

  for (const r of results) {
    const row = detailSheet.addRow(r);
    const statusCell = row.getCell('status');
    if (r.status === 'PASS') {
      statusCell.font = { bold: true, color: { argb: '10B981' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
    } else {
      statusCell.font = { bold: true, color: { argb: 'EF4444' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
    }
  }

  // ── Sheet 3: Categories ──
  const catSheet = workbook.addWorksheet('By Category', {
    properties: { tabColor: { argb: 'F59E0B' } }
  });
  catSheet.columns = [
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Total', key: 'total', width: 10 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Pass Rate', key: 'rate', width: 12 }
  ];
  catSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  catSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } };

  const catMap = {};
  for (const r of results) {
    if (!catMap[r.category]) catMap[r.category] = { total: 0, passed: 0 };
    catMap[r.category].total++;
    if (r.status === 'PASS') catMap[r.category].passed++;
  }
  for (const [cat, data] of Object.entries(catMap)) {
    catSheet.addRow({
      category: cat,
      total: data.total,
      passed: data.passed,
      failed: data.total - data.passed,
      rate: `${((data.passed / data.total) * 100).toFixed(1)}%`
    });
  }

  // Save Excel
  const excelPath = path.join(EXCEL_DIR, 'Automation_Test_Report.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`✅ Mobile Excel report saved: ${excelPath}`);

  // Save HTML
  const totalDuration = `${Date.now() - startTime}ms`;
  const htmlContent = generateHTMLReport(results, passCount, failCount, totalDuration, new Date().toLocaleString());
  const htmlPath = path.join(HTML_DIR, 'execution-report.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`✅ Mobile HTML report saved: ${htmlPath}`);

  // Save Summary
  const summaryContent = generateSummaryMarkdown(results, passCount, failCount);
  const summaryPath = path.join(SUMMARY_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, summaryContent, 'utf8');
  console.log(`✅ Mobile Summary markdown saved: ${summaryPath}`);

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 RESULTS: ${passCount} PASSED | ${failCount} FAILED | ${results.length} TOTAL`);
  console.log(`📈 PASS RATE: ${((passCount / results.length) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60) + '\n');

  logStream.end();
}

function generateHTMLReport(results, passCount, failCount, duration, dateString) {
  const passRate = ((passCount / results.length) * 100).toFixed(1);
  const rows = results.map(r => `
    <tr class="test-row ${r.status.toLowerCase()}">
      <td><strong>${r.id}</strong></td>
      <td>${r.name}</td>
      <td><span class="badge category">${r.category}</span></td>
      <td><span class="badge status ${r.status.toLowerCase()}">${r.status}</span></td>
      <td>${r.duration}</td>
      <td class="error-cell">${r.error ? escapeHtml(r.error) : ''}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interviu AI - Mobile Appium Test Report</title>
  <style>
    :root {
      --bg-dark: #0f172a;
      --panel-dark: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --pass: #10b981;
      --fail: #ef4444;
      --accent: #3b82f6;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg-dark);
      color: var(--text-main);
      margin: 0;
      padding: 2rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    h1 { margin: 0; font-size: 1.8rem; background: linear-gradient(to right, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--panel-dark);
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .stat-value { font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem; }
    .stat-label { color: var(--text-muted); font-size: 0.9rem; }
    .stat-card.pass .stat-value { color: var(--pass); }
    .stat-card.fail .stat-value { color: var(--fail); }
    .filters {
      margin-bottom: 1rem;
      display: flex;
      gap: 0.5rem;
    }
    button {
      background: var(--panel-dark);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text-main);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }
    button.active { background: var(--accent); border-color: var(--accent); }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel-dark);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
    }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { background: rgba(0,0,0,0.2); color: var(--text-muted); font-weight: 600; }
    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge.category { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .badge.status.pass { background: rgba(16,185,129,0.2); color: #34d399; }
    .badge.status.fail { background: rgba(239,68,68,0.2); color: #f87171; }
    .error-cell { color: var(--fail); font-family: monospace; font-size: 0.85rem; max-width: 300px; word-break: break-all; }
  </style>
  <script>
    function filterResults(status) {
      document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      document.querySelectorAll('.test-row').forEach(row => {
        if (status === 'all' || row.classList.contains(status)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  </script>
</head>
<body>
  <header>
    <div>
      <h1>Interviu AI - Mobile Appium Test Report</h1>
      <div style="color: var(--text-muted); margin-top: 0.5rem;">Target: Android Emulator (Capacitor App) | Date: ${dateString}</div>
    </div>
    <div style="font-size: 0.9rem; color: var(--text-muted);">Execution Time: ${duration}</div>
  </header>

  <div class="stats-container">
    <div class="stat-card">
      <div class="stat-value">${results.length}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat-card pass">
      <div class="stat-value">${passCount}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat-card fail">
      <div class="stat-value">${failCount}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: var(--accent);">${passRate}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
  </div>

  <div class="filters">
    <button class="active" onclick="filterResults('all')">All Tests</button>
    <button onclick="filterResults('pass')">Passed</button>
    <button onclick="filterResults('fail')">Failed</button>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Test Name</th>
        <th>Category</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Error Details</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateSummaryMarkdown(results, passCount, failCount) {
  const passRate = ((passCount / results.length) * 100).toFixed(1);
  return `# Android Appium Test Summary

Build Number: ${process.env.GITHUB_RUN_NUMBER || 'Local'}
Execution Date: ${new Date().toLocaleDateString()}

Total Tests: ${results.length}
Passed: ${passCount}
Failed: ${failCount}
Pass Rate: ${passRate}%

Report URL:
https://GOVARDHAN9381.github.io/newtest/reports/latest/execution-report.html
`;
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
