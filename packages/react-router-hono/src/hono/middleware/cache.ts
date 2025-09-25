import { type MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

export type CacheOptions = {
  maxAge?:
    | `${string}s`
    | `${string}m`
    | `${string}h`
    | `${string}d`
    | `${string}w`;
  public?: boolean;
  private?: boolean;
  noStore?: boolean;
  noCache?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
};

function buildCacheHeader(options: CacheOptions): string {
  const directives: string[] = [];

  if (options.public) {
    directives.push("public");
  }
  if (options.private) {
    directives.push("private");
  }
  if (options.noStore) {
    directives.push("no-store");
  }
  if (options.noCache) {
    directives.push("no-cache");
  }
  if (options.mustRevalidate) {
    directives.push("must-revalidate");
  }
  if (options.immutable) {
    directives.push("immutable");
  }
  if (options.maxAge) {
    directives.push(`max-age=${convertToSeconds(options.maxAge)}`);
  }

  return directives.join(", ");
}

function convertToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhdw])$/);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    case "w":
      return value * 604800;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function cache(options: CacheOptions, path?: string): MiddlewareHandler {
  return createMiddleware(async (ctx, next) => {
    const { path: reqPath } = ctx.req;

    if (
      !/\.[a-z0-9]+$/i.test(reqPath) ||
      reqPath.endsWith(".data") ||
      (path && !reqPath.startsWith(path))
    ) {
      return await next();
    }

    await next();

    if (ctx.res.ok) {
      ctx.res.headers.set("cache-control", buildCacheHeader(options));
    }
  });
}
