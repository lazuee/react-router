import { existsSync, promises as fsp } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { argv } from "node:process";
import { type BuildManifest, type Preset } from "@react-router/dev/config";

import { nodeFileTrace } from "@vercel/nft";
import { execa, ExecaError } from "execa";

import { buildEntry } from "../../lib/buildEntry";
import {
  getPackageDependencies,
  isVercel,
  writePackageJson,
} from "../../lib/utils";

type VercelRegion =
  | "arn1"
  | "bom1"
  | "cdg1"
  | "cle1"
  | "cpt1"
  | "dub1"
  | "fra1"
  | "gru1"
  | "hkg1"
  | "hnd1"
  | "iad1"
  | "icn1"
  | "kix1"
  | "lhr1"
  | "pdx1"
  | "sfo1"
  | "sin1"
  | "syd1";

export interface VercelPresetOptions {
  /**
   * @see https://vercel.com/docs/edge-network/regions#region-list
   */
  regions?: VercelRegion | VercelRegion[];
}

export const vercelPreset = (
  { regions } = {} as VercelPresetOptions,
): Preset => {
  if (!global.REACT_ROUTER_HONO_PRESETS?.vite && !argv.includes("typegen")) {
    throw new Error(
      "'reactRouterHono' plugin is not configured in your Vite configuration.",
    );
  }
  if (global.REACT_ROUTER_HONO_PRESETS) {
    global.REACT_ROUTER_HONO_PRESETS.vercel ||= true;
  }

  return {
    name: "react-router-hono-vercel",
    ...(isVercel && {
      reactRouterConfig: () => ({
        buildEnd: async ({ buildManifest, reactRouterConfig, viteConfig }) => {
          if (!reactRouterConfig.ssr) return;

          console.time("[react-router-hono]");
          const {
            root: rootDir,
            build: { assetsDir },
            ssr: { external: ssrExternal },
          } = viteConfig;

          const { serverBuildFile, buildDirectory } = reactRouterConfig;
          const clientBuildDir = join(buildDirectory, "client");
          const serverBuildDir = join(buildDirectory, "server");
          const vercelRootDir = join(getRootDir(rootDir), ".vercel");
          const vercelOutDir = join(vercelRootDir, "output");
          const vercelStaticDir = join(vercelOutDir, "static");

          console.warn("[react-router-hono]: Vercel Detected!");
          console.info(`[react-router-hono]: Generating '${vercelRootDir}'`);

          await fsp.rm(vercelRootDir, { recursive: true, force: true });
          await fsp.mkdir(vercelRootDir, { recursive: true });

          await fsp.mkdir(vercelOutDir, { recursive: true });
          await fsp.mkdir(vercelStaticDir, { recursive: true });
          await fsp.cp(clientBuildDir, vercelStaticDir, {
            recursive: true,
            force: true,
          });
          await fsp.rm(join(vercelStaticDir, ".vite"), {
            recursive: true,
            force: true,
          });

          for (const { id: bundleId, file } of Object.values(
            buildManifest?.serverBundles ?? {
              index: {
                id: "index",
                file: relative(
                  vercelRootDir,
                  join(serverBuildDir, serverBuildFile),
                ),
              },
            },
          )) {
            const buildFileDir = join(vercelRootDir, file);
            const buildDir = dirname(buildFileDir);
            const vercelFuncDir = join(
              vercelOutDir,
              "functions",
              `_${bundleId}.func`,
            );
            const pkg = JSON.parse(
              await fsp.readFile(join(rootDir, "package.json"), "utf8"),
            ) as Record<string, any>;
            const packageDependencies = {
              ...pkg.dependencies,
              ...pkg.devDependencies,
            };
            const dependencies = getPackageDependencies(
              packageDependencies,
              ssrExternal,
            );
            const [entryFile, serverBuildFile] = await buildEntry(
              //@ts-expect-error - entryFile
              join(rootDir, global.REACT_ROUTER_HONO_ENTRY_FILE),
              buildFileDir,
              dependencies,
            );

            await fsp.mkdir(vercelFuncDir, { recursive: true });
            for (const file of (
              await nodeFileTrace([entryFile, serverBuildFile], {
                base: rootDir,
              })
            ).fileList) {
              const source = join(rootDir, file);
              if ([entryFile, serverBuildFile].includes(source)) {
                continue;
              }

              if (source.includes("/node_modules/")) {
                const pkgName = source.match(
                  /\/node_modules\/([^/]+(?:\/.*)?)?/,
                )?.[1];
                if (pkgName && packageDependencies[pkgName]) {
                  dependencies[pkgName] = packageDependencies[pkgName] ?? "*";
                }
              } else {
                await fsp.cp(
                  await fsp.realpath(source),
                  join(vercelFuncDir, relative(rootDir, source)),
                  { recursive: true },
                );
              }
            }

            await fsp.writeFile(
              join(vercelFuncDir, ".vc-config.json"),
              JSON.stringify(
                {
                  handler: basename(entryFile),
                  runtime: "nodejs20.x",
                  launcherType: "Nodejs",
                  supportsResponseStreaming: true,
                  maxDuration: 60,
                  ...(regions && {
                    regions: Array.isArray(regions) ? regions : [regions],
                  }),
                },
                null,
                2,
              ),
              "utf8",
            );
            await fsp.cp(entryFile, join(vercelFuncDir, basename(entryFile)));

            for (const file of await fsp.readdir(buildDir)) {
              await fsp.cp(join(buildDir, file), join(vercelFuncDir, file), {
                recursive: true,
              });
            }

            await writePackageJson(
              pkg,
              join(vercelFuncDir, "package.json"),
              dependencies,
            );

            try {
              await execa({ cwd: vercelFuncDir })`npm install --force`;
            } catch (err) {
              if (err instanceof ExecaError) {
                console.error(
                  "[react-router-hono]: Failed to install packages",
                );
                throw new Error(`${err.stderr}`);
              }
            }
          }

          await writeVercelConfig(
            assetsDir,
            buildManifest,
            join(vercelOutDir, "config.json"),
          );

          console.timeEnd("[react-router-hono]");
        },
      }),
    }),
  };
};

