import { Hono, type Env } from "hono";
import { importBuild } from "../../lib/importBuild";
import { isVercel } from "../../lib/utils";
import { cache, type CacheOptions } from "../middleware/cache";
import { reactRouter } from "../middleware/reactRouter";
import { serveStatic } from "../middleware/serveStatic";
import { type ReactRouterHono } from "./types";

export const createHonoServer = async <E extends Env = Env>(
  options: ReactRouterHono<E> = {},
): Promise<Hono<E> | undefined> => {
  const build = await importBuild();
  if (!build) return undefined;

  const mode = __reactRouterHono.mode;
  const publicDir = __reactRouterHono.directory.public;
  const isProduction = mode === "production";

  const server = new Hono<E>(options.honoOptions);
  server.all("*", (ctx, next) => {
    globalThis.__reactRouterHono.request.from = "hono";
    globalThis.__reactRouterHono.request.path = ctx.req.path as `/${string}`;
    return next();
  });

  switch (true) {
    case typeof options.server === "function":
      await options.server(server, { mode, build });
      break;
    case options.server instanceof Hono:
      server.route("/", options.server);
  }

  if (!isVercel()) {
    const assetsCache: CacheOptions = {
      maxAge: "1w",
      public: true,
      immutable: true,
    };
    const staticCache: CacheOptions = { maxAge: "1d" };

    if (
      isProduction &&
      !__serveStaticRoots.includes(build.assetsBuildDirectory)
    ) {
      server.use(
        "*",
        cache(staticCache),
        serveStatic({ root: build.assetsBuildDirectory }),
      );
      server.use(
        "*",
        cache(assetsCache, "/assets/"),
        //@ts-expect-error - bypass
        serveStatic({ root: build.assetsBuildDirectory, bypass: true }),
      );
    }

    if (
      !__serveStaticRoots.includes(publicDir) &&
      !__reactRouterHono.vite.copyPublicDir
    ) {
      server.use("*", cache(staticCache), serveStatic({ root: publicDir }));
    }
  }

  server.use(
    "*",
    reactRouter({
      build,
      mode,
      getLoadContext: (ctx) => {
        __reactRouterHono.request.from = "react-router";
        return options.getLoadContext?.(ctx, { build, mode }) || {};
      },
    }),
  );

  return server;
};
