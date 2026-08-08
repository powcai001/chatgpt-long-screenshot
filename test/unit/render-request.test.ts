import { describe, expect, it } from "vitest";

import { MAX_TEXT_CODE_POINTS, normalizeByline, normalizePlainText, normalizeRenderRequest, validateWebUrl } from "../../src/server/render-request.js";

const CHATGPT = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";
const ARTICLE = "https://example.com/post/why-recursion";

describe("validateWebUrl", () => {
  it("accepts http(s) URLs without credentials", () => {
    expect(validateWebUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(validateWebUrl("http://example.com/a")).toBe("http://example.com/a");
  });
  it("rejects non-http and credentials", () => {
    expect(() => validateWebUrl("file:///etc/passwd")).toThrow("unsupported_url");
    expect(() => validateWebUrl("javascript:alert(1)")).toThrow("unsupported_url");
    expect(() => validateWebUrl("https://user:pass@example.com")).toThrow("unsupported_url");
    expect(() => validateWebUrl("not a url")).toThrow("unsupported_url");
  });
});

describe("normalizePlainText", () => {
  it("normalizes whitespace and counts code points", () => {
    expect(normalizePlainText("  第一行\r\n\r第二行  ")).toBe("第一行\n\n第二行");
    const accepted = "😀".repeat(MAX_TEXT_CODE_POINTS);
    expect(normalizePlainText(accepted)).toBe(accepted);
    expect(() => normalizePlainText(`${accepted}a`)).toThrow("text_too_long");
  });
  it("rejects empty or non-string text", () => {
    expect(() => normalizePlainText(" \n ")).toThrow("invalid_text");
    expect(() => normalizePlainText(null)).toThrow("invalid_text");
  });
});

describe("normalizeByline", () => {
  it("trims, caps to 50 code points, and returns empty for non-strings", () => {
    expect(normalizeByline("  powercai  ")).toBe("powercai");
    expect(normalizeByline("来自于知乎分享")).toBe("来自于知乎分享");
    expect(normalizeByline(`${"a".repeat(60)}`)).toHaveLength(50);
    expect(normalizeByline(undefined)).toBe("");
  });
});

describe("normalizeRenderRequest", () => {
  it("routes legacy ChatGPT URLs to the conversation source", () => {
    expect(normalizeRenderRequest({ url: CHATGPT })).toEqual({
      source: "chatgpt-share", canonicalUrl: CHATGPT, style: "conversation-clean", byline: "",
    });
  });

  it("routes legacy non-ChatGPT URLs to the web-link source", () => {
    expect(normalizeRenderRequest({ url: ARTICLE })).toEqual({
      source: "web-link", canonicalUrl: ARTICLE, style: "article-clean", byline: "",
    });
  });

  it("normalizes explicit web-link and plain-text requests with byline", () => {
    expect(normalizeRenderRequest({ source: "web-link", url: ARTICLE, style: "article-apple", byline: "  powercai " })).toEqual({
      source: "web-link", canonicalUrl: ARTICLE, style: "article-apple", byline: "powercai",
    });
    expect(normalizeRenderRequest({ source: "plain-text", text: "  一段文字  " })).toEqual({
      source: "plain-text", text: "一段文字", style: "article-clean", byline: "",
    });
  });

  it("rejects bad URLs and unknown shapes", () => {
    expect(() => normalizeRenderRequest({ source: "web-link", url: "ftp://x" })).toThrow("unsupported_url");
    expect(() => normalizeRenderRequest({ source: "plain-text", text: "x", style: "conversation-clean" })).toThrow(
      "unsupported_style",
    );
    expect(() => normalizeRenderRequest({ source: "other", text: "x" })).toThrow("invalid_request");
  });
});
