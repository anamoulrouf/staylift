import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BFNvoSgs.mjs";
import { bn as union, cn as _enum, dn as boolean, gn as object, hn as number, pn as literal, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as audit, r as listAudit } from "./audit-CWKuUfF1.mjs";
import { c as isMarketId, i as MARKETS, l as marketFor, o as consentWording, r as HOLIDAYS, t as CONSENT_PURPOSES } from "./markets-CIpFMBqe.mjs";
import { A as sha256, C as sendStayLink$1, D as updateSettings, E as updateEconomics$1, M as sendMail, N as simpleEmail, O as keyStatus, S as sendBookingEmail$1, T as toggleRecipe$1, _ as recipes, a as fulfillment, addOccasion, b as roomTypes, c as logDeskSale$1, captureGate, captureStep, completeCapture, d as offers, deskArrivals, eraseProfile, eraseReservationGuest, exportProfile, f as overviewExtras, findBookingForQr, g as purchaseOffer$1, h as publicOrigin, housekeeping, i as decideOrder$1, j as mailStatus, k as randomToken, l as measuredRoi, listProfiles, m as previewEmailParse$1, mergeProfiles, n as bookingEmail, o as ingestReservation$1, p as pendingCount, profileDetail, profileView, r as dashboard, removeCompanion, removeOccasion, revealContact, runPurge, s as loadProperty, sendContactCode, sendPreferenceLink, setHolidays, startCapture, stayPage, t as analytics, u as messages, upcomingOccasions, updateConsents, v as recordStayView$1, verifyContactCode, w as toggleOffer$1, x as seedStarterCatalogue, y as reservations } from "./guests-DZdeWPp9.mjs";
import { a as atLeast, n as ROLES, o as can, s as isRole, t as CAN } from "./roles-8UfQ9oTl.mjs";
import { systemSql, withTenant } from "./tenant-db-Y6e8Uu3w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-DKO7wXTZ.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var NoHotelError = class extends Error {
	status = 409;
	constructor() {
		super("No hotel yet");
		this.name = "NoHotelError";
	}
};
var ForbiddenError = class extends Error {
	status = 403;
	constructor(message = "Your role can't do that.") {
		super(message);
		this.name = "ForbiddenError";
	}
};
/** Demo hotel access: on by default locally, off once a real database is set unless STAYLIFT_DEMO=on. */
function demoEnabled() {
	const flag = (typeof process !== "undefined" ? process.env.STAYLIFT_DEMO : void 0)?.trim().toLowerCase();
	if (flag === "on") return true;
	if (flag === "off") return false;
	return !(typeof process !== "undefined" && process.env.DATABASE_URL?.trim());
}
async function userIdentity(sql, userId) {
	const rows = await sql.query(`select email, name from "user" where id = $1`, [userId]);
	return {
		email: rows[0]?.email ?? null,
		name: rows[0]?.name ?? null
	};
}
async function memberships(sql, userId) {
	return (await sql.query(`select m.property_id, p.name, p.city, m.role, p.is_demo
     from memberships m join properties p on p.id = m.property_id
     where m.user_id = $1
     order by p.is_demo, p.name`, [userId])).filter((r) => isRole(r.role)).map((r) => ({
		propertyId: r.property_id,
		propertyName: r.name,
		city: r.city,
		role: r.role,
		isDemo: Boolean(r.is_demo)
	}));
}
/** Resolve the hotel this user is working on, and their role there. */
async function staffContext(sql, userId) {
	const list = await memberships(sql, userId);
	if (list.length === 0) throw new NoHotelError();
	const settings = await sql.query(`select active_property_id from user_settings where user_id = $1`, [userId]);
	const active = list.find((m) => m.propertyId === settings[0]?.active_property_id) ?? list[0];
	const prop = await sql.query(`select market from properties where id = $1`, [active.propertyId]);
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
		memberships: list
	};
}
function requireRole(ctx, min, message) {
	if (!atLeast(ctx.role, min)) throw new ForbiddenError(message);
}
async function setActiveProperty(sql, userId, propertyId) {
	if (!(await memberships(sql, userId)).some((m) => m.propertyId === propertyId)) throw new ForbiddenError("You're not on that hotel's team.");
	await sql`
    insert into user_settings (user_id, active_property_id) values (${userId}, ${propertyId})
    on conflict (user_id) do update set active_property_id = excluded.active_property_id
  `;
	return { ok: true };
}
function slug(text) {
	return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}
