import { createRequire } from "node:module";
import { env, versions } from "node:process";

const importCache: {
  [cacheKey: string]: any;
} = {};

export function requireFrom<T>(id: string): T {
  try {
    const require = createRequire(import.meta.url);
    importCache[id] ??= require(require.resolve(id));
  } catch {
    throw new Error(`[@lazuee/react-router-hono] "${id}" must be installed`);
  }

  return importCache[id];
}

export function createVM(name: string): {
  name: string;
  id: string;
  resolvedId: string;
  url: string;
} {
  const id = `virtual:lazuee/${name}`;
  return {
    name,
    id,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`,
  };
}

export const isVercel: boolean = env.VERCEL === "1" || !!env.VERCEL_ENV;

export const isBun: boolean = !!versions.bun;

export const colors = () =>
  ((globalThis as any).__colors ??=
    requireFrom("picocolors")) as typeof import("picocolors");
