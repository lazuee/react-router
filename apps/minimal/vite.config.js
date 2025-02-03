import { env } from "node:process";

import { reactRouterHono } from "@lazuee/react-router-hono";
import { reactRouter } from "@react-router/dev/vite";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const port = Number.parseInt(env?.PORT || "3000");

export default defineConfig({
  plugins: [reactRouterHono(), reactRouter(), tsconfigPaths()],
  server: {
    port,
  },
});
