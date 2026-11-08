import type { ReactNode } from "react";
import { Mark } from "@/components/mark";
import { RoiCalculator } from "@/components/roi/roi-calculator";
import type { CalculatorState } from "@/lib/staylift/roi-url";

/**
 * The /roi page body. Framework-free (no router imports) so the same page can
 * be rendered by the app route and by a standalone build.
 */
export function RoiPage({
  initial,
  onChange,
  nav,
  context,
  shareable = true,
}: {
  initial: CalculatorState;
  shareable?: boolean;
  onChange?: (state: CalculatorState) => void;
  nav?: ReactNode;
  context?: ReactNode;
}) {
  return (
    <div className="landing-scope min-h-dvh bg-linen text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Mark />
        {nav}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-20">
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
