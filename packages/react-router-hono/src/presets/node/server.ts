import { env } from "node:process";

import { serve } from "@hono/node-server";
import { type Env } from "hono";

import { type ServerBuild } from "react-router";
import { createHonoServer, type HonoServerOptions } from "../../hono/server";

import { importDevBuild } from "../../lib/importDevBuild";

export const createHonoNodeServer = async <E extends Env = Env>(
  options: HonoServerOptions<E> = {},
) => {
  const mode =
    env.NODE_ENV === "test" ? "development" : env.NODE_ENV || "production";
  const isProduction = mode === "production";

  const build: ServerBuild = isProduction
    ? // @ts-expect-error - virtual module
      await import("virtual:react-router/server-build")
    : await importDevBuild();

  const server = await createHonoServer(mode, build, {
    server: async (server) => {
      if (options.server) {
        await options.server(server, { build, mode });
      }
    },
    getLoadContext: options.getLoadContext,
    honoOptions: options.honoOptions,
    listeningListener: options.listeningListener,
  });

  if (isProduction) {
    serve(
      { ...server, port: Number(env.PORT) || 3000 },
      options.listeningListener,
    );
  }

  return server;
};
