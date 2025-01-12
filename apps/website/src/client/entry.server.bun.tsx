import { readableStreamToString } from "@react-router/node";
import { isbot } from "isbot";
//@ts-expect-error - typings
import { renderToReadableStream } from "react-dom/server.bun";
import { ServerRouter, type HandleDocumentRequestFunction } from "react-router";
import { NonceContext } from "./components/context/nonce";

export const streamTimeout = 10_000;

const handleDocumentRequest: HandleDocumentRequestFunction = async (
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
  { nonce },
) => {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");
  const abortController = new AbortController();
  request.signal.addEventListener("abort", abortController.abort);

  const stream = await renderToReadableStream(
    <NonceContext.Provider value={nonce}>
      <ServerRouter nonce={nonce} context={routerContext} url={request.url} />
    </NonceContext.Provider>,
    {
      nonce,
      signal: abortController.signal,
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );

  // Abort the rendering stream after the `streamTimeout` so it has tine to
  // flush down the rejected boundaries
  setTimeout(() => abortController.abort(), streamTimeout + 1000);

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await stream.allReady;
  }

  shellRendered = true;

  return readableStreamToString(stream).then((html) => {
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");

    return new Response(html, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  });
};

export default handleDocumentRequest;
