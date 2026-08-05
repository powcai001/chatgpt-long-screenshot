import { validateChatGptShareUrl } from "../security/url-validator.js";
import type { PlatformAdapter, ValidatedShareUrl } from "./types.js";

/**
 * ChatGPT platform adapter.
 */
export const ChatGptAdapter: PlatformAdapter = {
  platformId: "chatgpt",

  validateShareUrl(url: string): ValidatedShareUrl {
    return validateChatGptShareUrl(url);
  },
};