import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { env, versions } from "node:process";
import { type Config as ReactRouterConfig } from "@react-router/dev/config";
import { loadConfig } from "unconfig";

const importCache: {
  [cacheKey: string]: any;
} = {};

export function requireFrom<T>(id: string): T {
  try {
    const require = createRequire(import.meta.url);
    importCache[id] ??= require(require.resolve(id));
  } catch {
    // eslint-disable-next-line preserve-caught-error
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

let _hasVercelPreset = false;
export async function hasVercelPreset(): Promise<boolean> {
  if (_hasVercelPreset) {
    return true;
  }

  const {
    config,
    sources: [filePath],
  } = await loadConfig<ReactRouterConfig>({
    sources: [
      {
        files: "react-router.config",
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs"],
      },
    ],
  });

  const code = readFileSync(filePath, "utf8");
  return (_hasVercelPreset =
    /["']@vercel\/react-router\/vite['"]/.test(code) &&
    /vercelPreset\(.*\)/.test(code) &&
    !!config.presets?.find((x) => x.name === "vercel"));
}

export const isVercel = (): boolean =>
  _hasVercelPreset || env.VERCEL === "1" || !!env.VERCEL_ENV;

export const isBun = (): boolean => !!versions.bun;

export const colors = () =>
  ((globalThis as any).__colors ??=
    requireFrom("picocolors")) as typeof import("picocolors");
