
import * as React from "react";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: DialogProps) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:p-6 sm:items-center">
          <div className="relative w-full max-w-2xl rounded-xl bg-card text-card-foreground shadow-lg border border-border">
            <div className="flex flex-col gap-4 p-6">
              {title && (
                <div className="flex items-start gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                </div>
              )}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <div className="mt-4 flex items-end gap-3">{children}</div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

