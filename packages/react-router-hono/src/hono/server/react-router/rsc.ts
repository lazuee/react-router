import { RouterContextProvider } from "react-router";
import type { InitialContext, RSCServerBuild } from "../types";

export function requestHandler(
  build: RSCServerBuild,
  _mode: string,
  loadContext?: InitialContext,
) {
  let requestContext: RouterContextProvider | undefined;
  if (loadContext) {
    if (loadContext instanceof RouterContextProvider) {
      requestContext = loadContext;
    } else if (typeof loadContext === "object") {
      requestContext = new RouterContextProvider();
      Object.assign(requestContext, loadContext);
    }
  }

  return (req: Request) => build.fetch(req, requestContext);
}
