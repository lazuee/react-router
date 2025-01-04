import React from "react";
import { Await, useAsyncError, useLoaderData } from "react-router";
import { type Info } from "./+types/loader-client";

const delay = 8_000; // 8 secs

export async function clientLoader() {
  return {
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
  const { message } = useLoaderData<Info["loaderData"]>();

  return (
    <div className="flex h-full items-center justify-center font-mono text-2xl font-bold text-zinc-800 dark:text-zinc-100">
      <React.Suspense fallback={<p>Loading...</p>}>
        <Await resolve={message} errorElement={<Error />}>
          {(message) => <p>{message}</p>}
        </Await>
      </React.Suspense>
    </div>
  );
}
