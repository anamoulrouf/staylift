import { a as money, c as priceHint, o as nightsBetween, r as formatDate } from "./format-CAsbM_bU.mjs";
import { n as isNightly, t as computeAmount } from "./pricing-qOBERzJ7.mjs";
import { n as audit } from "./audit-CWKuUfF1.mjs";
import { c as isMarketId, l as marketFor, n as CONSENT_VERSION, o as consentWording, r as HOLIDAYS, s as isHolidayId, t as CONSENT_PURPOSES, u as otaRetention } from "./markets-CIpFMBqe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guests-DZdeWPp9.js
/**
* Contact normalisation, validation and masking (pure; client and server).
* Normalised values feed the blind index, so the rules here decide what counts
* as "the same contact" when matching guest profiles.
*/
var RELAY_DOMAINS = [
	"guest.booking.com",
	"m.expediapartnercentral.com",
	"agoda-messaging.com",
	"guest.airbnb.com",
	"trip.com"
];
function normalizeEmail(raw) {
	const v = raw.trim().toLowerCase();
	if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return null;
	return v;
}
/** OTA relay inboxes forward to the guest but are not the guest's own address. */
function isRelayEmail(email) {
	const domain = email.split("@")[1] ?? "";
	return RELAY_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
/**
* E.164-style: "+<country><number>", 8–15 digits. Numbers without a country
* code take the hotel market's code; EU hotels must have one typed, since the
* EU has no single code.
*/
function normalizePhone(raw, marketId) {
	let v = raw.trim().replace(/[\s().-]/g, "");
	if (v.startsWith("00")) v = `+${v.slice(2)}`;
	if (!v.startsWith("+")) {
		const dial = marketFor(marketId).dialCode;
		if (!dial) return null;
		v = `+${dial}${v.replace(/^0+/, "")}`;
	}
	const digits = v.slice(1);
	if (!/^\d{8,15}$/.test(digits)) return null;
	if (/^(\d)\1+$/.test(digits.slice(-8)) || /123456789|987654321/.test(digits)) return null;
	return `+${digits}`;
}
function maskEmail(email) {
	const [user = "", domain = ""] = email.split("@");
	return `${user.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(5, user.length - 1)))}@${domain}`;
}
function maskPhone(phone) {
	return `+•• •••• ••${phone.replace(/\D/g, "").slice(-2)}`;
}
/** "Maya Kapoor" -> "M. K." — what a purged reservation keeps for the books. */
function initials(fullName) {
	return fullName.trim().split(/\s+/).filter(Boolean).map((p) => `${p[0]?.toUpperCase() ?? ""}.`).join(" ");
}
function env$1(name) {
	const v = typeof process !== "undefined" ? process.env[name] : void 0;
	return v && v.trim() ? v.trim() : void 0;
}
function mailStatus(senderEmail) {
	const from = senderEmail || env$1("STAYLIFT_FROM_EMAIL") || null;
	if (env$1("POSTMARK_SERVER_TOKEN")) return {
		mode: "postmark",
		from
	};
	return {
		mode: env$1("DATABASE_URL") ? "missing" : "dev-outbox",
		from
	};
}
async function sendMail(input) {
	const token = env$1("POSTMARK_SERVER_TOKEN");
	if (!token) {
		if (env$1("DATABASE_URL")) throw new Error("Email is not set up yet: add POSTMARK_SERVER_TOKEN and a sender address in Settings.");
		return {
			delivered: false,
			provider: "dev-outbox",
			preview: {
				to: input.to,
				subject: input.subject,
				text: input.text
			}
		};
	}
	const fromAddress = input.from || env$1("STAYLIFT_FROM_EMAIL");
	if (!fromAddress) throw new Error("No sender address: set one in Settings or STAYLIFT_FROM_EMAIL.");
	const from = input.fromName ? `${input.fromName.replace(/[<>"]/g, "")} <${fromAddress}>` : fromAddress;
	const res = await fetch("https://api.postmarkapp.com/email", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-Postmark-Server-Token": token
		},
		body: JSON.stringify({
			From: from,
			To: input.to,
			Subject: input.subject,
			HtmlBody: input.html,
			TextBody: input.text,
			MessageStream: input.stream ?? "outbound",
			Tag: input.tag
		})
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok || body.ErrorCode && body.ErrorCode !== 0) throw new Error(`Email was not sent: ${body.Message ?? res.statusText}`);
	return {
		delivered: true,
		provider: "postmark",
		messageId: body.MessageID ?? ""
	};
}
/** Minimal branded wrapper for short service emails (codes, invites). */
function simpleEmail(opts) {
	const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	return {
		html: `<!doctype html><html><body style="margin:0;background:#f3eee6;font-family:Helvetica,Arial,sans-serif;color:#1f1d1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#fffdf9;border-radius:12px;padding:28px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7a7368">${esc(opts.hotel)}</td></tr>
<tr><td style="padding-top:12px;font-size:22px;font-weight:600">${esc(opts.heading)}</td></tr>
${opts.lines.map((l) => `<tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${esc(l)}</td></tr>`).join("")}
${opts.cta ? `<tr><td style="padding-top:20px"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:#17503f;color:#f3eee6;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:15px">${esc(opts.cta.label)}</a></td></tr>` : ""}
</table></td></tr></table></body></html>`,
		text: [
			opts.hotel,
			"",
			opts.heading,
			"",
			...opts.lines,
			...opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : []
		].join("\n")
	};
}
var MONTHS = {
	january: "01",
	february: "02",
	march: "03",
	april: "04",
	may: "05",
	june: "06",
	july: "07",
	august: "08",
	september: "09",
	october: "10",
	november: "11",
	december: "12"
};
function toIso(raw) {
	const trimmed = raw.trim();
	const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (iso) return iso[0];
	const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (us) {
		const m = us[1].padStart(2, "0");
		const d = us[2].padStart(2, "0");
		return `${us[3]}-${m}-${d}`;
	}
	const long = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
	if (long) {
		const month = MONTHS[long[2].toLowerCase()];
		if (!month) return null;
		return `${long[3]}-${month}-${long[1].padStart(2, "0")}`;
	}
	return null;
}
function detectSource(text) {
	if (/booking\.com/i.test(text)) return "Booking.com";
	if (/expedia/i.test(text)) return "Expedia";
	if (/agoda/i.test(text)) return "Agoda";
	if (/airbnb/i.test(text)) return "Airbnb";
	return "Forwarded email";
}
function emailKind(email) {
	if (!email) return "none";
	if (/guest\.booking\.com|mci\.hotels\.expedia|guest\.agoda|expediapartnercentral|airbnb\.com$/i.test(email)) return "masked";
	return "real";
}
function phoneKind(phone) {
	if (!phone) return "none";
	const digits = phone.replace(/\D/g, "");
	if (!digits || /^1+$/.test(digits) || digits.length < 8) return "placeholder";
	return "valid";
}
function parseReservationEmail(text) {
	const body = text.trim();
	if (body.length < 20) return { error: "Paste a full confirmation email." };
	const refMatch = body.match(/(?:reservation|confirmation|booking)\s*(?:number|no\.?|id|code|#)\s*[:#]?\s*([A-Z0-9-]*\d[A-Z0-9-]*)/i);
	const nameMatch = body.match(/(?:guest(?:\s*name)?|name)\s*[:.]\s*([A-Za-z][A-Za-z' .-]{1,60})/i);
	const inMatch = body.match(/check[-\s]?in\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
	const outMatch = body.match(/check[-\s]?out\s*[:.]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
	const roomMatch = body.match(/room(?:\s*type)?\s*[:.]\s*([A-Za-z][A-Za-z ]{2,40})/i);
	const guestsMatch = body.match(/(?:number of guests|guests|occupancy)\s*[:.]\s*(\d{1,2})/i);
	const emailMatch = body.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	const phoneMatch = body.match(/(?:telephone|phone|mobile|tel)\s*[:.]\s*([+\d][\d .()-]{6,})/i);
	if (!nameMatch) return { error: "Could not find a guest name." };
	const arrival = inMatch ? toIso(inMatch[1]) : null;
	const departure = outMatch ? toIso(outMatch[1]) : null;
	if (!arrival || !departure) return { error: "Could not read check-in and check-out dates." };
	if (departure <= arrival) return { error: "Departure must be after arrival." };
	return {
		bookingRef: refMatch?.[1] ?? `EM-${Date.now().toString(36).toUpperCase()}`,
		source: detectSource(body),
		guestName: nameMatch[1].trim().replace(/\s+/g, " "),
		arrival,
		departure,
		roomTypeHint: (roomMatch?.[1] ?? "Standard Queen").trim(),
		guests: guestsMatch ? Number(guestsMatch[1]) : 2,
		emailKind: emailKind(emailMatch?.[0]),
		phoneKind: phoneKind(phoneMatch?.[1])
	};
}
var DAY = 864e5;
function utc(day) {
	return Date.parse(`${day.slice(0, 10)}T00:00:00Z`);
}
/** True when any night of the stay is a Friday or Saturday night. */
function includesWeekendNight(arrival, nights) {
	for (let i = 0; i < nights; i += 1) {
		const dow = new Date(utc(arrival) + i * DAY).getUTCDay();
		if (dow === 5 || dow === 6) return true;
	}
	return false;
}
function has(notes, ...words) {
	return words.some((w) => notes.includes(w));
}
function plural(n, one, many = `${one}s`) {
	return `${n} ${n === 1 ? one : many}`;
}
var WORDS = [
	"zero",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven"
];
var word = (n) => WORDS[n] ?? String(n);
var RULES = {
	upgrade: (c, o) => {
		let score = 30;
		let reason = `More room for your ${plural(c.nights, "night")} — ${o.shortLabel}`;
		if (c.standardRoom && c.nights >= 2) score += 25;
		if (has(c.notes, "quiet")) {
			score += 25;
			reason = `You asked for quiet: the ${o.shortLabel} faces the courtyard`;
		}
		if (has(c.notes, "anniversary", "honeymoon", "birthday", "celebrat")) {
			score += 30;
			reason = `For the occasion — ${o.shortLabel}`;
		}
		return {
			score,
			reason
		};
	},
	breakfast: (c) => {
		let score = 25;
		if (c.couple) score += 25;
		if (c.nights >= 2) score += 10;
		const mornings = c.nights === 1 ? "on your morning" : `all ${word(c.nights)} mornings`;
		return {
			score,
			reason: c.couple ? `For ${word(c.guests)}, ${mornings}` : `${mornings[0].toUpperCase()}${mornings.slice(1)}`
		};
	},
	spa: (c) => {
		let score = 15;
		let reason = "An hour off your feet, off the courtyard";
		if (c.weekend) {
			score += 25;
			reason = "Your stay includes a weekend night";
		}
		if (has(c.notes, "anniversary", "honeymoon", "birthday", "celebrat")) {
			score += 25;
			reason = "For the occasion — book a treatment for two";
		}
		return {
			score,
			reason
		};
	},
	transfer: (c) => {
		let score = 15;
		let reason = `Flying into ${c.city}? A driver meets you and waits 45 minutes`;
		if (c.ota && c.leadDays >= 2) score += 15;
		if (has(c.notes, "flight", "airport", "fly", "plane")) {
			score += 30;
			reason = "You mentioned your flight — your driver tracks it";
		}
		return {
			score,
			reason
		};
	},
	parking: (c) => {
		let score = 10;
		let reason = "Driving in? A covered spot is held for you";
		if (has(c.notes, "car", "drive", "driving", "parking", "road trip")) {
			score += 35;
			reason = "You're driving in — your covered spot is held";
		}
		return {
			score,
			reason
		};
	},
	late_checkout: (c) => {
		let score = 20;
		if (c.nights === 1) score += 15;
		return {
			score,
			reason: "Keep the room until 2 PM on your last day"
		};
	},
	early_checkin: (c) => {
		let score = 20;
		let reason = "Settle in from noon instead of three";
		if (has(c.notes, "early", "morning arrival", "red-eye", "red eye")) {
			score += 35;
			reason = "Arriving early? Your room is ready at noon";
		}
		return {
			score,
			reason
		};
	},
	fb: () => ({
		score: 15,
		reason: "From the house kitchen"
	})
};
function personalize(reservation, offers, opts) {
	const ctx = {
		nights: reservation.nights,
		guests: reservation.guests,
		couple: reservation.guests >= 2,
		weekend: includesWeekendNight(reservation.arrival, reservation.nights),
		leadDays: Math.round((utc(reservation.arrival) - utc(opts.today)) / DAY),
		standardRoom: reservation.roomTypeId === (opts.standardRoomId ?? "rt_standard"),
		ota: reservation.source !== "Direct",
		notes: (reservation.notes ?? "").toLowerCase(),
		city: opts.city
	};
	const scored = offers.map((offer) => {
		const { score, reason } = (RULES[offer.category] ?? RULES.fb)(ctx, offer);
		return {
			offerId: offer.id,
			score,
			reason,
			sort: offer.sortOrder
		};
	}).sort((a, b) => b.score - a.score || a.sort - b.sort);
	const limit = opts.limit ?? 3;
	const picks = scored.slice(0, limit).map(({ offerId, score, reason }) => ({
		offerId,
		score,
		reason
	}));
	const signals = [
		`${plural(ctx.guests, "guest")}`,
		`${plural(ctx.nights, "night")}`,
		ctx.weekend ? "weekend night" : "weekdays only",
		ctx.leadDays >= 0 ? `arrives in ${plural(ctx.leadDays, "day")}` : "in house",
		ctx.standardRoom ? "standard room" : "upgraded room type",
		ctx.ota ? `booked via ${reservation.source}` : "booked direct"
	];
	if (ctx.notes) signals.push(`notes: “${reservation.notes}”`);
	const who = ctx.couple ? `the ${word(ctx.guests)} of you` : "you";
	return {
		picks,
		restIds: scored.slice(limit).map((s) => s.offerId),
		headline: `Picked for ${who}: ${plural(ctx.nights, "night")} in ${opts.city}`,
		signals
	};
}
/**
* The new-booking email: confirmation + online check-in + offers picked for
* this stay. Pure function → { subject, preheader, html, text }.
*
* Email-client rules: table layout, inline styles, 600px max, web-safe fonts,
* "bulletproof" buttons (a link inside a coloured cell), no scripts, no
* external CSS, alt-free (no images) so it renders the same with images off.
*
* Three modes, chosen per recipient by emailModeFor():
*   full    — a real guest email: offer cards with price and one-tap "Add".
*   light   — an OTA relay address (e.g. @guest.booking.com): only content
*             about THIS reservation — picks named with their reason, no
*             prices, one link to the stay page. Keeps the email a stay
*             service message under OTA terms, not a promotion.
*   service — holdout bookings: confirmation and check-in only, no offers,
*             so the control group stays clean.
*/
function emailModeFor(r) {
	if (r.emailKind === "none") return null;
	if (r.holdout) return "service";
	return r.emailKind === "masked" ? "light" : "full";
}
var EMAIL_MODE_LABEL = {
	full: "Full offers",
	light: "Light (OTA relay)",
	service: "Service only (holdout)"
};
var C = {
	ground: "#f3eee6",
	paper: "#fffdf8",
	ink: "#1c1814",
	stone: "#6f675e",
	line: "#e4dcd0",
	pine: "#234139",
	pineFg: "#f6f1ea",
	moss: "#e7efe8"
};
var SERIF = "Georgia, 'Times New Roman', serif";
var SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
function esc(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function link(base, params, hash = "") {
	const q = new URLSearchParams(params).toString();
	return `${base}${base.includes("?") ? "&" : "?"}${q}${hash}`;
}
function button(href, label, kind = "primary") {
	const bg = kind === "primary" ? C.pine : C.paper;
	const fg = kind === "primary" ? C.pineFg : C.ink;
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="border-radius:10px;border:1px solid ${kind === "primary" ? C.pine : C.line};">
<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;font-family:${SANS};font-size:15px;font-weight:600;color:${fg};text-decoration:none;border-radius:10px;">${esc(label)}</a>
</td></tr></table>`;
}
function nightsLabel(n) {
	return `${n} night${n === 1 ? "" : "s"}`;
}
function renderBookingEmail(input) {
	const { property, reservation: r, picks, mode } = input;
	const first = r.guestName.split(" ")[0] ?? r.guestName;
	const range = `${formatDate(r.arrival)}–${formatDate(r.departure)}`;
	const subject = `${first}, your ${property.city} stay is confirmed (${range})`;
	const showOffers = mode !== "service" && picks.length > 0;
	const preheader = showOffers ? `Check in online, plus ${picks.length} things picked for your ${nightsLabel(r.nights)}.` : `Check in online before you arrive at ${property.name}.`;
	const checkinUrl = link(input.stayUrl, { src: "email" }, "#checkin");
	const pageUrl = link(input.stayUrl, { src: "email" });
	const facts = [
		["Dates", `${range} · ${nightsLabel(r.nights)}`],
		["Room", `${r.roomTypeName} · ${r.guests} guest${r.guests === 1 ? "" : "s"}`],
		["Booking", `${r.bookingRef}${r.source !== "Direct" ? ` via ${r.source}` : ""}`]
	];
	const factRows = facts.map(([k, v]) => `<tr>
<td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${C.stone};width:90px;vertical-align:top;">${esc(k)}</td>
<td style="padding:6px 0;font-family:${SANS};font-size:14px;color:${C.ink};">${esc(v)}</td></tr>`).join("");
	let offersHtml = "";
	if (showOffers && mode === "full") offersHtml = picks.map(({ offer, reason }) => `<tr><td style="padding:0 0 12px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:14px;">
<tr><td style="padding:18px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${SERIF};font-size:19px;color:${C.ink};">${esc(offer.name)}</td>
<td align="right" style="font-family:${SANS};font-size:15px;color:${C.ink};white-space:nowrap;">${esc(money(offer.priceCents))}<span style="color:${C.stone};font-size:13px;">${esc(priceHint(offer.priceUnit))}</span></td>
</tr></table>
<p style="margin:6px 0 14px 0;font-family:${SANS};font-size:14px;line-height:20px;color:${C.stone};">${esc(reason)}</p>
${button(link(input.stayUrl, {
		src: "email",
		offer: offer.id
	}), offer.autoApprove ? "Add to my stay" : "Request it", "secondary")}
</td></tr></table></td></tr>`).join("");
	else if (showOffers && mode === "light") offersHtml = `<tr><td style="padding:0 0 16px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:14px;">
<tr><td style="padding:18px 20px;">
${picks.map(({ offer, reason }) => `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;line-height:21px;color:${C.ink};"><strong style="font-weight:600;">${esc(offer.name)}</strong><br><span style="color:${C.stone};font-size:14px;">${esc(reason)}</span></p>`).join("")}
${button(pageUrl, "See the options for your stay", "secondary")}
</td></tr></table></td></tr>`;
	const offersSection = showOffers ? `<tr><td style="padding:28px 0 6px 0;">
<p style="margin:0;font-family:${SANS};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${C.stone};">Picked for your stay</p>
<p style="margin:6px 0 16px 0;font-family:${SERIF};font-size:22px;line-height:28px;color:${C.ink};">${esc(input.headline)}</p>
</td></tr>${offersHtml}
<tr><td style="padding:2px 0 0 0;font-family:${SANS};font-size:13px;line-height:19px;color:${C.stone};">Nothing is charged until you choose it. Requests the house confirms are only charged once confirmed.</td></tr>` : "";
	const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.ground};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ground}"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td style="padding:0 0 22px 0;">
<p style="margin:0;font-family:${SERIF};font-size:26px;color:${C.ink};">${esc(property.name)}</p>
<p style="margin:2px 0 0 0;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.stone};">${esc(property.city)}</p>
</td></tr>
<tr><td style="background:${C.paper};border:1px solid ${C.line};border-radius:16px;padding:26px 24px;">
<p style="margin:0 0 6px 0;font-family:${SANS};font-size:15px;color:${C.stone};">Hi ${esc(first)},</p>
<p style="margin:0 0 18px 0;font-family:${SERIF};font-size:26px;line-height:32px;color:${C.ink};">Your stay is confirmed.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};margin:0 0 20px 0;">${factRows}</table>
<p style="margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:22px;color:${C.ink};">Check in online now and your key is ready when you arrive. It takes a minute${r.source !== "Direct" ? `, and lets us reach you directly instead of through ${esc(r.source)}` : ""}.</p>
${button(checkinUrl, "Check in online")}
</td></tr>
${offersSection}
<tr><td style="padding:28px 4px 0 4px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.stone};">
This email is about your reservation ${esc(r.bookingRef)} at ${esc(property.name)} only — no newsletters. Reply to reach the front desk.
</td></tr>
</table></td></tr></table>
</body></html>`;
	const textLines = [
		`Hi ${first},`,
		"",
		"Your stay is confirmed.",
		...facts.map(([k, v]) => `${k}: ${v}`),
		"",
		`Check in online: ${checkinUrl}`
	];
	if (showOffers) {
		textLines.push("", input.headline.toUpperCase());
		for (const { offer, reason } of picks) textLines.push(mode === "full" ? `- ${offer.name} (${money(offer.priceCents)}${priceHint(offer.priceUnit)}): ${reason}\n  ${link(input.stayUrl, {
			src: "email",
			offer: offer.id
		})}` : `- ${offer.name}: ${reason}`);
		if (mode === "light") textLines.push(`See the options for your stay: ${pageUrl}`);
		textLines.push("", "Nothing is charged until you choose it.");
	}
	textLines.push("", `— ${property.name}, ${property.city}. About reservation ${r.bookingRef} only.`);
	return {
		subject,
		preheader,
		html,
		text: textLines.join("\n")
	};
}
/**
* Field-level encryption for guest contact data (server-only use).
*
*   encrypt(plain)  -> "v1.<keyId>.<iv>.<ciphertext>"  AES-256-GCM, random 96-bit IV
*   blindIndex(v)   -> HMAC-SHA256 under a separate derived key, for exact-match
*                      lookups ("is this email already a profile?") without decrypting.
*
* Keys
*   STAYLIFT_DATA_KEY           base64 of 32 random bytes (openssl rand -base64 32)
*   STAYLIFT_DATA_KEY_PREVIOUS  optional; the old key during rotation. New writes use
*                               the current key, reads try the key named in the value.
*   Both subkeys come from the master key via HKDF, so one secret covers both jobs.
*
* Without a key, local development uses a fixed development key and says so
* (keyStatus().mode === "dev"). With DATABASE_URL set (a real database) and no
* key, every call throws: real guest data is never written under a known key.
*
* Uses Web Crypto only (no node: imports), so it runs on Node 20+ and Vercel.
*/
var DEV_MASTER = "staylift-development-key-not-for-real-guest-data";
var enc = new TextEncoder();
var dec = new TextDecoder();
function env(name) {
	const v = typeof process !== "undefined" ? process.env[name] : void 0;
	return v && v.trim() ? v.trim() : void 0;
}
function b64urlEncode(bytes) {
	let s = "";
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(text) {
	const s = text.replace(/-/g, "+").replace(/_/g, "/");
	const pad = s.length % 4 ? "=".repeat(4 - s.length % 4) : "";
	const bin = atob(s + pad);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
function b64Decode(text) {
	return b64urlDecode(text.replace(/\+/g, "-").replace(/\//g, "_"));
}
async function deriveKeySet(master) {
	const subtle = globalThis.crypto.subtle;
	const ikm = await subtle.importKey("raw", master, "HKDF", false, ["deriveKey", "deriveBits"]);
	const salt = enc.encode("staylift/vault/v1");
	const encKey = await subtle.deriveKey({
		name: "HKDF",
		hash: "SHA-256",
		salt,
		info: enc.encode("encrypt")
	}, ikm, {
		name: "AES-GCM",
		length: 256
	}, false, ["encrypt", "decrypt"]);
	const macKey = await subtle.deriveKey({
		name: "HKDF",
		hash: "SHA-256",
		salt,
		info: enc.encode("blind-index")
	}, ikm, {
		name: "HMAC",
		hash: "SHA-256",
		length: 256
	}, false, ["sign"]);
	const idBits = await subtle.deriveBits({
		name: "HKDF",
		hash: "SHA-256",
		salt,
		info: enc.encode("key-id")
	}, ikm, 48);
	return {
		id: b64urlEncode(new Uint8Array(idBits)),
		enc: encKey,
		mac: macKey
	};
}
var cache = globalThis;
function realDatabase$1() {
	return Boolean(env("DATABASE_URL"));
}
function parseMaster(raw, name) {
	const bytes = b64Decode(raw);
	if (bytes.length < 32) throw new Error(`${name} must be base64 of at least 32 bytes (openssl rand -base64 32).`);
	return bytes;
}
async function load() {
	const raw = env("STAYLIFT_DATA_KEY");
	if (!raw) {
		if (realDatabase$1()) return null;
		return {
			current: await deriveKeySet(enc.encode(DEV_MASTER)),
			previous: null,
			mode: "dev"
		};
	}
	const prevRaw = env("STAYLIFT_DATA_KEY_PREVIOUS");
	return {
		current: await deriveKeySet(parseMaster(raw, "STAYLIFT_DATA_KEY")),
		previous: prevRaw ? await deriveKeySet(parseMaster(prevRaw, "STAYLIFT_DATA_KEY_PREVIOUS")) : null,
		mode: "configured"
	};
}
async function keys() {
	cache.__staylift_vault__ ??= load().catch((err) => {
		cache.__staylift_vault__ = void 0;
		throw err;
	});
	const loaded = await cache.__staylift_vault__;
	if (!loaded) throw new Error("Guest data encryption key is missing: set STAYLIFT_DATA_KEY (openssl rand -base64 32) before storing guest contacts.");
	return loaded;
}
async function keyStatus() {
	try {
		const k = await keys();
		return {
			mode: k.mode,
			keyId: k.current.id,
			rotating: Boolean(k.previous)
		};
	} catch {
		return {
			mode: "missing",
			keyId: null,
			rotating: false
		};
	}
}
async function encrypt(plain) {
	const { current } = await keys();
	const iv = globalThis.crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const ct = new Uint8Array(await globalThis.crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, current.enc, enc.encode(plain)));
	return `v1.${current.id}.${b64urlEncode(iv)}.${b64urlEncode(ct)}`;
}
async function decrypt(sealed) {
	const parts = sealed.split(".");
	if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unrecognised encrypted value.");
	const [, keyId, ivText, ctText] = parts;
	const k = await keys();
	const set = keyId === k.current.id ? k.current : keyId === k.previous?.id ? k.previous : null;
	if (!set) throw new Error("This value was encrypted with a key that is no longer configured.");
	const plain = await globalThis.crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: b64urlDecode(ivText)
	}, set.enc, b64urlDecode(ctText));
	return dec.decode(plain);
}
async function decryptOrNull(sealed) {
	if (!sealed) return null;
	try {
		return await decrypt(sealed);
	} catch {
		return null;
	}
}
/**
* Keyed hash for exact-match lookups. Normalise first (see contact.ts) so
* "Maya@Example.com " and "maya@example.com" index the same. Hashes are always
* made with the current key; after a rotation, re-index with reindexValue().
*/
async function blindIndex(normalized) {
	const { current } = await keys();
	const sig = await globalThis.crypto.subtle.sign("HMAC", current.mac, enc.encode(normalized));
	return b64urlEncode(new Uint8Array(sig));
}
/** SHA-256 for one-time secrets (verification codes, invite and preference tokens). */
async function sha256(text) {
	const digest = await globalThis.crypto.subtle.digest("SHA-256", enc.encode(text));
	return b64urlEncode(new Uint8Array(digest));
}
/** URL-safe random token with `bytes` of entropy (default 18 bytes = 144 bits). */
function randomToken(bytes = 18) {
	return b64urlEncode(globalThis.crypto.getRandomValues(new Uint8Array(bytes)));
}
/** Six-digit numeric code, uniform (rejection sampling avoids modulo bias). */
function randomCode() {
	const buf = /* @__PURE__ */ new Uint32Array(1);
	const limit = Math.floor(4294967295 / 1e6) * 1e6;
	for (;;) {
		globalThis.crypto.getRandomValues(buf);
		const n = buf[0];
		if (n < limit) return String(n % 1e6).padStart(6, "0");
	}
}
/**
* Every function here runs inside withTenant() (tenant-db.ts): row-level security
* limits it to one hotel and new rows default to that hotel. Explicit
* `property_id = current_setting(...)` filters below are a second check, not the
* only one.
*/
var CURRENT_PROPERTY = "current_setting('app.property_id', true)";
var PAID = "('paid','fulfilled')";
function iso$1(value) {
	if (value instanceof Date) return value.toISOString();
	return String(value);
}
function isoOrNull(value) {
	return value === null || value === void 0 ? null : iso$1(value);
}
function dateOnly(value) {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value).slice(0, 10);
}
function addDays(day, days) {
	const t = Date.parse(`${day.slice(0, 10)}T00:00:00Z`) + days * 864e5;
	return new Date(t).toISOString().slice(0, 10);
}
function daysBetween(from, to) {
	const a = Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
	const b = Date.parse(`${to.slice(0, 10)}T00:00:00Z`);
	if (Number.isNaN(a) || Number.isNaN(b)) return 0;
	return Math.round((b - a) / 864e5);
}
function stayStatus(arrival, departure, today) {
	if (arrival > today) return "upcoming";
	if (departure > today) return "in_house";
	if (departure === today) return "departing";
	return "departed";
}
function reachable(email, phone) {
	return email !== "none" || phone === "valid";
}
function channels(email, phone) {
	const list = [];
	if (phone === "valid") list.push("WhatsApp", "SMS");
	if (email === "real") list.push("Email");
	if (email === "masked") list.push("OTA relay");
	return list;
}
/**
* Booking.com makes guest data available for 30 days after the stay; data
* sourced from it must be purged by then. Other channels' terms are unverified,
* so they get the same conservative clock (markets.ts OTA_RETENTION).
*/
function contactPurgeOn(source, departure) {
	const rule = otaRetention(source);
	return rule ? addDays(departure, rule.days) : null;
}
/** Row ids are unique across all hotels: 96 random bits, URL-safe. */
function nid(prefix) {
	return `${prefix}_${randomToken(12)}`;
}
var PROPERTY_COLS = `id, name, city, rooms, occupancy_pct, avg_stay_nights, tagline,
  launched_on::text as launched_on, plan_id, plan_per_room_monthly, plan_base_monthly,
  plan_rev_share_pct, margin_pct, card_pct, card_fixed_cents, holdout_pct, message_cost_cents,
  market, timezone, code, is_demo, sender_email, capture_launched_on::text as capture_launched_on,
  service_retention_days`;
function mapProperty(row, today) {
	const planId = [
		"A",
		"B",
		"C"
	].includes(row.plan_id) ? row.plan_id : "custom";
	return {
		id: row.id,
		name: row.name,
		city: row.city,
		rooms: Number(row.rooms),
		occupancyPct: Number(row.occupancy_pct),
		avgStayNights: Number(row.avg_stay_nights),
		tagline: row.tagline,
		economics: {
			launchedOn: row.launched_on ? dateOnly(row.launched_on) : today,
			planId,
			perRoomMonthly: Number(row.plan_per_room_monthly),
			baseMonthly: Number(row.plan_base_monthly),
			revSharePct: Number(row.plan_rev_share_pct),
			marginPct: Number(row.margin_pct),
			cardPct: Number(row.card_pct),
			cardFixedCents: Number(row.card_fixed_cents),
			holdoutPct: Number(row.holdout_pct),
			messageCostCents: Number(row.message_cost_cents)
		},
		settings: {
			market: isMarketId(row.market) ? row.market : "US",
			timezone: row.timezone,
			code: row.code,
			isDemo: Boolean(row.is_demo),
			senderEmail: row.sender_email,
			captureLaunchedOn: row.capture_launched_on ? dateOnly(row.capture_launched_on) : null,
			serviceRetentionDays: Number(row.service_retention_days)
		}
	};
}
var OFFER_COLS = `id, name, short_label, description, category, price_cents, price_unit,
  inventory, cutoff_hours, auto_approve, owner_type, active,
  from_room_type_id, to_room_type_id, sort_order`;
function mapOffer(row) {
	return {
		id: row.id,
		name: row.name,
		shortLabel: row.short_label,
		description: row.description,
		category: row.category,
		priceCents: Number(row.price_cents),
		priceUnit: row.price_unit,
		inventory: row.inventory === null ? null : Number(row.inventory),
		cutoffHours: row.cutoff_hours === null ? null : Number(row.cutoff_hours),
		autoApprove: row.auto_approve,
		ownerType: row.owner_type === "PARTNER" ? "PARTNER" : "HOTEL",
		active: row.active,
		fromRoomTypeId: row.from_room_type_id,
		toRoomTypeId: row.to_room_type_id,
		sortOrder: Number(row.sort_order)
	};
}
var RES_COLS = `r.id, r.booking_ref, r.source, r.guest_name, r.arrival::text as arrival,
  r.departure::text as departure, r.room_type_id, rt.name as room_type_name,
  r.guests, r.token, r.email_kind, r.phone_kind, r.consent, r.notes, r.holdout, r.created_at,
  r.profile_id, (r.anonymized_at is not null) as anonymized`;
function mapReservation(row, today) {
	const arrival = dateOnly(row.arrival);
	const departure = dateOnly(row.departure);
	const emailKind = row.email_kind;
	const phoneKind = row.phone_kind;
	return {
		id: row.id,
		bookingRef: row.booking_ref,
		source: row.source,
		guestName: row.guest_name,
		arrival,
		departure,
		nights: nightsBetween(arrival, departure),
		roomTypeId: row.room_type_id,
		roomTypeName: row.room_type_name,
		guests: Number(row.guests),
		token: row.token,
		emailKind,
		phoneKind,
		consent: row.consent,
		notes: row.notes,
		status: stayStatus(arrival, departure, today),
		reachable: reachable(emailKind, phoneKind),
		eligibleChannels: channels(emailKind, phoneKind),
		holdout: Boolean(row.holdout),
		contactPurgeOn: contactPurgeOn(row.source, departure),
		createdAt: iso$1(row.created_at),
		profileId: row.profile_id ?? null,
		anonymized: Boolean(row.anonymized)
	};
}
var ORDER_COLS = `o.id, o.reservation_id, r.guest_name, o.offer_id, f.name as offer_name,
  f.category, o.qty, o.amount_cents, o.status, o.channel, o.for_date::text as for_date,
  o.for_time, f.auto_approve, o.created_at, o.paid_at, r.token, r.arrival::text as arrival,
  r.departure::text as departure, r.source as res_source, r.booking_ref as res_booking_ref`;
var ORDER_FROM = `from orders o
  join reservations r on r.id = o.reservation_id
  join offers f on f.id = o.offer_id`;
function upgradeOpensOn(arrival) {
	return addDays(arrival, -3);
}
function mapOrder(row, today) {
	const category = row.category;
	const opens = upgradeOpensOn(dateOnly(row.arrival));
	return {
		id: row.id,
		reservationId: row.reservation_id,
		guestName: row.guest_name,
		offerId: row.offer_id,
		offerName: row.offer_name,
		category,
		qty: Number(row.qty),
		amountCents: Number(row.amount_cents),
		status: row.status,
		channel: row.channel === "desk" ? "desk" : "guest_page",
		forDate: row.for_date ? dateOnly(row.for_date) : null,
		forTime: row.for_time,
		autoApprove: row.auto_approve,
		createdAt: iso$1(row.created_at),
		paidAt: isoOrNull(row.paid_at),
		approvableFrom: category === "upgrade" && row.status === "pending_approval" && opens > today ? opens : null,
		token: row.token,
		arrival: dateOnly(row.arrival),
		departure: dateOnly(row.departure),
		platform: row.res_source,
		bookingRef: row.res_booking_ref
	};
}
async function todayIso(sql) {
	return (await sql`select CURRENT_DATE::text as d`)[0]?.d ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function loadProperty(sql, today) {
	const day = today ?? await todayIso(sql);
	const row = (await sql.query(`select ${PROPERTY_COLS} from properties where id = ${CURRENT_PROPERTY}`))[0];
	if (!row) throw new Error("Hotel not found for this session.");
	return mapProperty(row, day);
}
function isEligible(offer, res, today) {
	if (res.holdout) return false;
	if (!offer.active) return false;
	if (offer.inventory === 0) return false;
	if (res.status === "departed") return false;
	if (offer.fromRoomTypeId && res.roomTypeId !== offer.fromRoomTypeId) return false;
	if (offer.category === "late_checkout") return res.status === "in_house" || res.status === "departing";
	if (offer.category === "early_checkin") {
		const until = daysBetween(today, res.arrival);
		return until >= 0 && until <= 1;
	}
	if (offer.category === "upgrade") return res.status === "upcoming" || res.arrival === today;
	return true;
}
async function reservationByToken(sql, token, today) {
	const rows = await sql.query(`select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where r.token = $1`, [token]);
	return rows[0] ? mapReservation(rows[0], today) : null;
}
async function reservationById(sql, id, today) {
	const rows = await sql.query(`select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where r.id = $1`, [id]);
	return rows[0] ? mapReservation(rows[0], today) : null;
}
async function offerById(sql, id) {
	const rows = await sql.query(`select ${OFFER_COLS} from offers where id = $1`, [id]);
	return rows[0] ? mapOffer(rows[0]) : null;
}
async function pendingCount(sql) {
	const rows = await sql`
    select count(*)::int as n from orders where status = 'pending_approval'
  `;
	return Number(rows[0]?.n ?? 0);
}
async function dashboard(sql) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const launched = property.economics.launchedOn;
	const [funnelRows, money, top, pending, arriving, holdoutRows, journeyRows] = await Promise.all([
		sql.query(`with b as (
         select r.id,
           (r.email_kind <> 'none' or r.phone_kind = 'valid') as has_channel,
           exists (select 1 from events e where e.reservation_id = r.id and e.kind = 'view') as opened,
           exists (select 1 from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.status in ${PAID}) as bought,
           (r.departure - r.arrival) as nights
         from reservations r
         where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date
       )
       select count(*)::int as bookings,
         count(*) filter (where has_channel or opened or bought)::int as reached,
         count(*) filter (where opened or bought)::int as viewed,
         count(*) filter (where bought)::int as bought,
         coalesce(sum(nights), 0)::int as nights
       from b`, [launched]),
		sql.query(`select
         coalesce(sum(o.amount_cents) filter (
           where o.status in ${PAID} and o.channel = 'guest_page'
             and not r.holdout and r.arrival >= $1::date), 0)::int as pilot_cents,
         coalesce(sum(o.amount_cents) filter (
           where o.status in ${PAID} and o.paid_at::date = CURRENT_DATE), 0)::int as today_cents,
         coalesce(sum(o.amount_cents) filter (
           where o.status = 'pending_approval'), 0)::int as pending_cents
       from orders o join reservations r on r.id = o.reservation_id`, [launched]),
		sql.query(`select f.name, sum(o.amount_cents)::int as cents
       ${ORDER_FROM}
       where o.status in ${PAID} and o.channel = 'guest_page'
         and not r.holdout and r.arrival >= $1::date
       group by f.name order by cents desc limit 1`, [launched]),
		sql.query(`select ${ORDER_COLS} ${ORDER_FROM}
       where o.status = 'pending_approval' order by o.created_at desc`),
		sql.query(`select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
       where r.arrival <= CURRENT_DATE + 3 and r.departure >= CURRENT_DATE
       order by r.arrival, r.guest_name`),
		sql.query(`select count(*)::int as n from reservations
       where property_id = ${CURRENT_PROPERTY} and holdout and arrival >= $1::date`, [launched]),
		sql.query(`with b as (
         select r.id,
           exists (select 1 from messages m where m.reservation_id = r.id
                   and m.recipe_id = 'rec_booking' and m.channel = 'email' and m.status = 'sent') as emailed,
           exists (select 1 from events e where e.reservation_id = r.id
                   and e.kind = 'view' and e.source = 'email') as clicked,
           coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.source = 'email'
                   and o.status in ${PAID}), 0) as cents
         from reservations r
         where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date and r.source <> 'Direct'
       )
       select count(*)::int as ota,
         (count(*) filter (where emailed))::int as emailed,
         (count(*) filter (where emailed and clicked))::int as clicked,
         (count(*) filter (where emailed and clicked and cents > 0))::int as booked,
         coalesce(sum(cents) filter (where emailed and clicked), 0)::int as cents
       from b`, [launched])
	]);
	const f = funnelRows[0] ?? {
		bookings: 0,
		reached: 0,
		viewed: 0,
		bought: 0,
		nights: 0
	};
	const bookings = Number(f.bookings);
	const viewed = Number(f.viewed);
	const bought = Number(f.bought);
	const nights = Number(f.nights);
	const pilotCents = Number(money[0]?.pilot_cents ?? 0);
	const topRow = top[0];
	return {
		property,
		today,
		todayCents: Number(money[0]?.today_cents ?? 0),
		pilotCents,
		pendingCents: Number(money[0]?.pending_cents ?? 0),
		revenuePerBooking: bookings ? pilotCents / 100 / bookings : 0,
		revenuePerNight: nights ? pilotCents / 100 / nights : 0,
		attachRate: bookings ? bought / bookings : 0,
		conversion: viewed ? bought / viewed : 0,
		topOffer: topRow ? {
			name: topRow.name,
			cents: Number(topRow.cents)
		} : null,
		funnel: {
			bookings,
			reached: Number(f.reached),
			viewed,
			bought,
			pageRevenueCents: pilotCents
		},
		holdoutBookings: Number(holdoutRows[0]?.n ?? 0),
		journey: {
			otaBookings: Number(journeyRows[0]?.ota ?? 0),
			emailed: Number(journeyRows[0]?.emailed ?? 0),
			clicked: Number(journeyRows[0]?.clicked ?? 0),
			booked: Number(journeyRows[0]?.booked ?? 0),
			revenueCents: Number(journeyRows[0]?.cents ?? 0)
		},
		pending: pending.map((o) => mapOrder(o, today)),
		arriving: arriving.map((r) => mapReservation(r, today))
	};
}
async function measuredRoi(sql) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const launched = property.economics.launchedOn;
	const stays = await sql.query(`select r.holdout,
       coalesce(sum(o.amount_cents) filter (where o.status in ${PAID}), 0)::int as cents,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'guest_page'), 0)::int as page_cents,
       (count(o.id) filter (where o.status in ${PAID} and o.channel = 'guest_page'))::int as page_orders,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'desk'), 0)::int as desk_cents,
       (r.email_kind <> 'none' or r.phone_kind = 'valid') as has_channel,
       exists (select 1 from events e where e.reservation_id = r.id and e.kind = 'view') as opened
     from reservations r
     left join orders o on o.reservation_id = r.id
     where r.property_id = ${CURRENT_PROPERTY} and r.arrival >= $1::date and r.departure <= CURRENT_DATE
     group by r.id`, [launched]);
	const msg = await sql.query(`select coalesce(sum(cost_cents), 0) as cents, count(*)::int as n
     from messages m join reservations r on r.id = m.reservation_id
     where r.property_id = ${CURRENT_PROPERTY} and m.status = 'sent' and m.sent_at >= $1::date`, [launched]);
	const treatment = stays.filter((s) => !s.holdout);
	const holdout = stays.filter((s) => s.holdout);
	let reached = 0;
	let viewed = 0;
	let bought = 0;
	let pageCents = 0;
	let pageOrders = 0;
	let deskCents = 0;
	for (const s of stays) deskCents += Number(s.desk_cents);
	for (const s of treatment) {
		const orders = Number(s.page_orders);
		const isViewed = s.opened || orders > 0;
		if (s.has_channel || isViewed) reached += 1;
		if (isViewed) viewed += 1;
		if (orders > 0) bought += 1;
		pageCents += Number(s.page_cents);
		pageOrders += orders;
	}
	const pct = (a, b) => b ? a / b * 100 : 0;
	return {
		property,
		today,
		daysLive: Math.max(1, daysBetween(launched, today)),
		treatmentRevenue: treatment.map((s) => Number(s.cents) / 100),
		holdoutRevenue: holdout.map((s) => Number(s.cents) / 100),
		pageRevenueCents: pageCents,
		pageOrders,
		deskRevenueCents: deskCents,
		messagingCostCents: Number(msg[0]?.cents ?? 0),
		messagesSent: Number(msg[0]?.n ?? 0),
		rates: {
			reachablePct: pct(reached, treatment.length),
			viewPct: pct(viewed, reached),
			buyPct: pct(bought, viewed),
			avgSpend: bought ? pageCents / 100 / bought : 0,
			ordersPerBuyer: bought ? pageOrders / bought : 1
		}
	};
}
async function updateEconomics(sql, data) {
	await sql`
    update properties set
      plan_id = ${data.planId},
      plan_per_room_monthly = ${data.perRoomMonthly},
      plan_base_monthly = ${data.baseMonthly},
      plan_rev_share_pct = ${data.revSharePct},
      margin_pct = ${data.marginPct},
      card_pct = ${data.cardPct}
    where id = current_setting('app.property_id', true)
  `;
	return { ok: true };
}
async function reservations(sql, opts = {}) {
	const today = await todayIso(sql);
	const rows = await sql.query(`select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
     where $1::boolean or r.departure >= CURRENT_DATE - 7 or r.created_at >= now() - interval '7 days'
     order by r.arrival desc, r.guest_name
     limit 1000`, [Boolean(opts.history)]);
	const counts = await sql`
    select count(*)::int as all_n,
      (count(*) filter (where departure >= CURRENT_DATE - 7 or created_at >= now() - interval '7 days'))::int as current_n
    from reservations
  `;
	const totals = await sql.query(`select reservation_id,
       coalesce(sum(amount_cents) filter (where status in ${PAID}), 0)::int as cents,
       coalesce(sum(amount_cents) filter (where status = 'pending_approval'), 0)::int as pending
     from orders group by reservation_id`);
	const ordersByRes = {};
	for (const t of totals) ordersByRes[t.reservation_id] = {
		cents: Number(t.cents),
		pendingCents: Number(t.pending)
	};
	const list = rows.map((r) => mapReservation(r, today));
	if (!opts.history) list.sort((a, b) => a.arrival.localeCompare(b.arrival));
	return {
		today,
		reservations: list,
		ordersByRes,
		totalCount: Number(counts[0]?.all_n ?? 0),
		currentCount: Number(counts[0]?.current_n ?? 0)
	};
}
async function offers(sql) {
	return (await sql.query(`select ${OFFER_COLS} from offers order by sort_order`)).map(mapOffer);
}
async function fulfillment(sql) {
	const today = await todayIso(sql);
	const pending = await sql.query(`select ${ORDER_COLS} ${ORDER_FROM}
     where o.status = 'pending_approval' order by o.created_at desc`);
	const recent = await sql.query(`select ${ORDER_COLS} ${ORDER_FROM}
     where o.status in ${PAID}
       and (o.for_date >= CURRENT_DATE - 7 or o.paid_at >= now() - interval '7 days')
     order by coalesce(o.paid_at, o.created_at) desc
     limit 50`);
	return {
		pending: pending.map((o) => mapOrder(o, today)),
		paid: recent.map((o) => mapOrder(o, today))
	};
}
async function recipes(sql) {
	return (await sql`
    select id, name, summary, trigger_event, offset_hours, offer_ids, active, sends_message, sort_order
    from recipes
    order by sort_order
  `).map((r) => ({
		id: r.id,
		name: r.name,
		summary: r.summary,
		triggerEvent: r.trigger_event,
		offsetHours: Number(r.offset_hours),
		offerIds: r.offer_ids.split(",").filter(Boolean),
		active: r.active,
		sendsMessage: Boolean(r.sends_message),
		sortOrder: Number(r.sort_order)
	}));
}
async function analytics(sql) {
	const launched = (await loadProperty(sql, await todayIso(sql))).economics.launchedOn;
	const byOffer = await sql.query(`select f.name, sum(o.amount_cents)::int as cents, count(*)::int as n
     ${ORDER_FROM}
     where o.status in ${PAID} and o.channel = 'guest_page'
       and not r.holdout and r.arrival >= $1::date
     group by f.name order by cents desc`, [launched]);
	const bySource = await sql.query(`select r.source,
       coalesce(sum(o.amount_cents) filter (
         where o.status in ${PAID} and o.channel = 'guest_page'), 0)::int as cents,
       count(distinct r.id)::int as bookings
     from reservations r
     left join orders o on o.reservation_id = r.id
     where not r.holdout and r.arrival >= $1::date
     group by r.source order by cents desc`, [launched]);
	const capture = await sql.query(`select
       (count(*) filter (where c.real_email_captured))::int as captured,
       count(*)::int as checked_in
     from checkins c join reservations r on r.id = c.reservation_id
     where r.source <> 'Direct' and c.completed_at is not null and r.arrival >= $1::date`, [launched]);
	const messaging = await sql.query(`select coalesce(sum(m.cost_cents), 0) as cents, count(*)::int as n,
       count(distinct m.reservation_id)::int as bookings
     from messages m join reservations r on r.id = m.reservation_id
     where m.status = 'sent' and r.arrival >= $1::date`, [launched]);
	return {
		byOffer: byOffer.map((r) => ({
			name: r.name,
			cents: Number(r.cents),
			n: Number(r.n)
		})),
		bySource: bySource.map((r) => ({
			source: r.source,
			cents: Number(r.cents),
			bookings: Number(r.bookings)
		})),
		capture: {
			captured: Number(capture[0]?.captured ?? 0),
			checkedIn: Number(capture[0]?.checked_in ?? 0)
		},
		messaging: {
			costCents: Number(messaging[0]?.cents ?? 0),
			sent: Number(messaging[0]?.n ?? 0),
			bookings: Number(messaging[0]?.bookings ?? 0)
		}
	};
}
async function stay(sql, token) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const reservation = await reservationByToken(sql, token, today);
	if (!reservation) throw new Error("This stay link is not valid.");
	const offerRows = await sql.query(`select ${OFFER_COLS} from offers where active = true order by sort_order`);
	const orderRows = await sql.query(`select ${ORDER_COLS} ${ORDER_FROM}
     where r.token = $1 and o.status in ('pending_approval','paid','fulfilled')
     order by o.created_at`, [token]);
	const celebration = (await sql.query(`select celebration from checkins where reservation_id = $1`, [reservation.id]))[0]?.celebration;
	const bought = new Set(orderRows.map((o) => o.offer_id));
	const available = offerRows.map(mapOffer).filter((o) => isEligible(o, reservation, today) && !bought.has(o.id));
	const p = personalize(celebration ? {
		...reservation,
		notes: `${reservation.notes} ${celebration}`
	} : reservation, available, {
		today,
		city: property.city,
		standardRoomId: await standardRoomId(sql)
	});
	return {
		property,
		reservation,
		offers: [...p.picks.map((x) => x.offerId), ...p.restIds].map((id) => available.find((o) => o.id === id)).filter((o) => Boolean(o)),
		personalization: {
			headline: p.headline,
			picks: p.picks.map(({ offerId, reason }) => ({
				offerId,
				reason
			}))
		},
		orders: orderRows.map((o) => mapOrder(o, today)),
		checkin: emptyCheckin()
	};
}
function emptyCheckin() {
	return {
		completed: false,
		eta: null,
		source: null,
		celebration: null,
		celebrationWhose: null,
		celebrationMonth: null,
		celebrationDay: null,
		party: [],
		verifiedEmail: null,
		verifiedPhone: null,
		consents: {
			marketing_email: false,
			marketing_whatsapp: false,
			profile_memory: false
		},
		holidays: [],
		returningGuest: false,
		realEmailCaptured: false
	};
}
/** The hotel's entry room type (cheapest), which upgrade rules treat as "standard". */
async function standardRoomId(sql) {
	return (await sql`select id from room_types order by nightly_cents, id limit 1`)[0]?.id;
}
async function recordStayView(sql, token, source) {
	const row = (await sql.query(`select id, holdout from reservations where token = $1`, [token]))[0];
	if (!row || row.holdout) return { ok: false };
	const recent = await sql.query(`select count(*)::int as n from events
     where reservation_id = $1 and kind = 'view' and created_at > now() - interval '20 minutes'`, [row.id]);
	if (Number(recent[0]?.n ?? 0) === 0) await sql`
      insert into events (reservation_id, kind, source) values (${row.id}, 'view', ${source ?? null})
    `;
	return { ok: true };
}
function forDateFor(offer, res) {
	return offer.category === "late_checkout" ? res.departure : res.arrival;
}
async function takeInventory(sql, offer) {
	if (offer.inventory === null) return;
	if ((await sql.query(`update offers set inventory = inventory - 1 where id = $1 and inventory > 0 returning id`, [offer.id])).length === 0) throw new Error("Sold out for these dates.");
}
async function purchaseOffer(sql, data) {
	const today = await todayIso(sql);
	const reservation = await reservationByToken(sql, data.token, today);
	if (!reservation) throw new Error("Stay not found.");
	const offer = await offerById(sql, data.offerId);
	if (!offer) throw new Error("Offer not found.");
	if (!isEligible(offer, reservation, today)) throw new Error("That offer is not available for this stay.");
	const existing = await sql.query(`select count(*)::int as n from orders
     where reservation_id = $1 and offer_id = $2 and status in ('pending_approval','paid','fulfilled')`, [reservation.id, offer.id]);
	if (Number(existing[0]?.n ?? 0) > 0) throw new Error("Already on this stay.");
	await takeInventory(sql, offer);
	const amount = computeAmount(offer, reservation, data.qty);
	const status = offer.autoApprove ? "paid" : "pending_approval";
	const id = nid("ord");
	await sql`
    insert into orders (
      id, reservation_id, offer_id, qty, amount_cents, status, for_date, for_time, channel, paid_at, source
    )
    values (
      ${id}, ${reservation.id}, ${offer.id}, ${data.qty}, ${amount}, ${status},
      ${forDateFor(offer, reservation)}, ${data.forTime ?? null}, 'guest_page',
      ${offer.autoApprove ? (/* @__PURE__ */ new Date()).toISOString() : null}, ${data.source ?? null}
    )
  `;
	await sql`
    insert into events (reservation_id, offer_id, kind)
    values (${reservation.id}, ${offer.id}, 'purchase')
  `;
	return {
		id,
		status,
		amountCents: amount,
		autoApprove: offer.autoApprove,
		confirmsFrom: offer.category === "upgrade" ? upgradeOpensOn(reservation.arrival) : null
	};
}
async function decideOrder(sql, data) {
	const today = await todayIso(sql);
	const row = (await sql.query(`select o.id, o.status, o.offer_id, f.category, r.arrival::text as arrival
     from orders o join offers f on f.id = o.offer_id join reservations r on r.id = o.reservation_id
     where o.id = $1`, [data.orderId]))[0];
	if (!row) throw new Error("Order not found.");
	if (row.status !== "pending_approval") throw new Error("Already decided.");
	if (data.decision === "approve") {
		const opens = upgradeOpensOn(dateOnly(row.arrival));
		if (row.category === "upgrade" && opens > today) throw new Error(`Upgrades are confirmed from ${opens} (72 hours before arrival), so they never displace a higher-paying booking.`);
		await sql`
      update orders set status = 'paid', decided_at = now(), paid_at = now()
      where id = ${data.orderId}
    `;
	} else {
		await sql`update orders set status = 'declined', decided_at = now() where id = ${data.orderId}`;
		await sql`
      update offers set inventory = inventory + 1
      where id = ${row.offer_id} and inventory is not null
    `;
	}
	return { ok: true };
}
async function toggleRecipe(sql, data) {
	await sql`update recipes set active = ${data.active} where id = ${data.id}`;
	return { ok: true };
}
async function toggleOffer(sql, data) {
	await sql`update offers set active = ${data.active} where id = ${data.id}`;
	return { ok: true };
}
async function sendStayLink(sql, data) {
	const property = await loadProperty(sql);
	const row = (await sql.query(`select id, guest_name, email_kind, phone_kind from reservations where id = $1`, [data.reservationId]))[0];
	if (!row) throw new Error("Reservation not found.");
	const phone = data.channel !== "email";
	if (!phone && row.email_kind === "none") throw new Error("No email on file.");
	if (phone && row.phone_kind !== "valid") throw new Error("No valid phone on file — placeholder numbers are rejected.");
	if (phone) {
		const sent = await sql.query(`select count(*)::int as n from messages
       where reservation_id = $1 and channel in ('sms','whatsapp') and status = 'sent'`, [row.id]);
		if (Number(sent[0]?.n ?? 0) >= 2) throw new Error(`Already 2 phone messages on this booking — the lean cap. Use email or the desk.`);
	}
	const recipe = data.recipeId ? await sql.query(`select name from recipes where id = $1`, [data.recipeId]) : [];
	const first = row.guest_name.split(" ")[0] ?? row.guest_name;
	const subject = recipe[0]?.name ? `${recipe[0].name} — ${first}` : `Check in online for ${property.name}`;
	const cost = phone ? property.economics.messageCostCents : 0;
	await sql`
    insert into messages (id, reservation_id, recipe_id, channel, subject, status, kind, cost_cents)
    values (
      ${nid("msg")}, ${row.id}, ${data.recipeId ?? null}, ${data.channel}, ${subject},
      'sent', 'utility', ${cost}
    )
  `;
	return {
		ok: true,
		costCents: cost
	};
}
async function logDeskSale(sql, data) {
	const today = await todayIso(sql);
	const reservation = await reservationById(sql, data.reservationId, today);
	if (!reservation) throw new Error("Reservation not found.");
	const offer = await offerById(sql, data.offerId);
	if (!offer) throw new Error("Offer not found.");
	await takeInventory(sql, offer);
	const amount = computeAmount(offer, reservation, data.qty);
	const id = nid("ord");
	await sql`
    insert into orders (
      id, reservation_id, offer_id, qty, amount_cents, status, for_date, channel, paid_at, decided_at
    ) values (
      ${id}, ${reservation.id}, ${offer.id}, ${data.qty}, ${amount}, 'paid',
      ${forDateFor(offer, reservation)}, 'desk', now(), now()
    )
  `;
	return {
		id,
		amountCents: amount,
		holdout: reservation.holdout
	};
}
/** `draw` is injectable for tests; production uses a uniform random draw. */
async function ingestReservation(sql, data, draw = Math.random(), origin) {
	if (data.departure <= data.arrival) throw new Error("Departure must be after arrival.");
	if (!(await sql.query(`select id from room_types where id = $1`, [data.roomTypeId]))[0]) throw new Error("Unknown room type.");
	const dupes = await sql.query(`select count(*)::int as n from reservations where booking_ref = $1 and source = $2`, [data.bookingRef, data.source]);
	if (Number(dupes[0]?.n ?? 0) > 0) throw new Error(`${data.bookingRef} is already on the book.`);
	const property = await loadProperty(sql);
	const holdout = draw * 100 < property.economics.holdoutPct;
	const token = randomToken(18);
	const id = nid("res");
	await sql`
    insert into reservations (
      id, booking_ref, source, guest_name, arrival, departure,
      room_type_id, guests, token, email_kind, phone_kind, consent, holdout
    ) values (
      ${id}, ${data.bookingRef}, ${data.source}, ${data.guestName},
      ${data.arrival}, ${data.departure}, ${data.roomTypeId}, ${data.guests},
      ${token}, ${data.emailKind}, ${data.phoneKind}, 'transactional', ${holdout}
    )
  `;
	let emailed = null;
	if (data.emailKind !== "none" && origin !== void 0) emailed = (await sendBookingEmail(sql, id, origin)).mode;
	return {
		id,
		token,
		holdout,
		emailed
	};
}
/** Where stay links in emails point. A configured public URL wins over the caller's origin. */
function publicOrigin(origin) {
	const env = typeof process !== "undefined" ? process.env.PUBLIC_APP_URL : void 0;
	return (env && env.trim() || origin && origin.trim() || "http://localhost:8080").replace(/\/+$/, "");
}
async function bookingEmail(sql, reservationId, origin) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const reservation = await reservationById(sql, reservationId, today);
	if (!reservation) throw new Error("Reservation not found.");
	const mode = emailModeFor(reservation);
	const eligible = (await sql.query(`select ${OFFER_COLS} from offers where active = true order by sort_order`)).map(mapOffer).filter((o) => isEligible(o, reservation, today));
	const p = personalize(reservation, eligible, {
		today,
		city: property.city,
		standardRoomId: await standardRoomId(sql)
	});
	const picks = p.picks.map((x) => ({
		offer: eligible.find((o) => o.id === x.offerId),
		reason: x.reason,
		score: x.score
	})).filter((x) => Boolean(x.offer));
	const stayUrl = `${publicOrigin(origin)}/stay/${reservation.token}`;
	const rendered = mode ? renderBookingEmail({
		property,
		reservation,
		picks,
		headline: p.headline,
		stayUrl,
		mode
	}) : null;
	const sent = await sql.query(`select sent_at from messages
     where reservation_id = $1 and recipe_id = 'rec_booking' and channel = 'email' and status = 'sent'
     order by sent_at desc limit 1`, [reservation.id]);
	return {
		property: {
			name: property.name,
			city: property.city
		},
		reservation,
		mode,
		modeLabel: mode ? EMAIL_MODE_LABEL[mode] : "No email address",
		recipient: reservation.emailKind === "masked" ? `${reservation.source} relay address` : reservation.emailKind === "real" ? "Guest's own email" : "None on file",
		signals: p.signals,
		picks: picks.map(({ offer, reason, score }) => ({
			offerId: offer.id,
			name: offer.name,
			reason,
			score,
			priceCents: offer.priceCents,
			priceUnit: offer.priceUnit
		})),
		stayUrl,
		email: rendered,
		sentAt: sent[0] ? iso$1(sent[0].sent_at) : null
	};
}
async function sendBookingEmail(sql, reservationId, origin) {
	const preview = await bookingEmail(sql, reservationId, origin);
	if (!preview.mode || !preview.email) throw new Error("No email address on this booking.");
	if (preview.sentAt) throw new Error("The booking email has already gone to this guest.");
	await sql`
    insert into messages (id, reservation_id, recipe_id, channel, subject, status, kind, cost_cents)
    values (
      ${nid("msg")}, ${reservationId}, 'rec_booking', 'email', ${preview.email.subject},
      'sent', ${`booking_${preview.mode}`}, 0
    )
  `;
	return {
		mode: preview.mode,
		subject: preview.email.subject
	};
}
async function previewEmailParse(sql, text) {
	const parsed = parseReservationEmail(text);
	if ("error" in parsed) return parsed;
	const rooms = await sql`
    select id, name from room_types order by nightly_cents
  `;
	const hint = parsed.roomTypeHint.toLowerCase();
	const match = rooms.find((r) => hint.includes(r.name.toLowerCase().split(" ")[0] ?? "")) ?? rooms.find((r) => r.name.toLowerCase().includes("standard")) ?? rooms[0];
	return {
		...parsed,
		roomTypeId: match?.id ?? "rt_standard"
	};
}
async function roomTypes(sql) {
	return sql`
    select id, name from room_types order by nightly_cents
  `;
}
async function messages(sql) {
	return (await sql`
    select m.id, r.guest_name, m.channel, m.subject, m.status, m.sent_at, m.cost_cents, m.kind, r.token, r.id as reservation_id
    from messages m
    join reservations r on r.id = m.reservation_id
    order by m.sent_at desc
    limit 20
  `).map((r) => ({
		id: r.id,
		guestName: r.guest_name,
		channel: r.channel,
		subject: r.subject,
		status: r.status,
		sentAt: iso$1(r.sent_at),
		costCents: Number(r.cost_cents),
		kind: r.kind,
		token: r.token,
		reservationId: r.reservation_id
	}));
}
/**
* A new hotel starts with a small catalogue it can edit: two room types, the
* common extras, and the lean recipe set. Ids carry the hotel id because offer
* and room ids are global keys.
*/
async function seedStarterCatalogue(sql, propertyId) {
	const k = (key) => `${key}-${propertyId}`.slice(0, 64);
	const std = k("rt_standard");
	const dlx = k("rt_deluxe");
	await sql`
    insert into room_types (id, name, nightly_cents, inventory) values
      (${std}, 'Standard Room', 16000, 20),
      (${dlx}, 'Deluxe Room', 21000, 8)
  `;
	const offers = [
		[
			"off_upgrade",
			"Upgrade to Deluxe",
			"More space, better view",
			"Move up to a Deluxe room for the whole stay, subject to availability.",
			"upgrade",
			4e3,
			"night",
			false,
			std,
			dlx
		],
		[
			"off_breakfast",
			"Breakfast",
			"Served 7–10:30",
			"Full breakfast in the restaurant, per person per morning.",
			"breakfast",
			2400,
			"person_night",
			true,
			null,
			null
		],
		[
			"off_early",
			"Early check-in",
			"Room ready at noon",
			"Your room from 12:00 instead of 15:00.",
			"early_checkin",
			3500,
			"stay",
			false,
			null,
			null
		],
		[
			"off_late",
			"Late checkout",
			"Keep the room until 2 PM",
			"Stay in your room until 14:00 on departure day.",
			"late_checkout",
			4e3,
			"stay",
			false,
			null,
			null
		],
		[
			"off_parking",
			"Parking",
			"Covered, on site",
			"A covered space held for your car.",
			"parking",
			2500,
			"night",
			true,
			null,
			null
		],
		[
			"off_transfer",
			"Airport transfer",
			"Driver meets you",
			"A driver meets you at arrivals and waits 45 minutes.",
			"transfer",
			6500,
			"stay",
			true,
			null,
			null
		]
	];
	let order = 1;
	for (const [key, name, short, desc, category, cents, unit, auto, from, to] of offers) {
		await sql`
      insert into offers (
        id, name, short_label, description, category, price_cents, price_unit,
        auto_approve, from_room_type_id, to_room_type_id, sort_order
      ) values (
        ${k(key)}, ${name}, ${short}, ${desc}, ${category}, ${cents}, ${unit},
        ${auto}, ${from}, ${to}, ${order}
      )
    `;
		order += 1;
	}
	const recipes = [
		[
			"rec_booking",
			"New booking",
			"Message: confirmation + check-in link (service). Page leads with the personalised picks.",
			"booking_created",
			0,
			true
		],
		[
			"rec_prearrival",
			"3 days before arrival",
			"Message: arrival details (service). Page leads with breakfast and transfer.",
			"pre_arrival",
			-72,
			true
		],
		[
			"rec_checkin",
			"Online check-in",
			"No message. The check-in step asks about celebrations and the guest's own contact.",
			"checkin",
			0,
			false
		],
		[
			"rec_depart",
			"Night before departure",
			"No message. Page leads with late checkout.",
			"pre_departure",
			-12,
			false
		]
	];
	order = 1;
	for (const [key, name, summary, trigger, offset, sends] of recipes) {
		await sql`
      insert into recipes (id, name, summary, trigger_event, offset_hours, offer_ids, active, sends_message, sort_order)
      values (${k(key)}, ${name}, ${summary}, ${trigger}, ${offset}, '', true, ${sends}, ${order})
    `;
		order += 1;
	}
	return {
		roomTypes: 2,
		offers: offers.length,
		recipes: recipes.length
	};
}
async function updateSettings(sql, data) {
	await sql`
    update properties set
      name = ${data.name.trim()},
      city = ${data.city.trim()},
      market = ${data.market},
      timezone = ${data.timezone.trim()},
      rooms = ${data.rooms},
      sender_email = ${data.senderEmail?.trim() || null},
      service_retention_days = ${data.serviceRetentionDays},
      capture_launched_on = ${data.captureLaunchedOn}
    where id = current_setting('app.property_id', true)
  `;
	return { ok: true };
}
var HISTOGRAM_BUCKETS = [
	{
		key: "a",
		label: "14+ days out"
	},
	{
		key: "b",
		label: "8–13 days"
	},
	{
		key: "c",
		label: "4–7 days"
	},
	{
		key: "d",
		label: "1–3 days"
	},
	{
		key: "e",
		label: "In stay"
	}
];
function bucketLabel(bucket, granularity) {
	const d = /* @__PURE__ */ new Date(`${bucket}T00:00:00Z`);
	const month = d.toLocaleDateString("en-US", {
		month: "short",
		timeZone: "UTC"
	});
	return granularity === "month" ? month : `${month} ${d.getUTCDate()}`;
}
async function bookedSeries(sql, launched, granularity) {
	return (await sql.query(`with b as (
       select r.id, r.arrival,
         exists (select 1 from orders o where o.reservation_id = r.id
                 and o.channel = 'guest_page' and o.status in ${PAID}) as bought,
         coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.channel = 'guest_page' and o.status in ${PAID}), 0) as cents
       from reservations r
       where r.property_id = ${CURRENT_PROPERTY} and not r.holdout and r.arrival >= $1::date
     )
     select to_char(date_trunc($2::text, arrival), 'YYYY-MM-DD') as bucket,
       count(*)::int as bookings,
       count(*) filter (where bought)::int as bought,
       coalesce(sum(cents), 0)::int as cents
     from b
     group by 1
     order by 1`, [launched, granularity])).map((r) => ({
		bucket: r.bucket,
		label: bucketLabel(r.bucket, granularity),
		bookings: Number(r.bookings),
		bought: Number(r.bought),
		revenueCents: Number(r.cents)
	}));
}
/**
* Read-only aggregates behind the coral Overview. Every number derives from the
* same tables as dashboard()/analytics() — nothing new is captured, nothing is
* simulated.
*/
async function overviewExtras(sql) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const launched = property.economics.launchedOn;
	const standardId = await standardRoomId(sql);
	const [weekly, monthly, weekRows, channelRows, sourceRows, histoRows, bounceRows, topRows, segmentRows, liveRows, offerRows, orderRows, checkRows, pendingRows] = await Promise.all([
		bookedSeries(sql, launched, "week"),
		bookedSeries(sql, launched, "month"),
		sql.query(`select
           coalesce(sum(o.amount_cents) filter (where o.paid_at >= now() - interval '7 days'), 0)::int as this_week,
           coalesce(sum(o.amount_cents) filter (where o.paid_at >= now() - interval '14 days'
             and o.paid_at < now() - interval '7 days'), 0)::int as prev_week
         from orders o join reservations r on r.id = o.reservation_id
         where o.status in ${PAID} and o.channel = 'guest_page'
           and not r.holdout and r.arrival >= $1::date`, [launched]),
		sql.query(`select o.channel, coalesce(sum(o.amount_cents), 0)::int as cents, count(*)::int as n
         ${ORDER_FROM}
         where o.status in ${PAID} and not r.holdout and r.arrival >= $1::date
         group by o.channel`, [launched]),
		sql.query(`select coalesce(e.source, 'other') as s, count(*)::int as n
         from events e join reservations r on r.id = e.reservation_id
         where e.kind = 'view' and not r.holdout and r.arrival >= $1::date
         group by 1 order by n desc`, [launched]),
		sql.query(`with paid as (
           select (r.arrival - o.paid_at::date) as lead
           from orders o join reservations r on r.id = o.reservation_id
           where o.status in ${PAID} and o.channel = 'guest_page' and o.paid_at is not null
             and not r.holdout and r.arrival >= $1::date
         )
         select case when lead >= 14 then 'a' when lead >= 8 then 'b' when lead >= 4 then 'c'
                     when lead >= 1 then 'd' else 'e' end as k,
           count(*)::int as n
         from paid
         group by k`, [launched]),
		sql.query(`select count(*)::int as n
         from messages m join reservations r on r.id = m.reservation_id
         where m.status = 'bounced' and r.arrival >= $1::date`, [launched]),
		sql.query(`select f.name, sum(o.amount_cents)::int as cents, count(*)::int as n
         ${ORDER_FROM}
         where o.status in ${PAID} and o.channel = 'guest_page'
           and not r.holdout and r.arrival >= $1::date
         group by f.name order by cents desc limit 4`, [launched]),
		sql.query(`select (c.celebration is not null) as celebrating,
           count(distinct r.id)::int as bookings,
           coalesce(sum(px.cents), 0)::int as cents
         from reservations r
         left join checkins c on c.reservation_id = r.id
         left join lateral (
           select sum(o.amount_cents) as cents from orders o
           where o.reservation_id = r.id and o.channel = 'guest_page' and o.status in ${PAID}
         ) px on true
         where not r.holdout and r.arrival >= $1::date
         group by 1`, [launched]),
		sql.query(`select ${RES_COLS} from reservations r join room_types rt on rt.id = r.room_type_id
         where r.arrival >= CURRENT_DATE - 21 and r.departure >= CURRENT_DATE
         order by r.arrival, r.guest_name`),
		sql.query(`select ${OFFER_COLS} from offers where active = true order by sort_order`),
		sql.query(`select reservation_id, offer_id from orders
         where status in ('pending_approval','paid','fulfilled')`),
		sql.query(`select reservation_id, celebration from checkins where celebration is not null`),
		pendingCount(sql)
	]);
	const channel = {
		guestPageCents: 0,
		deskCents: 0,
		guestPageOrders: 0,
		deskOrders: 0
	};
	for (const row of channelRows) if (row.channel === "desk") {
		channel.deskCents = Number(row.cents);
		channel.deskOrders = Number(row.n);
	} else {
		channel.guestPageCents = Number(row.cents);
		channel.guestPageOrders = Number(row.n);
	}
	const viewSources = sourceRows.map((r) => ({
		source: r.s === "email" ? "email" : r.s === "whatsapp" ? "whatsapp" : r.s === "sms" ? "sms" : "direct",
		n: Number(r.n)
	}));
	const histoMap = new Map(histoRows.map((r) => [r.k, Number(r.n)]));
	const histogram = HISTOGRAM_BUCKETS.map((b) => ({
		label: b.label,
		n: histoMap.get(b.key) ?? 0
	}));
	const segments = {
		celebrating: {
			bookings: 0,
			cents: 0
		},
		plain: {
			bookings: 0,
			cents: 0
		}
	};
	for (const row of segmentRows) {
		const target = row.celebrating ? segments.celebrating : segments.plain;
		target.bookings = Number(row.bookings);
		target.cents = Number(row.cents);
	}
	const boughtByReservation = /* @__PURE__ */ new Map();
	for (const o of orderRows) {
		let set = boughtByReservation.get(o.reservation_id);
		if (!set) boughtByReservation.set(o.reservation_id, set = /* @__PURE__ */ new Set());
		set.add(o.offer_id);
	}
	const celebrationByReservation = new Map(checkRows.map((c) => [c.reservation_id, c.celebration]));
	const activeOffers = offerRows.map(mapOffer);
	const guests = [];
	let totalCents = 0;
	let expiringCount = 0;
	let expiringCents = 0;
	for (const row of liveRows) {
		const res = mapReservation(row, today);
		if (res.status === "departed" || res.holdout) continue;
		const bought = boughtByReservation.get(res.id) ?? /* @__PURE__ */ new Set();
		const available = activeOffers.filter((o) => isEligible(o, res, today) && !bought.has(o.id));
		if (available.length === 0) continue;
		const celebration = celebrationByReservation.get(res.id);
		const p = personalize(celebration ? {
			...res,
			notes: `${res.notes} ${celebration}`
		} : res, available, {
			today,
			city: property.city,
			standardRoomId: standardId
		});
		const priced = [...p.picks.map((x) => x.offerId), ...p.restIds].map((id) => available.find((o) => o.id === id)).filter((o) => Boolean(o)).map((o) => ({
			id: o.id,
			name: o.name,
			cents: computeAmount(o, res, isNightly(o) ? res.nights : 1)
		}));
		const resCents = priced.reduce((s, o) => s + o.cents, 0);
		totalCents += resCents;
		const daysOut = daysBetween(today, res.arrival);
		if (daysOut >= 0 && daysOut <= 3) {
			expiringCount += priced.length;
			expiringCents += resCents;
		}
		guests.push({
			reservationId: res.id,
			guestName: res.guestName,
			token: res.token,
			arrival: res.arrival,
			nights: res.nights,
			guests: res.guests,
			offers: priced
		});
	}
	guests.sort((a, b) => a.arrival.localeCompare(b.arrival) || a.guestName.localeCompare(b.guestName));
	return {
		series: {
			weekly,
			monthly
		},
		weekly: {
			thisWeekCents: Number(weekRows[0]?.this_week ?? 0),
			prevWeekCents: Number(weekRows[0]?.prev_week ?? 0)
		},
		channel,
		viewSources,
		openOffers: {
			totalCents,
			guestCount: guests.length,
			expiringCount,
			guests
		},
		histogram,
		attention: {
			pendingCount: pendingRows,
			expiringCount,
			expiringCents,
			bouncedCount: Number(bounceRows[0]?.n ?? 0)
		},
		topOffers: topRows.map((r) => ({
			name: r.name,
			cents: Number(r.cents),
			n: Number(r.n)
		})),
		segments
	};
}
var NO_CONSENTS = {
	marketing_email: false,
	marketing_whatsapp: false,
	profile_memory: false
};
function iso(v) {
	return v instanceof Date ? v.toISOString() : String(v);
}
function guestActor(reservationId) {
	return {
		kind: "guest",
		id: reservationId,
		label: "Guest"
	};
}
async function checkinRow(sql, reservationId) {
	return (await sql.query(`select reservation_id, eta, completed_at, source, celebration, celebration_whose,
       celebration_month, celebration_day, party, service_email_enc, service_phone_enc,
       contact_verified_at, real_email_captured
     from checkins where reservation_id = $1`, [reservationId]))[0] ?? null;
}
function parseParty(value) {
	if (!value) return [];
	const list = typeof value === "string" ? JSON.parse(value) : value;
	return Array.isArray(list) ? list : [];
}
async function currentConsents(sql, profileId) {
	const rows = await sql.query(`select distinct on (purpose) purpose, granted from consent_events
     where profile_id = $1 order by purpose, at desc, id desc`, [profileId]);
	const out = { ...NO_CONSENTS };
	for (const r of rows) if (r.purpose in out) out[r.purpose] = Boolean(r.granted);
	return out;
}
var PROFILE_COLS = `id, display_name, email_enc, email_hash, phone_enc, phone_hash, email_verified_at,
  phone_verified_at, merged_into, erased_at, created_at, language`;
