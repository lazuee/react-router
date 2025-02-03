import { existsSync, promises as fsp } from "node:fs";
import { join, parse, resolve } from "node:path";

import { exit } from "node:process";
import { fileURLToPath } from "node:url";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import { vm } from "../../constants";
import { colors, isBun, requireFrom } from "../../lib/utils";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const esbuildOptions: import("esbuild").BuildOptions = {
  target: "esnext",
  platform: "node",
  charset: "utf8",
  minify: false,
  minifyIdentifiers: false,
  minifySyntax: false,
  minifyWhitespace: false,
  treeShaking: false,
  // keepNames is not needed when minify is disabled.
  // Also transforming multiple times with keepNames enabled breaks
  // tree-shaking. (#9164)
  keepNames: false,
  supported: {
    "dynamic-import": true,
    "import-meta": true,
  },
  loader: { ".ts": "ts" },
  bundle: true,
  format: "esm",
  legalComments: "none",
};
const esbuild = requireFrom("esbuild") as typeof import("esbuild");

export function plugin(): Plugin[] {
  let runtimeFile = "";
  let isBuild = false;

  return [
    {
      name: "@lazuee/react-router-hono[prod]",
      config: {
        order: "post",
        handler(_, { isSsrBuild, command }) {
          isBuild = command === "build";
          if (!isBuild) return _;

          runtimeFile = join(
            `${_.__reactRouterHono?.directory?.honoEntry}`,
            `${_.__reactRouterHono?.runtime}.js`,
          );
          if (!existsSync(runtimeFile)) {
            throw new Error(`Environment is not supported: ${runtimeFile}.`);
          }

          const immutable = "_immutable";

          return mergeConfig(_, {
            build: {
              rollupOptions: {
                external: ["@lazuee/react-router-hono"],
                output: {
                  entryFileNames: `${isSsrBuild ? "" : `${immutable}/`}[name]${isSsrBuild ? "" : ".[hash]"}.js`,
                  assetFileNames: `${isSsrBuild ? "" : `${immutable}/`}assets/[name].[hash][extname]`,
                  chunkFileNames: `${isSsrBuild ? "" : `${immutable}/`}chunks/[name].[hash].js`,
                },
              },
            },
            environments: {
              ssr: {
                build: {
                  target: "es2022",
                  rollupOptions: {
                    input: { index: runtimeFile },
                  },
                },
                optimizeDeps: {
                  esbuildOptions: {
                    platform: "node",
                    target: "esnext",
                  },
                },
              },
            },
          } satisfies UserConfig);
        },
      },
      resolveId(id) {
        if (!isBuild) return;
        const vmod = Object.values(vm).find((vmod) => vmod.id === id);
        if (vmod) return vmod.resolvedId;
      },
      async load(id) {
        if (!isBuild) return;
        switch (id) {
          case vm.entry.resolvedId: {
            const entry = resolve(
              __reactRouterHono.vite.root,
              `${__reactRouterHono.entry.hono}`,
            );
            if (!existsSync(entry)) return "";
            const tempDir = await fsp.mkdtemp(join(__dirname, "temp-"));
            const tempEntry = join(tempDir, `${parse(entry).name}.js`);

            await esbuild.build({
              ...esbuildOptions,
              packages: "external",
              external: ["virtual:react-router/server-build"],
              tsconfig: join(__viteConfig.root, "tsconfig.json"),
              entryPoints: [entry],
              outfile: tempEntry,
            });

            const code = await fsp.readFile(tempEntry, "utf-8");
            if (
              ["hono/compress", "CompressionStream"].some((x) =>
                code.includes(x),
              ) &&
              isBun
            ) {
              const warnCompression = [
                "Bun environment detected. 'CompressionStream' is not supported in Bun.",
                "It appears you're using 'hono/compress', which relies on 'CompressionStream'.",
                "To resolve this:",
                `- Remove 'hono/compress' from ${__reactRouterHono.entry.hono}.`,
                "- Replace it with an alternative compression implementation that is compatible with Bun.",
                "- Run 'bun run --bun react-router build' to apply the Bun preset.",
              ].join("\n");
              __logger.error(colors().red(warnCompression));
              exit(1);
            }

            await fsp.rm(tempDir, { recursive: true, force: true });

            return code;
          }
        }
      },
      async transform(code, id) {
        switch (id) {
          case resolve(runtimeFile): {
            const banner = [
              // !isBun && warnBun,
              `globalThis.__reactRouterHono ??= ${JSON.stringify(globalThis.__reactRouterHono)};`,
            ]
              .flat()
              .filter(Boolean)
              .join("")
              .trim();
            return banner + code;
          }
        }
      },
    },
  ];
}
