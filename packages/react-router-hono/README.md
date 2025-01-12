## react-router-hono

> `react-router-hono` is a Vite plugin that integrates `hono` with `react-router`, providing presets to simplify production setups.

### Installation

Install the package:

```bash
pnpm add -D @lazuee/react-router-hono
```

### Usage

#### Vite Configuration

Add the plugin to your `vite.config.js`:

```js
import { env } from "node:process";

import { reactRouterHono } from "@lazuee/react-router-hono";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const port = Number.parseInt(env?.PORT || "3000");

export default defineConfig({
  plugins: [
    reactRouterHono({
      serverFile: "src/server/index.ts", // Path to your Hono server file
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    port, // This port will be used as the default unless overridden by `process.env.PORT` or `process.env.APP_PORT`
  },
});
```

#### Hono Configuration

Once you set the `serverFile` in the `reactRouterHono` plugin configuration, the file specified will be used as the base for your Hono server.

```ts
import { type ReactRouterHono } from "@lazuee/react-router-hono";

const reactRouterHono: ReactRouterHono = {
  getLoadContext(ctx) {
    return {
      message: "hello from hono",
    };
  },
  server(app) {
    app.get("/ping", (c) => c.text("pong"));
  },
};

export default reactRouterHono;
```

#### React Router Configuration

Configure `react-router.config.js` for production:

```js
import { bunPreset, nodePreset, vercelPreset } from "@lazuee/react-router-hono";

export default {
  appDirectory: "src/client", // react-router app directory
  presets: [bunPreset(), nodePreset(), vercelPreset({ regions: "hnd1" })],
  future: { unstable_optimizeDeps: true },
};
```

### Presets

- `bunPreset` : Prepares the app for Bun. Start the server with:  `bun run --bun ./build/server/index.js`
- `nodePreset` : Prepares the app for Node.js. Start the server with:  `node ./build/server/index.js`
- `vercelPreset` : Optimizes for Vercel deployment. Automatically detects `VERCEL=1` or the Vercel environment.
  - `regions` : [Vercel Regions](https://vercel.com/docs/edge-network/regions#region-list) where the Serverless Function will be deployed to.

For a usage example, check the [website](../../website) folder.

## License

This project is licensed under the MIT License - see the [LICENSE.md](../../LICENSE.md) file for details

Copyright © `2024-2025` `lazuee`
