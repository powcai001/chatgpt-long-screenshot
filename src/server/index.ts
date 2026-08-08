import { createServer } from "node:http";

import { createServer as createViteServer } from "vite";

import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { formatDisplayHost, isProduction } from "./runtime.js";

const config = loadConfig(process.env);
const production = isProduction(process.argv[1] ?? "", process.env.NODE_ENV);
const vite = production
  ? undefined
  : await createViteServer({
      appType: "spa",
      server: { middlewareMode: true },
    });
const app = createApp({ production, vite });
const server = createServer(app);

server.listen(config.port, config.host, () => {
  const displayHost = config.host === "0.0.0.0" ? "localhost" : formatDisplayHost(config.host);
  console.log(`聊天长截图已启动：http://${displayHost}:${config.port}`);
  if (config.lanMode) {
    console.warn("警告：服务已监听所有网络接口，仅应在可信局域网使用。");
  }
});
