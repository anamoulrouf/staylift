/**
 * Server functions: validated wrappers over queries.ts / guests.ts / access.ts.
 *
 * Two kinds of caller, two guards:
 *   staff  — authMiddleware gives a VERIFIED user id; staff() resolves their hotel
 *            and role from memberships, checks the role, and runs the work in that
 *            hotel's RLS transaction. The browser never names the hotel.
 *   guest  — no account; the stay link (or preference link) token resolves the
 *            hotel, and the work runs in that hotel's RLS transaction.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import * as access from "./access.ts";
import { audit, listAudit, type Actor } from "./audit.ts";
import * as g from "./guests.ts";
import { mailStatus, sendMail, simpleEmail } from "./mailer.ts";
import { CONSENT_PURPOSES, consentWording, HOLIDAYS, MARKETS, marketFor } from "./markets.ts";
import { qrSvg } from "./qr.ts";
import * as q from "./queries.ts";
import { can, CAN, ROLES, type Capability, type Role } from "./roles.ts";
import { systemSql, withTenant } from "./tenant-db.ts";
import { keyStatus } from "./vault.ts";

const token = z.string().min(1).max(64);
const id = z.string().min(1).max(64);
const touchpoint = z.enum(["email", "whatsapp", "sms"]).optional();
/** The page's own origin, used for links inside emails (PUBLIC_APP_URL overrides it). */
const origin = z.string().max(200).optional();
const captureSource = z.enum(["online", "desk_tablet", "qr"]);
const role = z.enum(["owner", "manager", "front_desk"]);

/* ------------------------------------------------------------- guards */

/** Verified staff member + role check, outside any hotel transaction. */
async function staffCtx(userId: string, capability: Capability) {
  const ctx = await access.staffContext(await systemSql(), userId);
  access.requireRole(ctx, CAN[capability]);
  const actor: Actor = { kind: "staff", id: ctx.userId, label: ctx.name || ctx.email || "Staff" };
  return { ctx, actor };
}

/**
 * Staff work inside the hotel's RLS transaction. `fn` must use only the `sql`
 * it gets: owner-connection work (access.*) belongs before or after, never
 * inside (PGLite has one connection, so it would wait forever).
 */
async function staff<T>(
  userId: string,
  capability: Capability,
  fn: (sql: Sql, ctx: access.StaffContext, actor: Actor) => Promise<T>,
): Promise<T> {
  const { ctx, actor } = await staffCtx(userId, capability);
  return withTenant(ctx.propertyId, (sql) => fn(sql, ctx, actor));
}

async function guest<T>(stayToken: string, fn: (sql: Sql) => Promise<T>): Promise<T> {
  const propertyId = await access.propertyForStayToken(await systemSql(), stayToken);
  if (!propertyId) throw new Error("This stay link is not valid.");
  return withTenant(propertyId, fn);
}

async function preference<T>(prefToken: string, fn: (sql: Sql, profileId: string) => Promise<T>): Promise<T> {
  const found = await access.propertyForPreferenceToken(await systemSql(), prefToken);
  if (!found) throw new Error("This link has expired. Use the newest one from your hotel.");
  return withTenant(found.propertyId, (sql) => fn(sql, found.profileId));
}

async function rateLimit(action: string, max: number, windowMs: number) {
  const { limit } = await import("./rate-limit.server");
  limit(action, max, windowMs);
}

/** The caller's origin if the page sent it, else this request's own origin. */
async function originOf(sent: string | undefined) {
  if (sent) return sent;
  const { requestOrigin } = await import("./rate-limit.server");
  return requestOrigin();
}

/* ------------------------------------------------------- session + team */

export type HotelContext =
  | {
      kind: "ok";
      userName: string | null;
      email: string | null;
      propertyId: string;
      propertyName: string;
      city: string;
      rooms: number;
      role: Role;
      isDemo: boolean;
      memberships: access.Membership[];
      pendingCount: number;
      caps: Record<Capability, boolean>;
    }
  | {
      kind: "onboarding";
      email: string | null;
      name: string | null;
      invitations: { propertyName: string; role: string }[];
      demoAvailable: boolean;
    };

