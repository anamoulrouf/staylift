/**
 * Phase B (check-in capture) and phase C (guest profiles) — data layer.
 *
 * Every function runs inside withTenant(): one hotel, one transaction, RLS on.
 * Contact values are only ever stored encrypted (vault.ts); profiles are matched
 * on the keyed hash of a VERIFIED contact, never on names.
 *
 * Lifecycle of what a guest tells us at check-in
 *   no consent      -> kept on the stay (checkins) for service, purged on
 *                      departure + service_retention_days
 *   any consent     -> a guest profile (matched or created) + consent ledger
 *   profile_memory  -> occasions, companions and chosen holidays are copied to
 *                      the profile; withdrawing it deletes them
 *   erasure         -> profile tombstoned, contacts hashed into suppressions,
 *                      linked stays anonymised; the consent ledger is kept as proof
 */
import type { Sql } from "@/lib/db";
import { audit, type Actor } from "./audit.ts";
import { initials, isRelayEmail, maskEmail, maskPhone, normalizeEmail, normalizePhone } from "./contact.ts";
import { sendMail, simpleEmail } from "./mailer.ts";
import {
  CONSENT_PURPOSES,
  CONSENT_VERSION,
  consentWording,
  HOLIDAYS,
  isHolidayId,
  marketFor,
  otaRetention,
  type ConsentPurpose,
} from "./markets.ts";
import * as q from "./queries.ts";
import type {
  AgeBand,
  CaptureSource,
  Celebration,
  CelebrationWhose,
  CheckinState,
  CompanionRelation,
  PartyMember,
  StayPayload,
} from "./types.ts";
import { blindIndex, decryptOrNull, encrypt, randomCode, randomToken, sha256 } from "./vault.ts";

export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const CODES_PER_HOUR = 5;
/** A profile whose consents are all withdrawn is erased after this many days. */
export const DORMANT_ERASE_DAYS = 30;
export const VERIFICATION_KEEP_DAYS = 7;

type Consents = Record<ConsentPurpose, boolean>;
const NO_CONSENTS: Consents = { marketing_email: false, marketing_whatsapp: false, profile_memory: false };

function iso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function guestActor(reservationId: string): Actor {
  return { kind: "guest", id: reservationId, label: "Guest" };
}

/* ------------------------------------------------------------ check-ins */

type CheckinRow = {
  reservation_id: string;
  eta: string | null;
  completed_at: string | Date | null;
  source: string | null;
  celebration: string | null;
  celebration_whose: string | null;
  celebration_month: number | null;
  celebration_day: number | null;
  party: PartyMember[] | string | null;
  service_email_enc: string | null;
  service_phone_enc: string | null;
  contact_verified_at: string | Date | null;
  real_email_captured: boolean;
};

async function checkinRow(sql: Sql, reservationId: string): Promise<CheckinRow | null> {
  const rows = await sql.query<CheckinRow>(
    `select reservation_id, eta, completed_at, source, celebration, celebration_whose,
       celebration_month, celebration_day, party, service_email_enc, service_phone_enc,
       contact_verified_at, real_email_captured
     from checkins where reservation_id = $1`,
    [reservationId],
  );
  return rows[0] ?? null;
}

function parseParty(value: CheckinRow["party"]): PartyMember[] {
  if (!value) return [];
  const list = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  return Array.isArray(list) ? (list as PartyMember[]) : [];
}

export async function currentConsents(sql: Sql, profileId: string): Promise<Consents> {
  const rows = await sql.query<{ purpose: ConsentPurpose; granted: boolean }>(
    `select distinct on (purpose) purpose, granted from consent_events
     where profile_id = $1 order by purpose, at desc, id desc`,
    [profileId],
  );
  const out = { ...NO_CONSENTS };
  for (const r of rows) if (r.purpose in out) out[r.purpose] = Boolean(r.granted);
  return out;
}

type ProfileRow = {
  id: string;
  display_name: string;
  email_enc: string | null;
  email_hash: string | null;
  phone_enc: string | null;
  phone_hash: string | null;
  email_verified_at: string | Date | null;
  phone_verified_at: string | Date | null;
  merged_into: string | null;
  erased_at: string | Date | null;
  created_at: string | Date;
  language: string;
};

const PROFILE_COLS = `id, display_name, email_enc, email_hash, phone_enc, phone_hash, email_verified_at,
  phone_verified_at, merged_into, erased_at, created_at, language`;

async function profileRow(sql: Sql, id: string): Promise<ProfileRow | null> {
  const rows = await sql.query<ProfileRow>(`select ${PROFILE_COLS} from guest_profiles where id = $1`, [id]);
  return rows[0] ?? null;
}

async function liveProfile(sql: Sql, id: string): Promise<ProfileRow> {
  const row = await profileRow(sql, id);
  if (!row || row.erased_at || row.merged_into) throw new Error("Guest profile not found.");
  return row;
}

async function checkinState(sql: Sql, reservation: StayPayload["reservation"]): Promise<CheckinState> {
  const state = q.emptyCheckin();
  const row = await checkinRow(sql, reservation.id);
  if (row) {
    state.completed = Boolean(row.completed_at);
    state.eta = row.eta;
    state.source = (row.source as CaptureSource) ?? null;
    state.celebration = (row.celebration as Celebration) ?? null;
    state.celebrationWhose = (row.celebration_whose as CelebrationWhose) ?? null;
    state.celebrationMonth = row.celebration_month === null ? null : Number(row.celebration_month);
    state.celebrationDay = row.celebration_day === null ? null : Number(row.celebration_day);
    state.party = parseParty(row.party);
    state.realEmailCaptured = Boolean(row.real_email_captured);
    const email = await decryptOrNull(row.service_email_enc);
    const phone = await decryptOrNull(row.service_phone_enc);
    state.verifiedEmail = email ? maskEmail(email) : null;
    state.verifiedPhone = phone ? maskPhone(phone) : null;
  }
  if (reservation.profileId) {
    const profile = await profileRow(sql, reservation.profileId);
    if (profile && !profile.erased_at) {
      state.consents = await currentConsents(sql, profile.id);
      const holidays = await sql.query<{ holiday: string }>(
        `select holiday from profile_holidays where profile_id = $1 order by holiday`,
        [profile.id],
      );
      state.holidays = holidays.map((h) => h.holiday);
      const stays = await sql.query<{ n: number }>(
        `select count(*)::int as n from reservations where profile_id = $1 and id <> $2`,
        [profile.id, reservation.id],
      );
      state.returningGuest = Number(stays[0]?.n ?? 0) > 0;
      if (!state.verifiedEmail) {
        const e = await decryptOrNull(profile.email_enc);
        state.verifiedEmail = e ? maskEmail(e) : null;
      }
      if (!state.verifiedPhone) {
        const p = await decryptOrNull(profile.phone_enc);
        state.verifiedPhone = p ? maskPhone(p) : null;
      }
    }
  }
  return state;
}

/** The guest stay page: offers (queries.stay) plus the check-in capture state. */
export async function stayPage(sql: Sql, token: string): Promise<StayPayload> {
  const payload = await q.stay(sql, token);
  if (payload.reservation.anonymized) throw new Error("This stay's details have been removed.");
  return { ...payload, checkin: await checkinState(sql, payload.reservation) };
}

async function requireStay(sql: Sql, token: string) {
  const today = await q.todayIso(sql);
  const reservation = await q.reservationByToken(sql, token, today);
  if (!reservation) throw new Error("This stay link is not valid.");
  if (reservation.anonymized) throw new Error("This stay's details have been removed.");
  return { reservation, today };
}

async function logStep(sql: Sql, reservationId: string, step: string, source: CaptureSource, once = true) {
  if (once) {
    const seen = await sql.query<{ n: number }>(
      `select count(*)::int as n from capture_events where reservation_id = $1 and step = $2`,
      [reservationId, step],
    );
    if (Number(seen[0]?.n ?? 0) > 0) return;
  }
  await sql`insert into capture_events (reservation_id, step, source) values (${reservationId}, ${step}, ${source})`;
}

/** Stay-only data is purged this long after departure (set on every check-in row). */
async function purgeOnFor(sql: Sql, departure: string) {
  const property = await q.loadProperty(sql);
  return q.addDays(departure, property.settings.serviceRetentionDays);
}

export async function startCapture(sql: Sql, token: string, source: CaptureSource) {
  const { reservation } = await requireStay(sql, token);
  const purgeOn = await purgeOnFor(sql, reservation.departure);
  await sql`
    insert into checkins (reservation_id, started_at, source, purge_on) values (${reservation.id}, now(), ${source}, ${purgeOn})
    on conflict (reservation_id) do update set
      started_at = coalesce(checkins.started_at, excluded.started_at),
      source = case when checkins.completed_at is null then excluded.source else checkins.source end
  `;
  await logStep(sql, reservation.id, "started", source);
  return { ok: true as const };
}

