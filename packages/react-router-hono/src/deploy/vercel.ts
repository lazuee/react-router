import { cp, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { copyPackages } from "../plugin/config/copy-packages";

export async function deployVercel(buildDir: string, workspaceRootDir: string) {
  const bundleId = "index";
  const vercelDir = join(workspaceRootDir, ".vercel");
  const vercelOutDir = join(vercelDir, "output");
  const vercelStaticDir = join(vercelOutDir, "static");
  const vercelFuncDir = join(vercelOutDir, "functions", `_${bundleId}.func`);

  await rm(vercelDir, { force: true, recursive: true });

  const serverChunks = (
    await readdir(join(buildDir, "server"), {
      encoding: "utf8",
      recursive: true,
      withFileTypes: true,
    })
  )
    .filter((file) => file.isFile())
    .map((x) => join(x.parentPath, x.name));

  await copyPackages(
    {
      cwd: workspaceRootDir,
      traceFiles: serverChunks,
    },
    vercelFuncDir,
  );

  await Promise.all([
    cp(join(buildDir, "server"), vercelFuncDir, { recursive: true }),
    cp(join(buildDir, "client"), vercelStaticDir, { recursive: true }),
    writeFile(
      join(vercelFuncDir, ".vc-config.json"),
      JSON.stringify(
        {
          handler: "./index.js",
          supportsResponseStreaming: true,
          runtime: "nodejs24.x",
          ...(process.versions.bun
            ? {}
            : {
                launcherType: "Nodejs",
              }),
        },
        null,
        2,
      ),
    ),
    writeFile(
      join(vercelOutDir, "config.json"),
      JSON.stringify(
        {
          routes: [
            {
              headers: {
                "cache-control": "public, immutable, max-age=31536000",
              },
              src: "^/assets/(.*)$",
            },
            { handle: "filesystem", methods: ["GET"] },
            { dest: `_${bundleId}`, src: "/(.*)" },
          ],
          version: 3,
        },
        null,
        2,
      ),
    ),
    writeFile(
      join(vercelFuncDir, "package.json"),
      JSON.stringify({ type: "module" }, null, 2),
    ),
  ]);
}

const isCLI = import.meta.filename === process.argv[1];
if (isCLI) {
  await deployVercel(process.argv[2], process.argv[3]);
}
