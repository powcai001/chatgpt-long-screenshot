# 分享图片生成器

把 ChatGPT 对话、网页文章或一段文字排版成清晰、适合分享的图片。

支持三种内容来源：

- **ChatGPT 链接**：粘贴 `https://chatgpt.com/s/t_<32 位小写十六进制>` 公开分享链接，抽取对话并按“简洁对话”样式排版。
- **网页链接**：任意 `http(s)` 文章页，用阅读模式自动抽取正文（标题 + 段落 + 图片 + 列表）。
- **输入文字**：直接输入文字，**支持 Markdown**（标题、列表、代码、加粗、链接、引用等），最多 2000 个 Unicode 字符。

文字和网页链接共享五种文章风格：**简约白、苹果风、深色、杂志风、社交卡片**。两种来源都生成一张 PNG，可在页面预览并保存。

## 支持范围与隐私

- ChatGPT 来源只接受公开分享链接；网页链接接受任意 `http(s)` 文章页（阅读模式抽取，质量随页面结构而定）。
- 内容只在当前请求内存和返回的 PNG 中存在；不存储链接、正文、HTML、Cookie 或图片历史。
- 所有 API 与图片响应都设置 `Cache-Control: no-store`。
- 抽取/Markdown 输出的 HTML 都会净化（移除脚本、事件属性、表单和危险协议）。
- 当前为本地运行；公网部署计划见 [`docs/cloudflare-deployment.md`](docs/cloudflare-deployment.md)。

## 环境要求

- Node.js 22.13.0 或更高版本（见 `.node-version`）。
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
pnpm verify        # lint、typecheck、单元/集成测试、构建、生产 E2E
pnpm tsx scripts/smoke-render.ts   # 用合成 DOM 和示例文字验证两条渲染链路（无网络依赖）
```

也可以手工验证生产构建：

```bash
pnpm build
pnpm start
```

健康检查：`GET /api/health` 返回 `{"status":"ok"}`。

## API

`POST /api/render`，请求体为 JSON：

```jsonc
// ChatGPT 链接
{ "source": "chatgpt-share", "url": "https://chatgpt.com/s/t_...", "style": "conversation-clean" }
// 网页链接（阅读模式）
{ "source": "web-link", "url": "https://example.com/article", "style": "article-apple" }
// 纯文字（Markdown）
{ "source": "plain-text", "text": "# 标题\n正文", "style": "article-dark" }
// 兼容旧版（自动识别 ChatGPT 链接或普通网页）
{ "url": "https://..." }
```

文章风格：`article-clean`、`article-apple`、`article-dark`、`article-magazine`、`article-social`。

成功返回 `image/png`。校验失败返回 400（错误码 `unsupported_share_url`、`unsupported_url`、`invalid_text`、`text_too_long`、`unsupported_style`、`invalid_request`）；页面无法抽取对话/正文返回 422（`conversation_not_found`、`article_not_found`）；渲染失败返回 502 `browser_unavailable`。

## 源码打包

```bash
pnpm package:source
```

压缩包输出到 `dist/chatgpt-long-screenshot-source.zip`。打包脚本只收录明确允许的源码、配置、测试和公开文档，不包含 `.git`、`.claude`、环境文件、依赖、构建缓存、日志或截图。

## 路线图

1. 继续打磨对话与文字模板（长内容、深色模式、更多阅读风格）。
2. 用真实链接持续校准 ChatGPT DOM 抽取与净化。
3. 以 Node 应用前置 Cloudflare 的方式部署（边缘速率限制、可选 Cloudflare Access）。

更多状态见 [`docs/status-and-roadmap.md`](docs/status-and-roadmap.md)。

## 许可证

[MIT](LICENSE)
