import { type EnvironmentModuleNode, type Plugin } from "vite";

/**
 * Handles SSR module updates in Vite 6 by triggering a full client reload for SSR-only modules.
 * @see https://github.com/vitejs/vite/issues/19114
 */
export function plugin(): Plugin {
  return {
    name: "@lazuee/react-router-hono[ssr-reload]",
    enforce: "post",
    hotUpdate: {
      order: "post",
      handler({ modules, server, timestamp }) {
        if (this.environment?.name !== "ssr") {
          return;
        }

        const seen = new Set<EnvironmentModuleNode>();
        let hasSsrOnlyModules = false;

        for (const mod of modules) {
          const skip =
            !mod.id ||
            server.environments.client.moduleGraph.getModuleById(mod.id);
          if (skip) {
            continue;
          }

          this.environment.moduleGraph.invalidateModule(
            mod,
            seen,
            timestamp,
            true,
          );
          hasSsrOnlyModules = true;
        }

        if (hasSsrOnlyModules) {
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
    },
  };
}
