import { defineConfig, type Options } from "tsup";

const baseConfig: Options = {
  bundle: true,
  clean: true,
  dts: true,
  format: ["esm"],
  minify: "terser",
  platform: "node",
  target: "node20",
  terserOptions: {
    compress: true,
    format: {
      comments: /\s*@vite-ignore\s*/,
    },
    nameCache: {},
    toplevel: true,
  },
  treeshake: true,
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
