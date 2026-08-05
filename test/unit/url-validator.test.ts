import { describe, expect, it } from "vitest";

import { validateChatGptShareUrl } from "../../src/server/security/url-validator.js";

describe("validateChatGptShareUrl", () => {
  const valid = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";

  it("accepts canonical ChatGPT share URL", () => {
    expect(validateChatGptShareUrl(valid)).toEqual({
      platformId: "chatgpt",
      canonicalUrl: valid,
    });
  });

  it("accepts lowercase hex characters in share ID", () => {
    const url = "https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef";
    expect(validateChatGptShareUrl(url)).toEqual({
      platformId: "chatgpt",
      canonicalUrl: url,
    });
  });

  it("rejects http protocol", () => {
    expect(() => validateChatGptShareUrl("http://chatgpt.com/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with credentials", () => {
    expect(() => validateChatGptShareUrl("https://user:pass@chatgpt.com/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects explicit ports", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com:443/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects uppercase characters in share ID", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_6A72D47623E88191AA42C784B9A53768")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects invalid share ID format", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_invalid")).toThrow("unsupported_share_url");
  });

  it("rejects share ID with wrong prefix", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/x_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with query parameters", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef?foo=bar")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with hash fragments", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef#section")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects /share/ path format", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/share/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects different domain with chatgpt.com prefix", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com.evil.test/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(() => validateChatGptShareUrl("//chatgpt.com/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects file protocol", () => {
    expect(() => validateChatGptShareUrl("file:///etc/passwd")).toThrow("unsupported_share_url");
  });

  it("rejects data URLs", () => {
    expect(() => validateChatGptShareUrl("data:text/html,<script>alert('xss')</script>")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects javascript URLs", () => {
    expect(() => validateChatGptShareUrl("javascript:alert('xss')")).toThrow("unsupported_share_url");
  });

  it("rejects IPv4 addresses", () => {
    expect(() => validateChatGptShareUrl("https://127.0.0.1/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects IPv6 addresses", () => {
    expect(() => validateChatGptShareUrl("https://[::1]/s/t_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects encoded path separators", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com%2Fs%2Ft_0123456789abcdef0123456789abcdef")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with 31 character hex ID", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_6a72d47623e88191aa42c784b9a5376")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with 33 character hex ID", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_0123456789abcdef0123456789abcdef9")).toThrow(
      "unsupported_share_url",
    );
  });

  it("rejects URLs with non-hex characters", () => {
    expect(() => validateChatGptShareUrl("https://chatgpt.com/s/t_6a72d47623e88191aa42c784b9a5376g")).toThrow(
      "unsupported_share_url",
    );
  });

  it("errors never contain input URL", () => {
    const testUrl = "https://chatgpt.com/s/t_invalid";
    try {
      validateChatGptShareUrl(testUrl);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).not.toContain(testUrl);
      expect(String(error)).not.toContain("t_invalid");
    }
  });
});