
import * as React from "react";
import { cn } from "@/utils/cn";

export function TabsGroup({ defaultValue, children }: { defaultValue?: string; children: React.ReactNode }) {
  const [value, setValue] = React.useState(defaultValue || "");
  return (
    <div className="flex flex-col">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const type = (child as any).type?.displayName || "";
        if (type === "TabsList") {
          return React.cloneElement(child as any, { value, onValueChange: setValue });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, value, onValueChange, className }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-foreground", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child as any, { value, onValueChange }) : child
      )}
    </div>
  );
}

export function TabsTrigger({ children, value, onValueChange, className, ...props }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void; className?: string; [key: string]: any }) {
  const active = value === (props as any).value;
  return (
    <button onClick={() => onValueChange((props as any).value)} className={cn(
      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
      active ? "bg-gold text-gold-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      className
    )} {...props}>
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  return <div className={cn("mt-4", className)}>{value ? children : null}</div>;
}

