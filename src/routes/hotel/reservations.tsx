import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactPill, StatusPill } from "@/components/status-pill";
import {
  eraseReservation,
  ingestReservation,
  listReservations,
  listRoomTypes,
  previewEmailParse,
  sendStayLink,
} from "@/lib/staylift/server";
import { formatDate, money, SAMPLE_CONFIRMATION, stayRange } from "@/lib/staylift/format";

export const Route = createFileRoute("/hotel/reservations")({
  validateSearch: (search: Record<string, unknown>): { history?: boolean } =>
    search.history === true || search.history === "true" || search.history === 1
      ? { history: true }
      : {},
  loaderDeps: ({ search }) => ({ history: Boolean(search.history) }),
  loader: async ({ deps }) => {
    const [book, rooms] = await Promise.all([
      listReservations({ data: { history: deps.history } }),
      listRoomTypes(),
    ]);
    return { ...book, rooms, history: deps.history };
  },
  component: ReservationsPage,
});

function ReservationsPage() {
  const { reservations, ordersByRes, rooms, history, totalCount, currentCount, canErase } =
    Route.useLoaderData();
  const [eraseId, setEraseId] = useState<string | null>(null);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function parseAndIngest() {
    setBusy(true);
    try {
      const parsed = await previewEmailParse({ data: { text: email } });
      if ("error" in parsed) {
        toast.error(parsed.error);
        return;
      }
      const created = await ingestReservation({
        data: {
          bookingRef: parsed.bookingRef,
          source: parsed.source,
          guestName: parsed.guestName,
          arrival: parsed.arrival,
          departure: parsed.departure,
          roomTypeId: parsed.roomTypeId,
          guests: parsed.guests,
          emailKind: parsed.emailKind,
          phoneKind: parsed.phoneKind,
          origin: window.location.origin,
        },
      });
      toast.success(
        created.holdout
          ? `Ingested ${parsed.guestName} — holdout: booking email sent without offers.`
          : created.emailed
            ? `Ingested ${parsed.guestName}. Personalised booking email sent (${created.emailed === "light" ? "OTA relay version" : "full offers"}).`
            : `Ingested ${parsed.guestName}. No email on file — send the WhatsApp link.`,
      );
      setEmail("");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ingest failed.");
    } finally {
      setBusy(false);
    }
  }

  async function erase(id: string) {
    try {
      await eraseReservation({ data: { reservationId: id } });
      toast.success("Guest data erased from this booking. Logged.");
      setEraseId(null);
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not erase.");
    }
  }

  async function ping(id: string, channel: "whatsapp" | "email") {
    try {
      const res = await sendStayLink({ data: { reservationId: id, channel } });
      toast.success(
        channel === "email"
          ? "Check-in link sent by email."
          : `Check-in link sent by WhatsApp (${(res.costCents / 100).toFixed(3)} USD).`,
      );
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Reservations</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Booking is the unit. CSV and forwarded confirmation emails are enough to go live —
        channel manager and PMS come later. New bookings are randomly assigned to the holdout.
      </p>

      <section className="mt-8 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-lg font-medium">Ingest a confirmation</h2>
        <p className="mt-1 text-sm text-stone">
          Paste a Booking.com, Expedia, or Agoda email. Masked OTA inboxes and placeholder
          phones are detected, not trusted. Duplicate references are rejected.
        </p>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          rows={8}
          className="mt-4 w-full rounded-md border border-line bg-cream px-3 py-2 text-sm leading-relaxed outline-none focus:border-pine"
          placeholder="Paste a reservation confirmation…"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void parseAndIngest()} disabled={busy || email.length < 20}>
            Parse & ingest
          </Button>
          <Button variant="ghost" onClick={() => setEmail(SAMPLE_CONFIRMATION)}>
            Load sample email
          </Button>
        </div>
        <p className="mt-3 text-xs text-stone">
          Room types on file: {rooms.map((r) => r.name).join(" · ")}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">
          {history
            ? `All ${totalCount} bookings, newest arrival first`
            : `Current book: ${currentCount} bookings (departing within 7 days or newer)`}
        </p>
        <Link to="/hotel/reservations" search={history ? {} : { history: true }}>
          <Button variant="outline" size="sm">
            {history ? "Current book only" : `Show pilot history (${totalCount})`}
          </Button>
        </Link>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-stone">
            <tr>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Stay</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Ancillaries</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => {
              const totals = ordersByRes[res.id];
              const phone = res.phoneKind === "valid";
              return (
                <tr key={res.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {res.profileId ? (
                      <Link to="/hotel/guests/$profileId" params={{ profileId: res.profileId }} className="font-medium hover:text-pine">
                        {res.guestName}
                      </Link>
                    ) : (
                      <p className={res.anonymized ? "font-medium text-stone" : "font-medium"}>{res.guestName}</p>
                    )}
                    <p className="text-xs text-stone">
                      {res.bookingRef}
                      {res.profileId ? " · profile" : ""}
                      {res.anonymized ? " · purged" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{stayRange(res.arrival, res.departure)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={res.status} />
                      {res.holdout ? <Badge tone="quiet">Holdout</Badge> : null}
                      <span className="text-xs text-stone">{res.roomTypeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone">
                    {res.source}
                    {res.contactPurgeOn ? (
                      <p className="mt-1 text-xs">Purge contact by {formatDate(res.contactPurgeOn)}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <ContactPill reachable={res.reachable} channels={res.eligibleChannels} />
                    {res.phoneKind === "placeholder" ? (
                      <p className="mt-1 text-xs text-rose">Placeholder phone rejected</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {totals?.cents ? money(totals.cents) : "—"}
                    {totals?.pendingCents ? (
                      <p className="text-xs text-amber">+{money(totals.pendingCents)} pending</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {canErase && !res.profileId && !res.anonymized ? (
                        eraseId === res.id ? (
                          <Button size="sm" variant="danger" onClick={() => void erase(res.id)}>
                            Confirm erase
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setEraseId(res.id)} title="Erase this guest's personal data from the booking">
                            Erase
                          </Button>
                        )
                      ) : null}
                      <Link to="/hotel/email/$reservationId" params={{ reservationId: res.id }}>
                        <Button size="sm" variant="ghost">
                          Email
                        </Button>
                      </Link>
                      <Link to="/stay/$token" params={{ token: res.token }}>
                        <Button size="sm" variant="ghost">
                          Guest page
                        </Button>
                      </Link>
                      {res.status !== "departed" && res.reachable ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void ping(res.id, phone ? "whatsapp" : "email")}
                        >
                          {phone ? "WhatsApp link" : "Email link"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone">
        Messages carry service content only (check-in link, arrival details) — offers live on
        the stay page. Max 2 phone messages per booking. Marketing needs an explicit opt-in.
      </p>
    </div>
  );
}
