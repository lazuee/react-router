//@ts-check

import { env } from "node:process";

import { reactRouterHono } from "@lazuee/react-router-hono";

import { reactRouter } from "@react-router/dev/vite";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const port = Number.parseInt(env?.PORT || "3000");

export default defineConfig({
  plugins: [
    reactRouterHono({
      serverFile: "src/server/index.ts",
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  build: {
    minify: "esbuild",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1024,
    copyPublicDir: false,
    rollupOptions: {
      output: { minifyInternalExports: true },
    },
  },
  esbuild: {
    format: "esm",
    mangleCache: {},
  },
  server: {
    port,
    open: false,
  },
});
