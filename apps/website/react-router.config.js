/** @param {import('@react-router/dev/config').Config} config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  appDirectory: "src/client",
  prerender: ["pre-rendered"],
  future: {
    unstable_optimizeDeps: true,
    v8_middleware: true,
    v8_splitRouteModules: true,
  },
});
