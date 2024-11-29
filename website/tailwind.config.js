//@ts-check

/** @param config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  important: true,
  content: ["./src/client/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
    },
  },
  plugins: [],
});
