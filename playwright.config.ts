import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

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
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'learning', testDir: './tests/learning' },
    { name: 'chromium', testDir: './tests/ui', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: './tests/ui', grep: /@smoke/, dependencies: ['setup'], use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: './tests/ui', grep: /@smoke/, dependencies: ['setup'], use: { ...devices['Desktop Safari'] } },
    { name: 'api', testDir: './tests/api', use: { baseURL: env.apiBaseUrl } },
    { name: 'db', testDir: './tests/db' },
  ],
});