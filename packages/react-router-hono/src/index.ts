import { type HonoServerOptions } from "./hono/server";

export type ReactRouterHono = Omit<HonoServerOptions, "port">;
export { bunPreset } from "./presets/bun/preset";
export { nodePreset } from "./presets/node/preset";
export { vercelPreset } from "./presets/vercel/preset";
export { reactRouterHono } from "./presets/vite/preset";
