# 部署规程（Cloudflare 前置 + Node 应用）

## 目标架构

```text
浏览器
  → Cloudflare（代理 + 免费速率限制 / 可选 Access）
  → 一个常驻 Node 进程
      ├─ 静态页面（dist/web）
      └─ POST /api/render（Node + Playwright Chromium）
```

应用本身几乎不需要为部署改动：本地和线上跑同一套 Express + Playwright 代码。Cloudflare 只负责把流量转给这个常驻进程，并在边缘做滥用防护。

## 为什么不用 Workers + Browser Run

把 Express 改写成 Worker、处理 128 MB 内存/并发/Turnstile 会带来大量复杂度，对一个个人/小范围工具得不偿失。保留一个常驻 Node 进程最简单，且本地与线上一致。

## 部署步骤

1. 在任意支持 Node 22 与 Chromium 的小主机或容器上运行：

   ```bash
   pnpm install --frozen-lockfile
   pnpm exec playwright install --with-deps chromium
   pnpm build
   NODE_ENV=production HOST=0.0.0.0 PORT=4173 pnpm start
   ```

   进程需监听对外端口（或通过反向代理暴露）。

2. 用 Cloudflare 代理该主机（DNS 指向主机或通过 Cloudflare Tunnel）。
3. 在 Cloudflare 启用免费的速率限制规则（例如对 `/api/render` 限制每 IP 每分钟请求数），作为主要滥用防护。
4. 若只允许自己和小范围用户使用，用 Cloudflare Access 限定受邀身份，即可不再依赖公开滥用防护。
5. 保持进程与 Chromium 更新；为内存留出余量（每个渲染任务会启动一个隔离 Chromium）。

## 应用内已有的防护

- 只接受公开 ChatGPT 分享链接，或受限长度的纯文字；不接受任意 URL。
- 2 KB 请求体上限；纯文字最多 2000 个 Unicode 字符。
- 校验失败返回稳定 400 错误码，不回显链接或正文。
- 所有 API 与图片响应设置 `Cache-Control: no-store`。

## 不做

- 不在应用里写分布式限流、Turnstile、Durable Object 或账号系统。
- 不引入 Worker/Browser Run 重写、队列、分图或异步任务。
- 不存储链接、对话正文、文字内容或图片历史。

## 回滚

进程崩溃或渲染异常时返回 502；保持静态页面和 `/api/health` 可用。出现问题时直接回退到上一个稳定版本/镜像，再在本机用真实链接复现修复。
