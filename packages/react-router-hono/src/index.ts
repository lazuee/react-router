import { type HonoServerOptions } from "./hono/server";

export { nodePreset } from "./presets/node/preset";
export { vercelPreset } from "./presets/vercel/preset";
export { reactRouterHono } from "./presets/vite/preset";

export type { HonoServerOptions as ReactRouterHono };
