import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Mark } from "@/components/mark";
import { cn } from "@/lib/utils";

/**
 * Shared sticky site nav (landing + /roi).
 *
 * Adaptive by background: while over the dark hero it is transparent with
 * white text (`.fd-dark` flips the Mark); once the page scrolls — or when the
 * page top is light — it becomes a frosted white bar with ink text. The same
 * pill/link styles render on every page; pages pass their own `links` as a
 * function of the current dark state so each link can restyle itself.
 */
export function SiteNav({
  overDark = false,
  links,
}: {
  /** true when the page top under the nav is a dark band (landing hero). */
  overDark?: boolean;
  links: (dark: boolean) => ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = overDark && !scrolled;
  const solid = scrolled || !overDark;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-200",
        solid
          ? "border-b border-line bg-paper/90 text-ink backdrop-blur-md"
          : "fd-dark bg-transparent text-white",
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 sm:px-8">
        <Link to="/" aria-label="Staylift home">
          <Mark />
        </Link>
        <div className="flex items-center gap-2">{links(dark)}</div>
      </div>
    </nav>
  );
}
