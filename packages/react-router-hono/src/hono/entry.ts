//@ts-expect-error - alias
import * as virtual from "virtual:lazuee/react-router";

import { isVercel } from "../lib/utils";
import { createHonoNodeServer } from "../presets/node/server";
import { createHonoVercelServer } from "../presets/vercel/server";
import { type HonoServerOptions } from "./server";

const {
  server: honoServer,
  getLoadContext,
  honoOptions,
  default: entry,
} = virtual;

const reactRouterHono: HonoServerOptions = {
  server: honoServer || entry?.server,
  getLoadContext: getLoadContext || entry?.getLoadContext,
  honoOptions: honoOptions || entry?.honoOptions,
};

const vercel = isVercel && createHonoVercelServer;
const node = createHonoNodeServer;
const createHonoServer = vercel || node;

export const server = await createHonoServer(reactRouterHono);

export default server;
