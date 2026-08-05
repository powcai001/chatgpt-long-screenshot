import { describe, expect, it } from "vitest";

import { listPlatformIds, resolvePlatform } from "../../src/server/platforms/registry.js";

describe("Platform Registry", () => {
  describe("listPlatformIds", () => {
    it("returns immutable array of platform IDs", () => {
      const ids = listPlatformIds();
      expect(ids).toEqual(["chatgpt"]);
      expect(Object.isFrozen(ids)).toBe(true);
    });

    it("returns same instance on multiple calls", () => {
      const first = listPlatformIds();
      const second = listPlatformIds();
      expect(first).toBe(second);
    });
  });

  describe("resolvePlatform", () => {
    it("resolves ChatGPT platform for valid share URL", () => {
      const platform = resolvePlatform("https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef");
      expect(platform).toBeDefined();
      expect(platform.platformId).toBe("chatgpt");
    });

    it("throws for invalid share URL", () => {
      expect(() => resolvePlatform("https://example.com/invalid")).toThrow("unsupported_share_url");
    });

    it("throws for non-HTTPS URLs", () => {
      expect(() => resolvePlatform("http://chatgpt.com/s/t_0123456789abcdef0123456789abcdef")).toThrow(
        "unsupported_share_url",
      );
    });

    it("throws for URLs with query parameters", () => {
      expect(() =>
        resolvePlatform("https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef?foo=bar"),
      ).toThrow("unsupported_share_url");
    });
  });
});