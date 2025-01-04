import { compress } from "hono/compress";
import { type HonoServerOptions } from "./server";

const reactRouterHono: HonoServerOptions = {
  server(app) {
    app.use("*", compress({ encoding: "gzip" }));
  },
};

export default reactRouterHono;
