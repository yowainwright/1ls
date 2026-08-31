import { defineConfig } from "oxlint";
import legibility from "eslint-plugin-legibility";

const strictConfig = legibility.configs["oxlint/strict"];

export default defineConfig({
  ...strictConfig,
  ignorePatterns: ["app/src/components/ui/**"],
  overrides: [
    {
      files: ["app/src/**/*.ts", "app/src/**/*.tsx"],
      rules: {
        complexity: strictConfig.rules.complexity,
        "max-lines-per-function": strictConfig.rules["max-lines-per-function"],
      },
    },
    {
      files: ["app/src/**/*.test.ts", "app/src/**/*.test.tsx"],
      rules: {
        "max-lines-per-function": "off",
      },
    },
  ],
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