export async function captureStep(sql: Sql, token: string, step: "celebration" | "party", source: CaptureSource) {
  const { reservation } = await requireStay(sql, token);
  await logStep(sql, reservation.id, step, source);
  return { ok: true as const };
}

/* ------------------------------------------------------ contact + codes */

export type ContactChannel = "email" | "whatsapp";

function realDatabase() {
  return typeof process !== "undefined" && Boolean(process.env.DATABASE_URL?.trim());
}

export async function sendContactCode(
  sql: Sql,
  data: { token: string; channel: ContactChannel; value: string; source: CaptureSource },
) {
  const { reservation } = await requireStay(sql, data.token);
  if (reservation.status === "departed") throw new Error("This stay has ended.");
  const property = await q.loadProperty(sql);
  let normalized: string | null;
  if (data.channel === "email") {
    normalized = normalizeEmail(data.value);
    if (!normalized) throw new Error("That email address doesn't look right.");
    if (isRelayEmail(normalized)) {
      throw new Error("That's the booking site's relay inbox. Use your own email so the hotel can reach you.");
    }
  } else {
    normalized = normalizePhone(data.value, property.settings.market);
    if (!normalized) {
      throw new Error(
        property.settings.market === "EU"
          ? "Enter the number with its country code, e.g. +49 151 2345 6789."
          : "That number doesn't look right.",
      );
    }
    if (realDatabase()) {
      throw new Error("WhatsApp codes aren't switched on for this hotel yet. Use your email instead.");
    }
  }
  const recent = await sql.query<{ n: number }>(
    `select count(*)::int as n from contact_verifications
     where reservation_id = $1 and created_at > now() - interval '1 hour'`,
    [reservation.id],
  );
  if (Number(recent[0]?.n ?? 0) >= CODES_PER_HOUR) {
    throw new Error("Too many codes requested. Try again in an hour, or ask the front desk.");
  }
  const id = q.nid("cv");
  const code = randomCode();
  await sql`
    insert into contact_verifications (id, reservation_id, channel, value_enc, value_hash, code_hash, expires_at)
    values (
      ${id}, ${reservation.id}, ${data.channel}, ${await encrypt(normalized)}, ${await blindIndex(normalized)},
      ${await blindIndex(`code:${id}:${code}`)}, now() + make_interval(mins => ${CODE_TTL_MINUTES})
    )
  `;
  await logStep(sql, reservation.id, "code_sent", data.source);

  let devCode: string | undefined;
  if (data.channel === "email") {
    const body = simpleEmail({
      hotel: property.name,
      heading: `Your code is ${code}`,
      lines: [
        `Enter it on your check-in page to confirm this is your email. It works for ${CODE_TTL_MINUTES} minutes.`,
        "If you didn't ask for this, ignore this email.",
      ],
    });
    const sent = await sendMail({
      to: normalized,
      subject: `${code} is your ${property.name} check-in code`,
      html: body.html,
      text: body.text,
      from: property.settings.senderEmail,
      fromName: property.name,
      stream: "outbound",
      tag: "verify-contact",
    });
    if (!sent.delivered) devCode = code;
  } else {
    devCode = code; // development only (production refused above until a WhatsApp provider is wired)
  }
  return {
    verificationId: id,
    sentTo: data.channel === "email" ? maskEmail(normalized) : maskPhone(normalized),
    devCode,
  };
}

export async function verifyContactCode(
  sql: Sql,
  data: { token: string; verificationId: string; code: string; source: CaptureSource },
) {
  const { reservation } = await requireStay(sql, data.token);
  const rows = await sql.query<{
    id: string;
    channel: ContactChannel;
    value_enc: string;
    code_hash: string;
    attempts: number;
    expired: boolean;
    verified_at: string | Date | null;
  }>(
    `select id, channel, value_enc, code_hash, attempts, (expires_at <= now()) as expired, verified_at
     from contact_verifications where id = $1 and reservation_id = $2`,
    [data.verificationId, reservation.id],
  );
  const row = rows[0];
  if (!row) throw new Error("Send a new code.");
  if (row.verified_at) throw new Error("Already confirmed.");
  if (row.expired) throw new Error("That code has expired. Send a new one.");
  if (Number(row.attempts) >= CODE_MAX_ATTEMPTS) throw new Error("Too many tries. Send a new code.");
  // A wrong code must still count: return (so the transaction commits the
  // attempt) instead of throwing (which would roll the increment back).
  await sql`update contact_verifications set attempts = attempts + 1 where id = ${row.id}`;
  const given = data.code.replace(/\D/g, "");
  if ((await blindIndex(`code:${row.id}:${given}`)) !== row.code_hash) {
    const left = CODE_MAX_ATTEMPTS - Number(row.attempts) - 1;
    return {
      ok: false as const,
      message: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many tries. Send a new code.",
    };
  }
  await sql`update contact_verifications set verified_at = now() where id = ${row.id}`;
  const purgeOn = await purgeOnFor(sql, reservation.departure);
  if (row.channel === "email") {
    await sql`
      insert into checkins (reservation_id, source, service_email_enc, contact_verified_at, contact_channel, real_email_captured, purge_on)
      values (${reservation.id}, ${data.source}, ${row.value_enc}, now(), 'email', true, ${purgeOn})
      on conflict (reservation_id) do update set
        service_email_enc = excluded.service_email_enc,
        contact_verified_at = now(),
        real_email_captured = true,
        contact_channel = case when checkins.service_phone_enc is not null then 'both' else 'email' end
    `;
    // A verified own address: the guest is reachable directly (service messages only).
    await sql`update reservations set email_kind = 'real' where id = ${reservation.id}`;
    await sql`insert into events (reservation_id, kind) values (${reservation.id}, 'email_captured')`;
  } else {
    await sql`
      insert into checkins (reservation_id, source, service_phone_enc, contact_verified_at, contact_channel, purge_on)
      values (${reservation.id}, ${data.source}, ${row.value_enc}, now(), 'whatsapp', ${purgeOn})
      on conflict (reservation_id) do update set
        service_phone_enc = excluded.service_phone_enc,
        contact_verified_at = now(),
        contact_channel = case when checkins.service_email_enc is not null then 'both' else 'whatsapp' end
    `;
    await sql`update reservations set phone_kind = 'valid' where id = ${reservation.id}`;
  }
  const ticket = randomToken(18);
  await sql`
    update checkins set consent_ticket_hash = ${await sha256(ticket)},
      consent_ticket_expires_at = now() + interval '30 minutes'
    where reservation_id = ${reservation.id}
  `;
  await logStep(sql, reservation.id, "verified", data.source);
  await audit(sql, guestActor(reservation.id), {
    action: "capture.verified",
    targetType: "reservation",
    targetId: reservation.id,
    detail: { channel: row.channel },
  });
  const plain = await decryptOrNull(row.value_enc);
  return {
    ok: true as const,
    ticket,
    channel: row.channel,
    masked: plain ? (row.channel === "email" ? maskEmail(plain) : maskPhone(plain)) : "",
  };
}

/* ------------------------------------------------------------- complete */

export type CaptureInput = {
  token: string;
  source: CaptureSource;
  /** from verifyContactCode; required to record any consent */
  ticket: string | null;
  eta: string;
  celebration: { kind: Celebration; whose: CelebrationWhose; month: number | null; day: number | null } | null;
  party: PartyMember[];
  consents: Consents;
  holidays: string[];
};

function cleanParty(list: PartyMember[]): PartyMember[] {
  const out: PartyMember[] = [];
  for (const m of list.slice(0, 8)) {
    if (m.relation === "child") {
      if (["0-2", "3-12", "13-17"].includes(m.ageBand)) out.push({ relation: "child", ageBand: m.ageBand as AgeBand });
    } else {
      const name = (m.firstName ?? "").trim().slice(0, 40);
      if (name) out.push({ relation: m.relation, firstName: name });
    }
  }
  return out;
}

function validDay(month: number | null, day: number | null) {
  if (!month || month < 1 || month > 12) return { month: null, day: null };
  const max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return { month, day: day && day >= 1 && day <= max ? day : null };
}

