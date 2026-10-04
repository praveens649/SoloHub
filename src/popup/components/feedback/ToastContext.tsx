import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      // Default durations matching specifications:
      // success/info: 3000ms
      // warning/error: 4500ms
      const defaultDuration =
        type === "warning" || type === "error" ? 4500 : 3000;
      const actualDuration = duration ?? defaultDuration;

      setToasts((prev) => {
        // Limit to max 3 concurrent toasts to prevent clutter in 380px popup
        const updated = [...prev, { id, type, message, duration: actualDuration }];
        if (updated.length > 3) {
          const removed = updated.shift();
          if (removed) {
            const t = timeoutsRef.current.get(removed.id);
            if (t) window.clearTimeout(t);
            timeoutsRef.current.delete(removed.id);
          }
        }
        return updated;
      });

      const timeout = window.setTimeout(() => {
        removeToast(id);
      }, actualDuration);

      timeoutsRef.current.set(id, timeout);
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, duration?: number) => addToast("success", message, duration),
    error: (message: string, duration?: number) => addToast("error", message, duration),
    warning: (message: string, duration?: number) => addToast("warning", message, duration),
    info: (message: string, duration?: number) => addToast("info", message, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast Overlay Container positioned directly above the BottomNav */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-16 z-50 flex flex-col items-center gap-1.5 px-3"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const icons = {
    success: <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />,
    info: <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />,
  };

  const borderStyles = {
    success: "border-emerald-900/60",
    error: "border-red-900/60",
    warning: "border-amber-900/60",
    info: "border-blue-900/60",
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-[320px] items-center justify-between gap-2 rounded-lg border ${borderStyles[item.type]} bg-[#0F0F11] px-3 py-2 text-xs text-[#FAFAFA] shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-150`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icons[item.type]}
        <p className="truncate text-xs font-medium leading-snug">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-0.5 text-[#71717A] hover:bg-[#18181B] hover:text-[#FAFAFA] transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a FeedbackProvider");
  }
  return context.toast;
}
