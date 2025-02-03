import { type Env, type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

import { type ServeStaticOptions } from "hono/serve-static";
import { isBun } from "../../lib/utils";

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
      return next();
    });
  }

  if (options.root) __serveStaticRoots.push(options.root);

  return createMiddleware(async (ctx, next) => {
    switch (true) {
      case isBun:
        _serveStatic ||= (await import("hono/bun")).serveStatic;
        break;
      default:
        _serveStatic ||= (await import("@hono/node-server/serve-static"))
          .serveStatic;
    }

    if (_serveStatic) {
      return _serveStatic(options)(ctx, next);
    }

    return next();
  });
}
