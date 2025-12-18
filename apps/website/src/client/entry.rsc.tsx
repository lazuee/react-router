import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
// @ts-expect-error - virtual
import basename from "virtual:react-router/unstable_rsc/basename";

// @ts-expect-error - virtual
import reactRouterServeConfig from "virtual:react-router/unstable_rsc/react-router-serve-config";
// @ts-expect-error - virtual
import routes from "virtual:react-router/unstable_rsc/routes";
import type { RouterContextProvider } from "react-router";

// eslint-disable-next-line camelcase
export const unstable_reactRouterServeConfig = reactRouterServeConfig;

export function fetchServer(
  request: Request,
  requestContext?: RouterContextProvider,
) {
  return matchRSCServerRequest({
    basename,
    // Provide the React Server touchpoints.
    createTemporaryReferenceSet,
    decodeAction,
    decodeFormState,
    decodeReply,
    loadServerAction,
    // The incoming request.
    request,
    requestContext,
    // The app routes.
    routes,
    // Encode the match with the React Server implementation.
    generateResponse(match, options) {
      return new Response(renderToReadableStream(match.payload, options), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

export default {
  async fetch(request: Request, requestContext?: RouterContextProvider) {
    const ssr = await import.meta.viteRsc.loadModule<
      typeof import("./entry.ssr.tsx")
    >("ssr", "index");

    return await ssr.generateHTML(
      request,
      await fetchServer(request, requestContext),
      requestContext,
    );
  },
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
