import { type Plugin } from "vite";

import { viteDevServer } from "./vite";

export interface ReactRouterHonoOptions {
  serverFile?: string;
  exclude?: (string | RegExp)[];
}

export const reactRouterHono = (
  config: ReactRouterHonoOptions = {},
): Plugin => {
  const mergedConfig: Required<ReactRouterHonoOptions> = {
    serverFile: "./server.ts",
    exclude: [],
    ...config,
  };

  return viteDevServer(mergedConfig);
};
