import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { cwd, env } from "node:process";
import { getRequestListener } from "@hono/node-server";
import { minimatch } from "minimatch";

import { type ServerBuild } from "react-router";
import { type Plugin } from "vite";
import { type HonoServerOptions } from "../../hono/server";
import { getReactRouterConfig } from "../../lib/reactRouterConfig";
import { isVercel } from "../../lib/util";
import { getViteConfig } from "../../lib/viteConfig";
import { type ReactRouterHonoOptions } from "./preset";
import { createHonoViteServer } from "./server";

const isRelativePath = (path: string) =>
  !isAbsolute(path) && !path.startsWith("/");

export const viteDevServer = (
  options: Required<ReactRouterHonoOptions>,
): Plugin => {
  global.REACT_ROUTER_HONO_ENTRY_FILE = options.serverFile;
  global.REACT_ROUTER_HONO_PRESETS ||= {};
  global.REACT_ROUTER_HONO_PRESETS.vite ||= true;
  global.REACT_ROUTER_HONO_PUBLIC_DIR = "";

  let reactRouterConfig: Awaited<ReturnType<typeof getReactRouterConfig>>;

  return {
    name: "@lazuee/react-router-hono[vite]",
    async config(viteConfig) {
      reactRouterConfig ||= await getReactRouterConfig();
      if (!reactRouterConfig.ssr) {
        throw new Error(
          "'ssr' is currently disabled in your React Router configuration. Please enable it to continue.",
        );
      }

      viteConfig = { ...viteConfig, ...(await getViteConfig()) };
      viteConfig.root ||= cwd(); // 'root' was removed in vite v6
      viteConfig.server ||= {};
      viteConfig.build = { ...(viteConfig?.build || {}) };
      viteConfig.build.target ||= "node20";
      viteConfig.build.cssTarget ||= [
        ...new Set([
          ...(viteConfig.build.cssTarget ? viteConfig.build.cssTarget : []),
          "edge88",
          "firefox78",
          "chrome87",
          "safari14",
        ]),
      ];

      global.REACT_ROUTER_HONO_PORT = viteConfig.server.port ||=
        Number(env.PORT) ||
        Number(env.APP_PORT) ||
        viteConfig.server.port ||
        3000;

      global.REACT_ROUTER_HONO_PUBLIC_DIR = `${viteConfig.publicDir}`;

      const rollupOutput =
        viteConfig.build.rollupOptions?.output &&
        !Array.isArray(viteConfig.build.rollupOptions?.output)
          ? viteConfig.build.rollupOptions.output
          : {};
      const rollupPlugins = rollupOutput?.plugins
        ? Array.isArray(rollupOutput.plugins)
          ? rollupOutput.plugins
          : [rollupOutput.plugins]
        : [];

      viteConfig.build = {
        ...viteConfig.build,
        ...(isVercel && { copyPublicDir: true }),
        rollupOptions: {
          output: {
            ...rollupOutput,
          },
          input: undefined,
          plugins: [...rollupPlugins],
        },
      };
      if (!isRelativePath(global.REACT_ROUTER_HONO_ENTRY_FILE!)) {
        throw new Error(
          "The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration must be a relative path.",
        );
      }

      if (
        !existsSync(
          join(viteConfig.root!, global.REACT_ROUTER_HONO_ENTRY_FILE!),
        )
      ) {
        throw new Error(
          `The 'serverFile' specified in the 'reactRouterHono' plugin in your Vite configuration does not exist: ${join(viteConfig.root!, global.REACT_ROUTER_HONO_ENTRY_FILE!)}`,
        );
      }

      if (viteConfig.build.rollupOptions?.input) {
        throw new Error("input is not empty!");
      }
      return viteConfig;
    },
    configureServer: async (viteDevServer) => {
      return () => {
        if (!viteDevServer.config.server.middlewareMode) {
          viteDevServer.middlewares.use(async (req, res, next) => {
            if (req.url) {
              const filePath = join(
                global.REACT_ROUTER_HONO_PUBLIC_DIR,
                req.url,
              );

              try {
                if (existsSync(filePath) && statSync(filePath).isFile()) {
                  return next();
                }
              } catch {}
            }

            const exclude = [
              `/${reactRouterConfig.appDirectory}/**/*`,
              `/${reactRouterConfig.appDirectory}/**/.*/**`,
              "/assets/**",
              /^\/@.+$/,
              /\?import$/,
              /^\/favicon\.ico$/,
              /^\/node_modules\/.*/,
              ...options.exclude,
            ];

            for (const pattern of exclude) {
              if (req.url) {
                if (pattern instanceof RegExp) {
                  if (pattern.test(req.url)) return next();
                } else if (minimatch(req.url?.toString(), pattern)) {
                  return next();
                }
              }
            }

            const honoServerOptions: HonoServerOptions = (
              await viteDevServer.ssrLoadModule(`${options.serverFile}`)
            )?.default;
            let build: ServerBuild;
            try {
              build = (await viteDevServer.ssrLoadModule(
                "virtual:react-router/server-build",
              )) as ServerBuild;
            } catch (err) {
              return next(err);
            }

            const app = await createHonoViteServer({
              server: honoServerOptions.server,
              getLoadContext: honoServerOptions.getLoadContext,
              honoOptions: honoServerOptions.honoOptions,
              build,
            });

            await getRequestListener(
              async (request) => {
                const response = await app.fetch(request, {
                  incoming: req,
                  outgoing: res,
                });

                if (!(response instanceof Response)) throw response;
                return response;
              },
              {
                overrideGlobalObjects: false,
                errorHandler: (e) => {
                  let err: Error;
                  if (e instanceof Error) {
                    err = e;
                    viteDevServer.ssrFixStacktrace(err);
                  } else if (typeof e === "string") {
                    err = new Error(
                      `The response is not an instance of "Response", but: ${e}`,
                    );
                  } else {
                    err = new Error(`Unknown error: ${e}`);
                  }

                  next(err);
                },
              },
            )(req, res);
          });
        }
      };
    },
  };
};
