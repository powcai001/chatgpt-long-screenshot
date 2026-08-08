import { describe, expect, it } from "vitest";

import { renderMarkdown } from "../../src/server/markdown.js";

describe("renderMarkdown", () => {
  it("renders headings, emphasis, lists, code and links", () => {
    const html = renderMarkdown("# 标题\n\n**重点** 与 *斜体*。\n\n- 一\n- 二\n\n[链接](https://example.com)\n\n```\ncode\n```");
    expect(html).toContain("<h1>标题</h1>");
    expect(html).toContain("<strong>重点</strong>");
    expect(html).toContain("<em>斜体</em>");
    expect(html).toContain("<li>一</li>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<pre><code>");
    expect(html).toContain("code");
  });

  it("strips scripts and event handlers from raw HTML in markdown", () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n点击 <a onclick="bad()" href="javascript:x">这里</a>');
    expect(html).not.toMatch(/script|onclick|javascript:/i);
    expect(html).toContain("这里");
  });
});
