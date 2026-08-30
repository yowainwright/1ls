#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const versionContent = `export const VERSION = "${packageJson.version}";\n`;
await writeFile("src/version.ts", versionContent);
