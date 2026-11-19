import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

//session file written by tests/setup/auth.setup.ts (git-ignored: playwright/.auth/)
const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,          // retry a failed test (2 on CI, 1 locally)
  workers: process.env.CI ? 2 : 4,          // tests running at the same time
  timeout: 60_000,                          // max time for one test
  expect: { timeout: 10_000 },              // max wait for one assertion

  reporter: [
    ['list'],                               // console
    ['html', { open: 'never' }],            // playwright-report/
    ['junit', { outputFile: 'test-results/junit.xml' }], // Azure DevOps / CI
    ['allure-playwright'],                  // allure-results/
  ],

  use: {
    baseURL: env.uiBaseUrl,
    testIdAttribute: 'data-test',           // Sauce Demo uses data-test="..."
    headless: true,
    screenshot: 'only-on-failure',          // screenshot for failed tests
    video: 'retain-on-failure',             // video kept only for failed tests
    trace: 'retain-on-failure',             // trace for the trace viewer
    actionTimeout: 15_000,
  },

  projects: [
    // 1) runs first: logs in once and saves the session
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    { name: 'learning', testDir: './tests/learning' },

    // 2) browser projects wait for 'setup', then start every test already logged in
    { name: 'chromium', testDir: './tests/ui', dependencies: ['setup'], use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE } },
    { name: 'firefox', testDir: './tests/ui', grep: /@smoke/, dependencies: ['setup'], use: { ...devices['Desktop Firefox'], storageState: AUTH_FILE } },
    { name: 'webkit', testDir: './tests/ui', grep: /@smoke/, dependencies: ['setup'], use: { ...devices['Desktop Safari'], storageState: AUTH_FILE } },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: env.apiBaseUrl,                              // request.get('/booking') = API base URL + /booking
        extraHTTPHeaders: { Accept: 'application/json' },     // ask the server for JSON on every request
      },
    },
    { name: 'db', testDir: './tests/db' },
  ],
});