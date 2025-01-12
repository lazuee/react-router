import { type Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  createRequestHandler,
  type AppLoadContext,
  type ServerBuild,
} from "react-router";

export type ReactRouterOptions = {
  build: ServerBuild;
  mode?: string;
  getLoadContext?: (ctx: Context) => Promise<AppLoadContext> | AppLoadContext;
};

export function reactRouter(options: ReactRouterOptions) {
  let { build, mode, getLoadContext } = options;
  getLoadContext ??= (ctx) => ctx.var;

  return createMiddleware(async (ctx) => {
    const abortController = new AbortController();
    const requestHandler = createRequestHandler(build, mode);
    const createHeaders = () => {
      const headers = new Headers();
      ctx.req.raw.headers.forEach((value, key) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((val) => headers.append(key, val));
          } else {
            headers.set(key, value);
          }
        }
      });
      return headers;
    };
    const createRequest = () => {
      const forwardedHost = ctx.req.header("X-Forwarded-Host");
      const host = ctx.req.header("Host");
      const [, hostnamePort] = forwardedHost?.split(":") ?? [];
      const [, hostPort] = host?.split(":") ?? [];
      const port = hostnamePort || hostPort;

      const resolvedHost = `${host?.split(":")[0] || "localhost"}${port ? `:${port}` : ""}`;
      const protocol = ctx.req.header("X-Forwarded-Proto") || "http";
      const url = new URL(`${ctx.req.url}`, `${protocol}://${resolvedHost}`);
      ctx.req.raw.signal.addEventListener("abort", () =>
        abortController?.abort(new Error(ctx.req.raw.signal.reason)),
      );

      const init: RequestInit = {
        method: ctx.req.method,
        headers: createHeaders(),
        signal: abortController.signal,
      };

      if (ctx.req.method !== "GET" && ctx.req.method !== "HEAD") {
        init.body = ctx.req.raw.body as ReadableStream;
        (init as { duplex: "half" }).duplex = "half";
      }

      return new Request(url.href, init);
    };
    const sendResponse = (response: Response) => {
      ctx.status(response.status as any);
      response.headers.forEach((value, key) => ctx.header(key, value));

      const contentType = response.headers.get("Content-Type");
      const body = ctx.body as <T>(
        body?: T,
        status?: number,
        headers?: Headers,
      ) => Response;

      if (contentType && /text\/event-stream/i.test(contentType)) {
        return body(response.body, response.status, response.headers);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          },
        });

        return body(stream, response.status, response.headers);
      }

      return body(null, response.status, response.headers);
    };

    const loadContext = await Promise.resolve(getLoadContext(ctx));
    const response = await requestHandler(createRequest(), loadContext);
    return sendResponse(response);
  });
}
