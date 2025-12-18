import { join } from "node:path";
import { relative } from "node:path/win32";
import { Hono } from "hono";
//@ts-expect-error - virtual
import { requestHandler } from "virtual:@lazuee/react-router-hono[handler]";

import { isVercel } from "../../lib/utils";
import { cache } from "../middleware/cache";
import { serveStatic } from "../middleware/serveStatic";
import type { Env } from "hono";
import type { ServerBuild } from "react-router";
import type { CacheOptions } from "../middleware/cache";

import type { RequestHandler } from "./react-router/type";
import type { ReactRouterHono, RSCServerBuild } from "./types";

function isRSCServerBuild(
  build: ServerBuild | RSCServerBuild,
): build is RSCServerBuild {
  return "fetch" in build && typeof build.fetch === "function";
}

async function importBuild() {
  let build: ServerBuild | RSCServerBuild | undefined;

  try {
    build = (await import(
      //@ts-expect-error - virtual
      /* @vite-ignore */ "virtual:react-router/server-build"
    )) as any;
  } catch {
    if (globalThis.__reactRouterHono.rsc) {
      const rscBuild = await import.meta.viteRsc.loadModule<{
        unstable_reactRouterServeConfig: Record<string, any>;
        default: RSCServerBuild["fetch"] | { fetch: RSCServerBuild["fetch"] };
      }>("rsc", "index");

      let rscFetch: RSCServerBuild["fetch"] | undefined;
      if (rscBuild?.default && typeof rscBuild.default === "function") {
        rscFetch = rscBuild.default;
      } else if (
        rscBuild?.default &&
        typeof rscBuild.default === "object" &&
        typeof rscBuild.default.fetch === "function"
      ) {
        rscFetch = rscBuild.default.fetch;
      }

      if (rscFetch) {
        const config = {
          publicPath: "/",
          ...(rscBuild.unstable_reactRouterServeConfig || {}),
          assetsBuildDirectory: `./${relative(globalThis.__reactRouterHono.directory.root, join(globalThis.__reactRouterHono.directory.build, "client")).replaceAll("\\", "/")}`,
        };
        build = {
          assetsBuildDirectory: config.assetsBuildDirectory,
          fetch: rscFetch,
          publicPath: config.publicPath,
        } satisfies RSCServerBuild;
      }
    }
  }

  return build;
}

export const createHonoServer = async <E extends Env = Env>(
  options: ReactRouterHono<E> = {},
): Promise<Hono<E>> => {
  let build = await importBuild();
  if (!build) {
    throw new Error("Failed to load server build");
  }

  const mode = globalThis.__reactRouterHono.mode;
  const publicDir = globalThis.__reactRouterHono.directory.public;
  const isProduction = mode === "production";

  const server = new Hono<E>(options.honoOptions);
  server.all("/.well-known/appspecific/com.chrome.devtools.json", (ctx) =>
    ctx.newResponse(null, 403),
  );
  server.all("*", (ctx, next) => {
    globalThis.__reactRouterHono.request.from = "hono";
    globalThis.__reactRouterHono.request.path = ctx.req.path as `/${string}`;
    return next();
  });

  switch (true) {
    case typeof options.server === "function":
      await options.server(server, {
        build: isRSCServerBuild(build) ? ({} as any) : build,
        mode,
        reactRouterHono: globalThis.__reactRouterHono,
      });
      break;
    case options.server instanceof Hono:
      server.route("/", options.server);
      break;
    default:
      throw new Error("TODO: Not implemented yet");
  }

  if (!isVercel()) {
    const assetsCache: CacheOptions = {
      immutable: true,
      maxAge: "1w",
      public: true,
    };
    const staticCache: CacheOptions = { maxAge: "1d" };

    if (
      isProduction &&
      !globalThis.__serveStaticRoots.includes(build.assetsBuildDirectory)
    ) {
      server.get(
        "*",
        cache(assetsCache, "/assets/"),
        cache(staticCache),
        serveStatic({ root: build.assetsBuildDirectory }),
      );
    }

    if (
      !globalThis.__serveStaticRoots.includes(publicDir) &&
      !globalThis.__reactRouterHono.copyPublicDir
    ) {
      server.get("*", cache(staticCache), serveStatic({ root: publicDir }));
    }
  }

  server.use("*", async (ctx) => {
    build = await importBuild();
    if (!build) {
      throw new Error("Failed to load server build");
    }

    const loadContext = await Promise.resolve(
      options.getLoadContext?.(ctx, {
        build,
        mode,
        reactRouterHono: globalThis.__reactRouterHono,
      }),
    );

    return (requestHandler as RequestHandler)(
      build,
      mode,
      loadContext,
    )(ctx.req.raw);
  });

  return server;
};
