/* eslint-disable no-var */
/* eslint-disable vars-on-top */
declare global {
  var REACT_ROUTER_HONO_PORT: number | undefined;
  var REACT_ROUTER_HONO_REQUEST_PATH: string;
  var REACT_ROUTER_HONO_REQUEST_FROM: "hono" | "react-router";
  var REACT_ROUTER_HONO_COPY_PUBLIC_DIR: boolean;
  var REACT_ROUTER_HONO_PUBLIC_DIR: string;
  var REACT_ROUTER_HONO_ENTRY_FILE: string | undefined;
  var REACT_ROUTER_HONO_PRESETS:
    | {
        bun?: true;
        node?: true;
        vercel?: true;
        vite?: true;
      }
    | undefined;
}

export {};
