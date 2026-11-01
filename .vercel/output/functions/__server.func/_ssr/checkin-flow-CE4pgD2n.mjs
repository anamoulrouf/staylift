import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as ChevronLeft, L as Check, _ as Plus, t as X, u as Sparkles, x as Mail, y as MessageCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as checkinStep, O as completeCheckin, Z as requestPreferenceLink, at as startCheckin, dt as verifyCheckinCode, rt as sendCheckinCode } from "./router-CoWk33e6.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { t as Badge } from "./badge-C-LEKJr-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkin-flow-CE4pgD2n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Online check-in with the capture step (phase B), for the guest's phone, the
* desk tablet and the QR path. Order is deliberate:
*   1. arrival time + "celebrating anything?"   (easy, useful to the guest)
*   2. who's travelling with you                 (room set-up; never contacted)
*   3. the guest's own contact, verified by code, then three UNTICKED consents
* Every step can be skipped; check-in completes either way.
*/
var MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
var CELEBRATIONS = [
	{
		id: "none",
		label: "Nothing special"
	},
	{
		id: "birthday",
		label: "A birthday"
	},
	{
		id: "anniversary",
		label: "An anniversary"
	},
	{
		id: "honeymoon",
		label: "Honeymoon"
	},
	{
		id: "achievement",
		label: "An achievement"
	},
	{
		id: "other",
		label: "Something else"
	}
];
var RELATIONS = [
	{
		id: "partner",
		label: "Partner"
	},
	{
		id: "friend",
		label: "Friend"
	},
	{
		id: "parent",
		label: "Parent"
	},
	{
		id: "sibling",
		label: "Sibling"
	},
	{
		id: "colleague",
		label: "Colleague"
	},
	{
		id: "other",
		label: "Other"
	}
];
var AGE_BANDS = [
	{
		id: "0-2",
		label: "Under 3"
	},
	{
		id: "3-12",
		label: "3–12"
	},
	{
		id: "13-17",
		label: "13–17"
	}
];
var input = "h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";
function CheckinFlow({ token, hotel, guestFirstName, guests, state, config, source, kiosk = false, onDone }) {
	const [step, setStep] = (0, import_react.useState)(state.completed ? "done" : "intro");
	const [eta, setEta] = (0, import_react.useState)(state.eta ?? "15:00");
	const [celebration, setCelebration] = (0, import_react.useState)(state.celebration ?? "none");
	const [whose, setWhose] = (0, import_react.useState)(state.celebrationWhose ?? "me");
	const [month, setMonth] = (0, import_react.useState)(state.celebrationMonth);
	const [day, setDay] = (0, import_react.useState)(state.celebrationDay);
	const [party, setParty] = (0, import_react.useState)(state.party);
	const [channel, setChannel] = (0, import_react.useState)("email");
	const [contact, setContact] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(null);
	const [code, setCode] = (0, import_react.useState)("");
	const [verifiedEmail, setVerifiedEmail] = (0, import_react.useState)(state.verifiedEmail);
	const [verifiedPhone, setVerifiedPhone] = (0, import_react.useState)(state.verifiedPhone);
	const [consents, setConsents] = (0, import_react.useState)({
		marketing_email: false,
		marketing_whatsapp: false,
		profile_memory: false
	});
	const [holidays, setHolidays] = (0, import_react.useState)(state.holidays);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [prefToken, setPrefToken] = (0, import_react.useState)(null);
	const [ticket, setTicket] = (0, import_react.useState)(null);
	const [linkNote, setLinkNote] = (0, import_react.useState)(null);
	const [newProfile, setNewProfile] = (0, import_react.useState)(false);
	async function run(fn) {
		setBusy(true);
		try {
			return await fn();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Something went wrong.");
			return;
		} finally {
			setBusy(false);
		}
	}
	const start = () => run(async () => {
		await startCheckin({ data: {
			token,
			source
		} });
		setStep("arrival");
	});
	const afterArrival = () => run(async () => {
		await checkinStep({ data: {
			token,
			step: "celebration",
			source
		} });
		setStep(guests > 1 ? "party" : "contact");
	});
	const afterParty = () => run(async () => {
		await checkinStep({ data: {
			token,
			step: "party",
			source
		} });
		setStep("contact");
	});
	const sendCode = () => run(async () => {
		const res = await sendCheckinCode({ data: {
			token,
			channel,
			value: contact,
			source
		} });
		setPending({
			id: res.verificationId,
			sentTo: res.sentTo,
			devCode: res.devCode
		});
		setCode("");
	});
	const confirmCode = () => run(async () => {
		if (!pending) return;
		const res = await verifyCheckinCode({ data: {
			token,
			verificationId: pending.id,
			code,
			source
		} });
		if (!res.ok) {
			toast.error(res.message);
			setCode("");
			return;
		}
		setTicket(res.ticket);
		if (res.channel === "email") setVerifiedEmail(res.masked);
		else setVerifiedPhone(res.masked);
		setPending(null);
		setContact("");
		toast.success("Confirmed.");
	});
	const finish = () => run(async () => {
		const res = await completeCheckin({ data: {
			token,
			source,
			ticket,
			eta,
			celebration: celebration === "none" ? null : {
				kind: celebration,
				whose,
				month,
				day: month ? day : null
			},
			party,
			consents,
			holidays: consents.profile_memory ? holidays : []
		} });
		setPrefToken(res.prefToken);
		setNewProfile(res.newProfile);
		setStep("done");
		if (kiosk && onDone) window.setTimeout(onDone, 15e3);
	});
	const emailPreferences = () => run(async () => {
		const res = await requestPreferenceLink({ data: {
			token,
			origin: window.location.origin
		} });
		setLinkNote(res);
	});
	const anyVerified = Boolean(verifiedEmail || verifiedPhone);
	const datable = celebration === "birthday" || celebration === "anniversary" || celebration === "honeymoon" || celebration === "achievement";
	const big = kiosk ? "text-base" : "text-sm";
	if (step === "done") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]", kiosk && "p-8"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-pine",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5" }),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: "You're checked in"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: cn("mt-4 space-y-1.5 text-stone", big),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Arriving around ", eta || state.eta || "—"] }),
					celebration !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"Celebrating ",
						CELEBRATIONS.find((c) => c.id === celebration)?.label.toLowerCase(),
						month ? ` · ${MONTHS[month - 1]}${day ? ` ${day}` : ""}` : "",
						" — the house knows."
					] }) : null,
					verifiedEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Room details go to ", verifiedEmail] }) : null,
					verifiedPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["WhatsApp: ", verifiedPhone] }) : null
				]
			}),
			prefToken ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 rounded-lg bg-moss p-4 text-sm text-pine",
				children: [
					newProfile ? "We've saved your choices." : "Welcome back — we've updated your choices.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/p/$token",
						params: { token: prefToken },
						className: "font-medium underline underline-offset-4",
						children: "See or change what we keep"
					})
				]
			}) : !kiosk && (state.consents.marketing_email || state.consents.marketing_whatsapp || state.consents.profile_memory || state.returningGuest) ? linkNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-5 rounded-lg bg-moss p-4 text-sm text-pine",
				children: [linkNote.sentTo ? `We've emailed a link to ${linkNote.sentTo}.` : "Here's your link.", linkNote.devLink ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-amber",
						children: "Development mode, so nothing was sent:"
					}),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: linkNote.devLink,
						className: "font-medium underline underline-offset-4",
						children: "open it"
					})
				] }) : null]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => void emailPreferences(),
				disabled: busy,
				className: "mt-5 text-sm font-medium text-pine underline underline-offset-4",
				children: "Email me a link to see or change what you keep"
			}) : null,
			kiosk && consents.marketing_email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-stone",
				children: "You can manage these choices any time from the link on your own stay page."
			}) : null,
			kiosk && onDone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				variant: "secondary",
				className: "mt-6 w-full",
				onClick: onDone,
				children: "Done — hand the tablet back"
			}) : null
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]", kiosk && "p-8"),
		children: [
			step !== "intro" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "inline-flex items-center gap-1 text-sm text-stone hover:text-ink disabled:opacity-0",
					disabled: step === "arrival",
					onClick: () => setStep(step === "contact" ? guests > 1 ? "party" : "arrival" : "arrival"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Back"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDots, {
					step,
					withParty: guests > 1
				})]
			}) : null,
			step === "intro" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: cn("font-display font-medium", kiosk ? "text-3xl" : "text-xl"),
					children: kiosk ? `Welcome, ${guestFirstName}` : "Complete your check-in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-2 text-stone", big),
					children: "Three quick questions, about a minute. Skip anything you like."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: kiosk ? "lg" : "md",
					className: "mt-5 w-full",
					onClick: () => void start(),
					disabled: busy,
					children: "Start check-in"
				})
			] }) : null,
			step === "arrival" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl"),
					children: "Your arrival"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: cn("mt-4 block text-stone", big),
					children: ["Roughly when will you get here?", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						value: eta,
						onChange: (e) => setEta(e.target.value),
						className: cn(input, "mt-1")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: cn("text-stone", big),
						children: "Celebrating anything this stay?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: CELEBRATIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: celebration === c.id,
							onClick: () => setCelebration(c.id),
							large: kiosk,
							children: c.label
						}, c.id))
					})]
				}),
				celebration !== "none" && celebration !== "honeymoon" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: cn("text-stone", big),
						children: "Whose?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: [
							"me",
							"partner",
							"someone"
						].map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: whose === w,
							onClick: () => setWhose(w),
							large: kiosk,
							children: w === "me" ? "Mine" : w === "partner" ? "My partner's" : "Someone else's"
						}, w))
					})]
				}) : null,
				datable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: cn("text-stone", big),
							children: [
								celebration === "honeymoon" ? "Wedding date" : "The date",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-mist",
									children: "(optional)"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 grid grid-cols-[1fr_96px] gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								"aria-label": "Month",
								value: month ?? "",
								onChange: (e) => setMonth(e.target.value ? Number(e.target.value) : null),
								className: input,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Month"
								}), MONTHS.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: i + 1,
									children: m
								}, m))]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								"aria-label": "Day",
								value: day ?? "",
								onChange: (e) => setDay(e.target.value ? Number(e.target.value) : null),
								className: input,
								disabled: !month,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Day"
								}), Array.from({ length: 31 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: i + 1,
									children: i + 1
								}, i + 1))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-mist",
							children: "Only the month and day — never the year."
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: kiosk ? "lg" : "md",
					className: "mt-6 w-full",
					onClick: () => void afterArrival(),
					disabled: busy,
					children: "Continue"
				})
			] }) : null,
			step === "party" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl"),
					children: "Who's with you?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-1 text-stone", big),
					children: "So we can set up the room. We never contact the people you add."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: party.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2",
						children: [m.relation === "child" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-24 shrink-0 text-sm text-stone",
							children: "Child"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							"aria-label": "Age",
							value: m.ageBand,
							onChange: (e) => setParty(party.map((p, j) => j === i ? {
								relation: "child",
								ageBand: e.target.value
							} : p)),
							className: input,
							children: AGE_BANDS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: a.id,
								children: ["Age ", a.label]
							}, a.id))
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							"aria-label": "Relation",
							value: m.relation,
							onChange: (e) => setParty(party.map((p, j) => j === i ? {
								relation: e.target.value,
								firstName: m.firstName
							} : p)),
							className: cn(input, "w-32 shrink-0"),
							children: RELATIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: r.id,
								children: r.label
							}, r.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": "First name",
							placeholder: "First name",
							value: m.firstName,
							maxLength: 40,
							onChange: (e) => setParty(party.map((p, j) => j === i ? {
								relation: m.relation,
								firstName: e.target.value
							} : p)),
							className: input
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Remove",
							onClick: () => setParty(party.filter((_, j) => j !== i)),
							className: "flex size-11 shrink-0 items-center justify-center rounded-md text-stone hover:bg-cream",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setParty([...party, {
							relation: party.some((p) => p.relation === "partner") ? "friend" : "partner",
							firstName: ""
						}]),
						disabled: party.length >= 8,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Adult"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setParty([...party, {
							relation: "child",
							ageBand: "3-12"
						}]),
						disabled: party.length >= 8,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Child"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-mist",
					children: "Children are kept as an age range only, without a name."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: kiosk ? "lg" : "md",
						onClick: () => {
							setParty([]);
							afterParty();
						},
						disabled: busy,
						children: "Skip"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: kiosk ? "lg" : "md",
						onClick: () => {
							setParty(party.filter((p) => p.relation === "child" || p.firstName.trim()));
							afterParty();
						},
						disabled: busy,
						children: "Continue"
					})]
				})
			] }) : null,
			step === "contact" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: cn("font-display font-medium", kiosk ? "text-2xl" : "text-xl"),
					children: "Stay in touch"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("mt-1 text-stone", big),
					children: "Booking sites hide your address, so messages from the house can go astray. Add your own and we'll send room details there."
				}),
				verifiedEmail || verifiedPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 space-y-1.5",
					children: [verifiedEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-sm text-pine",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }),
							" ",
							verifiedEmail
						]
					}) : null, verifiedPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 text-sm text-pine",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }),
							" WhatsApp ",
							verifiedPhone
						]
					}) : null]
				}) : null,
				!(verifiedEmail && (verifiedPhone || !config.whatsappAvailable)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-lg bg-cream p-3",
					children: [config.whatsappAvailable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 inline-flex rounded-md bg-paper p-1",
						role: "tablist",
						children: ["email", "whatsapp"].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							"aria-selected": channel === c,
							disabled: c === "email" && Boolean(verifiedEmail) || c === "whatsapp" && Boolean(verifiedPhone),
							onClick: () => {
								setChannel(c);
								setPending(null);
								setContact("");
							},
							className: cn("inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm disabled:opacity-40", channel === c ? "bg-pine text-pine-fg" : "text-stone"),
							children: [c === "email" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-3.5" }), c === "email" ? "Email" : "WhatsApp"]
						}, c))
					}) : null, !pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							"aria-label": channel === "email" ? "Your email" : "Your WhatsApp number",
							type: channel === "email" ? "email" : "tel",
							inputMode: channel === "email" ? "email" : "tel",
							autoComplete: channel === "email" ? "email" : "tel",
							placeholder: channel === "email" ? "you@example.com" : config.market.dialCode ? `+${config.market.dialCode} …` : "+49 …",
							value: contact,
							onChange: (e) => setContact(e.target.value),
							className: input
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => void sendCode(),
							disabled: busy || contact.trim().length < 5,
							className: "shrink-0",
							children: "Send code"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-stone",
							children: [
								"Enter the 6-digit code we sent to ",
								pending.sentTo,
								"."
							]
						}),
						pending.devCode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 rounded-md bg-amber-soft px-3 py-2 text-xs text-amber",
							children: [
								"Development mode — nothing was sent. The code is ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "font-mono",
									children: pending.devCode
								}),
								"."
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Code",
								inputMode: "numeric",
								autoComplete: "one-time-code",
								maxLength: 6,
								value: code,
								onChange: (e) => setCode(e.target.value.replace(/\D/g, "")),
								className: cn(input, "font-mono tracking-[0.3em]")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => void confirmCode(),
								disabled: busy || code.length !== 6,
								className: "shrink-0",
								children: "Confirm"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setPending(null),
							className: "mt-2 text-xs text-stone underline",
							children: ["Use a different ", channel === "email" ? "email" : "number"]
						})
					] })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-5 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-xs uppercase tracking-[0.14em] text-stone",
							children: "Optional — nothing is ticked for you"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Consent, {
							checked: consents.marketing_email,
							disabled: !verifiedEmail,
							hint: !verifiedEmail ? "Confirm an email first" : void 0,
							onChange: (v) => setConsents({
								...consents,
								marketing_email: v
							}),
							text: config.wording.marketing_email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Consent, {
							checked: consents.marketing_whatsapp,
							disabled: !verifiedPhone,
							hint: !verifiedPhone ? "Confirm a WhatsApp number first" : void 0,
							onChange: (v) => setConsents({
								...consents,
								marketing_whatsapp: v
							}),
							text: config.wording.marketing_whatsapp
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Consent, {
							checked: consents.profile_memory,
							disabled: !anyVerified,
							hint: !anyVerified ? "Confirm an email or number first" : void 0,
							onChange: (v) => setConsents({
								...consents,
								profile_memory: v
							}),
							text: config.wording.profile_memory
						})
					]
				}),
				consents.profile_memory ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-lg bg-cream p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5 text-sm text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-pine" }), " Any holidays you'd like us to remember?"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-stone",
							children: [
								"Entirely up to you",
								config.market.explicitSpecialCategory ? " — this can say something about your faith or culture, so we only keep what you pick" : "",
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-1.5",
							children: config.holidays.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								small: true,
								active: holidays.includes(h.id),
								onClick: () => setHolidays(holidays.includes(h.id) ? holidays.filter((x) => x !== h.id) : [...holidays, h.id]),
								children: h.label
							}, h.id))
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: kiosk ? "lg" : "md",
					className: "mt-6 w-full",
					onClick: () => void finish(),
					disabled: busy || Boolean(pending),
					children: busy ? "Saving…" : anyVerified ? "Finish check-in" : "Skip and finish check-in"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-center text-xs text-mist",
					children: "You can change or withdraw any of this later."
				})
			] }) : null
		]
	});
}
function StepDots({ step, withParty }) {
	const steps = withParty ? [
		"arrival",
		"party",
		"contact"
	] : ["arrival", "contact"];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex items-center gap-1.5",
		"aria-label": `Step ${steps.indexOf(step) + 1} of ${steps.length}`,
		children: steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-1.5 rounded-full transition-all", s === step ? "w-5 bg-pine" : "w-1.5 bg-line") }, s))
	});
}
function Chip({ active, onClick, children, small, large }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-pressed": active,
		onClick,
		className: cn("rounded-full border transition-colors", small ? "h-8 px-3 text-xs" : large ? "h-12 px-5 text-base" : "h-10 px-4 text-sm", active ? "border-pine bg-pine text-pine-fg" : "border-line bg-paper text-ink hover:bg-cream"),
		children
	});
}
function Consent({ checked, disabled, hint, onChange, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex items-start gap-3 text-sm", disabled && "opacity-50"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "checkbox",
			checked,
			disabled,
			onChange: (e) => onChange(e.target.checked),
			className: "mt-0.5 size-5 shrink-0 accent-pine"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [text, hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			className: "ml-2 align-middle",
			children: hint
		}) : null] })]
	});
}
//#endregion
export { CheckinFlow as t };
