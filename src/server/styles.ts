import type { RenderSource, RenderStyleId, RenderStyleOption } from "../shared/api-types.js";
import { RENDER_STYLE_OPTIONS } from "../shared/api-types.js";

const DEFAULT_STYLES: Readonly<Record<RenderSource, RenderStyleId>> = Object.freeze({
  "chatgpt-share": "conversation-clean",
  "web-link": "article-clean",
  "plain-text": "article-clean",
});

/** Lists registered render styles compatible with one source. */
export function listStyles(source: RenderSource): readonly RenderStyleOption[] {
  return RENDER_STYLE_OPTIONS.filter((option) => option.sources.includes(source));
}

/** Resolves a source-compatible style or throws a stable error code. */
export function resolveStyle(source: RenderSource, style?: unknown): RenderStyleId {
  const resolved = style === undefined ? DEFAULT_STYLES[source] : style;
  if (typeof resolved !== "string") {
    throw new Error("unsupported_style");
  }

  const match = RENDER_STYLE_OPTIONS.find(
    (option) => option.id === resolved && option.sources.includes(source),
  );
  if (!match) {
    throw new Error("unsupported_style");
  }
  return match.id;
}
