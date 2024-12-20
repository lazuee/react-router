import { type AddressInfo } from "node:net";

import { serveStatic } from "@hono/node-server/serve-static";

import { Hono, type Context, type Env, type MiddlewareHandler } from "hono";

import { type HonoOptions } from "hono/hono-base";

import {
  createRequestHandler,
  type AppLoadContext,
  type ServerBuild,
} from "react-router";
import { isVercel } from "../lib/utils";
import { cache, type CacheOptions } from "../middleware/cache";

type ReactRouterOptions = {
  build: ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => Promise<AppLoadContext> | AppLoadContext;
};

const reactRouter =
  ({
    build,
    mode,
    getLoadContext = (ctx) => ctx.env as unknown as AppLoadContext,
  }: ReactRouterOptions): MiddlewareHandler =>
  async (ctx) => {
    const requestHandler = createRequestHandler(build, mode);
    const loadContext = await Promise.resolve(getLoadContext(ctx));
    return requestHandler(ctx.req.raw, loadContext);
  };

export type HonoServerOptions<E extends Env = Env> = {
  server?: (
    server: Hono<E>,
    options: Pick<ReactRouterOptions, "build" | "mode">,
  ) => Promise<void> | void;
  getLoadContext?: (
    ctx: Context,
    options: Pick<ReactRouterOptions, "build" | "mode">,
  ) => Promise<AppLoadContext> | AppLoadContext;
  listeningListener?: (info: AddressInfo) => void;
  honoOptions?: HonoOptions<E>;
};

export const createHonoServer = async <E extends Env = Env>(
  mode: string | undefined,
  build: ServerBuild,
  options: HonoServerOptions<E> = {},
) => {
  const isProduction = mode === "production";
  const server = new Hono<E>(options.honoOptions);
  if (options.server) await options.server(server, { mode, build });

  if (!isVercel) {
    const assetsCache: CacheOptions = {
      maxAge: "1w",
      public: true,
      immutable: true,
    };
    const staticCache: CacheOptions = { maxAge: "1d" };

    if (isProduction) {
      server.use(
        "*",
        cache(assetsCache, "/assets/"),
        serveStatic({ root: build.assetsBuildDirectory }),
      );
      server.use(
        "*",
        cache(staticCache),
        serveStatic({ root: build.assetsBuildDirectory }),
      );
      if (!global.REACT_ROUTER_HONO_COPY_PUBLIC_DIR) {
        server.use(
          "*",
          cache(staticCache),
          serveStatic({ root: global.REACT_ROUTER_HONO_PUBLIC_DIR }),
        );
      }
    } else {
      server.use(
        "*",
        cache(staticCache),
        serveStatic({ root: global.REACT_ROUTER_HONO_PUBLIC_DIR }),
      );
    }
  }

  server.use(
    "*",
    reactRouter({
      build,
      mode,
      getLoadContext: (ctx) =>
        options.getLoadContext?.(ctx, { build, mode }) ?? {},
    }),
  );

  return server;
};
