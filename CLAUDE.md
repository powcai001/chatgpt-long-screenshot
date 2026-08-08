# 分享图片生成器

把 ChatGPT 对话 / 网页文章 / 文字排版成分享卡片。

## 技术栈

Node 22 · pnpm 10.15 · TypeScript strict · Express · Vite · Playwright Chromium

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 本地开发（热重载），端口 4173 |
| `pnpm build && pnpm start` | 生产构建 + 启动 |
| `pnpm verify` | lint + typecheck + 测试 + 构建 + E2E |
| `pnpm test` | 单元 + 集成测试 |
| `pnpm test:e2e` | Playwright 浏览器 E2E |
| `pnpm tsx scripts/smoke-render.ts` | 合成数据验证渲染管线 |
| `pnpm generate:samples` | 重新生成风格样例图 |

## 架构要点

### 来源 → 内容形态 → 风格

- `chatgpt-share` → 对话 turns → `conversation-clean`
- `web-link` → 阅读模式正文 → 六种文章风格
- `plain-text` → Markdown → 同上六种文章风格

### 渲染管线

```
API POST /api/render → normalizeRenderRequest → captureScreenshot(job)
  ├─ chatgpt-share: Playwright 打开 → extractConversation → sanitize → buildConversationHtml
  ├─ web-link: Playwright 打开 → extractArticle (Readability) → sanitize → buildArticleHtml
  └─ plain-text: renderMarkdown (marked) → sanitize → buildArticleHtml
                         └───────────────── renderHtmlToPng ──────────────────┘
```

### 风格注册

在 `src/shared/api-types.ts` 的 `RENDER_STYLE_OPTIONS` 加一条记录，在 `src/server/template.ts` 的 `THEME_CSS` 加对应的 CSS 即可新增风格。样例图用 `pnpm generate:samples` 生成。

### 关键文件

| 文件 | 职责 |
| --- | --- |
| `src/server/app.ts` | Express 路由、请求校验、错误映射 |
| `src/server/render-request.ts` | 请求归一化、URL/文字校验 |
| `src/server/render.ts` | Playwright 截图管线 |
| `src/server/template.ts` | 对话模板 + 文章主题 CSS |
| `src/server/sanitize.ts` | HTML 阅读白名单净化 |
| `src/server/readability.ts` | 阅读模式（@mozilla/readability） |
| `src/server/markdown.ts` | Markdown 渲染（marked） |
| `src/server/styles.ts` | 风格注册表 |
| `src/shared/api-types.ts` | 请求类型、风格定义 |
| `src/web/` | 原生 DOM 前端 |

## 项目约定

- 不存内容、所有响应 `Cache-Control: no-store`
- 抽取/Markdown 输出统一经过 `sanitizeReadingHtml` 净化
- 新增内容来源或风格不改 API 路由，只扩展注册表
- 部署用 Docker / Render Blueprint（见 `Dockerfile`、`render.yaml`）