function getRootDir(rootDir: string) {
  let currentDir = rootDir;
  let realRootDir = "";
  while (currentDir !== dirname(currentDir)) {
    if (existsSync(join(currentDir, "package.json"))) {
      realRootDir = currentDir;
    } else if (realRootDir) break;
    currentDir = dirname(currentDir);
  }

  return realRootDir;
}

function getServerRoutes(buildManifest: BuildManifest | undefined) {
  if (!buildManifest?.routeIdToServerBundleId) {
    return [{ path: "", bundleId: "index" }];
  }

  const getRoutePath = (route: any, routes: Record<string, any>): string => {
    const paths: string[] = [];
    let currentRoute = route;

    while (currentRoute && currentRoute.parentId) {
      if (currentRoute.path) paths.unshift(currentRoute.path);
      currentRoute = routes[currentRoute.parentId];
    }

    return `/${paths.concat(route.path || "").join("/")}`;
  };

  const routes = Object.values(buildManifest.routes)
    .filter((route) => route.id !== "root")
    .map((route) => ({
      id: route.id,
      path: getRoutePath(route, buildManifest.routes),
    }));

  const routePathBundles: Record<string, string[]> = {};

  for (const routeId in buildManifest.routeIdToServerBundleId) {
    const serverBundleId = buildManifest.routeIdToServerBundleId[routeId];
    const matchingRoute = routes.find((r) => r.id === routeId);

    if (matchingRoute) {
      routePathBundles[serverBundleId] = routePathBundles[serverBundleId] || [];
      routePathBundles[serverBundleId].push(matchingRoute.path);
    }
  }

  const bundleRoutes: Record<string, { path: string; bundleId: string }> = {};

  for (const bundleId in routePathBundles) {
    const paths = routePathBundles[bundleId].sort(
      (a, b) => a.length - b.length,
    );

    for (const path of paths) {
      if (
        !bundleRoutes[path] &&
        !Object.keys(bundleRoutes).some(
          (key) =>
            bundleRoutes[key].bundleId === bundleId &&
            path.startsWith(bundleRoutes[key].path),
        )
      ) {
        bundleRoutes[path] = { path, bundleId };
      }
    }
  }

  return Object.values(bundleRoutes)
    .map((route) => ({
      path: route.path.replace(/\/$/, ""),
      bundleId: route.bundleId,
    }))
    .sort((a, b) => b.path.length - a.path.length);
}

const writeVercelConfig = async (
  assetsDir: string,
  buildManifest: BuildManifest | undefined,
  vercelConfigFile: string,
) => {
  await fsp.writeFile(
    vercelConfigFile,
    JSON.stringify(
      {
        version: 3,
        routes: [
          {
            src: `^/${assetsDir}/(.*)$`,
            headers: { "cache-control": "public, max-age=31536000, immutable" },
            continue: true,
          },
          { handle: "filesystem" },
          ...getServerRoutes(buildManifest).map((bundle) => ({
            src: bundle.path.length ? `^${bundle.path}.*` : "/(.*)",
            dest: `_${bundle.bundleId}`,
          })),
        ],
      },
      null,
      2,
    ),
    "utf8",
  );
};
