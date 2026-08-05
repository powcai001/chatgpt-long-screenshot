/**
 * Captures a full-page PNG screenshot of a validated ChatGPT share page.
 *
 * The URL must already pass strict validation before reaching this function.
 * Returns a PNG byte buffer.
 */
export async function captureScreenshot(canonicalUrl: string): Promise<Uint8Array> {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto(canonicalUrl, { waitUntil: "networkidle", timeout: 30_000 });
    // Brief settle so lazy-loaded messages and dynamic height stabilize.
    await page.waitForTimeout(800);

    const png = await page.screenshot({ fullPage: true, type: "png" });
    return new Uint8Array(png);
  } finally {
    await browser.close();
  }
}

export type CaptureFn = (canonicalUrl: string) => Promise<Uint8Array>;
