import { o as __toESM } from "../_runtime.mjs";
import { d as usd, n as count, s as pctOf } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as Route$19 } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
import { _ as messageRate, a as MESSAGE_RATES, b as withScenario, d as customPlan, f as decodeState, i as INPUT_BOUNDS, l as computeHotel, m as matchScenario, n as DEFAULT_OPERATOR, o as PLANS, p as encodeState, r as DEFAULT_STATE, s as SCENARIOS, u as computeOperator, v as netCurve, y as pricingRule } from "./roi-url-BGBbatUc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/roi-CNlFBanH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RoiCalculator({ initial, onChange, context, shareable = true }) {
	const [state, setState] = (0, import_react.useState)(initial ?? DEFAULT_STATE);
	const first = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		onChange?.(state);
	}, [state, onChange]);
	const setInputs = (patch) => setState((s) => ({
		...s,
		inputs: {
			...s.inputs,
			...patch
		}
	}));
	const setPlan = (plan) => setState((s) => ({
		...s,
		plan
	}));
	const setOperator = (patch) => setState((s) => ({
		...s,
		operator: {
			...s.operator,
			...patch
		}
	}));
	const setTab = (tab) => setState((s) => ({
		...s,
		tab
	}));
	const hotel = (0, import_react.useMemo)(() => computeHotel(state.inputs, state.plan), [state.inputs, state.plan]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			context,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "tablist",
					"aria-label": "Calculator view",
					className: "inline-flex rounded-lg bg-cream p-1 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
						active: state.tab === "hotel",
						onClick: () => setTab("hotel"),
						children: "Hotel ROI"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
						active: state.tab === "operator",
						onClick: () => setTab("operator"),
						children: "Staylift unit economics"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [shareable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyLink, {}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setState({
							...DEFAULT_STATE,
							tab: state.tab
						}),
						className: "h-9 rounded-sm px-3 text-sm text-stone transition-colors hover:bg-cream hover:text-ink",
						children: "Reset"
					})]
				})]
			}),
			state.tab === "hotel" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotelView, {
				inputs: state.inputs,
				plan: state.plan,
				hotel,
				setInputs,
				setPlan
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OperatorView, {
				hotel,
				plan: state.plan,
				rooms: state.inputs.rooms,
				operator: state.operator,
				setOperator
			})
		]
	});
}
var FIELD_COPY = {
	rooms: {
		label: "Rooms",
		help: "Sellable rooms."
	},
	occupancyPct: {
		label: "Occupancy",
		unit: "%",
		help: "Average over the year."
	},
	avgStayNights: {
		label: "Average stay",
		unit: "nights",
		help: "Length of stay per booking."
	},
	reachablePct: {
		label: "Reachable",
		unit: "% of bookings",
		help: "Have a working channel: OTA relay, real email or a valid phone."
	},
	viewPct: {
		label: "Open the stay page",
		unit: "% of reachable",
		help: "Click the check-in link and see the offers."
	},
	buyPct: {
		label: "Buy something",
		unit: "% of viewers",
		help: "Viewers who pay for at least one offer."
	},
	avgSpend: {
		label: "Spend per buying booking",
		unit: "$",
		help: "Total add-on revenue per booking that buys."
	},
	ordersPerBuyer: {
		label: "Orders per buying booking",
		help: "Only matters for the fixed card fee."
	},
	marginPct: {
		label: "Contribution margin",
		unit: "%",
		help: "What's left of an add-on dollar after the cost to deliver it."
	},
	incrementalityPct: {
		label: "Incrementality",
		unit: "%",
		help: "Share of page sales that would NOT have happened at the desk anyway. Measure it with a holdout."
	},
	cardPct: {
		label: "Card processing",
		unit: "%",
		help: "Blended card cost on page sales."
	},
	cardFixed: {
		label: "Card fee per order",
		unit: "$",
		help: "Fixed per-transaction fee, if any."
	}
};
function HotelView({ inputs, plan, hotel, setInputs, setPlan }) {
	const scenario = matchScenario(inputs);
	const rule = (0, import_react.useMemo)(() => pricingRule(inputs, plan), [inputs, plan]);
	const field = (key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
		id: `roi-${key}`,
		label: FIELD_COPY[key].label,
		unit: FIELD_COPY[key].unit,
		help: FIELD_COPY[key].help,
		value: inputs[key],
		...INPUT_BOUNDS[key],
		onChange: (v) => setInputs({ [key]: v })
	}, key);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Your hotel",
						aside: `≈ ${count(hotel.bookings)} bookings a year`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-x-6 gap-y-5 sm:grid-cols-3",
							children: [
								field("rooms"),
								field("occupancyPct"),
								field("avgStayNights")
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Guest funnel",
						aside: `${pctOf(hotel.conversionOfReachable)} of reachable bookings buy`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-5 flex flex-wrap gap-2",
							role: "group",
							"aria-label": "Scenario",
							children: [Object.keys(SCENARIOS).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: scenario === id,
								onClick: () => setInputs(withScenarioPatch(id)),
								title: SCENARIOS[id].blurb,
								children: SCENARIOS[id].label
							}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("inline-flex h-9 items-center rounded-full px-3 text-xs", scenario ? "text-mist" : "bg-amber-soft text-amber"),
								children: scenario ? SCENARIOS[scenario].blurb : "Your own numbers"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-x-6 gap-y-5 sm:grid-cols-2",
							children: [
								field("reachablePct"),
								field("viewPct"),
								field("buyPct"),
								field("avgSpend")
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Hotel economics",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-x-6 gap-y-5 sm:grid-cols-2",
							children: [
								field("marginPct"),
								field("incrementalityPct"),
								field("cardPct"),
								field("cardFixed"),
								field("ordersPerBuyer")
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Staylift price",
						aside: pctOf(hotel.effectiveTakeRate) + " of upsell revenue, all-in",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanPicker, {
							plan,
							rooms: inputs.rooms,
							setPlan
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id: "roi-result",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
					hotel,
					plan,
					rule
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: "#roi-result",
			className: "fixed inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-lg bg-pine px-4 py-3 text-pine-fg shadow-[var(--shadow-lift)] lg:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs uppercase tracking-[0.14em] text-pine-fg/75",
				children: "Hotel net / year"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-display text-xl tabular-nums",
				children: [usd(hotel.hotelNet, { sign: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 font-sans text-xs text-pine-fg/75",
					children: hotel.totalCost > 0 ? `${Math.round(hotel.roi * 100)}% ROI` : ""
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanComparison, {
			inputs,
			plan,
			setPlan
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SensitivityChart, {
			inputs,
			plan,
			hotel
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Method, {})
	] });
}
function withScenarioPatch(id) {
	const s = SCENARIOS[id];
	return {
		viewPct: s.viewPct,
		buyPct: s.buyPct,
		avgSpend: s.avgSpend
	};
}
function PlanPicker({ plan, rooms, setPlan }) {
	const options = [
		PLANS.A,
		PLANS.B,
		PLANS.C
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
			role: "radiogroup",
			"aria-label": "Pricing plan",
			children: [options.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": plan.id === p.id,
				onClick: () => setPlan(p),
				className: cn("rounded-md px-3 py-2.5 text-left text-sm transition-colors", plan.id === p.id ? "bg-pine text-pine-fg" : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-medium",
					children: p.name.split(" · ")[0]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("block text-xs", plan.id === p.id ? "text-pine-fg/80" : "text-stone"),
					children: planSummary(p)
				})]
			}, p.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "radio",
				"aria-checked": plan.id === "custom",
				onClick: () => setPlan(plan.id === "custom" ? plan : customPlan(plan.perRoomMonthly, plan.baseMonthly, plan.revSharePct)),
				className: cn("rounded-md px-3 py-2.5 text-left text-sm transition-colors", plan.id === "custom" ? "bg-pine text-pine-fg" : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-medium",
					children: "Custom"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("block text-xs", plan.id === "custom" ? "text-pine-fg/80" : "text-stone"),
					children: "Your own mix"
				})]
			})]
		}), plan.id === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-x-6 gap-y-5 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					id: "roi-prr",
					label: "Per room / month",
					unit: "$",
					value: plan.perRoomMonthly,
					min: 0,
					max: 20,
					step: .5,
					onChange: (v) => setPlan(customPlan(v, plan.baseMonthly, plan.revSharePct))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					id: "roi-pbase",
					label: "Base / month",
					unit: "$",
					value: plan.baseMonthly,
					min: 0,
					max: 500,
					step: 5,
					onChange: (v) => setPlan(customPlan(plan.perRoomMonthly, v, plan.revSharePct))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
					id: "roi-pshare",
					label: "Revenue share",
					unit: "%",
					value: plan.revSharePct,
					min: 0,
					max: 30,
					step: .5,
					onChange: (v) => setPlan(customPlan(plan.perRoomMonthly, plan.baseMonthly, v))
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-stone",
			children: [
				plan.note,
				" For ",
				count(rooms),
				" rooms the fixed part is",
				" ",
				usd((plan.perRoomMonthly * rooms + plan.baseMonthly) * 12),
				" a year."
			]
		})]
	});
}
function planSummary(p) {
	const parts = [];
	if (p.perRoomMonthly) parts.push(`$${p.perRoomMonthly}/room/mo`);
	if (p.baseMonthly) parts.push(`$${p.baseMonthly}/mo`);
	if (p.revSharePct) parts.push(`${p.revSharePct}%`);
	return parts.join(" + ") || "Free";
}
function ResultCard({ hotel, plan, rule }) {
	const positive = hotel.hotelNet >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "rounded-xl bg-pine p-5 text-pine-fg sm:p-6 lg:sticky lg:top-6",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.18em] text-pine-fg/70",
				children: "Hotel net gain per year"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-display text-5xl font-medium tabular-nums tracking-tight",
				children: usd(hotel.hotelNet, { sign: true })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-pine-fg/80",
				children: positive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					hotel.roi >= 0 ? `${Math.round(hotel.roi * 100)}% ROI` : "",
					" ·",
					" ",
					usd(hotel.returnPerDollar, { cents: true }),
					" of margin per $1 of fees"
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "Costs more than the margin it creates at these inputs." })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-6 space-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Upsell revenue through the page",
						v: usd(hotel.gross)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Would have sold anyway",
						v: `−${usd(hotel.baselineRevenue)}`,
						muted: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Incremental revenue",
						v: usd(hotel.incrementalRevenue),
						strong: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "× contribution margin",
						v: usd(hotel.incrementalContribution)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: `Staylift fees (${plan.id === "custom" ? "custom" : `plan ${plan.id}`})`,
						v: `−${usd(hotel.platformFees)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Card processing",
						v: `−${usd(hotel.cardFees)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-pine-fg/20" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Net to the hotel",
						v: usd(hotel.hotelNet, { sign: true }),
						strong: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						k: "Per booking",
						v: usd(hotel.netPerBooking, {
							sign: true,
							cents: true
						}),
						muted: true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-6 space-y-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Check, {
						ok: rule.conservativeOk,
						children: [
							"Positive in the conservative case (",
							usd(rule.conservative.hotelNet, { sign: true }),
							")"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Check, {
						ok: rule.baseOk,
						children: [
							"≥ $2 of margin per $1 of fees in the base case (",
							usd(rule.base.returnPerDollar, { cents: true }),
							")"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Check, {
						ok: hotel.guarantee.passes,
						children: [
							"Guarantee: incremental revenue ≥ 2× fees (",
							usd(hotel.guarantee.lift),
							" vs",
							" ",
							usd(hotel.guarantee.threshold),
							")"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 rounded-md bg-pine-fg/10 px-3 py-2.5 text-xs leading-relaxed text-pine-fg/85",
				children: hotel.breakEven ? hotel.breakEven.buyers <= .5 ? "Breaks even from the first sale: there is no fixed fee to cover." : `Breaks even at ${count(hotel.breakEven.buyers)} buying bookings a year — ${pctOf(hotel.breakEven.conversionOfReachable)} of reachable bookings (${pctOf(hotel.breakEven.buyPct / 100)} of viewers).` : "Never breaks even: each sale costs more in fees than the incremental margin it adds."
			})
		]
	});
}
function Line({ k, v, strong, muted }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: cn(muted ? "text-pine-fg/60" : "text-pine-fg/80"),
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: cn("tabular-nums", strong && "font-medium", muted && "text-pine-fg/60"),
			children: v
		})]
	});
}
function Check({ ok, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": "true",
			className: cn("mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", ok ? "bg-pine-fg text-pine" : "bg-rose-soft text-rose"),
			children: ok ? "✓" : "!"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-pine-fg/90",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: ok ? "Passes: " : "Fails: "
			}), children]
		})]
	});
}
function PlanComparison({ inputs, plan, setPlan }) {
	const plans = plan.id === "custom" ? [
		PLANS.A,
		PLANS.B,
		PLANS.C,
		plan
	] : [
		PLANS.A,
		PLANS.B,
		PLANS.C
	];
	const scenarios = Object.keys(SCENARIOS);
	const rows = plans.map((p) => ({
		plan: p,
		cells: scenarios.map((s) => computeHotel(withScenario(inputs, s), p)),
		rule: pricingRule(inputs, p)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Every plan, every scenario",
		aside: "Hotel net per year · your hotel, your economics",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[560px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-xs uppercase tracking-[0.12em] text-stone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pr-3 font-medium",
								children: "Plan"
							}),
							scenarios.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right font-medium",
								children: SCENARIOS[s].label
							}, s)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 pl-3 text-right font-medium",
								children: "Pricing rule"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map(({ plan: p, cells, rule }) => {
					const selected = p.id === plan.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: cn("border-b border-line last:border-0", selected && "bg-moss/60"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pr-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPlan(p),
									className: "text-left hover:underline",
									"aria-pressed": selected,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: p.id === "custom" ? "Custom" : `Plan ${p.id}`
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs text-stone",
										children: planSummary(p)
									})]
								})
							}),
							cells.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-3 text-right tabular-nums",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn(c.hotelNet < 0 ? "text-rose" : "text-ink"),
									children: usd(c.hotelNet, { sign: true })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-xs text-stone",
									children: c.totalCost > 0 ? `${Math.round(c.roi * 100)}% ROI` : "—"
								})]
							}, scenarios[i])),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 pl-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", rule.passes ? "bg-moss text-pine" : "bg-rose-soft text-rose"),
									children: rule.passes ? "Passes" : !rule.conservativeOk ? "Loses money (cons.)" : "< 2:1 (base)"
								})
							})
						]
					}, p.id);
				}) })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-xs text-stone",
			children: "Rule: the hotel must net a positive return in the conservative case and get at least $2 of incremental margin per $1 of fees in the base case. Scenarios change only the funnel (open, buy, spend); hotel size and economics stay yours."
		})]
	});
}
var SERIES = [
	{
		id: "A",
		color: "var(--series-a)"
	},
	{
		id: "B",
		color: "var(--series-b)",
		dash: "6 4"
	},
	{
		id: "C",
		color: "var(--series-c)",
		dash: "2 3"
	},
	{
		id: "custom",
		color: "var(--color-ink)",
		dash: "10 3 2 3"
	}
];
function useWidth() {
	const ref = (0, import_react.useRef)(null);
	const [width, setWidth] = (0, import_react.useState)(640);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width;
			if (w) setWidth(Math.round(w));
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return {
		ref,
		width
	};
}
function niceStep(range, target) {
	const raw = range / Math.max(1, target);
	const pow = 10 ** Math.floor(Math.log10(raw));
	const m = raw / pow;
	return (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * pow;
}
function SensitivityChart({ inputs, plan, hotel }) {
	const { ref, width } = useWidth();
	const [hover, setHover] = (0, import_react.useState)(null);
	const [asTable, setAsTable] = (0, import_react.useState)(false);
	const maxConv = Math.max(.15, Math.ceil(hotel.conversionOfReachable * 1.6 / .05) * .05);
	const lines = (plan.id === "custom" ? [
		PLANS.A,
		PLANS.B,
		PLANS.C,
		plan
	] : [
		PLANS.A,
		PLANS.B,
		PLANS.C
	]).map((p) => ({
		plan: p,
		style: SERIES.find((s) => s.id === p.id) ?? SERIES[0],
		points: netCurve(inputs, p, maxConv, 60)
	}));
	const all = lines.flatMap((l) => l.points.map((pt) => pt.net));
	const yMinRaw = Math.min(0, ...all);
	const yMaxRaw = Math.max(0, ...all);
	const step = niceStep(yMaxRaw - yMinRaw || 1, 5);
	const yMin = Math.floor(yMinRaw / step) * step;
	const yMax = Math.ceil(yMaxRaw / step) * step;
	const height = width < 480 ? 240 : 300;
	const pad = {
		l: width < 480 ? 48 : 60,
		r: width < 480 ? 54 : 74,
		t: 16,
		b: 36
	};
	const iw = Math.max(10, width - pad.l - pad.r);
	const ih = height - pad.t - pad.b;
	const x = (c) => pad.l + c / maxConv * iw;
	const y = (v) => pad.t + (yMax - v) / (yMax - yMin || 1) * ih;
	const yTicks = [];
	for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(v);
	const xStep = maxConv > .2 ? .05 : .025;
	const xTicks = [];
	for (let c = 0; c <= maxConv + 1e-9; c += xStep) xTicks.push(c);
	const hoverIdx = hover === null ? null : Math.round(hover / maxConv * 60);
	const current = hotel.conversionOfReachable;
	const labels = lines.map((l) => ({
		id: l.plan.id,
		color: l.style.color,
		y: y(l.points[l.points.length - 1].net)
	})).sort((a, b) => a.y - b.y);
	for (let i = 1; i < labels.length; i += 1) if (labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Where each plan breaks even",
		aside: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setAsTable((t) => !t),
			className: "text-xs text-stone underline-offset-2 hover:text-ink hover:underline",
			children: asTable ? "Show chart" : "Show as table"
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "-mt-2 mb-4 text-sm text-stone",
				children: "Hotel net per year as conversion (buyers ÷ reachable bookings) changes. Everything else stays at your inputs. The vertical line is where you are now."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone",
				"aria-hidden": asTable,
				children: lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							width: "24",
							height: "8",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: "0",
								y1: "4",
								x2: "24",
								y2: "4",
								stroke: l.style.color,
								strokeWidth: "2",
								strokeDasharray: l.style.dash
							})
						}),
						l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`,
						" · ",
						planSummary(l.plan)
					]
				}, l.plan.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref,
				children: asTable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[420px] text-right text-sm tabular-nums",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs uppercase tracking-[0.12em] text-stone",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-left font-medium",
									children: "Conversion"
								}), lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 font-medium",
									children: l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`
								}, l.plan.id))]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lines[0].points.map((pt, i) => ({
							pt,
							i
						})).filter(({ i }) => i % 4 === 0).map(({ pt, i }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line last:border-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-1.5 text-left",
								children: pctOf(pt.conversion)
							}), lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: cn("py-1.5", l.points[i].net < 0 && "text-rose"),
								children: usd(l.points[i].net, { sign: true })
							}, l.plan.id))]
						}, i)) })]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						width,
						height,
						role: "img",
						"aria-label": `Hotel net per year against conversion for ${lines.length} plans. You are at ${pctOf(current)} conversion, netting ${usd(hotel.hotelNet, { sign: true })} on the selected plan.`,
						onPointerMove: (e) => {
							const box = e.currentTarget.getBoundingClientRect();
							const c = (e.clientX - box.left - pad.l) / iw * maxConv;
							setHover(c < 0 || c > maxConv ? null : c);
						},
						onPointerLeave: () => setHover(null),
						className: "block touch-pan-y",
						children: [
							yTicks.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: pad.l,
								x2: pad.l + iw,
								y1: y(v),
								y2: y(v),
								stroke: v === 0 ? "var(--color-stone)" : "var(--color-line)",
								strokeWidth: v === 0 ? 1.25 : 1
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
								x: pad.l - 8,
								y: y(v),
								dy: "0.32em",
								textAnchor: "end",
								fontSize: "11",
								fill: "var(--color-stone)",
								children: usd(v, {
									compact: true,
									sign: v > 0
								})
							})] }, v)),
							xTicks.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
								x: x(c),
								y: height - pad.b + 18,
								textAnchor: "middle",
								fontSize: "11",
								fill: "var(--color-stone)",
								children: [(c * 100).toFixed(c * 100 % 1 === 0 ? 0 : 1), "%"]
							}, c)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: x(Math.min(current, maxConv)),
								x2: x(Math.min(current, maxConv)),
								y1: pad.t,
								y2: pad.t + ih,
								stroke: "var(--color-ink)",
								strokeOpacity: "0.35",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
								x: x(Math.min(current, maxConv)) + 6,
								y: pad.t + 10,
								fontSize: "11",
								fill: "var(--color-stone)",
								children: ["you · ", pctOf(current)]
							}),
							lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: l.points.map((pt, i) => `${i ? "L" : "M"}${x(pt.conversion).toFixed(1)},${y(pt.net).toFixed(1)}`).join(""),
								fill: "none",
								stroke: l.style.color,
								strokeWidth: l.plan.id === plan.id ? 2.5 : 2,
								strokeDasharray: l.style.dash,
								strokeLinejoin: "round"
							}, l.plan.id)),
							lines.map((l) => {
								const be = computeHotel(inputs, l.plan).breakEven;
								if (!be || be.conversionOfReachable > maxConv) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: x(be.conversionOfReachable),
									cy: y(0),
									r: 4.5,
									fill: l.style.color,
									stroke: "var(--color-paper)",
									strokeWidth: "2"
								}, `be-${l.plan.id}`);
							}),
							labels.map((lab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
								x: pad.l + iw + 8,
								y: lab.y,
								dy: "0.32em",
								fontSize: "11",
								fontWeight: "600",
								fill: "var(--color-ink)",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tspan", {
										fill: lab.color,
										children: "■"
									}),
									" ",
									lab.id === "custom" ? "Custom" : lab.id
								]
							}, lab.id)),
							hoverIdx !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								pointerEvents: "none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: x(lines[0].points[hoverIdx].conversion),
									x2: x(lines[0].points[hoverIdx].conversion),
									y1: pad.t,
									y2: pad.t + ih,
									stroke: "var(--color-ink)",
									strokeOpacity: "0.5"
								}), lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: x(l.points[hoverIdx].conversion),
									cy: y(l.points[hoverIdx].net),
									r: 4,
									fill: l.style.color,
									stroke: "var(--color-paper)",
									strokeWidth: "2"
								}, l.plan.id))]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
								x: pad.l,
								y: height - 4,
								fontSize: "11",
								fill: "var(--color-stone)",
								children: "Conversion of reachable bookings"
							})
						]
					}), hoverIdx !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute top-4 z-10 rounded-md bg-paper px-3 py-2 text-xs shadow-[var(--shadow-lift)]",
						style: { left: Math.min(Math.max(0, x(lines[0].points[hoverIdx].conversion) + 12), Math.max(0, width - 170)) },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-1 font-medium text-ink",
							children: [pctOf(lines[0].points[hoverIdx].conversion), " conversion"]
						}), lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center justify-between gap-4 text-stone",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block size-2 rounded-full",
									style: { background: l.style.color }
								}), l.plan.id === "custom" ? "Custom" : `Plan ${l.plan.id}`]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-ink",
								children: usd(l.points[hoverIdx].net, { sign: true })
							})]
						}, l.plan.id))]
					}) : null]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-stone",
				children: "Dots mark each plan’s break-even conversion."
			})
		]
	});
}
function OperatorView({ hotel, plan, rooms, operator, setOperator }) {
	const op = computeOperator(hotel, operator);
	const rate = messageRate(operator);
	const markets = Object.keys(MESSAGE_RATES);
	const warnings = [];
	if (op.grossMargin < .7) warnings.push("Gross margin under 70% — messaging or support is eating the fee.");
	if (op.cacPaybackMonths === null || op.cacPaybackMonths > 12) warnings.push("CAC payback over 12 months — self-serve and partner channels only.");
	if (op.ltvToCac < 3) warnings.push("LTV:CAC under 3 — this hotel size doesn’t fund paid acquisition.");
	if (operator.messagesPerBooking > 2) warnings.push("More than 2 template messages per booking breaks the lean design.");
	if (operator.category === "marketing") warnings.push("Marketing templates cost several times utility — and OTA terms bar unsolicited marketing.");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "max-w-3xl text-sm text-stone",
			children: [
				"Staylift’s side of the same hotel: ",
				count(rooms),
				" rooms on",
				" ",
				plan.id === "custom" ? "a custom plan" : `plan ${plan.id}`,
				" (",
				planSummary(plan),
				"), using the funnel from the Hotel ROI tab. Messaging is Staylift’s cost, not the hotel’s."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Messaging",
					aside: `$${(rate.rate + operator.bspPerMessage).toFixed(4)} per message, all-in`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-x-6 gap-y-5 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								htmlFor: "roi-market",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-ink",
										children: "Market"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										id: "roi-market",
										value: operator.market,
										onChange: (e) => setOperator({ market: e.target.value }),
										className: "mt-2 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine",
										children: markets.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: m,
											children: MESSAGE_RATES[m].label
										}, m))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1.5 block text-xs text-stone",
										children: "Recipient country sets Meta’s rate."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-ink",
									children: "Template category"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex gap-2",
									role: "radiogroup",
									"aria-label": "Template category",
									children: ["utility", "marketing"].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										active: operator.category === c,
										onClick: () => setOperator({ category: c }),
										children: c === "utility" ? "Utility" : "Marketing"
									}, c))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1.5 block text-xs text-stone",
									children: "Service content (check-in link, arrival details) is utility."
								})
							] }),
							!rate.verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-rate",
								label: "Rate per message",
								unit: "$",
								help: "No verified Meta rate for this market and category — enter yours.",
								value: operator.customRate,
								min: 0,
								max: .5,
								step: .001,
								onChange: (v) => setOperator({ customRate: v })
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-ink",
										children: "Meta rate"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 font-display text-2xl tabular-nums",
										children: ["$", rate.rate.toFixed(4)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block text-xs text-stone",
										children: "per delivered message, 2026 rate card"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-bsp",
								label: "Provider fee per message",
								unit: "$",
								help: "BSP / Twilio-style markup on top of Meta.",
								value: operator.bspPerMessage,
								min: 0,
								max: .05,
								step: .001,
								onChange: (v) => setOperator({ bspPerMessage: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-phone",
								label: "Reached by phone",
								unit: "% of reachable",
								help: "The rest get email (≈ free).",
								value: operator.phoneSharePct,
								min: 0,
								max: 100,
								step: 1,
								onChange: (v) => setOperator({ phoneSharePct: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-msgs",
								label: "Template messages per booking",
								help: "Lean design: ≤ 2 (check-in link, arrival details).",
								value: operator.messagesPerBooking,
								min: 0,
								max: 6,
								step: .1,
								onChange: (v) => setOperator({ messagesPerBooking: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-replies",
								label: "Staff replies per booking",
								help: "Billed at the utility rate from 1 Oct 2026.",
								value: operator.repliesPerBooking,
								min: 0,
								max: 5,
								step: .1,
								onChange: (v) => setOperator({ repliesPerBooking: v })
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Customer economics",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-x-6 gap-y-5 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-support",
								label: "Support & infra per hotel",
								unit: "$ / year",
								value: operator.supportPerHotelYear,
								min: 0,
								max: 5e3,
								step: 10,
								onChange: (v) => setOperator({ supportPerHotelYear: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-churn",
								label: "Churn",
								unit: "% / month",
								value: operator.churnMonthlyPct,
								min: 0,
								max: 20,
								step: .1,
								onChange: (v) => setOperator({ churnMonthlyPct: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-cac",
								label: "Blended CAC",
								unit: "$",
								help: "Target ≤ $750 after the first 20 hotels.",
								value: operator.cac,
								min: 0,
								max: 2e4,
								step: 50,
								onChange: (v) => setOperator({ cac: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
								id: "roi-hotels",
								label: "Hotels like this one",
								value: operator.hotels,
								min: 1,
								max: 1e4,
								step: 1,
								onChange: (v) => setOperator({ hotels: v })
							})
						]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6 lg:sticky lg:top-6",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-stone",
						children: "Gross margin per hotel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-display text-5xl font-medium tabular-nums tracking-tight",
						children: pctOf(op.grossMargin, 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-stone",
						children: [
							usd(op.grossProfit),
							" gross profit on ",
							usd(op.vendorRevenue),
							" revenue a year"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-6 space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "Staylift revenue (fees)",
								v: usd(op.vendorRevenue)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: `Messaging · ${count(op.templateMessages + op.replyMessages)} msgs`,
								v: `−${usd(op.messagingCost)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "Support & infra",
								v: `−${usd(op.supportCost)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "Messaging per booking",
								v: usd(op.messagingPerBooking, { cents: true }),
								muted: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-line" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "LTV (gross profit)",
								v: usd(op.ltv),
								strong: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "CAC payback",
								v: op.cacPaybackMonths === null ? "never" : `${op.cacPaybackMonths.toFixed(1)} months`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "LTV : CAC",
								v: `${op.ltvToCac.toFixed(1)}×`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-line" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: `ARR at ${count(operator.hotels)} hotels`,
								v: usd(op.portfolioArr, { compact: true }),
								strong: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpLine, {
								k: "Gross profit at that scale",
								v: usd(op.portfolioGrossProfit, { compact: true })
							})
						]
					}),
					warnings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-5 space-y-2",
						children: warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-md bg-amber-soft px-3 py-2 text-xs text-amber",
							children: w
						}, w))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 rounded-md bg-moss px-3 py-2 text-xs text-pine",
						children: "Healthy: ≥ 70% margin, payback ≤ 12 months, LTV:CAC ≥ 3."
					}),
					!op.rateVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-stone",
						children: "Uses your custom rate — no verified Meta figure for this combination."
					}) : null
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketTable, {
			hotel,
			operator
		})
	] });
}
function OpLine({ k, v, strong, muted }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: cn(muted ? "text-mist" : "text-stone"),
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: cn("tabular-nums text-ink", strong && "font-medium", muted && "text-stone"),
			children: v
		})]
	});
}
function MarketTable({ hotel, operator }) {
	const markets = Object.keys(MESSAGE_RATES);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Messaging cost by market",
		aside: "Per hotel per year, at your message volume",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[520px] text-right text-sm tabular-nums",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-xs uppercase tracking-[0.12em] text-stone",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 text-left font-medium",
								children: "Market"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Utility rate"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Marketing rate"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Lean (utility)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2 font-medium",
								children: "Gross margin"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: markets.map((m) => {
					const r = MESSAGE_RATES[m];
					const op = r.utility === null ? null : computeOperator(hotel, {
						...operator,
						market: m,
						category: "utility"
					});
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: cn("border-b border-line last:border-0", m === operator.market && "bg-moss/60"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-left",
								children: r.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5",
								children: r.utility === null ? "not verified" : `$${r.utility.toFixed(4)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5",
								children: r.marketing === null ? "not verified" : `$${r.marketing.toFixed(4)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5",
								children: op ? usd(op.messagingCost) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5",
								children: op ? pctOf(op.grossMargin, 0) : "—"
							})
						]
					}, m);
				}) })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-xs text-stone",
			children: [
				"Meta per-message rates as published for 2026; Meta revises rate cards quarterly, so re-check before quoting. Provider fee: $",
				(operator.bspPerMessage || DEFAULT_OPERATOR.bspPerMessage).toFixed(3),
				" per message."
			]
		})]
	});
}
function Method() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "group rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
			className: "cursor-pointer list-none font-display text-xl font-medium",
			children: ["How this is calculated", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-2 text-sm font-normal text-stone group-open:hidden",
				children: "show"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-6 text-sm text-stone md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "list-decimal space-y-2 pl-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Bookings = rooms × occupancy × 365 ÷ average stay. The booking is the unit, not the room-night." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Buyers = bookings × reachable × open the page × buy." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Upsell revenue = buyers × spend per buying booking." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Incremental revenue = upsell revenue × incrementality. The rest would have been sold at the desk or on the phone anyway. In a pilot this comes from a holdout group, not a guess." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Hotel net = incremental revenue × contribution margin − Staylift fees − card processing." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "ROI = hotel net ÷ (fees + card processing). Return per $1 = incremental margin ÷ the same costs." })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink",
						children: "Deliberately conservative:"
					}), " the revenue share and card fees are charged on all page revenue, including the part that isn’t incremental."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink",
						children: "Not a benchmark:"
					}), " scenario rates are planning assumptions. Vendor case studies (10×, 41× ROI) are not used anywhere."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-ink",
						children: "Guarantee:"
					}), " if holdout-measured incremental revenue is under 2× the fees after 90 days, the fees are waived."] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: "Messaging rates:"
						}),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "underline",
							href: "https://setsmart.io/blog/whatsapp-business-api-pricing",
							target: "_blank",
							rel: "noreferrer",
							children: "US"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "underline",
							href: "https://boosend.ai/blog/whatsapp-business-api-pricing-2026",
							target: "_blank",
							rel: "noreferrer",
							children: "UK"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "underline",
							href: "https://zernio.com/blog/whatsapp-business-api-pricing",
							target: "_blank",
							rel: "noreferrer",
							children: "DE / NL ranges"
						}),
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "underline",
							href: "https://support.zendesk.com/hc/en-us/articles/11113277351322-Announcing-upcoming-changes-to-WhatsApp-Business-messaging-pricing",
							target: "_blank",
							rel: "noreferrer",
							children: "1 Oct 2026 change"
						}),
						"."
					] })
				]
			})]
		})]
	});
}
function Panel({ title, aside, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-xl font-medium",
				children: title
			}), aside ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-stone",
				children: aside
			}) : null]
		}), children]
	});
}
function TabButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "tab",
		"aria-selected": active,
		onClick,
		className: cn("h-9 rounded-md px-3 text-sm font-medium transition-colors sm:px-4", active ? "bg-paper text-ink shadow-[var(--shadow-border)]" : "text-stone hover:text-ink"),
		children
	});
}
function Chip({ active, onClick, children, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		title,
		onClick,
		className: cn("h-9 rounded-full px-4 text-sm transition-colors", active ? "bg-pine text-pine-fg" : "bg-cream text-ink shadow-[var(--shadow-border)] hover:bg-paper"),
		children
	});
}
function decimalsFor(step) {
	return step < 1 ? String(step).split(".")[1]?.length ?? 2 : 0;
}
function NumberField({ id, label, unit, help, value, min, max, step, onChange }) {
	const decimals = decimalsFor(step);
	const [draft, setDraft] = (0, import_react.useState)(null);
	const commit = (raw) => {
		const n = Number(raw);
		setDraft(null);
		if (raw.trim() === "" || !Number.isFinite(n)) return;
		onChange(Number(Math.min(max, Math.max(min, n)).toFixed(decimals)));
	};
	const sliderMax = id === "roi-rooms" ? Math.max(200, value) : max;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				htmlFor: id,
				className: "text-sm text-ink",
				children: [label, unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1 text-xs text-stone",
					children: unit
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id,
				inputMode: "decimal",
				value: draft ?? String(Number(value.toFixed(decimals))),
				onChange: (e) => setDraft(e.target.value),
				onBlur: (e) => commit(e.target.value),
				onKeyDown: (e) => {
					if (e.key === "Enter") commit(e.target.value);
				},
				className: "h-9 w-24 rounded-sm border border-line bg-cream px-2 text-right text-sm tabular-nums outline-none focus:border-pine"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			"aria-label": `${label} slider`,
			min,
			max: sliderMax,
			step,
			value: Math.min(value, sliderMax),
			onChange: (e) => onChange(Number(Number(e.target.value).toFixed(decimals))),
			className: "mt-1 h-8 w-full accent-pine"
		}),
		help ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs leading-snug text-stone",
			children: help
		}) : null
	] });
}
function CopyLink() {
	const [state, setState] = (0, import_react.useState)("idle");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: async () => {
			try {
				await navigator.clipboard.writeText(window.location.href);
				setState("copied");
			} catch {
				setState("failed");
			}
			setTimeout(() => setState("idle"), 2200);
		},
		className: "h-9 rounded-sm bg-paper px-3 text-sm text-ink shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]",
		children: state === "copied" ? "Link copied" : state === "failed" ? "Copy from the address bar" : "Copy share link"
	});
}
/**
* The /roi page body. Framework-free (no router imports) so the same page can
* be rendered by the app route and by a standalone build.
*/
function RoiPage({ initial, onChange, nav, context, shareable = true }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-linen text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), nav]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-20",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "pb-8 pt-4 sm:pt-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-[0.2em] text-stone",
							children: "ROI calculator"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl",
							children: "What Staylift is worth to your hotel, after fees."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 max-w-2xl text-stone sm:text-lg",
							children: [
								"Net of what you would have sold at the desk anyway, net of card fees, net of our price. Change any number",
								shareable ? "; the link updates so you can send this exact model to your GM or owner" : "",
								"."
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoiCalculator, {
					initial,
					onChange,
					context,
					shareable
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-10 text-xs text-stone",
					children: "Planning model, not a promise. In a pilot, 15–20% of bookings form a holdout that gets check-in but no offers; the difference between the two groups replaces the incrementality assumption with a measured number."
				})
			]
		})]
	});
}
function RoiRoute() {
	const search = Route$19.useSearch();
	const navigate = useNavigate();
	const [initial] = (0, import_react.useState)(() => decodeState(search));
	const fromPilot = (0, import_react.useRef)(search.from === "pilot").current;
	const timer = (0, import_react.useRef)(void 0);
	const onChange = (0, import_react.useMemo)(() => (state) => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			navigate({
				to: "/roi",
				search: encodeState(state),
				replace: true,
				resetScroll: false
			});
		}, 250);
	}, [navigate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoiPage, {
		initial,
		onChange,
		nav: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hotel/roi",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					children: "Measured ROI"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "secondary",
					children: "Product"
				})
			})]
		}),
		context: fromPilot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-lg bg-moss px-4 py-3 text-sm text-pine",
			children: "Seeded from The Marlowe’s measured pilot: reachable, open, buy, spend and incrementality are the holdout-tested numbers, projected over a full year. The scenario chips replace them with planning assumptions."
		}) : void 0
	});
}
//#endregion
export { RoiRoute as component };
