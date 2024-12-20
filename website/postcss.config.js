// eslint-disable-next-line jsdoc/no-types
/** @param {import("postcss-load-config").Config} config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  plugins: {
    autoprefixer: {},
    tailwindcss: {},
    "tailwindcss/nesting": {},
  },
});
