import { type Env } from "hono";
import { createMiddleware } from "hono/factory";
import { IS_PRODUCTION_BUILD } from "~/env.server";

declare module "hono" {
  interface ContextVariableMap {
    nonce?: string;
  }
}

declare module "react-router" {
  export interface AppLoadContext {
    readonly nonce?: string;
  }
}

export function csp<E extends Env = Env>() {
  return createMiddleware<E>(async (ctx, next) => {
    const nonce = IS_PRODUCTION_BUILD
      ? Math.random().toString(36).slice(2)
      : undefined;

    ctx.set("nonce", nonce);
    ctx.res.headers.set(
      "Content-Security-Policy",
      getContentSecurityPolicy(nonce),
    );

    return next();
  });
}

export function getContentSecurityPolicy(nonce?: string) {
  nonce = nonce ? `'nonce-${nonce}'` : undefined;
  const self = "'self'";

  return [
    `default-src ${self}`,
    `script-src ${self} ${nonce || "'unsafe-inline'"}`,
    `style-src ${self} 'unsafe-inline'`,
    `font-src ${self} https: data:`,
    `img-src ${self} data: blob: https:`,
    `connect-src ${self} ws: wss:`,
    `media-src ${self} https:`,
    "object-src 'none'",
    `child-src ${self}`,
    `frame-src ${self} https:`,
    `worker-src blob:`,
    "frame-ancestors 'none'",
    `form-action ${self}`,
    `base-uri ${self}`,
    `manifest-src https:`,
    "block-all-mixed-content",
  ]
    .map((x) => `${x};`)
    .join(" ")
    .trim();
}
