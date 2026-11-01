import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { findQrBooking, getQrHotel } from "@/lib/staylift/server";

/** The desk QR lands here: the guest finds their booking with last name + reference. */
export const Route = createFileRoute("/c/$code")({
  loader: ({ params }) => getQrHotel({ data: { code: params.code } }),
  component: QrCheckin,
});

function QrCheckin() {
  const hotel = Route.useLoaderData();
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [lastName, setLastName] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token } = await findQrBooking({ data: { code, lastName, bookingRef: ref } });
      await navigate({ to: "/stay/$token", params: { token }, search: { src: "qr" }, hash: "checkin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that booking.");
    } finally {
      setBusy(false);
    }
  }

  if (!hotel) {
    return (
      <main className="grid min-h-dvh place-items-center bg-linen px-5 text-center">
        <p className="text-stone">This check-in code isn't recognised. Please ask the front desk.</p>
      </main>
    );
  }

  const input = "mt-1 h-12 w-full rounded-md border border-line bg-cream px-3 text-base outline-none focus:border-pine";
  return (
    <main className="min-h-dvh bg-linen px-5 py-10">
      <div className="mx-auto max-w-sm">
        <p className="font-display text-2xl font-medium tracking-tight">{hotel.name}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-stone">{hotel.city}</p>
        <h1 className="mt-10 font-display text-3xl font-medium tracking-tight">Check in on your phone</h1>
        <p className="mt-2 text-stone">Find your booking — it's on your confirmation email.</p>
        <form onSubmit={(e) => void find(e)} className="mt-6 space-y-4">
          <label className="block text-sm text-stone">
            Last name
            <input required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} />
          </label>
          <label className="block text-sm text-stone">
            Booking reference
            <input required autoCapitalize="characters" value={ref} onChange={(e) => setRef(e.target.value)} className={`${input} font-mono`} />
          </label>
          {error ? <p role="alert" className="rounded-md bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Looking…" : "Find my booking"}
          </Button>
        </form>
        <p className="mt-8 text-center text-xs text-mist">Powered by Staylift</p>
      </div>
    </main>
  );
}
