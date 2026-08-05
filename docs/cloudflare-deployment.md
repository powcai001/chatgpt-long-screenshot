# Cloudflare 部署规程

## 目标架构

```text
浏览器
  ├─ 静态页面 → Workers Static Assets
  └─ POST /api/render → Fetch-native Worker
                         ├─ Turnstile / 限流 / 并发门禁
                         ├─ URL 与网络策略
                         └─ Browser Run（@cloudflare/playwright）
                              └─ ChatGPT 公开分享页
```

本地 Express 入口继续服务开发与测试。Cloudflare 使用独立的 Fetch-native 入口；URL 校验、平台适配、正文隔离、截图规划和响应编码由两种运行时共享。

## 为什么不能直接部署当前代码

当前 Node 入口调用 `server.listen()`，生产静态文件依赖本地目录，而且截图 API 尚未实现。Cloudflare Worker 不开放传统 Node 监听端口；浏览器必须通过 `browser` binding 启动。因此需要先抽取运行时无关的渲染核心，再增加 Worker adapter。

## 阶段 1：GitHub 与 CI

1. 只发布不含旧公司身份、内网 registry 和真实分享标识的干净 `main`。
2. GitHub Actions 在 Node 22 LTS 与 pnpm 10.15 上执行 frozen install、lint、typecheck、测试、构建、production E2E 和源码包检查。
3. PR CI 不使用 Cloudflare secret 或真实 ChatGPT 链接。

## 阶段 2：完成本地截图链路

1. 定义 `BrowserSessionFactory`、`BrowserSession` 和 `BrowserPage`。
2. 实现普通 Playwright adapter。
3. 验证 ChatGPT DOM 和最小资源 host allowlist。
4. 完成正文隔离、单 PNG、按消息边界分图和流式 multipart。
5. 实现 `POST /api/render` 与移动端 UI。

## 阶段 3：Browser Run staging spike

创建受 Cloudflare Access 保护的 staging Worker，使用 `@cloudflare/playwright` 和 `env.BROWSER`，验证：

- ChatGPT 页面是否持续触发自动化挑战；
- `newContext`、redirect 和请求拦截；
- Service Worker 是否可阻断；
- `evaluate`、字体/图片等待和有界滚动；
- clip 截图和连续分图；
- Abort、超时、Chromium crash 和关闭路径；
- iPhone 下载大图；
- Worker 128 MB 内存下的峰值占用。

请求拦截或 Service Worker 隔离无法可靠满足安全要求时，停止 Browser Run 路线并评估 Cloudflare Containers，不能带缺口上线。

## 阶段 4：Worker 产品化

`wrangler.jsonc` 应配置：

- Fetch-native Worker main；
- 当前 compatibility date 与 `nodejs_compat`；
- `browser` binding；
- `dist/web` Static Assets binding；
- `/api/*` worker-first；
- staging/production 独立环境；
- Rate Limiting 和 Durable Object bindings；
- 明确 CPU 限制和可观测性采样。

API 必须在启动浏览器前完成：

1. 方法、Content-Type 和 2 KiB 请求体限制；
2. Turnstile Siteverify，并验证 hostname 与 action；
3. 严格分享链接校验；
4. Rate Limiting binding；
5. Durable Object 全局/单用户并发门禁；
6. 资源额度检查。

初始限制：总并发 2、单用户并发 1、不排队；总输出先限制为 24–32 MiB，远程内存测试通过后再调整。

## Secrets

- Browser binding 不需要在 Worker 中保存 Browser Rendering API Token。
- `TURNSTILE_SECRET` 使用 `wrangler secret put` 管理。
- GitHub 部署 token 只放 GitHub Environment Secrets；不作为 Worker Secret。
- `.dev.vars*`、`.env*` 和 `.wrangler/` 不进入 Git。

## CI/CD

- GitHub Actions：无秘密质量检查。
- Cloudflare preview/staging：Workers Builds GitHub 集成。
- 生产：由唯一发布源在 `main` CI 全绿后部署，避免 Workers Builds 和 GitHub Action 同时发布。
- 真实 Browser Run smoke 仅在受保护 staging environment 手工触发，链接从 secret 读取，日志不包含内容。

## 上线门禁

- Workers Paid 与 Browser Run 配额已确认；
- Turnstile、WAF、Rate Limiting 和 Durable Object 在浏览器启动前拒绝滥用；
- URL、redirect、子资源和 Service Worker 网络边界均通过远程测试；
- 每条路径都关闭 browser/context；
- CPU、内存、输出大小和成本有实测数据与告警；
- Logs/Traces 不含 URL、分享 ID、正文、HTML、Cookie、console 或图片字节；
- 所有 API/图片响应 `Cache-Control: no-store`；
- 桌面和 iPhone staging smoke 通过。

## 回滚

保留上一个 Workers version。错误率、挑战率、网络策略、内存或成本异常时：

1. 立即关闭 `/api/render` 或将其切到维护响应；
2. 回滚到上一个稳定 Worker version；
3. 保持静态说明页和 `/api/health` 可访问；
4. 在 staging 复现并通过门禁后再发布。