/**
* Create a hotel owned by this user. The starter catalogue is added separately
* inside the hotel's own transaction (queries.seedStarterCatalogue).
*/
async function createProperty(sql, userId, input) {
	if (!isMarketId(input.market)) throw new Error("Pick a launch market.");
	const market = marketFor(input.market);
	const base = slug(input.name) || "hotel";
	let id = base;
	for (let n = 2;; n += 1) {
		const taken = await sql.query(`select count(*)::int as n from properties where id = $1 or code = $1`, [id]);
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
async function joinDemo(sql, userId) {
	if (!demoEnabled()) throw new ForbiddenError("The demo hotel is switched off here.");
	const id = (await sql.query(`select id from properties where is_demo order by id limit 1`))[0]?.id;
	if (!id) throw new Error("No demo hotel in this database.");
	await sql`
    insert into memberships (user_id, property_id, role) values (${userId}, ${id}, ${typeof process !== "undefined" && process.env.DATABASE_URL?.trim() ? "manager" : "owner"})
    on conflict (user_id, property_id) do nothing
  `;
	await setActiveProperty(sql, userId, id);
	return { propertyId: id };
}
async function team(sql, propertyId) {
	const members = await sql.query(`select m.user_id, u.name, u.email, m.role, m.created_at
     from memberships m left join "user" u on u.id = m.user_id
     where m.property_id = $1
     order by case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, u.name`, [propertyId]);
	const invites = await sql.query(`select id, email, role, created_at, expires_at from invitations
     where property_id = $1 and accepted_at is null and revoked_at is null and expires_at > now()
     order by created_at desc`, [propertyId]);
	const iso = (v) => v instanceof Date ? v.toISOString() : String(v);
	return {
		members: members.map((m) => ({
			userId: m.user_id,
			name: m.name,
			email: m.email,
			role: isRole(m.role) ? m.role : "front_desk",
			joinedAt: iso(m.created_at)
		})),
		invitations: invites.map((i) => ({
			id: i.id,
			email: i.email,
			role: isRole(i.role) ? i.role : "front_desk",
			createdAt: iso(i.created_at),
			expiresAt: iso(i.expires_at)
		}))
	};
}
var INVITE_DAYS = 7;
async function createInvitation(sql, propertyId, invitedBy, email, role) {
	const normalized = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) throw new Error("Enter a valid email address.");
	const already = await sql.query(`select count(*)::int as n from memberships m join "user" u on u.id = m.user_id
     where m.property_id = $1 and lower(u.email) = $2`, [propertyId, normalized]);
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
	return {
		id,
		token,
		email: normalized,
		role
	};
}
async function revokeInvitation(sql, propertyId, invitationId) {
	await sql`
    update invitations set revoked_at = now()
    where id = ${invitationId} and property_id = ${propertyId} and accepted_at is null
  `;
	return { ok: true };
}
async function invitationPreview(sql, token) {
	const row = (await sql.query(`select i.id, i.property_id, p.name, i.email, i.role,
       (i.expires_at <= now()) as expired,
       (i.accepted_at is not null or i.revoked_at is not null) as used
     from invitations i join properties p on p.id = i.property_id
     where i.token_hash = $1`, [await sha256(token)]))[0];
	if (!row) return null;
	return {
		id: row.id,
		propertyId: row.property_id,
		propertyName: row.name,
		email: row.email,
		role: isRole(row.role) ? row.role : "front_desk",
		usable: !row.expired && !row.used
	};
}
/** Accept with the token AND a signed-in account whose email matches the invitation. */
async function acceptInvitation(sql, userId, token) {
	const invite = await invitationPreview(sql, token);
	if (!invite || !invite.usable) throw new Error("This invitation has expired or was already used.");
	if (((await userIdentity(sql, userId)).email ?? "").toLowerCase() !== invite.email) throw new ForbiddenError(`This invitation is for ${invite.email}. Sign in with that email to accept it.`);
	await sql`
    insert into memberships (user_id, property_id, role) values (${userId}, ${invite.propertyId}, ${invite.role})
    on conflict (user_id, property_id) do update set role = excluded.role
  `;
	await sql`update invitations set accepted_at = now(), accepted_by = ${userId} where id = ${invite.id}`;
	await setActiveProperty(sql, userId, invite.propertyId);
	return {
		propertyId: invite.propertyId,
		role: invite.role
	};
}
async function pendingInvitationsFor(sql, email) {
	if (!email) return [];
	return sql.query(`select p.name as property_name, i.role from invitations i join properties p on p.id = i.property_id
     where i.email = $1 and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()`, [email.toLowerCase()]);
}
async function ownerCount(sql, propertyId) {
	const rows = await sql.query(`select count(*)::int as n from memberships where property_id = $1 and role = 'owner'`, [propertyId]);
	return Number(rows[0]?.n ?? 0);
}
async function changeRole(sql, propertyId, targetUserId, role) {
	const current = await sql.query(`select role from memberships where property_id = $1 and user_id = $2`, [propertyId, targetUserId]);
	if (!current[0]) throw new Error("Not on this team.");
	if (current[0].role === "owner" && role !== "owner" && await ownerCount(sql, propertyId) <= 1) throw new Error("A hotel needs at least one owner. Make someone else owner first.");
	await sql`update memberships set role = ${role} where property_id = ${propertyId} and user_id = ${targetUserId}`;
	return {
		from: current[0].role,
		to: role
	};
}
async function removeMember(sql, propertyId, targetUserId) {
	const current = await sql.query(`select role from memberships where property_id = $1 and user_id = $2`, [propertyId, targetUserId]);
	if (!current[0]) throw new Error("Not on this team.");
	if (current[0].role === "owner" && await ownerCount(sql, propertyId) <= 1) throw new Error("A hotel needs at least one owner.");
	await sql`delete from memberships where property_id = ${propertyId} and user_id = ${targetUserId}`;
	await sql`
    update user_settings set active_property_id = null
    where user_id = ${targetUserId} and active_property_id = ${propertyId}
  `;
	return { role: current[0].role };
}
/** Which hotel a guest stay link belongs to (null if the link is unknown). */
async function propertyForStayToken(sql, token) {
	return (await sql.query(`select property_id from reservations where token = $1`, [token]))[0]?.property_id ?? null;
}
async function propertyForPreferenceToken(sql, token) {
	const rows = await sql.query(`select property_id, id from guest_profiles
     where pref_token_hash = $1 and erased_at is null and merged_into is null`, [await sha256(token)]);
	return rows[0] ? {
		propertyId: rows[0].property_id,
		profileId: rows[0].id
	} : null;
}
async function propertyForCode(sql, code) {
	return (await sql.query(`select id, name, city from properties where code = $1`, [code.toLowerCase()]))[0] ?? null;
}
/**
* Minimal QR code encoder: byte mode, error correction level M, versions 1–10
* (up to 213 bytes — plenty for a check-in URL). Pure and dependency-free, so
* the desk QR renders on the server and in print.
*
* Follows ISO/IEC 18004 (structure after Project Nayuki's reference encoder).
* qr.test.ts decodes its output with OpenCV to prove it scans.
*/
var ECC_PER_BLOCK_M = [
	-1,
	10,
	16,
	26,
	18,
	24,
	16,
	18,
	22,
	22,
	26
];
var BLOCKS_M = [
	-1,
	1,
	1,
	1,
	2,
	2,
	4,
	4,
	4,
	5,
	5
];
function rawDataModules(ver) {
	let result = (16 * ver + 128) * ver + 64;
	if (ver >= 2) {
		const numAlign = Math.floor(ver / 7) + 2;
		result -= (25 * numAlign - 10) * numAlign - 55;
		if (ver >= 7) result -= 36;
	}
	return result;
}
function dataCodewords(ver) {
	return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK_M[ver] * BLOCKS_M[ver];
}
function gfMul(x, y) {
	let z = 0;
	for (let i = 7; i >= 0; i -= 1) {
		z = z << 1 ^ (z >>> 7) * 285;
		z ^= (y >>> i & 1) * x;
	}
	return z & 255;
}
function rsDivisor(degree) {
	const result = new Array(degree).fill(0);
	result[degree - 1] = 1;
	let root = 1;
	for (let i = 0; i < degree; i += 1) {
		for (let j = 0; j < result.length; j += 1) {
			result[j] = gfMul(result[j], root);
			if (j + 1 < result.length) result[j] ^= result[j + 1];
		}
		root = gfMul(root, 2);
	}
	return result;
}
function rsRemainder(data, divisor) {
	const result = divisor.map(() => 0);
	for (const b of data) {
		const factor = b ^ result.shift();
		result.push(0);
		divisor.forEach((coef, i) => {
			result[i] ^= gfMul(coef, factor);
		});
	}
	return result;
}
function alignmentPositions(ver) {
	if (ver === 1) return [];
	const size = ver * 4 + 17;
	const numAlign = Math.floor(ver / 7) + 2;
	const step = Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
	const result = [6];
	for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
	return result;
}
function encodeQr(text) {
	const bytes = Array.from(new TextEncoder().encode(text));
	let ver = 1;
	for (; ver <= 10; ver += 1) if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= dataCodewords(ver) * 8) break;
	if (ver > 10) throw new Error("Text too long for this QR encoder (max 213 bytes).");
	const bits = [];
	const push = (value, len) => {
		for (let i = len - 1; i >= 0; i -= 1) bits.push(value >>> i & 1);
	};
	push(4, 4);
	push(bytes.length, ver < 10 ? 8 : 16);
	for (const b of bytes) push(b, 8);
	const capacity = dataCodewords(ver) * 8;
	push(0, Math.min(4, capacity - bits.length));
	push(0, (8 - bits.length % 8) % 8);
	for (let pad = 236; bits.length < capacity; pad ^= 253) push(pad, 8);
	const data = [];
	for (let i = 0; i < bits.length; i += 8) {
		let v = 0;
		for (let j = 0; j < 8; j += 1) v = v << 1 | bits[i + j];
		data.push(v);
	}
	const numBlocks = BLOCKS_M[ver];
	const eccLen = ECC_PER_BLOCK_M[ver];
	const rawCodewords = Math.floor(rawDataModules(ver) / 8);
	const numShort = numBlocks - rawCodewords % numBlocks;
	const shortLen = Math.floor(rawCodewords / numBlocks);
	const divisor = rsDivisor(eccLen);
	const blocks = [];
	for (let i = 0, k = 0; i < numBlocks; i += 1) {
		const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
		k += dat.length;
		const ecc = rsRemainder(dat, divisor);
		if (i < numShort) dat.push(0);
		blocks.push(dat.concat(ecc));
	}
	const codewords = [];
	for (let i = 0; i < blocks[0].length; i += 1) blocks.forEach((block, j) => {
		if (i !== shortLen - eccLen || j >= numShort) codewords.push(block[i]);
	});
	const size = ver * 4 + 17;
	const modules = Array.from({ length: size }, () => new Array(size).fill(false));
	const isFn = Array.from({ length: size }, () => new Array(size).fill(false));
	const setFn = (x, y, dark) => {
		modules[y][x] = dark;
		isFn[y][x] = true;
	};
	for (let i = 0; i < size; i += 1) {
		setFn(6, i, i % 2 === 0);
		setFn(i, 6, i % 2 === 0);
	}
	const finder = (x, y) => {
		for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
			const dist = Math.max(Math.abs(dx), Math.abs(dy));
			const xx = x + dx;
			const yy = y + dy;
			if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, dist !== 2 && dist !== 4);
		}
	};
	finder(3, 3);
	finder(size - 4, 3);
	finder(3, size - 4);
	const align = alignmentPositions(ver);
	const na = align.length;
	for (let i = 0; i < na; i += 1) for (let j = 0; j < na; j += 1) {
		if (i === 0 && j === 0 || i === 0 && j === na - 1 || i === na - 1 && j === 0) continue;
		for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) setFn(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
	}
	const drawFormat = (mask) => {
		const d = 0 | mask;
		let rem = d;
		for (let i = 0; i < 10; i += 1) rem = rem << 1 ^ (rem >>> 9) * 1335;
		const fbits = (d << 10 | rem) ^ 21522;
		const bit = (i) => (fbits >>> i & 1) !== 0;
		for (let i = 0; i <= 5; i += 1) setFn(8, i, bit(i));
		setFn(8, 7, bit(6));
		setFn(8, 8, bit(7));
		setFn(7, 8, bit(8));
		for (let i = 9; i < 15; i += 1) setFn(14 - i, 8, bit(i));
		for (let i = 0; i < 8; i += 1) setFn(size - 1 - i, 8, bit(i));
		for (let i = 8; i < 15; i += 1) setFn(8, size - 15 + i, bit(i));
		setFn(8, size - 8, true);
	};
	drawFormat(0);
	if (ver >= 7) {
		let rem = ver;
		for (let i = 0; i < 12; i += 1) rem = rem << 1 ^ (rem >>> 11) * 7973;
		const vbits = ver << 12 | rem;
		for (let i = 0; i < 18; i += 1) {
			const dark = (vbits >>> i & 1) !== 0;
			const a = size - 11 + i % 3;
			const b = Math.floor(i / 3);
			setFn(a, b, dark);
			setFn(b, a, dark);
		}
	}
	let bitIndex = 0;
	for (let right = size - 1; right >= 1; right -= 2) {
		if (right === 6) right = 5;
		for (let vert = 0; vert < size; vert += 1) for (let j = 0; j < 2; j += 1) {
			const x = right - j;
			const y = (right + 1 & 2) === 0 ? size - 1 - vert : vert;
			if (!isFn[y][x] && bitIndex < codewords.length * 8) {
				modules[y][x] = (codewords[bitIndex >>> 3] >>> 7 - (bitIndex & 7) & 1) !== 0;
				bitIndex += 1;
			}
		}
	}
	const applyMask = (mask) => {
		for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
			let invert;
			switch (mask) {
				case 0:
					invert = (x + y) % 2 === 0;
					break;
				case 1:
					invert = y % 2 === 0;
					break;
				case 2:
					invert = x % 3 === 0;
					break;
				case 3:
					invert = (x + y) % 3 === 0;
					break;
				case 4:
					invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
					break;
				case 5:
					invert = x * y % 2 + x * y % 3 === 0;
					break;
				case 6:
					invert = (x * y % 2 + x * y % 3) % 2 === 0;
					break;
				default: invert = ((x + y) % 2 + x * y % 3) % 2 === 0;
			}
			if (!isFn[y][x] && invert) modules[y][x] = !modules[y][x];
		}
	};
	let best = 0;
	let bestScore = Infinity;
	for (let mask = 0; mask < 8; mask += 1) {
		applyMask(mask);
		drawFormat(mask);
		const score = penalty(modules, size);
		if (score < bestScore) {
			bestScore = score;
			best = mask;
		}
		applyMask(mask);
	}
	applyMask(best);
	drawFormat(best);
	return {
		size,
		modules
	};
}
function penalty(m, size) {
	let score = 0;
	const line = (get) => {
		let s = 0;
		let run = 1;
		for (let i = 1; i < size; i += 1) if (get(i) === get(i - 1)) {
			run += 1;
			if (run === 5) s += 3;
			else if (run > 5) s += 1;
		} else run = 1;
		for (let i = 0; i + 6 < size; i += 1) if (get(i) && !get(i + 1) && get(i + 2) && get(i + 3) && get(i + 4) && !get(i + 5) && get(i + 6)) {
			const before = i >= 4 && !get(i - 1) && !get(i - 2) && !get(i - 3) && !get(i - 4);
			const after = i + 10 < size && !get(i + 7) && !get(i + 8) && !get(i + 9) && !get(i + 10);
			if (before || after) s += 40;
		}
		return s;
	};
	for (let y = 0; y < size; y += 1) score += line((x) => m[y][x]);
	for (let x = 0; x < size; x += 1) score += line((y) => m[y][x]);
	for (let y = 0; y + 1 < size; y += 1) for (let x = 0; x + 1 < size; x += 1) {
		const c = m[y][x];
		if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
	}
	let dark = 0;
	for (const row of m) for (const v of row) if (v) dark += 1;
	const total = size * size;
	const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
	return score + Math.max(0, k) * 10;
}
/** SVG markup (one path), with the standard 4-module quiet zone. */
function qrSvg(text, opts = {}) {
	const { size, modules } = encodeQr(text);
	const border = 4;
	const dim = size + 8;
	let path = "";
	for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (modules[y][x]) path += `M${x + border},${y + border}h1v1h-1z`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="${(opts.label ?? "QR code").replace(/[<>&"]/g, "")}"><rect width="100%" height="100%" fill="${opts.light ?? "#ffffff"}"/><path d="${path}" fill="${opts.dark ?? "#000000"}"/></svg>`;
}
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
var token = string().min(1).max(64);
var id = string().min(1).max(64);
var touchpoint = _enum([
	"email",
	"whatsapp",
	"sms"
]).optional();
/** The page's own origin, used for links inside emails (PUBLIC_APP_URL overrides it). */
var origin = string().max(200).optional();
var captureSource = _enum([
	"online",
	"desk_tablet",
	"qr"
]);
var role = _enum([
	"owner",
	"manager",
	"front_desk"
]);
/** Verified staff member + role check, outside any hotel transaction. */
async function staffCtx(userId, capability) {
	const ctx = await staffContext(await systemSql(), userId);
	requireRole(ctx, CAN[capability]);
	return {
		ctx,
		actor: {
			kind: "staff",
			id: ctx.userId,
			label: ctx.name || ctx.email || "Staff"
		}
	};
}
/**
* Staff work inside the hotel's RLS transaction. `fn` must use only the `sql`
* it gets: owner-connection work (access.*) belongs before or after, never
* inside (PGLite has one connection, so it would wait forever).
*/
async function staff(userId, capability, fn) {
	const { ctx, actor } = await staffCtx(userId, capability);
	return withTenant(ctx.propertyId, (sql) => fn(sql, ctx, actor));
}
async function guest(stayToken, fn) {
	const propertyId = await propertyForStayToken(await systemSql(), stayToken);
	if (!propertyId) throw new Error("This stay link is not valid.");
	return withTenant(propertyId, fn);
}
async function preference(prefToken, fn) {
	const found = await propertyForPreferenceToken(await systemSql(), prefToken);
	if (!found) throw new Error("This link has expired. Use the newest one from your hotel.");
	return withTenant(found.propertyId, (sql) => fn(sql, found.profileId));
}
async function rateLimit(action, max, windowMs) {
	const { limit } = await import("./rate-limit.server-DDoYdlPJ.mjs");
	limit(action, max, windowMs);
}
/** The caller's origin if the page sent it, else this request's own origin. */
async function originOf(sent) {
	if (sent) return sent;
	const { requestOrigin } = await import("./rate-limit.server-DDoYdlPJ.mjs");
	return requestOrigin();
}
var getHotelContext_createServerFn_handler = createServerRpc({
	id: "9d4621c09dbc5b2b5689c48bc485979be3d228f0b05d73d51cb69c464543e3b1",
	name: "getHotelContext",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getHotelContext.__executeServer(opts));
var getHotelContext = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getHotelContext_createServerFn_handler, async ({ context }) => {
	const sys = await systemSql();
	let ctx;
	try {
		ctx = await staffContext(sys, context.userId);
	} catch (err) {
		if (!(err instanceof NoHotelError)) throw err;
		const who = await userIdentity(sys, context.userId);
		return {
			kind: "onboarding",
			email: who.email,
			name: who.name,
			invitations: (await pendingInvitationsFor(sys, who.email)).map((i) => ({
				propertyName: i.property_name,
				role: i.role
			})),
			demoAvailable: demoEnabled()
		};
	}
	const { pendingCount: pendingCount$1, rooms } = await withTenant(ctx.propertyId, async (sql) => {
		await housekeeping(sql);
		const p = await loadProperty(sql);
		return {
			pendingCount: await pendingCount(sql),
			rooms: p.rooms
		};
	});
	const caps = Object.fromEntries(Object.keys(CAN).map((c) => [c, can(ctx.role, c)]));
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
		pendingCount: pendingCount$1,
		caps
	};
});
var switchHotel_createServerFn_handler = createServerRpc({
	id: "d6e302171a66980686966f995b2c3646fc2ca10801be7ca5868d4aadecce0c66",
	name: "switchHotel",
	filename: "src/lib/staylift/server.ts"
}, (opts) => switchHotel.__executeServer(opts));
var switchHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ propertyId: id })).handler(switchHotel_createServerFn_handler, async ({ context, data }) => setActiveProperty(await systemSql(), context.userId, data.propertyId));
var createHotel_createServerFn_handler = createServerRpc({
	id: "4e81dcef04fc2235d3b2e97e9a8f04a9f01d8ea10d176b2e050d55c2d2d95a28",
	name: "createHotel",
	filename: "src/lib/staylift/server.ts"
}, (opts) => createHotel.__executeServer(opts));
var createHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	name: string().trim().min(2).max(80),
	city: string().trim().min(2).max(60),
	market: _enum([
		"US",
		"UK",
		"EU",
		"AE"
	]),
	timezone: string().max(60).optional(),
	rooms: number().int().min(1).max(5e3),
	starter: boolean()
})).handler(createHotel_createServerFn_handler, async ({ context, data }) => {
	const sys = await systemSql();
	const { propertyId } = await createProperty(sys, context.userId, data);
	const who = await userIdentity(sys, context.userId);
	await withTenant(propertyId, async (sql) => {
		if (data.starter) await seedStarterCatalogue(sql, propertyId);
		await audit(sql, {
			kind: "staff",
			id: context.userId,
			label: who.name || who.email || "Owner"
		}, {
			action: "property.create",
			targetType: "property",
			targetId: propertyId,
			detail: {
				market: data.market,
				starter: data.starter
			}
		});
	});
	return { propertyId };
});
var joinDemoHotel_createServerFn_handler = createServerRpc({
	id: "05aaba487fcbc233348c6e276b575ba5dd741f0e20bd3ea30a6a660c812292ad",
	name: "joinDemoHotel",
	filename: "src/lib/staylift/server.ts"
}, (opts) => joinDemoHotel.__executeServer(opts));
var joinDemoHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(joinDemoHotel_createServerFn_handler, async ({ context }) => joinDemo(await systemSql(), context.userId));
var getInvitation_createServerFn_handler = createServerRpc({
	id: "52f0008d8da2a3b06f5f9c6db968b3e86af326dedf860a2e41ee4d8c3645bc42",
	name: "getInvitation",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getInvitation.__executeServer(opts));
var getInvitation = createServerFn({ method: "GET" }).validator(object({ token: string().min(10).max(100) })).handler(getInvitation_createServerFn_handler, async ({ data }) => {
	await rateLimit("invite-view", 30, 6e5);
	const invite = await invitationPreview(await systemSql(), data.token);
	if (!invite) return null;
	return {
		propertyName: invite.propertyName,
		email: invite.email,
		role: invite.role,
		usable: invite.usable
	};
});
var acceptInvite_createServerFn_handler = createServerRpc({
	id: "dd0938e2d4b98e3b1f1a2316f606b6944d958c6d03103e274ab77842faa3bff9",
	name: "acceptInvite",
	filename: "src/lib/staylift/server.ts"
}, (opts) => acceptInvite.__executeServer(opts));
var acceptInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ token: string().min(10).max(100) })).handler(acceptInvite_createServerFn_handler, async ({ context, data }) => {
	const sys = await systemSql();
	const result = await acceptInvitation(sys, context.userId, data.token);
	const who = await userIdentity(sys, context.userId);
	await withTenant(result.propertyId, (sql) => audit(sql, {
		kind: "staff",
		id: context.userId,
		label: who.name || who.email || "Staff"
	}, {
		action: "team.join",
		targetType: "user",
		targetId: context.userId,
		detail: { role: result.role }
	}));
	return result;
});
var getTeam_createServerFn_handler = createServerRpc({
	id: "7ae1ea1b6d8673262701b83184f6c16cbae90b2df44dba6fb9497ced5a50f542",
	name: "getTeam",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getTeam.__executeServer(opts));
var getTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getTeam_createServerFn_handler, async ({ context }) => {
	const { ctx } = await staffCtx(context.userId, "manageTeam");
	return {
		...await team(await systemSql(), ctx.propertyId),
		me: ctx.userId,
		roles: ROLES
	};
});
var inviteMember_createServerFn_handler = createServerRpc({
	id: "db2b3d40eb31f02147326110ece1ed5ea0935b2cde1308bf899d72b3e0148069",
	name: "inviteMember",
	filename: "src/lib/staylift/server.ts"
}, (opts) => inviteMember.__executeServer(opts));
var inviteMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	email: string().email().max(200),
	role,
	origin
})).handler(inviteMember_createServerFn_handler, async ({ context, data }) => {
	const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
	const inv = await createInvitation(await systemSql(), ctx.propertyId, ctx.userId, data.email, data.role);
	const link = `${publicOrigin(await originOf(data.origin))}/invite/${inv.token}`;
	const property = await withTenant(ctx.propertyId, async (sql) => {
		await audit(sql, actor, {
			action: "team.invite",
			targetType: "invitation",
			targetId: inv.id,
			detail: { role: data.role }
		});
		return loadProperty(sql);
	});
	const body = simpleEmail({
		hotel: property.name,
		heading: `Join ${property.name} on Staylift`,
		lines: [`${actor.label} invited you as ${data.role.replace("_", " ")}. The link works for 7 days.`],
		cta: {
			label: "Accept invitation",
			url: link
		}
	});
	return {
		link,
		emailed: (await sendMail({
			to: inv.email,
			subject: `You're invited to ${property.name} on Staylift`,
			html: body.html,
			text: body.text,
			from: property.settings.senderEmail,
			fromName: "Staylift",
			tag: "invite"
		}).catch(() => ({ delivered: false }))).delivered,
		email: inv.email
	};
});
var revokeInvite_createServerFn_handler = createServerRpc({
	id: "6ca8ff4169fe4f2f1d0839b8a8ac392bc617826522824e6a425518f35c2addda",
	name: "revokeInvite",
	filename: "src/lib/staylift/server.ts"
}, (opts) => revokeInvite.__executeServer(opts));
var revokeInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ invitationId: id })).handler(revokeInvite_createServerFn_handler, async ({ context, data }) => {
	const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
	await revokeInvitation(await systemSql(), ctx.propertyId, data.invitationId);
	await withTenant(ctx.propertyId, (sql) => audit(sql, actor, {
		action: "team.invite_revoke",
		targetType: "invitation",
		targetId: data.invitationId
	}));
	return { ok: true };
});
var changeMemberRole_createServerFn_handler = createServerRpc({
	id: "e6fb41bc403a5f5328ebed10af1f61cc53e7b17424cee73b6d941219cb9242bf",
	name: "changeMemberRole",
	filename: "src/lib/staylift/server.ts"
}, (opts) => changeMemberRole.__executeServer(opts));
var changeMemberRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	userId: id,
	role
})).handler(changeMemberRole_createServerFn_handler, async ({ context, data }) => {
	const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
	const change = await changeRole(await systemSql(), ctx.propertyId, data.userId, data.role);
	await withTenant(ctx.propertyId, (sql) => audit(sql, actor, {
		action: "team.role_change",
		targetType: "user",
		targetId: data.userId,
		detail: change
	}));
	return { ok: true };
});
var removeTeamMember_createServerFn_handler = createServerRpc({
	id: "cd6b93f69b720e98f7d5e72cf5da5a9285399f1fa453ba1125f47a24bffc332b",
	name: "removeTeamMember",
	filename: "src/lib/staylift/server.ts"
}, (opts) => removeTeamMember.__executeServer(opts));
var removeTeamMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ userId: id })).handler(removeTeamMember_createServerFn_handler, async ({ context, data }) => {
	const { ctx, actor } = await staffCtx(context.userId, "manageTeam");
	if (data.userId === ctx.userId) throw new Error("You can't remove yourself. Ask another owner.");
	const removed = await removeMember(await systemSql(), ctx.propertyId, data.userId);
	await withTenant(ctx.propertyId, (sql) => audit(sql, actor, {
		action: "team.remove",
		targetType: "user",
		targetId: data.userId,
		detail: removed
	}));
	return { ok: true };
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "4d9e0b0e70595c89d97274517260c9528711975a1f8b40d4418e1a62aed061ce",
	name: "getSettings",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ origin })).handler(getSettings_createServerFn_handler, async ({ context, data }) => staff(context.userId, "editSettings", async (sql) => {
	const property = await loadProperty(sql);
	const market = marketFor(property.settings.market);
	const rls = await sql.query(`select relname, relrowsecurity from pg_class
         where relname in ('reservations','guest_profiles','consent_events','audit_log') and relkind = 'r'`);
	const lastPurge = await sql.query(`select last_purge_on::text as last_purge_on from properties where id = current_setting('app.property_id', true)`);
	const qrUrl = `${publicOrigin(await originOf(data.origin))}/c/${property.settings.code}`;
	return {
		property,
		market,
		markets: Object.values(MARKETS).map((m) => ({
			id: m.id,
			label: m.label,
			law: m.law
		})),
		security: {
			encryption: await keyStatus(),
			email: mailStatus(property.settings.senderEmail),
			rowLevelSecurity: rls.length > 0 && rls.every((r) => r.relrowsecurity),
			signIn: "email-password"
		},
		lastPurgeOn: lastPurge[0]?.last_purge_on ?? null,
		qr: {
			url: qrUrl,
			svg: qrSvg(qrUrl, {
				dark: "#1f1d1a",
				label: `Check in at ${property.name}`
			})
		}
	};
}));
var saveSettings_createServerFn_handler = createServerRpc({
	id: "f2b5638f220105a28acd107c6154030318cba8e77daef83c72e83e366d809129",
	name: "saveSettings",
	filename: "src/lib/staylift/server.ts"
}, (opts) => saveSettings.__executeServer(opts));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	name: string().trim().min(2).max(80),
	city: string().trim().min(2).max(60),
	market: _enum([
		"US",
		"UK",
		"EU",
		"AE"
	]),
	timezone: string().trim().min(3).max(60),
	rooms: number().int().min(1).max(5e3),
	senderEmail: string().email().max(200).nullable(),
	serviceRetentionDays: number().int().min(1).max(365),
	captureLaunchedOn: string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
})).handler(saveSettings_createServerFn_handler, async ({ context, data }) => staff(context.userId, "editSettings", async (sql, _ctx, actor) => {
	await updateSettings(sql, data);
	await audit(sql, actor, {
		action: "property.settings",
		detail: {
			market: data.market,
			serviceRetentionDays: data.serviceRetentionDays,
			senderEmail: Boolean(data.senderEmail)
		}
	});
	return { ok: true };
}));
var runRetentionNow_createServerFn_handler = createServerRpc({
	id: "b27a391f634e5f170aa211fed3314b684f10e6a840bb79eb7377435b1ae2371c",
	name: "runRetentionNow",
	filename: "src/lib/staylift/server.ts"
}, (opts) => runRetentionNow.__executeServer(opts));
var runRetentionNow = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(runRetentionNow_createServerFn_handler, async ({ context }) => staff(context.userId, "handleDataRequests", (sql) => runPurge(sql)));
var getAuditLog_createServerFn_handler = createServerRpc({
	id: "2c3f9987cf2ae59c43fac8b37f9a50fe19912128a69aef327041b23936198dfd",
	name: "getAuditLog",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getAuditLog.__executeServer(opts));
var getAuditLog = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	action: string().max(40).optional(),
	before: number().int().optional()
})).handler(getAuditLog_createServerFn_handler, async ({ context, data }) => staff(context.userId, "viewAudit", (sql) => listAudit(sql, {
	...data,
	limit: 150
})));
var getDashboard_createServerFn_handler = createServerRpc({
	id: "9545075549869e93ca0c583fa429aa1d82c58b85b483b2f4ef537e04c8d342a6",
	name: "getDashboard",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getDashboard_createServerFn_handler, async ({ context }) => staff(context.userId, "viewOverview", async (sql) => ({
	...await dashboard(sql),
	capture: await captureGate(sql)
})));
var getOverviewExtras_createServerFn_handler = createServerRpc({
	id: "aec118db79e570713ea3df7155b6b77dcbbec8a1c419017e5a787f3d41c319b2",
	name: "getOverviewExtras",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getOverviewExtras.__executeServer(opts));
var getOverviewExtras = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getOverviewExtras_createServerFn_handler, async ({ context }) => staff(context.userId, "viewOverview", (sql) => overviewExtras(sql)));
var getPendingCount_createServerFn_handler = createServerRpc({
	id: "fbd47f9cb0316503104d6f7428666c58cbab158b6d1a1a5270b11a003c7a7bc7",
	name: "getPendingCount",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getPendingCount.__executeServer(opts));
var getPendingCount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getPendingCount_createServerFn_handler, async ({ context }) => staff(context.userId, "workOrders", (sql) => pendingCount(sql)));
var getMeasuredRoi_createServerFn_handler = createServerRpc({
	id: "dcdf4ce052530e28be967214c34b5bc0c162df970ea19c6712b825c442d69d4d",
	name: "getMeasuredRoi",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getMeasuredRoi.__executeServer(opts));
var getMeasuredRoi = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMeasuredRoi_createServerFn_handler, async ({ context }) => staff(context.userId, "viewRoi", async (sql, ctx) => ({
	...await measuredRoi(sql),
	canEditContract: can(ctx.role, "editContract")
})));
var updateEconomics_createServerFn_handler = createServerRpc({
	id: "e5b8875652fbdaad721a9acaa90002547d8c026e1d51b13fb671c088851e8be4",
	name: "updateEconomics",
	filename: "src/lib/staylift/server.ts"
}, (opts) => updateEconomics.__executeServer(opts));
var updateEconomics = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	planId: _enum([
		"A",
		"B",
		"C",
		"custom"
	]),
	perRoomMonthly: number().min(0).max(50),
	baseMonthly: number().min(0).max(5e3),
	revSharePct: number().min(0).max(50),
	marginPct: number().min(0).max(100),
	cardPct: number().min(0).max(10)
})).handler(updateEconomics_createServerFn_handler, async ({ context, data }) => staff(context.userId, "editContract", async (sql, _ctx, actor) => {
	await updateEconomics$1(sql, data);
	await audit(sql, actor, {
		action: "property.economics",
		detail: data
	});
	return { ok: true };
}));
var listReservations_createServerFn_handler = createServerRpc({
	id: "e005ae3fe6737096f628bb575fa2e07981255027cfa2cf35fe354982568de78c",
	name: "listReservations",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listReservations.__executeServer(opts));
var listReservations = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ history: boolean().optional() })).handler(listReservations_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", async (sql, ctx) => ({
	...await reservations(sql, data),
	canErase: can(ctx.role, "handleDataRequests")
})));
var listOffers_createServerFn_handler = createServerRpc({
	id: "7d4d3029c956a2dc0be47a3add105c5cc271c8c19f49451142f9186baf44051a",
	name: "listOffers",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listOffers.__executeServer(opts));
var listOffers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listOffers_createServerFn_handler, async ({ context }) => staff(context.userId, "workOrders", async (sql, ctx) => ({
	offers: await offers(sql),
	canEdit: can(ctx.role, "editOffers")
})));
var listFulfillment_createServerFn_handler = createServerRpc({
	id: "b0d162ce6a18dd112f1335203c458e9a3e56d0bd623aac4d8ac33a22093b5264",
	name: "listFulfillment",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listFulfillment.__executeServer(opts));
var listFulfillment = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listFulfillment_createServerFn_handler, async ({ context }) => staff(context.userId, "workOrders", (sql) => fulfillment(sql)));
var listRecipes_createServerFn_handler = createServerRpc({
	id: "203df204520c9387e632c5da4f2f6d2b6bfc762461bf5eed55a228c0f1c07a57",
	name: "listRecipes",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listRecipes.__executeServer(opts));
var listRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listRecipes_createServerFn_handler, async ({ context }) => staff(context.userId, "editRecipes", (sql) => recipes(sql)));
var getAnalytics_createServerFn_handler = createServerRpc({
	id: "846f0b12b91c3c4d0e7808c19431a224dac23758fc680a55736ae3b1d9d9c01a",
	name: "getAnalytics",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getAnalytics.__executeServer(opts));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getAnalytics_createServerFn_handler, async ({ context }) => staff(context.userId, "viewAnalytics", (sql) => analytics(sql)));
