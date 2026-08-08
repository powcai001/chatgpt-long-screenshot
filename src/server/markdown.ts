import { marked } from "marked";
import { sanitizeReadingHtml } from "./sanitize.js";

marked.setOptions({
  gfm: true,
  breaks: false,
});

/** Renders Markdown source to sanitized reading HTML. */
export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false }) as string;
  return sanitizeReadingHtml(html);
}
