import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0, reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:3117', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: { command: 'npm run start --prefix examples/nextjs-demo -- --port 3117 --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3117', reuseExistingServer: !process.env.CI }
});
