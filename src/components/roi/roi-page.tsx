import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { RoiCalculator } from "@/components/roi/roi-calculator";
import type { CalculatorState } from "@/lib/staylift/roi-url";

/**
 * The /roi page body. Framework-free (no router imports) so the same page can
 * be rendered by the app route and by a standalone build.
 */
export function RoiPage({
  initial,
  onChange,
  links,
  context,
  shareable = true,
}: {
  initial: CalculatorState;
  shareable?: boolean;
  onChange?: (state: CalculatorState) => void;
  /** nav links, restyled by the shared sticky nav's current state */
  links?: (dark: boolean) => ReactNode;
  context?: ReactNode;
}) {
  return (
    <div className="landing-scope min-h-dvh bg-linen text-ink">
      <SiteNav links={links ?? (() => null)} />
      <main className="w-full px-4 pb-28 pt-20 sm:px-6 lg:px-12 lg:pb-20 xl:px-16">
        <section className="pb-10 pt-4 sm:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            ROI calculator
          </p>
          <h1 className="fd-display fd-mid-line mt-4 max-w-4xl">
            Worth to your hotel, after fees.
          </h1>
          <p className="mt-5 max-w-2xl text-stone sm:text-lg">
            Net of what you would have sold at the desk anyway, net of card fees, net of our
            price. Change any number{shareable ? "; the link updates so you can send this exact model to your GM or owner" : ""}.
          </p>
        </section>
        <RoiCalculator initial={initial} onChange={onChange} context={context} shareable={shareable} />
        <p className="mt-10 text-xs text-stone">
          Planning model, not a promise. In a pilot, 15–20% of bookings form a holdout that gets
          check-in but no offers; the difference between the two groups replaces the
          incrementality assumption with a measured number.
        </p>
      </main>
    </div>
  );
}
