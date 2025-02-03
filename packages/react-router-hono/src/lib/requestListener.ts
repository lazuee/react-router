import {
  type IncomingMessage,
  type RequestListener,
  type ServerResponse,
} from "node:http";
import { Readable } from "node:stream";

import { type MaybePromise } from "./types";

export const requestListener = (
  handler: (req: Request) => MaybePromise<Response>,
  options?: {
    onError?: (error: unknown) => MaybePromise<Response | void>;
  },
): RequestListener => {
  const onError = options?.onError ?? defaultErrorHandler;

  return async (req, res) => {
    const request = createRequest(req, res);

    let response: Response;
    try {
      response = await handler(request);
    } catch (err) {
      try {
        const errorResponse = await onError(err);
        if (!errorResponse) {
          // User handled the error via middleware
          return;
        }
        response = errorResponse;
      } catch (err_) {
        console.error("Error in onError handler:", err_);
        response = defaultErrorHandler(err_);
      }
    }

    const headers: Record<string, string | string[]> = {};
    for (const [key, value] of response.headers) {
      headers[key] = headers[key]
        ? ([] as string[]).concat(headers[key]!).concat(value)
        : value;
    }

    res.writeHead(response.status, headers);

    if (response.body && req.method?.toUpperCase() !== "HEAD") {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  };
};

const defaultErrorHandler = (error: unknown) => {
  console.error(error);
  return new Response("Internal Server Error", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
};

const createRequest = (req: IncomingMessage, res: ServerResponse) => {
  const controller = new AbortController();
  res.on("close", () => controller.abort());

  const method = (req.method ?? "GET").toUpperCase();
  const headers = new Headers();

  // Add request headers
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers.append(req.rawHeaders[i]!, req.rawHeaders[i + 1]!);
  }

  const protocol = "encrypted" in req.socket ? "https:" : "http:";
  const host = headers.get("Host") || "localhost";
  const url = new URL(req.url!, `${protocol}//${host}`);

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    signal: controller.signal,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = new ReadableStream({
      start(controller) {
        req.on("data", (chunk) =>
          controller.enqueue(
            new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength),
          ),
        );
        req.on("end", () => controller.close());
        req.on("error", (err) => controller.error(err));
      },
    });
    init.duplex = "half";
  }

  return new Request(url, init);
};
