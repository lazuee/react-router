import { defineConfig, type UserConfig } from "tsdown";

export const baseConfig: UserConfig = {
  dts: true,
  format: "esm",
  shims: true,
  skipNodeModulesBundle: true,
  target: "node22",
  tsconfig: "tsconfig.json",
  external: [
    "virtual:react-router/server-build",
    "virtual:lazuee/react-router-hono-entry",
  ],
};

const config = defineConfig({
  ...baseConfig,
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
          .filter(([key]) =>
            [/^.\/(?:entry|options|server)/].some((x) => !x.test(key)),
          ),
      ),
  },
});

export default config;
