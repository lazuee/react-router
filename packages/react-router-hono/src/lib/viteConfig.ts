import { existsSync, promises as fsp } from "node:fs";
import { join, parse } from "node:path";
import { cwd } from "node:process";

import { fileURLToPath, pathToFileURL } from "node:url";
import esbuild from "esbuild";
import { type UserConfig } from "vite";

let viteConfig: UserConfig;
const defaultviteConfig: UserConfig = {
  publicDir: "public",
};

export const getViteConfig = async () => {
  if (viteConfig) return viteConfig;

  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const configPath = [".ts", ".js", ".mjs"]
    .map((ext) => join(cwd(), `vite.config${ext}`))
    .find(existsSync);

  if (!configPath) return defaultviteConfig;
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

  viteConfig ||= {
    ...defaultviteConfig,
    ...(await import(/* @vite-ignore */ `${pathToFileURL(outfile).href}`))
      ?.default,
  };

  await fsp.rm(outfile);

  return viteConfig;
};
