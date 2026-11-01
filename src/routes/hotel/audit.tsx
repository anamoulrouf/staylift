import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AUDIT_ACTION_LABEL } from "@/lib/staylift/audit";
import { getAuditLog } from "@/lib/staylift/server";
import { cn } from "@/lib/utils";

type AuditSearch = { action?: string };

const FILTERS: { id: string; label: string }[] = [
  { id: "", label: "Everything" },
  { id: "contact.", label: "Contact reveals" },
  { id: "profile.", label: "Profiles" },
  { id: "consent.", label: "Consent" },
  { id: "guest.", label: "Guest requests" },
  { id: "team.", label: "Team" },
  { id: "order.", label: "Orders" },
  { id: "retention.", label: "Retention" },
];

export const Route = createFileRoute("/hotel/audit")({
  validateSearch: (s: Record<string, unknown>): AuditSearch => ({
    action: typeof s.action === "string" && s.action ? s.action.slice(0, 40) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAuditLog({ data: { action: deps.action } }),
  component: AuditPage,
});

function describe(detail: Record<string, unknown>) {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(detail)) {
    if (v === null || v === undefined || typeof v === "object") continue;
    parts.push(`${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${String(v)}`);
  }
  return parts.join(" · ");
}

function AuditPage() {
  const rows = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/hotel/audit" });
  const active = search.action ?? "";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Audit log</h1>
      <p className="mt-2 max-w-2xl text-stone">
        Append-only: the app can add entries but never change or delete them. Contact values and codes are never written
        here.
      </p>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => void navigate({ search: { action: f.id || undefined } })}
            className={cn("h-8 rounded-full border px-3 text-sm", active === f.id ? "border-pine bg-pine text-pine-fg" : "border-line bg-paper")}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-stone">Nothing recorded yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-stone">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">What</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-stone">
                    {new Date(r.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.actorLabel} <Badge className="ml-1">{r.actorKind}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {AUDIT_ACTION_LABEL[r.action] ?? r.action}
                    {r.targetType === "profile" && r.targetId && !r.action.endsWith("erase") ? (
                      <Link to="/hotel/guests/$profileId" params={{ profileId: r.targetId }} className="ml-2 text-xs text-pine underline-offset-4 hover:underline">
                        open
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone">{describe(r.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
