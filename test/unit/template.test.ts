import { describe, expect, it } from "vitest";

import { buildConversationHtml } from "../../src/server/template.js";

describe("buildConversationHtml", () => {
  it("renders each turn with a role label and its content", () => {
    const html = buildConversationHtml([
      { role: "user", html: "<p>讲一下递归</p>" },
      { role: "assistant", html: "<p>递归是<span>函数调用自身</span>。</p><pre><code>def f():</code></pre>" },
    ]);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("你");
    expect(html).toContain("ChatGPT");
    expect(html).toContain("讲一下递归");
    expect(html).toContain("函数调用自身");
    expect(html).toContain("<pre>");
    expect(html).toContain("turn-user");
    expect(html).toContain("turn-assistant");
  });

  it("marks unknown roles with the raw role value", () => {
    const html = buildConversationHtml([{ role: "tool", html: "<p>x</p>" }]);
    expect(html).toContain(">tool<");
  });
});
