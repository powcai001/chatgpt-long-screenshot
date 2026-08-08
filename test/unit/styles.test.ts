import { describe, expect, it } from "vitest";

import { listStyles, resolveStyle } from "../../src/server/styles.js";

describe("render styles", () => {
  it("exposes one conversation style and five shared article themes", () => {
    expect(listStyles("chatgpt-share").map((s) => s.id)).toEqual(["conversation-clean"]);
    expect(listStyles("web-link").map((s) => s.id)).toEqual([
      "article-liuguang", "article-clean", "article-apple", "article-dark", "article-magazine", "article-social",
    ]);
    expect(listStyles("plain-text").map((s) => s.id)).toEqual([
      "article-liuguang", "article-clean", "article-apple", "article-dark", "article-magazine", "article-social",
    ]);
  });

  it("resolves defaults and rejects incompatible styles", () => {
    expect(resolveStyle("chatgpt-share")).toBe("conversation-clean");
    expect(resolveStyle("web-link")).toBe("article-liuguang");
    expect(resolveStyle("plain-text")).toBe("article-liuguang");
    expect(() => resolveStyle("chatgpt-share", "article-clean")).toThrow("unsupported_style");
    expect(() => resolveStyle("plain-text", "conversation-clean")).toThrow("unsupported_style");
  });
});
