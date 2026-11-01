/**
 * Who may work on which hotel (owner connection, before a hotel is known).
 *
 * Every function here takes the verified user id from authMiddleware — never an
 * id sent by the browser — and checks membership itself. Once a hotel is
 * resolved, callers switch to withTenant() for everything else.
 */
import type { Sql } from "@/lib/db";
import { isMarketId, marketFor, type MarketId } from "./markets.ts";
import { atLeast, isRole, type Role } from "./roles.ts";
import { randomToken, sha256 } from "./vault.ts";

export type Membership = { propertyId: string; propertyName: string; city: string; role: Role; isDemo: boolean };

export type StaffContext = {
  userId: string;
  email: string | null;
  name: string | null;
  propertyId: string;
  propertyName: string;
  city: string;
  market: MarketId;
  role: Role;
  isDemo: boolean;
  memberships: Membership[];
};

export class NoHotelError extends Error {
  readonly status = 409;
  constructor() {
    super("No hotel yet");
    this.name = "NoHotelError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Your role can't do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Demo hotel access: on by default locally, off once a real database is set unless STAYLIFT_DEMO=on. */
export function demoEnabled(): boolean {
  const flag = (typeof process !== "undefined" ? process.env.STAYLIFT_DEMO : undefined)?.trim().toLowerCase();
  if (flag === "on") return true;
  if (flag === "off") return false;
  return !(typeof process !== "undefined" && process.env.DATABASE_URL?.trim());
}

export async function userIdentity(sql: Sql, userId: string) {
  const rows = await sql.query<{ email: string | null; name: string | null }>(
    `select email, name from "user" where id = $1`,
    [userId],
  );
  return { email: rows[0]?.email ?? null, name: rows[0]?.name ?? null };
}

export async function memberships(sql: Sql, userId: string): Promise<Membership[]> {
  const rows = await sql.query<{
    property_id: string;
    name: string;
    city: string;
    role: string;
    is_demo: boolean;
  }>(
    `select m.property_id, p.name, p.city, m.role, p.is_demo
     from memberships m join properties p on p.id = m.property_id
     where m.user_id = $1
     order by p.is_demo, p.name`,
    [userId],
  );
  return rows
    .filter((r) => isRole(r.role))
    .map((r) => ({
      propertyId: r.property_id,
      propertyName: r.name,
      city: r.city,
      role: r.role as Role,
      isDemo: Boolean(r.is_demo),
    }));
}

/** Resolve the hotel this user is working on, and their role there. */
export async function staffContext(sql: Sql, userId: string): Promise<StaffContext> {
  const list = await memberships(sql, userId);
  if (list.length === 0) throw new NoHotelError();
  const settings = await sql.query<{ active_property_id: string | null }>(
    `select active_property_id from user_settings where user_id = $1`,
    [userId],
  );
  const active = list.find((m) => m.propertyId === settings[0]?.active_property_id) ?? list[0]!;
  const prop = await sql.query<{ market: string }>(`select market from properties where id = $1`, [
    active.propertyId,
  ]);
  const who = await userIdentity(sql, userId);
  const market = prop[0]?.market ?? "US";
  return {
    userId,
    email: who.email,
    name: who.name,
    propertyId: active.propertyId,
    propertyName: active.propertyName,
    city: active.city,
    market: isMarketId(market) ? market : "US",
    role: active.role,
    isDemo: active.isDemo,
    memberships: list,
  };
}

export function requireRole(ctx: { role: Role }, min: Role, message?: string) {
  if (!atLeast(ctx.role, min)) throw new ForbiddenError(message);
}

export async function setActiveProperty(sql: Sql, userId: string, propertyId: string) {
  const list = await memberships(sql, userId);
  if (!list.some((m) => m.propertyId === propertyId)) throw new ForbiddenError("You're not on that hotel's team.");
  await sql`
    insert into user_settings (user_id, active_property_id) values (${userId}, ${propertyId})
    on conflict (user_id) do update set active_property_id = excluded.active_property_id
  `;
  return { ok: true as const };
}

/* ------------------------------------------------------------ onboarding */

export type NewHotel = {
  name: string;
  city: string;
  market: string;
  timezone?: string;
  rooms: number;
};

function slug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/**
 * Create a hotel owned by this user. The starter catalogue is added separately
 * inside the hotel's own transaction (queries.seedStarterCatalogue).
 */
export async function createProperty(sql: Sql, userId: string, input: NewHotel) {
  if (!isMarketId(input.market)) throw new Error("Pick a launch market.");
  const market = marketFor(input.market);
  const base = slug(input.name) || "hotel";
  let id = base;
  for (let n = 2; ; n += 1) {
    const taken = await sql.query<{ n: number }>(
      `select count(*)::int as n from properties where id = $1 or code = $1`,
      [id],
    );
    if (Number(taken[0]?.n ?? 0) === 0) break;
    id = `${base}-${n}`;
  }
  await sql`
    insert into properties (
      id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline, code, market, timezone,
      launched_on, capture_launched_on, holdout_pct, is_demo
    ) values (
      ${id}, ${input.name.trim()}, ${input.city.trim()}, ${input.rooms}, 70, 2, '', ${id},
      ${market.id}, ${input.timezone?.trim() || market.defaultTimezone},
      CURRENT_DATE, CURRENT_DATE, 20, false
    )
  `;
  await sql`
    insert into memberships (user_id, property_id, role) values (${userId}, ${id}, 'owner')
  `;
  await setActiveProperty(sql, userId, id);
  return { propertyId: id };
}

/** Add the user to the shared demo hotel (only when demoEnabled()). */
export async function joinDemo(sql: Sql, userId: string) {
  if (!demoEnabled()) throw new ForbiddenError("The demo hotel is switched off here.");
  const demo = await sql.query<{ id: string }>(`select id from properties where is_demo order by id limit 1`);
  const id = demo[0]?.id;
  if (!id) throw new Error("No demo hotel in this database.");
  // On your own machine you explore as owner. On a shared database, visitors join
  // as manager so they can't change the team, settings or read the audit log.
  const role: Role = typeof process !== "undefined" && process.env.DATABASE_URL?.trim() ? "manager" : "owner";
  await sql`
    insert into memberships (user_id, property_id, role) values (${userId}, ${id}, ${role})
    on conflict (user_id, property_id) do nothing
  `;
  await setActiveProperty(sql, userId, id);
  return { propertyId: id };
}

/* ----------------------------------------------------------------- team */

export type TeamMember = { userId: string; name: string | null; email: string | null; role: Role; joinedAt: string };
export type Invitation = { id: string; email: string; role: Role; createdAt: string; expiresAt: string };

export async function team(sql: Sql, propertyId: string) {
  const members = await sql.query<{ user_id: string; name: string | null; email: string | null; role: string; created_at: Date | string }>(
    `select m.user_id, u.name, u.email, m.role, m.created_at
     from memberships m left join "user" u on u.id = m.user_id
     where m.property_id = $1
     order by case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, u.name`,
    [propertyId],
  );
  const invites = await sql.query<{ id: string; email: string; role: string; created_at: Date | string; expires_at: Date | string }>(
    `select id, email, role, created_at, expires_at from invitations
     where property_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()
     order by created_at desc`,
    [propertyId],
  );
  const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : String(v));
  return {
    members: members.map<TeamMember>((m) => ({
      userId: m.user_id,
      name: m.name,
      email: m.email,
      role: (isRole(m.role) ? m.role : "front_desk") as Role,
      joinedAt: iso(m.created_at),
    })),
    invitations: invites.map<Invitation>((i) => ({
      id: i.id,
      email: i.email,
      role: (isRole(i.role) ? i.role : "front_desk") as Role,
      createdAt: iso(i.created_at),
      expiresAt: iso(i.expires_at),
    })),
  };
}

const INVITE_DAYS = 7;

export async function createInvitation(sql: Sql, propertyId: string, invitedBy: string, email: string, role: Role) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) throw new Error("Enter a valid email address.");
  const already = await sql.query<{ n: number }>(
    `select count(*)::int as n from memberships m join "user" u on u.id = m.user_id
     where m.property_id = $1 and lower(u.email) = $2`,
    [propertyId, normalized],
  );
  if (Number(already[0]?.n ?? 0) > 0) throw new Error("That person is already on the team.");
  const token = randomToken(24);
  const id = `inv_${randomToken(6)}`;
  await sql`
    update invitations set revoked_at = now()
    where property_id = ${propertyId} and email = ${normalized} and accepted_at is null and revoked_at is null
  `;
  await sql`
    insert into invitations (id, property_id, email, role, token_hash, invited_by, expires_at)
    values (${id}, ${propertyId}, ${normalized}, ${role}, ${await sha256(token)}, ${invitedBy},
            now() + make_interval(days => ${INVITE_DAYS}))
  `;
  return { id, token, email: normalized, role };
}

