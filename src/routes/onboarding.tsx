import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { MARKETS, type MarketId } from "@/lib/staylift/markets";
import { createHotel, getHotelContext, joinDemoHotel } from "@/lib/staylift/server";
import { isUnauthorized, toLogin } from "@/lib/staylift/session";

export const Route = createFileRoute("/onboarding")({
  loader: async () => {
    try {
      const ctx = await getHotelContext();
      if (ctx.kind === "ok") throw redirect({ to: "/hotel" });
      return ctx;
    } catch (err) {
      if (isUnauthorized(err)) throw toLogin("/onboarding");
      throw err;
    }
  },
  component: Onboarding,
});

function Onboarding() {
  const ctx = Route.useLoaderData();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [market, setMarket] = useState<MarketId>("US");
  const [rooms, setRooms] = useState(40);
  const [starter, setStarter] = useState(true);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createHotel({ data: { name, city, market, rooms, starter } });
      toast.success(`${name} is ready.`);
      await router.navigate({ to: "/hotel" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the hotel.");
    } finally {
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    try {
      await joinDemoHotel();
      await router.navigate({ to: "/hotel" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the demo.");
    } finally {
      setBusy(false);
    }
  }

  if (ctx.kind !== "onboarding") return null;
  const input = "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";

  return (
    <main className="min-h-dvh bg-linen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Mark />
          <button type="button" className="text-sm text-stone hover:text-ink" onClick={() => void signOut("/login")}>
            Sign out
          </button>
        </div>
        <h1 className="mt-10 font-display text-4xl font-medium tracking-tight">
          Welcome{ctx.name ? `, ${ctx.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-stone">Signed in as {ctx.email}. You're not on a hotel's team yet.</p>

        {ctx.invitations.length > 0 ? (
          <section className="mt-6 rounded-xl bg-amber-soft p-5 text-sm text-amber">
            {ctx.invitations.map((i) => (
              <p key={i.propertyName}>
                {i.propertyName} invited you as {i.role.replace("_", " ")}. Open the link in your invitation email to join.
              </p>
            ))}
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_minmax(0,240px)]">
          <form onSubmit={(e) => void create(e)} className="rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
            <h2 className="font-display text-xl font-medium">Set up your hotel</h2>
            <p className="mt-1 text-sm text-stone">You'll be its owner. Invite your team after.</p>
            <label className="mt-5 block text-sm text-stone">
              Hotel name
              <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </label>
            <div className="mt-3 grid grid-cols-[1fr_110px] gap-3">
              <label className="block text-sm text-stone">
                City
                <input required minLength={2} value={city} onChange={(e) => setCity(e.target.value)} className={input} />
              </label>
              <label className="block text-sm text-stone">
                Rooms
                <input
                  required
                  type="number"
                  min={1}
                  max={5000}
                  value={rooms}
                  onChange={(e) => setRooms(Math.max(1, Number(e.target.value) || 1))}
                  className={`${input} tabular-nums`}
                />
              </label>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm text-stone">Launch market</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(MARKETS).map((m) => (
                  <label
                    key={m.id}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${market === m.id ? "border-pine bg-moss text-pine" : "border-line bg-cream"}`}
                  >
                    <input type="radio" name="market" value={m.id} checked={market === m.id} onChange={() => setMarket(m.id)} className="sr-only" />
                    {m.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone">{MARKETS[market].law}</p>
            </fieldset>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input type="checkbox" checked={starter} onChange={(e) => setStarter(e.target.checked)} className="mt-0.5 size-4 accent-pine" />
              <span>
                Start with a starter catalogue
                <span className="block text-stone">Two room types and six common extras you can edit.</span>
              </span>
            </label>
            <Button type="submit" className="mt-5 w-full" disabled={busy}>
              {busy ? "Creating…" : "Create hotel"}
            </Button>
          </form>

          {ctx.demoAvailable ? (
            <aside className="rounded-xl bg-pine p-5 text-pine-fg">
              <h2 className="font-display text-xl font-medium">Just looking?</h2>
              <p className="mt-2 text-sm text-pine-fg/80">
                Open The Marlowe, a demo hotel with a 60-day pilot, guest profiles and the capture gate.
              </p>
              <Button variant="secondary" className="mt-4 w-full" onClick={() => void demo()} disabled={busy}>
                Explore the demo
              </Button>
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
