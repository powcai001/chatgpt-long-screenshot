import { describe, expect, it } from "vitest";

import { formatDisplayHost, isProduction } from "../../src/server/runtime.js";

describe("runtime selection", () => {
  it("uses production mode for the compiled server entry", () => {
    expect(isProduction("/project/dist/server/index.js", undefined)).toBe(true);
  });

  it("uses development mode for source entry without NODE_ENV", () => {
    expect(isProduction("/project/src/server/index.ts", undefined)).toBe(false);
  });

  it("honors explicit production NODE_ENV", () => {
    expect(isProduction("/project/src/server/index.ts", "production")).toBe(true);
  });
});

describe("formatDisplayHost", () => {
  it("brackets IPv6 loopback host", () => {
    expect(formatDisplayHost("::1")).toBe("[::1]");
  });

  it("brackets a local IPv6 host", () => {
    expect(formatDisplayHost("fe80::1234")).toBe("[fe80::1234]");
  });

  it("leaves IPv4 and hostnames unbracketed", () => {
    expect(formatDisplayHost("127.0.0.1")).toBe("127.0.0.1");
    expect(formatDisplayHost("localhost")).toBe("localhost");
  });
});
