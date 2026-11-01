import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOffers, toggleOffer } from "@/lib/staylift/server";
import { money, priceHint } from "@/lib/staylift/format";

export const Route = createFileRoute("/hotel/offers")({
  loader: () => listOffers(),
  component: OffersPage,
});

function OffersPage() {
  const { offers, canEdit } = Route.useLoaderData();
  const router = useRouter();

  async function toggle(id: string, active: boolean) {
    await toggleOffer({ data: { id, active } });
    toast.success(active ? "Offer live." : "Offer paused.");
    await router.invalidate();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Hotel inventory</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Start with what the house already sells. Partner-owned experiences can share this
        offer model later — the marketplace UI is not this product.
      </p>
      <ul className="mt-8 space-y-3">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-col gap-4 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:flex-row sm:items-start"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-medium">{offer.name}</h2>
                <Badge tone={offer.active ? "pine" : "quiet"}>
                  {offer.active ? "Live" : "Paused"}
                </Badge>
                <Badge tone="quiet">
                  {offer.autoApprove
                    ? "Instant"
                    : offer.category === "upgrade"
                      ? "Request · confirmed 72h before arrival"
                      : "Needs approval"}
                </Badge>
                <Badge tone="quiet">{offer.ownerType === "HOTEL" ? "Hotel-owned" : "Partner"}</Badge>
              </div>
              <p className="mt-2 text-sm text-stone">{offer.description}</p>
              <p className="mt-3 text-sm">
                <span className="tabular-nums font-medium">
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
            </div>
            {canEdit ? (
              <Button
                variant={offer.active ? "outline" : "primary"}
                size="sm"
                onClick={() => void toggle(offer.id, !offer.active)}
              >
                {offer.active ? "Pause" : "Activate"}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
