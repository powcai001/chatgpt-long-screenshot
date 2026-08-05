import type { Express } from "express";
import express from "express";
import type { ViteDevServer } from "vite";

import { validateChatGptShareUrl } from "./security/url-validator.js";
import { captureScreenshot, type CaptureFn } from "./render.js";

export interface CreateAppOptions {
  production: boolean;
  vite?: ViteDevServer;
  /** Injectable for tests; defaults to the real Playwright capture. */
  capture?: CaptureFn;
}

const NO_STORE = "no-store";

export function createApp({ production, vite, capture = captureScreenshot }: CreateAppOptions): Express {
  const app = express();

  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", (_request, response) => {
    response.set("Cache-Control", NO_STORE).json({ status: "ok" });
  });

  app.post("/api/render", async (request, response) => {
    const url = request.body?.url;
    let canonicalUrl: string;
    try {
      canonicalUrl = validateChatGptShareUrl(typeof url === "string" ? url : "").canonicalUrl;
    } catch {
      response.status(400).set("Cache-Control", NO_STORE).json({ error: "unsupported_share_url" });
      return;
    }

    try {
      const png = await capture(canonicalUrl);
      response
        .set("Cache-Control", NO_STORE)
        .set("Content-Type", "image/png")
        .end(Buffer.from(png));
    } catch {
      response.status(502).set("Cache-Control", NO_STORE).json({ error: "browser_unavailable" });
    }
  });

  if (production) {
    app.use(express.static("dist/web"));
  } else if (vite) {
    app.use(vite.middlewares);
  }

  return app;
}
