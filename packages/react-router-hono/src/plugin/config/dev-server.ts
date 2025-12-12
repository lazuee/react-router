import {
  defaultOptions,
  default as honoViteDevServer,
  type DevServerOptions,
} from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import nodeAdapter from "@hono/vite-dev-server/node";

import { getRuntime } from "../../lib/utils";

export const devServerConfig = {
  ...defaultOptions,
  exclude: [
    ...defaultOptions.exclude,
    /.*\.tsx?($|\?)/,
    /\?import(\?.*)?$/,
    /^\/@.+$/,
    /^\/node_modules\/.*/,
  ] as any,
  export: "default",
  injectClientScript: false,
} as const;

let adapter: DevServerOptions["adapter"];
export function getAdapter(): DevServerOptions["adapter"] {
  switch (getRuntime()) {
    case "bun":
      adapter = bunAdapter;
      break;
    case "node":
      adapter = nodeAdapter;
      break;
    default:
      throw new Error("Invalid runtime");
  }

  return adapter;
}

export function devServer(opts: DevServerOptions & { appDirectory?: string }) {
  return honoViteDevServer({
    ...devServerConfig,
    ...opts,
    exclude: [
      ...devServerConfig.exclude,
      ...(opts?.appDirectory
        ? [
            new RegExp(
              `^(?=\\/${opts.appDirectory.replace(/^[/\\]+|[/\\]+$/g, "").replaceAll(/[/\\]+/g, "/")}\\/)((?!.*\\.data(\\?|$)).*\\..*(\\?.*)?$)`,
            ),
            new RegExp(
              `^(?=\\/${
                opts.appDirectory
                  .replace(/^[/\\]+|[/\\]+$/g, "")
                  .replaceAll(/[/\\]+/g, "/")
                  .split("/")[0]
              }\\/)((?!.*\\.data(\\?|$)).*\\..*(\\?.*)?$)`,
            ),
            `^(?=\\/${opts.appDirectory.replace(/^[/\\]+|[/\\]+$/g, "").replace(/[/\\]+/g, "/")}/**/.*/**)`,
            `^(?=\\/${
              opts.appDirectory
                .replace(/^[/\\]+|[/\\]+$/g, "")
                .replace(/[/\\]+/g, "/")
                .split("/")[0]
            }/**/.*/**)`,
          ]
        : []),
      ...(Array.isArray(opts?.exclude) ? opts.exclude : []),
    ],
  });
}
