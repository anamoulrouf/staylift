import { o as __toESM } from "../_runtime.mjs";
import { i as money, l as stayRange, t as SAMPLE_CONFIRMATION } from "./format-BLHOf1yn.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, S as useRouter, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { f as ingestReservation, g as sendStayLink, p as previewEmailParse, r as Route$1 } from "./router-ZEuq5NDh.mjs";
import { t as Badge } from "./badge-CSy3-CFY.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { n as StatusPill, t as ContactPill } from "./status-pill-BF9J_gKl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reservations-BuoUPacE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReservationsPage() {
	const { reservations, ordersByRes, rooms } = Route$1.useLoaderData();
	const router = useRouter();
	const [email, setEmail] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function parseAndIngest() {
		setBusy(true);
		try {
			const parsed = await previewEmailParse({ data: { text: email } });
			if ("error" in parsed) {
				toast.error(parsed.error);
				return;
			}
			await ingestReservation({ data: {
				bookingRef: parsed.bookingRef,
				source: parsed.source,
				guestName: parsed.guestName,
				arrival: parsed.arrival,
				departure: parsed.departure,
				roomTypeId: parsed.roomTypeId,
				guests: parsed.guests,
				emailKind: parsed.emailKind,
				phoneKind: parsed.phoneKind
			} });
			toast.success(`Ingested ${parsed.guestName}. Stay link ready.`);
			setEmail("");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ingest failed.");
		} finally {
			setBusy(false);
		}
	}
	async function ping(id, channel) {
		try {
			await sendStayLink({ data: {
				reservationId: id,
				channel
			} });
			toast.success(`Sent via ${channel}.`);
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not send.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: "Reservations"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Booking is the unit. CSV and forwarded confirmation emails are enough to go live — channel manager and PMS come later."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-medium",
						children: "Ingest a confirmation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-stone",
						children: "Paste a Booking.com, Expedia, or Agoda email. Masked OTA inboxes and placeholder phones are detected, not trusted."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: email,
						onChange: (e) => setEmail(e.target.value),
						rows: 8,
						className: "mt-4 w-full rounded-md border border-line bg-cream px-3 py-2 text-sm leading-relaxed outline-none focus:border-pine",
						placeholder: "Paste a reservation confirmation…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => void parseAndIngest(),
							disabled: busy || email.length < 20,
							children: "Parse & ingest"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setEmail(SAMPLE_CONFIRMATION),
							children: "Load sample email"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-stone",
						children: ["Room types on file: ", rooms.map((r) => r.name).join(" · ")]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 overflow-x-auto rounded-xl bg-paper shadow-[var(--shadow-border)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[720px] text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "border-b border-line text-xs uppercase tracking-[0.14em] text-stone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Guest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Stay"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Source"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Channel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 font-medium",
								children: "Attach"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3 font-medium" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: reservations.map((res) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: res.guestName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-stone",
									children: res.bookingRef
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: stayRange(res.arrival, res.departure) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { status: res.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-stone",
										children: res.roomTypeName
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-stone",
								children: res.source
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactPill, {
									reachable: res.reachable,
									channels: res.eligibleChannels
								}), res.phoneKind === "placeholder" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-rose",
									children: "Placeholder phone rejected"
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 tabular-nums",
								children: ordersByRes[res.id] ? money(ordersByRes[res.id]) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap justify-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/stay/$token",
										params: { token: res.token },
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											children: "Guest page"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										onClick: () => void ping(res.id, res.phoneKind === "valid" ? "sms" : "email"),
										children: "Send link"
									})]
								})
							})
						]
					}, res.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-stone",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: "quiet",
					children: [reservations.length, " bookings"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2",
					children: "Consent is transactional-first. Marketing requires a captured personal email."
				})]
			})
		]
	});
}
//#endregion
export { ReservationsPage as component };
