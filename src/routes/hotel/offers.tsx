import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  BedDouble,
  Car,
  Clock3,
  Coffee,
  LayoutGrid,
  Plane,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOffers, toggleOffer } from "@/lib/staylift/server";
import { money, priceHint } from "@/lib/staylift/format";
import type { OfferCategory } from "@/lib/staylift/types";

export const Route = createFileRoute("/hotel/offers")({
  loader: () => listOffers(),
  component: OffersPage,
});

const CATEGORY_ICON: Record<string, typeof LayoutGrid> = {
  upgrade: BedDouble,
  breakfast: Coffee,
  late_checkout: Clock3,
  early_checkin: Sunrise,
  parking: Car,
  spa: Sparkles,
  transfer: Plane,
};

function OffersPage() {
  const { offers, canEdit } = Route.useLoaderData();
  const router = useRouter();

  async function toggle(id: string, active: boolean) {
    await toggleOffer({ data: { id, active } });
    toast.success(active ? "Offer live." : "Offer paused.");
    await router.invalidate();
  }

  return (
    <div className="mx-auto max-w-5xl stagger-in">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Service library</h1>
      <p className="mt-2 max-w-2xl text-stone">
        The library of fulfillable services guests see on their stay page. Start with what the
        house already sells — partner-owned experiences can share this model later.
      </p>
      <ul className="mt-8 grid gap-3 lg:grid-cols-2">
        {offers.map((offer) => {
          const Icon = CATEGORY_ICON[offer.category] ?? LayoutGrid;
          return (
            <li
              key={offer.id}
              className="flex gap-4 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-moss text-pine">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold leading-tight">{offer.name}</h2>
                  <Badge tone={offer.active ? "good" : "quiet"}>{offer.active ? "Live" : "Paused"}</Badge>
                  <Badge tone="quiet">
                    {offer.autoApprove
                      ? "Instant"
                      : offer.category === "upgrade"
                        ? "Request · confirmed 72h before arrival"
                        : "Needs approval"}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-stone">{offer.description}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">
                      {money(offer.priceCents)}
                      {priceHint(offer.priceUnit)}
                    </span>
                    <span className="text-stone">
                      {offer.inventory === null
                        ? " · Unlimited"
                        : ` · ${offer.inventory} left`}
                      {offer.cutoffHours ? ` · Cutoff ${offer.cutoffHours}h` : ""}
                    </span>
                  </p>
                  {canEdit ? (
                    <Button
                      variant={offer.active ? "outline" : "primary"}
                      size="sm"
                      onClick={() => void toggle(offer.id, !offer.active)}
                    >
                      {offer.active ? "Pause" : "Activate"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
