import { dirname, join, relative } from "node:path";

import { cwd } from "node:process";

import { fileURLToPath } from "node:url";

import { type Plugin } from "vite";
import { viteDevServer } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ReactRouterHonoOptions {
  serverFile?: string;
  exclude?: (string | RegExp)[];
}

export const reactRouterHono = (
  config: ReactRouterHonoOptions = {},
): Plugin => {
  const serverFile = relative(cwd(), join(__dirname, "entryServer.js"));
  const mergedConfig: Required<ReactRouterHonoOptions> = {
    serverFile,
    exclude: [],
    ...config,
  };

  return viteDevServer(mergedConfig);
};
