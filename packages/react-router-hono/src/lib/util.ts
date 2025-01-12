import { writeFile } from "node:fs/promises";
import { env, versions } from "node:process";

import { type ResolvedConfig } from "vite";

export type SsrExternal = ResolvedConfig["ssr"]["external"];

export const isVercel = env.VERCEL === "1" || env.VERCEL_ENV;

export const isBun = versions.bun;

export const getPackageDependencies = (
  dependencies: Record<string, string | undefined>,
  ssrExternal: SsrExternal,
) => {
  const filteredExternal = Array.isArray(ssrExternal)
    ? ssrExternal.filter((id) => !id.startsWith("@react-router"))
    : ssrExternal;

  if (!filteredExternal || filteredExternal === true) return {};
  return Object.keys(dependencies).reduce(
    (result: Record<string, string>, key) => {
      if (filteredExternal.includes(key)) result[key] = dependencies[key] ?? "";
      return result;
    },
    {},
  );
};

export const writePackageJson = async (
  pkg: Record<string, any>,
  outputFile: string,
  dependencies: Record<string, string>,
) => {
  await writeFile(
    outputFile,
    JSON.stringify(
      {
        type: pkg.type,
        scripts: {
          postinstall: pkg.scripts?.postinstall ?? "",
        },
        dependencies,
        ...(pkg.trustedDependencies && {
          trustedDependencies: pkg.trustedDependencies,
        }),
      },
      null,
      2,
    ),
    "utf8",
  );
};
