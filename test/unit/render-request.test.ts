import { describe, expect, it } from "vitest";

import { MAX_TEXT_CODE_POINTS, normalizePlainText, normalizeRenderRequest } from "../../src/server/render-request.js";
import { listStyles, resolveStyle } from "../../src/server/styles.js";

const VALID = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";

describe("render styles", () => {
  it("lists one style per source", () => {
    expect(listStyles("chatgpt-share")).toEqual([
      { id: "conversation-clean", label: "简洁对话", source: "chatgpt-share" },
    ]);
    expect(listStyles("plain-text")).toEqual([
      { id: "text-card", label: "文字卡片", source: "plain-text" },
    ]);
  });

  it("resolves defaults and rejects incompatible styles", () => {
    expect(resolveStyle("chatgpt-share")).toBe("conversation-clean");
    expect(resolveStyle("plain-text")).toBe("text-card");
    expect(() => resolveStyle("plain-text", "conversation-clean")).toThrow("unsupported_style");
  });
});

describe("normalizePlainText", () => {
  it("normalizes outer whitespace and line endings while keeping paragraphs", () => {
    expect(normalizePlainText("  第一行\r\n\r第二行  ")).toBe("第一行\n\n第二行");
  });

  it("counts Unicode code points", () => {
    const accepted = "😀".repeat(MAX_TEXT_CODE_POINTS);
    expect(normalizePlainText(accepted)).toBe(accepted);
    expect(() => normalizePlainText(`${accepted}a`)).toThrow("text_too_long");
  });

  it("rejects empty or non-string text", () => {
    expect(() => normalizePlainText(" \n ")).toThrow("invalid_text");
    expect(() => normalizePlainText(null)).toThrow("invalid_text");
  });
});

describe("normalizeRenderRequest", () => {
  it("normalizes legacy URL requests", () => {
    expect(normalizeRenderRequest({ url: VALID })).toEqual({
      source: "chatgpt-share",
      canonicalUrl: VALID,
      style: "conversation-clean",
    });
  });

  it("normalizes a plain-text request", () => {
    expect(
      normalizeRenderRequest({ source: "plain-text", text: "  一段文字  ", style: "text-card" }),
    ).toEqual({ source: "plain-text", text: "一段文字", style: "text-card" });
  });

  it("rejects unknown request shapes", () => {
    expect(() => normalizeRenderRequest({ source: "other", text: "x" })).toThrow("invalid_request");
    expect(() => normalizeRenderRequest({ source: "plain-text", text: "x", style: "conversation-clean" })).toThrow(
      "unsupported_style",
    );
  });
});
