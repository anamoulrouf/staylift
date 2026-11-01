import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useNavigate, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-BKOhFj4w.mjs";
import { x as Route$21 } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
import { t as useCurrentUserState } from "./use-current-user-Cfaybt7U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-bPRMpBh1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Only same-site paths, so a crafted ?next= can't bounce a fresh session elsewhere. */
function safeNext(next) {
	if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/hotel";
	try {
		const url = new URL(next, "http://same.origin");
		return url.origin === "http://same.origin" ? `${url.pathname}${url.search}${url.hash}` : "/hotel";
	} catch {
		return "/hotel";
	}
}
function Login() {
	const search = Route$21.useSearch();
	const navigate = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)(search.mode ?? "signin");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [localHost, setLocalHost] = (0, import_react.useState)(true);
	const next = safeNext(search.next);
	(0, import_react.useEffect)(() => {
		setLocalHost([
			"localhost",
			"127.0.0.1",
			"[::1]"
		].includes(window.location.hostname));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isPending && user) navigate({ to: next });
	}, [
		isPending,
		user,
		next,
		navigate
	]);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const result = mode === "signup" ? await authClient.signUp.email({
				name: name.trim(),
				email: email.trim(),
				password
			}) : await authClient.signIn.email({
				email: email.trim(),
				password
			});
			if (result.error) {
				setError(result.error.status === 401 || result.error.code === "INVALID_EMAIL_OR_PASSWORD" ? "That email and password don't match." : result.error.message ?? "Could not sign in.");
				return;
			}
			window.location.href = next;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not sign in.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-linen px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "inline-block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-8 font-display text-3xl font-medium tracking-tight",
					children: mode === "signup" ? "Create your account" : "Sign in to your hotel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-stone",
					children: mode === "signup" ? "For hotel staff. Guests never need an account." : "Owners, managers and front desk sign in here."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (e) => void submit(e),
					className: "mt-6 space-y-3 rounded-xl bg-paper p-5 shadow-[var(--shadow-border)]",
					children: [
						mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Your name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								minLength: 2,
								value: name,
								onChange: (e) => setName(e.target.value),
								autoComplete: "name",
								className: input
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Work email",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								type: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								autoComplete: "email",
								className: input
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Password",
							hint: mode === "signup" ? "At least 8 characters." : void 0,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								required: true,
								type: "password",
								minLength: 8,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								autoComplete: mode === "signup" ? "new-password" : "current-password",
								className: input
							})
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "rounded-md bg-rose-soft px-3 py-2 text-sm text-rose",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full",
							disabled: busy,
							children: busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"
						})
					]
				}),
				!localHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-2",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						className: "w-full",
						onClick: () => void signIn(p.providerId, { callbackURL: next }),
						children: ["Continue with ", p.label]
					}, p.providerId))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-sm text-stone",
					children: [mode === "signup" ? "Already have an account? " : "New to Staylift? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "font-medium text-pine underline-offset-4 hover:underline",
						onClick: () => {
							setMode(mode === "signup" ? "signin" : "signup");
							setError(null);
						},
						children: mode === "signup" ? "Sign in" : "Create an account"
					})]
				})
			]
		})
	});
}
var input = "mt-1 h-11 w-full rounded-md border border-line bg-cream px-3 text-sm outline-none focus:border-pine";
function Field({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm text-stone",
		children: [
			label,
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-xs text-mist",
				children: hint
			}) : null
		]
	});
}
//#endregion
export { Login as component };
