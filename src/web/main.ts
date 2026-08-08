import type { RenderSource, RenderStyleOption } from "../shared/api-types";
import { RENDER_STYLE_OPTIONS } from "../shared/api-types";
import "./styles.css";

type SourceField = "chatgpt" | "web" | "text";

function getElement<T extends Element = Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const form = getElement<HTMLFormElement>("#render-form");
const chatgptField = getElement<HTMLElement>("#chatgpt-field");
const webField = getElement<HTMLElement>("#web-field");
const textField = getElement<HTMLElement>("#text-field");
const chatgptInput = getElement<HTMLInputElement>("#chatgpt-url");
const webInput = getElement<HTMLInputElement>("#web-url");
const textInput = getElement<HTMLTextAreaElement>("#share-text");
const textCount = getElement<HTMLElement>("#text-count");
const styleSelect = getElement<HTMLSelectElement>("#style");
const bylineInput = getElement<HTMLInputElement>("#byline");
const submitButton = getElement<HTMLButtonElement>("#submit");
const status = getElement<HTMLParagraphElement>("#status");
const result = getElement<HTMLElement>("#result");
const preview = getElement<HTMLImageElement>("#preview");
const download = getElement<HTMLAnchorElement>("#download");

const FIELDS: Record<RenderSource, SourceField> = {
  "chatgpt-share": "chatgpt",
  "web-link": "web",
  "plain-text": "text",
};

let currentSource: RenderSource = "chatgpt-share";
let currentObjectUrl: string | null = null;

function setStatus(message: string, tone: "idle" | "busy" | "error" = "idle") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function stylesFor(source: RenderSource): readonly RenderStyleOption[] {
  return RENDER_STYLE_OPTIONS.filter((option) => option.sources.includes(source));
}

function updateMode(source: RenderSource) {
  currentSource = source;
  const field = FIELDS[source];
  chatgptField.hidden = field !== "chatgpt";
  webField.hidden = field !== "web";
  textField.hidden = field !== "text";
  chatgptInput.required = field === "chatgpt";
  webInput.required = field === "web";
  textInput.required = field === "text";
  styleSelect.replaceChildren(...stylesFor(source).map((style) => new Option(style.label, style.id)));
}

function updateTextCount() {
  textCount.textContent = `${Array.from(textInput.value).length} / 2000 · 推荐 100–500 字`;
}

function showResult(blob: Blob) {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(blob);
  preview.src = currentObjectUrl;
  download.href = currentObjectUrl;
  result.hidden = false;
}

function buildPayload(source: RenderSource, style: string) {
  const byline = bylineInput.value.trim();
  if (source === "plain-text") return { source, text: textInput.value, style, byline };
  const url = (source === "web-link" ? webInput.value : chatgptInput.value).trim();
  return { source, url, style, byline };
}

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.name === "source") {
    updateMode(input.value as RenderSource);
  }
});
textInput.addEventListener("input", updateTextCount);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const style = styleSelect.value;
  const payload = buildPayload(currentSource, style);

  if (currentSource === "plain-text") {
    if (textInput.value.trim().length === 0) return setStatus("请先输入要分享的文字。", "error");
  } else {
    const url = payload.url as string;
    if (!url) return setStatus("请先粘贴链接。", "error");
  }

  submitButton.disabled = true;
  setStatus("正在生成，请稍候……", "busy");
  try {
    const response = await fetch("/api/render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await describeError(response));
    const blob = await response.blob();
    if (blob.size === 0) throw new Error("未收到图片数据。");
    showResult(blob);
    setStatus("已生成。", "idle");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "生成失败，请重试。", "error");
  } finally {
    submitButton.disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
});

async function describeError(response: Response): Promise<string> {
  let code = "";
  try { code = (await response.json() as { error?: string }).error ?? ""; } catch { /* binary/empty response */ }
  const messages: Record<string, string> = {
    unsupported_share_url: "ChatGPT 链接格式不受支持。",
    unsupported_url: "链接不是有效的 http(s) 网址。",
    invalid_text: "请输入要分享的文字。",
    text_too_long: "文字超过 2000 字，请精简后再试。",
    unsupported_style: "所选图片风格暂不支持。",
    invalid_request: "请求内容不正确。",
    conversation_not_found: "未在页面中找到 ChatGPT 对话内容。",
    article_not_found: "未能从该网页提取正文，请换一个文章页。",
  };
  if (messages[code]) return messages[code];
  if (response.status === 413) return "请求内容过大。";
  if (response.status === 429) return "请求过于频繁，请稍后再试。";
  return "生成失败，请稍后重试。";
}

updateMode(currentSource);
updateTextCount();
