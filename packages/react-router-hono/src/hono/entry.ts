//@ts-expect-error - alias
import * as virtual from "virtual:lazuee/react-router";

import { isVercel } from "../lib/util";
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
};

const vercel = isVercel && createHonoVercelServer;
const node = createHonoNodeServer;
const createHonoServer = vercel || node;

export default await createHonoServer(reactRouterHono);
