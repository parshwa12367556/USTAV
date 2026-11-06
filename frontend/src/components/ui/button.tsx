
import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "gold";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button";
    const variants = {
      primary: "bg-burgundy text-white hover:bg-deep-burgundy",
      secondary: "bg-muted text-foreground hover:bg-secondary",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      gold: "bg-gold text-gold-foreground hover:bg-gold/90",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          "border-transparent shadow-sm",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled}
        {...(asChild ? {} : { type: "button" })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button };

