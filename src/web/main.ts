import "./styles.css";

function getElement<T extends Element = Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

const form = getElement<HTMLFormElement>("#render-form");
const urlInput = getElement<HTMLInputElement>("#share-url");
const submitButton = getElement<HTMLButtonElement>("#submit");
const status = getElement<HTMLParagraphElement>("#status");
const result = getElement<HTMLElement>("#result");
const preview = getElement<HTMLImageElement>("#preview");
const download = getElement<HTMLAnchorElement>("#download");

let currentObjectUrl: string | null = null;

function setStatus(message: string, tone: "idle" | "busy" | "error" = "idle") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function showResult(blob: Blob) {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
  }
  currentObjectUrl = URL.createObjectURL(blob);
  preview.src = currentObjectUrl;
  download.href = currentObjectUrl;
  result.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = urlInput.value.trim();
  if (!url) {
    setStatus("请先粘贴分享链接。", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("正在生成，请稍候……", "busy");
  result.hidden = true;

  try {
    const response = await fetch("/api/render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(await describeError(response));
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("未收到图片数据。");
    }
    showResult(blob);
    setStatus("已生成。", "idle");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "生成失败，请重试。", "error");
  } finally {
    submitButton.disabled = false;
  }
});

async function describeError(response: Response): Promise<string> {
  if (response.status === 429) {
    return "请求过于频繁，请稍后再试。";
  }
  if (response.status === 413) {
    return "请求内容过大。";
  }
  if (response.status === 502 || response.status === 504) {
    return "浏览器暂时不可用，请稍后再试。";
  }
  if (response.status === 400) {
    return "链接格式不受支持，请确认是 ChatGPT 公开分享链接。";
  }
  return "生成失败，请稍后重试。";
}
