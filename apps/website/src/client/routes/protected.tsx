import { Link } from "react-router";

export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center font-mono text-2xl font-bold text-zinc-800 dark:text-zinc-100 pt-16 pb-4 space-y-4">
      <h1 className="text-3xl font-extrabold">Protected Route</h1>
      <Link to="/secret" className="underline">
        /secret page
      </Link>
      <Link to="/protected/secret" className="underline">
        /protected/secret page
      </Link>
      <Link to="/" className="underline">
        Return to Home
      </Link>
    </div>
  );
}