export const getHotelContext = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HotelContext> => {
    const sys = await systemSql();
    let ctx: access.StaffContext;
    try {
      ctx = await access.staffContext(sys, context.userId);
    } catch (err) {
      if (!(err instanceof access.NoHotelError)) throw err;
      const who = await access.userIdentity(sys, context.userId);
      return {
        kind: "onboarding",
        email: who.email,
        name: who.name,
        invitations: (await access.pendingInvitationsFor(sys, who.email)).map((i) => ({
          propertyName: i.property_name,
          role: i.role,
        })),
        demoAvailable: access.demoEnabled(),
      };
    }
    const { pendingCount, rooms } = await withTenant(ctx.propertyId, async (sql) => {
      await g.housekeeping(sql);
      const p = await q.loadProperty(sql);
      return { pendingCount: await q.pendingCount(sql), rooms: p.rooms };
    });
    const caps = Object.fromEntries(
      (Object.keys(CAN) as Capability[]).map((c) => [c, can(ctx.role, c)]),
    ) as Record<Capability, boolean>;
    return {
      kind: "ok",
      userName: ctx.name,
      email: ctx.email,
      propertyId: ctx.propertyId,
      propertyName: ctx.propertyName,
      city: ctx.city,
      rooms,
      role: ctx.role,
      isDemo: ctx.isDemo,
      memberships: ctx.memberships,
      pendingCount,
      caps,
    };
  });

export const switchHotel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ propertyId: id }))
  .handler(async ({ context, data }) => access.setActiveProperty(await systemSql(), context.userId, data.propertyId));

export const createHotel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().trim().min(2).max(80),
      city: z.string().trim().min(2).max(60),
      market: z.enum(["US", "UK", "EU", "AE"]),
      timezone: z.string().max(60).optional(),
      rooms: z.number().int().min(1).max(5000),
      starter: z.boolean(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sys = await systemSql();
    const { propertyId } = await access.createProperty(sys, context.userId, data);
    const who = await access.userIdentity(sys, context.userId);
    await withTenant(propertyId, async (sql) => {
      if (data.starter) await q.seedStarterCatalogue(sql, propertyId);
      await audit(sql, { kind: "staff", id: context.userId, label: who.name || who.email || "Owner" }, {
        action: "property.create",
        targetType: "property",
        targetId: propertyId,
        detail: { market: data.market, starter: data.starter },
      });
    });
    return { propertyId };
  });

export const joinDemoHotel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => access.joinDemo(await systemSql(), context.userId));

export const getInvitation = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(10).max(100) }))
  .handler(async ({ data }) => {
    await rateLimit("invite-view", 30, 10 * 60_000);
    const invite = await access.invitationPreview(await systemSql(), data.token);
    if (!invite) return null;
    return { propertyName: invite.propertyName, email: invite.email, role: invite.role, usable: invite.usable };
  });

export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ token: z.string().min(10).max(100) }))
  .handler(async ({ context, data }) => {
    const sys = await systemSql();
    const result = await access.acceptInvitation(sys, context.userId, data.token);
    const who = await access.userIdentity(sys, context.userId);
    await withTenant(result.propertyId, (sql) =>
      audit(sql, { kind: "staff", id: context.userId, label: who.name || who.email || "Staff" }, {
        action: "team.join",
        targetType: "user",
        targetId: context.userId,
        detail: { role: result.role },
      }),
    );
    return result;
  });

