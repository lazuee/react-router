import { existsSync, readlinkSync } from "node:fs";
import { cp, lstat, mkdir, rmdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { nodeFileTrace } from "@vercel/nft";

interface CopyPackagesOptions {
  cwd: string;
  traceFiles: string[];
}

export async function copyPackages(opts: CopyPackagesOptions, toDir: string) {
  const { fileList, esmFileList } = await nodeFileTrace(opts.traceFiles, {
    base: opts.cwd,
    processCwd: opts.cwd,
    ts: true,
    mixedModules: true,
  });

  const { deps } = Array.from(new Set([...fileList, ...esmFileList])).reduce(
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
    { deps: [] as [string, string][], seen: new Set<string>() },
  );

  for (const [p, packageName] of deps) {
    const dest = join(toDir, "node_modules", packageName);
    let targetPath: string;
    try {
      targetPath = (await lstat(join(opts.cwd, p))).isSymbolicLink()
        ? readlinkSync(join(opts.cwd, p)).replace(/(?:\.\.\/)+/, "")
        : p;
      targetPath = resolve(
        opts.cwd,
        targetPath.startsWith(".pnpm") ? join("node_modules", targetPath) : p,
      );
    } catch {
      continue;
    }

    if (!existsSync(dest) || !(await stat(dest)).isDirectory()) {
      try {
        await mkdir(dest, { recursive: true });
        await cp(targetPath, dest, { recursive: true });
      } catch {
        await rmdir(dest).catch(() => {});
      }
    }
  }
}
