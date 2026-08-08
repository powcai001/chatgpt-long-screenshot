import { execFileSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const outputPath = resolve("dist/chatgpt-long-screenshot-source.zip");
const forbiddenEntries = [
  ".git/",
  ".claude/",
  ".dev.vars",
  ".env",
  "node_modules/",
  "dist/",
  "playwright-report/",
  "test-results/",
];

afterEach(async () => {
  await rm(outputPath, { force: true });
});

describe("packageSource", () => {
  it("includes public source files and excludes local state", () => {
    execFileSync(process.execPath, ["scripts/package-source.mjs"], { stdio: "pipe" });

    const entries = execFileSync("unzip", ["-Z1", outputPath], { encoding: "utf8" }).trim().split("\n");

    expect(entries).toContain("package.json");
    expect(entries).toContain("pnpm-lock.yaml");
    expect(entries).toContain("src/server/app.ts");
    expect(entries).toContain("docs/cloudflare-deployment.md");
    expect(entries).not.toContain("HANDOFF.md");
    expect(entries).not.toContain("IMPLEMENTATION-PLAN.md");
    for (const forbiddenEntry of forbiddenEntries) {
      expect(entries.some((entry) => entry === forbiddenEntry || entry.startsWith(forbiddenEntry))).toBe(false);
    }
  });
});
