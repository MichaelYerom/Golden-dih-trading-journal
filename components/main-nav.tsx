"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  const isBacktests = pathname === "/" || pathname.startsWith("/sessions");
  const isPlaybook = pathname.startsWith("/playbook");

  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          isBacktests
            ? "bg-secondary text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        <span>Backtests</span>
      </Link>

      <Link
        href="/playbook"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          isPlaybook
            ? "bg-secondary text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Playbook</span>
      </Link>
    </nav>
  );
}
