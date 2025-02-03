declare module "virtual:lazuee/react-router-hono-entry" {
  import { type ReactRouterHono } from "@lazuee/react-router-hono";
  import { type Hono } from "hono";

  export const server: ReactRouterHono["server"] | undefined;
  export const getLoadContext: ReactRouterHono["getLoadContext"] | undefined;
  export const honoOptions: ReactRouterHono["honoOptions"] | undefined;
  export const listeningListener:
    | ReactRouterHono["listeningListener"]
    | undefined;
  export const reactRouterHono: ReactRouterHono | undefined;
  const app: Hono | typeof reactRouterHono;

  export default app;
}
