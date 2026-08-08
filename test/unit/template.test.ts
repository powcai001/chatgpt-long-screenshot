import { describe, expect, it } from "vitest";

import { buildConversationHtml, buildTextCardHtml } from "../../src/server/template.js";

describe("buildConversationHtml", () => {
  it("renders turns in a larger, compact reading layout", () => {
    const html = buildConversationHtml([
      { role: "user", html: "<p>讲一下递归</p>" },
      { role: "assistant", html: "<p>递归是<strong>函数调用自身</strong>。</p><pre><code>def f():</code></pre>" },
    ]);

    expect(html).toContain("你");
    expect(html).toContain("ChatGPT");
    expect(html).toContain("讲一下递归");
    expect(html).toContain("font-size: 18px");
    expect(html).toContain("padding: 15px 0");
    expect(html).toContain("turn-user");
  });
});

describe("buildTextCardHtml", () => {
  it("renders escaped text and preserves line breaks through CSS", () => {
    const html = buildTextCardHtml(`第一段\n\n<script>alert("x")</script> & 结束`);

    expect(html).toContain("文字分享");
    expect(html).toContain("white-space: pre-wrap");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; 结束");
    expect(html).not.toContain(`<script>alert("x")</script>`);
  });
});
