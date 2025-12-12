import {
  type ReactRouterContext,
  type ReactRouterHono,
  type RecursivePartial,
  type ResolvedReactRouterContext,
} from "./src/plugin/config/types";

declare global {
  var __reactRouterHono: ReactRouterHono;
  var __serveStaticRoots: string[];
}

declare module "virtual:@lazuee/react-router-hono[entry]" {
  import { type ReactRouterHono as ReactRouterHonoServe } from "@lazuee/react-router-hono";
  import { type Hono } from "hono";

  export const server: ReactRouterHonoServe["server"] | undefined;
  export const getLoadContext:
    | ReactRouterHonoServe["getLoadContext"]
    | undefined;
  export const honoOptions: ReactRouterHonoServe["honoOptions"] | undefined;
  export const listeningListener:
    | ReactRouterHonoServe["listeningListener"]
    | undefined;
  export const reactRouterHono: ReactRouterHonoServe | undefined;
  const app: Hono | typeof reactRouterHono;

  export default app;
}

declare module "vite" {
  interface ResolvedConfig {
    __reactRouterHono: ReactRouterHono;
    __reactRouterPluginContext: ResolvedReactRouterContext;
  }

  interface UserConfig {
    __reactRouterHono?: RecursivePartial<ReactRouterHono>;
    __reactRouterPluginContext?: RecursivePartial<ReactRouterContext>;
  }
}
