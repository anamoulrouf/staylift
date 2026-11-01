import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAnalytics, getDashboard } from "@/lib/staylift/server";
import { money, pctOf } from "@/lib/staylift/format";

export const Route = createFileRoute("/hotel/analytics")({
  loader: async () => {
    const [analytics, dash] = await Promise.all([getAnalytics(), getDashboard()]);
    return { analytics, dash };
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { analytics, dash } = Route.useLoaderData();
  const f = dash.funnel;
  const chart = analytics.byOffer.map((row) => ({
    name: row.name.replace(" your room", "").replace(" for two", ""),
    dollars: Math.round(row.cents / 100),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Attribution</h1>
      <p className="mt-2 max-w-2xl text-stone">
        What sold through the stay page, to whom, from which channel — bookings that saw offers,
        since launch. This is attributed revenue, not incremental revenue: for that, see{" "}
        <Link to="/hotel/roi" className="text-ink underline underline-offset-2">
          Measured ROI
        </Link>
        .
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Revenue / booking" value={`$${dash.revenuePerBooking.toFixed(2)}`} hint="all bookings that saw offers" />
        <Kpi label="Revenue / night" value={`$${dash.revenuePerNight.toFixed(2)}`} hint="per occupied room-night" />
        <Kpi label="Conversion" value={pctOf(dash.conversion)} hint="bought ÷ opened page" />
        <Kpi
          label="Real email captured"
          value={pctOf(analytics.capture.checkedIn ? analytics.capture.captured / analytics.capture.checkedIn : 0, 0)}
          hint={`${analytics.capture.captured} of ${analytics.capture.checkedIn} OTA check-ins`}
        />
      </dl>

      <section className="mt-8 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-xl font-medium">Revenue by offer</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#6f675e", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6f675e", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: "#f3eee6" }}
                contentStyle={{
                  background: "#fffdf8",
                  border: "1px solid #e4dcd0",
                  borderRadius: 12,
                  fontSize: 13,
                }}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Bar dataKey="dollars" fill="#234139" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl font-medium">By booking source</h2>
        <ul className="mt-4 divide-y divide-line">
          {analytics.bySource.map((row) => (
            <li key={row.source} className="flex items-center justify-between py-3 text-sm">
              <span>
                {row.source}
                <span className="ml-2 text-stone">{row.bookings} bookings</span>
              </span>
              <span className="text-right tabular-nums">
                {money(row.cents)}
                <span className="block text-xs text-stone">
                  ${row.bookings ? (row.cents / 100 / row.bookings).toFixed(2) : "0.00"} per booking
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl bg-pine px-5 py-6 text-pine-fg sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-pine-fg/70">Funnel</p>
        <p className="mt-3 font-display text-2xl font-medium">
          {f.bookings} bookings → {f.reached} reached → {f.viewed} opened → {f.bought} bought
        </p>
        <p className="mt-2 text-sm text-pine-fg/80">
          {money(f.pageRevenueCents)} attributed · {pctOf(f.bookings ? f.reached / f.bookings : 0, 0)}{" "}
          reachable. Messaging: {analytics.messaging.sent} messages to {analytics.messaging.bookings}{" "}
          bookings, ${(analytics.messaging.costCents / 100).toFixed(2)} total (
          {analytics.messaging.bookings
            ? `${(analytics.messaging.costCents / analytics.messaging.bookings).toFixed(2)}¢`
            : "—"}{" "}
          per booking).
        </p>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]">
      <dt className="text-xs uppercase tracking-[0.14em] text-stone">{label}</dt>
      <dd className="mt-2 font-display text-2xl font-medium tabular-nums tracking-tight">
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-stone">{hint}</p> : null}
    </div>
  );
}
