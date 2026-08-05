import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../src/server/app.js";

const VALID = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";
const fakePng = () => Uint8Array.of(0x89, 0x50, 0x4e, 0x47);

describe("POST /api/render", () => {
  it("returns a PNG for a valid share URL", async () => {
    const capture = vi.fn(async () => fakePng());
    const app = createApp({ production: false, capture });

    const res = await request(app).post("/api/render").send({ url: VALID });

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toBe("image/png");
    expect(res.header["cache-control"]).toBe("no-store");
    expect(capture).toHaveBeenCalledWith(VALID);
  });

  it("rejects an unsupported URL with 400 and never launches the browser", async () => {
    const capture = vi.fn();
    const app = createApp({ production: false, capture });

    const res = await request(app).post("/api/render").send({ url: "https://example.com/x" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "unsupported_share_url" });
    expect(capture).not.toHaveBeenCalled();
  });

  it("rejects a missing url field with 400", async () => {
    const app = createApp({ production: false, capture: async () => fakePng() });

    const res = await request(app).post("/api/render").send({});

    expect(res.status).toBe(400);
  });

  it("returns 502 when the browser fails", async () => {
    const app = createApp({
      production: false,
      capture: async () => {
        throw new Error("boom");
      },
    });

    const res = await request(app).post("/api/render").send({ url: VALID });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "browser_unavailable" });
  });

  it("rejects an oversized body", async () => {
    const app = createApp({ production: false, capture: async () => fakePng() });

    const res = await request(app).post("/api/render").send({ url: "x".repeat(20_000) });

    expect(res.status).toBe(413);
  });
});
