import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: {
      mode: "on",
      size: { width: 1920, height: 1080 },
    },
    launchOptions: {
      slowMo: 300,
      args: [
        "--force-device-scale-factor=2",
        "--high-dpi-support=1",
        "--disable-gpu-vsync",
      ],
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});