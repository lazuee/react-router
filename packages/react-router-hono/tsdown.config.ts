import { defineConfig, type Options } from "tsdown";

export const baseConfig: Options = {
  dts: true,
  format: "esm",
  shims: true,
  skipNodeModulesBundle: true,
  target: "node20",
  external: [
    "virtual:react-router/server-build",
    "virtual:lazuee/react-router-hono-entry",
  ],
};

const config = defineConfig({
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
  exports: {
    customExports: (exports) =>
      Object.fromEntries(
        Object.entries(exports)
          .map(([key, value]) => [
            key.replace(/^.\/hono\//, "./").replace(/\/index$/, ""),
            value,
          ])
          .filter(([key]) => [/^.\/entry/].some((x) => !x.test(key))),
      ),
  },
});

export default config;
