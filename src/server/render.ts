import type { BrowserContext, Page } from "playwright";

import { buildConversationHtml, type ConversationTurn } from "./template.js";

/**
 * Extracts ChatGPT turns from a loaded share page.
 *
 * Relies on the `data-message-author-role` attribute ChatGPT puts on each
 * message wrapper, and the `markdown` content container within it. If the page
 * structure changes this throws `conversation_not_found` so we can detect it.
 */
export async function extractConversation(page: Page): Promise<ConversationTurn[]> {
  const result = await page.evaluate(() => {
    const messageEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-message-author-role]"),
    );
    const turns = messageEls.map((element) => {
      const role = element.getAttribute("data-message-author-role") ?? "unknown";
      const content =
        element.querySelector<HTMLElement>('[class*="markdown" i]') ??
        element.querySelector<HTMLElement>("article") ??
        element;
      return { role, html: content.innerHTML };
    });
    return { turns, found: messageEls.length };
  });

  if (!result.found) {
    throw new Error("conversation_not_found");
  }

  return result.turns;
}

/**
 * Renders extracted turns into our template and returns a full-page PNG.
 * Uses a fresh page in the given context so conversation images keep cookies.
 */
export async function renderConversationToPng(
  context: BrowserContext,
  turns: readonly ConversationTurn[],
): Promise<Uint8Array> {
  const page = await context.newPage();
  try {
    await page.setContent(buildConversationHtml(turns), {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    await page.waitForTimeout(300);
    const png = await page.screenshot({ fullPage: true, type: "png" });
    return new Uint8Array(png);
  } finally {
    await page.close();
  }
}

/**
 * Opens a validated ChatGPT share page, extracts the conversation, renders it
 * in our own template, and returns a full-page PNG.
 */
export async function captureScreenshot(canonicalUrl: string): Promise<Uint8Array> {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 760, height: 1200 },
      deviceScaleFactor: 2,
    });

    const sourcePage = await context.newPage();
    await sourcePage.goto(canonicalUrl, { waitUntil: "networkidle", timeout: 30_000 });
    await sourcePage.waitForTimeout(800);
    const turns = await extractConversation(sourcePage);
    return await renderConversationToPng(context, turns);
  } finally {
    await browser.close();
  }
}

export type CaptureFn = (canonicalUrl: string) => Promise<Uint8Array>;
