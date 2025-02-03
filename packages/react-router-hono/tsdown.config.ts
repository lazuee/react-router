import { defineConfig, type Config, type Options } from "tsdown";

export const baseConfig: Options = {
  bundleDts: true,
  clean: true,
  dts: { transformer: "typescript" },
  format: "esm",
  platform: "node",
  shims: true,
  skipNodeModulesBundle: true,
  target: "node20",
  unused: false,
  external: [
    "virtual:react-router/server-build",
    "virtual:lazuee/react-router-hono-entry",
  ],
};

const config: Config = defineConfig({
  ...baseConfig,
  inputOptions: { resolve: { tsconfigFilename: "tsconfig.json" } },
  entry: [
    "src/index.ts",
    "src/hono/server/index.ts",
    "src/hono/options/index.ts",
    "src/hono/http.ts",
    "src/hono/entry/*.ts",
    "src/hono/middleware/*.ts",
  ],
});

export default config;
