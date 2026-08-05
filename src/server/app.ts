import type { Express } from "express";
import express from "express";
import type { ViteDevServer } from "vite";

export interface CreateAppOptions {
  production: boolean;
  vite?: ViteDevServer;
}

export function createApp({ production, vite }: CreateAppOptions): Express {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.set("Cache-Control", "no-store").json({ status: "ok" });
  });

  if (production) {
    app.use(express.static("dist/web"));
  } else if (vite) {
    app.use(vite.middlewares);
  }

  return app;
}
