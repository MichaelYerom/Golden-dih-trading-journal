import Link from "next/link";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center mb-6 text-primary shadow-lg shadow-primary/5">
        <Compass className="h-8 w-8 animate-pulse" />
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-mono-numbers">
        404
      </h1>
      <h2 className="mt-2 text-lg font-semibold text-foreground">
        Page Not Found
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The trading session, journal log, or route you are looking for does not exist or has been moved.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
