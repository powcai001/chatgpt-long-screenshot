import { describe, expect, it } from "vitest";

import { extractArticleFromHtml } from "../../src/server/readability.js";

const articleHtml = `
<!doctype html><html><head><title>为什么递归好用</title></head><body>
  <nav>首页 关于 联系</nav>
  <article>
    <h1>为什么递归好用</h1>
    <p>递归是一种函数调用自身的技巧，它能让许多问题变得更清晰。</p>
    <p>适合分治、树遍历和回溯等场景。<a href="https://example.com">更多</a></p>
    <ul><li>分治</li><li>树遍历</li></ul>
  </article>
  <footer>版权</footer>
</body></html>`;

describe("extractArticleFromHtml", () => {
  it("extracts the title and reading content", () => {
    const article = extractArticleFromHtml(articleHtml);
    expect(article.title).toBe("为什么递归好用");
    expect(article.contentHtml).toContain("递归是一种函数调用自身的技巧");
    expect(article.contentHtml).toContain("分治");
  });

  it("throws when the page has no article", () => {
    expect(() => extractArticleFromHtml("<html><body></body></html>")).toThrow("article_not_found");
  });
});
