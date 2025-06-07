import React from "react";
import { Await, useAsyncError, useLoaderData } from "react-router";
import { type Route } from "./+types/loader";

const delay = 8_000; // 8 secs

export async function loader({ context }: Route.LoaderArgs) {
  const { clientIp } = context;

  // Use dynamic import when using server-side code in the loader
  // Do not await this, because it will wait for the import to resolve before returning the loaderData
  const env = import("~/env.server");

  return { clientIp, env };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const { clientIp, env } = await serverLoader();

  return {
    clientIp,
    env,
    message: new Promise((resolve) =>
      setTimeout(() => resolve("Hello, world!"), delay),
    ) as Promise<string>,
  };
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return null;
}

function Error() {
  const error = useAsyncError() as Error;
  return <div>Error: {error.message}</div>;
}

export default function Page() {
  const { clientIp, env, message } =
    useLoaderData<Route.ComponentProps["loaderData"]>();

  return (
    <div className="flex h-full flex-col items-center justify-center font-mono text-2xl font-bold text-zinc-800 dark:text-zinc-100 gap-1">
      <p>Client IP: {clientIp || "0.0.0.0"}</p>
      <React.Suspense fallback={<p>Loading...</p>}>
        <Await resolve={message} errorElement={<Error />}>
          {(message) => <p>{message}</p>}
        </Await>
      </React.Suspense>
      <React.Suspense fallback={<p>Getting Site URL...</p>}>
        <Await resolve={env} errorElement={<Error />}>
          {(data) => <p>Site URL: {data.SITE_URL}</p>}
        </Await>
      </React.Suspense>
    </div>
  );
}
