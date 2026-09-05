"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "right",
  disabled = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const sideClasses = {
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-100 shadow-lg border border-zinc-800 animate-in fade-in-0 zoom-in-95 duration-100",
            sideClasses[side],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
