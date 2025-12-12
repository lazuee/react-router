import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, parse } from "node:path";

const importCache: {
  [cacheKey: string]: any;
} = {};

export function requireFrom<T>(id: string, throwError = true): T | undefined {
  try {
    const require = createRequire(import.meta.url);
    importCache[id] ??= require(require.resolve(id));
  } catch (err) {
    if (throwError) {
      throw new Error(`[@lazuee/react-router-hono] "${id}" must be installed`, {
        cause: err,
      });
    }
  }

  return importCache[id];
}

const esbuild = requireFrom<typeof import("esbuild")>("esbuild");
export const defaultEsbuildOptions: import("esbuild").BuildOptions = {
  bundle: true,
  charset: "utf8",
  format: "esm",
  // keepNames is not needed when minify is disabled.
  // Also transforming multiple times with keepNames enabled breaks
  // tree-shaking. (#9164)
  keepNames: false,
  legalComments: "none",
  loader: { ".ts": "ts" },
  minify: false,
  minifyIdentifiers: false,
  minifySyntax: false,
  minifyWhitespace: false,
  platform: "node",
  supported: {
    "dynamic-import": true,
    "import-meta": true,
  },
  target: "esnext",
  treeShaking: false,
};

export async function bundleWithEsbuild(
  filepath: string,
  cwd = process.cwd(),
): Promise<string> {
  if (!esbuild) {
    throw new Error("esbuild is not installed");
  }

  const tempDir = await mkdtemp(join(import.meta.dirname, "temp-"));
  const tempEntry = join(tempDir, `${parse(filepath).name}.js`);

  try {
    await esbuild.build({
      ...defaultEsbuildOptions,
      entryPoints: [filepath],
      outfile: tempEntry,
      packages: "external",
      tsconfig: join(cwd, "tsconfig.json"),
    });

    const code = await readFile(tempEntry, "utf-8");
    return code;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}
