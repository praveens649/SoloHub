import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export type ConfirmVariant = "default" | "danger" | "warning";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  loadingText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  loadingText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Keyboard accessibility: Escape to cancel
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-500 text-white",
    warning: "bg-amber-600 hover:bg-amber-500 text-white",
    default: "bg-emerald-600 hover:bg-emerald-500 text-white",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={() => {
        if (!loading) onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-120"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] rounded-xl border border-[#27272A] bg-[#0F0F11] p-3.5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-120"
      >
        <div>
          <h3
            id="confirm-dialog-title"
            className="text-xs font-semibold text-[#FAFAFA]"
          >
            {title}
          </h3>
          <div
            id="confirm-dialog-description"
            className="mt-1.5 text-xs text-[#A1A1AA] leading-relaxed break-words"
          >
            {description}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#27272A]/60">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-[#27272A] bg-[#090A0F] px-3 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#FAFAFA] disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer ${variantStyles[variant]}`}
          >
            {loading && <Loader2 size={12} className="animate-spin text-white" />}
            <span>{loading && loadingText ? loadingText : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
