export interface HealthResponse {
  status: "ok";
}

export type RenderSource = "chatgpt-share" | "web-link" | "plain-text";

export type ArticleTheme =
  | "article-clean"
  | "article-apple"
  | "article-dark"
  | "article-magazine"
  | "article-social";

export type RenderStyleId = "conversation-clean" | ArticleTheme;

export interface ChatGptShareRequest {
  readonly source: "chatgpt-share";
  readonly url: string;
  readonly style?: "conversation-clean";
  readonly byline?: string;
}

export interface WebLinkRequest {
  readonly source: "web-link";
  readonly url: string;
  readonly style?: ArticleTheme;
  readonly byline?: string;
}

export interface PlainTextRequest {
  readonly source: "plain-text";
  readonly text: string;
  readonly style?: ArticleTheme;
  readonly byline?: string;
}

export interface LegacyRenderRequest {
  readonly url: string;
}

export type RenderRequest = ChatGptShareRequest | WebLinkRequest | PlainTextRequest | LegacyRenderRequest;

export type RenderJob =
  | Readonly<{ source: "chatgpt-share"; canonicalUrl: string; style: "conversation-clean"; byline: string }>
  | Readonly<{ source: "web-link"; canonicalUrl: string; style: ArticleTheme; byline: string }>
  | Readonly<{ source: "plain-text"; text: string; style: ArticleTheme; byline: string }>;

export interface RenderStyleOption {
  readonly id: RenderStyleId;
  readonly label: string;
  readonly sources: readonly RenderSource[];
}

const ARTICLE_SOURCES: readonly RenderSource[] = Object.freeze(["web-link", "plain-text"]);

function article(id: ArticleTheme, label: string): RenderStyleOption {
  return Object.freeze({ id, label, sources: ARTICLE_SOURCES });
}

export const RENDER_STYLE_OPTIONS: readonly RenderStyleOption[] = Object.freeze([
  Object.freeze({ id: "conversation-clean", label: "简洁对话", sources: Object.freeze<RenderSource[]>(["chatgpt-share"]) }),
  article("article-clean", "简约白"),
  article("article-apple", "苹果风"),
  article("article-dark", "深色"),
  article("article-magazine", "杂志风"),
  article("article-social", "社交卡片"),
]);

export function isArticleSource(source: RenderSource): boolean {
  return source === "web-link" || source === "plain-text";
}
