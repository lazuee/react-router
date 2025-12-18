import { createRequestHandler } from "react-router";
import type { ServerBuild } from "react-router";
import type { InitialContext } from "../types";

export function requestHandler(
  build: ServerBuild,
  mode: string,
  loadContext?: InitialContext,
) {
  const requestHandler = createRequestHandler(build, mode);
  return (req: Request) => requestHandler(req, loadContext);
}
