import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { listMessages, listOffers, listRecipes, toggleRecipe } from "@/lib/staylift/server";
import { formatDate } from "@/lib/staylift/format";

export const Route = createFileRoute("/hotel/automation")({
  loader: async () => {
    const [recipes, offerData, messages] = await Promise.all([
      listRecipes(),
      listOffers(),
      listMessages(),
    ]);
    return { recipes, offers: offerData.offers, messages };
  },
  component: AutomationPage,
});

function AutomationPage() {
  const { recipes, offers, messages } = Route.useLoaderData();
  const router = useRouter();
  const byId = Object.fromEntries(offers.map((o) => [o.id, o.name]));

  async function toggle(id: string, active: boolean) {
    await toggleRecipe({ data: { id, active } });
    toast.success(active ? "Recipe on." : "Recipe paused.");
    await router.invalidate();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Default recipes</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Small hotels should not build campaigns. They activate templates. Only two recipes send
        a message, and it carries service content (check-in link, arrival details) — billed as a
        utility template, never as marketing. The rest change which offers the stay page leads
        with. Phone messages are capped at 2 per booking.
      </p>
      <ol className="mt-8 space-y-3">
        {recipes.map((recipe, i) => (
          <li
            key={recipe.id}
            className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs tabular-nums text-stone">0{i + 1}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-medium">{recipe.name}</h2>
                  <Badge tone={recipe.sendsMessage ? "amber" : "quiet"}>
                    {recipe.sendsMessage ? "Sends 1 message" : "Page only"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-stone">{recipe.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.offerIds.map((id) => (
                    <Badge key={id} tone="quiet">
                      {byId[id] ?? id}
                    </Badge>
                  ))}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={recipe.active}
                onClick={() => void toggle(recipe.id, !recipe.active)}
                className={`relative h-11 w-16 rounded-full transition-colors duration-150 ${
                  recipe.active ? "bg-pine" : "bg-line"
                }`}
              >
                <span
                  className={`absolute left-0 top-1 size-9 rounded-full bg-paper shadow-[var(--shadow-border)] transition-transform duration-150 ${
                    recipe.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
                <span className="sr-only">{recipe.active ? "On" : "Off"}</span>
              </button>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 font-display text-xl font-medium">Recent sends</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]">
        {messages.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div>
              <p className="text-sm font-medium">{m.subject}</p>
              <p className="text-xs text-stone">
                {m.guestName} · {m.kind.startsWith("booking_") ? `booking email (${m.kind.slice(8)})` : m.channel} ·{" "}
                {formatDate(m.sentAt)} ·{" "}
                {m.costCents > 0 ? `$${(m.costCents / 100).toFixed(3)}` : "no charge"}
              </p>
            </div>
            <Badge tone={m.status === "sent" ? "pine" : "rose"}>{m.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
