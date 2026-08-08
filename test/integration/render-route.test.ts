import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/server/app.js";

const VALID = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";
const fakePng = () => Uint8Array.of(0x89, 0x50, 0x4e, 0x47);

describe("POST /api/render", () => {
  it("keeps legacy URL requests working", async () => {
    const capture = vi.fn(async () => fakePng());
    const res = await request(createApp({ production: false, capture }))
      .post("/api/render")
      .send({ url: VALID });

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("image/png");
    expect(res.header["cache-control"]).toBe("no-store");
    expect(capture).toHaveBeenCalledWith({
      source: "chatgpt-share",
      canonicalUrl: VALID,
      style: "conversation-clean",
    });
  });

  it("accepts the explicit ChatGPT source request", async () => {
    const capture = vi.fn(async () => fakePng());
    const res = await request(createApp({ production: false, capture }))
      .post("/api/render")
      .send({ source: "chatgpt-share", url: VALID, style: "conversation-clean" });

    expect(res.status).toBe(200);
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ source: "chatgpt-share" }));
  });

  it("accepts normalized plain text", async () => {
    const capture = vi.fn(async () => fakePng());
    const res = await request(createApp({ production: false, capture }))
      .post("/api/render")
      .send({ source: "plain-text", text: "  第一段\r\n\r\n第二段  ", style: "text-card" });

    expect(res.status).toBe(200);
    expect(capture).toHaveBeenCalledWith({
      source: "plain-text",
      text: "第一段\n\n第二段",
      style: "text-card",
    });
  });

  it.each([
    [{ source: "plain-text", text: "  " }, "invalid_text"],
    [{ source: "plain-text", text: "x".repeat(2001) }, "text_too_long"],
    [{ source: "plain-text", text: "x", style: "conversation-clean" }, "unsupported_style"],
    [{ source: "chatgpt-share", url: "https://example.com" }, "unsupported_share_url"],
    [{ source: "other", text: "x" }, "invalid_request"],
  ])("rejects invalid request %#", async (payload, code) => {
    const capture = vi.fn();
    const res = await request(createApp({ production: false, capture }))
      .post("/api/render")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: code });
    expect(capture).not.toHaveBeenCalled();
  });

  it("returns 502 when rendering fails", async () => {
    const capture = vi.fn(async () => { throw new Error("boom"); });
    const res = await request(createApp({ production: false, capture }))
      .post("/api/render")
      .send({ source: "plain-text", text: "文字" });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "browser_unavailable" });
  });

  it("rejects an oversized body", async () => {
    const res = await request(createApp({ production: false, capture: async () => fakePng() }))
      .post("/api/render")
      .send({ source: "plain-text", text: "x".repeat(20_000) });
    expect(res.status).toBe(413);
  });
});
