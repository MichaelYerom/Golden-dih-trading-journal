"use client";

import { logoutAction } from "@/app/auth/actions";
import { LogOut, User as UserIcon } from "lucide-react";
import { useTransition } from "react";

interface UserNavProps {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export function UserNav({ user }: UserNavProps) {
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
        <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium truncate max-w-[140px]" title={user.email}>
          {user.name || user.email}
        </span>
      </div>

      <button
        onClick={() => {
          startTransition(async () => {
            await logoutAction();
          });
        }}
        disabled={isPending}
        title="Sign Out"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 text-xs text-zinc-400 hover:text-rose-300 transition-colors disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{isPending ? "Exiting..." : "Logout"}</span>
      </button>
    </div>
  );
}
