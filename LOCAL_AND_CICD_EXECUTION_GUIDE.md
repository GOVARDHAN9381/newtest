# 📖 Local and CI/CD Execution Guide

This document outlines how to execute the E2E web tests (Playwright/Selenium), mobile Appium tests, and security scans locally and via GitHub Actions.

---

## 📂 Project Directory Structure

```
newtest/
├── .github/
│   └── workflows/
│       ├── deploy-and-test.yml   # Builds, deploys, and runs Playwright E2E tests
│       ├── android-e2e.yml       # Builds APK, starts emulator, runs Appium tests, publishes reports
│       └── security-review.yml   # Runs SAST / dependency audit & generates security review sheets
│
├── android-test/
│   ├── package.json              # Appium runner dependencies
│   ├── test-runner-appium.js     # WebdriverIO Appium E2E test script (supports simulated fallback)
│   └── README.md                 # Mobile local run details
│
├── backend/                      # Python FastAPI server codebase
│   ├── routes/                   # API Endpoints
│   └── main.py                   # API Entrypoint
│
├── frontend/                     # React + Vite web app
│   ├── live-test/                # E2E Web test suite
│   │   ├── package.json          # Playwright runner dependencies
│   │   ├── test-runner.js        # Playwright E2E test suite (100 test cases)
│   │   └── verify-deployment.js  # Script to verify live URL before running tests
│   ├── src/                      # App source files
│   └── vite.config.js            # Vite config (configured with subfolder base path)
│
├── security-report-generator.js  # Security review compiler (Markdown + Excel)
├── local-setup.bat               # Windows batch setup tool
└── LOCAL_AND_CICD_EXECUTION_GUIDE.md # This guide
```

---

## 🛠️ Required Repository Settings & Secrets

To ensure the CI/CD workflows run correctly on GitHub, verify the following configurations:

### 1. Enable GitHub Pages
1. Go to your repository on GitHub: `https://github.com/GOVARDHAN9381/newtest`
2. Click **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, choose **Deploy from a branch**.
4. Choose the `gh-pages` branch (it will be created automatically by the workflow) and directory `/ (root)`.
5. Click **Save**.

### 2. Configure Action Permissions
1. Go to **Settings** -> **Actions** -> **General**.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions** (required for the workflows to write/deploy test reports and build files to the `gh-pages` branch).
4. Click **Save**.

### 3. Required Secrets (if using real API keys)
Go to **Settings** -> **Secrets and variables** -> **Actions** and add:
- `SECRET_KEY` (Used by backend session handling)
- `OPENAI_API_KEY` (Used by AI interview services)

---

## 💻 Local Execution Guide

### 1. Run Web E2E Tests (Playwright)
Ensure Node.js is installed locally, then execute:

```bash
# Navigate to web test folder
cd frontend/live-test

# Install dependencies
npm install

# Install Playwright browser engines
npx playwright install chromium

# Run the test suite against a local dev server
npm test

# Run the test suite against a custom live URL
BASE_URL=https://GOVARDHAN9381.github.io/newtest npm test
```

*Outputs will be saved in `Test Results/` in the workspace root.*

---

### 2. Run Mobile Appium Tests
Make sure Android Studio, SDK, an emulator, and Appium are configured locally.

```bash
# Navigate to mobile test folder
cd android-test

# Install dependencies
npm install

# Start Appium server
npm install -g appium
appium driver install uiautomator2
appium --port 4723

# In a separate terminal, execute the test runner
npm test

# To run in SIMULATION/MOCK mode (doesn't require a running emulator)
npm test -- --simulate
```

*Outputs will be saved in `Test Results/` in the workspace root.*

---

### 3. Run Security Scans & Reports
Generate SAST/Dependency reviews and spreadsheets locally:

```bash
# In workspace root
npm install exceljs
node security-report-generator.js
```

*Outputs will be saved in `Vulnerability Test Results/` in the workspace root.*

---

## 🚀 CI/CD Execution Guide

All pipelines run automatically on every `push` and `pull_request` to the `main` branch. They can also be triggered manually using `workflow_dispatch`.

### 1. Web Deployment & E2E Testing Workflow
- **File**: `.github/workflows/deploy-and-test.yml`
- **Actions**:
  1. Builds React assets with prefix `/newtest/`.
  2. Deploys code to `gh-pages` branch.
  3. Polls `https://GOVARDHAN9381.github.io/newtest/` until it returns status code `200`.
  4. Launches Playwright headlessly, executes the 100 test cases, and stores reports in `Test Results/`.
  5. Publishes test summary to the Action run page.

### 2. Mobile Appium E2E & Report Publishing Workflow
- **File**: `.github/workflows/android-e2e.yml`
- **Actions**:
  1. Compiles frontend assets and syncs Capacitor.
  2. Builds Android Debug APK using Gradle.
  3. Launches a headless Android Emulator using `reactivecircus/android-emulator-runner`.
  4. Starts Appium server, runs the mobile test suite, and captures outputs.
  5. Publishes latest report to GitHub Pages at `/reports/latest/execution-report.html`.
  6. Backs up historical report to `/reports/history/build-<number>/execution-report.html`.

### 3. Security Review Workflow
- **File**: `.github/workflows/security-review.yml`
- **Actions**:
  1. Auto-detects Python/FastAPI codebase.
  2. Runs SAST scans using `bandit` and scans packages using `safety` & `npm audit`.
  3. Compiles SAST, inventory, and dependency sheets.
  4. Fails only if any `Critical` severity vulnerabilities are encountered (default is clean).
  5. Renders the executive security summary directly in the GitHub Actions workflow panel.
