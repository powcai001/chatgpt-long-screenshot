/**
 * Builds a self-contained HTML document that renders extracted ChatGPT turns
 * in our own clean style. The document is loaded into a headless page and
 * screenshotted, so it carries its own CSS and uses only system fonts (no
 * external requests beyond conversation images already referenced by ChatGPT).
 */
export interface ConversationTurn {
  readonly role: string;
  readonly html: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: "你",
  assistant: "ChatGPT",
};

function labelFor(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: #ffffff;
    color: #1f2328;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  .sheet {
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 40px 56px;
  }
  .sheet-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 24px;
    margin-bottom: 8px;
    border-bottom: 1px solid #eaecef;
  }
  .sheet-header .dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #10a37f;
  }
  .sheet-header .title { font-size: 18px; font-weight: 650; }
  .turn { padding: 22px 0; border-bottom: 1px solid #f0f0f0; }
  .turn:last-of-type { border-bottom: none; }
  .turn-role {
    font-size: 13px;
    font-weight: 650;
    color: #6e7781;
    margin-bottom: 8px;
    letter-spacing: 0.02em;
  }
  .turn-user .turn-content {
    background: #f4f4f4;
    border-radius: 14px;
    padding: 14px 16px;
  }
  .turn-content p { margin: 0 0 12px; }
  .turn-content p:last-child { margin-bottom: 0; }
  .turn-content h1, .turn-content h2, .turn-content h3 {
    margin: 18px 0 10px; line-height: 1.35; font-weight: 650;
  }
  .turn-content h1 { font-size: 22px; }
  .turn-content h2 { font-size: 19px; }
  .turn-content h3 { font-size: 17px; }
  .turn-content ul, .turn-content ol { margin: 0 0 12px; padding-left: 24px; }
  .turn-content li { margin: 4px 0; }
  .turn-content a { color: #2563eb; }
  .turn-content blockquote {
    margin: 0 0 12px; padding: 2px 14px; color: #57606a;
    border-left: 3px solid #d0d7de;
  }
  .turn-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
  .turn-content pre {
    background: #f6f8fa; border: 1px solid #eaecef; border-radius: 8px;
    padding: 14px 16px; overflow-x: hidden; white-space: pre-wrap;
    word-break: break-word; margin: 0 0 12px;
  }
  .turn-content code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 14px;
  }
  .turn-content :not(pre) > code {
    background: #eff1f3; padding: 2px 6px; border-radius: 5px;
  }
  .turn-content table {
    border-collapse: collapse; margin: 0 0 12px; font-size: 14px;
  }
  .turn-content th, .turn-content td {
    border: 1px solid #d0d7de; padding: 6px 12px; text-align: left;
  }
  .turn-content hr { border: none; border-top: 1px solid #eaecef; margin: 16px 0; }
  .sheet-footer {
    margin-top: 32px; padding-top: 16px; border-top: 1px solid #eaecef;
    font-size: 12px; color: #8c959f; text-align: center;
  }
`;

function renderTurn(turn: ConversationTurn): string {
  const roleClass = turn.role === "user" ? "turn-user" : "turn-assistant";
  return `    <section class="turn ${roleClass}">
      <div class="turn-role">${labelFor(turn.role)}</div>
      <div class="turn-content">${turn.html}</div>
    </section>`;
}

export function buildConversationHtml(turns: readonly ConversationTurn[]): string {
  const body = turns.map(renderTurn).join("\n");
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <title>ChatGPT 对话</title>
    <style>${STYLES}</style>
  </head>
  <body>
    <div class="sheet">
      <header class="sheet-header">
        <span class="dot"></span>
        <span class="title">ChatGPT 对话</span>
      </header>
${body}
      <footer class="sheet-footer">由 聊天长截图 生成</footer>
    </div>
  </body>
</html>`;
}
