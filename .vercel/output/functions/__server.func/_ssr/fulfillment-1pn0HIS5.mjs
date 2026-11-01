import { o as __toESM } from "../_runtime.mjs";
import { a as money, c as priceHint, r as formatDate, u as stayRange } from "./format-CAsbM_bU.mjs";
import { n as isNightly, t as computeAmount } from "./pricing-qOBERzJ7.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as Check, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as decideOrder, p as Route$13, z as logDeskSale } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fulfillment-1pn0HIS5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PendingCard({ order, onDecide, large }) {
	const locked = order.approvableFrom !== null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-lg bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: large ? "font-display text-2xl font-medium" : "font-medium",
						children: order.guestName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-stone",
						children: [
							order.channel === "desk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "quiet",
								className: "mr-1.5",
								children: "Desk"
							}) : null,
							order.offerName,
							order.forTime ? ` · ${order.forTime}` : "",
							order.forDate ? ` · ${formatDate(order.forDate)}` : ""
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: large ? "font-display text-2xl tabular-nums" : "tabular-nums text-sm",
					children: money(order.amountCents)
				})]
			}),
			locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-amber",
				children: [
					"Upgrades are confirmed from ",
					formatDate(order.approvableFrom),
					" — 72 hours before arrival — so they never displace a higher-paying booking."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						disabled: locked,
						onClick: () => onDecide(order.id, "approve"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Approve"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => onDecide(order.id, "decline"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), "Decline"]
					}),
					large ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/stay/$token",
						params: { token: order.token },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							children: "Guest page"
						})
					}) : null
				]
			})
		]
	});
}
function RequestsPage() {
	const { pending, paid, book, offers } = Route$13.useLoaderData();
	const router = useRouter();
	const todayStats = (0, import_react.useMemo)(() => {
		const isToday = (iso) => Boolean(iso && new Date(iso).toDateString() === (/* @__PURE__ */ new Date()).toDateString());
		const approvedToday = paid.filter((o) => isToday(o.paidAt));
		return {
			pendingCents: pending.reduce((s, o) => s + o.amountCents, 0),
			approvedToday: approvedToday.length,
			capturedTodayCents: approvedToday.reduce((s, o) => s + o.amountCents, 0)
		};
	}, [pending, paid]);
	async function decide(orderId, decision) {
		try {
			await decideOrder({ data: {
				orderId,
				decision
			} });
			toast.success(decision === "approve" ? "Guest notified. Payment captured. Revenue recorded." : "Request declined. Inventory released.");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not update.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl stagger-in",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-semibold tracking-tight",
				children: "Requests"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-stone",
				children: "Guest requests with approvals and the desk log. Staff see every purchase immediately, and the guest hears back if the house says no. Front-desk sales are logged here too — without them the holdout baseline reads as zero and the lift looks bigger than it is."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Waiting on you",
						value: String(pending.length),
						hint: `${money(todayStats.pendingCents)} in requests`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Approved today",
						value: String(todayStats.approvedToday),
						hint: "decisions captured"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Captured today",
						value: money(todayStats.capturedTodayCents),
						hint: "page and desk"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Pending review"
				}), pending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-2xl border border-line bg-cream px-4 py-8 text-sm text-stone",
					children: "Queue is clear."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 hidden overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line text-left text-xs uppercase tracking-[0.12em] text-stone",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 font-medium",
									children: "Guest"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-3 font-medium",
									children: "Request"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-3 font-medium",
									children: "Stay"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-3 font-medium",
									children: "Platform · booking ID"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-3 font-medium",
									children: "Status"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-5 py-3 text-right font-medium",
									children: "Decision"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-line",
							children: pending.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-3 font-medium",
									children: o.guestName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-3",
									children: [o.offerName, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs tabular-nums text-stone",
										children: money(o.amountCents)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-3 text-stone",
									children: stayRange(o.arrival, o.departure)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-3 text-stone",
									children: [o.platform, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs",
										children: o.bookingRef
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-3",
									children: o.approvableFrom ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										tone: "amber",
										children: ["Opens ", o.approvableFrom]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "amber",
										children: "Pending"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											disabled: Boolean(o.approvableFrom),
											onClick: () => void decide(o.id, "approve"),
											children: "Approve"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => void decide(o.id, "decline"),
											children: "Decline"
										})]
									})
								})
							] }, o.id))
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-3 md:hidden",
					children: pending.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingCard, {
						order: o,
						onDecide: (id, d) => void decide(id, d),
						large: true
					}, o.id))
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskSale, {
				stays: book.reservations.filter((r) => r.status !== "departed"),
				offers,
				onLogged: () => router.invalidate()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 font-display text-xl font-semibold",
				children: "On the books · last 7 days"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]",
				children: [paid.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-5 py-6 text-sm text-stone",
					children: "Nothing paid in the last week."
				}) : null, paid.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-3 px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: order.guestName
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-stone",
							children: [
								order.offerName,
								order.forDate ? ` · ${formatDate(order.forDate)}` : "",
								order.forTime ? ` · ${order.forTime}` : "",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-2 text-xs",
									children: [
										order.platform,
										" · ",
										order.bookingRef
									]
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "quiet",
								children: order.channel === "desk" ? "Desk" : "Stay page"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "good",
								children: order.status === "fulfilled" ? "Fulfilled" : "Paid"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-16 text-right text-sm tabular-nums",
								children: money(order.amountCents)
							})
						]
					})]
				}, order.id))]
			})
		]
	});
}
function Kpi({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-paper px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-xs uppercase tracking-[0.14em] text-stone",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-stone",
				children: hint
			}) : null
		]
	});
}
function DeskSale({ stays, offers, onLogged }) {
	const [stayId, setStayId] = (0, import_react.useState)(stays[0]?.id ?? "");
	const [offerId, setOfferId] = (0, import_react.useState)(offers[0]?.id ?? "");
	const [qty, setQty] = (0, import_react.useState)(() => offers[0] && isNightly(offers[0]) && stays[0] ? stays[0].nights : 1);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const stay = stays.find((s) => s.id === stayId);
	const offer = offers.find((o) => o.id === offerId);
	const amount = (0, import_react.useMemo)(() => stay && offer ? computeAmount(offer, stay, qty) : 0, [
		stay,
		offer,
		qty
	]);
	async function log() {
		if (!stay || !offer) return;
		setBusy(true);
		try {
			const res = await logDeskSale({ data: {
				reservationId: stay.id,
				offerId: offer.id,
				qty
			} });
			toast.success(`Logged ${money(res.amountCents)} desk sale${res.holdout ? " — counts toward the holdout baseline" : ""}.`);
			onLogged();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not log sale.");
		} finally {
			setBusy(false);
		}
	}
	if (stays.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Log a desk sale"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-stone",
				children: "Sold at the desk, by phone or in person — for any guest, holdout included."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 sm:grid-cols-[1.4fr_1.2fr_0.6fr]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-stone",
						children: ["Guest", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: stayId,
							onChange: (e) => {
								setStayId(e.target.value);
								const next = stays.find((x) => x.id === e.target.value);
								setQty(offer && isNightly(offer) && next ? next.nights : 1);
							},
							className: "mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine",
							children: stays.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: s.id,
								children: [
									s.guestName,
									" · ",
									s.roomTypeName,
									s.holdout ? " · holdout" : ""
								]
							}, s.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-stone",
						children: ["Item", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: offerId,
							onChange: (e) => {
								setOfferId(e.target.value);
								const next = offers.find((x) => x.id === e.target.value);
								setQty(next && isNightly(next) && stay ? stay.nights : 1);
							},
							className: "mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 text-sm text-ink outline-none focus:border-pine",
							children: offers.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: o.id,
								disabled: o.inventory === 0,
								children: [
									o.name,
									" · ",
									money(o.priceCents),
									priceHint(o.priceUnit),
									o.inventory === 0 ? " · sold out" : ""
								]
							}, o.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm text-stone",
						children: [offer && isNightly(offer) ? "Nights" : "Qty", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 1,
							max: offer && isNightly(offer) && stay ? stay.nights : 14,
							value: qty,
							onChange: (e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1))),
							className: "mt-1 h-11 w-full rounded-lg border border-line bg-cream px-3 tabular-nums text-ink outline-none focus:border-pine"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void log(),
					disabled: busy || !stay || !offer,
					children: busy ? "Logging…" : `Log ${money(amount)}`
				}), stay?.holdout ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "quiet",
					children: "Holdout guest"
				}) : null]
			})
		]
	});
}
//#endregion
export { RequestsPage as component };
