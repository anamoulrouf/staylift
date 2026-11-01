import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const tones = {
  quiet: "bg-cream text-stone",
  pine: "bg-moss text-pine",
  amber: "bg-amber-soft text-amber",
  rose: "bg-rose-soft text-rose",
  /** Semantic positive — stays green inside the coral-themed hotel shell. */
  good: "bg-[#e2f1e8] text-[#1c6b46]",
} as const;

export function Badge({
  className,
  tone = "quiet",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
