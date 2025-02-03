import { type Plugin } from "vite";
import * as config from "./config";
import * as deploy from "./deploy";
import * as dev from "./dev";
import * as prod from "./prod";
import * as ssrReload from "./ssr-reload";

export interface ReactRouterHonoOpts {
  serverFile?: string;
  exclude?: (string | RegExp)[];
}

export async function reactRouterHono(
  opts: ReactRouterHonoOpts,
): Promise<Plugin[]> {
  const plugins = await Promise.all([
    config.plugin(opts),
    deploy.plugin(),
    dev.plugin(opts),
    prod.plugin(),
    ssrReload.plugin(),
  ]);

  return plugins.flat().filter(Boolean);
}
