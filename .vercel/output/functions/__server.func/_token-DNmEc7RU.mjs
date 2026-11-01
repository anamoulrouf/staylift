import { o as __toESM } from "./_runtime.mjs";
import { a as money, c as priceHint, i as formatDateLong, r as formatDate, u as stayRange } from "./_ssr/format-CAsbM_bU.mjs";
import { n as isNightly, t as computeAmount } from "./_ssr/pricing-qOBERzJ7.mjs";
import { n as require_react } from "./_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { A as Coffee, K as ArrowLeft, L as Check, M as Clock3, U as BedDouble, l as Sunrise, u as Sparkles, v as Plane, z as Car } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { J as purchaseOffer, Y as recordStayView, a as Route$5 } from "./_ssr/router-CoWk33e6.mjs";
import { t as Button } from "./_ssr/button-DWJAclyi.mjs";
import { t as Badge } from "./_ssr/badge-C-LEKJr-.mjs";
import { t as CheckinFlow } from "./_ssr/checkin-flow-CE4pgD2n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_token-DNmEc7RU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS = {
	upgrade: BedDouble,
	breakfast: Coffee,
	late_checkout: Clock3,
	early_checkin: Sunrise,
	parking: Car,
	spa: Sparkles,
	transfer: Plane,
	fb: Coffee
};
function GuestStay() {
	const stay = Route$5.useLoaderData();
	const { token } = Route$5.useParams();
	const search = Route$5.useSearch();
	const router = useRouter();
	const reasons = new Map(stay.personalization.picks.map((p) => [p.offerId, p.reason]));
	const pickedOffers = stay.offers.filter((o) => reasons.has(o.id));
	const otherOffers = stay.offers.filter((o) => !reasons.has(o.id));
	const first = stay.reservation.guestName.split(" ")[0] ?? stay.reservation.guestName;
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [qty, setQty] = (0, import_react.useState)(1);
	const [paying, setPaying] = (0, import_react.useState)(false);
	const touch = search.src === "qr" ? void 0 : search.src;
	(0, import_react.useEffect)(() => {
		recordStayView({ data: {
			token,
			source: touch
		} });
	}, [token, touch]);
	(0, import_react.useEffect)(() => {
		if (!search.offer) return;
		const target = stay.offers.find((o) => o.id === search.offer);
		if (target) {
			setPicked(target);
			setQty(isNightly(target) ? stay.reservation.nights : 1);
		}
	}, []);
	const nights = stay.reservation.nights;
	const open = (offer) => {
		setPicked(offer);
		setQty(isNightly(offer) ? nights : 1);
	};
	const defaultQty = (0, import_react.useMemo)(() => picked && isNightly(picked) ? nights : 1, [picked, nights]);
	const amount = picked ? computeAmount(picked, stay.reservation, qty) : 0;
	const upgradeOpens = (() => {
		const t = Date.parse(`${stay.reservation.arrival}T00:00:00Z`) - 2592e5;
		return new Date(t).toISOString().slice(0, 10);
	})();
	async function pay() {
		if (!picked) return;
		setPaying(true);
		try {
			const result = await purchaseOffer({ data: {
				token,
				offerId: picked.id,
				qty,
				source: touch
			} });
			toast.success(result.autoApprove ? "Paid. We’ll have it ready." : result.confirmsFrom ? `Requested. Upgrades are confirmed from ${formatDate(result.confirmsFrom)}; you’re only charged if it’s confirmed.` : "Requested. The house will confirm shortly — you’re only charged if it’s confirmed.");
			setPicked(null);
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not complete.");
		} finally {
			setPaying(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto flex max-w-lg items-center justify-between px-5 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: stay.property.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-stone",
					children: stay.property.city
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-xs text-stone hover:text-ink",
					children: "Staylift"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-lg px-5 pb-24 stagger-in",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-stone",
						children: stay.checkin.returningGuest ? `Welcome back, ${first}` : `Hi ${first}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl font-medium tracking-tight",
						children: "Your stay"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-lg text-ink",
						children: stayRange(stay.reservation.arrival, stay.reservation.departure)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-stone",
						children: [
							stay.reservation.nights,
							" night",
							stay.reservation.nights === 1 ? "" : "s",
							" ·",
							" ",
							stay.reservation.guests,
							" guest",
							stay.reservation.guests === 1 ? "" : "s",
							" ·",
							" ",
							stay.reservation.roomTypeName
						]
					}),
					stay.orders.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs uppercase tracking-[0.16em] text-stone",
							children: "On your stay"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-2",
							children: stay.orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between rounded-lg bg-moss px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-pine" }), order.offerName]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm tabular-nums text-stone",
									children: order.status === "pending_approval" ? "Requested" : money(order.amountCents)
								})]
							}, order.id))
						})]
					}) : null,
					stay.reservation.holdout ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-[0.16em] text-stone",
								children: "Picked for your stay"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 font-display text-2xl font-medium tracking-tight",
								children: stay.personalization.headline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-stone",
								children: "Chosen from your dates, room and party. Nothing is charged until you choose it."
							}),
							stay.offers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone",
								children: "Everything available for this stay is already on the folio."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-5 space-y-3",
								children: pickedOffers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferCard, {
									offer,
									reason: reasons.get(offer.id),
									onOpen: open,
									featured: true
								}) }, offer.id))
							}),
							otherOffers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-8 text-xs uppercase tracking-[0.16em] text-stone",
								children: "More for your stay"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-2",
								children: otherOffers.map((offer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferCard, {
									offer,
									onOpen: open
								}) }, offer.id))
							})] }) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "checkin",
						className: "mt-12 scroll-mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckinFlow, {
							token,
							hotel: stay.property.name,
							guestFirstName: first,
							guests: stay.reservation.guests,
							state: stay.checkin,
							config: stay.capture,
							source: search.src === "qr" ? "qr" : "online"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-10 text-center text-xs text-mist",
						children: [
							"Arranged by ",
							stay.property.name,
							" · Powered by Staylift"
						]
					})
				]
			}),
			picked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-3 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					className: "w-full max-w-md rounded-xl bg-paper p-5 shadow-[var(--shadow-lift)] sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setPicked(null),
							className: "mb-3 inline-flex items-center gap-1 text-sm text-stone",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-2xl font-medium",
							children: picked.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-stone",
							children: picked.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-sm",
							children: [
								formatDateLong(stay.reservation.arrival),
								" –",
								" ",
								formatDateLong(stay.reservation.departure)
							]
						}),
						isNightly(picked) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 block text-sm text-stone",
							children: [picked.category === "breakfast" ? "Mornings" : "Nights", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								max: nights,
								value: qty,
								onChange: (e) => setQty(Math.min(nights, Math.max(1, Math.floor(Number(e.target.value) || defaultQty)))),
								className: "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 tabular-nums outline-none focus:border-pine"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex items-end justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-stone",
								children: "Total"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-3xl tabular-nums",
								children: money(amount)
							})]
						}),
						!picked.autoApprove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "amber",
							className: "mt-3",
							children: picked.category === "upgrade" ? `Confirmed from ${formatDate(upgradeOpens)} · charged only if confirmed` : "The house confirms this one · charged only if confirmed"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-stone",
							children: "Instant · charged to the card on file"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							onClick: () => void pay(),
							disabled: paying,
							children: paying ? "Working…" : picked.autoApprove ? `Pay ${money(amount)}` : `Request ${money(amount)}`
						})
					]
				})
			}) : null
		]
	});
}
function OfferCard({ offer, reason, onOpen, featured }) {
	const Icon = ICONS[offer.category] ?? Sparkles;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onOpen(offer),
		className: featured ? "flex w-full items-stretch gap-4 rounded-xl bg-paper p-4 text-left shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-lift)]" : "flex w-full items-center gap-3 rounded-lg bg-cream/70 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: featured ? "flex size-12 shrink-0 items-center justify-center rounded-md bg-cream text-pine" : "flex size-9 shrink-0 items-center justify-center rounded-md bg-paper text-pine",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: featured ? "size-5" : "size-4",
				strokeWidth: 1.75
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: featured ? "font-display text-lg font-medium leading-tight" : "text-sm font-medium",
					children: offer.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "shrink-0 tabular-nums text-sm",
					children: [money(offer.priceCents), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-stone",
						children: priceHint(offer.priceUnit)
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-sm text-stone",
				children: reason ?? offer.shortLabel
			})]
		})]
	});
}
//#endregion
export { GuestStay as component };
