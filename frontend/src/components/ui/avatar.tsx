
import * as React from "react";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = "md", ...props }, ref) => {
    const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
    return (
      <div ref={ref} className={cn("relative flex shrink-0 items-center justify-center rounded-full overflow-hidden", sizes[size], className)} {...props}>
        {src ? <img src={src} alt={name || ""} className="aspect-square h-full w-full object-cover" /> : null}
        {!src && name && <span className="text-foreground">{initials(name)}</span>}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

