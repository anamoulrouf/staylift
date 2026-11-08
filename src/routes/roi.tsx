import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { RoiPage } from "@/components/roi/roi-page";
import { decodeState, encodeState, type CalculatorState } from "@/lib/staylift/roi-url";

type RoiSearch = Record<string, string | number | undefined>;

export const Route = createFileRoute("/roi")({
  // Every key is optional and validated by decodeState (clamped, defaults on junk).
  validateSearch: (search: Record<string, unknown>): RoiSearch => {
    const out: RoiSearch = {};
    for (const [k, v] of Object.entries(search)) {
      if (typeof v === "string" || typeof v === "number") out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "ROI calculator · Staylift" },
      {
        name: "description",
        content:
          "What Staylift is worth to an independent hotel after incrementality, card fees and our price.",
      },
    ],
  }),
  component: RoiRoute,
});

function RoiRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [initial] = useState(() => decodeState(search));
  const fromPilot = useRef(search.from === "pilot").current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onChange = useMemo(
    () => (state: CalculatorState) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void navigate({
          to: "/roi",
          search: encodeState(state),
          replace: true,
          resetScroll: false,
        });
      }, 250);
    },
    [navigate],
  );

  return (
    <RoiPage
      initial={initial}
      onChange={onChange}
      links={(dark) => (
        <nav className="flex items-center gap-2">
          <Link
            to="/hotel/roi"
            className={dark ? "text-sm text-white/80 hover:text-white" : "text-sm text-stone hover:text-ink"}
          >
            Measured ROI
          </Link>
          <Link to="/" className={dark ? "fd-pill fd-pill--white" : "fd-pill fd-pill--concrete"}>
            Product
            <span className="fd-pill-arrow">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
        </nav>
      )}
      context={
        fromPilot ? (
          <p className="rounded-lg bg-moss px-4 py-3 text-sm text-pine">
            Seeded from The Marlowe’s measured pilot: reachable, open, buy, spend and
            incrementality are the holdout-tested numbers, projected over a full year. The
            scenario chips replace them with planning assumptions.
          </p>
        ) : undefined
      }
    />
  );
}
