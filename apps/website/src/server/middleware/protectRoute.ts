import { redirect } from "@lazuee/react-router-hono/http";
import { createMiddleware } from "hono/factory";

import type { Env } from "hono";

export function protectRoute<E extends Env = Env>() {
  return createMiddleware<E>(async (ctx, next) => {
    // /protected/secret - hono request
    // /protected/secret.data - react-router request
    if (ctx.req.path.startsWith("/protected/secret")) {
      return redirect("/protected");
    }

    return next();
  });
}
