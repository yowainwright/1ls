import { defineConfig } from "oxlint";
import legibility from "eslint-plugin-legibility";

const strictConfig = legibility.configs["oxlint/strict"];

export default defineConfig({
  ...strictConfig,
  rules: {
    ...strictConfig.rules,
    complexity: ["error", 10],
    "max-lines-per-function": [
      "error",
      {
        max: 20,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      },
    ],
  },
});
