import { parse } from "node:path";
import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

export const baseConfig: UserConfig = {
  dts: true,
  format: "esm",
  shims: true,
  skipNodeModulesBundle: true,
  target: "node22",
  tsconfig: "tsconfig.json",
  external: [
    "virtual:react-router/server-build",
    "virtual:lazuee/react-router-hono[entry]",
  ],
};

const config = defineConfig({
  ...baseConfig,
  entry: [
    "src/global.d.ts",
    "src/index.ts",
    "src/hono/server/index.ts",
    "src/hono/options/index.ts",
    "src/hono/http.ts",
    "src/hono/runtime/**/*.ts",
    "src/deploy/*.ts",
    "src/hono/middleware/*.ts",
  ],
  exports: {
    customExports: (exports) =>
      Object.fromEntries(
        Object.entries(exports)
          .map(([key, value]) => [
            key.replace(/^.\/hono\//, "./").replace(/\/index$/, ""),
            value ??
              `${parse(exports["."]).dir}/${key.replace(/^.\//, "")}.d.mts`,
          ])
          .filter(([key]) =>
            [/^.\/(?:deploy|runtime|options|server)/].some((x) => !x.test(key)),
          ),
      ),
  },
});

export default config;
