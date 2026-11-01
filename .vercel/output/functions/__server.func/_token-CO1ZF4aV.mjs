import { o as __toESM } from "./_runtime.mjs";
import { i as money, l as stayRange, r as formatDateLong, s as priceHint } from "./_ssr/format-BLHOf1yn.mjs";
import { n as require_react } from "./_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, S as useRouter, x as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowLeft, a as Plane, c as Clock3, f as Car, i as Sparkles, m as BedDouble, r as Sunrise, s as Coffee, u as Check } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { h as recordStayView, m as purchaseOffer, n as Route, u as completeCheckin } from "./_ssr/router-ZEuq5NDh.mjs";
import { t as Badge } from "./_ssr/badge-CSy3-CFY.mjs";
import { t as Button } from "./_ssr/button-DWJAclyi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_token-CO1ZF4aV.js
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
	const stay = Route.useLoaderData();
	const { token } = Route.useParams();
	const router = useRouter();
	const first = stay.reservation.guestName.split(" ")[0] ?? stay.reservation.guestName;
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [qty, setQty] = (0, import_react.useState)(1);
	const [paying, setPaying] = (0, import_react.useState)(false);
	const [eta, setEta] = (0, import_react.useState)(stay.checkin.eta ?? "15:00");
	const [capture, setCapture] = (0, import_react.useState)(true);
	const [checkingIn, setCheckingIn] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		recordStayView({ data: { token } });
	}, [token]);
	const nights = stay.reservation.nights;
	const defaultQty = (0, import_react.useMemo)(() => {
		if (!picked) return 1;
		if (picked.priceUnit === "night" || picked.priceUnit === "person_night") return nights;
		return 1;
	}, [picked, nights]);
	const amount = picked ? picked.priceUnit === "night" ? picked.priceCents * Math.min(qty, nights) : picked.priceUnit === "person" ? picked.priceCents * stay.reservation.guests * qty : picked.priceCents * qty : 0;
	async function pay() {
		if (!picked) return;
		setPaying(true);
		try {
			const result = await purchaseOffer({ data: {
				token,
				offerId: picked.id,
				qty
			} });
			toast.success(result.autoApprove ? "Paid. We’ll have it ready." : "Requested. The house will confirm shortly.");
			setPicked(null);
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not complete.");
		} finally {
			setPaying(false);
		}
	}
	async function checkin() {
		setCheckingIn(true);
		try {
			await completeCheckin({ data: {
				token,
				eta,
				captureEmail: capture && stay.reservation.emailKind !== "real"
			} });
			toast.success("Check-in complete.");
			await router.invalidate();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save check-in.");
		} finally {
			setCheckingIn(false);
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-stone",
						children: ["Hi ", first]
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl font-medium tracking-tight",
								children: "Make your stay even better"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-stone",
								children: "A few things the house can arrange before you arrive. Nothing you don’t want."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-5 space-y-3",
								children: [stay.offers.map((offer) => {
									const Icon = ICONS[offer.category] ?? Sparkles;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											setPicked(offer);
											setQty(offer.priceUnit === "night" || offer.priceUnit === "person_night" ? nights : 1);
										},
										className: "flex w-full items-stretch gap-4 rounded-xl bg-paper p-4 text-left shadow-[var(--shadow-border)] transition-shadow duration-150 hover:shadow-[var(--shadow-lift)]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex size-12 shrink-0 items-center justify-center rounded-md bg-cream text-pine",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
												className: "size-5",
												strokeWidth: 1.75
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-display text-lg font-medium leading-tight",
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
												children: offer.shortLabel
											})]
										})]
									}) }, offer.id);
								}), stay.offers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "rounded-lg border border-line bg-cream px-4 py-8 text-sm text-stone",
									children: "Everything available for this stay is already on the folio."
								}) : null]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-12 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-medium",
							children: "Complete your check-in"
						}), stay.checkin.completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 flex items-center gap-2 text-sm text-pine",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }),
								"You’re checked in",
								stay.checkin.eta ? ` · arriving around ${stay.checkin.eta}` : "",
								"."
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mt-4 block text-sm text-stone",
								htmlFor: "eta",
								children: "Estimated arrival"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "eta",
								type: "time",
								value: eta,
								onChange: (e) => setEta(e.target.value),
								className: "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine"
							}),
							stay.reservation.emailKind !== "real" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-4 flex items-start gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: capture,
									onChange: (e) => setCapture(e.target.checked),
									className: "mt-1 size-4 accent-pine"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Send room details to my personal email, not the booking site inbox.", stay.reservation.source !== "Direct" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-1 block text-stone",
									children: [stay.reservation.source, " hides your address. This is how we reach you during the stay."]
								}) : null] })]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-5 w-full",
								onClick: () => void checkin(),
								disabled: checkingIn,
								children: checkingIn ? "Saving…" : "Complete check-in"
							})
						] })]
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
						(picked.priceUnit === "night" || picked.priceUnit === "person_night") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 block text-sm text-stone",
							children: ["Mornings / nights", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1,
								max: nights,
								value: qty,
								onChange: (e) => setQty(Number(e.target.value) || defaultQty),
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
							children: "The house confirms this one"
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
//#endregion
export { GuestStay as component };
