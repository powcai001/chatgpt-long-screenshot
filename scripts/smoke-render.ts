/**
 * Local smoke test for the render pipeline. Runs both the ChatGPT
 * conversation path (synthetic DOM, no network) and the plain-text card path,
 * and reports PNG sizes without writing any conversation content to disk.
 *
 * Run with: pnpm tsx scripts/smoke-render.ts
 */
import type { RenderJob } from "../src/shared/api-types.js";
import { captureScreenshot, extractConversation, renderConversationToPng } from "../src/server/render.js";

const chatgptFixture = `<!doctype html><html><body>
  <nav class="nav">ignored</nav>
  <div data-message-author-role="user"><div class="whitespace-pre-wrap">用三句话讲清楚什么是对称加密。</div></div>
  <div data-message-author-role="assistant"><div class="markdown">
    <p>对称加密指<strong>加密和解密使用同一把密钥</strong>的算法。</p>
    <ul><li>速度快，适合大数据量；</li><li>密钥需要双方事先安全共享。</li></ul>
    <p>常见算法有 AES、ChaCha20。</p>
    <button class="copy">复制</button>
  </div></div>
</body></html>`;

const plainTextJob: RenderJob = {
  source: "plain-text",
  text: "日常里那些看似重复的小事，其实都在悄悄塑造我们。\n\n早起、读书、散步，没有哪一件能立刻改变生活，但坚持下来就会让人不同。",
  style: "text-card",
};

function checkPng(name: string, png: Uint8Array, minBytes: number) {
  const ok = png.length > minBytes && png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47;
  if (!ok) throw new Error(`${name} produced an invalid PNG`);
  return { name, bytes: png.length };
}

const { chromium } = await import("playwright");

const browser = await chromium.launch({ headless: true });
try {
  const reports = [];

  const context = await browser.newContext({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2 });

  const source = await context.newPage();
  await source.setContent(chatgptFixture, { waitUntil: "load" });
  const turns = await extractConversation(source);
  const conversationPng = await renderConversationToPng(context, turns);
  reports.push({ ...checkPng("conversation-clean", conversationPng, 8_000), turns: turns.length });
  await source.close();

  await browser.close();

  const plainTextPng = await captureScreenshot(plainTextJob);
  reports.push({ ...checkPng("text-card", plainTextPng, 6_000), chars: Array.from(plainTextJob.text).length });

  console.log(JSON.stringify(reports, null, 2));
} catch (error) {
  await browser.close().catch(() => undefined);
  throw error;
}
