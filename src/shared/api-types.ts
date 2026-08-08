export interface HealthResponse {
  status: "ok";
}

export type RenderSource = "chatgpt-share" | "plain-text";
export type RenderStyleId = "conversation-clean" | "text-card";

export interface ChatGptShareRequest {
  readonly source: "chatgpt-share";
  readonly url: string;
  readonly style?: "conversation-clean";
}

export interface PlainTextRequest {
  readonly source: "plain-text";
  readonly text: string;
  readonly style?: "text-card";
}

export interface LegacyRenderRequest {
  readonly url: string;
}

export type RenderRequest = ChatGptShareRequest | PlainTextRequest | LegacyRenderRequest;

export type RenderJob =
  | Readonly<{
      source: "chatgpt-share";
      canonicalUrl: string;
      style: "conversation-clean";
    }>
  | Readonly<{
      source: "plain-text";
      text: string;
      style: "text-card";
    }>;

export interface RenderStyleOption {
  readonly id: RenderStyleId;
  readonly label: string;
  readonly source: RenderSource;
}

export const RENDER_STYLE_OPTIONS: readonly RenderStyleOption[] = Object.freeze([
  Object.freeze({ id: "conversation-clean", label: "简洁对话", source: "chatgpt-share" }),
  Object.freeze({ id: "text-card", label: "文字卡片", source: "plain-text" }),
]);
