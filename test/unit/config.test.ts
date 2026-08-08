import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/server/config.js";

describe("loadConfig", () => {
  it("defaults to loopback on port 4173", () => {
    expect(loadConfig({})).toMatchObject({
      host: "127.0.0.1",
      port: 4173,
      lanMode: false,
    });
  });

  it("marks explicit all-interface binding as LAN mode", () => {
    expect(loadConfig({ HOST: "0.0.0.0", PORT: "5000" })).toMatchObject({
      host: "0.0.0.0",
      port: 5000,
      lanMode: true,
    });
  });

  it.each(["0", "65536", "abc"])("rejects invalid port %s", (PORT) => {
    expect(() => loadConfig({ PORT })).toThrow("invalid_port");
  });

  it("rejects an IP address that is not assigned locally", () => {
    expect(() => loadConfig({ HOST: "203.0.113.10" })).toThrow("invalid_host");
  });
});