export const getTeam = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { ctx } = await staffCtx(context.userId, "manageTeam");
    return { ...(await access.team(await systemSql(), ctx.propertyId)), me: ctx.userId, roles: ROLES };
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ email: z.string().email().max(200), role, origin }))
  .handler(async ({ context, data }) => {
    const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
    const inv = await access.createInvitation(await systemSql(), ctx.propertyId, ctx.userId, data.email, data.role);
    const link = `${q.publicOrigin(await originOf(data.origin))}/invite/${inv.token}`;
    const property = await withTenant(ctx.propertyId, async (sql) => {
      await audit(sql, actor, { action: "team.invite", targetType: "invitation", targetId: inv.id, detail: { role: data.role } });
      return q.loadProperty(sql);
    });
    const body = simpleEmail({
      hotel: property.name,
      heading: `Join ${property.name} on Staylift`,
      lines: [`${actor.label} invited you as ${data.role.replace("_", " ")}. The link works for 7 days.`],
      cta: { label: "Accept invitation", url: link },
    });
    const sent = await sendMail({
      to: inv.email,
      subject: `You're invited to ${property.name} on Staylift`,
      html: body.html,
      text: body.text,
      from: property.settings.senderEmail,
      fromName: "Staylift",
      tag: "invite",
    }).catch(() => ({ delivered: false as const }));
    return { link, emailed: sent.delivered, email: inv.email };
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ invitationId: id }))
  .handler(async ({ context, data }) => {
    const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
    await access.revokeInvitation(await systemSql(), ctx.propertyId, data.invitationId);
    await withTenant(ctx.propertyId, (sql) =>
      audit(sql, actor, { action: "team.invite_revoke", targetType: "invitation", targetId: data.invitationId }),
    );
    return { ok: true as const };
  });

export const changeMemberRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: id, role }))
  .handler(async ({ context, data }) => {
    const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
    const change = await access.changeRole(await systemSql(), ctx.propertyId, data.userId, data.role);
    await withTenant(ctx.propertyId, (sql) =>
      audit(sql, actor, { action: "team.role_change", targetType: "user", targetId: data.userId, detail: change }),
    );
    return { ok: true as const };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ userId: id }))
  .handler(async ({ context, data }) => {
    const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
    if (data.userId === ctx.userId) throw new Error("You can't remove yourself. Ask another owner.");
    const removed = await access.removeMember(await systemSql(), ctx.propertyId, data.userId);
    await withTenant(ctx.propertyId, (sql) =>
      audit(sql, actor, { action: "team.remove", targetType: "user", targetId: data.userId, detail: removed }),
    );
    return { ok: true as const };
  });

/* ------------------------------------------------- settings + security */

export const getSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ origin }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "editSettings", async (sql) => {
      const property = await q.loadProperty(sql);
      const market = marketFor(property.settings.market);
      const rls = await sql.query<{ relname: string; relrowsecurity: boolean }>(
        `select relname, relrowsecurity from pg_class
         where relname in ('reservations','guest_profiles','consent_events','audit_log') and relkind = 'r'`,
      );
      const lastPurge = await sql.query<{ last_purge_on: string | null }>(
        `select last_purge_on::text as last_purge_on from properties where id = current_setting('app.property_id', true)`,
      );
      const qrUrl = `${q.publicOrigin(await originOf(data.origin))}/c/${property.settings.code}`;
      return {
        property,
        market,
        markets: Object.values(MARKETS).map((m) => ({ id: m.id, label: m.label, law: m.law })),
        security: {
          encryption: await keyStatus(),
          email: mailStatus(property.settings.senderEmail),
          rowLevelSecurity: rls.length > 0 && rls.every((r) => r.relrowsecurity),
          signIn: "email-password",
        },
        lastPurgeOn: lastPurge[0]?.last_purge_on ?? null,
        qr: { url: qrUrl, svg: qrSvg(qrUrl, { dark: "#1f1d1a", label: `Check in at ${property.name}` }) },
      };
    }),
  );

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().trim().min(2).max(80),
      city: z.string().trim().min(2).max(60),
      market: z.enum(["US", "UK", "EU", "AE"]),
      timezone: z.string().trim().min(3).max(60),
      rooms: z.number().int().min(1).max(5000),
      senderEmail: z.string().email().max(200).nullable(),
      serviceRetentionDays: z.number().int().min(1).max(365),
      captureLaunchedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    }),
  )
  .handler(async ({ context, data }) =>
    staff(context.userId, "editSettings", async (sql, _ctx, actor) => {
      await q.updateSettings(sql, data);
      await audit(sql, actor, {
        action: "property.settings",
        detail: { market: data.market, serviceRetentionDays: data.serviceRetentionDays, senderEmail: Boolean(data.senderEmail) },
      });
      return { ok: true as const };
    }),
  );

