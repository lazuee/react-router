import { versions } from "node:process";
import { type ReactRouterHono } from "@lazuee/react-router-hono";

import { prettyJSON } from "hono/pretty-json";
import * as env from "~/env.server";
import { clientIp } from "./middleware/clientIp";
import { csp } from "./middleware/csp";
import { protectRoute } from "./middleware/protectRoute";
import routes from "./routes";

declare module "react-router" {
  export interface AppLoadContext {
    readonly env: typeof env;
    readonly isBun: boolean;
  }
}

declare module "react-router" {
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }
}

const reactRouterHono: ReactRouterHono = {
  getLoadContext(ctx) {
    return {
      clientIp: ctx.var.clientIp,
      nonce: ctx.var.nonce,
      isBun: !!versions.bun,
      env,
    };
  },
  server(app) {
    app.use("*", prettyJSON({ space: 4 }), clientIp(), protectRoute(), csp());

    app.route("/", routes);
  },
};

export default reactRouterHono;
