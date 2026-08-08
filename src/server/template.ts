import type { ArticleTheme } from "../shared/api-types.js";
import { escapeHtml } from "./sanitize.js";

export interface ConversationTurn {
  readonly role: string;
  readonly html: string;
}

const ROLE_LABELS: Record<string, string> = { user: "你", assistant: "ChatGPT" };

const READING_ELEMENTS = `
  .body p { margin: 0 0 12px; } .body p:last-child { margin-bottom: 0; }
  .body h1, .body h2, .body h3 { line-height: 1.3; font-weight: 700; margin: 22px 0 10px; }
  .body h1 { font-size: 24px; } .body h2 { font-size: 21px; } .body h3 { font-size: 18px; }
  .body ul, .body ol { margin: 0 0 12px; padding-left: 26px; } .body li { margin: 3px 0; }
  .body a { color: var(--accent); }
  .body blockquote { margin: 0 0 12px; padding: 2px 16px; color: var(--muted); border-left: 3px solid var(--rule); }
  .body img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
  .body pre { margin: 0 0 12px; padding: 14px 16px; overflow-x: hidden; white-space: pre-wrap; word-break: break-word; border: 1px solid var(--rule); border-radius: 10px; background: var(--code-bg); }
  .body code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .85em; }
  .body :not(pre) > code { padding: 2px 6px; border-radius: 5px; background: var(--inline-code-bg); }
  .body table { border-collapse: collapse; margin: 0 0 12px; font-size: .92em; }
  .body th, .body td { padding: 6px 11px; border: 1px solid var(--rule); text-align: left; }
  .body hr { margin: 16px 0; border: 0; border-top: 1px solid var(--rule); }
`;

