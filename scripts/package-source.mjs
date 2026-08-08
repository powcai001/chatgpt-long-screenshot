import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ZipArchive } from "archiver";

export const outputPath = resolve("dist/chatgpt-long-screenshot-source.zip");
export const sourcePaths = [
  ".github/**",
  "docs/**",
  "scripts/**",
  "src/**",
  "test/**",
  ".gitignore",
  ".node-version",
  "LICENSE",
  "README.md",
  "eslint.config.js",
  "package.json",
  "playwright.config.ts",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "tsconfig.server.json",
  "vite.config.ts",
  "vitest.config.ts",
];

export async function packageSource() {
  await mkdir(dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });

  const output = createWriteStream(outputPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const completion = new Promise((resolvePromise, reject) => {
    output.on("close", resolvePromise);
    archive.on("error", reject);
    output.on("error", reject);
  });

  archive.pipe(output);
  for (const sourcePath of sourcePaths) {
    archive.glob(sourcePath, { cwd: ".", dot: true });
  }
  await archive.finalize();
  await completion;

  return outputPath;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const createdPath = await packageSource();
  console.log(`Created ${createdPath}`);
  if (process.argv.includes("--list")) {
    process.stdout.write(execFileSync("unzip", ["-Z1", createdPath], { encoding: "utf8" }));
  }
}
