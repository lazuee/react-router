import { defineConfig, type Options } from "tsup";

const baseConfig: Options = {
  bundle: true,
  clean: false,
  dts: true,
  format: ["esm"],
  minify: "terser",
  platform: "node",
  target: "node20",
  treeshake: true,
  terserOptions: {
    compress: true,
    nameCache: {},
    toplevel: true,
    format: {
      comments: /\s*@vite-ignore\s*/,
    },
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
      entryServer: "src/hono/entryServer.ts",
    },
  },
  {
    ...baseConfig,
    entry: {
      http: "src/hono/http.ts",
    },
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
  {
    ...baseConfig,
    external: ["@hono/node-server/serve-static", "hono/bun"],
    entry: {
      serveStatic: "src/middleware/serveStatic.ts",
    },
  },
]);
