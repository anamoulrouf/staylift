import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-CSy3-CFY.js
var import_jsx_runtime = require_jsx_runtime();
var tones = {
	quiet: "bg-cream text-stone",
	pine: "bg-moss text-pine",
	amber: "bg-amber-soft text-amber",
	rose: "bg-rose-soft text-rose"
};
function Badge({ className, tone = "quiet", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", tones[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
