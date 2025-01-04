import { index, route, type RouteConfig } from "@react-router/dev/routes";

const routes: RouteConfig = [
  index("routes/home.tsx"),
  route("/loader", "routes/loader.tsx"),
  route("/loader-client", "routes/loader-client.tsx"),
  route("/protected", "routes/protected.tsx"),
  route("/secret", "routes/secret.tsx"),
  route("/pre-rendered", "routes/pre-rendered.tsx"),
  route("/theme", "theme/route.ts"),
  route("*", "routes/not-found.tsx"),
];

export default routes;
