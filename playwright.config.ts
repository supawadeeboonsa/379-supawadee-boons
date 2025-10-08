import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.APP_URL || 'http://localhost:9000', // ใช้ baseURL
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'quasar dev',                  // รัน Quasar dev server
    url: process.env.APP_URL || 'http://localhost:9000', // URL ที่รอให้พร้อม
    reuseExistingServer: true,             // ถ้ามี server อยู่แล้วจะไม่สร้างใหม่
    timeout: 60000,                         // รอ server นาน 60 วินาที
    stdout: 'pipe',                         // แสดง log ของ server
    stderr: 'pipe',
  },
});
