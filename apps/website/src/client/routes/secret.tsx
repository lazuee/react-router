import { redirect } from "@lazuee/react-router-hono/http";

export function loader() {
  return redirect("/protected");
}

export default function Page() {
  return <h1>Secret page</h1>;
}