var decideOrder_createServerFn_handler = createServerRpc({
	id: "5b029795fa7d5c45c42b3994b18a742fe9c16adad2e8831db116932a041f8745",
	name: "decideOrder",
	filename: "src/lib/staylift/server.ts"
}, (opts) => decideOrder.__executeServer(opts));
var decideOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	orderId: id,
	decision: _enum(["approve", "decline"])
})).handler(decideOrder_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workOrders", async (sql, _ctx, actor) => {
	const result = await decideOrder$1(sql, data);
	await audit(sql, actor, {
		action: data.decision === "approve" ? "order.approve" : "order.decline",
		targetType: "order",
		targetId: data.orderId
	});
	return result;
}));
var toggleRecipe_createServerFn_handler = createServerRpc({
	id: "b29bfbd1059862c2dcddd6b6480e31368d47de3f903fa9f0efb2f70c07e5e82d",
	name: "toggleRecipe",
	filename: "src/lib/staylift/server.ts"
}, (opts) => toggleRecipe.__executeServer(opts));
var toggleRecipe = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id,
	active: boolean()
})).handler(toggleRecipe_createServerFn_handler, async ({ context, data }) => staff(context.userId, "editRecipes", async (sql, _ctx, actor) => {
	await audit(sql, actor, {
		action: "recipe.toggle",
		targetType: "recipe",
		targetId: data.id,
		detail: { active: data.active }
	});
	return toggleRecipe$1(sql, data);
}));
var toggleOffer_createServerFn_handler = createServerRpc({
	id: "32bdd37eeae6bf4fa697d818b95d9db34d8395eb6050242c7b0fb3ae6d109942",
	name: "toggleOffer",
	filename: "src/lib/staylift/server.ts"
}, (opts) => toggleOffer.__executeServer(opts));
var toggleOffer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id,
	active: boolean()
})).handler(toggleOffer_createServerFn_handler, async ({ context, data }) => staff(context.userId, "editOffers", async (sql, _ctx, actor) => {
	await audit(sql, actor, {
		action: "offer.toggle",
		targetType: "offer",
		targetId: data.id,
		detail: { active: data.active }
	});
	return toggleOffer$1(sql, data);
}));
var sendStayLink_createServerFn_handler = createServerRpc({
	id: "2f8cbd865a42aba2820452b741023497a6fcbd01a6419ebf8747b3a19d632a62",
	name: "sendStayLink",
	filename: "src/lib/staylift/server.ts"
}, (opts) => sendStayLink.__executeServer(opts));
var sendStayLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	recipeId: id.optional(),
	channel: _enum([
		"email",
		"sms",
		"whatsapp"
	])
})).handler(sendStayLink_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", async (sql, _ctx, actor) => {
	const sent = await sendStayLink$1(sql, data);
	await audit(sql, actor, {
		action: "message.stay_link",
		targetType: "reservation",
		targetId: data.reservationId,
		detail: { channel: data.channel }
	});
	return sent;
}));
var logDeskSale_createServerFn_handler = createServerRpc({
	id: "3fdeef47309aa54a8590836c03357942330be4979df8f9e33cdbfcbd14406125",
	name: "logDeskSale",
	filename: "src/lib/staylift/server.ts"
}, (opts) => logDeskSale.__executeServer(opts));
var logDeskSale = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	offerId: id,
	qty: number().int().min(1).max(14)
})).handler(logDeskSale_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workOrders", async (sql, _ctx, actor) => {
	const sale = await logDeskSale$1(sql, data);
	await audit(sql, actor, {
		action: "order.desk_sale",
		targetType: "order",
		targetId: sale.id,
		detail: { amountCents: sale.amountCents }
	});
	return sale;
}));
var ingestReservation_createServerFn_handler = createServerRpc({
	id: "dcb9f0e23412424a06ad2c99eb5eef7f035e116aed5f503821a625237d96763e",
	name: "ingestReservation",
	filename: "src/lib/staylift/server.ts"
}, (opts) => ingestReservation.__executeServer(opts));
var ingestReservation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	bookingRef: string().min(2).max(40),
	source: string().min(2).max(40),
	guestName: string().min(2).max(80),
	arrival: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	departure: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	roomTypeId: id,
	guests: number().int().min(1).max(6),
	emailKind: _enum([
		"real",
		"masked",
		"none"
	]),
	phoneKind: _enum([
		"valid",
		"placeholder",
		"none"
	]),
	origin
})).handler(ingestReservation_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", async (sql, _ctx, actor) => {
	const { origin: from, ...booking } = data;
	const created = await ingestReservation$1(sql, booking, Math.random(), from ?? "");
	await audit(sql, actor, {
		action: "reservation.ingest",
		targetType: "reservation",
		targetId: created.id,
		detail: { source: data.source }
	});
	return created;
}));
var getBookingEmail_createServerFn_handler = createServerRpc({
	id: "e2b6e4f212dd02f9fe0b92b6317531c6bf3bc6e41f70861c5da927171267eda0",
	name: "getBookingEmail",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getBookingEmail.__executeServer(opts));
var getBookingEmail = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	origin
})).handler(getBookingEmail_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", (sql) => bookingEmail(sql, data.reservationId, data.origin)));
var sendBookingEmail_createServerFn_handler = createServerRpc({
	id: "cd0e0af617d785bf3c12f738379100111494112f68f19ac32213e342ddbb3ff3",
	name: "sendBookingEmail",
	filename: "src/lib/staylift/server.ts"
}, (opts) => sendBookingEmail.__executeServer(opts));
var sendBookingEmail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	origin
})).handler(sendBookingEmail_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", (sql) => sendBookingEmail$1(sql, data.reservationId, data.origin)));
var previewEmailParse_createServerFn_handler = createServerRpc({
	id: "7dff6f832948d6de9832cfa9dbd286c537cf1210499fd822757188686edc1b92",
	name: "previewEmailParse",
	filename: "src/lib/staylift/server.ts"
}, (opts) => previewEmailParse.__executeServer(opts));
var previewEmailParse = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ text: string().min(10).max(2e4) })).handler(previewEmailParse_createServerFn_handler, async ({ context, data }) => staff(context.userId, "workReservations", (sql) => previewEmailParse$1(sql, data.text)));
var listRoomTypes_createServerFn_handler = createServerRpc({
	id: "0fc2eb144562abddcd3055adeb402d75c97c47bcd6078f1bd8b4d357ec77427f",
	name: "listRoomTypes",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listRoomTypes.__executeServer(opts));
var listRoomTypes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listRoomTypes_createServerFn_handler, async ({ context }) => staff(context.userId, "workReservations", (sql) => roomTypes(sql)));
var listMessages_createServerFn_handler = createServerRpc({
	id: "77b73ca1f567b1585e3ec27c74056deb367e9eb2899861a4593499d29377762c",
	name: "listMessages",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listMessages.__executeServer(opts));
var listMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMessages_createServerFn_handler, async ({ context }) => staff(context.userId, "viewAnalytics", (sql) => messages(sql)));
var eraseReservation_createServerFn_handler = createServerRpc({
	id: "ac76a16cef04e0a7857b97e80c4a0697c54d85399ebad36edc993c76d1495740",
	name: "eraseReservation",
	filename: "src/lib/staylift/server.ts"
}, (opts) => eraseReservation.__executeServer(opts));
var eraseReservation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ reservationId: id })).handler(eraseReservation_createServerFn_handler, async ({ context, data }) => staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => eraseReservationGuest(sql, data.reservationId, actor)));
var getDeskArrivals_createServerFn_handler = createServerRpc({
	id: "581d4727acbedb864d457a036f184ab16f7ef40b588c781c917e4ebbdd054a43",
	name: "getDeskArrivals",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getDeskArrivals.__executeServer(opts));
var getDeskArrivals = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ origin })).handler(getDeskArrivals_createServerFn_handler, async ({ context, data }) => staff(context.userId, "runDeskTablet", async (sql) => {
	const property = await loadProperty(sql);
	const qrUrl = `${publicOrigin(await originOf(data.origin))}/c/${property.settings.code}`;
	return {
		...await deskArrivals(sql),
		property: {
			name: property.name,
			city: property.city
		},
		qr: {
			url: qrUrl,
			svg: qrSvg(qrUrl, {
				dark: "#1f1d1a",
				label: `Check in at ${property.name}`
			})
		}
	};
}));
var listGuests_createServerFn_handler = createServerRpc({
	id: "afe7519908a32cd31fbcab0eb11f3c1f235412bc5422ec3809d4e4b97f05ea20",
	name: "listGuests",
	filename: "src/lib/staylift/server.ts"
}, (opts) => listGuests.__executeServer(opts));
var listGuests = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	search: string().max(120).optional(),
	filter: _enum([
		"all",
		"marketable",
		"returning",
		"occasions"
	]).optional()
})).handler(listGuests_createServerFn_handler, async ({ context, data }) => staff(context.userId, "viewGuests", async (sql) => ({
	...await listProfiles(sql, data),
	upcoming: await upcomingOccasions(sql, 60)
})));
var getGuest_createServerFn_handler = createServerRpc({
	id: "39478a1460895f3242bb9f313b637cfd87eca1354656ae34614db6a7313c10a5",
	name: "getGuest",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getGuest.__executeServer(opts));
var getGuest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(getGuest_createServerFn_handler, async ({ context, data }) => staff(context.userId, "viewGuests", async (sql, ctx) => ({
	...await profileDetail(sql, data.profileId),
	caps: {
		reveal: can(ctx.role, "revealContacts"),
		dataRequests: can(ctx.role, "handleDataRequests"),
		merge: can(ctx.role, "mergeProfiles")
	}
})));
var revealGuestContact_createServerFn_handler = createServerRpc({
	id: "021e8bd7380c8d5fb98e911b429c9995517a4dba702ab6b98dcbf1c43758a1c6",
	name: "revealGuestContact",
	filename: "src/lib/staylift/server.ts"
}, (opts) => revealGuestContact.__executeServer(opts));
var revealGuestContact = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	profileId: id,
	reason: string().trim().min(3).max(200)
})).handler(revealGuestContact_createServerFn_handler, async ({ context, data }) => staff(context.userId, "revealContacts", async (sql, _ctx, actor) => {
	const contact = await revealContact(sql, data.profileId);
	await audit(sql, actor, {
		action: "contact.reveal",
		targetType: "profile",
		targetId: data.profileId,
		detail: {
			reason: data.reason,
			email: Boolean(contact.email),
			phone: Boolean(contact.phone)
		}
	});
	return contact;
}));
var exportGuest_createServerFn_handler = createServerRpc({
	id: "753e3ca194d5cd39f4956c60532d4585952a6518c7f94eeff295abf561c9645b",
	name: "exportGuest",
	filename: "src/lib/staylift/server.ts"
}, (opts) => exportGuest.__executeServer(opts));
var exportGuest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(exportGuest_createServerFn_handler, async ({ context, data }) => staff(context.userId, "handleDataRequests", async (sql, _ctx, actor) => {
	const exported = await exportProfile(sql, data.profileId);
	await audit(sql, actor, {
		action: "profile.export",
		targetType: "profile",
		targetId: data.profileId
	});
	return exported;
}));
var eraseGuest_createServerFn_handler = createServerRpc({
	id: "7f6e2211878171d12047e966b64701ef6355ddb3bc8a1760ce4360e60e6c8f77",
	name: "eraseGuest",
	filename: "src/lib/staylift/server.ts"
}, (opts) => eraseGuest.__executeServer(opts));
var eraseGuest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(eraseGuest_createServerFn_handler, async ({ context, data }) => staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => eraseProfile(sql, data.profileId, actor, "staff")));
var mergeGuests_createServerFn_handler = createServerRpc({
	id: "2fd3707d91e734357596ab1d9abef609c430f1826a25df3787165d4b7432d819",
	name: "mergeGuests",
	filename: "src/lib/staylift/server.ts"
}, (opts) => mergeGuests.__executeServer(opts));
var mergeGuests = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	keepId: id,
	mergeId: id
})).handler(mergeGuests_createServerFn_handler, async ({ context, data }) => staff(context.userId, "mergeProfiles", (sql, _ctx, actor) => mergeProfiles(sql, data.keepId, data.mergeId, actor)));
var withdrawGuestConsent_createServerFn_handler = createServerRpc({
	id: "ce67451a44df279ecc73ddf948737ad988364a8675bb88b28cf80af9fc8b5b16",
	name: "withdrawGuestConsent",
	filename: "src/lib/staylift/server.ts"
}, (opts) => withdrawGuestConsent.__executeServer(opts));
var withdrawGuestConsent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	profileId: id,
	purpose: _enum([
		"marketing_email",
		"marketing_whatsapp",
		"profile_memory"
	])
})).handler(withdrawGuestConsent_createServerFn_handler, async ({ context, data }) => staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => updateConsents(sql, {
	profileId: data.profileId,
	changes: { [data.purpose]: false },
	source: "staff",
	actor
})));
var occasionInput = object({
	kind: _enum([
		"birthday",
		"anniversary",
		"achievement",
		"other"
	]),
	label: string().max(60).nullable(),
	month: number().int().min(1).max(12),
	day: number().int().min(1).max(31).nullable(),
	companionId: id.nullable()
});
var addGuestOccasion_createServerFn_handler = createServerRpc({
	id: "7b76b4f15471b776d63aae77ab14dede98d4a30f5078f6504dd73a870c0ad5a5",
	name: "addGuestOccasion",
	filename: "src/lib/staylift/server.ts"
}, (opts) => addGuestOccasion.__executeServer(opts));
var addGuestOccasion = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(occasionInput.extend({ profileId: id })).handler(addGuestOccasion_createServerFn_handler, async ({ context, data }) => staff(context.userId, "handleDataRequests", (sql, _ctx, actor) => addOccasion(sql, {
	...data,
	source: "staff",
	actor
})));
var getStay_createServerFn_handler = createServerRpc({
	id: "913f2c3bfc30e3f2e5dc8e4ba4d80b162148e9e0dbc83f47fa7f23bcccd834cb",
	name: "getStay",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getStay.__executeServer(opts));
var getStay = createServerFn({ method: "GET" }).validator(object({ token })).handler(getStay_createServerFn_handler, async ({ data }) => guest(data.token, async (sql) => {
	const stay = await stayPage(sql, data.token);
	const market = marketFor(stay.property.settings.market);
	return {
		...stay,
		capture: {
			market: {
				id: market.id,
				explicitSpecialCategory: market.explicitSpecialCategory,
				dialCode: market.dialCode
			},
			wording: Object.fromEntries(CONSENT_PURPOSES.map((p) => [p, consentWording(p, stay.property.name, market)])),
			holidays: [...market.holidays, ...Object.keys(HOLIDAYS).filter((h) => !market.holidays.includes(h))].map((id) => ({
				id,
				label: HOLIDAYS[id].label,
				when: HOLIDAYS[id].when
			})),
			whatsappAvailable: !process.env.DATABASE_URL?.trim()
		}
	};
}));
var recordStayView_createServerFn_handler = createServerRpc({
	id: "d5512689bf8a39527cf4ee62fa0277df60d3e2918b45b9e6a5baacbefbf78d88",
	name: "recordStayView",
	filename: "src/lib/staylift/server.ts"
}, (opts) => recordStayView.__executeServer(opts));
var recordStayView = createServerFn({ method: "POST" }).validator(object({
	token,
	source: touchpoint
})).handler(recordStayView_createServerFn_handler, async ({ data }) => guest(data.token, (sql) => recordStayView$1(sql, data.token, data.source)));
var purchaseOffer_createServerFn_handler = createServerRpc({
	id: "239081f157676747d342000e32b55dd13093091740bf20f98a203013d6911d1a",
	name: "purchaseOffer",
	filename: "src/lib/staylift/server.ts"
}, (opts) => purchaseOffer.__executeServer(opts));
var purchaseOffer = createServerFn({ method: "POST" }).validator(object({
	token,
	offerId: id,
	qty: number().int().min(1).max(14),
	forTime: string().max(8).optional(),
	source: touchpoint
})).handler(purchaseOffer_createServerFn_handler, async ({ data }) => guest(data.token, (sql) => purchaseOffer$1(sql, data)));
var startCheckin_createServerFn_handler = createServerRpc({
	id: "ac6a799d19eee88353c19c408e4044f8250b98c6abcc95da7eec3ef6db9b94a5",
	name: "startCheckin",
	filename: "src/lib/staylift/server.ts"
}, (opts) => startCheckin.__executeServer(opts));
var startCheckin = createServerFn({ method: "POST" }).validator(object({
	token,
	source: captureSource
})).handler(startCheckin_createServerFn_handler, async ({ data }) => guest(data.token, (sql) => startCapture(sql, data.token, data.source)));
var checkinStep_createServerFn_handler = createServerRpc({
	id: "0688b094825bfa89b977a6f74563d5cd4c9e5c3dcbee487d5f0be7c6bb7f5d19",
	name: "checkinStep",
	filename: "src/lib/staylift/server.ts"
}, (opts) => checkinStep.__executeServer(opts));
var checkinStep = createServerFn({ method: "POST" }).validator(object({
	token,
	step: _enum(["celebration", "party"]),
	source: captureSource
})).handler(checkinStep_createServerFn_handler, async ({ data }) => guest(data.token, (sql) => captureStep(sql, data.token, data.step, data.source)));
var sendCheckinCode_createServerFn_handler = createServerRpc({
	id: "325a259afd1c9c0c06b1286ca19fec58fba47b9b5280a2d44935b9c843c1f010",
	name: "sendCheckinCode",
	filename: "src/lib/staylift/server.ts"
}, (opts) => sendCheckinCode.__executeServer(opts));
var sendCheckinCode = createServerFn({ method: "POST" }).validator(object({
	token,
	channel: _enum(["email", "whatsapp"]),
	value: string().trim().min(5).max(200),
	source: captureSource
})).handler(sendCheckinCode_createServerFn_handler, async ({ data }) => {
	await rateLimit("send-code", 10, 36e5);
	return guest(data.token, (sql) => sendContactCode(sql, data));
});
var verifyCheckinCode_createServerFn_handler = createServerRpc({
	id: "e02fd2fdd5b86f3d574498ab7e609095ba418ac09d677819f85d31ad1f1530f0",
	name: "verifyCheckinCode",
	filename: "src/lib/staylift/server.ts"
}, (opts) => verifyCheckinCode.__executeServer(opts));
var verifyCheckinCode = createServerFn({ method: "POST" }).validator(object({
	token,
	verificationId: id,
	code: string().trim().min(4).max(12),
	source: captureSource
})).handler(verifyCheckinCode_createServerFn_handler, async ({ data }) => {
	await rateLimit("verify-code", 30, 9e5);
	return guest(data.token, (sql) => verifyContactCode(sql, data));
});
var partyMember = union([object({
	relation: _enum([
		"partner",
		"parent",
		"sibling",
		"friend",
		"colleague",
		"other"
	]),
	firstName: string().trim().min(1).max(40)
}), object({
	relation: literal("child"),
	ageBand: _enum([
		"0-2",
		"3-12",
		"13-17"
	])
})]);
var completeCheckin_createServerFn_handler = createServerRpc({
	id: "1bd6e17c4f2408addcfb9940a60f81f3fc98ea0a29d89bd3f2bb58e4fbff1a30",
	name: "completeCheckin",
	filename: "src/lib/staylift/server.ts"
}, (opts) => completeCheckin.__executeServer(opts));
var completeCheckin = createServerFn({ method: "POST" }).validator(object({
	token,
	source: captureSource,
	ticket: string().max(64).nullable(),
	eta: string().max(5),
	celebration: object({
		kind: _enum([
			"birthday",
			"anniversary",
			"honeymoon",
			"achievement",
			"other"
		]),
		whose: _enum([
			"me",
			"partner",
			"someone"
		]),
		month: number().int().min(1).max(12).nullable(),
		day: number().int().min(1).max(31).nullable()
	}).nullable(),
	party: array(partyMember).max(8),
	consents: object({
		marketing_email: boolean(),
		marketing_whatsapp: boolean(),
		profile_memory: boolean()
	}),
	holidays: array(string().max(30)).max(12)
})).handler(completeCheckin_createServerFn_handler, async ({ data }) => guest(data.token, (sql) => completeCapture(sql, data)));
var requestPreferenceLink_createServerFn_handler = createServerRpc({
	id: "1f7d0a027e68fcee8004685a0f57aa335f3b884cd00e48f97ce1db186564b5c0",
	name: "requestPreferenceLink",
	filename: "src/lib/staylift/server.ts"
}, (opts) => requestPreferenceLink.__executeServer(opts));
var requestPreferenceLink = createServerFn({ method: "POST" }).validator(object({
	token,
	origin
})).handler(requestPreferenceLink_createServerFn_handler, async ({ data }) => {
	await rateLimit("pref-link", 5, 36e5);
	const from = publicOrigin(await originOf(data.origin));
	return guest(data.token, (sql) => sendPreferenceLink(sql, data.token, from));
});
var getPreferences_createServerFn_handler = createServerRpc({
	id: "6c14355976ba9ea29ccde4f718f53600bebd566211a8634350374ee89de38fb1",
	name: "getPreferences",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getPreferences.__executeServer(opts));
var getPreferences = createServerFn({ method: "GET" }).validator(object({ token: string().min(10).max(64) })).handler(getPreferences_createServerFn_handler, async ({ data }) => {
	await rateLimit("pref-view", 60, 6e5);
	return preference(data.token, async (sql, profileId) => {
		const view = await profileView(sql, profileId);
		const property = await loadProperty(sql);
		const market = marketFor(property.settings.market);
		return {
			...view,
			hotel: {
				name: property.name,
				city: property.city
			},
			holidayOptions: [...market.holidays, ...Object.keys(HOLIDAYS).filter((h) => !market.holidays.includes(h))].map((id) => ({
				id,
				label: HOLIDAYS[id].label
			}))
		};
	});
});
var updatePreferences_createServerFn_handler = createServerRpc({
	id: "50fa145fa4073297b8b7493db33c0ac9eadf69cadf05f0045fb6fef77a83f7dc",
	name: "updatePreferences",
	filename: "src/lib/staylift/server.ts"
}, (opts) => updatePreferences.__executeServer(opts));
var updatePreferences = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	changes: object({
		marketing_email: boolean().optional(),
		marketing_whatsapp: boolean().optional(),
		profile_memory: boolean().optional()
	})
})).handler(updatePreferences_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => updateConsents(sql, {
	profileId,
	changes: data.changes,
	source: "preference_centre",
	actor: {
		kind: "guest",
		id: profileId,
		label: "Guest"
	}
})));
var prefAddOccasion_createServerFn_handler = createServerRpc({
	id: "8fc0df752e0d913f54d05bec3a0183ff3e5f9efd8da411e3c7adb43ec7ff1b78",
	name: "prefAddOccasion",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefAddOccasion.__executeServer(opts));
var prefAddOccasion = createServerFn({ method: "POST" }).validator(occasionInput.extend({ token: string().min(10).max(64) })).handler(prefAddOccasion_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => {
	const { token: _t, ...occ } = data;
	return addOccasion(sql, {
		...occ,
		profileId,
		source: "guest",
		actor: {
			kind: "guest",
			id: profileId,
			label: "Guest"
		}
	});
}));
var prefRemoveOccasion_createServerFn_handler = createServerRpc({
	id: "2d4f7264fc4f2459357ee7035247276b797b201944bd7cd614adcf980bbf8109",
	name: "prefRemoveOccasion",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefRemoveOccasion.__executeServer(opts));
var prefRemoveOccasion = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	occasionId: id
})).handler(prefRemoveOccasion_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => removeOccasion(sql, profileId, data.occasionId)));
var prefRemoveCompanion_createServerFn_handler = createServerRpc({
	id: "d396bc2b687216c429fcf7b3328e33bf1fdaf300ad317284fa7afa32bb4bc6e4",
	name: "prefRemoveCompanion",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefRemoveCompanion.__executeServer(opts));
var prefRemoveCompanion = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	companionId: id
})).handler(prefRemoveCompanion_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => removeCompanion(sql, profileId, data.companionId)));
var prefSetHolidays_createServerFn_handler = createServerRpc({
	id: "9a2f5b87cb046b1775cbdee1d4e8108471270c173f54cc2ae497dc8aa8b46af5",
	name: "prefSetHolidays",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefSetHolidays.__executeServer(opts));
var prefSetHolidays = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	holidays: array(string().max(30)).max(12)
})).handler(prefSetHolidays_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => setHolidays(sql, profileId, data.holidays)));
var prefExport_createServerFn_handler = createServerRpc({
	id: "bdc0ca3502e5364a756bf76b652e3d31d1ffefa5ddf2e425a96c948c8f9a554a",
	name: "prefExport",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefExport.__executeServer(opts));
var prefExport = createServerFn({ method: "POST" }).validator(object({ token: string().min(10).max(64) })).handler(prefExport_createServerFn_handler, async ({ data }) => preference(data.token, async (sql, profileId) => {
	const exported = await exportProfile(sql, profileId);
	await audit(sql, {
		kind: "guest",
		id: profileId,
		label: "Guest"
	}, {
		action: "guest.export",
		targetType: "profile",
		targetId: profileId
	});
	return exported;
}));
var prefErase_createServerFn_handler = createServerRpc({
	id: "c4cf51e1831de7d1d4b1cdddd81cb957abcd6a5e0d96e4355bcd85493a2d59cc",
	name: "prefErase",
	filename: "src/lib/staylift/server.ts"
}, (opts) => prefErase.__executeServer(opts));
var prefErase = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	confirm: literal("DELETE")
})).handler(prefErase_createServerFn_handler, async ({ data }) => preference(data.token, (sql, profileId) => eraseProfile(sql, profileId, {
	kind: "guest",
	id: profileId,
	label: "Guest"
}, "guest")));
var getQrHotel_createServerFn_handler = createServerRpc({
	id: "c2257585c8f2fe8c845c2614ebf1722ff53564687644423552d6adab7a6493ec",
	name: "getQrHotel",
	filename: "src/lib/staylift/server.ts"
}, (opts) => getQrHotel.__executeServer(opts));
var getQrHotel = createServerFn({ method: "GET" }).validator(object({ code: string().min(1).max(64) })).handler(getQrHotel_createServerFn_handler, async ({ data }) => {
	const hotel = await propertyForCode(await systemSql(), data.code);
	return hotel ? {
		name: hotel.name,
		city: hotel.city
	} : null;
});
var findQrBooking_createServerFn_handler = createServerRpc({
	id: "73512983923880c972921de3ef375982b7131185b45d0a7edbc0e8f7b8bb253b",
	name: "findQrBooking",
	filename: "src/lib/staylift/server.ts"
}, (opts) => findQrBooking.__executeServer(opts));
var findQrBooking = createServerFn({ method: "POST" }).validator(object({
	code: string().min(1).max(64),
	lastName: string().trim().min(2).max(60),
	bookingRef: string().trim().min(4).max(40)
})).handler(findQrBooking_createServerFn_handler, async ({ data }) => {
	await rateLimit("qr-lookup", 8, 9e5);
	const hotel = await propertyForCode(await systemSql(), data.code);
	if (!hotel) throw new Error("Unknown hotel.");
	return withTenant(hotel.id, (sql) => findBookingForQr(sql, data));
});
//#endregion
export { acceptInvite_createServerFn_handler, addGuestOccasion_createServerFn_handler, changeMemberRole_createServerFn_handler, checkinStep_createServerFn_handler, completeCheckin_createServerFn_handler, createHotel_createServerFn_handler, decideOrder_createServerFn_handler, eraseGuest_createServerFn_handler, eraseReservation_createServerFn_handler, exportGuest_createServerFn_handler, findQrBooking_createServerFn_handler, getAnalytics_createServerFn_handler, getAuditLog_createServerFn_handler, getBookingEmail_createServerFn_handler, getDashboard_createServerFn_handler, getDeskArrivals_createServerFn_handler, getGuest_createServerFn_handler, getHotelContext_createServerFn_handler, getInvitation_createServerFn_handler, getMeasuredRoi_createServerFn_handler, getOverviewExtras_createServerFn_handler, getPendingCount_createServerFn_handler, getPreferences_createServerFn_handler, getQrHotel_createServerFn_handler, getSettings_createServerFn_handler, getStay_createServerFn_handler, getTeam_createServerFn_handler, ingestReservation_createServerFn_handler, inviteMember_createServerFn_handler, joinDemoHotel_createServerFn_handler, listFulfillment_createServerFn_handler, listGuests_createServerFn_handler, listMessages_createServerFn_handler, listOffers_createServerFn_handler, listRecipes_createServerFn_handler, listReservations_createServerFn_handler, listRoomTypes_createServerFn_handler, logDeskSale_createServerFn_handler, mergeGuests_createServerFn_handler, prefAddOccasion_createServerFn_handler, prefErase_createServerFn_handler, prefExport_createServerFn_handler, prefRemoveCompanion_createServerFn_handler, prefRemoveOccasion_createServerFn_handler, prefSetHolidays_createServerFn_handler, previewEmailParse_createServerFn_handler, purchaseOffer_createServerFn_handler, recordStayView_createServerFn_handler, removeTeamMember_createServerFn_handler, requestPreferenceLink_createServerFn_handler, revealGuestContact_createServerFn_handler, revokeInvite_createServerFn_handler, runRetentionNow_createServerFn_handler, saveSettings_createServerFn_handler, sendBookingEmail_createServerFn_handler, sendCheckinCode_createServerFn_handler, sendStayLink_createServerFn_handler, startCheckin_createServerFn_handler, switchHotel_createServerFn_handler, toggleOffer_createServerFn_handler, toggleRecipe_createServerFn_handler, updateEconomics_createServerFn_handler, updatePreferences_createServerFn_handler, verifyCheckinCode_createServerFn_handler, withdrawGuestConsent_createServerFn_handler };
