/**
 * Local smoke test for the render pipeline. Exercises the conversation,
 * markdown-text and reader-mode article paths against synthetic fixtures
 * (no network), reporting PNG sizes without writing content to disk.
 *
 * Run with: pnpm tsx scripts/smoke-render.ts
 */
import type { RenderJob } from "../src/shared/api-types.js";
import { renderHtmlToPng, captureScreenshot, extractConversation, renderConversationToPng } from "../src/server/render.js";
import { extractArticleFromHtml } from "../src/server/readability.js";
import { buildArticleHtml } from "../src/server/template.js";

const chatgptFixture = `<!doctype html><html><body>
  <div data-message-author-role="user"><div class="whitespace-pre-wrap">用三句话讲清楚什么是对称加密。</div></div>
  <div data-message-author-role="assistant"><div class="markdown">
    <p>对称加密指<strong>加密和解密使用同一把密钥</strong>的算法。</p>
    <ul><li>速度快，适合大数据量；</li><li>密钥需要双方事先安全共享。</li></ul>
    <button class="copy">复制</button>
  </div></div>
</body></html>`;

const articleFixture = `<!doctype html><html><head><title>为什么递归好用</title></head><body>
  <nav>首页 关于</nav>
  <article><h1>为什么递归好用</h1>
  <p>递归是一种函数调用自身的技巧，它能让许多问题变得更清晰。</p>
  <p>适合分治、树遍历和回溯等场景。</p>
  <ul><li>分治</li><li>树遍历</li></ul></article>
  <footer>版权</footer>
</body></html>`;

const markdownJob: RenderJob = {
  source: "plain-text",
  text: "# 小记\n\n日常里那些**重复的小事**，其实都在悄悄塑造我们。\n\n- 早起\n- 读书\n- 散步",
  style: "article-apple",
  byline: "powercai",
};

const darkJob: RenderJob = {
  source: "plain-text",
  text: "深色模式下，代码与长文更护眼。\n\n```\nconsole.log('hi');\n```",
  style: "article-dark",
  byline: "来自于知乎分享",
};

function checkPng(name: string, png: Uint8Array, minBytes: number) {
  const ok = png.length > minBytes && png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47;
  if (!ok) throw new Error(`${name} produced an invalid PNG`);
  return { name, bytes: png.length };
}

const { chromium } = await import("playwright");
const reports = [];
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2 });

  const source = await context.newPage();
  await source.setContent(chatgptFixture, { waitUntil: "load" });
  const turns = await extractConversation(source);
  reports.push({ ...checkPng("conversation-clean", await renderConversationToPng(context, turns), 8_000), turns: turns.length });
  await source.close();

  const article = extractArticleFromHtml(articleFixture);
  reports.push({ ...checkPng("article-magazine", await renderHtmlToPng(context, buildArticleHtml("article-magazine", article.title, article.contentHtml)), 8_000), title: article.title });

  await browser.close();

  reports.push({ ...checkPng("markdown-apple", await captureScreenshot(markdownJob), 6_000) });
  reports.push({ ...checkPng("text-dark", await captureScreenshot(darkJob), 6_000) });

  console.log(JSON.stringify(reports, null, 2));
} catch (error) {
  await browser.close().catch(() => undefined);
  throw error;
}
