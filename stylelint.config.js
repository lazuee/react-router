//@ts-check

/** @param config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-tailwindcss",
    "stylelint-config-clean-order",
  ],
  overrides: [
    {
      files: ["*.scss"],
      plugins: ["stylelint-scss"],
    },
  ],
  rules: {
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "import",
          "import-glob",
        ],
      },
    ],
    "no-descending-specificity": null,
    "selector-class-pattern": null,
  },
});
