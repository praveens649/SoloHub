import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-[#FAFAFA] ${className}`}
    />
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-3 space-y-2 animate-pulse"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-1/3 rounded bg-[#27272A]" />
            <div className="h-2.5 w-12 rounded bg-[#27272A]" />
          </div>
          <div className="h-2.5 w-3/4 rounded bg-[#27272A]/70" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-2 w-16 rounded bg-[#27272A]/50" />
            <div className="h-2 w-12 rounded bg-[#27272A]/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#27272A] bg-[#0F0F11] p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-12 rounded bg-[#27272A]" />
            <div className="h-3 w-3 rounded-full bg-[#27272A]" />
          </div>
          <div className="h-5 w-8 rounded bg-[#27272A]" />
        </div>
      ))}
    </div>
  );
}

export function CollaboratorSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-[#27272A] bg-[#0F0F11] p-2 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[#27272A]" />
            <div className="space-y-1">
              <div className="h-2.5 w-20 rounded bg-[#27272A]" />
              <div className="h-2 w-12 rounded bg-[#27272A]/60" />
            </div>
          </div>
          <div className="h-6 w-14 rounded bg-[#27272A]" />
        </div>
      ))}
    </div>
  );
}