export async function revokeInvitation(sql: Sql, propertyId: string, invitationId: string) {
  await sql`
    update invitations set revoked_at = now()
    where id = ${invitationId} and property_id = ${propertyId} and accepted_at is null
  `;
  return { ok: true as const };
}

export async function invitationPreview(sql: Sql, token: string) {
  const rows = await sql.query<{
    id: string;
    property_id: string;
    name: string;
    email: string;
    role: string;
    expired: boolean;
    used: boolean;
  }>(
    `select i.id, i.property_id, p.name, i.email, i.role,
       (i.expires_at <= now()) as expired,
       (i.accepted_at is not null or i.revoked_at is not null) as used
     from invitations i join properties p on p.id = i.property_id
     where i.token_hash = $1`,
    [await sha256(token)],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyName: row.name,
    email: row.email,
    role: (isRole(row.role) ? row.role : "front_desk") as Role,
    usable: !row.expired && !row.used,
  };
}

/** Accept with the token AND a signed-in account whose email matches the invitation. */
export async function acceptInvitation(sql: Sql, userId: string, token: string) {
  const invite = await invitationPreview(sql, token);
  if (!invite || !invite.usable) throw new Error("This invitation has expired or was already used.");
  const who = await userIdentity(sql, userId);
  if ((who.email ?? "").toLowerCase() !== invite.email) {
    throw new ForbiddenError(`This invitation is for ${invite.email}. Sign in with that email to accept it.`);
  }
  await sql`
    insert into memberships (user_id, property_id, role) values (${userId}, ${invite.propertyId}, ${invite.role})
    on conflict (user_id, property_id) do update set role = excluded.role
  `;
  await sql`update invitations set accepted_at = now(), accepted_by = ${userId} where id = ${invite.id}`;
  await setActiveProperty(sql, userId, invite.propertyId);
  return { propertyId: invite.propertyId, role: invite.role };
}

