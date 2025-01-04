import { env } from "node:process";

import { type Env } from "hono";

import { type ServerBuild } from "react-router";
import { createHonoServer, type HonoServerOptions } from "../../hono/server";

export const createHonoViteServer = async <E extends Env = Env>(
  options: HonoServerOptions<E> & {
    build?: ServerBuild;
  } = {},
) => {
  let mode = env.VERCEL_ENV || env.NODE_ENV;
  mode = mode !== "production" ? "development" : "production";

  const build = options.build!;
  const server = await createHonoServer(mode, build, {
    server: async (server) => {
      if (options.server) await options.server(server, { build, mode });
    },
    getLoadContext: options.getLoadContext,
    honoOptions: options.honoOptions,
    listeningListener: options.listeningListener,
  });

  return server;
};
