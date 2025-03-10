import { type EnvironmentModuleNode, type Plugin } from "vite";

/**
 * Handles SSR module updates in Vite 6 by triggering a full client reload for SSR-only modules.
 * @see https://github.com/vitejs/vite/issues/19114
 */
export function plugin(): Plugin {
  return {
    name: "@lazuee/react-router-hono[ssr-reload]",
    hotUpdate({ modules, server, timestamp }) {
      if (this.environment?.name !== "ssr") return;

      const seen = new Set<EnvironmentModuleNode>();
      let hasSsrOnlyModule = false;

      for (const mod of modules) {
        const skip =
          !mod.id ||
          server.environments.client.moduleGraph.getModuleById(mod.id);
        if (skip) continue;

        this.environment.moduleGraph.invalidateModule(
          mod,
          seen,
          timestamp,
          false,
        );
        hasSsrOnlyModule = true;
      }

      if (hasSsrOnlyModule || modules.length === 0) {
        server.ws.send({ type: "full-reload" });
      }
    },
  };
}
