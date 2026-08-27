import { defineConfig } from "oxlint";
import legibility from "eslint-plugin-legibility";

const recommendedConfig = legibility.configs["oxlint/recommended"];
const strictMigrationFiles = ["src/navigator/json/index.ts", "src/scriptc/**/*.ts"];

export default defineConfig({
  ...recommendedConfig,
  rules: {
    ...recommendedConfig.rules,
    complexity: ["warn", 10],
    "max-lines-per-function": [
      "warn",
      {
        max: 20,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      },
    ],
  },
  overrides: [
    {
      files: strictMigrationFiles,
      rules: {
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
        "legibility/no-complex-ternaries": "error",
      },
    },
  ],
});