async function profileRow(sql, id) {
	return (await sql.query(`select ${PROFILE_COLS} from guest_profiles where id = $1`, [id]))[0] ?? null;
}
async function liveProfile(sql, id) {
	const row = await profileRow(sql, id);
	if (!row || row.erased_at || row.merged_into) throw new Error("Guest profile not found.");
	return row;
}
async function checkinState(sql, reservation) {
	const state = emptyCheckin();
	const row = await checkinRow(sql, reservation.id);
	if (row) {
		state.completed = Boolean(row.completed_at);
		state.eta = row.eta;
		state.source = row.source ?? null;
		state.celebration = row.celebration ?? null;
		state.celebrationWhose = row.celebration_whose ?? null;
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
			state.holidays = (await sql.query(`select holiday from profile_holidays where profile_id = $1 order by holiday`, [profile.id])).map((h) => h.holiday);
			const stays = await sql.query(`select count(*)::int as n from reservations where profile_id = $1 and id <> $2`, [profile.id, reservation.id]);
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
async function stayPage(sql, token) {
	const payload = await stay(sql, token);
	if (payload.reservation.anonymized) throw new Error("This stay's details have been removed.");
	return {
		...payload,
		checkin: await checkinState(sql, payload.reservation)
	};
}
async function requireStay(sql, token) {
	const today = await todayIso(sql);
	const reservation = await reservationByToken(sql, token, today);
	if (!reservation) throw new Error("This stay link is not valid.");
	if (reservation.anonymized) throw new Error("This stay's details have been removed.");
	return {
		reservation,
		today
	};
}
async function logStep(sql, reservationId, step, source, once = true) {
	if (once) {
		const seen = await sql.query(`select count(*)::int as n from capture_events where reservation_id = $1 and step = $2`, [reservationId, step]);
		if (Number(seen[0]?.n ?? 0) > 0) return;
	}
	await sql`insert into capture_events (reservation_id, step, source) values (${reservationId}, ${step}, ${source})`;
}
/** Stay-only data is purged this long after departure (set on every check-in row). */
async function purgeOnFor(sql, departure) {
	return addDays(departure, (await loadProperty(sql)).settings.serviceRetentionDays);
}
async function startCapture(sql, token, source) {
	const { reservation } = await requireStay(sql, token);
	const purgeOn = await purgeOnFor(sql, reservation.departure);
	await sql`
    insert into checkins (reservation_id, started_at, source, purge_on) values (${reservation.id}, now(), ${source}, ${purgeOn})
    on conflict (reservation_id) do update set
      started_at = coalesce(checkins.started_at, excluded.started_at),
      source = case when checkins.completed_at is null then excluded.source else checkins.source end
  `;
	await logStep(sql, reservation.id, "started", source);
	return { ok: true };
}
async function captureStep(sql, token, step, source) {
	const { reservation } = await requireStay(sql, token);
	await logStep(sql, reservation.id, step, source);
	return { ok: true };
}
function realDatabase() {
	return typeof process !== "undefined" && Boolean(process.env.DATABASE_URL?.trim());
}
async function sendContactCode(sql, data) {
	const { reservation } = await requireStay(sql, data.token);
	if (reservation.status === "departed") throw new Error("This stay has ended.");
	const property = await loadProperty(sql);
	let normalized;
	if (data.channel === "email") {
		normalized = normalizeEmail(data.value);
		if (!normalized) throw new Error("That email address doesn't look right.");
		if (isRelayEmail(normalized)) throw new Error("That's the booking site's relay inbox. Use your own email so the hotel can reach you.");
	} else {
		normalized = normalizePhone(data.value, property.settings.market);
		if (!normalized) throw new Error(property.settings.market === "EU" ? "Enter the number with its country code, e.g. +49 151 2345 6789." : "That number doesn't look right.");
		if (realDatabase()) throw new Error("WhatsApp codes aren't switched on for this hotel yet. Use your email instead.");
	}
	const recent = await sql.query(`select count(*)::int as n from contact_verifications
     where reservation_id = $1 and created_at > now() - interval '1 hour'`, [reservation.id]);
	if (Number(recent[0]?.n ?? 0) >= 5) throw new Error("Too many codes requested. Try again in an hour, or ask the front desk.");
	const id = nid("cv");
	const code = randomCode();
	await sql`
    insert into contact_verifications (id, reservation_id, channel, value_enc, value_hash, code_hash, expires_at)
    values (
      ${id}, ${reservation.id}, ${data.channel}, ${await encrypt(normalized)}, ${await blindIndex(normalized)},
      ${await blindIndex(`code:${id}:${code}`)}, now() + make_interval(mins => ${10})
    )
  `;
	await logStep(sql, reservation.id, "code_sent", data.source);
	let devCode;
	if (data.channel === "email") {
		const body = simpleEmail({
			hotel: property.name,
			heading: `Your code is ${code}`,
			lines: [`Enter it on your check-in page to confirm this is your email. It works for 10 minutes.`, "If you didn't ask for this, ignore this email."]
		});
		if (!(await sendMail({
			to: normalized,
			subject: `${code} is your ${property.name} check-in code`,
			html: body.html,
			text: body.text,
			from: property.settings.senderEmail,
			fromName: property.name,
			stream: "outbound",
			tag: "verify-contact"
		})).delivered) devCode = code;
	} else devCode = code;
	return {
		verificationId: id,
		sentTo: data.channel === "email" ? maskEmail(normalized) : maskPhone(normalized),
		devCode
	};
}
async function verifyContactCode(sql, data) {
	const { reservation } = await requireStay(sql, data.token);
	const row = (await sql.query(`select id, channel, value_enc, code_hash, attempts, (expires_at <= now()) as expired, verified_at
     from contact_verifications where id = $1 and reservation_id = $2`, [data.verificationId, reservation.id]))[0];
	if (!row) throw new Error("Send a new code.");
	if (row.verified_at) throw new Error("Already confirmed.");
	if (row.expired) throw new Error("That code has expired. Send a new one.");
	if (Number(row.attempts) >= 5) throw new Error("Too many tries. Send a new code.");
	await sql`update contact_verifications set attempts = attempts + 1 where id = ${row.id}`;
	const given = data.code.replace(/\D/g, "");
	if (await blindIndex(`code:${row.id}:${given}`) !== row.code_hash) {
		const left = 5 - Number(row.attempts) - 1;
		return {
			ok: false,
			message: left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many tries. Send a new code."
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
		detail: { channel: row.channel }
	});
	const plain = await decryptOrNull(row.value_enc);
	return {
		ok: true,
		ticket,
		channel: row.channel,
		masked: plain ? row.channel === "email" ? maskEmail(plain) : maskPhone(plain) : ""
	};
}
function cleanParty(list) {
	const out = [];
	for (const m of list.slice(0, 8)) if (m.relation === "child") {
		if ([
			"0-2",
			"3-12",
			"13-17"
		].includes(m.ageBand)) out.push({
			relation: "child",
			ageBand: m.ageBand
		});
	} else {
		const name = (m.firstName ?? "").trim().slice(0, 40);
		if (name) out.push({
			relation: m.relation,
			firstName: name
		});
	}
	return out;
}
function validDay(month, day) {
	if (!month || month < 1 || month > 12) return {
		month: null,
		day: null
	};
	const max = [
		31,
		29,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	][month - 1];
	return {
		month,
		day: day && day >= 1 && day <= max ? day : null
	};
}
async function matchOrCreateProfile(sql, reservation, contacts) {
	const emailHash = contacts.email ? await blindIndex(contacts.email) : null;
	const phoneHash = contacts.phone ? await blindIndex(contacts.phone) : null;
	const find = async (col, hash) => {
		if (!hash) return null;
		return (await sql.query(`select id from guest_profiles where ${col} = $1 and merged_into is null and erased_at is null`, [hash]))[0]?.id ?? null;
	};
	const byEmail = await find("email_hash", emailHash);
	const byPhone = await find("phone_hash", phoneHash);
	let profileId = byEmail ?? byPhone ?? reservation.profileId ?? null;
	let created = false;
	if (!profileId) {
		profileId = nid("gp");
		created = true;
		await sql`
      insert into guest_profiles (id, display_name, email_enc, email_hash, email_verified_at, phone_enc, phone_hash, phone_verified_at)
      values (
        ${profileId}, ${reservation.guestName},
        ${contacts.emailEnc}, ${emailHash}, ${emailHash ? (/* @__PURE__ */ new Date()).toISOString() : null},
        ${contacts.phoneEnc}, ${phoneHash}, ${phoneHash ? (/* @__PURE__ */ new Date()).toISOString() : null}
      )
    `;
	} else {
		if (emailHash && !byEmail) await sql`
        update guest_profiles set email_enc = ${contacts.emailEnc}, email_hash = ${emailHash},
          email_verified_at = now(), updated_at = now()
        where id = ${profileId} and email_hash is null
      `;
		if (phoneHash && !byPhone) await sql`
        update guest_profiles set phone_enc = ${contacts.phoneEnc}, phone_hash = ${phoneHash},
          phone_verified_at = now(), updated_at = now()
        where id = ${profileId} and phone_hash is null
      `;
	}
	return {
		profileId,
		created,
		duplicateOf: byEmail && byPhone && byEmail !== byPhone ? byPhone : null,
		emailHash,
		phoneHash
	};
}
async function recordConsent(sql, data) {
	await sql`
    insert into consent_events (profile_id, purpose, granted, wording_version, wording, source, reservation_id)
    values (
      ${data.profileId}, ${data.purpose}, ${data.granted}, ${CONSENT_VERSION},
      ${consentWording(data.purpose, data.hotel, marketFor(data.market))}, ${data.source}, ${data.reservationId ?? null}
    )
  `;
}
var CONSENT_SOURCE = {
	online: "online_checkin",
	desk_tablet: "desk_tablet",
	qr: "qr"
};
/** Copy what the guest shared on this stay into their profile (profile_memory only). */
async function rememberOnProfile(sql, profileId, stay) {
	const companions = await sql.query(`select id, relation, first_name, age_band from companions where profile_id = $1`, [profileId]);
	const ids = /* @__PURE__ */ new Map();
	for (const c of companions) ids.set(`${c.relation}|${(c.first_name ?? c.age_band ?? "").toLowerCase()}`, c.id);
	for (const m of stay.party) {
		const key = m.relation === "child" ? `child|${m.ageBand}` : `${m.relation}|${m.firstName.toLowerCase()}`;
		if (ids.has(key)) continue;
		const id = nid("cmp");
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
		let companionId = null;
		if (c.whose === "partner") companionId = [...ids.entries()].find(([k]) => k.startsWith("partner|"))?.[1] ?? null;
		const exists = await sql.query(`select count(*)::int as n from occasions
       where profile_id = $1 and kind = $2 and month = $3 and coalesce(day, 0) = coalesce($4::int, 0)
         and coalesce(companion_id, '') = coalesce($5::text, '')`, [
			profileId,
			kind,
			c.month,
			c.day,
			companionId
		]);
		if (Number(exists[0]?.n ?? 0) === 0) await sql`
        insert into occasions (id, profile_id, companion_id, kind, label, month, day, source)
        values (${nid("occ")}, ${profileId}, ${companionId}, ${kind},
                ${c.whose === "someone" ? "Someone travelling with them" : c.kind === "honeymoon" ? "Wedding anniversary" : null},
                ${c.month}, ${c.day}, 'guest')
      `;
	}
	for (const h of stay.holidays) {
		if (!isHolidayId(h)) continue;
		await sql`insert into profile_holidays (profile_id, holiday) values (${profileId}, ${h}) on conflict do nothing`;
	}
}
async function completeCapture(sql, input) {
	const { reservation } = await requireStay(sql, input.token);
	const property = await loadProperty(sql);
	const row = await checkinRow(sql, reservation.id);
	const email = await decryptOrNull(row?.service_email_enc);
	const phone = await decryptOrNull(row?.service_phone_enc);
	const wants = input.consents;
	if (wants.marketing_email && !email) throw new Error("Confirm your email first to get offers by email.");
	if (wants.marketing_whatsapp && !phone) throw new Error("Confirm your WhatsApp number first.");
	if (wants.profile_memory && !email && !phone) throw new Error("Confirm an email or number first, so we can find your details next time.");
	const party = cleanParty(input.party);
	const when = input.celebration ? validDay(input.celebration.month, input.celebration.day) : {
		month: null,
		day: null
	};
	const celebration = input.celebration ? {
		...input.celebration,
		...when
	} : null;
	const eta = /^\d{2}:\d{2}$/.test(input.eta) ? input.eta : null;
	const purgeOn = addDays(reservation.departure, property.settings.serviceRetentionDays);
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
	let profileId = reservation.profileId ?? null;
	let prefToken = null;
	let created = false;
	const anyConsent = CONSENT_PURPOSES.some((p) => wants[p]);
	if (anyConsent) {
		if (!(await sql.query(`select (consent_ticket_hash = $2 and consent_ticket_expires_at > now()) as ok
       from checkins where reservation_id = $1`, [reservation.id, input.ticket ? await sha256(input.ticket) : ""]))[0]?.ok) throw new Error("Please confirm your email or number again to save these choices.");
		await sql`update checkins set consent_ticket_hash = null, consent_ticket_expires_at = null where reservation_id = ${reservation.id}`;
	}
	if (anyConsent) {
		const match = await matchOrCreateProfile(sql, reservation, {
			email: email ? normalizeEmail(email) : null,
			phone,
			emailEnc: row?.service_email_enc ?? null,
			phoneEnc: row?.service_phone_enc ?? null
		});
		profileId = match.profileId;
		created = match.created;
		await sql`update reservations set profile_id = ${profileId} where id = ${reservation.id}`;
		const now = await currentConsents(sql, profileId);
		for (const purpose of CONSENT_PURPOSES) if (wants[purpose] && !now[purpose]) {
			await recordConsent(sql, {
				profileId,
				purpose,
				granted: true,
				source: CONSENT_SOURCE[input.source],
				hotel: property.name,
				market: property.settings.market,
				reservationId: reservation.id
			});
			await audit(sql, guestActor(reservation.id), {
				action: "consent.change",
				targetType: "profile",
				targetId: profileId,
				detail: {
					purpose,
					granted: true,
					source: CONSENT_SOURCE[input.source]
				}
			});
		}
		if (wants.marketing_email || wants.marketing_whatsapp) {
			const hashes = [match.emailHash, match.phoneHash].filter((h) => Boolean(h));
			for (const h of hashes) await sql`delete from suppressions where value_hash = ${h}`;
		}
		if (wants.profile_memory || now.profile_memory) await rememberOnProfile(sql, profileId, {
			celebration,
			party,
			holidays: input.holidays
		});
		prefToken = randomToken(18);
		await sql`
      update guest_profiles set pref_token_hash = ${await sha256(prefToken)}, updated_at = now() where id = ${profileId}
    `;
		if (created) await audit(sql, guestActor(reservation.id), {
			action: "profile.created",
			targetType: "profile",
			targetId: profileId
		});
		if (match.duplicateOf) await audit(sql, {
			kind: "system",
			label: "Profile matching"
		}, {
			action: "profile.duplicate_suspected",
			targetType: "profile",
			targetId: profileId,
			detail: {
				other: match.duplicateOf,
				reason: "email and phone match different profiles"
			}
		});
		await logStep(sql, reservation.id, "consented", input.source);
	}
	await logStep(sql, reservation.id, "completed", input.source);
	return {
		completed: true,
		profileId,
		prefToken: input.source === "desk_tablet" ? null : prefToken,
		newProfile: created
	};
}
async function profileView(sql, profileId) {
	const p = await liveProfile(sql, profileId);
	const property = await loadProperty(sql);
	const market = marketFor(property.settings.market);
	const [consents, occasions, companions, holidays, stays] = await Promise.all([
		currentConsents(sql, profileId),
		sql.query(`select o.id, o.kind, o.label, o.month, o.day, c.first_name, c.relation, o.source
       from occasions o left join companions c on c.id = o.companion_id
       where o.profile_id = $1 order by o.month, o.day nulls last`, [profileId]),
		sql.query(`select id, relation, first_name, age_band from companions where profile_id = $1 order by created_at`, [profileId]),
		sql.query(`select holiday from profile_holidays where profile_id = $1 order by holiday`, [profileId]),
		sql.query(`select r.id, r.arrival::text as arrival, r.departure::text as departure, rt.name as room,
         coalesce((select sum(o.amount_cents) from orders o where o.reservation_id = r.id
                   and o.status in ('paid','fulfilled')), 0)::int as cents
       from reservations r join room_types rt on rt.id = r.room_type_id
       where r.profile_id = $1 order by r.arrival desc`, [profileId])
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
			profile_memory: consentWording("profile_memory", property.name, market)
		},
		occasions: occasions.map((o) => ({
			id: o.id,
			kind: o.kind,
			label: o.label,
			month: Number(o.month),
			day: o.day === null ? null : Number(o.day),
			companion: o.first_name ?? (o.relation === "child" ? "a child" : null),
			source: o.source
		})),
		companions: companions.map((c) => ({
			id: c.id,
			relation: c.relation,
			firstName: c.first_name,
			ageBand: c.age_band
		})),
		holidays: holidays.map((h) => h.holiday),
		stays: stays.map((s) => ({
			reservationId: s.id,
			arrival: s.arrival,
			departure: s.departure,
			roomType: s.room,
			spentCents: Number(s.cents)
		})),
		createdAt: iso(p.created_at)
	};
}
async function updateConsents(sql, data) {
	const p = await liveProfile(sql, data.profileId);
	const property = await loadProperty(sql);
	const now = await currentConsents(sql, p.id);
	for (const purpose of CONSENT_PURPOSES) {
		const want = data.changes[purpose];
		if (want === void 0 || want === now[purpose]) continue;
		if (want && purpose === "marketing_email" && !p.email_enc) throw new Error("No confirmed email on this profile.");
		if (want && purpose === "marketing_whatsapp" && !p.phone_enc) throw new Error("No confirmed WhatsApp number on this profile.");
		if (want && data.source === "staff") throw new Error("Only the guest can opt in. Staff can record a withdrawal.");
		await recordConsent(sql, {
			profileId: p.id,
			purpose,
			granted: want,
			source: data.source,
			hotel: property.name,
			market: property.settings.market
		});
		await audit(sql, data.actor, {
			action: "consent.change",
			targetType: "profile",
			targetId: p.id,
			detail: {
				purpose,
				granted: want,
				source: data.source
			}
		});
		if (purpose === "profile_memory" && !want) {
			await sql`delete from occasions where profile_id = ${p.id}`;
			await sql`delete from companions where profile_id = ${p.id}`;
			await sql`delete from profile_holidays where profile_id = ${p.id}`;
		}
	}
	return currentConsents(sql, p.id);
}
async function requireMemory(sql, profileId) {
	if (!(await currentConsents(sql, profileId)).profile_memory) throw new Error("This guest hasn't agreed to have dates and preferences remembered.");
}
async function addOccasion(sql, data) {
	await liveProfile(sql, data.profileId);
	await requireMemory(sql, data.profileId);
	const when = validDay(data.month, data.day);
	if (!when.month) throw new Error("Pick a month.");
	if (data.companionId) {
		const c = await sql.query(`select relation from companions where id = $1 and profile_id = $2`, [data.companionId, data.profileId]);
		if (!c[0]) throw new Error("Companion not found.");
		if (c[0].relation === "child" && data.kind === "birthday") throw new Error("Children's birthdays aren't stored. Keep it to the age band.");
	}
	const id = nid("occ");
	await sql`
    insert into occasions (id, profile_id, companion_id, kind, label, month, day, source)
    values (${id}, ${data.profileId}, ${data.companionId}, ${data.kind}, ${data.label?.trim().slice(0, 60) || null},
            ${when.month}, ${when.day}, ${data.source})
  `;
	await audit(sql, data.actor, {
		action: "occasion.add",
		targetType: "profile",
		targetId: data.profileId,
		detail: { kind: data.kind }
	});
	return { id };
}
async function removeOccasion(sql, profileId, occasionId) {
	await sql`delete from occasions where id = ${occasionId} and profile_id = ${profileId}`;
	return { ok: true };
}
async function removeCompanion(sql, profileId, companionId) {
	await sql`delete from companions where id = ${companionId} and profile_id = ${profileId}`;
	return { ok: true };
}
async function setHolidays(sql, profileId, holidays) {
	await liveProfile(sql, profileId);
	await requireMemory(sql, profileId);
	await sql`delete from profile_holidays where profile_id = ${profileId}`;
	for (const h of holidays) if (isHolidayId(h)) await sql`insert into profile_holidays (profile_id, holiday) values (${profileId}, ${h}) on conflict do nothing`;
	return { ok: true };
}
async function exportProfile(sql, profileId) {
	const p = await liveProfile(sql, profileId);
	const view = await profileView(sql, profileId);
	const property = await loadProperty(sql);
	const ledger = await sql.query(`select purpose, granted, wording_version, wording, source, at from consent_events where profile_id = $1 order by at, id`, [profileId]);
	const orders = await sql.query(`select r.arrival::text as arrival, f.name as offer, o.amount_cents, o.status, o.created_at
     from orders o join reservations r on r.id = o.reservation_id join offers f on f.id = o.offer_id
     where r.profile_id = $1 order by o.created_at`, [profileId]);
	return {
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		controller: {
			hotel: property.name,
			city: property.city
		},
		profile: {
			name: p.display_name,
			email: await decryptOrNull(p.email_enc),
			emailVerifiedAt: p.email_verified_at ? iso(p.email_verified_at) : null,
			phone: await decryptOrNull(p.phone_enc),
			phoneVerifiedAt: p.phone_verified_at ? iso(p.phone_verified_at) : null,
			createdAt: iso(p.created_at)
		},
		consents: view.consents,
		consentHistory: ledger.map((l) => ({
			...l,
			at: iso(l.at)
		})),
		occasions: view.occasions.map(({ kind, label, month, day, companion }) => ({
			kind,
			label,
			month,
			day,
			companion
		})),
		companions: view.companions.map(({ relation, firstName, ageBand }) => ({
			relation,
			firstName,
			ageBand
		})),
		holidays: view.holidays.map((h) => isHolidayId(h) ? HOLIDAYS[h].label : h),
		stays: view.stays.map(({ arrival, departure, roomType }) => ({
			arrival,
			departure,
			roomType
		})),
		purchases: orders.map((o) => ({
			...o,
			created_at: iso(o.created_at)
		}))
	};
}
async function anonymizeStays(sql, where) {
	const ids = await sql.query(where.profileId ? `select id, guest_name from reservations where profile_id = $1` : `select id, guest_name from reservations where id = $1`, [where.profileId ?? where.reservationId]);
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
async function eraseProfile(sql, profileId, actor, source) {
	const p = await liveProfile(sql, profileId);
	const property = await loadProperty(sql);
	for (const h of [p.email_hash, p.phone_hash]) if (h) await sql`
        insert into suppressions (value_hash, reason) values (${h}, 'erasure')
        on conflict (property_id, value_hash) do update set reason = 'erasure', at = now()
      `;
	const now = await currentConsents(sql, profileId);
	for (const purpose of CONSENT_PURPOSES) if (now[purpose]) await recordConsent(sql, {
		profileId,
		purpose,
		granted: false,
		source: "erasure",
		hotel: property.name,
		market: property.settings.market
	});
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
		detail: { stays }
	});
	return {
		erased: true,
		stays
	};
}
async function eraseReservationGuest(sql, reservationId, actor) {
	const rows = await sql.query(`select profile_id from reservations where id = $1`, [reservationId]);
	if (!rows[0]) throw new Error("Reservation not found.");
	if (rows[0].profile_id) throw new Error("This stay belongs to a guest profile. Erase the profile instead.");
	await anonymizeStays(sql, { reservationId });
	await audit(sql, actor, {
		action: "reservation.erase",
		targetType: "reservation",
		targetId: reservationId
	});
	return { ok: true };
}
function nextOccurrence(month, day, today) {
	const y = Number(today.slice(0, 4));
	const d = day ?? 1;
	const pad = (n) => String(n).padStart(2, "0");
	let candidate = `${y}-${pad(month)}-${pad(d)}`;
	if (month === 2 && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) candidate = `${y}-02-28`;
	if (candidate < today.slice(0, 10)) candidate = `${y + 1}-${pad(month)}-${pad(month === 2 && d === 29 ? 28 : d)}`;
	return candidate;
}
function occasionLabel(o) {
	const what = o.kind === "birthday" ? "Birthday" : o.kind === "anniversary" ? "Anniversary" : o.kind === "achievement" ? "Achievement" : o.label ?? "Occasion";
	return o.companion ? `${o.companion}'s ${what.toLowerCase()}` : what;
}
async function listProfiles(sql, opts = {}) {
	const today = await todayIso(sql);
	const search = opts.search?.trim() ?? "";
	let hash = null;
	if (search.includes("@")) {
		const e = normalizeEmail(search);
		hash = e ? await blindIndex(e) : null;
	} else if (/^\+?[\d\s()-]{8,}$/.test(search)) {
		const ph = normalizePhone(search, (await loadProperty(sql)).settings.market);
		hash = ph ? await blindIndex(ph) : null;
	}
	const rows = await sql.query(`select p.id, p.display_name, p.email_enc, p.phone_enc,
       count(r.id)::int as stays, max(r.arrival)::text as last_arrival,
       coalesce((select sum(o.amount_cents) from orders o join reservations r2 on r2.id = o.reservation_id
                 where r2.profile_id = p.id and o.status in ('paid','fulfilled')), 0)::int as cents
     from guest_profiles p left join reservations r on r.profile_id = p.id
     where p.merged_into is null and p.erased_at is null
       and ($1::text is null or p.email_hash = $1 or p.phone_hash = $1)
       and ($2::text = '' or $1::text is not null or p.display_name ilike '%' || $2 || '%')
     group by p.id
     order by max(r.arrival) desc nulls last, p.created_at desc
     limit 300`, [hash, hash ? "" : search]);
	const consentRows = await sql.query(`select distinct on (profile_id, purpose) profile_id, purpose, granted
     from consent_events order by profile_id, purpose, at desc, id desc`);
	const consents = /* @__PURE__ */ new Map();
	for (const c of consentRows) {
		const cur = consents.get(c.profile_id) ?? { ...NO_CONSENTS };
		cur[c.purpose] = Boolean(c.granted);
		consents.set(c.profile_id, cur);
	}
	const occ = await sql.query(`select o.profile_id, o.kind, o.label, o.month, o.day, c.first_name
     from occasions o left join companions c on c.id = o.companion_id`);
	const next = /* @__PURE__ */ new Map();
	for (const o of occ) {
		const date = nextOccurrence(Number(o.month), o.day === null ? null : Number(o.day), today);
		const cur = next.get(o.profile_id);
		if (!cur || date < cur.date) next.set(o.profile_id, {
			label: occasionLabel({
				kind: o.kind,
				label: o.label,
				companion: o.first_name
			}),
			date
		});
	}
	const out = [];
	for (const r of rows) {
		const c = consents.get(r.id) ?? { ...NO_CONSENTS };
		const n = next.get(r.id) ?? null;
		const row = {
			id: r.id,
			name: r.display_name,
			email: r.email_enc ? maskEmail(await decryptOrNull(r.email_enc) ?? "?@?") : null,
			phone: r.phone_enc ? maskPhone(await decryptOrNull(r.phone_enc) ?? "00") : null,
			stays: Number(r.stays),
			lastArrival: r.last_arrival,
			spentCents: Number(r.cents),
			consents: c,
			nextOccasion: n
		};
		if (opts.filter === "marketable" && !(c.marketing_email || c.marketing_whatsapp)) continue;
		if (opts.filter === "returning" && row.stays < 2) continue;
		if (opts.filter === "occasions" && !(n && daysBetween(today, n.date) <= 60)) continue;
		out.push(row);
	}
	return {
		rows: out,
		total: rows.length
	};
}
async function profileDetail(sql, profileId) {
	const view = await profileView(sql, profileId);
	const today = await todayIso(sql);
	const ledger = await sql.query(`select id, purpose, granted, source, wording, at from consent_events where profile_id = $1 order by at desc, id desc`, [profileId]);
	const dupes = await sql.query(`select p.id, p.display_name, (select count(*)::int from reservations r where r.profile_id = p.id) as stays
     from guest_profiles p
     where p.id <> $1 and p.merged_into is null and p.erased_at is null
       and lower(p.display_name) = lower((select display_name from guest_profiles where id = $1))
     limit 5`, [profileId]);
	const flaggedIds = (await sql.query(`select detail->>'other' as other from audit_log
     where action = 'profile.duplicate_suspected' and target_id = $1`, [profileId])).map((f) => f.other).filter((id) => id && !dupes.some((d) => d.id === id));
	const flaggedRows = flaggedIds.length ? await sql.query(`select p.id, p.display_name, (select count(*)::int from reservations r where r.profile_id = p.id) as stays
         from guest_profiles p where p.id = any($1::text[]) and p.merged_into is null and p.erased_at is null`, [`{${flaggedIds.join(",")}}`]) : [];
	return {
		...view,
		upcoming: view.occasions.map((o) => ({
			...o,
			next: nextOccurrence(o.month, o.day, today)
		})).sort((a, b) => a.next.localeCompare(b.next)),
		ledger: ledger.map((l) => ({
			id: Number(l.id),
			purpose: l.purpose,
			granted: l.granted,
			source: l.source,
			wording: l.wording,
			at: iso(l.at)
		})),
		duplicates: [...dupes, ...flaggedRows].map((d) => ({
			id: d.id,
			name: d.display_name,
			stays: Number(d.stays)
		})),
		today
	};
}
async function revealContact(sql, profileId) {
	const p = await liveProfile(sql, profileId);
	return {
		email: await decryptOrNull(p.email_enc),
		phone: await decryptOrNull(p.phone_enc)
	};
}
/**
* Merge `mergeId` into `keepId`. Stays, occasions, companions and holidays move;
* consent history is copied (the ledger is append-only) with original times, so
* the kept profile's current state is the latest decision across both.
*/
async function mergeProfiles(sql, keepId, mergeId, actor) {
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
	await sql`
    update guest_profiles set merged_into = ${keepId}, email_enc = null, email_hash = null, phone_enc = null,
      phone_hash = null, pref_token_hash = null, updated_at = now()
    where id = ${mergeId}
  `;
	if (!keep.email_hash && gone.email_hash) await sql`
      update guest_profiles set email_enc = ${gone.email_enc}, email_hash = ${gone.email_hash},
        email_verified_at = ${gone.email_verified_at ? iso(gone.email_verified_at) : null}, updated_at = now()
      where id = ${keepId}
    `;
	if (!keep.phone_hash && gone.phone_hash) await sql`
      update guest_profiles set phone_enc = ${gone.phone_enc}, phone_hash = ${gone.phone_hash},
        phone_verified_at = ${gone.phone_verified_at ? iso(gone.phone_verified_at) : null}, updated_at = now()
      where id = ${keepId}
    `;
	if (!(await currentConsents(sql, keepId)).profile_memory) {
		await sql`delete from occasions where profile_id = ${keepId}`;
		await sql`delete from companions where profile_id = ${keepId}`;
		await sql`delete from profile_holidays where profile_id = ${keepId}`;
	}
	await audit(sql, actor, {
		action: "profile.merge",
		targetType: "profile",
		targetId: keepId,
		detail: { merged: mergeId }
	});
	return { keptId: keepId };
}
/**
* One pass of every retention clock. Safe to run repeatedly; does only what is due.
*   1. OTA-sourced stays without a profile: guest name -> initials, notes cleared,
*      after departure + the channel's retention days (Booking.com: 30, verified).
*   2. Stay-only data (service contact, party, celebration) after checkins.purge_on.
*   3. Verification records after 7 days.
*   4. Profiles whose consents are all withdrawn, after 30 days: erased.
*/
async function runPurge(sql) {
	const today = await todayIso(sql);
	const due = await sql.query(`select id, source, departure::text as departure, guest_name from reservations
     where anonymized_at is null and profile_id is null and source <> 'Direct' and departure < $1::date`, [today]);
	let ota = 0;
	for (const r of due) {
		const rule = otaRetention(r.source);
		if (!rule || addDays(r.departure, rule.days) >= today) continue;
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
	await sql`
    update checkins c set purge_on = r.departure + p.service_retention_days
    from reservations r, properties p
    where c.purge_on is null and r.id = c.reservation_id and p.id = r.property_id
  `;
	const cleared = await sql.query(`update checkins set service_email_enc = null, service_phone_enc = null, party = '[]'::jsonb,
       celebration = null, celebration_whose = null, celebration_month = null, celebration_day = null
     where purge_on < $1::date
       and (service_email_enc is not null or service_phone_enc is not null or celebration is not null
            or party <> '[]'::jsonb)
     returning reservation_id`, [today]);
	const verifications = await sql.query(`delete from contact_verifications where created_at < now() - make_interval(days => $1) returning id`, [7]);
	const dormant = await sql.query(`with latest as (
       select distinct on (profile_id, purpose) profile_id, purpose, granted, at
       from consent_events order by profile_id, purpose, at desc, id desc
     )
     select l.profile_id from latest l join guest_profiles p on p.id = l.profile_id
     where p.erased_at is null and p.merged_into is null
     group by l.profile_id
     having bool_and(not l.granted) and max(l.at) < now() - make_interval(days => $1)`, [30]);
	for (const d of dormant) await eraseProfile(sql, d.profile_id, {
		kind: "system",
		label: "Retention"
	}, "staff");
	const result = {
		otaStaysAnonymized: ota,
		serviceDataCleared: cleared.length,
		verificationsDeleted: verifications.length,
		dormantProfilesErased: dormant.length
	};
	await sql`update properties set last_purge_on = ${today}::date where id = current_setting('app.property_id', true)`;
	await audit(sql, {
		kind: "system",
		label: "Retention"
	}, {
		action: "retention.purge",
		detail: result
	});
	return result;
}
/** Daily housekeeping when staff open the hotel: purge once per day; seed demo capture data once. */
async function housekeeping(sql) {
	const p = (await sql.query(`select last_purge_on::text as last_purge_on, is_demo, demo_seeded_capture, CURRENT_DATE::text as today
     from properties where id = current_setting('app.property_id', true)`))[0];
	if (!p) return;
	if (p.is_demo && !p.demo_seeded_capture) await seedDemoCapture(sql);
	if (!p.last_purge_on || p.last_purge_on < p.today) await runPurge(sql);
}
async function captureGate(sql) {
	const today = await todayIso(sql);
	const property = await loadProperty(sql, today);
	const launched = property.settings.captureLaunchedOn;
	const pilotStart = property.economics.launchedOn;
	const from = launched ?? today;
	const pct = (a, b) => b ? a / b * 100 : 0;
	const base = await sql.query(`select count(*)::int as arrivals, count(c.completed_at)::int as completed
     from reservations r left join checkins c on c.reservation_id = r.id
     where r.arrival >= $1::date and r.arrival < $2::date`, [pilotStart, from]);
	const after = await sql.query(`with w as (
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
     from w`, [from, today]);
	const steps = await sql.query(`select e.step, count(distinct e.reservation_id)::int as n
     from capture_events e join reservations r on r.id = e.reservation_id
     where r.arrival >= $1::date and r.arrival <= $2::date
     group by e.step`, [from, today]);
	const bySource = await sql.query(`select coalesce(c.source, 'online') as source, count(*)::int as n
     from checkins c join reservations r on r.id = c.reservation_id
     where c.completed_at is not null and r.arrival >= $1::date and r.arrival <= $2::date
     group by 1 order by 2 desc`, [from, today]);
	const b = base[0] ?? {
		arrivals: 0,
		completed: 0
	};
	const a = after[0] ?? {
		arrivals: 0,
		completed: 0,
		ota_completed: 0,
		captured: 0,
		marketable: 0
	};
	const baselinePct = pct(Number(b.completed), Number(b.arrivals));
	const afterPct = pct(Number(a.completed), Number(a.arrivals));
	const capturePct = pct(Number(a.captured), Number(a.ota_completed));
	const marketablePct = pct(Number(a.marketable), Number(a.ota_completed));
	const dropPts = Math.round((baselinePct - afterPct) * 10) / 10;
	const order = [
		"started",
		"celebration",
		"party",
		"code_sent",
		"verified",
		"consented",
		"completed"
	];
	const n = Number(a.ota_completed);
	return {
		launchedOn: launched,
		baseline: {
			arrivals: Number(b.arrivals),
			completed: Number(b.completed),
			completionPct: baselinePct,
			from: pilotStart,
			to: addDays(from, -1)
		},
		after: {
			arrivals: Number(a.arrivals),
			completed: Number(a.completed),
			completionPct: afterPct,
			otaCompleted: n,
			captured: Number(a.captured),
			capturePct,
			marketable: Number(a.marketable),
			marketablePct
		},
		dropPts,
		steps: order.map((step) => ({
			step,
			n: Number(steps.find((s) => s.step === step)?.n ?? 0)
		})),
		gates: [
			{
				id: "capture",
				label: "Own contact captured",
				value: capturePct,
				target: "≥ 40% of OTA check-ins",
				pass: capturePct >= 40
			},
			{
				id: "marketable",
				label: "Marketable (opted in)",
				value: marketablePct,
				target: "≥ 10% of OTA check-ins",
				pass: marketablePct >= 10
			},
			{
				id: "completion",
				label: "Check-in completion drop",
				value: dropPts,
				target: "≤ 3 points vs before",
				pass: dropPts <= 3
			}
		],
		evidence: n < 50 ? "too_few" : n < 300 ? "directional" : "solid",
		bySource: bySource.map((s) => ({
			source: s.source,
			n: Number(s.n)
		}))
	};
}
function draw(id, salt) {
	let h = 2166136261;
	for (const ch of `${salt}:${id}`) {
		h ^= ch.charCodeAt(0);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0) % 1e4 / 1e4;
}
/**
* Demo hotel only: give the three weeks since the capture step launched a
* realistic capture history (encrypted fake contacts at example.com / 555
* numbers, consents, occasions), so the phase B gate and guest profiles have
* something to show. Runs once, inside the demo hotel's own transaction.
*/
async function seedDemoCapture(sql) {
	const property = await loadProperty(sql);
	const from = property.settings.captureLaunchedOn;
	const today = await todayIso(sql);
	if (!property.settings.isDemo || !from) return { seeded: 0 };
	const stays = await sql.query(`select r.id, r.guest_name, r.source, r.departure::text as departure, (c.completed_at is not null) as completed, r.token
     from reservations r left join checkins c on c.reservation_id = r.id
     where r.arrival >= $1::date and r.arrival <= $2::date and r.profile_id is null
       and r.id not in ('res_maya', 'res_elena', 'res_noah', 'res_owen')
     order by r.id`, [from, today]);
	const hotel = property.name;
	const market = property.settings.market;
	let seeded = 0;
	const holidaysPool = [
		"christmas",
		"new_year",
		"thanksgiving",
		"diwali",
		"lunar_new_year",
		"eid_al_fitr",
		"hanukkah"
	];
	for (const s of stays) {
		const u = draw(s.id, "start");
		if (!s.completed) {
			if (u < .35) await sql`insert into capture_events (reservation_id, step, source) values (${s.id}, 'started', 'online')`;
			continue;
		}
		const source = draw(s.id, "src") < .22 ? "desk_tablet" : draw(s.id, "src") < .3 ? "qr" : "online";
		const steps = [
			"started",
			"celebration",
			"party"
		];
		const captured = s.source !== "Direct" && draw(s.id, "cap") < .47;
		const first = s.guest_name.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") || "guest";
		const usePhone = draw(s.id, "ch") < .25;
		const email = captured && !usePhone ? `${first}.${s.id.slice(-4)}@example.com` : null;
		const phone = captured && usePhone ? `+1512555${String(Math.floor(draw(s.id, "ph") * 1e4)).padStart(4, "0")}` : null;
		const celebration = draw(s.id, "cel") < .13 ? draw(s.id, "kind") < .55 ? "birthday" : "anniversary" : null;
		const thisMonth = Number(today.slice(5, 7));
		const month = draw(s.id, "soon") < .5 ? (thisMonth + Math.floor(draw(s.id, "m") * 2)) % 12 + 1 : 1 + Math.floor(draw(s.id, "m") * 12);
		const day = 1 + Math.floor(draw(s.id, "d") * 28);
		await sql`
      update checkins set source = ${source}, started_at = completed_at - interval '3 minutes',
        celebration = ${celebration}, celebration_whose = ${celebration ? celebration === "birthday" ? "me" : "partner" : null},
        celebration_month = ${celebration ? month : null}, celebration_day = ${celebration ? day : null},
        service_email_enc = ${email ? await encrypt(email) : null},
        service_phone_enc = ${phone ? await encrypt(phone) : null},
        contact_verified_at = ${captured ? (/* @__PURE__ */ new Date()).toISOString() : null},
        contact_channel = ${captured ? usePhone ? "whatsapp" : "email" : null},
        real_email_captured = real_email_captured or ${Boolean(email)},
        purge_on = ${addDays(s.departure, property.settings.serviceRetentionDays)}
      where reservation_id = ${s.id}
    `;
		if (captured) steps.push("code_sent", "verified");
		const marketable = captured && draw(s.id, "mkt") < .34;
		const memory = captured && draw(s.id, "mem") < (marketable ? .6 : .15);
		if (marketable || memory) {
			const profileId = `gp_demo_${s.id.slice(-6)}`;
			const emailHash = email ? await blindIndex(email) : null;
			const phoneHash = phone ? await blindIndex(phone) : null;
			await sql`
        insert into guest_profiles (id, display_name, email_enc, email_hash, email_verified_at, phone_enc, phone_hash, phone_verified_at, created_at)
        values (${profileId}, ${s.guest_name}, ${email ? await encrypt(email) : null}, ${emailHash}, ${email ? (/* @__PURE__ */ new Date()).toISOString() : null},
                ${phone ? await encrypt(phone) : null}, ${phoneHash}, ${phone ? (/* @__PURE__ */ new Date()).toISOString() : null}, now() - interval '5 days')
        on conflict (id) do nothing
      `;
			await sql`update reservations set profile_id = ${profileId} where id = ${s.id}`;
			const grant = async (purpose) => recordConsent(sql, {
				profileId,
				purpose,
				granted: true,
				source: CONSENT_SOURCE[source],
				hotel,
				market,
				reservationId: s.id
			});
			if (marketable) await grant(usePhone ? "marketing_whatsapp" : "marketing_email");
			if (memory) {
				await grant("profile_memory");
				await rememberOnProfile(sql, profileId, {
					celebration: celebration ? {
						kind: celebration,
						whose: celebration === "birthday" ? "me" : "partner",
						month,
						day
					} : draw(s.id, "bday") < .5 ? {
						kind: "birthday",
						whose: "me",
						month,
						day
					} : null,
					party: draw(s.id, "party") < .5 ? [{
						relation: "partner",
						firstName: draw(s.id, "pn") < .5 ? "Sam" : "Alex"
					}] : [],
					holidays: draw(s.id, "hol") < .4 ? [holidaysPool[Math.floor(draw(s.id, "h1") * holidaysPool.length)]] : []
				});
			}
			steps.push("consented");
		}
		steps.push("completed");
		for (const step of steps) await sql`insert into capture_events (reservation_id, step, source) values (${s.id}, ${step}, ${source})`;
		seeded += 1;
	}
	await sql`update properties set demo_seeded_capture = true where id = current_setting('app.property_id', true)`;
	return { seeded };
}
async function deskArrivals(sql) {
	const today = await todayIso(sql);
	return {
		today,
		arrivals: (await sql.query(`select r.id, r.guest_name, r.arrival::text as arrival, r.departure::text as departure, rt.name as room,
       r.token, r.holdout, (c.completed_at is not null) as completed,
       (c.contact_verified_at is not null) as verified, r.source
     from reservations r join room_types rt on rt.id = r.room_type_id
     left join checkins c on c.reservation_id = r.id
     where r.anonymized_at is null and r.arrival between $1::date - 1 and $1::date + 1 and r.departure > $1::date
     order by (c.completed_at is not null), r.arrival, r.guest_name`, [today])).map((r) => ({
			reservationId: r.id,
			guestName: r.guest_name,
			arrival: r.arrival,
			departure: r.departure,
			room: r.room,
			token: r.token,
			completed: Boolean(r.completed),
			verified: Boolean(r.verified),
			source: r.source
		}))
	};
}
/** QR at the desk: guest types last name + booking reference; we return their stay link. */
async function findBookingForQr(sql, data) {
	const today = await todayIso(sql);
	const last = data.lastName.trim().toLowerCase();
	const ref = data.bookingRef.trim().replace(/\s+/g, "").toLowerCase();
	if (last.length < 2 || ref.length < 4) throw new Error("Enter your last name and booking reference.");
	const match = (await sql.query(`select token, guest_name from reservations
     where lower(replace(booking_ref, ' ', '')) = $1 and departure >= $2::date and anonymized_at is null`, [ref, today])).find((r) => {
		const parts = r.guest_name.toLowerCase().split(/\s+/);
		return parts.length > 1 ? parts.slice(1).join(" ") === last || parts[parts.length - 1] === last : parts[0] === last;
	});
	if (!match) throw new Error("We couldn't find that booking. Check the reference, or ask the front desk.");
	return { token: match.token };
}
/** Occasions coming up in the next `days` days across live profiles (for the guests screen). */
async function upcomingOccasions(sql, days = 60) {
	const today = await todayIso(sql);
	return (await sql.query(`select o.profile_id, p.display_name as name, o.kind, o.label, o.month, o.day, c.first_name
     from occasions o join guest_profiles p on p.id = o.profile_id
     left join companions c on c.id = o.companion_id
     where p.erased_at is null and p.merged_into is null`)).map((r) => ({
		profileId: r.profile_id,
		name: r.name,
		what: occasionLabel({
			kind: r.kind,
			label: r.label,
			companion: r.first_name
		}),
		date: nextOccurrence(Number(r.month), r.day === null ? null : Number(r.day), today),
		exactDay: r.day !== null
	})).filter((r) => daysBetween(today, r.date) <= days).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);
}
/**
* "See what we keep" from the stay page. The stay link alone must not open the
* preference centre (front-desk staff see stay links), so the new link goes to
* the profile's verified email. Local development has no mail, so the link is
* returned for the screen instead.
*/
async function sendPreferenceLink(sql, token, origin) {
	const { reservation } = await requireStay(sql, token);
	if (!reservation.profileId) throw new Error("Nothing is kept beyond this stay, so there's nothing to manage.");
	const p = await profileRow(sql, reservation.profileId);
	if (!p || p.erased_at || p.merged_into) throw new Error("Nothing is kept beyond this stay.");
	const email = await decryptOrNull(p.email_enc);
	if (!email && realDatabase()) throw new Error("We can only send this link by email. Ask the front desk to help.");
	const property = await loadProperty(sql);
	const prefToken = randomToken(18);
	await sql`update guest_profiles set pref_token_hash = ${await sha256(prefToken)}, updated_at = now() where id = ${p.id}`;
	const link = `${origin.replace(/\/+$/, "")}/p/${prefToken}`;
	if (!email) return {
		sentTo: null,
		devLink: link
	};
	const body = simpleEmail({
		hotel: property.name,
		heading: "What we keep about you",
		lines: ["See, change or delete the details and choices you shared with us. This link replaces any earlier one."],
		cta: {
			label: "Open my preferences",
			url: link
		}
	});
	const sent = await sendMail({
		to: email,
		subject: `Your preferences at ${property.name}`,
		html: body.html,
		text: body.text,
		from: property.settings.senderEmail,
		fromName: property.name,
		tag: "preferences"
	});
	return {
		sentTo: maskEmail(email),
		devLink: sent.delivered ? void 0 : link
	};
}
//#endregion
export { sha256 as A, sendStayLink as C, updateSettings as D, updateEconomics as E, sendMail as M, simpleEmail as N, keyStatus as O, sendBookingEmail as S, toggleRecipe as T, recipes as _, fulfillment as a, addOccasion, roomTypes as b, logDeskSale as c, captureGate, captureStep, completeCapture, offers as d, deskArrivals, eraseProfile, eraseReservationGuest, exportProfile, overviewExtras as f, findBookingForQr, purchaseOffer as g, publicOrigin as h, housekeeping, decideOrder as i, mailStatus as j, randomToken as k, measuredRoi as l, listProfiles, previewEmailParse as m, mergeProfiles, bookingEmail as n, ingestReservation as o, pendingCount as p, profileDetail, profileView, dashboard as r, removeCompanion, removeOccasion, revealContact, runPurge, loadProperty as s, sendContactCode, sendPreferenceLink, setHolidays, startCapture, stayPage, analytics as t, messages as u, upcomingOccasions, updateConsents, recordStayView as v, verifyContactCode, toggleOffer as w, seedStarterCatalogue as x, reservations as y };