export const runRetentionNow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "handleDataRequests", (sql) => g.runPurge(sql)));

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ action: z.string().max(40).optional(), before: z.number().int().optional() }))
  .handler(async ({ context, data }) => staff(context.userId, "viewAudit", (sql) => listAudit(sql, { ...data, limit: 150 })));

/* --------------------------------------------------------- hotel desk */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "viewOverview", async (sql) => ({
      ...(await q.dashboard(sql)),
      capture: await g.captureGate(sql),
    })),
  );

export const getComplianceReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "viewAudit", async (sql, _ctx, actor) => {
      const property = await q.loadProperty(sql);
      const market = marketFor(property.settings.market);
      const rls = await sql.query<{ relname: string; relrowsecurity: boolean }>(
        `select relname, relrowsecurity from pg_class
         where relname in ('reservations','orders','guest_profiles','consent_events','audit_log',
                           'checkins','contact_verifications','suppressions','companions','messages')
           and relkind = 'r'`,
      );
      const lastPurge = await sql.query<{ last_purge_on: string | null }>(
        `select last_purge_on::text as last_purge_on from properties where id = current_setting('app.property_id', true)`,
      );
      await audit(sql, actor, { action: "compliance.report_viewed" });
      return {
        property,
        market,
        generatedAt: new Date().toISOString(),
        security: {
          encryption: await keyStatus(),
          email: mailStatus(property.settings.senderEmail),
          rowLevelSecurity: rls.map((r) => ({ table: r.relname, enabled: r.relrowsecurity })),
          signIn: "email-password",
        },
        lastPurgeOn: lastPurge[0]?.last_purge_on ?? null,
        counts: await q.complianceCounts(sql),
      };
    }),
  );

export const exportLiftRows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "viewRoi", async (sql, _ctx, actor) => {
      const data = await q.liftRows(sql);
      await audit(sql, actor, {
        action: "data.lift_rows_exported",
        detail: { rows: data.rows.length, since: data.launched },
      });
      const header = "booking_ref,arrival,departure,completed,holdout,page_cents,desk_cents,total_cents";
      const body = data.rows
        .map((r) =>
          [r.bookingRef, r.arrival, r.departure, r.completed, r.holdout, r.pageCents, r.deskCents, r.totalCents]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\n");
      return { csv: `${header}\n${body}`, launched: data.launched, rows: data.rows.length };
    }),
  );

export const getOverviewExtras = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "viewOverview", (sql) => q.overviewExtras(sql)),
  );

export const getPendingCount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "workOrders", (sql) => q.pendingCount(sql)));

export const getMeasuredRoi = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "viewRoi", async (sql, ctx) => ({
      ...(await q.measuredRoi(sql)),
      canEditContract: can(ctx.role, "editContract"),
    })),
  );

export const updateEconomics = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      planId: z.enum(["A", "B", "C", "custom"]),
      perRoomMonthly: z.number().min(0).max(50),
      baseMonthly: z.number().min(0).max(5000),
      revSharePct: z.number().min(0).max(50),
      marginPct: z.number().min(0).max(100),
      cardPct: z.number().min(0).max(10),
    }),
  )
  .handler(async ({ context, data }) =>
    staff(context.userId, "editContract", async (sql, _ctx, actor) => {
      await q.updateEconomics(sql, data);
      await audit(sql, actor, { action: "property.economics", detail: data });
      return { ok: true as const };
    }),
  );

