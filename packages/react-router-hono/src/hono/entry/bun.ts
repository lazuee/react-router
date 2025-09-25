import { resolveReactRouterHono } from "../options";
import { createHonoServer } from "../server";

(async () => {
  const reactRouterHono = await resolveReactRouterHono();
  const app = await createHonoServer(reactRouterHono);
  if (!app) {
    return;
  }

  const server = Bun.serve({
    port: reactRouterHono?.port,
    fetch: app.fetch,
    development: __reactRouterHono.mode !== "production",
  });

  reactRouterHono?.listeningListener?.(Number(server.port));
})();
