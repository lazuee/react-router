import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import rwr from "resolve-workspace-root";
import { mergeConfig } from "vite";
import { findFileWithExtensions, isRelativePath } from "../../lib/file";
import { bundleWithEsbuild } from "../../lib/package";
import {
  getReactRouterConfig,
  hasVercelPreset,
  isRSC,
} from "../../lib/react-router";
import { getRuntime, isVercel } from "../../lib/utils";
import { virtual } from "../../lib/virtual";
import { loadDotenv } from "../../lib/vite";
import { devServer, getAdapter } from "./dev-server";
import { fixRSCBuild } from "./fix-rsc-build";
import type { Plugin, UserConfig } from "vite";

export interface PluginOptions {
  serverFile?: string;
  exclude?: (string | RegExp)[];
}

export function plugin(opts: PluginOptions): Plugin[] {
  const reactRouterConfig = getReactRouterConfig();
  const runtime = getRuntime();

  const workspaceRootDir =
    rwr.resolveWorkspaceRoot(process.cwd()) || process.cwd();
  const honoDir = resolve(import.meta.dirname, "hono");
  const runtimeFile = findFileWithExtensions({
    cwd: join(honoDir, "runtime", isVercel() ? "vercel" : ""),
    extensions: ["js", "ts", "mjs", "mts"],
    filename: runtime,
  });
  const honoDev = devServer({
    adapter: getAdapter(),
    appDirectory: reactRouterConfig?.appDirectory,
    entry: virtual.server.resolvedId,
    exclude: opts.exclude,
  });

  let rootDir: string;
  let serverFile = opts.serverFile;
  let build = 0;

  const closeBundle = async () => {
    const buildDir = globalThis.__reactRouterHono.directory.build;
    if (globalThis.__reactRouterHono?.rsc) {
      console.info("Fixing Hono server for RSC...");
      await fixRSCBuild(buildDir);
    }
    if (!hasVercelPreset() && isVercel()) {
      console.info("Generating Vercel function...");
      spawn("node", ["./deploy/vercel.mjs", buildDir, workspaceRootDir], {
        cwd: import.meta.dirname,
        shell: true,
        stdio: "inherit",
      });
    }
  };

  return [
    {
      ...honoDev,
      apply: "serve",
      configureServer(viteDevServer) {
        viteDevServer.middlewares.use((req, _res, next) => {
          req.rawHeaders.push(
            "x-remote-address",
            req.socket.remoteAddress || "unknown",
            "x-remote-port",
            String(req.socket.remotePort || "unknown"),
            "x-remote-family",
            req.socket.remoteFamily || "unknown",
          );

          next();
        });

        if (honoDev.configureServer) {
          if (typeof honoDev.configureServer === "function") {
            honoDev.configureServer.call(this, viteDevServer);
          } else if (
            "handler" in honoDev.configureServer &&
            typeof honoDev.configureServer.handler === "function"
          ) {
            honoDev.configureServer.handler.call(this, viteDevServer);
          }
        }
      },
      name: "@lazuee/react-router-hono[dev]",
    },
    {
      apply: "build",
      buildStart() {
        build++;
      },
      async configResolved(viteConfig) {
        if (
          !viteConfig.environments.rsc &&
          "__reactRouterPluginContext" in viteConfig
        ) {
          const reactRouterConfig =
            viteConfig.__reactRouterPluginContext?.reactRouterConfig;
          const origBuildEnd = reactRouterConfig.buildEnd!;
          reactRouterConfig.buildEnd = async function (...args: any) {
            await origBuildEnd?.apply(this, args);
            await closeBundle();
          };
        }
      },
      closeBundle: {
        async handler() {
          if (this.environment.config.environments.rsc && build > 4) {
            await closeBundle();
          }
        },
        order: "post",
      },
      config: {
        handler(viteUserConfig) {
          return mergeConfig(viteUserConfig, {
            build: {
              copyPublicDir: true,
            },
          } satisfies UserConfig);
        },
        order: "pre",
      },
      enforce: "pre",
      name: "@lazuee/react-router-hono[build]",
    },
    {
      config: {
        async handler(viteUserConfig, viteEnvConfig) {
          rootDir =
            viteUserConfig.root ??
            process.env.REACT_ROUTER_ROOT ??
            process.cwd();

          const mode = [process.env.NODE_ENV, viteEnvConfig.mode].includes(
            "production",
          )
            ? "production"
            : "development";
          const entry = relative(
            rootDir,
            `${viteUserConfig.build?.rollupOptions?.input}`,
          );
          if (existsSync(entry)) {
            serverFile = entry as any;
          }

          if (serverFile) {
            if (!isRelativePath(serverFile!)) {
              throw new Error(
                "The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration must be a relative path.",
              );
            } else if (!existsSync(serverFile)) {
              throw new Error(
                `The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration does not exist: ${serverFile}`,
              );
            }
          }

          await loadDotenv({
            mode,
            rootDirectory: rootDir,
            viteUserConfig,
          });

          return mergeConfig(
            viteUserConfig,
            {
              base: reactRouterConfig?.basename || viteUserConfig?.base,
              build: {
                rollupOptions: {
                  onwarn(warning, warn) {
                    if (
                      "message" in warning &&
                      [
                        "sourcemap",
                        [
                          "Module level directives",
                          '"use client"',
                          "node_modules/react-router",
                        ],
                      ].some((x) =>
                        Array.isArray(x)
                          ? x.length > 0 &&
                            x.every((y) => warning.message?.includes(y))
                          : warning.message?.includes(x),
                      )
                    ) {
                      return;
                    }
                    warn(warning);
                  },
                },
              },
              environments: {
                client: {
                  optimizeDeps: {
                    include: ["react-router/internal/react-server-client"],
                  },
                },
                ssr: {
                  optimizeDeps: {
                    include: [
                      "isbot",
                      "react/jsx-runtime",
                      "react/jsx-dev-runtime",
                      "react-router",
                      "react-router/internal/react-server-client",
                    ],
                  },
                  ...(isRSC()
                    ? {}
                    : {
                        build: {
                          rollupOptions: {
                            external: [
                              "@hono/node-ws",
                              "@hono/node-server",
                              "@hono/node-server/serve-static",
                              "hono/bun",
                            ],
                            input: { hono: virtual.runtime.id },
                          },
                        },
                      }),
                },
                rsc: {
                  optimizeDeps: {
                    include: [
                      "react/jsx-runtime",
                      "react/jsx-dev-runtime",
                      "react-router/internal/react-server-client",
                      "react-router > cookie",
                      "react-router > set-cookie-parser",
                      "vite-plugin-react-use-cache/runtime",
                    ],
                  },
                  ...(isRSC()
                    ? {
                        build: {
                          rollupOptions: {
                            external: [
                              "@hono/node-ws",
                              "@hono/node-server",
                              "@hono/node-server/serve-static",
                              "hono/bun",
                              "virtual:react-router/server-build",
                            ],
                            input: { hono: virtual.runtime.id },
                            output: {
                              entryFileNames: "[name].js",
                            },
                          },
                        },
                      }
                    : {}),
                },
              },
              mode,
              resolve: {
                alias: {
                  ...(runtime === "bun"
                    ? { "react-dom/server": "react-dom/server.node" }
                    : {}),
                },
              },
              root: rootDir,
              server: {
                port:
                  viteUserConfig.server?.port ||
                  Number(process.env.PORT) ||
                  Number(process.env.APP_PORT),
              },
            } satisfies Omit<UserConfig, "plugins">,
            true,
          );
        },
        order: "post",
      },
      configResolved: {
        handler(viteConfig) {
          const pluginIndex = (name: string) =>
            viteConfig.plugins.findIndex((plugin) => plugin.name === name);
          const reactRouterPluginIndex = pluginIndex("react-router");
          const reactRouterRscPluginIndex = pluginIndex("react-router/rsc");
          const reactRouterHonoConfigPluginIndex = pluginIndex(
            "@lazuee/react-router-hono[config]",
          );

          if (
            reactRouterPluginIndex >= 0 &&
            reactRouterPluginIndex < reactRouterHonoConfigPluginIndex
          ) {
            throw new Error(
              `The "@lazuee/react-router-hono" plugin should be placed before the React Router plugin in your Vite config`,
            );
          }
          if (
            reactRouterRscPluginIndex >= 0 &&
            reactRouterRscPluginIndex < reactRouterHonoConfigPluginIndex
          ) {
            throw new Error(
              `The "@lazuee/react-router-hono" plugin should be placed before the React Router RSC plugin in your Vite config`,
            );
          }

          let [clientEntry, ssrEntry, rscEntry] = ["client", "ssr", "rsc"].map(
            (env) => {
              const input =
                viteConfig.environments[env]?.build?.rollupOptions?.input;
              if (typeof input === "object" && !Array.isArray(input)) {
                return input.index;
              }
              if (typeof input === "string") {
                return input;
              }
              return input?.[0];
            },
          );

          let buildDirectory = resolve(join(rootDir, "build"));
          if (!rscEntry) {
            [clientEntry, ssrEntry] = ["Client", "Server"].map((env) => {
              const input = (viteConfig?.__reactRouterPluginContext as any)?.[
                `entry${env}FilePath`
              ];
              return input;
            });
            buildDirectory =
              viteConfig?.__reactRouterPluginContext?.reactRouterConfig
                ?.buildDirectory;
          }

          if (!clientEntry || !ssrEntry) {
            return;
          }

          if (reactRouterConfig) {
            reactRouterConfig.ssr ??= true;
            reactRouterConfig.buildDirectory = reactRouterConfig.buildDirectory
              ? resolve(reactRouterConfig.buildDirectory)
              : buildDirectory;
            reactRouterConfig.appDirectory = reactRouterConfig?.appDirectory
              ? resolve(join(rootDir, reactRouterConfig?.appDirectory))
              : undefined;
          }

          globalThis.__reactRouterHono = {
            basename: reactRouterConfig?.basename || viteConfig.base,
            copyPublicDir: viteConfig.build.copyPublicDir,
            directory: {
              app: reactRouterConfig?.appDirectory,
              build: buildDirectory!,
              honoEntry: resolve(join(honoDir, "entry")),
              public: resolve(rootDir, viteConfig.publicDir),
              root: resolve(rootDir),
            },
            entry: {
              hono: serverFile ? resolve(rootDir, `${serverFile}`) : undefined,
              reactRouter: {
                client: resolve(clientEntry),
                rsc: rscEntry ? resolve(rscEntry) : undefined,
                ssr: resolve(ssrEntry),
              },
            },
            mode: viteConfig.mode as any,
            port: viteConfig.server?.port,
            reactRouter: reactRouterConfig,
            request: {
              from: "hono",
              path: "/",
            },
            rsc: !!rscEntry,
            runtime,
            ssr: !!reactRouterConfig?.ssr,
          };
        },
        order: "post",
      },
      ...(isVercel()
        ? {
            transform: {
              order: "pre",
              handler(code) {
                return code.replace(
                  // https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/router.ts#L3835-L3839
                  // FIXME: RouterContextProvider mismatch, only for Vercel build
                  "requestContext instanceof RouterContextProvider",
                  "true",
                );
              },
            },
          }
        : {}),
      load: {
        async handler(id) {
          if (id.includes(virtual.server.id)) {
            return `
            import { resolveReactRouterHono } from "${pathToFileURL(honoDir)}/options";
            import { createHonoServer } from "${pathToFileURL(honoDir)}/server";
            const reactRouterHono = await resolveReactRouterHono();
            const app = await createHonoServer(reactRouterHono);
            export default app;
            `;
          }
          if (id.includes(virtual.entry.id)) {
            if (!serverFile) {
              return "export default undefined;";
            }
            this.addWatchFile(serverFile);
            return await bundleWithEsbuild(serverFile, rootDir);
          }
          if (id.includes(virtual.handler.id)) {
            const honoEntryFile = findFileWithExtensions({
              cwd: join(honoDir, "server", "react-router"),
              extensions: ["js", "ts", "mjs", "mts"],
              filename: globalThis.__reactRouterHono.rsc ? "rsc" : "ssr",
            });
            if (!honoEntryFile) {
              return "export default undefined;";
            }
            return await bundleWithEsbuild(honoEntryFile, rootDir);
          }
          if (id.includes(virtual.runtime.id)) {
            if (!runtimeFile) {
              return "export default undefined;";
            }

            const code = await bundleWithEsbuild(runtimeFile, rootDir);
            return `globalThis.__reactRouterHono ??= ${JSON.stringify(globalThis.__reactRouterHono, null, 2)};${code}`;
          }
        },
        order: "pre",
      },
      name: "@lazuee/react-router-hono[config]",
      resolveId: {
        handler(id) {
          const vmod = Object.values(virtual).find((vmod) => vmod.id === id);
          if (vmod) {
            return vmod.resolvedId;
          }
        },
        order: "pre",
      },
    },
  ];
}
