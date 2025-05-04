import { type ServerBuild } from "react-router";

export async function importBuild(): Promise<ServerBuild | undefined> {
  if (__reactRouterHono.mode !== "production") {
    return (
      await import("vite").then(({ createServer }) =>
        createServer({
          server: { middlewareMode: true, ws: false },
          appType: "custom",
        }),
      )
    ).ssrLoadModule("virtual:react-router/server-build") as any;
  }

  return await import(
    //@ts-expect-error - virtual module
    /* @vite-ignore */ "virtual:react-router/server-build"
  );
}
