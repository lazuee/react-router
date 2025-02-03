import { type Plugin } from "vite";

import * as vercel from "./vercel";

export function plugin(): Promise<Plugin[]> {
  return Promise.all(vercel.plugin());
}
