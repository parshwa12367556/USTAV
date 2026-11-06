
import * as React from "react";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  label?: string;
}

export function Select({ className, label, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground mb-1">{label}</label>}
      <select
        className={cn(
          "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {props.children}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground pointer-events-none" />
      </select>
    </div>
  );
}

