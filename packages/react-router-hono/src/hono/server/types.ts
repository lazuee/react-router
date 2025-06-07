import { type Context, type Env } from "hono";
import { type Hono } from "hono";
import { type HonoOptions } from "hono/hono-base";
import { type AppLoadContext, type ServerBuild } from "react-router";
import { type MaybePromise } from "../../lib/types";

type ReactRouterOptions = {
  build: ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => MaybePromise<AppLoadContext>;
};

type HonoServer<E extends Env> = (
  server: Hono<E>,
  options: Pick<ReactRouterOptions, "build" | "mode">,
) => MaybePromise<void>;

type ListeningListener = (port: number) => MaybePromise<void>;

type LoadContext = (
  ctx: Context,
  options: Pick<ReactRouterOptions, "build" | "mode">,
) => MaybePromise<AppLoadContext>;

export type ReactRouterHono<E extends Env = Env> = {
  getLoadContext?: LoadContext;
  honoOptions?: HonoOptions<E>;
  listeningListener?: ListeningListener;
  port?: number;
  server?: Hono<E> | HonoServer<E>;
};
