import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime, S as useRouter, _ as Outlet, b as createRootRoute, f as Scripts, g as createRouter, p as HeadContent, v as lazyRouteComponent, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, n as boolean, o as string, r as literal, s as union, t as _enum } from "../_libs/zod.mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-AIzoUEge.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getDashboard = createServerFn({ method: "GET" }).handler(createSsrRpc("9545075549869e93ca0c583fa429aa1d82c58b85b483b2f4ef537e04c8d342a6"));
var listReservations = createServerFn({ method: "GET" }).handler(createSsrRpc("e005ae3fe6737096f628bb575fa2e07981255027cfa2cf35fe354982568de78c"));
var listOffers = createServerFn({ method: "GET" }).handler(createSsrRpc("7d4d3029c956a2dc0be47a3add105c5cc271c8c19f49451142f9186baf44051a"));
var listFulfillment = createServerFn({ method: "GET" }).handler(createSsrRpc("b0d162ce6a18dd112f1335203c458e9a3e56d0bd623aac4d8ac33a22093b5264"));
var listRecipes = createServerFn({ method: "GET" }).handler(createSsrRpc("203df204520c9387e632c5da4f2f6d2b6bfc762461bf5eed55a228c0f1c07a57"));
var getAnalytics = createServerFn({ method: "GET" }).handler(createSsrRpc("846f0b12b91c3c4d0e7808c19431a224dac23758fc680a55736ae3b1d9d9c01a"));
var getStay = createServerFn({ method: "GET" }).validator(object({ token: string().min(1) })).handler(createSsrRpc("913f2c3bfc30e3f2e5dc8e4ba4d80b162148e9e0dbc83f47fa7f23bcccd834cb"));
var recordStayView = createServerFn({ method: "POST" }).validator(object({ token: string().min(1) })).handler(createSsrRpc("d5512689bf8a39527cf4ee62fa0277df60d3e2918b45b9e6a5baacbefbf78d88"));
var purchaseOffer = createServerFn({ method: "POST" }).validator(object({
	token: string().min(1),
	offerId: string().min(1),
	qty: number().int().min(1).max(14),
	forTime: string().optional()
})).handler(createSsrRpc("239081f157676747d342000e32b55dd13093091740bf20f98a203013d6911d1a"));
var decideOrder = createServerFn({ method: "POST" }).validator(object({
	orderId: string().min(1),
	decision: _enum(["approve", "decline"])
})).handler(createSsrRpc("5b029795fa7d5c45c42b3994b18a742fe9c16adad2e8831db116932a041f8745"));
var completeCheckin = createServerFn({ method: "POST" }).validator(object({
	token: string().min(1),
	eta: string().max(16),
	captureEmail: boolean()
})).handler(createSsrRpc("1bd6e17c4f2408addcfb9940a60f81f3fc98ea0a29d89bd3f2bb58e4fbff1a30"));
var toggleRecipe = createServerFn({ method: "POST" }).validator(object({
	id: string(),
	active: boolean()
})).handler(createSsrRpc("b29bfbd1059862c2dcddd6b6480e31368d47de3f903fa9f0efb2f70c07e5e82d"));
var toggleOffer = createServerFn({ method: "POST" }).validator(object({
	id: string(),
	active: boolean()
})).handler(createSsrRpc("32bdd37eeae6bf4fa697d818b95d9db34d8395eb6050242c7b0fb3ae6d109942"));
var sendStayLink = createServerFn({ method: "POST" }).validator(object({
	reservationId: string(),
	recipeId: string().optional(),
	channel: _enum([
		"email",
		"sms",
		"whatsapp"
	])
})).handler(createSsrRpc("2f8cbd865a42aba2820452b741023497a6fcbd01a6419ebf8747b3a19d632a62"));
var ingestSchema = object({
	bookingRef: string().min(2),
	source: string().min(2),
	guestName: string().min(2).max(80),
	arrival: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	departure: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	roomTypeId: string(),
	guests: number().int().min(1).max(6),
	emailKind: _enum([
		"real",
		"masked",
		"none"
	]),
	phoneKind: _enum([
		"valid",
		"placeholder",
		"none"
	])
});
var ingestReservation = createServerFn({ method: "POST" }).validator(ingestSchema).handler(createSsrRpc("dcb9f0e23412424a06ad2c99eb5eef7f035e116aed5f503821a625237d96763e"));
var previewEmailParse = createServerFn({ method: "POST" }).validator(object({ text: string().min(10) })).handler(createSsrRpc("7dff6f832948d6de9832cfa9dbd286c537cf1210499fd822757188686edc1b92"));
var listRoomTypes = createServerFn({ method: "GET" }).handler(createSsrRpc("0fc2eb144562abddcd3055adeb402d75c97c47bcd6078f1bd8b4d357ec77427f"));
var listMessages = createServerFn({ method: "GET" }).handler(createSsrRpc("77b73ca1f567b1585e3ec27c74056deb367e9eb2899861a4593499d29377762c"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-ZEuq5NDh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-pBW55Toq.css";
var APP_NAME = "Staylift";
var Route$9 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "The automated revenue layer for independent hotels. Turn every reservation into incremental revenue."
			},
			{
				name: "theme-color",
				content: "#F3EEE6"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Mono:wght@400;500&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh bg-linen font-sans text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					position: "bottom-center",
					toastOptions: { className: "font-sans! bg-paper! text-ink! border-line! shadow-[var(--shadow-border)]!" }
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter$8 = () => import("./routes-DqMV6k4W.mjs");
var Route$8 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./hotel-CXEadRTJ.mjs");
var Route$7 = createFileRoute("/hotel")({
	loader: () => getDashboard(),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./hotel-CRnstZIx.mjs");
var Route$6 = createFileRoute("/hotel/")({
	loader: () => getDashboard(),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./analytics-PLXdEN2-.mjs");
var Route$5 = createFileRoute("/hotel/analytics")({
	loader: async () => {
		const [analytics, dash] = await Promise.all([getAnalytics(), getDashboard()]);
		return {
			analytics,
			dash
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./automation-V6J1q3QD.mjs");
var Route$4 = createFileRoute("/hotel/automation")({
	loader: async () => {
		const [recipes, offers, messages] = await Promise.all([
			listRecipes(),
			listOffers(),
			listMessages()
		]);
		return {
			recipes,
			offers,
			messages
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./fulfillment-CXIXr1mr.mjs");
var Route$3 = createFileRoute("/hotel/fulfillment")({
	loader: () => listFulfillment(),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./offers-lrwlVZkr.mjs");
var Route$2 = createFileRoute("/hotel/offers")({
	loader: () => listOffers(),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./reservations-BuoUPacE.mjs");
var Route$1 = createFileRoute("/hotel/reservations")({
	loader: async () => {
		const [book, rooms] = await Promise.all([listReservations(), listRoomTypes()]);
		return {
			...book,
			rooms
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_token-CO1ZF4aV.mjs");
var Route = createFileRoute("/stay/$token")({
	loader: ({ params }) => getStay({ data: { token: params.token } }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$8.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$9
});
var HotelRoute = Route$7.update({
	id: "/hotel",
	path: "/hotel",
	getParentRoute: () => Route$9
});
var HotelIndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => HotelRoute
});
var HotelAnalyticsRoute = Route$5.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => HotelRoute
});
var HotelAutomationRoute = Route$4.update({
	id: "/automation",
	path: "/automation",
	getParentRoute: () => HotelRoute
});
var HotelFulfillmentRoute = Route$3.update({
	id: "/fulfillment",
	path: "/fulfillment",
	getParentRoute: () => HotelRoute
});
var HotelOffersRoute = Route$2.update({
	id: "/offers",
	path: "/offers",
	getParentRoute: () => HotelRoute
});
var HotelReservationsRoute = Route$1.update({
	id: "/reservations",
	path: "/reservations",
	getParentRoute: () => HotelRoute
});
var StayTokenRoute = Route.update({
	id: "/stay/$token",
	path: "/stay/$token",
	getParentRoute: () => Route$9
});
var HotelRouteChildren = {
	HotelAnalyticsRoute,
	HotelAutomationRoute,
	HotelFulfillmentRoute,
	HotelOffersRoute,
	HotelReservationsRoute,
	HotelIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	HotelRoute: HotelRoute._addFileChildren(HotelRouteChildren),
	StayTokenRoute
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { toggleOffer as _, Route$3 as a, Route$6 as c, decideOrder as d, ingestReservation as f, sendStayLink as g, recordStayView as h, Route$2 as i, Route$7 as l, purchaseOffer as m, Route as n, Route$4 as o, previewEmailParse as p, Route$1 as r, Route$5 as s, router_exports as t, completeCheckin as u, toggleRecipe as v };