export const listReservations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ history: z.boolean().optional() }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", async (sql, ctx) => ({
      ...(await q.reservations(sql, data)),
      canErase: can(ctx.role, "handleDataRequests"),
    })),
  );

export const listOffers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    staff(context.userId, "workOrders", async (sql, ctx) => ({
      offers: await q.offers(sql),
      canEdit: can(ctx.role, "editOffers"),
    })),
  );

export const listFulfillment = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "workOrders", (sql) => q.fulfillment(sql)));

export const listRecipes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "editRecipes", (sql) => q.recipes(sql)));

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "viewAnalytics", (sql) => q.analytics(sql)));

export const decideOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ orderId: id, decision: z.enum(["approve", "decline"]) }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workOrders", async (sql, _ctx, actor) => {
      const result = await q.decideOrder(sql, data);
      await audit(sql, actor, {
        action: data.decision === "approve" ? "order.approve" : "order.decline",
        targetType: "order",
        targetId: data.orderId,
      });
      return result;
    }),
  );

export const toggleRecipe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id, active: z.boolean() }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "editRecipes", async (sql, _ctx, actor) => {
      await audit(sql, actor, { action: "recipe.toggle", targetType: "recipe", targetId: data.id, detail: { active: data.active } });
      return q.toggleRecipe(sql, data);
    }),
  );

export const toggleOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id, active: z.boolean() }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "editOffers", async (sql, _ctx, actor) => {
      await audit(sql, actor, { action: "offer.toggle", targetType: "offer", targetId: data.id, detail: { active: data.active } });
      return q.toggleOffer(sql, data);
    }),
  );

export const sendStayLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      reservationId: id,
      recipeId: id.optional(),
      channel: z.enum(["email", "sms", "whatsapp"]),
    }),
  )
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", async (sql, _ctx, actor) => {
      const sent = await q.sendStayLink(sql, data);
      await audit(sql, actor, { action: "message.stay_link", targetType: "reservation", targetId: data.reservationId, detail: { channel: data.channel } });
      return sent;
    }),
  );

export const logDeskSale = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reservationId: id, offerId: id, qty: z.number().int().min(1).max(14) }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workOrders", async (sql, _ctx, actor) => {
      const sale = await q.logDeskSale(sql, data);
      await audit(sql, actor, {
        action: "order.desk_sale",
        targetType: "order",
        targetId: sale.id,
        detail: { amountCents: sale.amountCents },
      });
      return sale;
    }),
  );

export const ingestReservation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      bookingRef: z.string().min(2).max(40),
      source: z.string().min(2).max(40),
      guestName: z.string().min(2).max(80),
      arrival: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      departure: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      roomTypeId: id,
      guests: z.number().int().min(1).max(6),
      emailKind: z.enum(["real", "masked", "none"]),
      phoneKind: z.enum(["valid", "placeholder", "none"]),
      origin,
    }),
  )
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", async (sql, _ctx, actor) => {
      const { origin: from, ...booking } = data;
      const created = await q.ingestReservation(sql, booking, Math.random(), from ?? "");
      await audit(sql, actor, { action: "reservation.ingest", targetType: "reservation", targetId: created.id, detail: { source: data.source } });
      return created;
    }),
  );

export const getBookingEmail = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ reservationId: id, origin }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", (sql) => q.bookingEmail(sql, data.reservationId, data.origin)),
  );

export const sendBookingEmail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reservationId: id, origin }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", (sql) => q.sendBookingEmail(sql, data.reservationId, data.origin)),
  );

export const previewEmailParse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ text: z.string().min(10).max(20_000) }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "workReservations", (sql) => q.previewEmailParse(sql, data.text)),
  );

export const listRoomTypes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "workReservations", (sql) => q.roomTypes(sql)));

