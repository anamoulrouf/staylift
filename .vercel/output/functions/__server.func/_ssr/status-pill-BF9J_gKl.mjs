import { c as statusLabel } from "./format-BLHOf1yn.mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Badge } from "./badge-CSy3-CFY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-pill-BF9J_gKl.js
var import_jsx_runtime = require_jsx_runtime();
function StatusPill({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: status === "in_house" ? "pine" : status === "departing" ? "amber" : status === "departed" ? "quiet" : "quiet",
		children: statusLabel(status)
	});
}
function ContactPill({ reachable, channels }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: reachable ? "pine" : "rose",
		children: reachable ? channels[0] ?? "Reachable" : "No channel"
	});
}
//#endregion
export { StatusPill as n, ContactPill as t };
