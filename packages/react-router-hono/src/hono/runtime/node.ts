import { serve } from "@hono/node-server";

import { resolveReactRouterHono } from "../options";
import { createHonoServer } from "../server";

(async () => {
  const reactRouterHono = await resolveReactRouterHono();
  const app = await createHonoServer(reactRouterHono);
  if (!app) {
    return;
  }

  serve(app, ({ port }) => reactRouterHono?.listeningListener?.(port));
})();
