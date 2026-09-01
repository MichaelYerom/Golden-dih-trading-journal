import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <select
        style={{ colorScheme: "dark", ...style }}
        className={cn(
          "flex h-8.5 w-full rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:border-white/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
