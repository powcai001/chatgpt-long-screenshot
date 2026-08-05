/**
 * Error thrown when a share URL is not supported.
 */
const UNSUPPORTED_ERROR = "unsupported_share_url";

/**
 * Exact path pattern for ChatGPT share URLs: /s/t_ followed by 32 hex characters.
 */
const SHARE_PATH = /^\/s\/t_[0-9a-f]{32}$/;

/**
 * Validates a ChatGPT share URL.
 *
 * @param raw - The raw URL string to validate.
 * @returns A validated share URL object.
 * @throws {Error} If the URL is invalid. Error code is `unsupported_share_url`.
 */
export function validateChatGptShareUrl(raw: string): { platformId: "chatgpt"; canonicalUrl: string } {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // Must be HTTPS
  if (url.protocol !== "https:") {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // Must be exactly chatgpt.com
  if (url.hostname !== "chatgpt.com") {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // No credentials allowed
  if (url.username !== "" || url.password !== "") {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // No explicit port allowed (check raw URL string for port presence)
  if (raw.includes(":443/") || raw.includes(":80/") || /:\d+\//.test(raw)) {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // No query parameters allowed
  if (url.search !== "") {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // No hash fragments allowed
  if (url.hash !== "") {
    throw new Error(UNSUPPORTED_ERROR);
  }

  // Path must match exact pattern
  if (!SHARE_PATH.test(url.pathname)) {
    throw new Error(UNSUPPORTED_ERROR);
  }

  return {
    platformId: "chatgpt",
    canonicalUrl: url.href,
  };
}