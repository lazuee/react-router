import { existsSync, readdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";

export interface FindFileOptions {
  cwd?: string;
  filename: string;
  extensions: string[];
}

export function findFileWithExtensions(
  options: FindFileOptions,
): string | undefined {
  const { cwd = process.cwd(), filename, extensions } = options;

  for (const extension of extensions) {
    const filePath = join(cwd, `${filename}.${extension}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  for (const file of readdirSync(cwd, {
    encoding: "utf8",
    recursive: true,
    withFileTypes: true,
  })) {
    if (
      file.isFile() &&
      file.name.startsWith(filename) &&
      extensions.includes(file.name.split(".").pop()!)
    ) {
      return join(file.parentPath, file.name);
    }
  }
}

export const isRelativePath = (path: string) =>
  !isAbsolute(path) && !path.startsWith("/");
