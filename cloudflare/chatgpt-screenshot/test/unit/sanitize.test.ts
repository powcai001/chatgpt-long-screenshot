import { describe, expect, it } from "vitest";

import { escapeHtml, sanitizeReadingHtml } from "../../src/server/sanitize.js";

describe("escapeHtml", () => {
  it("escapes all HTML-significant text characters", () => {
    expect(escapeHtml(`<script x="y">Tom & 'Jerry'</script>`)).toBe(
      "&lt;script x=&quot;y&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/script&gt;",
    );
  });
});

describe("sanitizeReadingHtml", () => {
  it("removes interactions and executable markup", () => {
    const result = sanitizeReadingHtml(
      `<div class="x"><p onclick="bad()">正文 <strong>重点</strong></p><button>复制</button><input value="x"><svg><path></path></svg><script>alert(1)</script></div>`,
    );
    expect(result).toContain("<p>正文 <strong>重点</strong></p>");
    expect(result).not.toMatch(/button|input|svg|script|onclick|class=/i);
  });

  it("keeps safe links and removes unsafe protocols", () => {
    expect(sanitizeReadingHtml(`<a href="https://example.com">好</a><a href="javascript:x">坏</a>`)).toBe(
      `<a href="https://example.com">好</a><a>坏</a>`,
    );
  });
});
