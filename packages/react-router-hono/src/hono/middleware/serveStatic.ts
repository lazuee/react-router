import { createMiddleware } from "hono/factory";
import { getRuntime } from "../../lib/utils";
import type { Env, MiddlewareHandler } from "hono";

import type { ServeStaticOptions } from "hono/serve-static";

let _serveStatic: any;
globalThis.__serveStaticRoots = [];

export function serveStatic<E extends Env>(
  options: ServeStaticOptions<E>,
): MiddlewareHandler {
  if (
    !(options as any)?.bypass &&
    __serveStaticRoots.includes(`${options.root}`)
  ) {
    return createMiddleware(async (_, next) => {
      return await next();
    });
  }

  if (options.root) {
    __serveStaticRoots.push(options.root);
  }

  return createMiddleware(async (ctx, next) => {
    switch (getRuntime()) {
      case "bun":
        _serveStatic ||= (await import(/* @vite-ignore */ "hono/bun"))
          .serveStatic;
        break;
      case "node":
        _serveStatic ||= (
          await import(/* @vite-ignore */ "@hono/node-server/serve-static")
        ).serveStatic;
        break;
      default:
        return await next();
    }

    return _serveStatic(options)(ctx, next);
  });
}
