import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarHeart, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate, money } from "@/lib/staylift/format";
import { listGuests } from "@/lib/staylift/server";
import { cn } from "@/lib/utils";

type Filter = "all" | "marketable" | "returning" | "occasions";
type GuestSearch = { q?: string; filter?: Filter };

export const Route = createFileRoute("/hotel/guests/")({
  validateSearch: (s: Record<string, unknown>): GuestSearch => ({
    q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : undefined,
    filter: s.filter === "marketable" || s.filter === "returning" || s.filter === "occasions" ? s.filter : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listGuests({ data: { search: deps.q, filter: deps.filter } }),
  component: GuestsPage,
});

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "marketable", label: "Opted in" },
  { id: "returning", label: "Returning" },
  { id: "occasions", label: "Occasion soon" },
];

function GuestsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/hotel/guests/" });
  const [q, setQ] = useState(search.q ?? "");
  const filter = search.filter ?? "all";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Guests</h1>
      <p className="mt-2 max-w-2xl text-stone">
        A profile exists only when a guest confirmed their own contact and opted in at check-in. Contacts are encrypted and
        shown masked; managers can reveal one, which is logged.
      </p>

      {data.upcoming.length > 0 ? (
        <section className="mt-6 rounded-xl bg-pine p-5 text-pine-fg">
          <h2 className="flex items-center gap-2 font-display text-lg font-medium">
            <CalendarHeart className="size-5" /> Coming up in the next 60 days
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.upcoming.map((u) => (
              <li key={`${u.profileId}-${u.what}`}>
                <Link to="/hotel/guests/$profileId" params={{ profileId: u.profileId }} className="flex justify-between gap-3 rounded-md bg-pine-fg/10 px-3 py-2 text-sm hover:bg-pine-fg/15">
                  <span className="truncate">
                    {u.name} · {u.what}
                  </span>
                  <span className="shrink-0 tabular-nums text-pine-fg/80">{u.exactDay ? formatDate(u.date) : formatDate(u.date).split(" ")[0]}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-pine-fg/70">Occasion campaigns (phase D) will use these. Nothing is sent yet.</p>
        </section>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="relative w-full sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ search: { q: q.trim() || undefined, filter: search.filter } });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
          <input
            aria-label="Search guests"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, or exact email / phone"
            className="h-11 w-full rounded-md border border-line bg-paper pl-9 pr-3 text-sm outline-none focus:border-pine"
          />
        </form>
        <div className="inline-flex rounded-md bg-cream p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => void navigate({ search: { q: search.q, filter: f.id === "all" ? undefined : f.id } })}
              className={cn("h-8 rounded-sm px-3 text-sm", filter === f.id ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]">
        {data.rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-stone">
            {search.q ? "No guest matches that. Email and phone search needs the exact address or number." : "No profiles yet. They appear as guests opt in at check-in."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-stone">
              <tr>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Stays</th>
                <th className="px-4 py-3 font-medium">Spent</th>
                <th className="px-4 py-3 font-medium">Opted in</th>
                <th className="px-4 py-3 font-medium">Next occasion</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <Link to="/hotel/guests/$profileId" params={{ profileId: r.id }} className="font-medium hover:text-pine">
                      {r.name}
                    </Link>
                    <p className="text-xs text-stone">{[r.email, r.phone].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.stays}
                    {r.lastArrival ? <span className="block text-xs text-stone">last {formatDate(r.lastArrival)}</span> : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.spentCents ? money(r.spentCents) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.consents.marketing_email ? <Badge tone="pine">Email</Badge> : null}
                      {r.consents.marketing_whatsapp ? <Badge tone="pine">WhatsApp</Badge> : null}
                      {r.consents.profile_memory ? <Badge>Memory</Badge> : null}
                      {!r.consents.marketing_email && !r.consents.marketing_whatsapp && !r.consents.profile_memory ? (
                        <span className="text-xs text-stone">Withdrawn</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone">{r.nextOccasion ? `${r.nextOccasion.label} · ${formatDate(r.nextOccasion.date)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
