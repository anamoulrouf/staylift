import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateLong } from "@/lib/staylift/format";
import { MARKETS, OTA_RETENTION, type MarketId } from "@/lib/staylift/markets";
import { getSettings, runRetentionNow, saveSettings } from "@/lib/staylift/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hotel/settings")({
  loader: () => getSettings({ data: {} }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = Route.useLoaderData();
  const router = useRouter();
  const p = s.property;
  const [form, setForm] = useState({
    name: p.name,
    city: p.city,
    market: p.settings.market as MarketId,
    timezone: p.settings.timezone,
    rooms: p.rooms,
    senderEmail: p.settings.senderEmail ?? "",
    serviceRetentionDays: p.settings.serviceRetentionDays,
    captureLaunchedOn: p.settings.captureLaunchedOn ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSettings({
        data: {
          ...form,
          senderEmail: form.senderEmail.trim() || null,
          captureLaunchedOn: form.captureLaunchedOn || null,
        },
      });
      toast.success("Saved.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function purge() {
    setBusy(true);
    try {
      const r = await runRetentionNow();
      toast.success(
        `Purge done: ${r.otaStaysAnonymized} OTA stays anonymised, ${r.serviceDataCleared} stay records cleared, ${r.dormantProfilesErased} dormant profiles erased.`,
      );
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not run.");
    } finally {
      setBusy(false);
    }
  }

  const market = MARKETS[form.market];
  const input = "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";
  const card = "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6";
  const sec = s.security;
  const checks: { ok: boolean; label: string; detail: string }[] = [
    {
      ok: sec.rowLevelSecurity,
      label: "Hotel data separation",
      detail: sec.rowLevelSecurity
        ? "Row-level security is on: every query is limited to this hotel inside the database."
        : "Row-level security is off on some tables. Re-run migrations.",
    },
    {
      ok: sec.encryption.mode === "configured",
      label: "Guest contact encryption",
      detail:
        sec.encryption.mode === "configured"
          ? `AES-256-GCM with your key (id ${sec.encryption.keyId})${sec.encryption.rotating ? ", rotation in progress" : ""}.`
          : sec.encryption.mode === "dev"
            ? "Using the built-in development key. Set STAYLIFT_DATA_KEY before real guests check in."
            : "No key: guest contacts can't be stored. Set STAYLIFT_DATA_KEY.",
    },
    {
      ok: sec.email.mode === "postmark" && Boolean(sec.email.from),
      label: "Email delivery",
      detail:
        sec.email.mode === "postmark"
          ? sec.email.from
            ? `Postmark, from ${sec.email.from}.`
            : "Postmark is connected; add a sender address below."
          : sec.email.mode === "dev-outbox"
            ? "Development outbox: nothing is sent; codes and links show on screen."
            : "Not connected. Set POSTMARK_SERVER_TOKEN.",
    },
    { ok: true, label: "Staff sign-in", detail: "Each person has their own account; roles decide access; actions are audited." },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Settings & privacy</h1>
        <p className="mt-2 text-stone">Owner only. Changes here are recorded in the audit log.</p>
      </div>

      <section className={card}>
        <h2 className="font-display text-xl font-medium">Security status</h2>
        <ul className="mt-4 space-y-3">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-3">
              {c.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-pine" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber" />}
              <div>
                <p className="font-medium">{c.label}</p>
                <p className="text-sm text-stone">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={(e) => void save(e)} className={card}>
        <h2 className="font-display text-xl font-medium">Hotel</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-stone">
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          </label>
          <label className="block text-sm text-stone">
            City
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
          </label>
          <label className="block text-sm text-stone">
            Rooms
            <input type="number" min={1} value={form.rooms} onChange={(e) => setForm({ ...form, rooms: Math.max(1, Number(e.target.value) || 1) })} className={input} />
          </label>
          <label className="block text-sm text-stone">
            Time zone
            <input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={input} placeholder="Asia/Dubai" />
          </label>
        </div>

        <h3 className="mt-6 font-medium">Launch market</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.values(MARKETS).map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setForm({ ...form, market: m.id, timezone: form.timezone || m.defaultTimezone })}
              className={cn("rounded-md border px-3 py-2 text-left text-sm", form.market === m.id ? "border-pine bg-moss text-pine" : "border-line bg-cream")}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-stone">{market.law}</p>
        <p className="mt-1 text-sm text-stone">{market.phoneMarketingNote}</p>

        <h3 className="mt-6 font-medium">Guest email</h3>
        <label className="mt-2 block text-sm text-stone">
          Sender address on your own sending subdomain
          <input
            type="email"
            value={form.senderEmail}
            onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
            placeholder="stay@mail.yourhotel.com"
            className={input}
          />
        </label>
        <p className="mt-2 text-xs text-stone">
          Add SPF, DKIM and DMARC records for that subdomain (Postmark shows the exact values). Booking mail and marketing go on
          separate streams so a marketing complaint never delays a confirmation.
        </p>

        <h3 className="mt-6 font-medium">Check-in capture</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-stone">
            Capture step live since
            <input type="date" value={form.captureLaunchedOn} onChange={(e) => setForm({ ...form, captureLaunchedOn: e.target.value })} className={input} />
          </label>
          <label className="block text-sm text-stone">
            Keep stay-only details (days after departure)
            <input
              type="number"
              min={1}
              max={365}
              value={form.serviceRetentionDays}
              onChange={(e) => setForm({ ...form, serviceRetentionDays: Math.min(365, Math.max(1, Number(e.target.value) || 1)) })}
              className={input}
            />
          </label>
        </div>
        <Button type="submit" className="mt-6" disabled={busy}>
          Save settings
        </Button>
      </form>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-medium">Retention clocks</h2>
            <p className="mt-1 text-sm text-stone">
              Runs daily when the hotel is opened. Last run: {s.lastPurgeOn ? formatDateLong(s.lastPurgeOn) : "never"}.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void purge()} disabled={busy}>
            Run now
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {Object.entries(OTA_RETENTION).map(([source, rule]) => (
            <li key={source} className="flex justify-between gap-3 border-b border-line pb-2">
              <span>{source} booking data (name, notes)</span>
              <span className="text-stone">
                {rule.days} days after departure {rule.verified ? "· terms verified" : "· unverified, conservative"}
              </span>
            </li>
          ))}
          <li className="flex justify-between gap-3 border-b border-line pb-2">
            <span>Stay-only details (contact without consent, party, celebration)</span>
            <span className="text-stone">{form.serviceRetentionDays} days after departure</span>
          </li>
          <li className="flex justify-between gap-3 border-b border-line pb-2">
            <span>Verification codes</span>
            <span className="text-stone">7 days</span>
          </li>
          <li className="flex justify-between gap-3">
            <span>Profiles with every consent withdrawn</span>
            <span className="text-stone">erased after 30 days</span>
          </li>
        </ul>
      </section>

      <section className={cn(card, "print:shadow-none")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-medium">Front-desk QR</h2>
            <p className="mt-1 text-sm text-stone">Print it for the desk. Guests scan, find their booking, and check in on their phone.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <div className="size-48 shrink-0" dangerouslySetInnerHTML={{ __html: s.qr.svg }} />
          <div>
            <p className="font-display text-2xl font-medium">{p.name}</p>
            <p className="text-stone">Check in on your phone</p>
            <p className="mt-2 break-all font-mono text-xs text-mist">{s.qr.url}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
