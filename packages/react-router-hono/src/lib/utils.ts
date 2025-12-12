import type { ReactRouterHonoRuntime } from "../plugin/config/types";

let runtime: ReactRouterHonoRuntime | undefined;
export function getRuntime() {
  if (runtime) {
    return runtime;
  }

  if (process.versions.bun) {
    runtime = "bun";
  } else if (process.env.WORKER_ENV) {
    runtime = "cloudflare";
  } else {
    runtime = "node";
  }

  return runtime;
}

export const isVercel = () =>
  process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;

export const semverCompare = (current: string, required: string) =>
  current.localeCompare(required, undefined, {
    numeric: true,
    sensitivity: "base",
  }) >= 0;
