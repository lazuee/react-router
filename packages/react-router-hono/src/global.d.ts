declare global {
  var REACT_ROUTER_HONO_COPY_PUBLIC_DIR: boolean;
  var REACT_ROUTER_HONO_PUBLIC_DIR: string;
  var REACT_ROUTER_HONO_ENTRY_FILE: string | undefined;
  var REACT_ROUTER_HONO_PRESETS:
    | {
        node?: true;
        vercel?: true;
        vite?: true;
      }
    | undefined;
}

export {};
