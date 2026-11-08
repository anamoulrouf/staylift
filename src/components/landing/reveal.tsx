import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Foundation-style scroll reveals for the landing, with no animation deps.
 *
 * SSR/no-JS safety: the hidden state (`reveal-pending`) is added from an
 * effect AFTER hydration, so server HTML and JS-less clients always render
 * fully visible content — nothing can ever blank. Under
 * `prefers-reduced-motion: reduce` (or without IntersectionObserver) the
 * hook is a no-op and everything stays visible.
 */

function motionOff(): boolean {
  return (
    typeof window === "undefined" ||
    !("IntersectionObserver" in window) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Adds `reveal-pending` on mount, swaps to `reveal-in` on first intersect. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || motionOff()) return;
    el.classList.add("reveal-pending");
    let observer: IntersectionObserver | undefined;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        observer = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              el.classList.add("reveal-in");
              el.classList.remove("reveal-pending");
              observer?.disconnect();
            }
          },
          { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
        );
        observer.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);
  return ref;
}

/** Fade/slide-up wrapper for a whole block. `delay` staggers siblings (ms). */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${className ?? ""}`}
      style={delay ? ({ ["--reveal-delay" as string]: `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Masked uppercase display lines (Foundation hero treatment): each line sits
 * in an overflow-hidden clip and slides up, staggered. Lines are decorative —
 * the real heading copy lives in the h1 next to them.
 */
export function MaskLines({
  lines,
  className = "fd-hero-line",
  staggerMs = 90,
}: {
  lines: string[];
  className?: string;
  staggerMs?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden="true">
      {lines.map((line, i) => (
        <span key={line} className="reveal-mask">
          <span
            className={`reveal-line fd-display ${className}`}
            style={{ ["--reveal-delay" as string]: `${i * staggerMs}ms` } as React.CSSProperties}
          >
            {line}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Count-up for the stat cards: animates `value` from 0 to `to` when scrolled
 * into view, holding `prefix`/`suffix` and `decimals` fixed so the final
 * render is byte-identical to the static string. Reduced motion / no-JS:
 * renders the final string immediately.
 */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1100,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
}) {
  const ref = useReveal<HTMLSpanElement>();
  const [n, setN] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || motionOff()) return;
    setN(0);
    let observer: IntersectionObserver | undefined;
    let raf = 0;
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(2, -10 * t);
            setN(to * (t === 1 ? 1 : eased));
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ref, to, durationMs]);

  return (
    <span ref={ref} className="fd-count">
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
}
