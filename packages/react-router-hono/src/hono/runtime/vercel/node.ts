import { handle } from "@hono/node-server/vercel";

import { resolveReactRouterHono } from "../../options";
import { createHonoServer } from "../../server";

const reactRouterHono = await resolveReactRouterHono();

const app = await createHonoServer(reactRouterHono);

export default handle(app);
