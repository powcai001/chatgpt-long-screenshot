import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { Page } from "playwright";

import { sanitizeReadingHtml } from "./sanitize.js";

export interface ExtractedArticle {
  readonly title: string;
  readonly contentHtml: string;
}

/** Loads a page in Playwright and extracts a reader-mode article. */
export async function extractArticle(page: Page): Promise<ExtractedArticle> {
  const html = await page.content();
  return extractArticleFromHtml(html, page.url());
}

/** Extracts a reader-mode article from raw HTML (used by tests). */
export function extractArticleFromHtml(html: string, url = "https://example.com/article"): ExtractedArticle {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article || !article.content) {
    throw new Error("article_not_found");
  }
  return {
    title: (article.title ?? "").trim(),
    contentHtml: sanitizeReadingHtml(article.content),
  };
}
