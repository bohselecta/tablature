import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
export default defineConfig({
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 20000,
  },
  testDir: "./browser-tests",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: {
      executablePath:
        process.env.FD_CHROMIUM_PATH || (await chromium.executablePath()),
      args: [
        ...chromium.args.filter(
          (a) =>
            ![
              "--single-process",
              "--disable-web-security",
              "--allow-running-insecure-content",
            ].includes(a),
        ),
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
});
