import { type Env } from "hono";
import { createMiddleware } from "hono/factory";

import { type ServeStaticOptions } from "hono/serve-static";

let _serveStatic: any;
export function serveStatic<E extends Env>(options: ServeStaticOptions<E>) {
  return createMiddleware(async (ctx, next) => {
    if (global.REACT_ROUTER_HONO_PRESETS?.node) {
      _serveStatic ||= (await import("@hono/node-server/serve-static"))
        .serveStatic;
    } else if (global.REACT_ROUTER_HONO_PRESETS?.bun) {
      _serveStatic ||= (await import("hono/bun")).serveStatic;
    }
    if (_serveStatic) return _serveStatic(options)(ctx, next);

    return next();
  });
}
