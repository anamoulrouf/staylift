import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as Route$7, w as acceptInvite } from "./router-CoWk33e6.mjs";
import { t as Button } from "./button-DWJAclyi.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { i as ROLE_LABEL, r as ROLE_HINT } from "./roles-8UfQ9oTl.mjs";
import { t as Mark } from "./mark-6eISl1Ml.mjs";
import { t as useCurrentUserState } from "./use-current-user-Cfaybt7U.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/invite._token-DlfF6sHN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Invite() {
	const invite = Route$7.useLoaderData();
	const { token } = Route$7.useParams();
	const { user, isPending } = useCurrentUserState();
	const router = useRouter();
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function accept() {
		setBusy(true);
		try {
			await acceptInvite({ data: { token } });
			toast.success(`You're on the ${invite?.propertyName} team.`);
			await router.navigate({ to: "/hotel" });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not accept.");
		} finally {
			setBusy(false);
		}
	}
	const here = `/invite/${token}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-linen px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), !invite || !invite.usable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-8 font-display text-3xl font-medium",
				children: "This invitation has expired"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-stone",
				children: "Ask the hotel's owner to send a new one. Invitations last 7 days and work once."
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 rounded-xl bg-paper p-6 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-stone",
						children: "Invitation"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-2 font-display text-3xl font-medium tracking-tight",
						children: ["Join ", invite.propertyName]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-stone",
						children: [
							"As ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "text-ink",
								children: ROLE_LABEL[invite.role]
							}),
							": ",
							ROLE_HINT[invite.role]
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm text-stone",
						children: ["For ", invite.email]
					}),
					isPending ? null : user ? user.primaryEmail?.toLowerCase() === invite.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-5 w-full",
						onClick: () => void accept(),
						disabled: busy,
						children: busy ? "Joining…" : "Accept and open the hotel"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-md bg-amber-soft p-3 text-sm text-amber",
						children: [
							"You're signed in as ",
							user.primaryEmail,
							".",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "underline",
								onClick: () => void signOut(`/login?mode=signup&next=${encodeURIComponent(here)}`),
								children: "Switch account"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 grid gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							search: {
								next: here,
								mode: "signup"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full",
								children: ["Create account with ", invite.email]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							search: { next: here },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								className: "w-full",
								children: "I already have an account"
							})
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { Invite as component };
