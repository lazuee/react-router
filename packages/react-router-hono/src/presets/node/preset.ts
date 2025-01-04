import { join, relative } from "node:path";
import { argv } from "node:process";

import { type Preset } from "@react-router/dev/config";

import { buildEntry } from "../../lib/buildEntry";
import { isVercel } from "../../lib/util";

export const nodePreset = (): Preset => {
  if (!global.REACT_ROUTER_HONO_PRESETS?.vite && !argv.includes("typegen")) {
    throw new Error(
      "'reactRouterHono' plugin is not configured in your Vite configuration.",
    );
  }
  if (global.REACT_ROUTER_HONO_PRESETS) {
    global.REACT_ROUTER_HONO_PRESETS.node ||= true;
  }

  return {
    name: "react-router-hono-node",
    ...(!isVercel && {
      reactRouterConfig: () => ({
        buildEnd: async ({ buildManifest, reactRouterConfig, viteConfig }) => {
          if (!reactRouterConfig.ssr) return;
          console.time("[react-router-hono]");
          console.info(
            `[react-router-hono]: Generating '${reactRouterConfig.buildDirectory}'...`,
          );

          const rootPath = viteConfig.root;
          const serverBuildFile = reactRouterConfig.serverBuildFile;
          const serverBuildPath = join(
            reactRouterConfig.buildDirectory,
            "server",
          );

          const serverBundles = buildManifest?.serverBundles ?? {
            index: {
              id: "index",
              file: relative(rootPath, join(serverBuildPath, serverBuildFile)),
            },
          };

          for (const { file } of Object.values(serverBundles)) {
            const buildFile = join(rootPath, file);

            await buildEntry(
              //@ts-expect-error - entryFile
              join(viteConfig.root, global.REACT_ROUTER_HONO_ENTRY_FILE),
              buildFile,
            );
          }

          console.timeEnd("[react-router-hono]");
        },
      }),
    }),
  };
};