const CONVERSATION_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #202124; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
  .sheet { width: min(100%, 820px); margin: 0 auto; padding: 28px 30px 34px; }
  .sheet-header { display: flex; align-items: center; gap: 9px; padding-bottom: 16px; margin-bottom: 2px; border-bottom: 1px solid #eceff1; }
  .sheet-header .dot { width: 10px; height: 10px; border-radius: 50%; background: #10a37f; }
  .sheet-header .title { font-size: 17px; font-weight: 700; }
  .turn { padding: 15px 0; border-bottom: 1px solid #f0f1f2; }
  .turn:last-of-type { border: 0; }
  .turn-role { margin-bottom: 6px; color: #737980; font-size: 13px; font-weight: 700; }
  .turn-user .turn-content { padding: 12px 15px; border-radius: 12px; background: #f3f4f6; }
  .turn-content { font-size: 18px; line-height: 1.65; overflow-wrap: anywhere; }
  ${READING_ELEMENTS}
  .sheet-footer { margin-top: 20px; padding-top: 12px; color: #9aa0a6; font-size: 11px; text-align: center; border-top: 1px solid #eceff1; }
`;

const THEME_CSS: Record<ArticleTheme, string> = {
  "article-clean": `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #fff; color: #202124; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#2563eb; --muted:#68717b; --rule:#eceff1; --code-bg:#f6f8fa; --inline-code-bg:#eef0f2; width: min(100%, 760px); margin: 0 auto; padding: 40px 44px 30px; }
    .card .kicker { color: var(--muted); font-size: 13px; letter-spacing: .04em; text-transform: uppercase; }
    .card h1.title { font-size: 30px; line-height: 1.25; font-weight: 800; margin: 8px 0 22px; }
    .body { font-size: 18px; line-height: 1.75; overflow-wrap: anywhere; }
    .card-footer { margin-top: 26px; padding-top: 14px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; text-align: center; }
  `,
  "article-apple": `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #fbfbfd; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#0071e3; --muted:#6e6e73; --rule:#e8e8ed; --code-bg:#f5f5f7; --inline-code-bg:#ececef; width: min(100%, 720px); margin: 0 auto; padding: 72px 56px 56px; }
    .card .kicker { color: var(--accent); font-size: 14px; font-weight: 600; letter-spacing: .02em; }
    .card h1.title { font-size: 44px; line-height: 1.1; font-weight: 700; letter-spacing: -.01em; margin: 12px 0 30px; }
    .body { font-size: 19px; line-height: 1.6; color: #1d1d1f; overflow-wrap: anywhere; }
    .body p { margin: 0 0 18px; }
    .card-footer { margin-top: 40px; color: var(--muted); font-size: 13px; text-align: center; }
  `,
  "article-dark": `
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#58a6ff; --muted:#8b949e; --rule:#21262d; --code-bg:#161b22; --inline-code-bg:#1f242b; width: min(100%, 760px); margin: 0 auto; padding: 44px 44px 32px; }
    .card .kicker { color: var(--accent); font-size: 13px; letter-spacing: .04em; text-transform: uppercase; }
    .card h1.title { font-size: 30px; line-height: 1.25; font-weight: 800; color: #f0f6fc; margin: 8px 0 22px; }
    .body { font-size: 18px; line-height: 1.75; overflow-wrap: anywhere; }
    .card-footer { margin-top: 26px; padding-top: 14px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; text-align: center; }
  `,
  "article-magazine": `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #fdfcf8; color: #1a1a1a; font-family: Georgia, "Times New Roman", "Songti SC", "SimSun", serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#8a5a2b; --muted:#6b6256; --rule:#e3dccd; --code-bg:#f4efe4; --inline-code-bg:#efe8d8; width: min(100%, 680px); margin: 0 auto; padding: 56px 48px 40px; }
    .card .kicker { color: var(--accent); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; font-family: -apple-system, "Helvetica Neue", sans-serif; }
    .card h1.title { font-size: 38px; line-height: 1.2; font-weight: 700; margin: 12px 0 8px; }
    .card .deck { color: var(--muted); font-style: italic; font-size: 17px; margin-bottom: 28px; }
    .card .rule { width: 48px; height: 2px; background: var(--accent); margin: 0 0 24px; }
    .body { font-size: 18px; line-height: 1.8; overflow-wrap: anywhere; }
    .body p:first-of-type::first-letter { font-size: 48px; line-height: .9; font-weight: 700; float: left; padding: 4px 8px 0 0; color: var(--accent); }
    .body pre, .body code, .body table { font-family: ui-monospace, Menlo, Consolas, monospace; }
    .card-footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; text-align: center; font-family: -apple-system, "Helvetica Neue", sans-serif; }
  `,
  "article-social": `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #fff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#6366f1; --muted:#64748b; --rule:#e2e8f0; --code-bg:#f1f5f9; --inline-code-bg:#e2e8f0; width: 600px; margin: 0 auto; padding: 40px 40px 28px; border-radius: 20px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow: 0 1px 0 #e2e8f0 inset; }
    .card .kicker { display: inline-block; color: var(--accent); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #eef2ff; }
    .card h1.title { font-size: 26px; line-height: 1.3; font-weight: 800; margin: 14px 0 16px; }
    .body { font-size: 17px; line-height: 1.7; overflow-wrap: anywhere; }
    .card-footer { margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; text-align: center; }
  `,
  "article-liuguang": `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #eef3ff; color: #17213d; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
    .card { --accent:#5964e8; --muted:#667085; --rule:rgba(89,100,232,.16); --code-bg:rgba(255,255,255,.7); --inline-code-bg:rgba(255,255,255,.7); width: min(100%, 760px); margin: 0 auto; padding: 42px 46px 32px; border: 1px solid rgba(255,255,255,.8); border-radius: 28px; background: radial-gradient(circle at 12% 8%, rgba(255,255,255,.95), transparent 36%), linear-gradient(135deg, #f4eaff 0%, #eaf1ff 48%, #e8fff7 100%); box-shadow: 0 18px 60px rgba(78, 88, 170, .16); }
    .card .kicker { display: inline-flex; align-items: center; gap: 7px; color: #5964e8; font-size: 12px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
    .card .kicker::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #ff8dc7, #7b8cff); box-shadow: 0 0 0 5px rgba(123,140,255,.12); }
    .card h1.title { font-size: 34px; line-height: 1.18; font-weight: 800; letter-spacing: -.02em; margin: 13px 0 24px; color: #20294a; }
    .body { font-size: 18px; line-height: 1.75; overflow-wrap: anywhere; }
    .body p, .body li, .body blockquote, .body pre { color: #273354; }
    .card-footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid var(--rule); color: var(--muted); font-size: 12px; text-align: right; }
  `,
};

function renderTurn(turn: ConversationTurn): string {
  const roleClass = turn.role === "user" ? "turn-user" : "turn-assistant";
  const label = escapeHtml(ROLE_LABELS[turn.role] ?? turn.role);
  return `    <section class="turn ${roleClass}"><div class="turn-role">${label}</div><div class="turn-content">${turn.html}</div></section>`;
}

export function buildConversationHtml(turns: readonly ConversationTurn[], byline = ""): string {
  const body = turns.map(renderTurn).join("\n");
  const footer = byline ? `<footer class="sheet-footer">${escapeHtml(byline)}</footer>` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ChatGPT 对话</title><style>${CONVERSATION_STYLES}</style></head><body><div class="sheet"><header class="sheet-header"><span class="dot"></span><span class="title">ChatGPT 对话</span></header>${body}${footer}</div></body></html>`;
}

export function buildArticleHtml(theme: ArticleTheme, title: string | undefined, bodyHtml: string, byline = ""): string {
  const safeTitle = title ? escapeHtml(title) : "";
  const titleBlock = safeTitle
    ? `<h1 class="title">${safeTitle}</h1>${theme === "article-magazine" ? '<div class="rule"></div>' : ""}`
    : "";
  const footer = byline ? `<footer class="card-footer">${escapeHtml(byline)}</footer>` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle || "分享"}</title><style>${THEME_CSS[theme]}${READING_ELEMENTS}</style></head><body><article class="card">${titleBlock}<div class="body">${bodyHtml}</div>${footer}</article></body></html>`;
}
