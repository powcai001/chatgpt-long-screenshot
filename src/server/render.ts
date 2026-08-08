import type { BrowserContext, Page } from "playwright";

import type { RenderJob } from "../shared/api-types.js";
import { renderMarkdown } from "./markdown.js";
import { extractArticle } from "./readability.js";
import { sanitizeReadingHtml } from "./sanitize.js";
import { buildArticleHtml, buildConversationHtml, type ConversationTurn } from "./template.js";

/** Extracts ordered reading content from a loaded ChatGPT share page. */
export async function extractConversation(page: Page): Promise<ConversationTurn[]> {
  const rawTurns = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-message-author-role]")).map((element) => {
      const role = element.getAttribute("data-message-author-role") ?? "unknown";
      const selectors = role === "user"
        ? ['[data-message-content]', '[class*="whitespace-pre-wrap" i]', '[class*="markdown" i]', "article"]
        : ['[class*="markdown" i]', '[data-message-content]', "article"];
      const content = selectors
        .map((selector) => element.querySelector<HTMLElement>(selector))
        .find((candidate) => candidate && candidate.textContent?.trim()) ?? element;
      return { role, html: content.innerHTML };
    }),
  );

  const turns = rawTurns
    .map((turn) => ({ ...turn, html: sanitizeReadingHtml(turn.html) }))
    .filter((turn) => stripMarkup(turn.html).length > 0 || /<img\b/i.test(turn.html));

  if (turns.length === 0) {
    throw new Error("conversation_not_found");
  }
  return turns;
}

/** Renders one self-contained HTML document through the shared screenshot path. */
export async function renderHtmlToPng(context: BrowserContext, html: string): Promise<Uint8Array> {
  const page = await context.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(300);
    // Screenshot only the content container so centered cards do not leave
    // wide blank margins around the formatted area.
    return new Uint8Array(await page.locator(".card, .sheet").screenshot({ type: "png" }));
  } finally {
    await page.close();
  }
}

export async function renderConversationToPng(
  context: BrowserContext,
  turns: readonly ConversationTurn[],
  byline = "",
): Promise<Uint8Array> {
  return renderHtmlToPng(context, buildConversationHtml(turns, byline));
}

/** Renders a ChatGPT conversation, a web article, or a markdown card to PNG. */
export async function captureScreenshot(job: RenderJob): Promise<Uint8Array> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2 });

    if (job.source === "plain-text") {
      return await renderHtmlToPng(context, buildArticleHtml(job.style, undefined, renderMarkdown(job.text), job.byline));
    }

    const page = await context.newPage();
    try {
      await page.goto(job.canonicalUrl, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(800);

      if (job.source === "web-link") {
        const article = await extractArticle(page);
        return await renderHtmlToPng(context, buildArticleHtml(job.style, article.title, article.contentHtml, job.byline));
      }

      return await renderConversationToPng(context, await extractConversation(page), job.byline);
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

export type CaptureFn = (job: RenderJob) => Promise<Uint8Array>;

function stripMarkup(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();
}
