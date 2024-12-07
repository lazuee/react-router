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
import { reactRouterHono } from "@lazuee/react-router-hono";

import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    reactRouterHono({
      serverFile: "src/server/index.ts", // hono server path
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
```

#### React Router Configuration

Configure `react-router.config.js` for production:

```js
import { nodePreset, vercelPreset } from "@lazuee/react-router-hono";

export default {
  appDirectory: "src/client", // react-router app directory
  presets: [vercelPreset({ regions: "hnd1" }), nodePreset()],
  future: { unstable_optimizeDeps: true },
};
```

### Presets

- `nodePreset` : Prepares the app for Node.js. Start the server with:  `node ./build/server/index.js`
- `vercelPreset` : Optimizes for Vercel deployment. Automatically detects `VERCEL=1` or the Vercel environment.
  - `regions` : [Vercel Regions](https://vercel.com/docs/edge-network/regions#region-list) where the Serverless Function will be deployed to.

For a usage example, check the [website](../../website) folder.

## License

This project is licensed under the MIT License - see the [LICENSE.md](../../LICENSE.md) file for details

Copyright © `2024` `lazuee`
