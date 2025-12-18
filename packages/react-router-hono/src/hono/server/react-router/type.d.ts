import type { ServerBuild } from "react-router";
import type { InitialContext, RSCServerBuild } from "../types";

export type RequestHandler = (
  build: RSCServerBuild | ServerBuild,
  mode: string,
  context?: InitialContext,
) => (req: Request) => Response;
