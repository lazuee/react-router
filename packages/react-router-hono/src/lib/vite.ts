import type { UserConfig } from "vite";

type Vite = typeof import("vite");
let vite: Vite | undefined;

export async function preloadVite(): Promise<void> {
  vite ??= await import(/* @vite-ignore */ "vite");
}

export function getVite(): Vite {
  return vite!;
}

export async function loadDotenv({
  rootDirectory,
  viteUserConfig,
  mode,
}: {
  rootDirectory: string;
  viteUserConfig: UserConfig;
  mode: string;
}) {
  await preloadVite();

  const envVars = getVite().loadEnv(
    mode,
    viteUserConfig.envDir ?? rootDirectory,
    // Load all env vars, not just VITE_ prefixed ones (for server-side)
    "",
  );
  Object.assign(process.env, envVars);
}
