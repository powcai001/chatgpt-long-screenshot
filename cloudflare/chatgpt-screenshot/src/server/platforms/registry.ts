import { ChatGptAdapter } from "./chatgpt.js";
import type { PlatformAdapter, PlatformId } from "./types.js";

/**
 * Immutable list of supported platform IDs.
 */
const PLATFORM_IDS = Object.freeze(["chatgpt"] as const);

/**
 * Lists all supported platform IDs.
 *
 * @returns An immutable array of platform IDs.
 */
export function listPlatformIds(): readonly PlatformId[] {
  return PLATFORM_IDS;
}

/**
 * Resolves a platform adapter from a share URL.
 *
 * @param raw - The raw share URL to resolve.
 * @returns The platform adapter for the URL.
 * @throws {Error} If the URL is invalid or unsupported.
 */
export function resolvePlatform(raw: string): PlatformAdapter {
  // Try ChatGPT adapter
  ChatGptAdapter.validateShareUrl(raw);
  return ChatGptAdapter;
}