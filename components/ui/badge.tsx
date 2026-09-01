import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "win" | "loss" | "neutral" | "active" | "completed" | "archived";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/15 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-secondary/40",
    destructive: "bg-destructive/15 text-destructive border-destructive/20",
    outline: "text-foreground border-border",
    win: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    loss: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    neutral: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
