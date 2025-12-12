import { resolveReactRouterHono } from "../options";
import { createHonoServer } from "../server";

(async () => {
  const reactRouterHono = await resolveReactRouterHono();
  const app = await createHonoServer(reactRouterHono);
  if (!app) {
    return;
  }

  const server = Bun.serve({
    development: globalThis.__reactRouterHono.mode !== "production",
    fetch: app.fetch,
    port: reactRouterHono?.port,
  });

  reactRouterHono?.listeningListener?.(Number(server.port));
})();
