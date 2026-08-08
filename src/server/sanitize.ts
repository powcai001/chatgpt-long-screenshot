const ALLOWED_TAGS = new Set([
  "p", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "pre", "code",
  "em", "strong", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr", "br",
]);
const DROP_CONTENT_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "canvas", "button", "input", "textarea", "select",
  "option", "svg", "form",
]);

/** Sanitizes extracted ChatGPT HTML into reading-only markup. */
export function sanitizeReadingHtml(html: string): string {
  // Sanitization runs in the browser DOM where DOMParser is available. This
  // fallback is used only by template/unit callers and mirrors the DOM policy.
  let value = html;
  for (const tag of DROP_CONTENT_TAGS) {
    value = value.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
    value = value.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }
  value = value.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  value = value.replace(/\s(?:class|style|data-[\w-]+|aria-[\w-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  value = value.replace(/\s(href|src)\s*=\s*(["'])(?!https:\/\/|\/)([^"']*)\2/gi, "");
  value = value.replace(/<\/?([a-z][\w-]*)\b[^>]*>/gi, (match, rawTag: string) => {
    const tag = rawTag.toLowerCase();
    if (ALLOWED_TAGS.has(tag)) {
      return match;
    }
    return "";
  });
  return value;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
