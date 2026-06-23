import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Start both backend and frontend before running tests
  webServer: [
    {
      // Backend SSE API — required by backend-sse.spec.ts
      command: 'npm run dev:backend',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: !process.env.CI,
      cwd: '../',
      timeout: 120 * 1000,
    },
    {
      // Frontend Next.js production server thay vì dev server
      command: 'NEXT_PUBLIC_METRICS_SSE_URL=http://127.0.0.1:3001/api/system-metrics npm run start', 
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../frontend', // Đảm bảo trỏ đúng thư mục frontend
      timeout: 120 * 1000,
    }
  ],
});
