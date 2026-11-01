import { o as __toESM } from "../_runtime.mjs";
import { a as money, i as formatDateLong, r as formatDate } from "./format-CAsbM_bU.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, S as useNavigate, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as Eye, O as Download, T as GitMerge, s as Trash2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as mergeGuests, N as exportGuest, Q as revealGuestContact, T as addGuestOccasion, ft as withdrawGuestConsent, j as eraseGuest, n as Route } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/guests._profileId-B0R5avRx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
var PURPOSE = {
	marketing_email: "Offers by email",
	marketing_whatsapp: "Offers on WhatsApp",
	profile_memory: "Remember dates & preferences"
};
var SOURCE = {
	online_checkin: "online check-in",
	desk_tablet: "desk tablet",
	qr: "QR check-in",
	preference_centre: "guest's preference page",
	staff: "staff",
	erasure: "erasure"
};
function GuestPage() {
	const g = Route.useLoaderData();
	const router = useRouter();
	const navigate = useNavigate();
	const [revealed, setRevealed] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [confirmErase, setConfirmErase] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)(null);
	const [mergeTarget, setMergeTarget] = (0, import_react.useState)(null);
	const [occ, setOcc] = (0, import_react.useState)({
		kind: "birthday",
		month: 0,
		day: 0
	});
	async function act(fn, ok) {
		setBusy(true);
		try {
			const r = await fn();
			if (ok) toast.success(ok);
			return r;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not do that.");
			return;
		} finally {
			setBusy(false);
		}
	}
	async function reveal() {
		if (!reason || reason.trim().length < 3) return;
		const r = await act(() => revealGuestContact({ data: {
			profileId: g.id,
			reason
		} }));
		if (r) {
			setRevealed(r);
			setReason(null);
		}
	}
	async function download() {
		const data = await act(() => exportGuest({ data: { profileId: g.id } }), "Export ready. Logged.");
		if (!data) return;
		const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `guest-${g.id}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
	const card = "rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/hotel/guests",
				className: "text-sm text-stone hover:text-ink",
				children: "← Guests"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl font-medium tracking-tight",
					children: g.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-stone",
					children: [
						g.stays.length,
						" stay",
						g.stays.length === 1 ? "" : "s",
						" · profile since ",
						formatDate(g.createdAt)
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [g.caps.dataRequests ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						onClick: () => void download(),
						disabled: busy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Export data"]
					}) : null, g.caps.dataRequests ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => setConfirmErase(true),
						disabled: busy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Erase"]
					}) : null]
				})]
			}),
			confirmErase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 rounded-xl border border-rose-soft bg-paper p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-medium text-rose",
						children: [
							"Erase ",
							g.name,
							"?"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-stone",
						children: [
							"Deletes contacts, dates, companions and holidays; takes the name off ",
							g.stays.length,
							" stay(s); keeps the consent history and a hashed suppression marker. Can't be undone."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							size: "sm",
							disabled: busy,
							onClick: () => void act(() => eraseGuest({ data: { profileId: g.id } }), "Guest erased.").then((r) => {
								if (r) navigate({ to: "/hotel/guests" });
							}),
							children: "Erase permanently"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => setConfirmErase(false),
							children: "Cancel"
						})]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl font-medium",
										children: "Contact"
									}), g.caps.reveal && !revealed && reason === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => setReason(""),
										disabled: busy,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }), " Reveal"]
									}) : null]
								}),
								reason !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "mt-3 flex gap-2",
									onSubmit: (e) => {
										e.preventDefault();
										reveal();
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											autoFocus: true,
											"aria-label": "Reason",
											placeholder: "Why? e.g. guest asked for a receipt copy",
											value: reason,
											onChange: (e) => setReason(e.target.value),
											className: "h-9 flex-1 rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											type: "submit",
											disabled: busy || reason.trim().length < 3,
											children: "Reveal"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "ghost",
											type: "button",
											onClick: () => setReason(null),
											children: "Cancel"
										})
									]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-3 space-y-1.5 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "w-20 shrink-0 text-stone",
											children: "Email"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono",
											children: revealed ? revealed.email ?? "—" : g.email ?? "—"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
											className: "w-20 shrink-0 text-stone",
											children: "WhatsApp"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
											className: "font-mono",
											children: revealed ? revealed.phone ?? "—" : g.phone ?? "—"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-stone",
									children: "Verified by code at check-in. Stored encrypted; reveals are logged."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-medium",
									children: "Consent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-2",
									children: Object.keys(PURPOSE).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-3 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: PURPOSE[p] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: g.consents[p] ? "pine" : "quiet",
												children: g.consents[p] ? "Yes" : "No"
											}), g.consents[p] && g.caps.dataRequests ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "text-xs text-stone underline hover:text-rose",
												disabled: busy,
												onClick: () => void act(() => withdrawGuestConsent({ data: {
													profileId: g.id,
													purpose: p
												} }), "Withdrawal recorded.").then(() => router.invalidate()),
												children: "Record withdrawal"
											}) : null]
										})]
									}, p))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-stone",
									children: "Only the guest can opt in. Staff can record a withdrawal the guest asked for."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									className: "mt-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
										className: "cursor-pointer text-sm text-stone",
										children: [
											"History (",
											g.ledger.length,
											")"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
										className: "mt-3 space-y-2 border-l border-line pl-4 text-sm",
										children: g.ledger.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: l.granted ? "text-pine" : "text-rose",
												children: l.granted ? "Granted" : "Withdrawn"
											}),
											" ·",
											" ",
											PURPOSE[l.purpose] ?? l.purpose,
											" · via ",
											SOURCE[l.source] ?? l.source
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-stone",
											children: [
												formatDateLong(l.at),
												" — “",
												l.wording,
												"”"
											]
										})] }, l.id))
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-medium",
								children: "Stays"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 divide-y divide-line text-sm",
								children: g.stays.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex justify-between py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										formatDate(s.arrival),
										" – ",
										formatDate(s.departure),
										" · ",
										s.roomType
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums text-stone",
										children: s.spentCents ? money(s.spentCents) : "—"
									})]
								}, s.reservationId))
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-xl font-medium",
								children: "Occasions"
							}), !g.consents.profile_memory ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-stone",
								children: "Not kept: the guest hasn't agreed to have dates remembered."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								g.upcoming.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-stone",
									children: "None shared yet."
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-2 text-sm",
									children: g.upcoming.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [o.companion ? `${o.companion}'s ` : "", o.label ?? o.kind] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "tabular-nums text-stone",
											children: [MONTHS[o.month - 1], o.day ? ` ${o.day}` : ""]
										})]
									}, o.id))
								}),
								g.caps.dataRequests ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 grid grid-cols-[1fr_76px_64px] gap-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "Occasion",
											value: occ.kind,
											onChange: (e) => setOcc({
												...occ,
												kind: e.target.value
											}),
											className: "h-9 rounded-md border border-line bg-cream px-2 text-sm",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "birthday",
													children: "Birthday"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "anniversary",
													children: "Anniversary"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "achievement",
													children: "Achievement"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "other",
													children: "Other"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "Month",
											value: occ.month,
											onChange: (e) => setOcc({
												...occ,
												month: Number(e.target.value)
											}),
											className: "h-9 rounded-md border border-line bg-cream px-1 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: 0,
												children: "Mon"
											}), MONTHS.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: i + 1,
												children: m
											}, m))]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "Day",
											value: occ.day,
											onChange: (e) => setOcc({
												...occ,
												day: Number(e.target.value)
											}),
											className: "h-9 rounded-md border border-line bg-cream px-1 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: 0,
												children: "Day"
											}), Array.from({ length: 31 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: i + 1,
												children: i + 1
											}, i + 1))]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "secondary",
											className: "col-span-3",
											disabled: busy || !occ.month,
											onClick: () => void act(() => addGuestOccasion({ data: {
												profileId: g.id,
												kind: occ.kind,
												label: null,
												month: occ.month,
												day: occ.day || null,
												companionId: null
											} }), "Added. Told at the desk, recorded as staff-entered.").then(() => router.invalidate()),
											children: "Add an occasion the guest mentioned"
										})
									]
								}) : null
							] })]
						}),
						g.consents.profile_memory ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-medium",
									children: "Travels with"
								}),
								g.companions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-stone",
									children: "No one added."
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-2 space-y-1 text-sm",
									children: g.companions.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										c.firstName ?? `Child (${c.ageBand})`,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-stone",
											children: ["· ", c.relation]
										})
									] }, c.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-stone",
									children: "Companions are never contacted."
								}),
								g.holidays.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 text-sm font-medium",
									children: "Celebrates"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex flex-wrap gap-1",
									children: g.holidays.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: h.replace(/_/g, " ") }, h))
								})] }) : null
							]
						}) : null,
						g.duplicates.length > 0 && g.caps.merge ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: card,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "flex items-center gap-2 font-display text-xl font-medium",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GitMerge, { className: "size-5" }), " Possible duplicates"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 space-y-2 text-sm",
									children: g.duplicates.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/hotel/guests/$profileId",
											params: { profileId: d.id },
											className: "hover:text-pine",
											children: [
												d.name,
												" · ",
												d.stays,
												" stay",
												d.stays === 1 ? "" : "s"
											]
										}), mergeTarget === d.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "danger",
											disabled: busy,
											onClick: () => void act(() => mergeGuests({ data: {
												keepId: g.id,
												mergeId: d.id
											} }), "Merged.").then(() => {
												setMergeTarget(null);
												return router.invalidate();
											}),
											children: "Confirm merge"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											disabled: busy,
											onClick: () => setMergeTarget(d.id),
											children: "Merge here"
										})]
									}, d.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs text-stone",
									children: "Profiles are never merged automatically. Check it's the same person first."
								})
							]
						}) : null
					]
				})]
			})
		]
	});
}
//#endregion
export { GuestPage as component };
