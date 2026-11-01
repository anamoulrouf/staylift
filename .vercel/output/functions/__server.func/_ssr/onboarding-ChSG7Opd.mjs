import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as joinDemoHotel, b as Route$20, k as createHotel } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { i as MARKETS } from "./markets-CIpFMBqe.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-ChSG7Opd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Onboarding() {
	const ctx = Route$20.useLoaderData();
	const router = useRouter();
	const [name, setName] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("");
	const [market, setMarket] = (0, import_react.useState)("US");
	const [rooms, setRooms] = (0, import_react.useState)(40);
	const [starter, setStarter] = (0, import_react.useState)(true);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function create(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await createHotel({ data: {
				name,
				city,
				market,
				rooms,
				starter
			} });
			toast.success(`${name} is ready.`);
			await router.navigate({ to: "/hotel" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not create the hotel.");
		} finally {
			setBusy(false);
		}
	}
	async function demo() {
		setBusy(true);
		try {
			await joinDemoHotel();
			await router.navigate({ to: "/hotel" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not open the demo.");
		} finally {
			setBusy(false);
		}
	}
	if (ctx.kind !== "onboarding") return null;
	const input = "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-linen px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm text-stone hover:text-ink",
						onClick: () => void signOut("/login"),
						children: "Sign out"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-10 font-display text-4xl font-medium tracking-tight",
					children: ["Welcome", ctx.name ? `, ${ctx.name.split(" ")[0]}` : ""]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-stone",
					children: [
						"Signed in as ",
						ctx.email,
						". You're not on a hotel's team yet."
					]
				}),
				ctx.invitations.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6 rounded-xl bg-amber-soft p-5 text-sm text-amber",
					children: ctx.invitations.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						i.propertyName,
						" invited you as ",
						i.role.replace("_", " "),
						". Open the link in your invitation email to join."
					] }, i.propertyName))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid gap-6 md:grid-cols-[1fr_minmax(0,240px)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: (e) => void create(e),
						className: "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)] sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-medium",
								children: "Set up your hotel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-stone",
								children: "You'll be its owner. Invite your team after."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-5 block text-sm text-stone",
								children: ["Hotel name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									required: true,
									minLength: 2,
									value: name,
									onChange: (e) => setName(e.target.value),
									className: input
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid grid-cols-[1fr_110px] gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm text-stone",
									children: ["City", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										required: true,
										minLength: 2,
										value: city,
										onChange: (e) => setCity(e.target.value),
										className: input
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm text-stone",
									children: ["Rooms", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										required: true,
										type: "number",
										min: 1,
										max: 5e3,
										value: rooms,
										onChange: (e) => setRooms(Math.max(1, Number(e.target.value) || 1)),
										className: `${input} tabular-nums`
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "mt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
										className: "text-sm text-stone",
										children: "Launch market"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 grid grid-cols-2 gap-2",
										children: Object.values(MARKETS).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: `cursor-pointer rounded-md border px-3 py-2 text-sm ${market === m.id ? "border-pine bg-moss text-pine" : "border-line bg-cream"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "radio",
												name: "market",
												value: m.id,
												checked: market === m.id,
												onChange: () => setMarket(m.id),
												className: "sr-only"
											}), m.label]
										}, m.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs text-stone",
										children: MARKETS[market].law
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-4 flex items-start gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: starter,
									onChange: (e) => setStarter(e.target.checked),
									className: "mt-0.5 size-4 accent-pine"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Start with a starter catalogue", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-stone",
									children: "Two room types and six common extras you can edit."
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "mt-5 w-full",
								disabled: busy,
								children: busy ? "Creating…" : "Create hotel"
							})
						]
					}), ctx.demoAvailable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "rounded-xl bg-pine p-5 text-pine-fg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-medium",
								children: "Just looking?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-pine-fg/80",
								children: "Open The Marlowe, a demo hotel with a 60-day pilot, guest profiles and the capture gate."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								className: "mt-4 w-full",
								onClick: () => void demo(),
								disabled: busy,
								children: "Explore the demo"
							})
						]
					}) : null]
				})
			]
		})
	});
}
//#endregion
export { Onboarding as component };
