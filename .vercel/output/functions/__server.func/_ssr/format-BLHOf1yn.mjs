//#region node_modules/.nitro/vite/services/ssr/assets/format-BLHOf1yn.js
function money(cents, opts) {
	const value = cents / 100;
	if (opts?.compact && Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}k`;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: value % 1 === 0 ? 0 : 2
	}).format(value);
}
function formatDate(iso) {
	const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
	const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC"
	}).format(date);
}
function formatDateLong(iso) {
	const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
	const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		timeZone: "UTC"
	}).format(date);
}
function stayRange(arrival, departure) {
	return `${formatDate(arrival)} → ${formatDate(departure)}`;
}
function priceHint(unit) {
	switch (unit) {
		case "night": return "/night";
		case "person": return "/guest";
		case "person_night": return "/guest / morning";
		default: return "";
	}
}
function statusLabel(status) {
	switch (status) {
		case "in_house": return "In house";
		case "departing": return "Departing";
		case "departed": return "Departed";
		default: return "Upcoming";
	}
}
function pct(n) {
	return `${(n * 100).toFixed(n * 100 >= 10 ? 0 : 1)}%`;
}
function nightsBetween(arrival, departure) {
	const a = Date.parse(`${arrival.slice(0, 10)}T00:00:00Z`);
	const b = Date.parse(`${departure.slice(0, 10)}T00:00:00Z`);
	return Math.max(1, Math.round((b - a) / 864e5));
}
var SAMPLE_CONFIRMATION = `Booking.com reservation confirmation

Reservation number: 38194421
Hotel: The Marlowe, Austin
Guest name: Sam Ortega
Check-in: 18 October 2026
Check-out: 20 October 2026
Room: Standard Queen
Number of guests: 2
Guest email: 38194421-ortega@guest.booking.com
Telephone: +1 512 555 0144

Thank you for your reservation.
`;
//#endregion
export { nightsBetween as a, statusLabel as c, money as i, stayRange as l, formatDate as n, pct as o, formatDateLong as r, priceHint as s, SAMPLE_CONFIRMATION as t };
