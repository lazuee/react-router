import { join, relative } from "node:path";
import { cwd } from "node:process";
import { pathToFileURL } from "node:url";
import honoDevServer, { type DevServerOptions } from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import nodeAdapter from "@hono/vite-dev-server/node";
import { type Plugin } from "vite";
import { type ReactRouterHonoOpts } from "..";
import { vm } from "../../constants";

const __dirname = import.meta.dirname;
const honoDir = relative(cwd(), join(__dirname, "hono"));

export function plugin(opts: ReactRouterHonoOpts): Plugin[] {
  return [
    {
      name: "@lazuee/react-router-hono[dev]",
      apply: "serve",
      load: {
        order: "post",
        async handler(id) {
          if (id === vm.server.resolvedId) {
            return `
            import { resolveReactRouterHono } from "${pathToFileURL(honoDir)}/options";
            import { createHonoServer } from "${pathToFileURL(honoDir)}/server";
            const reactRouterHono = await resolveReactRouterHono();
            const app = await createHonoServer(reactRouterHono);
            export default app;
            `;
          }
        },
      },
      configureServer: {
        order: "pre",
        async handler() {
          let adapter: DevServerOptions["adapter"] = nodeAdapter;
          if (__reactRouterHono.runtime === "bun") {
            adapter = bunAdapter;
          }

          const appDir = __reactRouterHono.directory.app;
          const honoDev = honoDevServer({
            adapter,
            entry: vm.server.resolvedId,
            export: "default",
            injectClientScript: false,
            exclude: [
              new RegExp(
                `^(?=\\/${appDir.replace(/^[/\\]+|[/\\]+$/g, "").replaceAll(/[/\\]+/g, "/")}\\/)((?!.*\\.data(\\?|$)).*\\..*(\\?.*)?$)`,
              ),
              new RegExp(
                `^(?=\\/${
                  appDir
                    .replace(/^[/\\]+|[/\\]+$/g, "")
                    .replaceAll(/[/\\]+/g, "/")
                    .split("/")[0]
                }\\/)((?!.*\\.data(\\?|$)).*\\..*(\\?.*)?$)`,
              ),
              /\?import(\?.*)?$/,
              /^\/@.+$/,
              /^\/node_modules\/.*/,
              `^(?=\\/${appDir.replace(/^[/\\]+|[/\\]+$/g, "").replace(/[/\\]+/g, "/")}/**/.*/**)`,
              `^(?=\\/${
                appDir
                  .replace(/^[/\\]+|[/\\]+$/g, "")
                  .replace(/[/\\]+/g, "/")
                  .split("/")[0]
              }/**/.*/**)`,
              ...(Array.isArray(opts?.exclude) ? opts.exclude : []),
            ],
          });

          if (typeof honoDev.configureServer === "function") {
            //@ts-expect-error - thisArg should pass MinimalPluginContextWithoutEnvironment
            honoDev.configureServer(__viteDevServer);
          }
        },
      },
    },
  ];
}
