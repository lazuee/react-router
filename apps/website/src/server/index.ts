import { type ReactRouterHono } from "@lazuee/react-router-hono";
import { compress } from "hono/compress";

import { prettyJSON } from "hono/pretty-json";
import * as env from "~/env.server";
import { clientIp } from "./middleware/clientIp";
import { protectRoute } from "./middleware/protectRoute";
import routes from "./routes";

declare module "react-router" {
  export interface AppLoadContext {
    readonly env: typeof env;
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
      env,
    };
  },
  server(app) {
    app.use(
      "*",
      compress({ encoding: "gzip" }),
      prettyJSON({ space: 4 }),
      clientIp(),
      protectRoute(),
    );

    app.route("/", routes);
  },
};

export default reactRouterHono;