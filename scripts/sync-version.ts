#!/usr/bin/env bun

const packageJson = await Bun.file("package.json").json();
const versionContent = `export const VERSION = "${packageJson.version}";\n`;
await Bun.write("src/version.ts", versionContent);
