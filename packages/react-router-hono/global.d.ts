import { type Config } from "@react-router/dev/config";
import {
  type Logger,
  type ViteDevServer,
  type ResolvedConfig as ViteResolvedConfig,
  type UserConfig as ViteUserConfig,
} from "vite";

export interface ReactRouterContext {
  entryClientFilePath: string;
  entryServerFilePath: string;
  isSsrBuild: true;
  reactRouterConfig: ResolvedReactRouterConfig;
  rootDirectory: string;
}

export interface ReactRouterHono {
  basename: string;
  directory: ReactRouterHonoDirectory;
  entry: ReactRouterHonoEntry;
  mode: "development" | "production";
  port: number;
  reactRouter: ReactRouterConfig;
  request: ReactRouterHonoRequest;
  runtime: "bun" | "node";
  ssr: boolean;
  vite: ViteConfig;
  error?: string;
}

export interface ReactRouterHonoRequest {
  from: "hono" | "react-router";
  path: `/${string}`;
}

interface ReactRouterConfig {
  future: ResolvedReactRouterConfig["future"];
  routes: ResolvedReactRouterConfig["routes"];
}

interface ReactRouterHonoDirectory {
  app: string;
  build: string;
  honoEntry: string;
  public: string;
}

interface ReactRouterHonoEntry {
  hono?: string;
  reactRouter: {
    client: string;
    server: string;
  };
}

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

type ResolvedReactRouterConfig = {
  -readonly [key in keyof ResolvedReactRouterConfigReadOnly]: ResolvedReactRouterConfigReadOnly[key];
};

type ResolvedReactRouterConfigReadOnly = Parameters<
  Required<Required<Config>["presets"][0]>["reactRouterConfigResolved"]
>[0]["reactRouterConfig"];

type ResolvedReactRouterContext = {
  readonly [key in keyof ReactRouterContext]: ReactRouterContext[key];
};

interface ViteConfig {
  copyPublicDir: boolean;
  root: string;
}

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var __reactRouterHono: ReactRouterHono;
  // eslint-disable-next-line vars-on-top, no-var
  var __viteConfig: ResolvedConfig;
  // eslint-disable-next-line vars-on-top, no-var
  var __viteDevServer: ViteDevServer;
  // eslint-disable-next-line vars-on-top, no-var
  var __serveStaticRoots: string[];
  // eslint-disable-next-line vars-on-top, no-var
  var __logger: Logger;
}

declare module "vite" {
  interface ResolvedConfig extends ViteResolvedConfig {
    __reactRouterHono: ReactRouterHono;
    __reactRouterPluginContext: ResolvedReactRouterContext;
  }

  interface UserConfig extends ViteUserConfig {
    __reactRouterHono?: RecursivePartial<ReactRouterHono>;
    __reactRouterPluginContext?: RecursivePartial<ReactRouterContext>;
  }
}

export {};
