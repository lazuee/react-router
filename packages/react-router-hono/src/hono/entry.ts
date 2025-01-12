import { env } from "node:process";
//@ts-expect-error - alias
import * as virtual from "virtual:lazuee/react-router";
import { isBun, isVercel } from "../lib/util";
import { createHonoBunServer } from "../presets/bun/server";
import { createHonoNodeServer } from "../presets/node/server";
import { createHonoVercelServer } from "../presets/vercel/server";
import { type HonoServerOptions } from "./server";

const {
  server: honoServer,
  getLoadContext,
  honoOptions,
  listeningListener,
  default: entry,
} = virtual as HonoServerOptions & { default: HonoServerOptions };

const reactRouterHono = {
  server: honoServer || entry?.server,
  getLoadContext: getLoadContext || entry?.getLoadContext,
  honoOptions: honoOptions || entry?.honoOptions,
  listeningListener:
    listeningListener ||
    entry?.listeningListener ||
    ((info) => {
      console.log(`Server is running on port: ${info.port}`);
    }),
  port:
    Number(env.PORT) ||
    Number(env.APP_PORT) ||
    Number(global.REACT_ROUTER_HONO_PORT),
};

const vercel = isVercel && createHonoVercelServer;
const bun = isBun && createHonoBunServer;
const node = !isBun && createHonoNodeServer;
const createHonoServer = vercel || bun || node;

if (!createHonoServer) throw new Error("Environment is not supported.");

export default await createHonoServer(reactRouterHono);
