import { preloadReact } from "../lib/react";

import { preloadReactRouterConfig } from "../lib/react-router";
import { preloadVite } from "../lib/vite";
import * as config from "./config";
import type { Plugin } from "vite";

export async function reactRouterHono(
  opts: config.PluginOptions = {},
): Promise<Plugin[]> {
  await preloadVite();
  await preloadReact();
  await preloadReactRouterConfig();
  const plugins = await Promise.all([config.plugin(opts)]);

  return plugins.flat().filter(Boolean);
}
