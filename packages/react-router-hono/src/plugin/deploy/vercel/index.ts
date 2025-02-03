import { existsSync, promises as fsp, readlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { nodeFileTrace } from "@vercel/nft";
import rwr from "resolve-workspace-root";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import { colors, isVercel } from "../../../lib/utils";

export function plugin(): Plugin[] {
  if (!isVercel) return [];
  let isBuild = false;

  return [
    {
      name: "@lazuee/react-router-hono[deploy-vercel]",
      enforce: "post",
      config(_, { command }) {
        isBuild = command === "build";

        if (!isBuild) return;
        return mergeConfig(_, {
          build: { copyPublicDir: true },
        } satisfies UserConfig);
      },
      closeBundle: {
        order: "post",
        async handler() {
          if (this.environment.name !== "ssr") return;

          __logger.info(
            `${colors().green("Vercel detected")}, generating '${colors().gray(".vercel")}' directory...`,
          );

          const rootDir = rwr.resolveWorkspaceRoot(cwd()) || cwd();
          const fnName = "index";
          const vercelDirs = {
            root: join(rootDir, ".vercel"),
            output: join(rootDir, ".vercel/output"),
            func: join(rootDir, `.vercel/output/functions/${fnName}.func`),
            static: join(rootDir, ".vercel/output/static"),
          };

          await fsp.rm(vercelDirs.root, { recursive: true, force: true });
          await fsp.mkdir(vercelDirs.static, { recursive: true });

          await Promise.all([
            fsp.cp(
              join(__reactRouterHono.directory.build, "server"),
              vercelDirs.func,
              { recursive: true },
            ),
            fsp.cp(
              join(__reactRouterHono.directory.build, "client"),
              vercelDirs.static,
              { recursive: true },
            ),
          ]);

          const serverIndex = join(
            __reactRouterHono.directory.build,
            "server",
            "index.js",
          );
          const chunkFiles = (
            await fsp.readdir(
              join(__reactRouterHono.directory.build, "server", "chunks"),
            )
          ).map((file) =>
            join(__reactRouterHono.directory.build, "server", "chunks", file),
          );

          const { fileList, esmFileList } = await nodeFileTrace(
            [serverIndex, ...chunkFiles],
            { mixedModules: true, base: rootDir },
          );

          const paths = [...new Set([...fileList, ...esmFileList])];
          const regex =
            /(?:node_modules\/\.pnpm\/[^/][^/@]*@[^/]+\/)?node_modules\/((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)/;
          const dependencies = Array.from(
            new Set(
              paths
                .map((path) => {
                  const match = path.match(regex);
                  return match ? `${match[0]},${match[1]}` : null;
                })
                .filter(Boolean),
            ),
          )
            .map((item) => item?.split(",") as [string, string])
            .filter((x) => x.length === 2);

          for (const [path, packageName] of dependencies) {
            const dest = join(vercelDirs.func, "node_modules", packageName);
            let targetPath = (
              await fsp.lstat(join(rootDir, path))
            ).isSymbolicLink()
              ? readlinkSync(join(rootDir, path)).replace(/(?:\.\.\/)+/, "")
              : path;
            if (targetPath.startsWith(".pnpm")) {
              targetPath = join("node_modules", targetPath);
            }
            if (!targetPath.startsWith("node_modules")) {
              targetPath = join("node_modules", ".pnpm", targetPath);
            }
            targetPath = resolve(rootDir, targetPath);

            if (!existsSync(dest) || !(await fsp.stat(dest)).isDirectory()) {
              await fsp.mkdir(dest, { recursive: true });
              await fsp.cp(targetPath, dest, { recursive: true });
            }
          }

          await Promise.all([
            fsp.writeFile(
              join(vercelDirs.func, ".vc-config.json"),
              JSON.stringify(
                {
                  handler: "index.js",
                  runtime: "nodejs20.x",
                  launcherType: "Nodejs",
                },
                null,
                2,
              ),
            ),
            fsp.writeFile(
              join(vercelDirs.output, "config.json"),
              JSON.stringify(
                {
                  version: 3,
                  routes: [
                    {
                      src: "^/_immutable/(.*)$",
                      headers: {
                        "cache-control": "public, immutable, max-age=31536000",
                      },
                    },
                    { methods: ["GET"], handle: "filesystem" },
                    { src: "/(.*)", dest: fnName },
                  ],
                },
                null,
                2,
              ),
            ),
            fsp.writeFile(
              join(vercelDirs.func, "package.json"),
              JSON.stringify({ type: "module" }, null, 2),
            ),
          ]);
        },
      },
    },
  ];
}
