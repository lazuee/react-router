import { type ServerBuild } from "react-router";

let _build: ServerBuild;

export async function importBuild(): Promise<ServerBuild | undefined> {
  if (__reactRouterHono.mode !== "production") {
    return (_build ??= (
      await import("vite").then(({ createServer }) =>
        createServer({
          server: { middlewareMode: true, ws: false },
          appType: "custom",
        }),
      )
    ).ssrLoadModule("virtual:react-router/server-build") as any);
  }

  return (_build ??= await import(
    //@ts-expect-error - virtual module
    /* @vite-ignore */ "virtual:react-router/server-build"
  ));
}