async function matchOrCreateProfile(
  sql: Sql,
  reservation: StayPayload["reservation"],
  contacts: { email: string | null; phone: string | null; emailEnc: string | null; phoneEnc: string | null },
) {
  const emailHash = contacts.email ? await blindIndex(contacts.email) : null;
  const phoneHash = contacts.phone ? await blindIndex(contacts.phone) : null;
  const find = async (col: "email_hash" | "phone_hash", hash: string | null) => {
    if (!hash) return null;
    const rows = await sql.query<{ id: string }>(
      `select id from guest_profiles where ${col} = $1 and merged_into is null and erased_at is null`,
      [hash],
    );
    return rows[0]?.id ?? null;
  };
  const byEmail = await find("email_hash", emailHash);
  const byPhone = await find("phone_hash", phoneHash);
  let profileId = byEmail ?? byPhone ?? reservation.profileId ?? null;
  let created = false;
  if (!profileId) {
    profileId = q.nid("gp");
    created = true;
    await sql`
      insert into guest_profiles (id, display_name, email_enc, email_hash, email_verified_at, phone_enc, phone_hash, phone_verified_at)
      values (
        ${profileId}, ${reservation.guestName},
        ${contacts.emailEnc}, ${emailHash}, ${emailHash ? new Date().toISOString() : null},
        ${contacts.phoneEnc}, ${phoneHash}, ${phoneHash ? new Date().toISOString() : null}
      )
    `;
  } else {
    // Add a newly verified contact the profile lacks — unless another live profile owns it.
    if (emailHash && !byEmail) {
      await sql`
        update guest_profiles set email_enc = ${contacts.emailEnc}, email_hash = ${emailHash},
          email_verified_at = now(), updated_at = now()
        where id = ${profileId} and email_hash is null
      `;
    }
    if (phoneHash && !byPhone) {
      await sql`
        update guest_profiles set phone_enc = ${contacts.phoneEnc}, phone_hash = ${phoneHash},
          phone_verified_at = now(), updated_at = now()
        where id = ${profileId} and phone_hash is null
      `;
    }
  }
  const duplicateOf = byEmail && byPhone && byEmail !== byPhone ? byPhone : null;
  return { profileId, created, duplicateOf, emailHash, phoneHash };
}

async function recordConsent(
  sql: Sql,
  data: {
    profileId: string;
    purpose: ConsentPurpose;
    granted: boolean;
    source: "online_checkin" | "desk_tablet" | "qr" | "preference_centre" | "staff" | "erasure";
    hotel: string;
    market: string;
    reservationId?: string | null;
  },
) {
  await sql`
    insert into consent_events (profile_id, purpose, granted, wording_version, wording, source, reservation_id)
    values (
      ${data.profileId}, ${data.purpose}, ${data.granted}, ${CONSENT_VERSION},
      ${consentWording(data.purpose, data.hotel, marketFor(data.market))}, ${data.source}, ${data.reservationId ?? null}
    )
  `;
}

const CONSENT_SOURCE: Record<CaptureSource, "online_checkin" | "desk_tablet" | "qr"> = {
  online: "online_checkin",
  desk_tablet: "desk_tablet",
  qr: "qr",
};

/** Copy what the guest shared on this stay into their profile (profile_memory only). */
async function rememberOnProfile(
  sql: Sql,
  profileId: string,
  stay: { celebration: CaptureInput["celebration"]; party: PartyMember[]; holidays: string[] },
) {
  const companions = await sql.query<{ id: string; relation: string; first_name: string | null; age_band: string | null }>(
    `select id, relation, first_name, age_band from companions where profile_id = $1`,
    [profileId],
  );
  const ids = new Map<string, string>();
  for (const c of companions) ids.set(`${c.relation}|${(c.first_name ?? c.age_band ?? "").toLowerCase()}`, c.id);
  for (const m of stay.party) {
    const key = m.relation === "child" ? `child|${m.ageBand}` : `${m.relation}|${m.firstName.toLowerCase()}`;
    if (ids.has(key)) continue;
    const id = q.nid("cmp");
    await sql`
      insert into companions (id, profile_id, relation, first_name, age_band)
      values (${id}, ${profileId}, ${m.relation}, ${m.relation === "child" ? null : m.firstName},
              ${m.relation === "child" ? m.ageBand : null})
    `;
    ids.set(key, id);
  }
  const c = stay.celebration;
  if (c && c.month && c.kind !== "other") {
    const kind = c.kind === "honeymoon" ? "anniversary" : c.kind;
    let companionId: string | null = null;
    if (c.whose === "partner") {
      const partner = [...ids.entries()].find(([k]) => k.startsWith("partner|"));
      companionId = partner?.[1] ?? null;
    }
    const exists = await sql.query<{ n: number }>(
      `select count(*)::int as n from occasions
       where profile_id = $1 and kind = $2 and month = $3 and coalesce(day, 0) = coalesce($4::int, 0)
         and coalesce(companion_id, '') = coalesce($5::text, '')`,
      [profileId, kind, c.month, c.day, companionId],
    );
    if (Number(exists[0]?.n ?? 0) === 0) {
      await sql`
        insert into occasions (id, profile_id, companion_id, kind, label, month, day, source)
        values (${q.nid("occ")}, ${profileId}, ${companionId}, ${kind},
                ${c.whose === "someone" ? "Someone travelling with them" : c.kind === "honeymoon" ? "Wedding anniversary" : null},
                ${c.month}, ${c.day}, 'guest')
      `;
    }
  }
  for (const h of stay.holidays) {
    if (!isHolidayId(h)) continue;
    await sql`insert into profile_holidays (profile_id, holiday) values (${profileId}, ${h}) on conflict do nothing`;
  }
}

export async function completeCapture(sql: Sql, input: CaptureInput) {
  const { reservation } = await requireStay(sql, input.token);
  const property = await q.loadProperty(sql);
  const row = await checkinRow(sql, reservation.id);
  const email = await decryptOrNull(row?.service_email_enc);
  const phone = await decryptOrNull(row?.service_phone_enc);
  const wants = input.consents;
  if (wants.marketing_email && !email) throw new Error("Confirm your email first to get offers by email.");
  if (wants.marketing_whatsapp && !phone) throw new Error("Confirm your WhatsApp number first.");
  if (wants.profile_memory && !email && !phone) throw new Error("Confirm an email or number first, so we can find your details next time.");

  const party = cleanParty(input.party);
  const when = input.celebration ? validDay(input.celebration.month, input.celebration.day) : { month: null, day: null };
  const celebration = input.celebration ? { ...input.celebration, ...when } : null;
  const eta = /^\d{2}:\d{2}$/.test(input.eta) ? input.eta : null;
  const purgeOn = q.addDays(reservation.departure, property.settings.serviceRetentionDays);

  await sql`
    insert into checkins (
      reservation_id, eta, completed_at, source, celebration, celebration_whose, celebration_month,
      celebration_day, party, purge_on, started_at
    ) values (
      ${reservation.id}, ${eta}, now(), ${input.source}, ${celebration?.kind ?? null}, ${celebration?.whose ?? null},
      ${celebration?.month ?? null}, ${celebration?.day ?? null}, ${JSON.stringify(party)}::jsonb, ${purgeOn}, now()
    )
    on conflict (reservation_id) do update set
      eta = excluded.eta,
      completed_at = coalesce(checkins.completed_at, excluded.completed_at),
      source = coalesce(checkins.source, excluded.source),
      celebration = excluded.celebration,
      celebration_whose = excluded.celebration_whose,
      celebration_month = excluded.celebration_month,
      celebration_day = excluded.celebration_day,
      party = excluded.party,
      purge_on = excluded.purge_on,
      started_at = coalesce(checkins.started_at, excluded.started_at)
  `;

  let profileId: string | null = reservation.profileId ?? null;
  let prefToken: string | null = null;
  let created = false;
  const anyConsent = CONSENT_PURPOSES.some((p) => wants[p]);
  if (anyConsent) {
    const t = await sql.query<{ ok: boolean }>(
      `select (consent_ticket_hash = $2 and consent_ticket_expires_at > now()) as ok
       from checkins where reservation_id = $1`,
      [reservation.id, input.ticket ? await sha256(input.ticket) : ""],
    );
    if (!t[0]?.ok) throw new Error("Please confirm your email or number again to save these choices.");
    await sql`update checkins set consent_ticket_hash = null, consent_ticket_expires_at = null where reservation_id = ${reservation.id}`;
  }
  if (anyConsent) {
    const match = await matchOrCreateProfile(sql, reservation, {
      email: email ? normalizeEmail(email) : null,
      phone,
      emailEnc: row?.service_email_enc ?? null,
      phoneEnc: row?.service_phone_enc ?? null,
    });
    profileId = match.profileId;
    created = match.created;
    await sql`update reservations set profile_id = ${profileId} where id = ${reservation.id}`;
    const now = await currentConsents(sql, profileId);
    for (const purpose of CONSENT_PURPOSES) {
      if (wants[purpose] && !now[purpose]) {
        await recordConsent(sql, {
          profileId,
          purpose,
          granted: true,
          source: CONSENT_SOURCE[input.source],
          hotel: property.name,
          market: property.settings.market,
          reservationId: reservation.id,
        });
        await audit(sql, guestActor(reservation.id), {
          action: "consent.change",
          targetType: "profile",
          targetId: profileId,
          detail: { purpose, granted: true, source: CONSENT_SOURCE[input.source] },
        });
      }
    }
    // A fresh, explicit opt-in lifts an earlier suppression for this contact.
    if (wants.marketing_email || wants.marketing_whatsapp) {
      const hashes = [match.emailHash, match.phoneHash].filter((h): h is string => Boolean(h));
      for (const h of hashes) await sql`delete from suppressions where value_hash = ${h}`;
    }
    if (wants.profile_memory || now.profile_memory) {
      await rememberOnProfile(sql, profileId, { celebration, party, holidays: input.holidays });
    }
    prefToken = randomToken(18);
    await sql`
      update guest_profiles set pref_token_hash = ${await sha256(prefToken)}, updated_at = now() where id = ${profileId}
    `;
    if (created) {
      await audit(sql, guestActor(reservation.id), { action: "profile.created", targetType: "profile", targetId: profileId });
    }
    if (match.duplicateOf) {
      await audit(sql, { kind: "system", label: "Profile matching" }, {
        action: "profile.duplicate_suspected",
        targetType: "profile",
        targetId: profileId,
        detail: { other: match.duplicateOf, reason: "email and phone match different profiles" },
      });
    }
    await logStep(sql, reservation.id, "consented", input.source);
  }
  await logStep(sql, reservation.id, "completed", input.source);
  // On the desk tablet the link would stay on a shared screen; the guest can
  // have it emailed from their own stay page instead.
  return {
    completed: true as const,
    profileId,
    prefToken: input.source === "desk_tablet" ? null : prefToken,
    newProfile: created,
  };
}

