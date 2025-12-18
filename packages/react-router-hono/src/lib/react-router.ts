import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadConfig } from "unconfig";
import { getViteConfigFile } from "./vite";
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

let viteRSC: boolean | undefined;
export function isRSC() {
  if (viteRSC !== undefined) {
    return viteRSC;
  }

  const filePath = getViteConfigFile(dirname(getReactRouterConfigPath()!));
  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  const code = readFileSync(filePath, "utf8");
  const importMatch = code.match(
    /import\s+([\w$]+)(?:[\s,][^'"]*)?from\s*['"]@vitejs\/plugin-rsc['"]/,
  );
  if (!importMatch) {
    viteRSC = false;
    return false;
  }

  viteRSC = new RegExp(`\\b${importMatch[1]}\\s*\\(`, "m").test(code);
  return viteRSC;
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
