//@ts-check

/** @param config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  plugins: {
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
  },
});
