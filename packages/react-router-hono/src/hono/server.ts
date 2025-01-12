import { type AddressInfo } from "node:net";

import { relative } from "node:path";

import { cwd } from "node:process";

import { Hono, type Context, type Env, type MiddlewareHandler } from "hono";
import { type HonoOptions } from "hono/hono-base";
import {
  createRequestHandler,
  type AppLoadContext,
  type ServerBuild,
} from "react-router";
import { isVercel } from "../lib/util";
import { cache, type CacheOptions } from "../middleware/cache";
import { serveStatic } from "../middleware/serveStatic";

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
  port?: number;
};

export const createHonoServer = async <E extends Env = Env>(
  mode: string | undefined,
  build: ServerBuild,
  options: HonoServerOptions<E> = {},
) => {
  const isProduction = mode === "production";
  const publicDir = relative(cwd(), global.REACT_ROUTER_HONO_PUBLIC_DIR);
  const server = new Hono<E>(options.honoOptions);
  server.all("*", (ctx, next) => {
    global.REACT_ROUTER_HONO_REQUEST_FROM = "hono";
    global.REACT_ROUTER_HONO_REQUEST_PATH = ctx.req.path;
    return next();
  });

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
        server.use("*", cache(staticCache), serveStatic({ root: publicDir }));
      }
    } else {
      server.use("*", cache(staticCache), serveStatic({ root: publicDir }));
    }
  }

  server.use(
    "*",
    reactRouter({
      build,
      mode,
      getLoadContext: (ctx) => {
        global.REACT_ROUTER_HONO_REQUEST_FROM = "react-router";
        return options.getLoadContext?.(ctx, { build, mode }) || {};
      },
    }),
  );

  return server;
};
