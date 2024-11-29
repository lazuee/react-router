import { defineESLintConfig } from "@ntnyq/eslint-config";

export default defineESLintConfig({
  typescript: {
    parserOptions: {
      project: ["website/tsconfig.json", "packages/*/tsconfig.json"],
    },
    overrides: {
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "@typescript-eslint/no-use-before-define": "off",
      "vars-on-top": "off",
      "no-var": "off",
    },
  },
  yml: {
    overrides: {
      "yml/quotes": ["error", { prefer: "double" }],
    },
  },
});
