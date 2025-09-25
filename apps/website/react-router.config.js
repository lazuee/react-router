import { vercelPreset } from "@vercel/react-router/vite";
import * as env from "./src/env.server";

/** @param {import("@react-router/dev/config").Config} config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  appDirectory: "src/client",
  prerender: ["pre-rendered"],
  presets: [...(env.IS_VERCEL ? [vercelPreset()] : [])],
  future: {
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    v8_middleware: true,
  },
});
