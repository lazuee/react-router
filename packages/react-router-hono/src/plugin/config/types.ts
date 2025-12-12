import type { Config } from "@react-router/dev/config";

export type ReactRouterHonoRuntime = "bun" | "cloudflare" | "node";

export interface ReactRouterHonoDirectory {
  build: string;
  honoEntry: string;
  public: string;
  root: string;
  app?: string;
}

interface ReactRouterHonoEntry {
  hono?: string;
  reactRouter: {
    client?: string;
    rsc?: string;
    ssr?: string;
  };
}

export interface ReactRouterHonoRequest {
  from: "hono" | "react-router";
  path: `/${string}`;
}

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

export type ResolvedReactRouterConfig = {
  -readonly [key in keyof ResolvedReactRouterConfigReadOnly]: ResolvedReactRouterConfigReadOnly[key];
};

type ResolvedReactRouterConfigReadOnly = Parameters<
  Required<Required<Config>["presets"][0]>["reactRouterConfigResolved"]
>[0]["reactRouterConfig"];

export interface ReactRouterContext {
  entryClientFilePath: string;
  entryServerFilePath: string;
  isSsrBuild: true;
  reactRouterConfig: ResolvedReactRouterConfig;
  rootDirectory: string;
}

export type ResolvedReactRouterContext = {
  readonly [key in keyof ReactRouterContext]: ReactRouterContext[key];
};

export interface ReactRouterConfig {
  future: ResolvedReactRouterConfig["future"];
  routes: ResolvedReactRouterConfig["routes"];
}

export interface ReactRouterHono {
  basename: string;
  copyPublicDir: boolean;
  directory: ReactRouterHonoDirectory;
  entry: ReactRouterHonoEntry;
  mode: "development" | "production";
  port: number;
  request: ReactRouterHonoRequest;
  rsc: boolean;
  runtime: ReactRouterHonoRuntime;
  ssr: boolean;
  error?: string;
  reactRouter?: Config;
}
