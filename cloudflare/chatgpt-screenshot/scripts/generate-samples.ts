/**
 * Renders one sample PNG per registered style into src/web/public/samples so
 * the style picker can show real previews. Re-run when templates change.
 *
 *   pnpm tsx scripts/generate-samples.ts
 */
import { writeFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { RENDER_STYLE_OPTIONS } from "../src/shared/api-types.js";
import { renderMarkdown } from "../src/server/markdown.js";
import { renderConversationToPng, renderHtmlToPng } from "../src/server/render.js";
import { buildArticleHtml } from "../src/server/template.js";

const outDir = resolve("src/web/public/samples");
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const sampleBody = renderMarkdown(
  [
    "# 把日常写成一张图",
    "",
    "分享卡片让 **文字** 更有质感，也更容易被读完。",
    "",
    "- 简洁",
    "- 优雅",
    "- 易读",
    "",
    "> 好的排版，本身就是内容的一部分。",
  ].join("\n"),
);

const sampleTurns = [
  { role: "user", html: "<p>用一句话介绍递归。</p>" },
  { role: "assistant", html: "<p>递归是 <strong>函数调用自身</strong> 来解决更小同类问题的技巧。</p>" },
];

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2 });

  for (const option of RENDER_STYLE_OPTIONS) {
    const png =
      option.id === "conversation-clean"
        ? await renderConversationToPng(context, sampleTurns)
        : await renderHtmlToPng(context, buildArticleHtml(option.id, "把日常写成一张图", sampleBody));

    const file = resolve(outDir, `${option.id}.png`);
    writeFileSync(file, png);
    console.log(`wrote ${file} (${png.length} bytes)`);
  }
} finally {
  await browser.close();
}
