//@ts-check

import { nodePreset, vercelPreset } from "@lazuee/react-router-hono";

/** @param config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  appDirectory: "src/client",
  presets: [vercelPreset(), nodePreset()],
  future: {
    unstable_optimizeDeps: true,
  },
});
