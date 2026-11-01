import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Download, Eye, GitMerge, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateLong, money } from "@/lib/staylift/format";
import {
  addGuestOccasion,
  eraseGuest,
  exportGuest,
  getGuest,
  mergeGuests,
  revealGuestContact,
  withdrawGuestConsent,
} from "@/lib/staylift/server";

export const Route = createFileRoute("/hotel/guests/$profileId")({
  loader: ({ params }) => getGuest({ data: { profileId: params.profileId } }),
  component: GuestPage,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PURPOSE = {
  marketing_email: "Offers by email",
  marketing_whatsapp: "Offers on WhatsApp",
  profile_memory: "Remember dates & preferences",
} as const;
const SOURCE: Record<string, string> = {
  online_checkin: "online check-in",
  desk_tablet: "desk tablet",
  qr: "QR check-in",
  preference_centre: "guest's preference page",
  staff: "staff",
  erasure: "erasure",
};

function GuestPage() {
  const g = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState<{ email: string | null; phone: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [occ, setOcc] = useState({ kind: "birthday" as "birthday" | "anniversary" | "achievement" | "other", month: 0, day: 0 });

  async function act<T>(fn: () => Promise<T>, ok?: string) {
    setBusy(true);
    try {
      const r = await fn();
      if (ok) toast.success(ok);
      return r;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not do that.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!reason || reason.trim().length < 3) return;
    const r = await act(() => revealGuestContact({ data: { profileId: g.id, reason } }));
    if (r) {
      setRevealed(r);
      setReason(null);
    }
  }

  async function download() {
    const data = await act(() => exportGuest({ data: { profileId: g.id } }), "Export ready. Logged.");
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `guest-${g.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const card = "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]";

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/hotel/guests" className="text-sm text-stone hover:text-ink">
        ← Guests
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight">{g.name}</h1>
          <p className="mt-1 text-stone">
            {g.stays.length} stay{g.stays.length === 1 ? "" : "s"} · profile since {formatDate(g.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {g.caps.dataRequests ? (
            <Button variant="secondary" onClick={() => void download()} disabled={busy}>
              <Download className="size-4" /> Export data
            </Button>
          ) : null}
          {g.caps.dataRequests ? (
            <Button variant="outline" onClick={() => setConfirmErase(true)} disabled={busy}>
              <Trash2 className="size-4" /> Erase
            </Button>
          ) : null}
        </div>
      </div>

      {confirmErase ? (
        <div className="mt-4 rounded-xl border border-rose-soft bg-paper p-5">
          <p className="font-medium text-rose">Erase {g.name}?</p>
          <p className="mt-1 text-sm text-stone">
            Deletes contacts, dates, companions and holidays; takes the name off {g.stays.length} stay(s); keeps the consent
            history and a hashed suppression marker. Can't be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() =>
                void act(() => eraseGuest({ data: { profileId: g.id } }), "Guest erased.").then((r) => {
                  if (r) void navigate({ to: "/hotel/guests" });
                })
              }
            >
              Erase permanently
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmErase(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-medium">Contact</h2>
              {g.caps.reveal && !revealed && reason === null ? (
                <Button size="sm" variant="ghost" onClick={() => setReason("")} disabled={busy}>
                  <Eye className="size-4" /> Reveal
                </Button>
              ) : null}
            </div>
            {reason !== null ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void reveal();
                }}
              >
                <input
                  autoFocus
                  aria-label="Reason"
                  placeholder="Why? e.g. guest asked for a receipt copy"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine"
                />
                <Button size="sm" type="submit" disabled={busy || reason.trim().length < 3}>
                  Reveal
                </Button>
                <Button size="sm" variant="ghost" type="button" onClick={() => setReason(null)}>
                  Cancel
                </Button>
              </form>
            ) : null}
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-stone">Email</dt>
                <dd className="font-mono">{revealed ? (revealed.email ?? "—") : (g.email ?? "—")}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-stone">WhatsApp</dt>
                <dd className="font-mono">{revealed ? (revealed.phone ?? "—") : (g.phone ?? "—")}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-stone">Verified by code at check-in. Stored encrypted; reveals are logged.</p>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl font-medium">Consent</h2>
            <ul className="mt-3 space-y-2">
              {(Object.keys(PURPOSE) as (keyof typeof PURPOSE)[]).map((p) => (
                <li key={p} className="flex items-center justify-between gap-3 text-sm">
                  <span>{PURPOSE[p]}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={g.consents[p] ? "pine" : "quiet"}>{g.consents[p] ? "Yes" : "No"}</Badge>
                    {g.consents[p] && g.caps.dataRequests ? (
                      <button
                        type="button"
                        className="text-xs text-stone underline hover:text-rose"
                        disabled={busy}
                        onClick={() =>
                          void act(() => withdrawGuestConsent({ data: { profileId: g.id, purpose: p } }), "Withdrawal recorded.").then(() => router.invalidate())
                        }
                      >
                        Record withdrawal
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone">Only the guest can opt in. Staff can record a withdrawal the guest asked for.</p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-stone">History ({g.ledger.length})</summary>
              <ol className="mt-3 space-y-2 border-l border-line pl-4 text-sm">
                {g.ledger.map((l) => (
                  <li key={l.id}>
                    <p>
                      <span className={l.granted ? "text-pine" : "text-rose"}>{l.granted ? "Granted" : "Withdrawn"}</span> ·{" "}
                      {PURPOSE[l.purpose as keyof typeof PURPOSE] ?? l.purpose} · via {SOURCE[l.source] ?? l.source}
                    </p>
                    <p className="text-xs text-stone">
                      {formatDateLong(l.at)} — “{l.wording}”
                    </p>
                  </li>
                ))}
              </ol>
            </details>
          </section>

          <section className={card}>
            <h2 className="font-display text-xl font-medium">Stays</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {g.stays.map((s) => (
                <li key={s.reservationId} className="flex justify-between py-2">
                  <span>
                    {formatDate(s.arrival)} – {formatDate(s.departure)} · {s.roomType}
                  </span>
                  <span className="tabular-nums text-stone">{s.spentCents ? money(s.spentCents) : "—"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl font-medium">Occasions</h2>
            {!g.consents.profile_memory ? (
              <p className="mt-2 text-sm text-stone">Not kept: the guest hasn't agreed to have dates remembered.</p>
            ) : (
              <>
                {g.upcoming.length === 0 ? <p className="mt-2 text-sm text-stone">None shared yet.</p> : null}
                <ul className="mt-3 space-y-2 text-sm">
                  {g.upcoming.map((o) => (
                    <li key={o.id} className="flex justify-between gap-2">
                      <span>
                        {o.companion ? `${o.companion}'s ` : ""}
                        {o.label ?? o.kind}
                      </span>
                      <span className="tabular-nums text-stone">
                        {MONTHS[o.month - 1]}
                        {o.day ? ` ${o.day}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                {g.caps.dataRequests ? (
                  <div className="mt-4 grid grid-cols-[1fr_76px_64px] gap-1.5">
                    <select aria-label="Occasion" value={occ.kind} onChange={(e) => setOcc({ ...occ, kind: e.target.value as typeof occ.kind })} className="h-9 rounded-md border border-line bg-cream px-2 text-sm">
                      <option value="birthday">Birthday</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="achievement">Achievement</option>
                      <option value="other">Other</option>
                    </select>
                    <select aria-label="Month" value={occ.month} onChange={(e) => setOcc({ ...occ, month: Number(e.target.value) })} className="h-9 rounded-md border border-line bg-cream px-1 text-sm">
                      <option value={0}>Mon</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select aria-label="Day" value={occ.day} onChange={(e) => setOcc({ ...occ, day: Number(e.target.value) })} className="h-9 rounded-md border border-line bg-cream px-1 text-sm">
                      <option value={0}>Day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="col-span-3"
                      disabled={busy || !occ.month}
                      onClick={() =>
                        void act(
                          () => addGuestOccasion({ data: { profileId: g.id, kind: occ.kind, label: null, month: occ.month, day: occ.day || null, companionId: null } }),
                          "Added. Told at the desk, recorded as staff-entered.",
                        ).then(() => router.invalidate())
                      }
                    >
                      Add an occasion the guest mentioned
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          {g.consents.profile_memory ? (
            <section className={card}>
              <h2 className="font-display text-xl font-medium">Travels with</h2>
              {g.companions.length === 0 ? <p className="mt-2 text-sm text-stone">No one added.</p> : null}
              <ul className="mt-2 space-y-1 text-sm">
                {g.companions.map((c) => (
                  <li key={c.id}>
                    {c.firstName ?? `Child (${c.ageBand})`} <span className="text-stone">· {c.relation}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone">Companions are never contacted.</p>
              {g.holidays.length > 0 ? (
                <>
                  <h3 className="mt-4 text-sm font-medium">Celebrates</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.holidays.map((h) => (
                      <Badge key={h}>{h.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {g.duplicates.length > 0 && g.caps.merge ? (
            <section className={card}>
              <h2 className="flex items-center gap-2 font-display text-xl font-medium">
                <GitMerge className="size-5" /> Possible duplicates
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {g.duplicates.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <Link to="/hotel/guests/$profileId" params={{ profileId: d.id }} className="hover:text-pine">
                      {d.name} · {d.stays} stay{d.stays === 1 ? "" : "s"}
                    </Link>
                    {mergeTarget === d.id ? (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          void act(() => mergeGuests({ data: { keepId: g.id, mergeId: d.id } }), "Merged.").then(() => {
                            setMergeTarget(null);
                            return router.invalidate();
                          })
                        }
                      >
                        Confirm merge
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setMergeTarget(d.id)}>
                        Merge here
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone">Profiles are never merged automatically. Check it's the same person first.</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
