import { bunPreset, nodePreset, vercelPreset } from "@lazuee/react-router-hono";

/** @param {import("@react-router/dev/config").Config} config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  appDirectory: "src/client",
  prerender: ["pre-rendered"],
  presets: [bunPreset(), nodePreset(), vercelPreset({ regions: "hnd1" })],
  future: {
    unstable_optimizeDeps: true,
  },
});
