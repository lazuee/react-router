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
    "no-descending-specificity": null,
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
    "selector-class-pattern": null,
  },
});
