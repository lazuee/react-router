import { type Context, type Env } from "hono";
import { type Hono } from "hono";
import { type HonoOptions } from "hono/hono-base";
import { type RequestHandler, type ServerBuild } from "react-router";
import { type MaybePromise } from "../../lib/types";

type InitialContext = Parameters<RequestHandler>[1];

type ReactRouterOptions = {
  build: ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => MaybePromise<InitialContext>;
};

type HonoServer<E extends Env> = (
  server: Hono<E>,
  options: Pick<ReactRouterOptions, "build" | "mode">,
) => MaybePromise<void>;

type ListeningListener = (port: number) => MaybePromise<void>;

type LoadContext = (
  ctx: Context,
  options: Pick<ReactRouterOptions, "build" | "mode">,
) => MaybePromise<InitialContext>;

export type ReactRouterHono<E extends Env = Env> = {
  getLoadContext?: LoadContext;
  honoOptions?: HonoOptions<E>;
  listeningListener?: ListeningListener;
  port?: number;
  server?: Hono<E> | HonoServer<E>;
};
