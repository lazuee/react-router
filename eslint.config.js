//@ts-check
import { defineESLintConfig } from "@ntnyq/eslint-config";

export default defineESLintConfig({
  ignores: ["**/README.md/*.ts"],
  importX: {
    typescript: true,
    overrides: {
      "import-x/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],
    },
  },
  jsdoc: {
    overrides: {
      "jsdoc/no-types": "off",
    },
  },
  typescript: {
    overrides: {
      "@typescript-eslint/no-use-before-define": "off",
    },
    parserOptions: {
      project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
    },
  },
  yml: {
    overrides: {
      "yml/quotes": ["error", { prefer: "double" }],
    },
  },
});
