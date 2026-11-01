/**
 * Append-only audit log. Writes go through the hotel-scoped transaction, so a
 * row always lands in the acting hotel, and the app role cannot update or
 * delete rows (migration 0007 grants select + insert only).
 *
 * Log what a regulator or a hotel owner would ask about: who saw a guest's
 * contact details, who exported or erased data, consent changes, role changes,
 * money decisions, settings and retention runs. Never put contact values or
 * codes in `detail`.
 */
import type { Sql } from "@/lib/db";

export type Actor =
  | { kind: "staff"; id: string; label: string }
  | { kind: "guest"; id: string; label: string }
  | { kind: "system"; id?: string; label: string };

export type AuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
};

export async function audit(sql: Sql, actor: Actor, entry: AuditEntry) {
  await sql`
    insert into audit_log (actor_kind, actor_id, actor_label, action, target_type, target_id, detail)
    values (
      ${actor.kind}, ${actor.id ?? null}, ${actor.label}, ${entry.action},
      ${entry.targetType ?? null}, ${entry.targetId ?? null}, ${JSON.stringify(entry.detail ?? {})}::jsonb
    )
  `;
}

export type AuditRow = {
  id: number;
  at: string;
  actorKind: string;
  actorLabel: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  /** flat key -> value pairs (no nested data reaches the browser) */
  detail: Record<string, string | number | boolean | null>;
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "contact.reveal": "Revealed a guest contact",
  "profile.export": "Exported guest data",
  "profile.erase": "Erased a guest profile",
  "profile.merge": "Merged guest profiles",
  "profile.created": "Guest profile created",
  "profile.duplicate_suspected": "Possible duplicate profile",
  "occasion.add": "Added an occasion",
  "reservation.erase": "Erased booking guest data",
  "consent.change": "Consent changed",
  "guest.export": "Guest downloaded their data",
  "guest.erase": "Guest erased their data",
  "team.invite": "Invited a team member",
  "team.invite_revoke": "Revoked an invitation",
  "team.join": "Joined the team",
  "team.role_change": "Changed a role",
  "team.remove": "Removed a team member",
  "property.create": "Created the hotel",
  "property.settings": "Changed hotel settings",
  "property.economics": "Changed the contract",
  "order.approve": "Approved an order",
  "order.decline": "Declined an order",
  "order.desk_sale": "Logged a desk sale",
  "retention.purge": "Ran the retention purge",
  "capture.verified": "Guest verified a contact",
  "recipe.toggle": "Turned a recipe on or off",
  "offer.toggle": "Turned an offer on or off",
  "message.stay_link": "Sent a stay link",
  "reservation.ingest": "Added a booking",
};

export async function listAudit(
  sql: Sql,
  opts: { action?: string; limit?: number; before?: number } = {},
): Promise<AuditRow[]> {
  const rows = await sql.query<{
    id: number;
    at: string | Date;
    actor_kind: string;
    actor_label: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    detail: Record<string, unknown> | string;
  }>(
    `select id, at, actor_kind, actor_label, action, target_type, target_id, detail
     from audit_log
     where ($1::text is null or action like $1 || '%')
       and ($2::bigint is null or id < $2)
     order by id desc
     limit $3`,
    [opts.action ?? null, opts.before ?? null, Math.min(opts.limit ?? 100, 500)],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    at: r.at instanceof Date ? r.at.toISOString() : String(r.at),
    actorKind: r.actor_kind,
    actorLabel: r.actor_label ?? r.actor_kind,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    detail: flatDetail(typeof r.detail === "string" ? (JSON.parse(r.detail) as Record<string, unknown>) : (r.detail ?? {})),
  }));
}

function flatDetail(d: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(d)) {
    out[k] = v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : JSON.stringify(v);
  }
  return out;
}
