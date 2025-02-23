import { existsSync, promises as fsp, readlinkSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { cwd } from "node:process";
import { nodeFileTrace } from "@vercel/nft";
import rwr from "resolve-workspace-root";
import { globSync } from "tinyglobby";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import { colors, hasVercelPreset, isVercel } from "../../../lib/utils";

export function plugin(): Plugin[] {
  let ssr: boolean | undefined;
  const rootDir = rwr.resolveWorkspaceRoot(cwd()) || cwd();
  const vercelRootDir = join(rootDir, ".vercel");
  const vercelOutputDir = join(vercelRootDir, "output");
  const vercelStaticDir = join(vercelOutputDir, "static");

  return [
    {
      name: "@lazuee/react-router-hono[deploy-vercel]",
      apply: "build",
      config: {
        order: "pre",
        async handler(userConfig, { isSsrBuild }) {
          ssr = isSsrBuild;

          await hasVercelPreset();
          return mergeConfig(userConfig, {
            build: { copyPublicDir: true },
          } as UserConfig);
        },
      },
      configResolved: {
        order: "post",
        async handler(config) {
          if (!isVercel()) return;

          if (ssr) {
            __logger.info(
              `${colors().green("Vercel detected")}, generating '${colors().gray(".vercel")}' directory...`,
            );
            await Promise.all([
              fsp.rm(vercelRootDir, { recursive: true, force: true }),
              fsp.mkdir(vercelRootDir, { recursive: true }),
            ]);
          }

          const reactRouterConfig =
            config.__reactRouterPluginContext?.reactRouterConfig;
          const originalBuildEnd = reactRouterConfig.buildEnd;
          reactRouterConfig.buildEnd = async function (...args) {
            await originalBuildEnd?.apply(this, args);
            await fsp
              .cp(".vercel", vercelRootDir, { recursive: true })
              .catch(() => {});

            for (const {
              id: bundleId,
              file: serverFile,
              config: { runtime: vercelRuntime },
            } of Object.values(
              args[0].buildManifest?.serverBundles ?? {
                index: {
                  id: "index",
                  file: join("build", "server", "index.js"),
                  config: { runtime: "nodejs" },
                },
              },
            )) {
              const bundleDir = dirname(serverFile);
              const vercelFuncDir = join(
                vercelOutputDir,
                "functions",
                `_${bundleId}.func`,
              );
              await fsp.cp(bundleDir, vercelFuncDir, { recursive: true });
              const chunkFiles = globSync(
                join(bundleDir, "chunks", "**", "*.js"),
              );
              const { fileList, esmFileList } = await nodeFileTrace(
                [serverFile, ...chunkFiles],
                { mixedModules: true, base: rootDir },
              );

              const { deps } = Array.from(
                new Set([...fileList, ...esmFileList]),
              ).reduce(
                (acc, path) => {
                  const m = path.match(
                    /(?:node_modules\/\.pnpm\/[^/][^/@]*@[^/]+\/)?node_modules\/((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)/,
                  );
                  if (m) {
                    const key = `${m[0]},${m[1]}`;
                    if (!acc.seen.has(key)) {
                      acc.seen.add(key);
                      acc.deps.push([m[0], m[1]]);
                    }
                  }
                  return acc;
                },
                { seen: new Set<string>(), deps: [] as [string, string][] },
              );

              for (const [p, packageName] of deps) {
                const dest = join(vercelFuncDir, "node_modules", packageName);
                let targetPath: string;
                try {
                  targetPath = (
                    await fsp.lstat(join(rootDir, p))
                  ).isSymbolicLink()
                    ? readlinkSync(join(rootDir, p)).replace(/(?:\.\.\/)+/, "")
                    : p;
                  targetPath = resolve(
                    rootDir,
                    targetPath.startsWith(".pnpm")
                      ? join("node_modules", targetPath)
                      : p,
                  );
                } catch {
                  continue;
                }

                if (
                  !existsSync(dest) ||
                  !(await fsp.stat(dest)).isDirectory()
                ) {
                  try {
                    await fsp.mkdir(dest, { recursive: true });
                    await fsp.cp(targetPath, dest, { recursive: true });
                  } catch {
                    await fsp.rmdir(dest).catch(() => {});
                  }
                }
              }

              await Promise.all([
                fsp.writeFile(
                  join(vercelFuncDir, ".vc-config.json"),
                  JSON.stringify(
                    {
                      ...(vercelRuntime === "edge"
                        ? {
                            entrypoint: basename(serverFile),
                            runtime: "edge",
                          }
                        : {
                            handler: basename(serverFile),
                            runtime: "nodejs20.x",
                            launcherType: "Nodejs",
                          }),
                    },
                    null,
                    2,
                  ),
                ),
                fsp.writeFile(
                  join(vercelOutputDir, "config.json"),
                  JSON.stringify(
                    {
                      version: 3,
                      routes: [
                        {
                          src: "^/_immutable/(.*)$",
                          headers: {
                            "cache-control":
                              "public, immutable, max-age=31536000",
                          },
                        },
                        { methods: ["GET"], handle: "filesystem" },
                        { src: "/(.*)", dest: `_${bundleId}` },
                      ],
                    },
                    null,
                    2,
                  ),
                ),
                fsp.writeFile(
                  join(vercelFuncDir, "package.json"),
                  JSON.stringify({ type: "module" }, null, 2),
                ),
              ]);
            }
            await fsp.mkdir(vercelStaticDir, { recursive: true });
            await Promise.all([
              fsp.cp(
                join(__reactRouterHono.directory.build, "client"),
                vercelStaticDir,
                { recursive: true },
              ),
            ]);
          };
        },
      },
    },
  ];
}