export const listMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => staff(context.userId, "viewAnalytics", (sql) => q.messages(sql)));

export const eraseReservation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ reservationId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => g.eraseReservationGuest(sql, data.reservationId, actor)),
  );

/* --------------------------------------------------- check-in desk (B) */

export const getDeskArrivals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ origin }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "runDeskTablet", async (sql) => {
      const property = await q.loadProperty(sql);
      const qrUrl = `${q.publicOrigin(await originOf(data.origin))}/c/${property.settings.code}`;
      return {
        ...(await g.deskArrivals(sql)),
        property: { name: property.name, city: property.city },
        qr: { url: qrUrl, svg: qrSvg(qrUrl, { dark: "#1f1d1a", label: `Check in at ${property.name}` }) },
      };
    }),
  );

/* ------------------------------------------------------ guest profiles (C) */

export const listGuests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      search: z.string().max(120).optional(),
      filter: z.enum(["all", "marketable", "returning", "occasions"]).optional(),
    }),
  )
  .handler(async ({ context, data }) =>
    staff(context.userId, "viewGuests", async (sql) => ({
      ...(await g.listProfiles(sql, data)),
      upcoming: await g.upcomingOccasions(sql, 60),
    })),
  );

export const getGuest = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ profileId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "viewGuests", async (sql, ctx) => ({
      ...(await g.profileDetail(sql, data.profileId)),
      caps: {
        reveal: can(ctx.role, "revealContacts"),
        dataRequests: can(ctx.role, "handleDataRequests"),
        merge: can(ctx.role, "mergeProfiles"),
      },
    })),
  );

export const revealGuestContact = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ profileId: id, reason: z.string().trim().min(3).max(200) }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "revealContacts", async (sql, _ctx, actor) => {
      const contact = await g.revealContact(sql, data.profileId);
      await audit(sql, actor, {
        action: "contact.reveal",
        targetType: "profile",
        targetId: data.profileId,
        detail: { reason: data.reason, email: Boolean(contact.email), phone: Boolean(contact.phone) },
      });
      return contact;
    }),
  );

export const exportGuest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ profileId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "handleDataRequests", async (sql, _ctx, actor) => {
      const exported = await g.exportProfile(sql, data.profileId);
      await audit(sql, actor, { action: "profile.export", targetType: "profile", targetId: data.profileId });
      return exported;
    }),
  );

export const eraseGuest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ profileId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => g.eraseProfile(sql, data.profileId, actor, "staff")),
  );

export const mergeGuests = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ keepId: id, mergeId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "mergeProfiles", (sql, _ctx, actor) => g.mergeProfiles(sql, data.keepId, data.mergeId, actor)),
  );

export const withdrawGuestConsent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ profileId: id, purpose: z.enum(["marketing_email", "marketing_whatsapp", "profile_memory"]) }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "handleDataRequests", (sql, _ctx, actor) =>
      g.updateConsents(sql, { profileId: data.profileId, changes: { [data.purpose]: false }, source: "staff", actor }),
    ),
  );

const occasionInput = z.object({
  kind: z.enum(["birthday", "anniversary", "achievement", "other"]),
  label: z.string().max(60).nullable(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31).nullable(),
  companionId: id.nullable(),
});

export const addGuestOccasion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(occasionInput.extend({ profileId: id }))
  .handler(async ({ context, data }) =>
    staff(context.userId, "handleDataRequests", (sql, _ctx, actor) =>
      g.addOccasion(sql, { ...data, source: "staff", actor }),
    ),
  );

/* ------------------------------------------------------------- guests */

