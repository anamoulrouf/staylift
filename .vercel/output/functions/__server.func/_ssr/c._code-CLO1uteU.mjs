import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as findQrBooking, v as Route$18 } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/c._code-CLO1uteU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** The desk QR lands here: the guest finds their booking with last name + reference. */
function QrCheckin() {
	const hotel = Route$18.useLoaderData();
	const { code } = Route$18.useParams();
	const navigate = useNavigate();
	const [lastName, setLastName] = (0, import_react.useState)("");
	const [ref, setRef] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function find(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const { token } = await findQrBooking({ data: {
				code,
				lastName,
				bookingRef: ref
			} });
			await navigate({
				to: "/stay/$token",
				params: { token },
				search: { src: "qr" },
				hash: "checkin"
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not find that booking.");
		} finally {
			setBusy(false);
		}
	}
	if (!hotel) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-linen px-5 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-stone",
			children: "This check-in code isn't recognised. Please ask the front desk."
		})
	});
	const input = "mt-1 h-12 w-full rounded-md border border-line bg-cream px-3 text-base outline-none focus:border-pine";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-dvh bg-linen px-5 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl font-medium tracking-tight",
					children: hotel.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.16em] text-stone",
					children: hotel.city
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-10 font-display text-3xl font-medium tracking-tight",
					children: "Check in on your phone"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-stone",
					children: "Find your booking — it's on your confirmation email."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (e) => void find(e),
					className: "mt-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-stone",
							children: ["Last name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								autoComplete: "family-name",
								value: lastName,
								onChange: (e) => setLastName(e.target.value),
								className: input
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-stone",
							children: ["Booking reference", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								autoCapitalize: "characters",
								value: ref,
								onChange: (e) => setRef(e.target.value),
								className: `${input} font-mono`
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "rounded-md bg-rose-soft px-3 py-2 text-sm text-rose",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "lg",
							className: "w-full",
							disabled: busy,
							children: busy ? "Looking…" : "Find my booking"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-center text-xs text-mist",
					children: "Powered by Staylift"
				})
			]
		})
	});
}
//#endregion
export { QrCheckin as component };
