# 项目状态与路线图

## 目标

把公开的 ChatGPT 对话或一段文字排版成清晰、适合分享的图片。桌面和手机浏览器通过同源页面提交内容；结果只存在于当前请求和浏览器 Blob URL 中，不建立账号、历史记录或永久存储。

## 当前实现

已完成：

- `POST /api/render`，支持三种来源：ChatGPT 分享链接、任意网页链接（阅读模式）、纯文字（Markdown）；兼容旧版 `{ url }`。
- 一个对话风格 `conversation-clean`，五个文章风格：简约白、苹果风、深色、杂志风、社交卡片。
- Playwright 抽取 ChatGPT 对话（兼容用户提问容器）并用 `@mozilla/readability` + `jsdom` 抽取网页正文；Markdown 用 `marked` 渲染。
- 抽取/Markdown 输出统一经过阅读白名单净化（移除脚本、表单、事件属性、危险协议）。
- 自定义 HTML/CSS 模板，输出单张 PNG。
- 三模式前端（ChatGPT 链接 / 网页链接 / 输入文字），按来源过滤风格、Unicode 字数计数、预览和保存。
- URL/文本校验、2 KB 请求体上限、纯文字 2000 Unicode 字符上限。
- 单元、集成、E2E 测试与合成渲染 smoke。

后续打磨方向：

- 继续优化各主题在长文/长对话下的排版；
- 用真实链接与真实文章页持续校准抽取与净化；
- 以 Node 应用前置 Cloudflare 的方式公网部署。

## 设计约束

- 只支持公开 ChatGPT 分享链接、任意 `http(s)` 文章页和受限长度的纯文字。
- 网页链接会由服务端发起抓取；个人工具可接受，公网部署需在 Cloudflare 边缘限制滥用与 SSRF（见隐私文档）。
- 每个渲染任务使用隔离、无登录状态的浏览器上下文，并在 `finally` 中关闭。
- 不存储链接、分享 ID、对话正文、HTML、Cookie 或图片字节。
- 所有 API、错误和图片响应使用 `Cache-Control: no-store`。
- 公网部署时滥用防护放在 Cloudflare 边缘（速率限制），应用内不写复杂限流。
