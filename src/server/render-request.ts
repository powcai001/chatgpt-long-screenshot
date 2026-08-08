import type { ArticleTheme, RenderJob } from "../shared/api-types.js";
import { validateChatGptShareUrl } from "./security/url-validator.js";
import { resolveStyle } from "./styles.js";

export const MAX_TEXT_CODE_POINTS = 2_000;
export const MAX_BYLINE_CODE_POINTS = 50;

/** Accepts any public http(s) URL without credentials. */
export function validateWebUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("unsupported_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("unsupported_url");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("unsupported_url");
  }
  return url.href;
}

/** Normalizes an optional byline: trimmed and capped, empty when absent. */
export function normalizeByline(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  const chars = Array.from(trimmed);
  return chars.slice(0, MAX_BYLINE_CODE_POINTS).join("");
}

export function normalizePlainText(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("invalid_text");
  }
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (normalized.length === 0) {
    throw new Error("invalid_text");
  }
  if (Array.from(normalized).length > MAX_TEXT_CODE_POINTS) {
    throw new Error("text_too_long");
  }
  return normalized;
}

export function normalizeRenderRequest(value: unknown): RenderJob {
  if (!isRecord(value)) {
    throw new Error("invalid_request");
  }

  // Backward compatibility: legacy {url}. Route ChatGPT share links to the
  // conversation source; everything else to the generic web-link source.
  if (typeof value.url === "string" && value.source === undefined) {
    try {
      const validated = validateChatGptShareUrl(value.url);
      return { source: "chatgpt-share", canonicalUrl: validated.canonicalUrl, style: "conversation-clean", byline: "" };
    } catch {
      return { source: "web-link", canonicalUrl: validateWebUrl(value.url), style: "article-clean", byline: "" };
    }
  }

  if (value.source === "chatgpt-share") {
    const style = resolveStyle("chatgpt-share", value.style) as "conversation-clean";
    const validated = validateChatGptShareUrl(typeof value.url === "string" ? value.url : "");
    return { source: "chatgpt-share", canonicalUrl: validated.canonicalUrl, style, byline: normalizeByline(value.byline) };
  }

  if (value.source === "web-link") {
    const style = resolveStyle("web-link", value.style) as ArticleTheme;
    return {
      source: "web-link",
      canonicalUrl: validateWebUrl(typeof value.url === "string" ? value.url : ""),
      style,
      byline: normalizeByline(value.byline),
    };
  }

  if (value.source === "plain-text") {
    const style = resolveStyle("plain-text", value.style) as ArticleTheme;
    return { source: "plain-text", text: normalizePlainText(value.text), style, byline: normalizeByline(value.byline) };
  }

  throw new Error("invalid_request");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
