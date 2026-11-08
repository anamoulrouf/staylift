import { cn } from "@/lib/utils";

/**
 * Staylift mark: three sharp ascending blocks — the measured lift, drawn as
 * pure geometry. currentColor throughout so it reads on any surface (white on
 * dark bands via .fd-dark, ink elsewhere); corners are square by design.
 */
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
        <rect x="3" y="13.5" width="5.5" height="7.5" fill="currentColor" opacity="0.4" />
        <rect x="9.25" y="8" width="5.5" height="13" fill="currentColor" opacity="0.7" />
        <rect x="15.5" y="2.5" width="5.5" height="18.5" fill="currentColor" />
      </svg>
      {wordmark ? (
        <span className="font-display text-xl font-semibold tracking-[-0.02em]">
          Staylift
        </span>
      ) : (
        <span className="sr-only">Staylift</span>
      )}
    </span>
  );
}