export async function pendingInvitationsFor(sql: Sql, email: string | null) {
  if (!email) return [];
  return sql.query<{ property_name: string; role: string }>(
    `select p.name as property_name, i.role from invitations i join properties p on p.id = i.property_id
     where i.email = $1 and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()`,
    [email.toLowerCase()],
  );
}

async function ownerCount(sql: Sql, propertyId: string) {
  const rows = await sql.query<{ n: number }>(
    `select count(*)::int as n from memberships where property_id = $1 and role = 'owner'`,
    [propertyId],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function changeRole(sql: Sql, propertyId: string, targetUserId: string, role: Role) {
  const current = await sql.query<{ role: string }>(
    `select role from memberships where property_id = $1 and user_id = $2`,
    [propertyId, targetUserId],
  );
  if (!current[0]) throw new Error("Not on this team.");
  if (current[0].role === "owner" && role !== "owner" && (await ownerCount(sql, propertyId)) <= 1) {
    throw new Error("A hotel needs at least one owner. Make someone else owner first.");
  }
  await sql`update memberships set role = ${role} where property_id = ${propertyId} and user_id = ${targetUserId}`;
  return { from: current[0].role, to: role };
}

export async function removeMember(sql: Sql, propertyId: string, targetUserId: string) {
  const current = await sql.query<{ role: string }>(
    `select role from memberships where property_id = $1 and user_id = $2`,
    [propertyId, targetUserId],
  );
  if (!current[0]) throw new Error("Not on this team.");
  if (current[0].role === "owner" && (await ownerCount(sql, propertyId)) <= 1) {
    throw new Error("A hotel needs at least one owner.");
  }
  await sql`delete from memberships where property_id = ${propertyId} and user_id = ${targetUserId}`;
  await sql`
    update user_settings set active_property_id = null
    where user_id = ${targetUserId} and active_property_id = ${propertyId}
  `;
  return { role: current[0].role };
}

/* ------------------------------------------------- token -> hotel lookups */

/** Which hotel a guest stay link belongs to (null if the link is unknown). */
export async function propertyForStayToken(sql: Sql, token: string) {
  const rows = await sql.query<{ property_id: string }>(
    `select property_id from reservations where token = $1`,
    [token],
  );
  return rows[0]?.property_id ?? null;
}

export async function propertyForPreferenceToken(sql: Sql, token: string) {
  const rows = await sql.query<{ property_id: string; id: string }>(
    `select property_id, id from guest_profiles
     where pref_token_hash = $1 and erased_at is null and merged_into is null`,
    [await sha256(token)],
  );
  return rows[0] ? { propertyId: rows[0].property_id, profileId: rows[0].id } : null;
}

export async function propertyForCode(sql: Sql, code: string) {
  const rows = await sql.query<{ id: string; name: string; city: string }>(
    `select id, name, city from properties where code = $1`,
    [code.toLowerCase()],
  );
  return rows[0] ?? null;
}
