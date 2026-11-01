import { o as __toESM } from "../_runtime.mjs";
import { u as stayRange } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as ArrowLeft, L as Check, h as QrCode } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as Route$23, F as getStay } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
import { t as CheckinFlow } from "./checkin-flow-CE4pgD2n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-D7FwGqWA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Front-desk tablet. Staff pick the arriving guest, hand over the tablet, and
* the guest runs the same check-in step they'd see on their phone (source:
* desk_tablet). When they finish, the screen returns to the arrivals list.
*/
function Desk() {
	const data = Route$23.useLoaderData();
	const router = useRouter();
	const [active, setActive] = (0, import_react.useState)(null);
	const [showQr, setShowQr] = (0, import_react.useState)(false);
	async function open(token) {
		try {
			const stay = await getStay({ data: { token } });
			setActive({
				token,
				stay
			});
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not open this stay.");
		}
	}
	async function reset() {
		setActive(null);
		await router.invalidate();
	}
	if (active) {
		const first = active.stay.reservation.guestName.split(" ")[0] ?? "";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "min-h-dvh bg-linen px-4 py-8 sm:py-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl font-medium",
						children: data.property.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-stone",
						children: stayRange(active.stay.reservation.arrival, active.stay.reservation.departure)
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void reset(),
						className: "rounded-md px-3 py-2 text-xs text-mist hover:bg-cream hover:text-stone",
						children: "Staff: cancel"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckinFlow, {
					token: active.token,
					hotel: data.property.name,
					guestFirstName: first,
					guests: active.stay.reservation.guests,
					state: active.stay.checkin,
					config: active.stay.capture,
					source: "desk_tablet",
					kiosk: true,
					onDone: () => void reset()
				})]
			})
		});
	}
	const open_ = data.arrivals.filter((a) => !a.completed);
	const done = data.arrivals.filter((a) => a.completed);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-linen px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/hotel",
						className: "inline-flex items-center gap-1 text-sm text-stone hover:text-ink",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back to the hotel"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						size: "sm",
						onClick: () => setShowQr((v) => !v),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-4" }),
							" ",
							showQr ? "Hide QR" : "Show check-in QR"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 font-display text-4xl font-medium tracking-tight",
					children: "Check-in desk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-stone",
					children: "Tap the guest in front of you, then hand them the tablet. It returns here when they finish."
				}),
				showQr ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 flex flex-col items-center gap-4 rounded-xl bg-paper p-6 text-center shadow-[var(--shadow-border)] sm:flex-row sm:text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-44 shrink-0",
						dangerouslySetInnerHTML: { __html: data.qr.svg }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl font-medium",
							children: "Check in on your phone"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-stone",
							children: "Scan, then enter your last name and booking reference."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 break-all font-mono text-xs text-mist",
							children: data.qr.url
						})
					] })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-xs uppercase tracking-[0.16em] text-stone",
						children: [
							"To check in (",
							open_.length,
							")"
						]
					}), open_.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 rounded-lg border border-line bg-cream px-4 py-8 text-center text-stone",
						children: "Everyone due is checked in."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 grid gap-3 sm:grid-cols-2",
						children: open_.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void open(a.token),
							className: "flex min-h-20 w-full flex-col items-start rounded-xl bg-paper px-5 py-4 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-display text-xl font-medium",
								children: a.guestName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 text-sm text-stone",
								children: [
									stayRange(a.arrival, a.departure),
									" · ",
									a.room,
									" · ",
									a.source
								]
							})]
						}) }, a.reservationId))
					})]
				}),
				done.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-xs uppercase tracking-[0.16em] text-stone",
						children: [
							"Checked in (",
							done.length,
							")"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 divide-y divide-line overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-border)]",
						children: done.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 px-5 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-pine" }),
									" ",
									a.guestName
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: a.verified ? "pine" : "quiet",
								children: a.verified ? "Own contact" : "No contact"
							})]
						}, a.reservationId))
					})]
				}) : null
			]
		})
	});
}
//#endregion
export { Desk as component };
