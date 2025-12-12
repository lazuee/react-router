type React = typeof import("react");
let react: React | undefined;

export async function preloadReact(): Promise<void> {
  react ??= await import(/* @vite-ignore */ "react");
}

export function getReactVersion() {
  const version = react?.version || react?.version;
  if (version) {
    return Number.parseInt(version.split(".")[0], 10);
  }
}
