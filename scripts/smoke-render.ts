/**
 * Local smoke test for the extract → render → screenshot pipeline.
 *
 * Loads a synthetic page that mimics ChatGPT's share DOM (no real conversation,
 * no network) and confirms extraction, template rendering and PNG output all
 * work. Run with: pnpm tsx scripts/smoke-render.ts
 */
import { extractConversation, renderConversationToPng } from "../src/server/render.js";

const fixture = `<!doctype html>
<html><body>
  <div class="nav">should be ignored</div>
  <div data-message-author-role="user">
    <div class="markdown prose"><p>用 Python 写一个快速排序，并说明复杂度。</p></div>
  </div>
  <div data-message-author-role="assistant">
    <div class="markdown">
      <p>这是快速排序的实现：</p>
      <pre><code>def quicksort(a):
    if len(a) &lt;= 1:
        return a
    pivot = a[0]
    less = [x for x in a[1:] if x &lt; pivot]
    more = [x for x in a[1:] if x &gt;= pivot]
    return quicksort(less) + [pivot] + quicksort(more)</code></pre>
      <ul>
        <li>平均时间复杂度 <strong>O(n log n)</strong></li>
        <li>最坏 O(n²)，发生在已排序输入上</li>
      </ul>
    </div>
  </div>
</body></html>`;

const { chromium } = await import("playwright");

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 760, height: 1200 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.setContent(fixture, { waitUntil: "load" });

  const turns = await extractConversation(page);
  const png = await renderConversationToPng(context, turns);

  const signatureOk =
    png.length > 1000 && png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47;

  console.log(
    JSON.stringify(
      {
        turns: turns.length,
        roles: turns.map((turn) => turn.role),
        bytes: png.length,
        pngSignature: signatureOk,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
