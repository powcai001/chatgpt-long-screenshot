import type { RenderSource, RenderStyleOption } from "../shared/api-types";
import { RENDER_STYLE_OPTIONS } from "../shared/api-types";
import "./styles.css";

function getElement<T extends Element = Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const form = getElement<HTMLFormElement>("#render-form");
const urlField = getElement<HTMLElement>("#url-field");
const textField = getElement<HTMLElement>("#text-field");
const urlInput = getElement<HTMLInputElement>("#share-url");
const textInput = getElement<HTMLTextAreaElement>("#share-text");
const textCount = getElement<HTMLElement>("#text-count");
const styleSelect = getElement<HTMLSelectElement>("#style");
const submitButton = getElement<HTMLButtonElement>("#submit");
const status = getElement<HTMLParagraphElement>("#status");
const result = getElement<HTMLElement>("#result");
const preview = getElement<HTMLImageElement>("#preview");
const download = getElement<HTMLAnchorElement>("#download");

let currentSource: RenderSource = "chatgpt-share";
let currentObjectUrl: string | null = null;

function setStatus(message: string, tone: "idle" | "busy" | "error" = "idle") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function stylesFor(source: RenderSource): readonly RenderStyleOption[] {
  return RENDER_STYLE_OPTIONS.filter((option) => option.source === source);
}

function updateMode(source: RenderSource) {
  currentSource = source;
  const isText = source === "plain-text";
  urlField.hidden = isText;
  textField.hidden = !isText;
  urlInput.required = !isText;
  textInput.required = isText;
  styleSelect.replaceChildren(
    ...stylesFor(source).map((style) => new Option(style.label, style.id)),
  );
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

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.name === "source") {
    updateMode(input.value as RenderSource);
  }
});
textInput.addEventListener("input", updateTextCount);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = currentSource === "plain-text"
    ? { source: currentSource, text: textInput.value, style: styleSelect.value }
    : { source: currentSource, url: urlInput.value.trim(), style: styleSelect.value };

  if (currentSource === "plain-text" && textInput.value.trim().length === 0) {
    setStatus("请先输入要分享的文字。", "error");
    return;
  }
  if (currentSource === "chatgpt-share" && urlInput.value.trim().length === 0) {
    setStatus("请先粘贴分享链接。", "error");
    return;
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
    unsupported_share_url: "链接格式不受支持，请确认是 ChatGPT 公开分享链接。",
    invalid_text: "请输入要分享的文字。",
    text_too_long: "文字超过 2000 字，请精简后再试。",
    unsupported_style: "所选图片风格暂不支持。",
    invalid_request: "请求内容不正确。",
  };
  if (messages[code]) return messages[code];
  if (response.status === 413) return "请求内容过大。";
  if (response.status === 429) return "请求过于频繁，请稍后再试。";
  return "生成失败，请稍后重试。";
}

updateMode(currentSource);
updateTextCount();