export const getStay = createServerFn({ method: "GET" })
  .validator(z.object({ token }))
  .handler(async ({ data }) =>
    guest(data.token, async (sql) => {
      const stay = await g.stayPage(sql, data.token);
      const market = marketFor(stay.property.settings.market);
      return {
        ...stay,
        capture: {
          market: { id: market.id, explicitSpecialCategory: market.explicitSpecialCategory, dialCode: market.dialCode },
          wording: Object.fromEntries(
            CONSENT_PURPOSES.map((p) => [p, consentWording(p, stay.property.name, market)]),
          ) as Record<(typeof CONSENT_PURPOSES)[number], string>,
          holidays: [
            ...market.holidays,
            ...(Object.keys(HOLIDAYS) as (keyof typeof HOLIDAYS)[]).filter((h) => !market.holidays.includes(h)),
          ].map((id) => ({ id, label: HOLIDAYS[id].label, when: HOLIDAYS[id].when })),
          whatsappAvailable: !process.env.DATABASE_URL?.trim(),
        },
      };
    }),
  );

export const recordStayView = createServerFn({ method: "POST" })
  .validator(z.object({ token, source: touchpoint }))
  .handler(async ({ data }) => guest(data.token, (sql) => q.recordStayView(sql, data.token, data.source)));

export const purchaseOffer = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token,
      offerId: id,
      qty: z.number().int().min(1).max(14),
      forTime: z.string().max(8).optional(),
      source: touchpoint,
    }),
  )
  .handler(async ({ data }) => guest(data.token, (sql) => q.purchaseOffer(sql, data)));

export const startCheckin = createServerFn({ method: "POST" })
  .validator(z.object({ token, source: captureSource }))
  .handler(async ({ data }) => guest(data.token, (sql) => g.startCapture(sql, data.token, data.source)));

export const checkinStep = createServerFn({ method: "POST" })
  .validator(z.object({ token, step: z.enum(["celebration", "party"]), source: captureSource }))
  .handler(async ({ data }) => guest(data.token, (sql) => g.captureStep(sql, data.token, data.step, data.source)));

export const sendCheckinCode = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token,
      channel: z.enum(["email", "whatsapp"]),
      value: z.string().trim().min(5).max(200),
      source: captureSource,
    }),
  )
  .handler(async ({ data }) => {
    await rateLimit("send-code", 10, 60 * 60_000);
    return guest(data.token, (sql) => g.sendContactCode(sql, data));
  });

export const verifyCheckinCode = createServerFn({ method: "POST" })
  .validator(z.object({ token, verificationId: id, code: z.string().trim().min(4).max(12), source: captureSource }))
  .handler(async ({ data }) => {
    await rateLimit("verify-code", 30, 15 * 60_000);
    return guest(data.token, (sql) => g.verifyContactCode(sql, data));
  });

const partyMember = z.union([
  z.object({
    relation: z.enum(["partner", "parent", "sibling", "friend", "colleague", "other"]),
    firstName: z.string().trim().min(1).max(40),
  }),
  z.object({ relation: z.literal("child"), ageBand: z.enum(["0-2", "3-12", "13-17"]) }),
]);

export const completeCheckin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token,
      source: captureSource,
      ticket: z.string().max(64).nullable(),
      eta: z.string().max(5),
      celebration: z
        .object({
          kind: z.enum(["birthday", "anniversary", "honeymoon", "achievement", "other"]),
          whose: z.enum(["me", "partner", "someone"]),
          month: z.number().int().min(1).max(12).nullable(),
          day: z.number().int().min(1).max(31).nullable(),
        })
        .nullable(),
      party: z.array(partyMember).max(8),
      consents: z.object({
        marketing_email: z.boolean(),
        marketing_whatsapp: z.boolean(),
        profile_memory: z.boolean(),
      }),
      holidays: z.array(z.string().max(30)).max(12),
    }),
  )
  .handler(async ({ data }) => guest(data.token, (sql) => g.completeCapture(sql, data)));

export const requestPreferenceLink = createServerFn({ method: "POST" })
  .validator(z.object({ token, origin }))
  .handler(async ({ data }) => {
    await rateLimit("pref-link", 5, 60 * 60_000);
    const from = q.publicOrigin(await originOf(data.origin));
    return guest(data.token, (sql) => g.sendPreferenceLink(sql, data.token, from));
  });

