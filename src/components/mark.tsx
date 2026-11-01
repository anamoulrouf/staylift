import { cn } from "@/lib/utils";

export function Mark({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <svg
        viewBox="0 0 24 24"
        className="size-6 shrink-0"
        aria-hidden="true"
      >
        <rect x="3" y="14" width="5" height="7" rx="1.2" fill="currentColor" opacity="0.45" />
        <rect x="9.5" y="8" width="5" height="13" rx="1.2" fill="currentColor" opacity="0.7" />
        <rect x="16" y="3" width="5" height="18" rx="1.2" fill="currentColor" />
      </svg>
      {wordmark ? (
        <span className="font-display text-xl font-medium tracking-tight">Staylift</span>
      ) : (
        <span className="sr-only">Staylift</span>
      )}
    </span>
  );
}
