
import * as React from "react";
import { cn } from "@/utils/cn";

type Toast = { id: string; title: string; description?: string; variant?: "default" | "destructive" | "success" };

interface ToastProviderProps { children: React.ReactNode; }

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = (t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [t, ...prev].slice(0, TOAST_LIMIT));
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), TOAST_REMOVE_DELAY);
  };

  React.useEffect(() => {
    const handler = (e: CustomEvent) => toast(e.detail as Omit<Toast, "id">);
    window.addEventListener("utsvav-toast", handler as any);
    return () => window.removeEventListener("utsvav-toast", handler as any);
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-xl border bg-card p-4 shadow-lg text-card-foreground animate-in slide-in-from-right-200">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold">{t.title}</h4>
              {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  return {
    toast: (t: Omit<Toast, "id">) => {
      window.dispatchEvent(new CustomEvent("utsvav-toast", { detail: t } as any));
    },
  };
}


