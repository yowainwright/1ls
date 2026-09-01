import { defineConfig } from "rolldown";

const target = process.env.BUILD_TARGET;
const shouldBuildBrowser = target === undefined || target === "browser";
const shouldBuildCli = target === undefined || target === "cli";

const configs = [
  shouldBuildCli && {
    input: "./src/cli/index.ts",
    platform: "node",
    output: {
      codeSplitting: false,
      file: "dist/index.js",
      format: "esm",
      minify: true,
    },
  },
  shouldBuildBrowser && {
    input: "./src/browser/index.ts",
    platform: "browser",
    output: {
      codeSplitting: false,
      file: "dist/browser/index.js",
      format: "esm",
      minify: true,
    },
  },
].filter((config) => config !== false);

export default defineConfig(configs);
