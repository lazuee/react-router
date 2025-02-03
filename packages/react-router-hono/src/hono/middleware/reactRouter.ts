import { type Context, type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import {
  createRequestHandler,
  type AppLoadContext,
  type ServerBuild,
} from "react-router";
import { type MaybePromise } from "../../lib/types";

export type ReactRouterOptions = {
  build: ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => MaybePromise<AppLoadContext>;
};

export function reactRouter(options: ReactRouterOptions): MiddlewareHandler {
  let { build, mode, getLoadContext } = options;
  getLoadContext ??= () => ({});

  return createMiddleware(async (ctx) => {
    const requestHandler = createRequestHandler(build, mode);
    const loadContext = await Promise.resolve(getLoadContext(ctx));
    return requestHandler(ctx.req.raw, loadContext);
  });
}
