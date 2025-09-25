import "./styles/tailwind.css";

import { Outlet, type ShouldRevalidateFunctionArgs } from "react-router";
import { rootContext } from "../contexts";

import { type Route } from "./+types/root";
import { ErrorLayout } from "./components/layout/error";
import { RootLayout } from "./components/layout/root";

import { getTheme } from "./theme/route";

export const middleware: Route.MiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start root middleware");
    context.set(rootContext, "ROOT");
    const res = await next();
    console.log("end root middleware");
    return res;
  },
];

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  async ({ context }, next) => {
    console.log("start root middleware");
    context.set(rootContext, "ROOT");
    await next();
    console.log("end root middleware");
  },
];

export function shouldRevalidate({
  formData,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  return formData?.get("theme") ? true : defaultShouldRevalidate;
}

export async function loader({ request }: Route.LoaderArgs) {
  const theme = await getTheme(request);

  return {
    theme,
  };
}

export default function App() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export function ErrorBoundary() {
  return (
    <RootLayout>
      <ErrorLayout />
    </RootLayout>
  );
}
