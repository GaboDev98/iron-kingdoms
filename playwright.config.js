import { defineConfig, devices } from '@playwright/test';

// WebGL runs in headless Chromium through SwiftShader (software rendering).
const webgl = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];

// Playwright ships no Chromium build for macOS 12 and older. Set PW_CHANNEL=chrome
// to run the suite against a locally installed browser instead. CI leaves it unset
// and uses the bundled Chromium.
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  // Software WebGL renders at a few frames per second and every action waits on
  // frames, so a whole spec can take well over a minute on a slow machine.
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: webgl },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel, launchOptions: { args: webgl } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel, launchOptions: { args: webgl } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
