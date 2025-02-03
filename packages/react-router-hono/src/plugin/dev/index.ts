import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { minimatch } from "minimatch";
import { type Plugin } from "vite";
import { type ReactRouterHonoOpts } from "..";
import { resolveReactRouterHono } from "../../hono/options";
import { createHonoServer } from "../../hono/server";
import { requestListener } from "../../lib/requestListener";

export function plugin(opts: ReactRouterHonoOpts): Plugin[] {
  return [
    {
      name: "@lazuee/react-router-hono[dev]",
      configureServer: {
        order: "pre",
        async handler() {
          const appDir = __reactRouterHono.directory.app;

          __viteDevServer.middlewares.use(async (req, res, next) => {
            if (req.url) {
              const filePath = join(
                __reactRouterHono.directory.public,
                req.url,
              );
              try {
                if (existsSync(filePath) && statSync(filePath).isFile()) {
                  return next();
                }
              } catch {}
            }

            const exclude = [
              `/${appDir}/**/*`,
              `/${appDir}/**/.*/**`,
              new RegExp(
                `^(?=\\/${appDir.replaceAll("/", "")}\\/)((?!.*\\.data(\\?|$)).*\\..*(\\\?.*)?$)`,
              ),
              /^\/@.+$/,
              /\?import(\?.*)?$/,
              /^\/favicon\.ico$/,
              /^\/node_modules\/.*/,
              ...(Array.isArray(opts?.exclude) ? opts.exclude : []),
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

            requestListener(
              async (request) => {
                const reactRouterHono = await resolveReactRouterHono();
                const app = await createHonoServer(reactRouterHono);
                const response = await app?.fetch(request, {
                  incoming: req,
                  outgoing: res,
                });

                if (!(response instanceof Response)) throw response;
                return response;
              },
              {
                onError: (e) => {
                  let error: Error;
                  if (e instanceof Error) {
                    error = e;
                    __viteDevServer.ssrFixStacktrace(error);
                  } else if (typeof e === "string") {
                    error = new Error(
                      `The response is not an instance of "Response".\n\nServer returned:\n\n${e}`,
                    );
                  } else {
                    error = new Error(`Unknown error: ${e}`);
                  }

                  next(error);
                },
              },
            )(req, res);
          });
        },
      },
    },
  ];
}
