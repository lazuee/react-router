import { type Context, type Env, type Hono } from "hono";
import { type HonoOptions } from "hono/hono-base";
import {
  type UNSAFE_MiddlewareEnabled as MiddlewareEnabled,
  type ServerBuild,
} from "react-router";

import { type RouterContextProvider } from "react-router";
import { type AppLoadContext } from "react-router";
import { type ReactRouterHono as ReactRouterHonoGlobal } from "../../plugin/config/types";

type MaybePromise<T> = Promise<T> | T;

type InitialContext = MiddlewareEnabled extends true
  ? RouterContextProvider
  : AppLoadContext;

export type RSCServerBuild = {
  assetsBuildDirectory: string;
  publicPath: string;
  fetch: (request: Request, requestContext?: RouterContextProvider) => Response;
};

type ReactRouterOptions = {
  build: RSCServerBuild | ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => MaybePromise<InitialContext>;
};

type HonoServer<E extends Env> = (
  server: Hono<E>,
  options: Pick<ReactRouterOptions, "build" | "mode"> & {
    reactRouterHono: ReactRouterHonoGlobal;
  },
) => MaybePromise<void>;

type ListeningListener = (port: number) => MaybePromise<void>;

type LoadContext = (
  ctx: Context,
  options: Pick<ReactRouterOptions, "build" | "mode"> & {
    reactRouterHono: ReactRouterHonoGlobal;
  },
) => MaybePromise<InitialContext>;

export type ReactRouterHono<E extends Env = Env> = {
  getLoadContext?: LoadContext;
  honoOptions?: HonoOptions<E>;
  listeningListener?: ListeningListener;
  port?: number;
  server?: Hono<E> | HonoServer<E>;
};