/* ---------------------------------------------------- preference centre */

export type ProfileView = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  consents: Consents;
  wording: Record<ConsentPurpose, string>;
  occasions: { id: string; kind: string; label: string | null; month: number; day: number | null; companion: string | null; source: string }[];
  companions: { id: string; relation: CompanionRelation; firstName: string | null; ageBand: AgeBand | null }[];
  holidays: string[];
  stays: { reservationId: string; arrival: string; departure: string; roomType: string; spentCents: number }[];
  createdAt: string;
};

export async function profileView(sql: Sql, profileId: string): Promise<ProfileView> {
  const p = await liveProfile(sql, profileId);
  const property = await q.loadProperty(sql);
  const market = marketFor(property.settings.market);
  const [consents, occasions, companions, holidays, stays] = await Promise.all([
    currentConsents(sql, profileId),
    sql.query<{ id: string; kind: string; label: string | null; month: number; day: number | null; first_name: string | null; relation: string | null; source: string }>(
      `select o.id, o.kind, o.label, o.month, o.day, c.first_name, c.relation, o.source
       from occasions o left join companions c on c.id = o.companion_id
       where o.profile_id = $1 order by o.month, o.day nulls last`,
      [profileId],
    ),
    sql.query<{ id: string; relation: CompanionRelation; first_name: string | null; age_band: AgeBand | null }>(
      `select id, relation, first_name, age_band from companions where profile_id = $1 order by created_at`,
      [profileId],
    ),
    sql.query<{ holiday: string }>(`select holiday from profile_holidays where profile_id = $1 order by holiday`, [profileId]),
    sql.query<{ id: string; arrival: string; departure: string; room: string; cents: number }>(
      `select r.id, r.arrival::text as arrival, r.departure::text as departure, rt.name as room,
         coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.status in ('paid','fulfilled')), 0)::int as cents
       from reservations r join room_types rt on rt.id = r.room_type_id
       where r.profile_id = $1 order by r.arrival desc`,
      [profileId],
    ),
  ]);
  const email = await decryptOrNull(p.email_enc);
  const phone = await decryptOrNull(p.phone_enc);
  return {
    id: p.id,
    name: p.display_name,
    email: email ? maskEmail(email) : null,
    phone: phone ? maskPhone(phone) : null,
    consents,
    wording: {
      marketing_email: consentWording("marketing_email", property.name, market),
      marketing_whatsapp: consentWording("marketing_whatsapp", property.name, market),
      profile_memory: consentWording("profile_memory", property.name, market),
    },
    occasions: occasions.map((o) => ({
      id: o.id,
      kind: o.kind,
      label: o.label,
      month: Number(o.month),
      day: o.day === null ? null : Number(o.day),
      companion: o.first_name ?? (o.relation === "child" ? "a child" : null),
      source: o.source,
    })),
    companions: companions.map((c) => ({ id: c.id, relation: c.relation, firstName: c.first_name, ageBand: c.age_band })),
    holidays: holidays.map((h) => h.holiday),
    stays: stays.map((s) => ({
      reservationId: s.id,
      arrival: s.arrival,
      departure: s.departure,
      roomType: s.room,
      spentCents: Number(s.cents),
    })),
    createdAt: iso(p.created_at),
  };
}

export async function updateConsents(
  sql: Sql,
  data: {
    profileId: string;
    changes: Partial<Consents>;
    source: "preference_centre" | "staff";
    actor: Actor;
  },
) {
  const p = await liveProfile(sql, data.profileId);
  const property = await q.loadProperty(sql);
  const now = await currentConsents(sql, p.id);
  for (const purpose of CONSENT_PURPOSES) {
    const want = data.changes[purpose];
    if (want === undefined || want === now[purpose]) continue;
    if (want && purpose === "marketing_email" && !p.email_enc) throw new Error("No confirmed email on this profile.");
    if (want && purpose === "marketing_whatsapp" && !p.phone_enc) throw new Error("No confirmed WhatsApp number on this profile.");
    if (want && data.source === "staff") {
      throw new Error("Only the guest can opt in. Staff can record a withdrawal.");
    }
    await recordConsent(sql, {
      profileId: p.id,
      purpose,
      granted: want,
      source: data.source,
      hotel: property.name,
      market: property.settings.market,
    });
    await audit(sql, data.actor, {
      action: "consent.change",
      targetType: "profile",
      targetId: p.id,
      detail: { purpose, granted: want, source: data.source },
    });
    if (purpose === "profile_memory" && !want) {
      // The basis for keeping dates, companions and holidays is gone: delete them now.
      await sql`delete from occasions where profile_id = ${p.id}`;
      await sql`delete from companions where profile_id = ${p.id}`;
      await sql`delete from profile_holidays where profile_id = ${p.id}`;
    }
  }
  return currentConsents(sql, p.id);
}

async function requireMemory(sql: Sql, profileId: string) {
  const c = await currentConsents(sql, profileId);
  if (!c.profile_memory) throw new Error("This guest hasn't agreed to have dates and preferences remembered.");
}

export async function addOccasion(
  sql: Sql,
  data: {
    profileId: string;
    kind: "birthday" | "anniversary" | "achievement" | "other";
    label: string | null;
    month: number;
    day: number | null;
    companionId: string | null;
    source: "guest" | "staff";
    actor: Actor;
  },
) {
  await liveProfile(sql, data.profileId);
  await requireMemory(sql, data.profileId);
  const when = validDay(data.month, data.day);
  if (!when.month) throw new Error("Pick a month.");
  if (data.companionId) {
    const c = await sql.query<{ relation: string }>(
      `select relation from companions where id = $1 and profile_id = $2`,
      [data.companionId, data.profileId],
    );
    if (!c[0]) throw new Error("Companion not found.");
    if (c[0].relation === "child" && data.kind === "birthday") {
      throw new Error("Children's birthdays aren't stored. Keep it to the age band.");
    }
  }
  const id = q.nid("occ");
  await sql`
    insert into occasions (id, profile_id, companion_id, kind, label, month, day, source)
    values (${id}, ${data.profileId}, ${data.companionId}, ${data.kind}, ${data.label?.trim().slice(0, 60) || null},
            ${when.month}, ${when.day}, ${data.source})
  `;
  await audit(sql, data.actor, { action: "occasion.add", targetType: "profile", targetId: data.profileId, detail: { kind: data.kind } });
  return { id };
}

export async function removeOccasion(sql: Sql, profileId: string, occasionId: string) {
  await sql`delete from occasions where id = ${occasionId} and profile_id = ${profileId}`;
  return { ok: true as const };
}

export async function removeCompanion(sql: Sql, profileId: string, companionId: string) {
  await sql`delete from companions where id = ${companionId} and profile_id = ${profileId}`;
  return { ok: true as const };
}

export async function setHolidays(sql: Sql, profileId: string, holidays: string[]) {
  await liveProfile(sql, profileId);
  await requireMemory(sql, profileId);
  await sql`delete from profile_holidays where profile_id = ${profileId}`;
  for (const h of holidays) {
    if (isHolidayId(h)) await sql`insert into profile_holidays (profile_id, holiday) values (${profileId}, ${h}) on conflict do nothing`;
  }
  return { ok: true as const };
}

/* ------------------------------------------------------ export + erase */

