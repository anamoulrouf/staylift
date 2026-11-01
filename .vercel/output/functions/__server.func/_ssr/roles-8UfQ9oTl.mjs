//#region node_modules/.nitro/vite/services/ssr/assets/roles-8UfQ9oTl.js
var ROLES = [
	"owner",
	"manager",
	"front_desk"
];
var ROLE_LABEL = {
	owner: "Owner",
	manager: "Manager",
	front_desk: "Front desk"
};
var ROLE_HINT = {
	owner: "Everything, including team, contract, settings and the audit log.",
	manager: "Offers, recipes, guests, ROI and data requests. Can reveal guest contacts.",
	front_desk: "Reservations, orders, desk sales and the check-in tablet. Sees contacts masked."
};
var RANK = {
	front_desk: 1,
	manager: 2,
	owner: 3
};
function isRole(value) {
	return value === "owner" || value === "manager" || value === "front_desk";
}
function atLeast(role, min) {
	return RANK[role] >= RANK[min];
}
/** Minimum role per capability. */
var CAN = {
	viewOverview: "front_desk",
	workReservations: "front_desk",
	workOrders: "front_desk",
	runDeskTablet: "front_desk",
	viewGuests: "front_desk",
	editOffers: "manager",
	editRecipes: "manager",
	viewAnalytics: "manager",
	viewRoi: "manager",
	revealContacts: "manager",
	handleDataRequests: "manager",
	mergeProfiles: "manager",
	editContract: "owner",
	manageTeam: "owner",
	editSettings: "owner",
	viewAudit: "owner"
};
function can(role, capability) {
	return atLeast(role, CAN[capability]);
}
//#endregion
export { atLeast as a, ROLE_LABEL as i, ROLES as n, can as o, ROLE_HINT as r, isRole as s, CAN as t };
