import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState<boolean>(
      checked !== undefined ? !!checked : !!defaultChecked
    );

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (checked === undefined) {
        setIsChecked(newChecked);
      }
      onChange?.(e);
      onCheckedChange?.(newChecked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border border-border bg-secondary transition-colors duration-150",
            isChecked
              ? "bg-primary border-primary text-primary-foreground"
              : "hover:border-white/20",
            className
          )}
        >
          {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
