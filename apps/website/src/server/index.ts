import { versions } from "node:process";
import { type ReactRouterHono } from "@lazuee/react-router-hono";
import { compress } from "hono/compress";
import { prettyJSON } from "hono/pretty-json";
import { RouterContextProvider } from "react-router";
import * as env from "~/env.server";
import { clientIp } from "./middleware/clientIp";
import { csp } from "./middleware/csp";
import { protectRoute } from "./middleware/protectRoute";
import routes from "./routes";

declare module "react-router" {
  export interface Future {
    v8_middleware: true;
  }
  export interface RouterContextProvider {
    readonly clientIp?: string;
    readonly nonce?: string;
    readonly isBun: boolean;
    readonly env: typeof env;
  }
}

const reactRouterHono: ReactRouterHono = {
  getLoadContext(ctx) {
    const context = new RouterContextProvider();
    Object.assign(context, {
      clientIp: ctx.var.clientIp,
      nonce: ctx.var.nonce,
      isBun: !!versions.bun,
      env: structuredClone(env),
    });

    return context;
  },
  server(app) {
    app.use(
      "*",
      prettyJSON({ space: 4 }),
      clientIp(),
      protectRoute(),
      csp(),
      compress(),
    );

    app.route("/", routes);
  },
};

export default reactRouterHono;
