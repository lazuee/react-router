import { existsSync, readFileSync } from "node:fs";
import { loadConfig } from "unconfig";
import type { Config as ReactRouterConfig } from "@react-router/dev/config";

let reactRouterConfig: ReactRouterConfig | undefined;
let reactRouterConfigPath: string | undefined;

export async function preloadReactRouterConfig() {
  const result = await loadConfig<ReactRouterConfig>({
    sources: [
      {
        extensions: ["ts", "mts", "cts", "js", "mjs", "cjs"],
        files: "react-router.config",
      },
    ],
  });

  reactRouterConfig = result.config;
  reactRouterConfigPath = result.sources[0];
}

export function getReactRouterConfig() {
  return reactRouterConfig;
}

export function getReactRouterConfigPath() {
  return reactRouterConfigPath;
}

let vercelPreset: boolean | undefined;
export function hasVercelPreset() {
  if (vercelPreset !== undefined) {
    return vercelPreset;
  }

  const config = getReactRouterConfig();
  const filePath = getReactRouterConfigPath();

  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  const code = readFileSync(filePath, "utf8");
  const hasVercelImport = /["']@vercel\/react-router\/vite['"]/.test(code);
  const hasVercelPresetCall = /vercelPreset\(.*\)/.test(code);
  const hasVercelInPresets = !!config?.presets?.find(
    (x) => x.name === "vercel",
  );

  vercelPreset ??= hasVercelImport && hasVercelPresetCall && hasVercelInPresets;
  return vercelPreset;
}
