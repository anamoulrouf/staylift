import { o as __toESM } from "../_runtime.mjs";
import { a as money, c as priceHint, r as formatDate, u as stayRange } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Route$2, nt as sendBookingEmail } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/email._reservationId-sLIvJqBe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MODE_COPY = {
	full: "Guest's own address: offer cards with prices and one-tap links straight to each offer.",
	light: "OTA relay address: everything stays about this reservation — the picks and why, no prices, one link to the stay page.",
	service: "Holdout booking: confirmation and check-in only, so the control group never sees an offer."
};
function EmailPreview() {
	const data = Route$2.useLoaderData();
	const router = useRouter();
	const [width, setWidth] = (0, import_react.useState)("desktop");
	const [view, setView] = (0, import_react.useState)("html");
	const [sending, setSending] = (0, import_react.useState)(false);
	const r = data.reservation;
	async function send() {
		setSending(true);
		try {
			const res = await sendBookingEmail({ data: {
				reservationId: r.id,
				origin: window.location.origin
			} });
			toast.success(`Sent: “${res.subject}”`);
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not send.");
		} finally {
			setSending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hotel/reservations",
				className: "text-sm text-stone hover:text-ink",
				children: "← Reservations"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-stone",
						children: "Step 2 of the journey · booking email"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
						children: r.guestName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-stone",
						children: [
							stayRange(r.arrival, r.departure),
							" · ",
							r.roomTypeName,
							" · ",
							r.bookingRef,
							" via ",
							r.source
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/stay/$token",
						params: { token: r.token },
						search: { src: "email" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							children: "Open landing page"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => void send(),
						disabled: sending || !data.email || Boolean(data.sentAt),
						children: data.sentAt ? `Sent ${formatDate(data.sentAt)}` : sending ? "Sending…" : "Send now"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "min-w-0 rounded-xl bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5",
					children: data.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "space-y-1.5 border-b border-line pb-4 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "w-16 shrink-0 text-stone",
										children: "To"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: data.recipient })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "w-16 shrink-0 text-stone",
										children: "Subject"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "font-medium",
										children: data.email.subject
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "w-16 shrink-0 text-stone",
										children: "Preview"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "text-stone",
										children: data.email.preheader
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "inline-flex rounded-md bg-cream p-1",
								role: "tablist",
								"aria-label": "Format",
								children: ["html", "text"].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									"aria-selected": view === v,
									onClick: () => setView(v),
									className: cn("h-8 rounded-sm px-3 text-sm", view === v ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone"),
									children: v === "html" ? "Email" : "Plain text"
								}, v))
							}), view === "html" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "inline-flex rounded-md bg-cream p-1",
								role: "tablist",
								"aria-label": "Width",
								children: ["desktop", "phone"].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									"aria-selected": width === v,
									onClick: () => setWidth(v),
									className: cn("h-8 rounded-sm px-3 text-sm", width === v ? "bg-paper shadow-[var(--shadow-border)]" : "text-stone"),
									children: v === "desktop" ? "Desktop" : "Phone"
								}, v))
							}) : null]
						}),
						view === "html" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex justify-center overflow-hidden rounded-lg bg-linen",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
								title: "Booking email preview",
								srcDoc: data.email.html,
								sandbox: "",
								className: "h-[900px] border-0 bg-linen",
								style: {
									width: width === "desktop" ? "100%" : 375,
									maxWidth: "100%"
								}
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-cream p-4 text-sm leading-relaxed",
							children: data.email.text
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-10 text-center text-stone",
						children: "No email address on this booking — it gets the WhatsApp check-in link instead, if a valid phone exists."
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-lg font-medium",
									children: "Email version"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: data.mode === "full" ? "pine" : data.mode === "light" ? "amber" : "quiet",
									children: data.modeLabel
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-stone",
								children: data.mode ? MODE_COPY[data.mode] : "Not emailable."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-lg font-medium",
									children: "Why these offers"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 flex flex-wrap gap-1.5",
									children: data.signals.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "quiet",
										children: s
									}) }, s))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "mt-4 space-y-3",
									children: data.picks.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-medium",
													children: [
														i + 1,
														". ",
														p.name
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "tabular-nums text-stone",
													children: [money(p.priceCents), priceHint(p.priceUnit)]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-stone",
												children: p.reason
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-mist",
												children: ["score ", p.score]
											})
										]
									}, p.offerId))
								}),
								data.mode === "service" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-stone",
									children: "Picks are shown here for staff only; this guest won’t see them."
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl bg-paper p-5 text-sm text-stone shadow-[var(--shadow-border)]",
							children: [
								"Sends automatically when a booking is ingested. Links carry ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "text-ink",
									children: "src=email"
								}),
								", so the landing-page visit and any offer bought on it count toward the email in the journey funnel on Overview."
							]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { EmailPreview as component };