export async function exportProfile(sql: Sql, profileId: string) {
  const p = await liveProfile(sql, profileId);
  const view = await profileView(sql, profileId);
  const property = await q.loadProperty(sql);
  const ledger = await sql.query<{ purpose: string; granted: boolean; wording_version: string; wording: string; source: string; at: string | Date }>(
    `select purpose, granted, wording_version, wording, source, at from consent_events where profile_id = $1 order by at, id`,
    [profileId],
  );
  const orders = await sql.query<{ arrival: string; offer: string; amount_cents: number; status: string; created_at: string | Date }>(
    `select r.arrival::text as arrival, f.name as offer, o.amount_cents, o.status, o.created_at
     from orders o join reservations r on r.id = o.reservation_id join offers f on f.id = o.offer_id
     where r.profile_id = $1 order by o.created_at`,
    [profileId],
  );
  return {
    exportedAt: new Date().toISOString(),
    controller: { hotel: property.name, city: property.city },
    profile: {
      name: p.display_name,
      email: await decryptOrNull(p.email_enc),
      emailVerifiedAt: p.email_verified_at ? iso(p.email_verified_at) : null,
      phone: await decryptOrNull(p.phone_enc),
      phoneVerifiedAt: p.phone_verified_at ? iso(p.phone_verified_at) : null,
      createdAt: iso(p.created_at),
    },
    consents: view.consents,
    consentHistory: ledger.map((l) => ({ ...l, at: iso(l.at) })),
    occasions: view.occasions.map(({ kind, label, month, day, companion }) => ({ kind, label, month, day, companion })),
    companions: view.companions.map(({ relation, firstName, ageBand }) => ({ relation, firstName, ageBand })),
    holidays: view.holidays.map((h) => (isHolidayId(h) ? HOLIDAYS[h].label : h)),
    stays: view.stays.map(({ arrival, departure, roomType }) => ({ arrival, departure, roomType })),
    purchases: orders.map((o) => ({ ...o, created_at: iso(o.created_at) })),
  };
}

async function anonymizeStays(sql: Sql, where: { profileId?: string; reservationId?: string }) {
  const ids = await sql.query<{ id: string; guest_name: string }>(
    where.profileId
      ? `select id, guest_name from reservations where profile_id = $1`
      : `select id, guest_name from reservations where id = $1`,
    [where.profileId ?? where.reservationId],
  );
  for (const r of ids) {
    await sql`
      update reservations set guest_name = 'Erased guest', notes = '', email_kind = 'none', phone_kind = 'none',
        anonymized_at = coalesce(anonymized_at, now())
      where id = ${r.id}
    `;
    await sql`
      update checkins set service_email_enc = null, service_phone_enc = null, party = '[]'::jsonb,
        celebration = null, celebration_whose = null, celebration_month = null, celebration_day = null
      where reservation_id = ${r.id}
    `;
    await sql`delete from contact_verifications where reservation_id = ${r.id}`;
    await sql`update messages set subject = 'Message to guest (details removed)' where reservation_id = ${r.id}`;
  }
  return ids.length;
}

export async function eraseProfile(sql: Sql, profileId: string, actor: Actor, source: "staff" | "guest") {
  const p = await liveProfile(sql, profileId);
  const property = await q.loadProperty(sql);
  // Keep only hashes, so a later booking can't quietly put this person back on a list.
  for (const h of [p.email_hash, p.phone_hash]) {
    if (h) {
      await sql`
        insert into suppressions (value_hash, reason) values (${h}, 'erasure')
        on conflict (property_id, value_hash) do update set reason = 'erasure', at = now()
      `;
    }
  }
  const now = await currentConsents(sql, profileId);
  for (const purpose of CONSENT_PURPOSES) {
    if (now[purpose]) {
      await recordConsent(sql, { profileId, purpose, granted: false, source: "erasure", hotel: property.name, market: property.settings.market });
    }
  }
  await sql`delete from occasions where profile_id = ${profileId}`;
  await sql`delete from companions where profile_id = ${profileId}`;
  await sql`delete from profile_holidays where profile_id = ${profileId}`;
  const stays = await anonymizeStays(sql, { profileId });
  await sql`
    update guest_profiles set display_name = 'Erased guest', email_enc = null, email_hash = null,
      email_verified_at = null, phone_enc = null, phone_hash = null, phone_verified_at = null,
      pref_token_hash = null, erased_at = now(), updated_at = now()
    where id = ${profileId}
  `;
  await audit(sql, actor, {
    action: source === "guest" ? "guest.erase" : "profile.erase",
    targetType: "profile",
    targetId: profileId,
    detail: { stays },
  });
  return { erased: true as const, stays };
}

export async function eraseReservationGuest(sql: Sql, reservationId: string, actor: Actor) {
  const rows = await sql.query<{ profile_id: string | null }>(`select profile_id from reservations where id = $1`, [reservationId]);
  if (!rows[0]) throw new Error("Reservation not found.");
  if (rows[0].profile_id) throw new Error("This stay belongs to a guest profile. Erase the profile instead.");
  await anonymizeStays(sql, { reservationId });
  await audit(sql, actor, { action: "reservation.erase", targetType: "reservation", targetId: reservationId });
  return { ok: true as const };
}

/* --------------------------------------------------------- staff views */

export type ProfileListRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stays: number;
  lastArrival: string | null;
  spentCents: number;
  consents: Consents;
  nextOccasion: { label: string; date: string } | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function nextOccurrence(month: number, day: number | null, today: string): string {
  const y = Number(today.slice(0, 4));
  const d = day ?? 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  let candidate = `${y}-${pad(month)}-${pad(d)}`;
  // Feb 29 in a non-leap year falls back to Feb 28.
  if (month === 2 && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) candidate = `${y}-02-28`;
  if (candidate < today.slice(0, 10)) candidate = `${y + 1}-${pad(month)}-${pad(month === 2 && d === 29 ? 28 : d)}`;
  return candidate;
}

export function occasionLabel(o: { kind: string; label: string | null; companion: string | null }) {
  const what = o.kind === "birthday" ? "Birthday" : o.kind === "anniversary" ? "Anniversary" : o.kind === "achievement" ? "Achievement" : o.label ?? "Occasion";
  return o.companion ? `${o.companion}'s ${what.toLowerCase()}` : what;
}

export function monthDay(month: number, day: number | null) {
  return day ? `${MONTHS[month - 1]} ${day}` : MONTHS[month - 1]!;
}

export async function listProfiles(
  sql: Sql,
  opts: { search?: string; filter?: "all" | "marketable" | "returning" | "occasions" } = {},
): Promise<{ rows: ProfileListRow[]; total: number }> {
  const today = await q.todayIso(sql);
  const search = opts.search?.trim() ?? "";
  let hash: string | null = null;
  if (search.includes("@")) {
    const e = normalizeEmail(search);
    hash = e ? await blindIndex(e) : null;
  } else if (/^\+?[\d\s()-]{8,}$/.test(search)) {
    const property = await q.loadProperty(sql);
    const ph = normalizePhone(search, property.settings.market);
    hash = ph ? await blindIndex(ph) : null;
  }
  const rows = await sql.query<{
    id: string;
    display_name: string;
    email_enc: string | null;
    phone_enc: string | null;
    stays: number;
    last_arrival: string | null;
    cents: number;
  }>(
    `select p.id, p.display_name, p.email_enc, p.phone_enc,
       count(r.id)::int as stays, max(r.arrival)::text as last_arrival,
       coalesce((select sum(o.amount_cents) from orders o join reservations r2 on r2.id = o.reservation_id
                 where r2.profile_id = p.id and o.status in ('paid','fulfilled')), 0)::int as cents
     from guest_profiles p left join reservations r on r.profile_id = p.id
     where p.merged_into is null and p.erased_at is null
       and ($1::text is null or p.email_hash = $1 or p.phone_hash = $1)
       and ($2::text = '' or $1::text is not null or p.display_name ilike '%' || $2 || '%')
     group by p.id
     order by max(r.arrival) desc nulls last, p.created_at desc
     limit 300`,
    [hash, hash ? "" : search],
  );
  const consentRows = await sql.query<{ profile_id: string; purpose: ConsentPurpose; granted: boolean }>(
    `select distinct on (profile_id, purpose) profile_id, purpose, granted
     from consent_events order by profile_id, purpose, at desc, id desc`,
  );
  const consents = new Map<string, Consents>();
  for (const c of consentRows) {
    const cur = consents.get(c.profile_id) ?? { ...NO_CONSENTS };
    cur[c.purpose] = Boolean(c.granted);
    consents.set(c.profile_id, cur);
  }
  const occ = await sql.query<{ profile_id: string; kind: string; label: string | null; month: number; day: number | null; first_name: string | null }>(
    `select o.profile_id, o.kind, o.label, o.month, o.day, c.first_name
     from occasions o left join companions c on c.id = o.companion_id`,
  );
  const next = new Map<string, { label: string; date: string }>();
  for (const o of occ) {
    const date = nextOccurrence(Number(o.month), o.day === null ? null : Number(o.day), today);
    const cur = next.get(o.profile_id);
    if (!cur || date < cur.date) next.set(o.profile_id, { label: occasionLabel({ kind: o.kind, label: o.label, companion: o.first_name }), date });
  }
  const out: ProfileListRow[] = [];
  for (const r of rows) {
    const c = consents.get(r.id) ?? { ...NO_CONSENTS };
    const n = next.get(r.id) ?? null;
    const row: ProfileListRow = {
      id: r.id,
      name: r.display_name,
      email: r.email_enc ? maskEmail((await decryptOrNull(r.email_enc)) ?? "?@?") : null,
      phone: r.phone_enc ? maskPhone((await decryptOrNull(r.phone_enc)) ?? "00") : null,
      stays: Number(r.stays),
      lastArrival: r.last_arrival,
      spentCents: Number(r.cents),
      consents: c,
      nextOccasion: n,
    };
    if (opts.filter === "marketable" && !(c.marketing_email || c.marketing_whatsapp)) continue;
    if (opts.filter === "returning" && row.stays < 2) continue;
    if (opts.filter === "occasions" && !(n && q.daysBetween(today, n.date) <= 60)) continue;
    out.push(row);
  }
  return { rows: out, total: rows.length };
}

