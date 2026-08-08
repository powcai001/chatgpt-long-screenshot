import { describe, expect, it } from "vitest";

import type { ArticleTheme } from "../../src/shared/api-types";
import { buildArticleHtml, buildConversationHtml } from "../../src/server/template.js";

const THEMES: ArticleTheme[] = ["article-clean", "article-apple", "article-dark", "article-magazine", "article-social"];

describe("buildConversationHtml", () => {
  it("renders turns in the conversation layout", () => {
    const html = buildConversationHtml([{ role: "user", html: "<p>讲一下递归</p>" }]);
    expect(html).toContain("你");
    expect(html).toContain("turn-user");
    expect(html).toContain("font-size: 18px");
  });
});

describe("buildArticleHtml", () => {
  it.each(THEMES)("renders the %s theme with title, body and footer", (theme) => {
    const html = buildArticleHtml(theme, "标题", "<p>正文</p>");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("标题");
    expect(html).toContain("正文");
    expect(html).toContain("聊天长截图");
    expect(html).toContain(`class="card"`);
  });

  it("escapes the title and body is not double-escaped for trusted html", () => {
    const html = buildArticleHtml("article-clean", "A & B <c>", "<p>ok</p>");
    expect(html).toContain("A &amp; B &lt;c&gt;");
  });

  it("omits the title block when there is no title", () => {
    const html = buildArticleHtml("article-apple", undefined, "<p>正文</p>");
    expect(html).not.toContain("class=\"title\"");
  });
});
