import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily retention run across every hotel (Vercel Cron, see vercel.json).
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set,
 * the endpoint refuses. Opening the hotel also runs the purge once a day, so
 * this only matters for hotels nobody opens.
 */
export const Route = createFileRoute("/api/cron/retention")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET?.trim();
        if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { systemSql, withTenant } = await import("@/lib/staylift/tenant-db");
        const { runPurge } = await import("@/lib/staylift/guests");
        const sys = await systemSql();
        const hotels = await sys<{ id: string }>`select id from properties order by id`;
        const results: Record<string, unknown> = {};
        for (const h of hotels) {
          try {
            results[h.id] = await withTenant(h.id, (sql) => runPurge(sql));
          } catch (err) {
            results[h.id] = { error: err instanceof Error ? err.message : String(err) };
          }
        }
        return Response.json({ ranAt: new Date().toISOString(), hotels: results });
      },
    },
  },
});