export async function profileDetail(sql: Sql, profileId: string) {
  const view = await profileView(sql, profileId);
  const today = await q.todayIso(sql);
  const ledger = await sql.query<{ id: number; purpose: string; granted: boolean; source: string; wording: string; at: string | Date }>(
    `select id, purpose, granted, source, wording, at from consent_events where profile_id = $1 order by at desc, id desc`,
    [profileId],
  );
  const dupes = await sql.query<{ id: string; display_name: string; stays: number }>(
    `select p.id, p.display_name, (select count(*)::int from reservations r where r.profile_id = p.id) as stays
     from guest_profiles p
     where p.id <> $1 and p.merged_into is null and p.erased_at is null
       and lower(p.display_name) = lower((select display_name from guest_profiles where id = $1))
     limit 5`,
    [profileId],
  );
  const flagged = await sql.query<{ other: string }>(
    `select detail->>'other' as other from audit_log
     where action = 'profile.duplicate_suspected' and target_id = $1`,
    [profileId],
  );
  const flaggedIds = flagged.map((f) => f.other).filter((id) => id && !dupes.some((d) => d.id === id));
  const flaggedRows = flaggedIds.length
    ? await sql.query<{ id: string; display_name: string; stays: number }>(
        `select p.id, p.display_name, (select count(*)::int from reservations r where r.profile_id = p.id) as stays
         from guest_profiles p where p.id = any($1::text[]) and p.merged_into is null and p.erased_at is null`,
        [`{${flaggedIds.join(",")}}`],
      )
    : [];
  return {
    ...view,
    upcoming: view.occasions
      .map((o) => ({ ...o, next: nextOccurrence(o.month, o.day, today) }))
      .sort((a, b) => a.next.localeCompare(b.next)),
    ledger: ledger.map((l) => ({ id: Number(l.id), purpose: l.purpose, granted: l.granted, source: l.source, wording: l.wording, at: iso(l.at) })),
    duplicates: [...dupes, ...flaggedRows].map((d) => ({ id: d.id, name: d.display_name, stays: Number(d.stays) })),
    today,
  };
}

export async function revealContact(sql: Sql, profileId: string) {
  const p = await liveProfile(sql, profileId);
  return { email: await decryptOrNull(p.email_enc), phone: await decryptOrNull(p.phone_enc) };
}

/**
 * Merge `mergeId` into `keepId`. Stays, occasions, companions and holidays move;
 * consent history is copied (the ledger is append-only) with original times, so
 * the kept profile's current state is the latest decision across both.
 */
export async function mergeProfiles(sql: Sql, keepId: string, mergeId: string, actor: Actor) {
  if (keepId === mergeId) throw new Error("Pick two different profiles.");
  const keep = await liveProfile(sql, keepId);
  const gone = await liveProfile(sql, mergeId);
  await sql`update reservations set profile_id = ${keepId} where profile_id = ${mergeId}`;
  await sql`update occasions set profile_id = ${keepId} where profile_id = ${mergeId}`;
  await sql`update companions set profile_id = ${keepId} where profile_id = ${mergeId}`;
  await sql`
    insert into profile_holidays (profile_id, holiday)
    select ${keepId}, holiday from profile_holidays where profile_id = ${mergeId}
    on conflict do nothing
  `;
  await sql`delete from profile_holidays where profile_id = ${mergeId}`;
  await sql`
    insert into consent_events (profile_id, purpose, granted, wording_version, wording, source, reservation_id, at)
    select ${keepId}, purpose, granted, wording_version, wording, source, reservation_id, at
    from consent_events where profile_id = ${mergeId}
  `;
  // Free the merged profile's contacts first (unique per hotel), then give the
  // kept profile any it lacks.
  await sql`
    update guest_profiles set merged_into = ${keepId}, email_enc = null, email_hash = null, phone_enc = null,
      phone_hash = null, pref_token_hash = null, updated_at = now()
    where id = ${mergeId}
  `;
  if (!keep.email_hash && gone.email_hash) {
    await sql`
      update guest_profiles set email_enc = ${gone.email_enc}, email_hash = ${gone.email_hash},
        email_verified_at = ${gone.email_verified_at ? iso(gone.email_verified_at) : null}, updated_at = now()
      where id = ${keepId}
    `;
  }
  if (!keep.phone_hash && gone.phone_hash) {
    await sql`
      update guest_profiles set phone_enc = ${gone.phone_enc}, phone_hash = ${gone.phone_hash},
        phone_verified_at = ${gone.phone_verified_at ? iso(gone.phone_verified_at) : null}, updated_at = now()
      where id = ${keepId}
    `;
  }
  // The latest decision across both profiles wins. If that is "don't remember",
  // the dates and companions that just moved over must go.
  const after = await currentConsents(sql, keepId);
  if (!after.profile_memory) {
    await sql`delete from occasions where profile_id = ${keepId}`;
    await sql`delete from companions where profile_id = ${keepId}`;
    await sql`delete from profile_holidays where profile_id = ${keepId}`;
  }
  await audit(sql, actor, { action: "profile.merge", targetType: "profile", targetId: keepId, detail: { merged: mergeId } });
  return { keptId: keepId };
}

/* ------------------------------------------------------- retention purge */

export type PurgeResult = {
  otaStaysAnonymized: number;
  serviceDataCleared: number;
  verificationsDeleted: number;
  dormantProfilesErased: number;
};

/**
 * One pass of every retention clock. Safe to run repeatedly; does only what is due.
 *   1. OTA-sourced stays without a profile: guest name -> initials, notes cleared,
 *      after departure + the channel's retention days (Booking.com: 30, verified).
 *   2. Stay-only data (service contact, party, celebration) after checkins.purge_on.
 *   3. Verification records after 7 days.
 *   4. Profiles whose consents are all withdrawn, after 30 days: erased.
 */
export async function runPurge(sql: Sql): Promise<PurgeResult> {
  const today = await q.todayIso(sql);
  const due = await sql.query<{ id: string; source: string; departure: string; guest_name: string }>(
    `select id, source, departure::text as departure, guest_name from reservations
     where anonymized_at is null and profile_id is null and source <> 'Direct' and departure < $1::date`,
    [today],
  );
  let ota = 0;
  for (const r of due) {
    const rule = otaRetention(r.source);
    if (!rule || q.addDays(r.departure, rule.days) >= today) continue;
    await sql`
      update reservations set guest_name = ${initials(r.guest_name) || "Guest"}, notes = '',
        anonymized_at = now()
      where id = ${r.id}
    `;
    await sql`
      update checkins set service_email_enc = null, service_phone_enc = null, party = '[]'::jsonb,
        celebration = null, celebration_whose = null, celebration_month = null, celebration_day = null
      where reservation_id = ${r.id}
    `;
    await sql`update messages set subject = 'Message to guest (details removed)' where reservation_id = ${r.id}`;
    ota += 1;
  }
  // Rows written before purge_on existed (or by older code) get their clock now.
  await sql`
    update checkins c set purge_on = r.departure + p.service_retention_days
    from reservations r, properties p
    where c.purge_on is null and r.id = c.reservation_id and p.id = r.property_id
  `;
  const cleared = await sql.query<{ reservation_id: string }>(
    `update checkins set service_email_enc = null, service_phone_enc = null, party = '[]'::jsonb,
       celebration = null, celebration_whose = null, celebration_month = null, celebration_day = null
     where purge_on < $1::date
       and (service_email_enc is not null or service_phone_enc is not null or celebration is not null
            or party <> '[]'::jsonb)
     returning reservation_id`,
    [today],
  );
  const verifications = await sql.query<{ id: string }>(
    `delete from contact_verifications where created_at < now() - make_interval(days => $1) returning id`,
    [VERIFICATION_KEEP_DAYS],
  );
  const dormant = await sql.query<{ profile_id: string }>(
    `with latest as (
       select distinct on (profile_id, purpose) profile_id, purpose, granted, at
       from consent_events order by profile_id, purpose, at desc, id desc
     )
     select l.profile_id from latest l join guest_profiles p on p.id = l.profile_id
     where p.erased_at is null and p.merged_into is null
     group by l.profile_id
     having bool_and(not l.granted) and max(l.at) < now() - make_interval(days => $1)`,
    [DORMANT_ERASE_DAYS],
  );
  for (const d of dormant) {
    await eraseProfile(sql, d.profile_id, { kind: "system", label: "Retention" }, "staff");
  }
  const result: PurgeResult = {
    otaStaysAnonymized: ota,
    serviceDataCleared: cleared.length,
    verificationsDeleted: verifications.length,
    dormantProfilesErased: dormant.length,
  };
  await sql`update properties set last_purge_on = ${today}::date where id = current_setting('app.property_id', true)`;
  await audit(sql, { kind: "system", label: "Retention" }, { action: "retention.purge", detail: result });
  return result;
}

