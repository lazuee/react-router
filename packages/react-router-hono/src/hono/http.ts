import {
  redirect as reactRouterRedirect,
  redirectDocument as reactRouterRedirectDocument,
  replace as reactRouterReplace,
} from "react-router";

const isHonoRequestData = () =>
  global.REACT_ROUTER_HONO_REQUEST_PATH?.endsWith(".data") &&
  global.REACT_ROUTER_HONO_REQUEST_FROM === "hono";

export function redirect(url: string, headers?: HeadersInit) {
  const res = reactRouterRedirect(url, { headers });

  if (isHonoRequestData()) {
    res.headers.set("X-Remix-Response", "yes");
    res.headers.set("Content-Type", "text/x-script");

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            JSON.stringify([
              ["SingleFetchRedirect", 1],
              { _2: 3, _4: 5, _6: 7, _8: 7, _9: 7 },
              "redirect",
              url,
              "status",
              302,
              "revalidate",
              false,
              "reload",
              "replace",
            ]),
          );
          controller.close();
        },
      }),
      {
        status: 202,
        headers: res.headers,
      },
    );
  }

  return res;
}

export function redirectDocument(url: string, headers?: HeadersInit) {
  const res = reactRouterRedirectDocument(url, { headers });
  if (isHonoRequestData()) {
    res.headers.set("X-Remix-Response", "yes");
    res.headers.set("Content-Type", "text/x-script");

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            JSON.stringify([
              ["SingleFetchRedirect", 1],
              { _2: 3, _4: 5, _6: 7, _8: 9, _10: 7 },
              "redirect",
              url,
              "status",
              302,
              "revalidate",
              false,
              "reload",
              true,
              "replace",
            ]),
          );
          controller.close();
        },
      }),
      {
        status: 202,
        headers: res.headers,
      },
    );
  }

  return res;
}

export function replace(url: string, headers?: HeadersInit) {
  const res = reactRouterReplace(url, { headers });
  if (isHonoRequestData()) {
    res.headers.set("X-Remix-Response", "yes");
    res.headers.set("Content-Type", "text/x-script");

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            JSON.stringify([
              ["SingleFetchRedirect", 1],
              { _2: 3, _4: 5, _6: 7, _8: 7, _9: 10 },
              "redirect",
              url,
              "status",
              302,
              "revalidate",
              false,
              "reload",
              "replace",
              true,
            ]),
          );
          controller.close();
        },
      }),
      {
        status: 202,
        headers: res.headers,
      },
    );
  }

  return res;
}
