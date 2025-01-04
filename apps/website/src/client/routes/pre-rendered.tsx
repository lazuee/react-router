import { Link } from "react-router";

export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center font-mono text-2xl font-bold text-zinc-800 dark:text-zinc-100 pt-16 pb-4 space-y-4">
      <h1 className="text-nowrap">Pre-rendered Route</h1>
      <Link to="/" className="underline">
        Return to Home
      </Link>
    </div>
  );
}