/** Daily housekeeping when staff open the hotel: purge once per day; seed demo capture data once. */
export async function housekeeping(sql: Sql) {
  const rows = await sql.query<{ last_purge_on: string | null; is_demo: boolean; demo_seeded_capture: boolean; today: string }>(
    `select last_purge_on::text as last_purge_on, is_demo, demo_seeded_capture, CURRENT_DATE::text as today
     from properties where id = current_setting('app.property_id', true)`,
  );
  const p = rows[0];
  if (!p) return;
  if (p.is_demo && !p.demo_seeded_capture) await seedDemoCapture(sql);
  if (!p.last_purge_on || p.last_purge_on < p.today) await runPurge(sql);
}

/* -------------------------------------------------- capture gate (phase B) */

export type CaptureGate = {
  launchedOn: string | null;
  baseline: { arrivals: number; completed: number; completionPct: number; from: string; to: string };
  after: {
    arrivals: number;
    completed: number;
    completionPct: number;
    otaCompleted: number;
    captured: number;
    capturePct: number;
    marketable: number;
    marketablePct: number;
  };
  dropPts: number;
  steps: { step: string; n: number }[];
  gates: { id: "capture" | "marketable" | "completion"; label: string; value: number; target: string; pass: boolean }[];
  evidence: "too_few" | "directional" | "solid";
  bySource: { source: string; n: number }[];
};

export async function captureGate(sql: Sql): Promise<CaptureGate> {
  const today = await q.todayIso(sql);
  const property = await q.loadProperty(sql, today);
  const launched = property.settings.captureLaunchedOn;
  const pilotStart = property.economics.launchedOn;
  const from = launched ?? today;
  const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

  const base = await sql.query<{ arrivals: number; completed: number }>(
    `select count(*)::int as arrivals, count(c.completed_at)::int as completed
     from reservations r left join checkins c on c.reservation_id = r.id
     where r.arrival >= $1::date and r.arrival < $2::date`,
    [pilotStart, from],
  );
  const after = await sql.query<{ arrivals: number; completed: number; ota_completed: number; captured: number; marketable: number }>(
    `with w as (
       select r.id, r.source, r.profile_id, c.completed_at, c.contact_verified_at
       from reservations r left join checkins c on c.reservation_id = r.id
       where r.arrival >= $1::date and r.arrival <= $2::date
     ),
     consent as (
       select distinct on (profile_id, purpose) profile_id, purpose, granted
       from consent_events order by profile_id, purpose, at desc, id desc
     )
     select count(*)::int as arrivals,
       count(completed_at)::int as completed,
       (count(*) filter (where completed_at is not null and source <> 'Direct'))::int as ota_completed,
       (count(*) filter (where completed_at is not null and source <> 'Direct' and contact_verified_at is not null))::int as captured,
       (count(*) filter (where completed_at is not null and source <> 'Direct' and exists (
          select 1 from consent k where k.profile_id = w.profile_id and k.granted
            and k.purpose in ('marketing_email', 'marketing_whatsapp'))))::int as marketable
     from w`,
    [from, today],
  );
  const steps = await sql.query<{ step: string; n: number }>(
    `select e.step, count(distinct e.reservation_id)::int as n
     from capture_events e join reservations r on r.id = e.reservation_id
     where r.arrival >= $1::date and r.arrival <= $2::date
     group by e.step`,
    [from, today],
  );
  const bySource = await sql.query<{ source: string; n: number }>(
    `select coalesce(c.source, 'online') as source, count(*)::int as n
     from checkins c join reservations r on r.id = c.reservation_id
     where c.completed_at is not null and r.arrival >= $1::date and r.arrival <= $2::date
     group by 1 order by 2 desc`,
    [from, today],
  );
  const b = base[0] ?? { arrivals: 0, completed: 0 };
  const a = after[0] ?? { arrivals: 0, completed: 0, ota_completed: 0, captured: 0, marketable: 0 };
  const baselinePct = pct(Number(b.completed), Number(b.arrivals));
  const afterPct = pct(Number(a.completed), Number(a.arrivals));
  const capturePct = pct(Number(a.captured), Number(a.ota_completed));
  const marketablePct = pct(Number(a.marketable), Number(a.ota_completed));
  const dropPts = Math.round((baselinePct - afterPct) * 10) / 10;
  const order = ["started", "celebration", "party", "code_sent", "verified", "consented", "completed"];
  const n = Number(a.ota_completed);
  return {
    launchedOn: launched,
    baseline: { arrivals: Number(b.arrivals), completed: Number(b.completed), completionPct: baselinePct, from: pilotStart, to: q.addDays(from, -1) },
    after: {
      arrivals: Number(a.arrivals),
      completed: Number(a.completed),
      completionPct: afterPct,
      otaCompleted: n,
      captured: Number(a.captured),
      capturePct,
      marketable: Number(a.marketable),
      marketablePct,
    },
    dropPts,
    steps: order.map((step) => ({ step, n: Number(steps.find((s) => s.step === step)?.n ?? 0) })),
    gates: [
      { id: "capture", label: "Own contact captured", value: capturePct, target: "≥ 40% of OTA check-ins", pass: capturePct >= 40 },
      { id: "marketable", label: "Marketable (opted in)", value: marketablePct, target: "≥ 10% of OTA check-ins", pass: marketablePct >= 10 },
      { id: "completion", label: "Check-in completion drop", value: dropPts, target: "≤ 3 points vs before", pass: dropPts <= 3 },
    ],
    evidence: n < 50 ? "too_few" : n < 300 ? "directional" : "solid",
    bySource: bySource.map((s) => ({ source: s.source, n: Number(s.n) })),
  };
}

/* ------------------------------------------------------------ demo data */

