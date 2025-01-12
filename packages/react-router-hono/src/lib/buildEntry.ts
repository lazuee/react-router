import { rename } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

import { fileURLToPath } from "node:url";
import esbuild, { type BuildOptions } from "esbuild";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export async function buildEntry(
  entryFile: string,
  buildFile: string,
  packageDependencies: Record<string, string> = {},
) {
  const serverBuildFile = join(
    dirname(buildFile),
    `react-router.server-build${extname(buildFile)}`,
  );
  const esbuildConfig: BuildOptions = {
    logLevel: "silent",
    platform: "node",
    target: "node20",
    format: "esm",
    bundle: true,
    minify: true,
    external: ["vite", ...Object.keys(packageDependencies)],
  };
  const _global = Object.fromEntries(
    Object.keys(global)
      .filter((key) => key.startsWith("REACT_ROUTER_HONO"))
      .map((key) => [key, (global as any)[key]]),
  ) as {
    [K in Extract<
      keyof typeof global,
      `REACT_ROUTER_HONO${string}`
    >]: (typeof global)[K];
  };

  delete _global.REACT_ROUTER_HONO_PRESETS?.vite;
  const inlineKeys = Object.keys(_global)
    .filter((key) => key.startsWith("REACT_ROUTER_HONO"))
    .map((key) => `global.${key} ||= ${JSON.stringify((global as any)[key])};`)
    .join("\n");

  await rename(buildFile, serverBuildFile);
  await esbuild.build({
    ...esbuildConfig,
    outfile: buildFile,
    entryPoints: [join(__dirname, "entry.js")],
    legalComments: "none",
    charset: "utf8",
    alias: {
      "virtual:react-router/server-build": serverBuildFile,
      "virtual:lazuee/react-router": entryFile,
    },
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);${
        inlineKeys
      }`,
    },
  });

  return [buildFile, serverBuildFile];
}
