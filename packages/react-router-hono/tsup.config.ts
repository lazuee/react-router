import { defineConfig, type Options } from "tsup";

const baseConfig: Options = {
  format: ["esm"],
  platform: "node",
  target: "node20",
  treeshake: true,
  dts: true,
  minify: "terser",
  terserOptions: {
    compress: true,
    mangle: true,
    toplevel: true,
    format: { comments: "all", wrap_iife: true },
  },
};

export default defineConfig([
  {
    ...baseConfig,
    entry: {
      entry: "src/hono/entry.ts",
    },
    external: [
      "virtual:react-router/server-build",
      "virtual:lazuee/react-router",
    ],
  },
  {
    ...baseConfig,
    entry: {
      hono: "src/index.ts",
    },
  },
  {
    ...baseConfig,
    entry: {
      cache: "src/middleware/cache.ts",
    },
  },
]);
