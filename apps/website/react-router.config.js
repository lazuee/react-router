import { env } from "node:process";
import { vercelPreset } from "@vercel/react-router/vite";

/** @param {import("@react-router/dev/config").Config} config */
function defineConfig(config) {
  return config;
}

export default defineConfig({
  appDirectory: "src/client",
  prerender: ["pre-rendered"],
  presets: [...(env.VERCEL ? [vercelPreset()] : [])],
  future: {
    unstable_optimizeDeps: true,
  },
});
