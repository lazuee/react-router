import { existsSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { cwd, env, exit } from "node:process";

import { createLogger, mergeConfig, type Plugin, type UserConfig } from "vite";
import { type ReactRouterHonoOpts } from "..";
import { vm } from "../../constants";
import { colors, isBun } from "../../lib/utils";

const __dirname = import.meta.dirname;
const isRelativePath = (path: string) =>
  !isAbsolute(path) && !path.startsWith("/");

export function plugin(opts: ReactRouterHonoOpts): Plugin[] {
  const honoEntry = relative(cwd(), join(__dirname, "hono", "entry"));
  let runtime: string = "node";
  let serverFile = opts?.serverFile;

  switch (true) {
    case isBun():
      runtime = "bun";
      break;
  }
  return [
    {
      name: "@lazuee/react-router-hono[config]",
      config: {
        order: "pre",
        handler(_, { mode }) {
          _.root ??= cwd();
          globalThis.__logger ??= createLogger(_.logLevel, {
            prefix: "[@lazuee/react-router-hono]",
            allowClearScreen: true,
          });
          mode = [env.NODE_ENV, mode].includes("production")
            ? "production"
            : "development";

          const entry = relative(_.root, `${_.build?.rollupOptions?.input}`);
          if (existsSync(entry)) {
            serverFile = entry as any;
          }
          const port = mode === "production" ? 3000 : 5173;

          if (serverFile) {
            if (!isRelativePath(serverFile!)) {
              __logger.error(
                colors().red(
                  "The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration must be a relative path.",
                ),
              );

              exit(1);
            } else if (!existsSync(serverFile)) {
              __logger.error(
                colors().red(
                  `The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration does not exist: ${serverFile}`,
                ),
              );

              exit(1);
            }
          }

          return mergeConfig(
            _,
            {
              mode,
              root: _.root,
              envDir: _.root,
              appType: "custom",
              build: {
                cssTarget: [
                  "es2020",
                  "edge88",
                  "firefox78",
                  "chrome87",
                  "safari14",
                ],
                rollupOptions: {
                  input: undefined,
                },
              },
              server: {
                port:
                  _.server?.port ||
                  Number(env.PORT) ||
                  Number(env.APP_PORT) ||
                  port,
                allowedHosts: true,
              },
              __reactRouterHono: {
                mode: mode as any,
                runtime: runtime as any,
                directory: { honoEntry },
              },
            } satisfies UserConfig,
            false,
          );
        },
      },
      configResolved: {
        order: "post",
        handler(_) {
          const __ = _.__reactRouterPluginContext!;
          const ___ = _.__reactRouterHono!;
          if (!__?.reactRouterConfig) {
            return;
          }

          globalThis.__viteConfig ??= _;
          globalThis.__reactRouterHono = {
            ...globalThis.__reactRouterHono,
            mode: ___.mode as any,
            runtime: ___.runtime as any,
            basename: __.reactRouterConfig?.basename as any,
            port: _.server.port,
            entry: {
              reactRouter: {
                client: relative(_.root, `${__.entryClientFilePath}`),
                server: relative(_.root, `${__.entryServerFilePath}`),
              },
              hono: serverFile ? relative(_.root, `${serverFile}`) : undefined,
            },
            directory: {
              app: relative(_.root, `${__.reactRouterConfig?.appDirectory}`),
              build: relative(
                _.root,
                `${__.reactRouterConfig?.buildDirectory}`,
              ),
              public: relative(_.root, `${_.publicDir}`),
              honoEntry: `${___.directory?.honoEntry}`,
            },
            vite: {
              root: _.root,
              copyPublicDir: _.build.copyPublicDir,
            },
            reactRouter: {
              routes: __.reactRouterConfig?.routes as any,
              future: __.reactRouterConfig?.future as any,
            },
            request: {
              from: "hono",
              path: "/",
            },
            ssr: !!__.reactRouterConfig?.ssr,
          };
        },
      },
      configureServer: {
        order: "pre",
        async handler(server) {
          globalThis.__viteDevServer = server;
        },
      },
      resolveId: {
        order: "pre",
        handler(id) {
          const vmod = Object.values(vm).find((vmod) => vmod.id === id);
          if (vmod) {
            return vmod.resolvedId;
          }
        },
      },
    },
  ];
}
