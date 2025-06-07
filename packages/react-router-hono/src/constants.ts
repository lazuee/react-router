import { createVM } from "./lib/utils";

export const vm: Record<string, ReturnType<typeof createVM>> = {
  entry: createVM("react-router-hono-entry"),
  runtime: createVM("react-router-hono-runtime"),
  server: createVM("react-router-hono-server"),
};
