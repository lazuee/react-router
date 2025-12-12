export function createVM(name: string): {
  name: string;
  id: string;
  resolvedId: string;
  url: string;
} {
  const id = `virtual:@lazuee/react-router-hono[${name}]`;
  return {
    id,
    name,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`,
  };
}

export const virtual = {
  entry: createVM("entry"),
  entryRsc: createVM("entry-rsc"),
  runtime: createVM("runtime"),
  server: createVM("server"),
};
