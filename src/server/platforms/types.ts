/**
 * Validated share URL result.
 */
export interface ValidatedShareUrl {
  readonly platformId: "chatgpt";
  readonly canonicalUrl: string;
}

/**
 * Platform identifier.
 */
export type PlatformId = "chatgpt";

/**
 * Platform adapter interface.
 */
export interface PlatformAdapter {
  readonly platformId: PlatformId;
  validateShareUrl(url: string): ValidatedShareUrl;
}