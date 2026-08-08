import { escapeHtml } from "./sanitize.js";

export interface ConversationTurn {
  readonly role: string;
  readonly html: string;
}

const ROLE_LABELS: Record<string, string> = { user: "你", assistant: "ChatGPT" };

const BASE_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #202124; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
  .sheet { width: min(100%, 820px); margin: 0 auto; padding: 28px 30px 34px; }
  .sheet-header { display: flex; align-items: center; gap: 9px; padding-bottom: 16px; margin-bottom: 2px; border-bottom: 1px solid #eceff1; }
  .sheet-header .dot { width: 10px; height: 10px; border-radius: 50%; background: #10a37f; }
  .sheet-header .title { font-size: 17px; font-weight: 700; }
  .turn { padding: 15px 0; border-bottom: 1px solid #f0f1f2; }
  .turn:last-of-type { border-bottom: 0; }
  .turn-role { margin-bottom: 6px; color: #737980; font-size: 13px; font-weight: 700; }
  .turn-user .turn-content { padding: 12px 15px; border-radius: 12px; background: #f3f4f6; }
  .turn-content { font-size: 18px; line-height: 1.65; overflow-wrap: anywhere; }
  .turn-content p { margin: 0 0 10px; }
  .turn-content p:last-child { margin-bottom: 0; }
  .turn-content h1, .turn-content h2, .turn-content h3 { margin: 16px 0 8px; line-height: 1.35; font-weight: 700; }
  .turn-content h1 { font-size: 24px; } .turn-content h2 { font-size: 21px; } .turn-content h3 { font-size: 19px; }
  .turn-content ul, .turn-content ol { margin: 0 0 10px; padding-left: 26px; }
  .turn-content li { margin: 3px 0; }
  .turn-content a { color: #2563eb; }
  .turn-content blockquote { margin: 0 0 10px; padding: 1px 14px; color: #626970; border-left: 3px solid #d0d7de; }
  .turn-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 7px 0; }
  .turn-content pre { margin: 0 0 10px; padding: 13px 15px; overflow-x: hidden; white-space: pre-wrap; word-break: break-word; border: 1px solid #e5e7eb; border-radius: 8px; background: #f6f8fa; }
  .turn-content code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .84em; }
  .turn-content :not(pre) > code { padding: 2px 5px; border-radius: 4px; background: #eef0f2; }
  .turn-content table { border-collapse: collapse; margin: 0 0 10px; font-size: .9em; }
  .turn-content th, .turn-content td { padding: 5px 10px; border: 1px solid #d7dce0; text-align: left; }
  .turn-content hr { margin: 14px 0; border: 0; border-top: 1px solid #eceff1; }
  .sheet-footer { margin-top: 20px; padding-top: 12px; color: #9aa0a6; font-size: 11px; text-align: center; border-top: 1px solid #eceff1; }
  .text-card .sheet-header { margin-bottom: 18px; }
  .text-card .text-body { padding: 4px 2px 10px; font-size: 20px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
`;

function renderTurn(turn: ConversationTurn): string {
  const roleClass = turn.role === "user" ? "turn-user" : "turn-assistant";
  const label = escapeHtml(ROLE_LABELS[turn.role] ?? turn.role);
  return `    <section class="turn ${roleClass}"><div class="turn-role">${label}</div><div class="turn-content">${turn.html}</div></section>`;
}

export function buildConversationHtml(turns: readonly ConversationTurn[]): string {
  return buildDocument("conversation", turns.map(renderTurn).join("\n"), "ChatGPT 对话");
}

export function buildTextCardHtml(text: string): string {
  return buildDocument("text-card", `<div class="text-body">${escapeHtml(text)}</div>`, "文字分享");
}

function buildDocument(kind: "conversation" | "text-card", body: string, title: string): string {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${BASE_STYLES}</style></head><body><div class="sheet ${kind}"><header class="sheet-header"><span class="dot"></span><span class="title">${title}</span></header>${body}<footer class="sheet-footer">由 聊天长截图 生成</footer></div></body></html>`;
}
