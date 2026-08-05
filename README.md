# ChatGPT 长截图

将公开的 ChatGPT 分享链接转换为保留原站样式的长截图。目标是优先生成单张 PNG；内容过长时，按消息边界输出连续分图。

> 当前状态：基础工程已完成，包括本地 Express + Vite 服务、健康检查和严格的 ChatGPT 分享链接校验。`POST /api/render`、Playwright 截图流程、分图和完整移动端界面尚在开发中，因此当前版本还不能生成截图。

## 支持范围

- 只接受公开的 `https://chatgpt.com/s/t_<32 位小写十六进制>` 链接。
- 不接受登录 Cookie、私有聊天或任意网页地址。
- 不存储链接、聊天正文、HTML、Cookie 或截图历史。
- 第一阶段在本地运行；后续使用 Cloudflare Workers Static Assets、Worker API 和 Browser Run 部署。

## 环境要求

- Node.js 22.13.0 或更高版本；推荐使用 `.node-version` 中的 Node 22 LTS。
- pnpm 10.15.0。

## 安装与本地运行

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

默认地址为 `http://127.0.0.1:4173`。要让同一可信局域网内的设备访问，请显式执行：

```bash
HOST=0.0.0.0 pnpm dev
```

该模式会监听所有网络接口，仅应在可信局域网内使用。

## 验证

```bash
pnpm verify
```

`verify` 会依次运行代码检查、类型检查、测试、构建，并使用构建后的生产服务执行浏览器 E2E。

也可以手工验证生产构建：

```bash
pnpm build
pnpm start
```

健康检查：`GET /api/health` 返回 `{"status":"ok"}`，且响应使用 `Cache-Control: no-store`。

## 源码打包

```bash
pnpm package:source
```

压缩包输出到 `dist/chatgpt-long-screenshot-source.zip`。打包脚本只收录明确允许的源码、配置、测试和公开文档，不包含 `.git`、`.claude`、环境文件、依赖、构建缓存、日志或截图。

## 路线图

1. 完成安全错误、网络策略、遥测脱敏和本地限流。
2. 实现本地 Playwright 浏览器运行时并验证 ChatGPT 页面结构。
3. 完成正文隔离、单图/分图、`POST /api/render` 和移动端界面。
4. 增加 GitHub CI。
5. 在受保护的 Cloudflare staging 环境验证 Browser Run。
6. 接入 Worker API、Static Assets、Turnstile、分布式限流和并发控制后公开上线。

详细状态和部署规程见 [`docs/status-and-roadmap.md`](docs/status-and-roadmap.md) 与 [`docs/cloudflare-deployment.md`](docs/cloudflare-deployment.md)。

## 许可证

[MIT](LICENSE)
