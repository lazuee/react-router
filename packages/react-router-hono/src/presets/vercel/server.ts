import { env } from "node:process";

import { handle } from "@hono/node-server/vercel";
import { type Env } from "hono";

import { type ServerBuild } from "react-router";
import { createHonoServer, type HonoServerOptions } from "../../hono/server";

import { importDevBuild } from "../../lib/importDevBuild";

export const createHonoVercelServer = async <E extends Env = Env>(
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
    server: options.server,
    getLoadContext: options.getLoadContext,
    honoOptions: options.honoOptions,
  });

  return handle(server);
};
