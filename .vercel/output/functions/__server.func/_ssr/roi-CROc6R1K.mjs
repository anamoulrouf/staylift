import { o as __toESM } from "../_runtime.mjs";
import { d as usd, i as formatDateLong, n as count, s as pctOf } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { lt as updateEconomics, u as Route$10 } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
import { c as clampInputs, d as customPlan, g as measuredEconomics, h as measureLift, o as PLANS, p as encodeState, r as DEFAULT_STATE } from "./roi-url-BGBbatUc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/roi-CROc6R1K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GUARANTEE_DAYS = 90;
function planFrom(e) {
	if (e.planId === "A" || e.planId === "B" || e.planId === "C") return PLANS[e.planId];
	return customPlan(e.perRoomMonthly, e.baseMonthly, e.revSharePct);
}
var EVIDENCE = {
	too_few: {
		label: "Too early",
		tone: "rose",
		body: "Fewer than 50 completed stays in one group. Treat every number below as noise."
	},
	directional: {
		label: "Directional",
		tone: "amber",
		body: "Enough to see the direction, not the size. The interval tightens once the holdout passes ~300 completed stays."
	},
	solid: {
		label: "Solid",
		tone: "pine",
		body: "300+ completed holdout stays. The interval is narrow enough to price on."
	}
};
function MeasuredRoiPage() {
	const m = Route$10.useLoaderData();
	const router = useRouter();
	const e = m.property.economics;
	const plan = planFrom(e);
	const lift = (0, import_react.useMemo)(() => measureLift(m.treatmentRevenue, m.holdoutRevenue), [m]);
	const months = m.daysLive / (365 / 12);
	const econ = measuredEconomics({
		lift,
		pageRevenue: m.pageRevenueCents / 100,
		pageOrders: m.pageOrders,
		rooms: m.property.rooms,
		months,
		plan,
		marginPct: e.marginPct,
		cardPct: e.cardPct,
		cardFixed: e.cardFixedCents / 100
	});
	const evidence = EVIDENCE[lift.evidence];
	const annual = 365 / m.daysLive;
	const projection = encodeState({
		...DEFAULT_STATE,
		plan,
		inputs: clampInputs({
			rooms: m.property.rooms,
			occupancyPct: m.property.occupancyPct,
			avgStayNights: m.property.avgStayNights,
			reachablePct: Math.round(m.rates.reachablePct),
			viewPct: Math.round(m.rates.viewPct),
			buyPct: Math.round(m.rates.buyPct * 2) / 2,
			avgSpend: Math.round(m.rates.avgSpend),
			ordersPerBuyer: Math.round(m.rates.ordersPerBuyer * 10) / 10,
			marginPct: e.marginPct,
			incrementalityPct: Math.round(econ.incrementality * 100),
			cardPct: e.cardPct,
			cardFixed: e.cardFixedCents / 100
		})
	});
	const day = Math.min(m.daysLive, GUARANTEE_DAYS);
	const guaranteeCopy = m.daysLive < GUARANTEE_DAYS ? econ.guarantee.passes ? `On track: day ${day} of ${GUARANTEE_DAYS}.` : `At risk: day ${day} of ${GUARANTEE_DAYS}.` : econ.guarantee.passes ? "Met at day 90 — fees stand." : "Missed at day 90 — fees are waived.";
	const maxBar = Math.max(lift.meanTreatment, lift.meanHoldout, .01);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-stone",
						children: "Measured, not modeled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl",
						children: "What Staylift actually added"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 max-w-2xl text-stone",
						children: [
							"Completed stays since ",
							formatDateLong(e.launchedOn),
							" (",
							m.daysLive,
							" days).",
							" ",
							count(lift.nTreatment),
							" stays saw offers; ",
							count(lift.nHoldout),
							" were a random",
							" ",
							e.holdoutPct,
							"% holdout that got check-in only. The difference is the lift. Desk sales count in both groups."
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/roi",
					search: {
						...projection,
						from: "pilot"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						children: "Project a full year"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-wrap items-start gap-3 rounded-lg bg-paper px-4 py-3 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: evidence.tone,
					children: evidence.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-w-0 flex-1 text-sm text-stone",
					children: evidence.body
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Lift per completed stay",
						value: usd(lift.liftPerBooking, {
							sign: true,
							cents: true
						}),
						hint: `95% interval ${usd(lift.ci95[0], { cents: true })} to ${usd(lift.ci95[1], { cents: true })}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Incremental revenue",
						value: usd(econ.incrementalRevenue),
						hint: `${pctOf(econ.incrementality, 0)} of page sales · range ${usd(econ.incrementalLow)}–${usd(econ.incrementalHigh)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Hotel net after fees",
						value: usd(econ.hotelNet, { sign: true }),
						hint: `range ${usd(econ.netLow, { sign: true })} to ${usd(econ.netHigh, { sign: true })}`,
						emphasis: econ.hotelNet >= 0 ? "good" : "bad"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-medium",
							children: "Revenue per completed stay"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-stone",
							children: "All paid ancillaries — stay page and front desk."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								label: "Saw offers",
								n: lift.nTreatment,
								value: lift.meanTreatment,
								width: lift.meanTreatment / maxBar,
								className: "bg-pine"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								label: "Holdout",
								n: lift.nHoldout,
								value: lift.meanHoldout,
								width: lift.meanHoldout / maxBar,
								className: "bg-mist"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-6 text-sm text-stone",
							children: [
								"Difference ",
								usd(lift.liftPerBooking, {
									sign: true,
									cents: true
								}),
								" ± ",
								usd(1.96 * lift.standardError, { cents: true }),
								" per stay.",
								lift.ci95[0] > 0 ? " The interval stays above zero, so the lift is real; its size is still uncertain." : " The interval crosses zero — not yet distinguishable from no effect."
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl bg-pine p-5 text-pine-fg sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-medium",
							children: "The hotel’s P&L line"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-5 space-y-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Sold through the stay page",
									v: usd(m.pageRevenueCents / 100)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Measured incremental",
									v: usd(econ.incrementalRevenue),
									strong: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: `× ${e.marginPct}% contribution margin`,
									v: usd(econ.incrementalRevenue * (e.marginPct / 100))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: `Staylift fees · ${plan.id === "custom" ? "custom" : `plan ${plan.id}`} · ${months.toFixed(1)} mo`,
									v: `−${usd(econ.platformFees)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: `Card processing ${e.cardPct}%`,
									v: `−${usd(econ.cardFees)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-pine-fg/20" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Net to the hotel",
									v: usd(econ.hotelNet, { sign: true }),
									strong: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
									k: "Annualized",
									v: usd(econ.hotelNet * annual, { sign: true }),
									muted: true
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 rounded-md bg-pine-fg/10 px-3 py-2.5 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-medium",
								children: ["Guarantee · ", guaranteeCopy]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-pine-fg/80",
								children: [
									"Incremental revenue ",
									usd(econ.guarantee.lift),
									" vs 2× fees ",
									usd(econ.guarantee.threshold),
									"."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs text-pine-fg/70",
							children: [
								"Messaging is Staylift’s cost, not yours: ",
								count(m.messagesSent),
								" messages,",
								" ",
								usd(m.messagingCostCents / 100, { cents: true }),
								" so far."
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-medium",
							children: "Measured funnel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-stone",
							children: "Completed stays that saw offers"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rate, {
								label: "Reachable",
								value: pctOf(m.rates.reachablePct / 100, 0),
								note: "of bookings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rate, {
								label: "Opened page",
								value: pctOf(m.rates.viewPct / 100, 0),
								note: "of reachable"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rate, {
								label: "Bought",
								value: pctOf(m.rates.buyPct / 100, 1),
								note: "of viewers"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rate, {
								label: "Spend",
								value: usd(m.rates.avgSpend),
								note: "per buying stay"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rate, {
								label: "Desk sales",
								value: usd(m.deskRevenueCents / 100),
								note: "both groups"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 text-sm text-stone",
						children: [
							"“Project a full year” opens the calculator with these rates and the measured",
							" ",
							pctOf(econ.incrementality, 0),
							" incrementality instead of the 70% planning assumption."
						]
					})
				]
			}),
			m.canEditContract ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EconomicsForm, {
				economics: e,
				onSaved: () => router.invalidate()
			}, JSON.stringify(e)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 rounded-lg border border-line bg-cream px-4 py-3 text-sm text-stone",
				children: "The contract and margin settings are owner-only."
			})
		]
	});
}
function EconomicsForm({ economics, onSaved }) {
	const [planId, setPlanId] = (0, import_react.useState)(economics.planId);
	const [custom, setCustom] = (0, import_react.useState)({
		perRoomMonthly: economics.perRoomMonthly,
		baseMonthly: economics.baseMonthly,
		revSharePct: economics.revSharePct
	});
	const [margin, setMargin] = (0, import_react.useState)(economics.marginPct);
	const [card, setCard] = (0, import_react.useState)(economics.cardPct);
	const [saving, setSaving] = (0, import_react.useState)(false);
	async function save() {
		setSaving(true);
		const p = planId === "custom" ? custom : PLANS[planId];
		try {
			await updateEconomics({ data: {
				planId,
				perRoomMonthly: p.perRoomMonthly,
				baseMonthly: p.baseMonthly,
				revSharePct: p.revSharePct,
				marginPct: margin,
				cardPct: card
			} });
			toast.success("Economics saved. Numbers above are recalculated.");
			onSaved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save.");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-6 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-medium",
				children: "Contract and margin"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-stone",
				children: "The plan this hotel pays and its own margin on add-ons. Everything above uses these."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4",
				role: "radiogroup",
				"aria-label": "Plan",
				children: [
					"A",
					"B",
					"C",
					"custom"
				].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "radio",
					"aria-checked": planId === id,
					onClick: () => setPlanId(id),
					className: cn("rounded-md px-3 py-2.5 text-left text-sm", planId === id ? "bg-pine text-pine-fg" : "bg-cream shadow-[var(--shadow-border)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-medium",
						children: id === "custom" ? "Custom" : `Plan ${id}`
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("block text-xs", planId === id ? "text-pine-fg/80" : "text-stone"),
						children: id === "custom" ? "Negotiated" : PLANS[id].note.split(".")[0]
					})]
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-4 sm:grid-cols-5",
				children: [
					planId === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: "$ / room / month",
							value: custom.perRoomMonthly,
							onChange: (v) => setCustom({
								...custom,
								perRoomMonthly: v
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: "$ base / month",
							value: custom.baseMonthly,
							onChange: (v) => setCustom({
								...custom,
								baseMonthly: v
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
							label: "Revenue share %",
							value: custom.revSharePct,
							onChange: (v) => setCustom({
								...custom,
								revSharePct: v
							})
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Contribution margin %",
						value: margin,
						onChange: setMargin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Card processing %",
						value: card,
						onChange: setCard
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5",
				onClick: () => void save(),
				disabled: saving,
				children: saving ? "Saving…" : "Save"
			})
		]
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm text-stone",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			inputMode: "decimal",
			step: "0.1",
			min: 0,
			value,
			onChange: (e) => onChange(Math.max(0, Number(e.target.value) || 0)),
			className: "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 tabular-nums text-ink outline-none focus:border-pine"
		})]
	});
}
function Tile({ label, value, hint, emphasis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-paper px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-xs uppercase tracking-[0.14em] text-stone",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: cn("mt-2 font-display text-3xl font-medium tabular-nums tracking-tight", emphasis === "bad" && "text-rose"),
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-stone",
				children: hint
			})
		]
	});
}
function Bar({ label, n, value, width, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
			label,
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-stone",
				children: [
					"· ",
					count(n),
					" stays"
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums",
			children: usd(value, { cents: true })
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 h-3 rounded-full bg-cream",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("h-3 rounded-full", className),
			style: { width: `${Math.max(2, width * 100)}%` }
		})
	})] });
}
function Row({ k, v, strong, muted }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: muted ? "text-pine-fg/60" : "text-pine-fg/80",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: cn("tabular-nums", strong && "font-medium", muted && "text-pine-fg/60"),
			children: v
		})]
	});
}
function Rate({ label, value, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs uppercase tracking-[0.14em] text-stone",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-display text-2xl tabular-nums",
			children: value
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-stone",
			children: note
		})
	] });
}
//#endregion
export { MeasuredRoiPage as component };
