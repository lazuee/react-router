import { redirect } from "@lazuee/react-router-hono/http";
import { type Env } from "hono";

import { createMiddleware } from "hono/factory";

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
