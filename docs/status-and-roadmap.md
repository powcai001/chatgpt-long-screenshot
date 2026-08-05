# 项目状态与路线图

## 目标

本项目把公开的 ChatGPT 分享链接转换为保留原站样式的聊天长截图。桌面和手机浏览器通过同源页面提交链接；截图结果只存在于当前请求和浏览器 Blob URL 中，不建立账号、历史记录或永久存储。

## 当前实现

已完成：

- Node.js、Express、Vite 和 TypeScript 工程骨架；
- 本地开发与生产构建入口；
- `GET /api/health`；
- `HOST`、`PORT` 和运行模式校验；
- 严格的 ChatGPT 公开分享 URL 校验；
- 单平台 registry 与平台 adapter 边界；
- 单元测试、浏览器 E2E 骨架和源码打包脚本。

尚未完成：

- `POST /api/render`；
- 浏览器会话、网络白名单和超时处理；
- ChatGPT 对话 DOM 定位、隔离和截图；
- 单图失败后的消息边界分图；
- 完整移动端提交、预览和保存界面；
- Cloudflare Worker、Browser Run、Turnstile 和分布式并发控制。

因此当前仓库是可构建的开发骨架，不是已经可用的截图服务。

## 实施顺序

1. **安全基础**：安全错误响应、日志字段 allowlist、目标与子资源网络策略、本地速率和并发限制。
2. **本地浏览器验证**：以环境变量提供经批准的公开链接，在内存中验证 ChatGPT DOM、资源 host 和 Playwright 行为，不保存对话内容。
3. **渲染核心**：实现 runtime-neutral 的浏览器接口、正文隔离、布局测量、截图规划和 multipart。
4. **本地产品链路**：实现 `POST /api/render`、移动端页面、集成测试、E2E 和 iPhone 验收。
5. **Cloudflare staging**：使用 `@cloudflare/playwright` 和 Browser binding 验证请求拦截、Service Worker、clip、多图、Abort 和内存上限。
6. **公开上线**：Workers Static Assets + Fetch API，配合 Turnstile、WAF、Rate Limiting binding、Durable Object 和成本告警。

## 设计约束

- 只支持公开 ChatGPT 分享链接，不提供任意网页截图。
- 导航和子资源必须通过静态 allowlist；阻断私网、回环、链路本地和云元数据地址。
- 每个任务使用隔离、无登录状态的浏览器上下文，并在 `finally` 中关闭。
- 不记录完整 URL、分享 ID、正文、HTML、Cookie、浏览器 console 或 PNG 字节。
- 所有 API、错误和图片响应使用 `Cache-Control: no-store`。
- Cloudflare 上线前必须通过真实远程能力验证；安全关键 API 不可靠时不公开服务。
