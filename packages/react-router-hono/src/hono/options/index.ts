import { env } from "node:process";
import { Hono } from "hono";
import { type ReactRouterHono } from "../server/types";

export async function resolveReactRouterHono(): Promise<
  ReactRouterHono | undefined
> {
  let virtual:
    | typeof import("virtual:lazuee/react-router-hono-entry")
    | undefined;

  try {
    virtual = await import(
      /* @vite-ignore */ "virtual:lazuee/react-router-hono-entry"
    );
  } catch {
    // do nothing
  }

  const {
    server: honoServer,
    getLoadContext,
    honoOptions,
    listeningListener,
    reactRouterHono: _reactRouterHono,
    default: _default,
  } = virtual ?? {};

  const entry =
    ((!(_default instanceof Hono) && _default) || _reactRouterHono) ?? {};

  const reactRouterHono: ReactRouterHono = {
    getLoadContext: getLoadContext || entry?.getLoadContext,
    honoOptions: honoOptions || entry?.honoOptions,
    listeningListener:
      listeningListener ||
      entry?.listeningListener ||
      ((port) => {
        console.log(`Server is running on port: ${port}`);
      }),
    port:
      Number(env.PORT) ||
      Number(env.APP_PORT) ||
      Number(__reactRouterHono.port),
  };

  return {
    ...reactRouterHono,
    server(app, { mode, build }) {
      if (typeof honoServer === "function") {
        honoServer(app, { mode, build });
      } else if (honoServer instanceof Hono) {
        app.route("/", honoServer);
      }

      if (typeof entry.server === "function") {
        entry.server(app, { mode, build });
      } else if (entry.server instanceof Hono) {
        app.route("/", entry.server);
      }

      if (_default instanceof Hono) {
        app.route("/", _default);
      }
    },
  };
}
