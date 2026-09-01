import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "win" | "loss" | "neutral" | "active" | "completed" | "archived";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    destructive: "bg-[#DB5461]/10 text-[#DB5461] border-[#DB5461]/20",
    outline: "text-muted-foreground border-border bg-card",
    win: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/25",
    loss: "bg-[#DB5461]/10 text-[#DB5461] border-[#DB5461]/25",
    neutral: "bg-muted text-muted-foreground border-border",
    active: "bg-[#22A06B]/10 text-[#22A06B] border-[#22A06B]/25",
    completed: "bg-primary/10 text-primary border-primary/25",
    archived: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
