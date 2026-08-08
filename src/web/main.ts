import type { RenderSource, RenderStyleId, RenderStyleOption } from "../shared/api-types";
import { RENDER_STYLE_OPTIONS } from "../shared/api-types";
import "./styles.css";

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
const stylePicker = getElement<HTMLElement>("#style-picker");
const samplePreview = getElement<HTMLImageElement>("#sample-preview");
const bylineInput = getElement<HTMLInputElement>("#byline");
const submitButton = getElement<HTMLButtonElement>("#submit");
const status = getElement<HTMLParagraphElement>("#status");
const resultEmpty = getElement<HTMLElement>("#result-empty");
const result = getElement<HTMLElement>("#result");
const previewScroll = getElement<HTMLElement>("#preview-scroll");
const previewNatural = getElement<HTMLButtonElement>("#preview-natural");
const previewFit = getElement<HTMLButtonElement>("#preview-fit");
const preview = getElement<HTMLImageElement>("#preview");
const download = getElement<HTMLAnchorElement>("#download");

let currentSource: RenderSource = "chatgpt-share";
let currentStyleId: RenderStyleId = "article-liuguang";
let currentPreviewMode: "natural" | "fit" = "fit";
let currentObjectUrl: string | null = null;

function setStatus(message: string, tone: "idle" | "busy" | "error" = "idle") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function stylesFor(source: RenderSource): readonly RenderStyleOption[] {
  return RENDER_STYLE_OPTIONS.filter((option) => option.sources.includes(source));
}

function renderStylePicker(source: RenderSource) {
  const options = stylesFor(source);
  stylePicker.replaceChildren();
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "style-thumb";
    button.dataset.styleId = option.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(option.id === currentStyleId));
    const img = document.createElement("img");
    img.src = `/samples/${option.id}.png`;
    img.alt = `${option.label} 样例`;
    img.loading = "lazy";
    const label = document.createElement("span");
    label.textContent = option.label;
    button.append(img, label);
    button.addEventListener("click", () => selectStyle(option.id));
    stylePicker.append(button);
  }
  if (!options.some((option) => option.id === currentStyleId)) {
    currentStyleId = options[0].id;
  }
  syncPickerSelection();
}

function syncPickerSelection() {
  for (const button of stylePicker.querySelectorAll<HTMLButtonElement>(".style-thumb")) {
    const selected = button.dataset.styleId === currentStyleId;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  }
}

function selectStyle(id: RenderStyleId) {
  currentStyleId = id;
  syncPickerSelection();
  updateSamplePreview();
  // A previously generated image used the old style; show the sample again.
  result.hidden = true;
  resultEmpty.hidden = false;
}

function updateSamplePreview() {
  samplePreview.src = `/samples/${currentStyleId}.png`;
}

function updateMode(source: RenderSource) {
  currentSource = source;
  const field = source === "chatgpt-share" ? "chatgpt" : source === "web-link" ? "web" : "text";
  chatgptField.hidden = field !== "chatgpt";
  webField.hidden = field !== "web";
  textField.hidden = field !== "text";
  chatgptInput.required = field === "chatgpt";
  webInput.required = field === "web";
  textInput.required = field === "text";
  renderStylePicker(source);
  updateSamplePreview();
}

function updateTextCount() {
  textCount.textContent = `${Array.from(textInput.value).length} / 2000 · 推荐 100–500 字`;
}

function setPreviewMode(mode: "natural" | "fit") {
  currentPreviewMode = mode;
  previewScroll.classList.toggle("natural", mode === "natural");
  previewScroll.classList.toggle("fit", mode === "fit");
  previewNatural.classList.toggle("selected", mode === "natural");
  previewFit.classList.toggle("selected", mode === "fit");
}

previewNatural.addEventListener("click", () => setPreviewMode("natural"));
previewFit.addEventListener("click", () => setPreviewMode("fit"));

function showResult(blob: Blob) {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(blob);
  preview.src = currentObjectUrl;
  download.href = currentObjectUrl;
  resultEmpty.hidden = true;
  result.hidden = false;
}

function buildPayload(source: RenderSource) {
  const byline = bylineInput.value.trim();
  if (source === "plain-text") return { source, text: textInput.value, style: currentStyleId, byline };
  const url = (source === "web-link" ? webInput.value : chatgptInput.value).trim();
  return { source, url, style: currentStyleId, byline };
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
  const payload = buildPayload(currentSource);

  if (currentSource === "plain-text") {
    if (textInput.value.trim().length === 0) return setStatus("请先输入要分享的文字。", "error");
  } else if (!(payload.url as string)) {
    return setStatus("请先粘贴链接。", "error");
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
setPreviewMode(currentPreviewMode);
