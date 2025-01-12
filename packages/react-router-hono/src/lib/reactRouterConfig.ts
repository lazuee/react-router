import { existsSync, promises as fsp } from "node:fs";
import { join, parse } from "node:path";
import { cwd } from "node:process";

import { fileURLToPath, pathToFileURL } from "node:url";
import { type Config } from "@react-router/dev/config";
import esbuild from "esbuild";

let reactRouterConfig: Config;
const defaultReactRouterConfig: Config = {
  appDirectory: "app",
  basename: "/",
  buildDirectory: "build",
  serverBuildFile: "index.js",
  serverModuleFormat: "esm",
  ssr: true,
};

export const getReactRouterConfig = async () => {
  if (reactRouterConfig) return reactRouterConfig;

  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const configPath = [".ts", ".js"]
    .map((ext) => join(cwd(), `react-router.config${ext}`))
    .find(existsSync);

  if (!configPath) return defaultReactRouterConfig;
  const outfile = join(__dirname, `${parse(configPath).name}.js`);

  await esbuild.build({
    outfile,
    entryPoints: [configPath],
    logLevel: "silent",
    platform: "node",
    target: "node20",
    format: "esm",
    minify: true,
  });

  reactRouterConfig ||= {
    ...defaultReactRouterConfig,
    ...(await import(/* @vite-ignore */ `${pathToFileURL(outfile).href}`))
      ?.default,
  };

  await fsp.rm(outfile);

  return reactRouterConfig;
};
