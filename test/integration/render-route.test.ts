import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/server/app.js";
import type { RenderJob } from "../../src/shared/api-types";

const CHATGPT = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";
const ARTICLE = "https://example.com/post";
const fakePng = () => Uint8Array.of(0x89, 0x50, 0x4e, 0x47);

function withCapture(impl: (job: RenderJob) => Promise<Uint8Array>) {
  const capture = vi.fn(impl);
  return { capture, app: createApp({ production: false, capture }) };
}

describe("POST /api/render", () => {
  it("keeps legacy ChatGPT URLs working", async () => {
    const { capture, app } = withCapture(async () => fakePng());
    const res = await request(app).post("/api/render").send({ url: CHATGPT });
    expect(res.status).toBe(200);
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ source: "chatgpt-share" }));
  });

  it("accepts a web-link request and forwards the normalized job", async () => {
    const { capture, app } = withCapture(async () => fakePng());
    const res = await request(app)
      .post("/api/render")
      .send({ source: "web-link", url: ARTICLE, style: "article-apple", byline: "powercai" });
    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("image/png");
    expect(capture).toHaveBeenCalledWith({ source: "web-link", canonicalUrl: ARTICLE, style: "article-apple", byline: "powercai" });
  });

  it("accepts a markdown plain-text request", async () => {
    const { capture, app } = withCapture(async () => fakePng());
    const res = await request(app)
      .post("/api/render")
      .send({ source: "plain-text", text: "# 标题\n正文", style: "article-dark" });
    expect(res.status).toBe(200);
    expect(capture).toHaveBeenCalledWith({ source: "plain-text", text: "# 标题\n正文", style: "article-dark", byline: "" });
  });

  it.each([
    [{ source: "web-link", url: "ftp://x" }, "unsupported_url"],
    [{ source: "plain-text", text: "  " }, "invalid_text"],
    [{ source: "plain-text", text: "x", style: "conversation-clean" }, "unsupported_style"],
    [{ source: "web-link", url: "https://x.com", style: "conversation-clean" }, "unsupported_style"],
  ])("rejects invalid request %#", async (payload, code) => {
    const { app } = withCapture(async () => fakePng());
    const res = await request(app).post("/api/render").send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: code });
  });

  it("returns 422 when an article cannot be found", async () => {
    const { app } = withCapture(async () => { throw new Error("article_not_found"); });
    const res = await request(app).post("/api/render").send({ source: "web-link", url: ARTICLE });
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: "article_not_found" });
  });

  it("returns 502 on unexpected render failures", async () => {
    const { app } = withCapture(async () => { throw new Error("boom"); });
    const res = await request(app).post("/api/render").send({ source: "plain-text", text: "文字" });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "browser_unavailable" });
  });
});
