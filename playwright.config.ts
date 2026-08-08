import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "pnpm start",
    url: "http://127.0.0.1:4173",
    // In CI nothing is running, so a fresh production server is started.
    // Locally, reuse an already-running dev server instead of fighting the port.
    reuseExistingServer: !process.env.CI,
  },
});