/* ------------------------------------------------ guest preference centre */

export const getPreferences = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(10).max(64) }))
  .handler(async ({ data }) => {
    await rateLimit("pref-view", 60, 10 * 60_000);
    return preference(data.token, async (sql, profileId) => {
      const view = await g.profileView(sql, profileId);
      const property = await q.loadProperty(sql);
      const market = marketFor(property.settings.market);
      return {
        ...view,
        hotel: { name: property.name, city: property.city },
        holidayOptions: [
          ...market.holidays,
          ...(Object.keys(HOLIDAYS) as (keyof typeof HOLIDAYS)[]).filter((h) => !market.holidays.includes(h)),
        ].map((id) => ({ id, label: HOLIDAYS[id].label })),
      };
    });
  });

export const updatePreferences = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(10).max(64),
      changes: z.object({
        marketing_email: z.boolean().optional(),
        marketing_whatsapp: z.boolean().optional(),
        profile_memory: z.boolean().optional(),
      }),
    }),
  )
  .handler(async ({ data }) =>
    preference(data.token, (sql, profileId) =>
      g.updateConsents(sql, {
        profileId,
        changes: data.changes,
        source: "preference_centre",
        actor: { kind: "guest", id: profileId, label: "Guest" },
      }),
    ),
  );

export const prefAddOccasion = createServerFn({ method: "POST" })
  .validator(occasionInput.extend({ token: z.string().min(10).max(64) }))
  .handler(async ({ data }) =>
    preference(data.token, (sql, profileId) => {
      const { token: _t, ...occ } = data;
      return g.addOccasion(sql, { ...occ, profileId, source: "guest", actor: { kind: "guest", id: profileId, label: "Guest" } });
    }),
  );

export const prefRemoveOccasion = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(64), occasionId: id }))
  .handler(async ({ data }) => preference(data.token, (sql, profileId) => g.removeOccasion(sql, profileId, data.occasionId)));

export const prefRemoveCompanion = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(64), companionId: id }))
  .handler(async ({ data }) => preference(data.token, (sql, profileId) => g.removeCompanion(sql, profileId, data.companionId)));

export const prefSetHolidays = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(64), holidays: z.array(z.string().max(30)).max(12) }))
  .handler(async ({ data }) => preference(data.token, (sql, profileId) => g.setHolidays(sql, profileId, data.holidays)));

export const prefExport = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(64) }))
  .handler(async ({ data }) =>
    preference(data.token, async (sql, profileId) => {
      const exported = await g.exportProfile(sql, profileId);
      await audit(sql, { kind: "guest", id: profileId, label: "Guest" }, { action: "guest.export", targetType: "profile", targetId: profileId });
      return exported;
    }),
  );

export const prefErase = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(10).max(64), confirm: z.literal("DELETE") }))
  .handler(async ({ data }) =>
    preference(data.token, (sql, profileId) =>
      g.eraseProfile(sql, profileId, { kind: "guest", id: profileId, label: "Guest" }, "guest"),
    ),
  );

/* -------------------------------------------------------------- desk QR */

export const getQrHotel = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const hotel = await access.propertyForCode(await systemSql(), data.code);
    return hotel ? { name: hotel.name, city: hotel.city } : null;
  });

export const findQrBooking = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().min(1).max(64),
      lastName: z.string().trim().min(2).max(60),
      bookingRef: z.string().trim().min(4).max(40),
    }),
  )
  .handler(async ({ data }) => {
    await rateLimit("qr-lookup", 8, 15 * 60_000);
    const hotel = await access.propertyForCode(await systemSql(), data.code);
    if (!hotel) throw new Error("Unknown hotel.");
    return withTenant(hotel.id, (sql) => g.findBookingForQr(sql, data));
  });
