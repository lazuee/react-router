import { env } from "node:process";

let viteDevServer:
  | Awaited<ReturnType<typeof import("vite").createServer>>
  | undefined;

if (env.NODE_ENV !== "production") {
  viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true, ws: false },
      appType: "custom",
    }),
  );
}

export async function importDevBuild() {
  if (!viteDevServer) return undefined;

  return viteDevServer.ssrLoadModule(
    `virtual:react-router/server-build?t=${Date.now()}`,
  );
}
