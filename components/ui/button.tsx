import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold",
      outline: "border border-border bg-card hover:border-white/20 text-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-foreground text-muted-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      success: "bg-[#22A06B] text-white hover:bg-[#22A06B]/90 font-semibold",
    };

    const sizeStyles = {
      default: "h-9 px-3.5 py-2",
      sm: "h-8 px-2.5 text-xs",
      lg: "h-10 px-5 text-sm font-semibold",
      icon: "h-8 w-8",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
