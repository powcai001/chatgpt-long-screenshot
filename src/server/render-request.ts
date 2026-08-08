import type { RenderJob } from "../shared/api-types.js";
import { validateChatGptShareUrl } from "./security/url-validator.js";
import { resolveStyle } from "./styles.js";

export const MAX_TEXT_CODE_POINTS = 2_000;

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

  // Backward compatibility for the first MVP client.
  if (typeof value.url === "string" && value.source === undefined) {
    const validated = validateChatGptShareUrl(value.url);
    return {
      source: "chatgpt-share",
      canonicalUrl: validated.canonicalUrl,
      style: "conversation-clean",
    };
  }

  if (value.source === "chatgpt-share") {
    if (typeof value.url !== "string") {
      throw new Error("unsupported_share_url");
    }
    const style = resolveStyle("chatgpt-share", value.style);
    const validated = validateChatGptShareUrl(value.url);
    return { source: "chatgpt-share", canonicalUrl: validated.canonicalUrl, style: style as "conversation-clean" };
  }

  if (value.source === "plain-text") {
    const style = resolveStyle("plain-text", value.style);
    const text = normalizePlainText(value.text);
    return { source: "plain-text", text, style: style as "text-card" };
  }

  throw new Error("invalid_request");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