function draw(id: string, salt: string) {
  // FNV-1a: deterministic per reservation, so every demo database looks the same.
  let h = 0x811c9dc5;
  for (const ch of `${salt}:${id}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Demo hotel only: give the three weeks since the capture step launched a
 * realistic capture history (encrypted fake contacts at example.com / 555
 * numbers, consents, occasions), so the phase B gate and guest profiles have
 * something to show. Runs once, inside the demo hotel's own transaction.
 */
export async function seedDemoCapture(sql: Sql) {
  const property = await q.loadProperty(sql);
  const from = property.settings.captureLaunchedOn;
  const today = await q.todayIso(sql);
  if (!property.settings.isDemo || !from) return { seeded: 0 };
  const stays = await sql.query<{ id: string; guest_name: string; source: string; departure: string; completed: boolean; token: string }>(
    `select r.id, r.guest_name, r.source, r.departure::text as departure, (c.completed_at is not null) as completed, r.token
     from reservations r left join checkins c on c.reservation_id = r.id
     where r.arrival >= $1::date and r.arrival <= $2::date and r.profile_id is null
       and r.id not in ('res_maya', 'res_elena', 'res_noah', 'res_owen')
     order by r.id`,
    [from, today],
  );
  const hotel = property.name;
  const market = property.settings.market;
  let seeded = 0;
  const holidaysPool = ["christmas", "new_year", "thanksgiving", "diwali", "lunar_new_year", "eid_al_fitr", "hanukkah"];
  for (const s of stays) {
    const u = draw(s.id, "start");
    if (!s.completed) {
      if (u < 0.35) await sql`insert into capture_events (reservation_id, step, source) values (${s.id}, 'started', 'online')`;
      continue;
    }
    const source: CaptureSource = draw(s.id, "src") < 0.22 ? "desk_tablet" : draw(s.id, "src") < 0.3 ? "qr" : "online";
    const steps = ["started", "celebration", "party"];
    const ota = s.source !== "Direct";
    const captured = ota && draw(s.id, "cap") < 0.47;
    const first = s.guest_name.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") || "guest";
    const usePhone = draw(s.id, "ch") < 0.25;
    const email = captured && !usePhone ? `${first}.${s.id.slice(-4)}@example.com` : null;
    const phone = captured && usePhone ? `+1512555${String(Math.floor(draw(s.id, "ph") * 10000)).padStart(4, "0")}` : null;
    const celebrating = draw(s.id, "cel") < 0.13;
    const celebration = celebrating ? (draw(s.id, "kind") < 0.55 ? "birthday" : "anniversary") : null;
    // Half the remembered dates fall in the next two months, so "coming up" has something to show.
    const thisMonth = Number(today.slice(5, 7));
    const month = draw(s.id, "soon") < 0.5
      ? ((thisMonth + Math.floor(draw(s.id, "m") * 2)) % 12) + 1
      : 1 + Math.floor(draw(s.id, "m") * 12);
    const day = 1 + Math.floor(draw(s.id, "d") * 28);
    await sql`
      update checkins set source = ${source}, started_at = completed_at - interval '3 minutes',
        celebration = ${celebration}, celebration_whose = ${celebration ? (celebration === "birthday" ? "me" : "partner") : null},
        celebration_month = ${celebration ? month : null}, celebration_day = ${celebration ? day : null},
        service_email_enc = ${email ? await encrypt(email) : null},
        service_phone_enc = ${phone ? await encrypt(phone) : null},
        contact_verified_at = ${captured ? new Date().toISOString() : null},
        contact_channel = ${captured ? (usePhone ? "whatsapp" : "email") : null},
        real_email_captured = real_email_captured or ${Boolean(email)},
        purge_on = ${q.addDays(s.departure, property.settings.serviceRetentionDays)}
      where reservation_id = ${s.id}
    `;
    if (captured) steps.push("code_sent", "verified");
    const marketable = captured && draw(s.id, "mkt") < 0.34;
    const memory = captured && draw(s.id, "mem") < (marketable ? 0.6 : 0.15);
    if (marketable || memory) {
      const profileId = `gp_demo_${s.id.slice(-6)}`;
      const emailHash = email ? await blindIndex(email) : null;
      const phoneHash = phone ? await blindIndex(phone) : null;
      await sql`
        insert into guest_profiles (id, display_name, email_enc, email_hash, email_verified_at, phone_enc, phone_hash, phone_verified_at, created_at)
        values (${profileId}, ${s.guest_name}, ${email ? await encrypt(email) : null}, ${emailHash}, ${email ? new Date().toISOString() : null},
                ${phone ? await encrypt(phone) : null}, ${phoneHash}, ${phone ? new Date().toISOString() : null}, now() - interval '5 days')
        on conflict (id) do nothing
      `;
      await sql`update reservations set profile_id = ${profileId} where id = ${s.id}`;
      const grant = async (purpose: ConsentPurpose) =>
        recordConsent(sql, { profileId, purpose, granted: true, source: CONSENT_SOURCE[source], hotel, market, reservationId: s.id });
      if (marketable) await grant(usePhone ? "marketing_whatsapp" : "marketing_email");
      if (memory) {
        await grant("profile_memory");
        await rememberOnProfile(sql, profileId, {
          celebration: celebration
            ? { kind: celebration as Celebration, whose: celebration === "birthday" ? "me" : "partner", month, day }
            : draw(s.id, "bday") < 0.5
              ? { kind: "birthday", whose: "me", month, day }
              : null,
          party: draw(s.id, "party") < 0.5 ? [{ relation: "partner", firstName: draw(s.id, "pn") < 0.5 ? "Sam" : "Alex" }] : [],
          holidays: draw(s.id, "hol") < 0.4 ? [holidaysPool[Math.floor(draw(s.id, "h1") * holidaysPool.length)]!] : [],
        });
      }
      steps.push("consented");
    }
    steps.push("completed");
    for (const step of steps) {
      await sql`insert into capture_events (reservation_id, step, source) values (${s.id}, ${step}, ${source})`;
    }
    seeded += 1;
  }
  await sql`update properties set demo_seeded_capture = true where id = current_setting('app.property_id', true)`;
  return { seeded };
}

/* ------------------------------------------------------- desk + QR lookups */

export async function deskArrivals(sql: Sql) {
  const today = await q.todayIso(sql);
  const rows = await sql.query<{
    id: string;
    guest_name: string;
    arrival: string;
    departure: string;
    room: string;
    token: string;
    holdout: boolean;
    completed: boolean;
    verified: boolean;
    source: string;
  }>(
    `select r.id, r.guest_name, r.arrival::text as arrival, r.departure::text as departure, rt.name as room,
       r.token, r.holdout, (c.completed_at is not null) as completed,
       (c.contact_verified_at is not null) as verified, r.source
     from reservations r join room_types rt on rt.id = r.room_type_id
     left join checkins c on c.reservation_id = r.id
     where r.anonymized_at is null and r.arrival between $1::date - 1 and $1::date + 1 and r.departure > $1::date
     order by (c.completed_at is not null), r.arrival, r.guest_name`,
    [today],
  );
  return {
    today,
    arrivals: rows.map((r) => ({
      reservationId: r.id,
      guestName: r.guest_name,
      arrival: r.arrival,
      departure: r.departure,
      room: r.room,
      token: r.token,
      completed: Boolean(r.completed),
      verified: Boolean(r.verified),
      source: r.source,
    })),
  };
}

/** QR at the desk: guest types last name + booking reference; we return their stay link. */
export async function findBookingForQr(sql: Sql, data: { lastName: string; bookingRef: string }) {
  const today = await q.todayIso(sql);
  const last = data.lastName.trim().toLowerCase();
  const ref = data.bookingRef.trim().replace(/\s+/g, "").toLowerCase();
  if (last.length < 2 || ref.length < 4) throw new Error("Enter your last name and booking reference.");
  const rows = await sql.query<{ token: string; guest_name: string }>(
    `select token, guest_name from reservations
     where lower(replace(booking_ref, ' ', '')) = $1 and departure >= $2::date and anonymized_at is null`,
    [ref, today],
  );
  const match = rows.find((r) => {
    const parts = r.guest_name.toLowerCase().split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(" ") === last || parts[parts.length - 1] === last : parts[0] === last;
  });
  if (!match) throw new Error("We couldn't find that booking. Check the reference, or ask the front desk.");
  return { token: match.token };
}

/** Occasions coming up in the next `days` days across live profiles (for the guests screen). */
export async function upcomingOccasions(sql: Sql, days = 60) {
  const today = await q.todayIso(sql);
  const rows = await sql.query<{ profile_id: string; name: string; kind: string; label: string | null; month: number; day: number | null; first_name: string | null }>(
    `select o.profile_id, p.display_name as name, o.kind, o.label, o.month, o.day, c.first_name
     from occasions o join guest_profiles p on p.id = o.profile_id
     left join companions c on c.id = o.companion_id
     where p.erased_at is null and p.merged_into is null`,
  );
  return rows
    .map((r) => ({
      profileId: r.profile_id,
      name: r.name,
      what: occasionLabel({ kind: r.kind, label: r.label, companion: r.first_name }),
      date: nextOccurrence(Number(r.month), r.day === null ? null : Number(r.day), today),
      exactDay: r.day !== null,
    }))
    .filter((r) => q.daysBetween(today, r.date) <= days)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);
}

/**
 * "See what we keep" from the stay page. The stay link alone must not open the
 * preference centre (front-desk staff see stay links), so the new link goes to
 * the profile's verified email. Local development has no mail, so the link is
 * returned for the screen instead.
 */
export async function sendPreferenceLink(sql: Sql, token: string, origin: string) {
  const { reservation } = await requireStay(sql, token);
  if (!reservation.profileId) throw new Error("Nothing is kept beyond this stay, so there's nothing to manage.");
  const p = await profileRow(sql, reservation.profileId);
  if (!p || p.erased_at || p.merged_into) throw new Error("Nothing is kept beyond this stay.");
  const email = await decryptOrNull(p.email_enc);
  if (!email && realDatabase()) {
    throw new Error("We can only send this link by email. Ask the front desk to help.");
  }
  const property = await q.loadProperty(sql);
  const prefToken = randomToken(18);
  await sql`update guest_profiles set pref_token_hash = ${await sha256(prefToken)}, updated_at = now() where id = ${p.id}`;
  const link = `${origin.replace(/\/+$/, "")}/p/${prefToken}`;
  if (!email) return { sentTo: null, devLink: link };
  const body = simpleEmail({
    hotel: property.name,
    heading: "What we keep about you",
    lines: ["See, change or delete the details and choices you shared with us. This link replaces any earlier one."],
    cta: { label: "Open my preferences", url: link },
  });
  const sent = await sendMail({
    to: email,
    subject: `Your preferences at ${property.name}`,
    html: body.html,
    text: body.text,
    from: property.settings.senderEmail,
    fromName: property.name,
    tag: "preferences",
  });
  return { sentTo: maskEmail(email), devLink: sent.delivered ? undefined : link };
}
