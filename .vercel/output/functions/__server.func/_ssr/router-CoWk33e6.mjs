import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, Y as redirect, _ as Outlet, b as createRootRoute, f as Scripts, g as createRouter, p as HeadContent, v as lazyRouteComponent, w as require_jsx_runtime, y as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-BFNvoSgs.mjs";
import { bn as union, cn as _enum, dn as boolean, gn as object, hn as number, pn as literal, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-BKOhFj4w.mjs";
import { a as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-G3Z4A1re.js
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
/**
* Server functions: validated wrappers over queries.ts / guests.ts / access.ts.
*
* Two kinds of caller, two guards:
*   staff  — authMiddleware gives a VERIFIED user id; staff() resolves their hotel
*            and role from memberships, checks the role, and runs the work in that
*            hotel's RLS transaction. The browser never names the hotel.
*   guest  — no account; the stay link (or preference link) token resolves the
*            hotel, and the work runs in that hotel's RLS transaction.
*/
var token = string().min(1).max(64);
var id = string().min(1).max(64);
var touchpoint = _enum([
	"email",
	"whatsapp",
	"sms"
]).optional();
/** The page's own origin, used for links inside emails (PUBLIC_APP_URL overrides it). */
var origin = string().max(200).optional();
var captureSource = _enum([
	"online",
	"desk_tablet",
	"qr"
]);
var role = _enum([
	"owner",
	"manager",
	"front_desk"
]);
/** Verified staff member + role check, outside any hotel transaction. */
/**
* Staff work inside the hotel's RLS transaction. `fn` must use only the `sql`
* it gets: owner-connection work (access.*) belongs before or after, never
* inside (PGLite has one connection, so it would wait forever).
*/
/** The caller's origin if the page sent it, else this request's own origin. */
var getHotelContext = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9d4621c09dbc5b2b5689c48bc485979be3d228f0b05d73d51cb69c464543e3b1"));
var switchHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ propertyId: id })).handler(createSsrRpc("d6e302171a66980686966f995b2c3646fc2ca10801be7ca5868d4aadecce0c66"));
var createHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	name: string().trim().min(2).max(80),
	city: string().trim().min(2).max(60),
	market: _enum([
		"US",
		"UK",
		"EU",
		"AE"
	]),
	timezone: string().max(60).optional(),
	rooms: number().int().min(1).max(5e3),
	starter: boolean()
})).handler(createSsrRpc("4e81dcef04fc2235d3b2e97e9a8f04a9f01d8ea10d176b2e050d55c2d2d95a28"));
var joinDemoHotel = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("05aaba487fcbc233348c6e276b575ba5dd741f0e20bd3ea30a6a660c812292ad"));
var getInvitation = createServerFn({ method: "GET" }).validator(object({ token: string().min(10).max(100) })).handler(createSsrRpc("52f0008d8da2a3b06f5f9c6db968b3e86af326dedf860a2e41ee4d8c3645bc42"));
var acceptInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ token: string().min(10).max(100) })).handler(createSsrRpc("dd0938e2d4b98e3b1f1a2316f606b6944d958c6d03103e274ab77842faa3bff9"));
var getTeam = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7ae1ea1b6d8673262701b83184f6c16cbae90b2df44dba6fb9497ced5a50f542"));
var inviteMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	email: string().email().max(200),
	role,
	origin
})).handler(createSsrRpc("db2b3d40eb31f02147326110ece1ed5ea0935b2cde1308bf899d72b3e0148069"));
var revokeInvite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ invitationId: id })).handler(createSsrRpc("6ca8ff4169fe4f2f1d0839b8a8ac392bc617826522824e6a425518f35c2addda"));
var changeMemberRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	userId: id,
	role
})).handler(createSsrRpc("e6fb41bc403a5f5328ebed10af1f61cc53e7b17424cee73b6d941219cb9242bf"));
var removeTeamMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ userId: id })).handler(createSsrRpc("cd6b93f69b720e98f7d5e72cf5da5a9285399f1fa453ba1125f47a24bffc332b"));
var getSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ origin })).handler(createSsrRpc("4d9e0b0e70595c89d97274517260c9528711975a1f8b40d4418e1a62aed061ce"));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	name: string().trim().min(2).max(80),
	city: string().trim().min(2).max(60),
	market: _enum([
		"US",
		"UK",
		"EU",
		"AE"
	]),
	timezone: string().trim().min(3).max(60),
	rooms: number().int().min(1).max(5e3),
	senderEmail: string().email().max(200).nullable(),
	serviceRetentionDays: number().int().min(1).max(365),
	captureLaunchedOn: string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
})).handler(createSsrRpc("f2b5638f220105a28acd107c6154030318cba8e77daef83c72e83e366d809129"));
var runRetentionNow = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("b27a391f634e5f170aa211fed3314b684f10e6a840bb79eb7377435b1ae2371c"));
var getAuditLog = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	action: string().max(40).optional(),
	before: number().int().optional()
})).handler(createSsrRpc("2c3f9987cf2ae59c43fac8b37f9a50fe19912128a69aef327041b23936198dfd"));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("9545075549869e93ca0c583fa429aa1d82c58b85b483b2f4ef537e04c8d342a6"));
var getOverviewExtras = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("aec118db79e570713ea3df7155b6b77dcbbec8a1c419017e5a787f3d41c319b2"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("fbd47f9cb0316503104d6f7428666c58cbab158b6d1a1a5270b11a003c7a7bc7"));
var getMeasuredRoi = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("dcdf4ce052530e28be967214c34b5bc0c162df970ea19c6712b825c442d69d4d"));
var updateEconomics = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	planId: _enum([
		"A",
		"B",
		"C",
		"custom"
	]),
	perRoomMonthly: number().min(0).max(50),
	baseMonthly: number().min(0).max(5e3),
	revSharePct: number().min(0).max(50),
	marginPct: number().min(0).max(100),
	cardPct: number().min(0).max(10)
})).handler(createSsrRpc("e5b8875652fbdaad721a9acaa90002547d8c026e1d51b13fb671c088851e8be4"));
var listReservations = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ history: boolean().optional() })).handler(createSsrRpc("e005ae3fe6737096f628bb575fa2e07981255027cfa2cf35fe354982568de78c"));
var listOffers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("7d4d3029c956a2dc0be47a3add105c5cc271c8c19f49451142f9186baf44051a"));
var listFulfillment = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("b0d162ce6a18dd112f1335203c458e9a3e56d0bd623aac4d8ac33a22093b5264"));
var listRecipes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("203df204520c9387e632c5da4f2f6d2b6bfc762461bf5eed55a228c0f1c07a57"));
var getAnalytics = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("846f0b12b91c3c4d0e7808c19431a224dac23758fc680a55736ae3b1d9d9c01a"));
var decideOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	orderId: id,
	decision: _enum(["approve", "decline"])
})).handler(createSsrRpc("5b029795fa7d5c45c42b3994b18a742fe9c16adad2e8831db116932a041f8745"));
var toggleRecipe = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id,
	active: boolean()
})).handler(createSsrRpc("b29bfbd1059862c2dcddd6b6480e31368d47de3f903fa9f0efb2f70c07e5e82d"));
var toggleOffer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	id,
	active: boolean()
})).handler(createSsrRpc("32bdd37eeae6bf4fa697d818b95d9db34d8395eb6050242c7b0fb3ae6d109942"));
var sendStayLink = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	recipeId: id.optional(),
	channel: _enum([
		"email",
		"sms",
		"whatsapp"
	])
})).handler(createSsrRpc("2f8cbd865a42aba2820452b741023497a6fcbd01a6419ebf8747b3a19d632a62"));
var logDeskSale = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	offerId: id,
	qty: number().int().min(1).max(14)
})).handler(createSsrRpc("3fdeef47309aa54a8590836c03357942330be4979df8f9e33cdbfcbd14406125"));
var ingestReservation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	bookingRef: string().min(2).max(40),
	source: string().min(2).max(40),
	guestName: string().min(2).max(80),
	arrival: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	departure: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	roomTypeId: id,
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
	]),
	origin
})).handler(createSsrRpc("dcb9f0e23412424a06ad2c99eb5eef7f035e116aed5f503821a625237d96763e"));
var getBookingEmail = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	origin
})).handler(createSsrRpc("e2b6e4f212dd02f9fe0b92b6317531c6bf3bc6e41f70861c5da927171267eda0"));
var sendBookingEmail = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	reservationId: id,
	origin
})).handler(createSsrRpc("cd0e0af617d785bf3c12f738379100111494112f68f19ac32213e342ddbb3ff3"));
var previewEmailParse = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ text: string().min(10).max(2e4) })).handler(createSsrRpc("7dff6f832948d6de9832cfa9dbd286c537cf1210499fd822757188686edc1b92"));
var listRoomTypes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0fc2eb144562abddcd3055adeb402d75c97c47bcd6078f1bd8b4d357ec77427f"));
var listMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("77b73ca1f567b1585e3ec27c74056deb367e9eb2899861a4593499d29377762c"));
var eraseReservation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ reservationId: id })).handler(createSsrRpc("ac76a16cef04e0a7857b97e80c4a0697c54d85399ebad36edc993c76d1495740"));
var getDeskArrivals = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ origin })).handler(createSsrRpc("581d4727acbedb864d457a036f184ab16f7ef40b588c781c917e4ebbdd054a43"));
var listGuests = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({
	search: string().max(120).optional(),
	filter: _enum([
		"all",
		"marketable",
		"returning",
		"occasions"
	]).optional()
})).handler(createSsrRpc("afe7519908a32cd31fbcab0eb11f3c1f235412bc5422ec3809d4e4b97f05ea20"));
var getGuest = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(createSsrRpc("39478a1460895f3242bb9f313b637cfd87eca1354656ae34614db6a7313c10a5"));
var revealGuestContact = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	profileId: id,
	reason: string().trim().min(3).max(200)
})).handler(createSsrRpc("021e8bd7380c8d5fb98e911b429c9995517a4dba702ab6b98dcbf1c43758a1c6"));
var exportGuest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(createSsrRpc("753e3ca194d5cd39f4956c60532d4585952a6518c7f94eeff295abf561c9645b"));
var eraseGuest = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ profileId: id })).handler(createSsrRpc("7f6e2211878171d12047e966b64701ef6355ddb3bc8a1760ce4360e60e6c8f77"));
var mergeGuests = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	keepId: id,
	mergeId: id
})).handler(createSsrRpc("2fd3707d91e734357596ab1d9abef609c430f1826a25df3787165d4b7432d819"));
var withdrawGuestConsent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	profileId: id,
	purpose: _enum([
		"marketing_email",
		"marketing_whatsapp",
		"profile_memory"
	])
})).handler(createSsrRpc("ce67451a44df279ecc73ddf948737ad988364a8675bb88b28cf80af9fc8b5b16"));
var occasionInput = object({
	kind: _enum([
		"birthday",
		"anniversary",
		"achievement",
		"other"
	]),
	label: string().max(60).nullable(),
	month: number().int().min(1).max(12),
	day: number().int().min(1).max(31).nullable(),
	companionId: id.nullable()
});
var addGuestOccasion = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(occasionInput.extend({ profileId: id })).handler(createSsrRpc("7b76b4f15471b776d63aae77ab14dede98d4a30f5078f6504dd73a870c0ad5a5"));
var getStay = createServerFn({ method: "GET" }).validator(object({ token })).handler(createSsrRpc("913f2c3bfc30e3f2e5dc8e4ba4d80b162148e9e0dbc83f47fa7f23bcccd834cb"));
var recordStayView = createServerFn({ method: "POST" }).validator(object({
	token,
	source: touchpoint
})).handler(createSsrRpc("d5512689bf8a39527cf4ee62fa0277df60d3e2918b45b9e6a5baacbefbf78d88"));
var purchaseOffer = createServerFn({ method: "POST" }).validator(object({
	token,
	offerId: id,
	qty: number().int().min(1).max(14),
	forTime: string().max(8).optional(),
	source: touchpoint
})).handler(createSsrRpc("239081f157676747d342000e32b55dd13093091740bf20f98a203013d6911d1a"));
var startCheckin = createServerFn({ method: "POST" }).validator(object({
	token,
	source: captureSource
})).handler(createSsrRpc("ac6a799d19eee88353c19c408e4044f8250b98c6abcc95da7eec3ef6db9b94a5"));
var checkinStep = createServerFn({ method: "POST" }).validator(object({
	token,
	step: _enum(["celebration", "party"]),
	source: captureSource
})).handler(createSsrRpc("0688b094825bfa89b977a6f74563d5cd4c9e5c3dcbee487d5f0be7c6bb7f5d19"));
var sendCheckinCode = createServerFn({ method: "POST" }).validator(object({
	token,
	channel: _enum(["email", "whatsapp"]),
	value: string().trim().min(5).max(200),
	source: captureSource
})).handler(createSsrRpc("325a259afd1c9c0c06b1286ca19fec58fba47b9b5280a2d44935b9c843c1f010"));
var verifyCheckinCode = createServerFn({ method: "POST" }).validator(object({
	token,
	verificationId: id,
	code: string().trim().min(4).max(12),
	source: captureSource
})).handler(createSsrRpc("e02fd2fdd5b86f3d574498ab7e609095ba418ac09d677819f85d31ad1f1530f0"));
var partyMember = union([object({
	relation: _enum([
		"partner",
		"parent",
		"sibling",
		"friend",
		"colleague",
		"other"
	]),
	firstName: string().trim().min(1).max(40)
}), object({
	relation: literal("child"),
	ageBand: _enum([
		"0-2",
		"3-12",
		"13-17"
	])
})]);
var completeCheckin = createServerFn({ method: "POST" }).validator(object({
	token,
	source: captureSource,
	ticket: string().max(64).nullable(),
	eta: string().max(5),
	celebration: object({
		kind: _enum([
			"birthday",
			"anniversary",
			"honeymoon",
			"achievement",
			"other"
		]),
		whose: _enum([
			"me",
			"partner",
			"someone"
		]),
		month: number().int().min(1).max(12).nullable(),
		day: number().int().min(1).max(31).nullable()
	}).nullable(),
	party: array(partyMember).max(8),
	consents: object({
		marketing_email: boolean(),
		marketing_whatsapp: boolean(),
		profile_memory: boolean()
	}),
	holidays: array(string().max(30)).max(12)
})).handler(createSsrRpc("1bd6e17c4f2408addcfb9940a60f81f3fc98ea0a29d89bd3f2bb58e4fbff1a30"));
var requestPreferenceLink = createServerFn({ method: "POST" }).validator(object({
	token,
	origin
})).handler(createSsrRpc("1f7d0a027e68fcee8004685a0f57aa335f3b884cd00e48f97ce1db186564b5c0"));
var getPreferences = createServerFn({ method: "GET" }).validator(object({ token: string().min(10).max(64) })).handler(createSsrRpc("6c14355976ba9ea29ccde4f718f53600bebd566211a8634350374ee89de38fb1"));
var updatePreferences = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	changes: object({
		marketing_email: boolean().optional(),
		marketing_whatsapp: boolean().optional(),
		profile_memory: boolean().optional()
	})
})).handler(createSsrRpc("50fa145fa4073297b8b7493db33c0ac9eadf69cadf05f0045fb6fef77a83f7dc"));
var prefAddOccasion = createServerFn({ method: "POST" }).validator(occasionInput.extend({ token: string().min(10).max(64) })).handler(createSsrRpc("8fc0df752e0d913f54d05bec3a0183ff3e5f9efd8da411e3c7adb43ec7ff1b78"));
var prefRemoveOccasion = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	occasionId: id
})).handler(createSsrRpc("2d4f7264fc4f2459357ee7035247276b797b201944bd7cd614adcf980bbf8109"));
var prefRemoveCompanion = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	companionId: id
})).handler(createSsrRpc("d396bc2b687216c429fcf7b3328e33bf1fdaf300ad317284fa7afa32bb4bc6e4"));
var prefSetHolidays = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	holidays: array(string().max(30)).max(12)
})).handler(createSsrRpc("9a2f5b87cb046b1775cbdee1d4e8108471270c173f54cc2ae497dc8aa8b46af5"));
var prefExport = createServerFn({ method: "POST" }).validator(object({ token: string().min(10).max(64) })).handler(createSsrRpc("bdc0ca3502e5364a756bf76b652e3d31d1ffefa5ddf2e425a96c948c8f9a554a"));
var prefErase = createServerFn({ method: "POST" }).validator(object({
	token: string().min(10).max(64),
	confirm: literal("DELETE")
})).handler(createSsrRpc("c4cf51e1831de7d1d4b1cdddd81cb957abcd6a5e0d96e4355bcd85493a2d59cc"));
var getQrHotel = createServerFn({ method: "GET" }).validator(object({ code: string().min(1).max(64) })).handler(createSsrRpc("c2257585c8f2fe8c845c2614ebf1722ff53564687644423552d6adab7a6493ec"));
var findQrBooking = createServerFn({ method: "POST" }).validator(object({
	code: string().min(1).max(64),
	lastName: string().trim().min(2).max(60),
	bookingRef: string().trim().min(4).max(40)
})).handler(createSsrRpc("73512983923880c972921de3ef375982b7131185b45d0a7edbc0e8f7b8bb253b"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/session-DPqig8sv.js
/**
* Client-side helpers for routes that need a signed-in staff member.
* Server functions throw "Unauthorized" (signed out) or "No hotel yet"; these
* turn that into the right redirect.
*/
function isUnauthorized(err) {
	return err instanceof Error && (err.message === "Unauthorized" || err.status === 401);
}
function toLogin(next) {
	return redirect({
		to: "/login",
		search: { next }
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-CoWk33e6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var styles_default = "/assets/styles-qtWU7fbu.css";
var APP_NAME = "Staylift";
var Route$25 = createRootRoute({
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
var $$splitComponentImporter$22 = () => import("./routes-Ds9c8u69.mjs");
var Route$24 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$22, "component") });
var $$splitComponentImporter$21 = () => import("./desk-D7FwGqWA.mjs");
/**
* Front-desk tablet. Staff pick the arriving guest, hand over the tablet, and
* the guest runs the same check-in step they'd see on their phone (source:
* desk_tablet). When they finish, the screen returns to the arrivals list.
*/
var Route$23 = createFileRoute("/desk")({
	loader: async () => {
		try {
			return await getDeskArrivals({ data: {} });
		} catch (err) {
			if (isUnauthorized(err)) throw toLogin("/desk");
			if (err instanceof Error && err.message === "No hotel yet") throw redirect({ to: "/onboarding" });
			throw err;
		}
	},
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./hotel-aJ5tHqi9.mjs");
var Route$22 = createFileRoute("/hotel")({
	loader: async ({ location }) => {
		try {
			const ctx = await getHotelContext();
			if (ctx.kind === "onboarding") throw redirect({ to: "/onboarding" });
			return ctx;
		} catch (err) {
			if (isUnauthorized(err)) throw toLogin(location.href);
			throw err;
		}
	},
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./login-bPRMpBh1.mjs");
/** Only same-site paths, so a crafted ?next= can't bounce a fresh session elsewhere. */
var Route$21 = createFileRoute("/login")({
	validateSearch: (search) => ({
		next: typeof search.next === "string" ? search.next : void 0,
		mode: search.mode === "signup" ? "signup" : void 0
	}),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./onboarding-ChSG7Opd.mjs");
var Route$20 = createFileRoute("/onboarding")({
	loader: async () => {
		try {
			const ctx = await getHotelContext();
			if (ctx.kind === "ok") throw redirect({ to: "/hotel" });
			return ctx;
		} catch (err) {
			if (isUnauthorized(err)) throw toLogin("/onboarding");
			throw err;
		}
	},
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./roi-CNlFBanH.mjs");
var Route$19 = createFileRoute("/roi")({
	validateSearch: (search) => {
		const out = {};
		for (const [k, v] of Object.entries(search)) if (typeof v === "string" || typeof v === "number") out[k] = v;
		return out;
	},
	head: () => ({ meta: [{ title: "ROI calculator · Staylift" }, {
		name: "description",
		content: "What Staylift is worth to an independent hotel after incrementality, card fees and our price."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./c._code-CLO1uteU.mjs");
/** The desk QR lands here: the guest finds their booking with last name + reference. */
var Route$18 = createFileRoute("/c/$code")({
	loader: ({ params }) => getQrHotel({ data: { code: params.code } }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./hotel-hVsQpDgk.mjs");
var Route$17 = createFileRoute("/hotel/")({
	loader: async () => {
		const [data, extras] = await Promise.all([getDashboard(), getOverviewExtras()]);
		return {
			data,
			extras
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./analytics-CVSHbuGX.mjs");
var Route$16 = createFileRoute("/hotel/analytics")({
	loader: async () => {
		const [analytics, dash, extras] = await Promise.all([
			getAnalytics(),
			getDashboard(),
			getOverviewExtras()
		]);
		return {
			analytics,
			dash,
			extras
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var $$splitComponentImporter$13 = () => import("./audit-BHoICoer.mjs");
var Route$15 = createFileRoute("/hotel/audit")({
	validateSearch: (s) => ({ action: typeof s.action === "string" && s.action ? s.action.slice(0, 40) : void 0 }),
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => getAuditLog({ data: { action: deps.action } }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./automation-3zC__vq3.mjs");
var Route$14 = createFileRoute("/hotel/automation")({
	loader: async () => {
		const [recipes, offerData, messages] = await Promise.all([
			listRecipes(),
			listOffers(),
			listMessages()
		]);
		return {
			recipes,
			offers: offerData.offers,
			messages
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./fulfillment-1pn0HIS5.mjs");
var Route$13 = createFileRoute("/hotel/fulfillment")({
	loader: async () => {
		const [orders, book, offerData] = await Promise.all([
			listFulfillment(),
			listReservations({ data: {} }),
			listOffers()
		]);
		return {
			...orders,
			book,
			offers: offerData.offers
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./offers-BmHd78Ia.mjs");
var Route$12 = createFileRoute("/hotel/offers")({
	loader: () => listOffers(),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./reservations-DCi79msT.mjs");
var Route$11 = createFileRoute("/hotel/reservations")({
	validateSearch: (search) => search.history === true || search.history === "true" || search.history === 1 ? { history: true } : {},
	loaderDeps: ({ search }) => ({ history: Boolean(search.history) }),
	loader: async ({ deps }) => {
		const [book, rooms] = await Promise.all([listReservations({ data: { history: deps.history } }), listRoomTypes()]);
		return {
			...book,
			rooms,
			history: deps.history
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./roi-CROc6R1K.mjs");
var Route$10 = createFileRoute("/hotel/roi")({
	loader: () => getMeasuredRoi(),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./settings-Bg_b31Uq.mjs");
var Route$9 = createFileRoute("/hotel/settings")({
	loader: () => getSettings({ data: {} }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./team-Bz2zze8k.mjs");
var Route$8 = createFileRoute("/hotel/team")({
	loader: () => getTeam(),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./invite._token-DlfF6sHN.mjs");
var Route$7 = createFileRoute("/invite/$token")({
	loader: ({ params }) => getInvitation({ data: { token: params.token } }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./p._token-D7YR2j4k.mjs");
var $$splitErrorComponentImporter = () => import("./p._token-DG_ICjR7.mjs");
/**
* Guest preference centre. Reached only by the link the guest got at check-in
* (token is hashed server-side; a newer link retires older ones). No account.
*/
var Route$6 = createFileRoute("/p/$token")({
	loader: ({ params }) => getPreferences({ data: { token: params.token } }),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("../_token-DNmEc7RU.mjs");
var Route$5 = createFileRoute("/stay/$token")({
	validateSearch: (search) => {
		const out = {};
		if (search.src === "email" || search.src === "whatsapp" || search.src === "sms" || search.src === "qr") out.src = search.src;
		if (typeof search.offer === "string" && search.offer.length <= 64) out.offer = search.offer;
		return out;
	},
	loader: ({ params }) => getStay({ data: { token: params.token } }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var Route$4 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
/**
* Daily retention run across every hotel (Vercel Cron, see vercel.json).
* Vercel sends `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set,
* the endpoint refuses. Opening the hotel also runs the purge once a day, so
* this only matters for hotels nobody opens.
*/
var Route$3 = createFileRoute("/api/cron/retention")({ server: { handlers: { GET: async ({ request }) => {
	const secret = process.env.CRON_SECRET?.trim();
	if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
	const { systemSql, withTenant } = await import("./tenant-db-Y6e8Uu3w.mjs");
	const { runPurge } = await import("./guests-DZdeWPp9.mjs");
	const hotels = await (await systemSql())`select id from properties order by id`;
	const results = {};
	for (const h of hotels) try {
		results[h.id] = await withTenant(h.id, (sql) => runPurge(sql));
	} catch (err) {
		results[h.id] = { error: err instanceof Error ? err.message : String(err) };
	}
	return Response.json({
		ranAt: (/* @__PURE__ */ new Date()).toISOString(),
		hotels: results
	});
} } } });
var $$splitComponentImporter$2 = () => import("./email._reservationId-sLIvJqBe.mjs");
var Route$2 = createFileRoute("/hotel/email/$reservationId")({
	loader: ({ params }) => getBookingEmail({ data: {
		reservationId: params.reservationId,
		origin: typeof window === "undefined" ? void 0 : window.location.origin
	} }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./guests.index-CDGV6Z3i.mjs");
var Route$1 = createFileRoute("/hotel/guests/")({
	validateSearch: (s) => ({
		q: typeof s.q === "string" && s.q ? s.q.slice(0, 120) : void 0,
		filter: s.filter === "marketable" || s.filter === "returning" || s.filter === "occasions" ? s.filter : void 0
	}),
	loaderDeps: ({ search }) => search,
	loader: ({ deps }) => listGuests({ data: {
		search: deps.q,
		filter: deps.filter
	} }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./guests._profileId-B0R5avRx.mjs");
var Route = createFileRoute("/hotel/guests/$profileId")({
	loader: ({ params }) => getGuest({ data: { profileId: params.profileId } }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$24.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$25
});
var DeskRoute = Route$23.update({
	id: "/desk",
	path: "/desk",
	getParentRoute: () => Route$25
});
var HotelRoute = Route$22.update({
	id: "/hotel",
	path: "/hotel",
	getParentRoute: () => Route$25
});
var LoginRoute = Route$21.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$25
});
var OnboardingRoute = Route$20.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$25
});
var RoiRoute = Route$19.update({
	id: "/roi",
	path: "/roi",
	getParentRoute: () => Route$25
});
var CCodeRoute = Route$18.update({
	id: "/c/$code",
	path: "/c/$code",
	getParentRoute: () => Route$25
});
var HotelIndexRoute = Route$17.update({
	id: "/",
	path: "/",
	getParentRoute: () => HotelRoute
});
var HotelAnalyticsRoute = Route$16.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => HotelRoute
});
var HotelAuditRoute = Route$15.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => HotelRoute
});
var HotelAutomationRoute = Route$14.update({
	id: "/automation",
	path: "/automation",
	getParentRoute: () => HotelRoute
});
var HotelFulfillmentRoute = Route$13.update({
	id: "/fulfillment",
	path: "/fulfillment",
	getParentRoute: () => HotelRoute
});
var HotelOffersRoute = Route$12.update({
	id: "/offers",
	path: "/offers",
	getParentRoute: () => HotelRoute
});
var HotelReservationsRoute = Route$11.update({
	id: "/reservations",
	path: "/reservations",
	getParentRoute: () => HotelRoute
});
var HotelRoiRoute = Route$10.update({
	id: "/roi",
	path: "/roi",
	getParentRoute: () => HotelRoute
});
var HotelSettingsRoute = Route$9.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => HotelRoute
});
var HotelTeamRoute = Route$8.update({
	id: "/team",
	path: "/team",
	getParentRoute: () => HotelRoute
});
var InviteTokenRoute = Route$7.update({
	id: "/invite/$token",
	path: "/invite/$token",
	getParentRoute: () => Route$25
});
var PTokenRoute = Route$6.update({
	id: "/p/$token",
	path: "/p/$token",
	getParentRoute: () => Route$25
});
var StayTokenRoute = Route$5.update({
	id: "/stay/$token",
	path: "/stay/$token",
	getParentRoute: () => Route$25
});
var ApiAuthSplatRoute = Route$4.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$25
});
var ApiCronRetentionRoute = Route$3.update({
	id: "/api/cron/retention",
	path: "/api/cron/retention",
	getParentRoute: () => Route$25
});
var HotelEmailReservationIdRoute = Route$2.update({
	id: "/email/$reservationId",
	path: "/email/$reservationId",
	getParentRoute: () => HotelRoute
});
var HotelGuestsIndexRoute = Route$1.update({
	id: "/guests/",
	path: "/guests/",
	getParentRoute: () => HotelRoute
});
var HotelRouteChildren = {
	HotelAnalyticsRoute,
	HotelAuditRoute,
	HotelAutomationRoute,
	HotelFulfillmentRoute,
	HotelOffersRoute,
	HotelReservationsRoute,
	HotelRoiRoute,
	HotelSettingsRoute,
	HotelTeamRoute,
	HotelIndexRoute,
	HotelEmailReservationIdRoute,
	HotelGuestsProfileIdRoute: Route.update({
		id: "/guests/$profileId",
		path: "/guests/$profileId",
		getParentRoute: () => HotelRoute
	}),
	HotelGuestsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	DeskRoute,
	HotelRoute: HotelRoute._addFileChildren(HotelRouteChildren),
	LoginRoute,
	OnboardingRoute,
	RoiRoute,
	CCodeRoute,
	InviteTokenRoute,
	PTokenRoute,
	StayTokenRoute,
	ApiAuthSplatRoute,
	ApiCronRetentionRoute
};
var routeTree = Route$25._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { revokeInvite as $, decideOrder as A, mergeGuests as B, Route$23 as C, checkinStep as D, changeMemberRole as E, getStay as F, prefRemoveOccasion as G, prefErase as H, ingestReservation as I, purchaseOffer as J, prefSetHolidays as K, inviteMember as L, eraseReservation as M, exportGuest as N, completeCheckin as O, findQrBooking as P, revealGuestContact as Q, joinDemoHotel as R, Route$22 as S, addGuestOccasion as T, prefExport as U, prefAddOccasion as V, prefRemoveCompanion as W, removeTeamMember as X, recordStayView as Y, requestPreferenceLink as Z, Route$17 as _, Route$5 as a, startCheckin as at, Route$20 as b, Route$8 as c, toggleRecipe as ct, Route$11 as d, verifyCheckinCode as dt, runRetentionNow as et, Route$12 as f, withdrawGuestConsent as ft, Route$16 as g, Route$15 as h, Route$2 as i, sendStayLink as it, eraseGuest as j, createHotel as k, Route$9 as l, updateEconomics as lt, Route$14 as m, Route as n, sendBookingEmail as nt, Route$6 as o, switchHotel as ot, Route$13 as p, previewEmailParse as q, Route$1 as r, sendCheckinCode as rt, Route$7 as s, toggleOffer as st, router_exports as t, saveSettings as tt, Route$10 as u, updatePreferences as ut, Route$18 as v, acceptInvite as w, Route$21 as x, Route$19 as y, logDeskSale as z };
