import {
  existsSync,
  promises as fsp,
  readFileSync,
  readlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { type Config as ReactRouterConfig } from "@react-router/dev/config";
import { nodeFileTrace } from "@vercel/nft";
import rwr from "resolve-workspace-root";
import { globSync } from "tinyglobby";
import { loadConfig } from "unconfig";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import { colors, isVercel } from "../../../lib/utils";

let _hasVercelPreset: boolean;
async function hasVercelPreset(): Promise<boolean> {
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
  return (_hasVercelPreset ??=
    /["']@vercel\/react-router\/vite['"]/.test(code) &&
    /vercelPreset\(.*\)/.test(code) &&
    !!config.presets?.find((x) => x.name === "vercel"));
}

export function plugin(): Plugin[] {
  if (!isVercel) return [];
  let ssr: boolean;
  const rootDir = rwr.resolveWorkspaceRoot(cwd()) || cwd();
  const fnName = "index";
  const vercelDirs = {
    root: join(rootDir, ".vercel"),
    output: join(rootDir, ".vercel/output"),
    func: join(rootDir, `.vercel/output/functions/${fnName}.func`),
    static: join(rootDir, ".vercel/output/static"),
  };
  return [
    {
      name: "@lazuee/react-router-hono[deploy-vercel]",
      apply: "build",
      enforce: "post",
      async config(userConfig, { isSsrBuild }) {
        ssr = isSsrBuild!;
        return mergeConfig(userConfig, {
          build: { copyPublicDir: true },
        } as UserConfig);
      },
      configResolved: {
        order: "post",
        async handler(config) {
          if (ssr) {
            __logger.info(
              `${colors().green("Vercel detected")}, generating '${colors().gray(".vercel")}' directory...`,
            );
            await Promise.all([
              fsp.rm(vercelDirs.root, { recursive: true, force: true }),
              fsp.mkdir(vercelDirs.root, { recursive: true }),
            ]);
          }
          const reactRouterConfig =
            config.__reactRouterPluginContext?.reactRouterConfig;
          const originalBuildEnd = reactRouterConfig.buildEnd;
          reactRouterConfig.buildEnd = async function (...args) {
            await originalBuildEnd?.apply(this, args);
            if (await hasVercelPreset()) {
              await fsp.cp(".vercel", vercelDirs.root, { recursive: true });
              return;
            }
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
            const serverIndex = globSync(
              join(
                __reactRouterHono.directory.build,
                "server",
                "**",
                "index.js",
              ),
            )?.[0];
            const chunkFiles = globSync(
              join(
                __reactRouterHono.directory.build,
                "server",
                "**",
                "chunks",
                "**",
                "*.js",
              ),
            );
            const { fileList, esmFileList } = await nodeFileTrace(
              [serverIndex, ...chunkFiles],
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
              const dest = join(vercelDirs.func, "node_modules", packageName);
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

              if (!existsSync(dest) || !(await fsp.stat(dest)).isDirectory()) {
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
                join(vercelDirs.func, ".vc-config.json"),
                JSON.stringify(
                  {
                    handler: serverIndex.replace(
                      join(__reactRouterHono.directory.build, "server"),
                      ".",
                    ),
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
                          "cache-control":
                            "public, immutable, max-age=31536000",
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
          };
        },
      },
    },
  ];
}
