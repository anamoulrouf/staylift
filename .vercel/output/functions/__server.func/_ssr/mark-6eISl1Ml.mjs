import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mark-6eISl1Ml.js
var import_jsx_runtime = require_jsx_runtime();
function Mark({ className, wordmark = true }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-2 text-ink", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 24 24",
			className: "size-6 shrink-0",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "3",
					y: "14",
					width: "5",
					height: "7",
					rx: "1.2",
					fill: "currentColor",
					opacity: "0.45"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "9.5",
					y: "8",
					width: "5",
					height: "13",
					rx: "1.2",
					fill: "currentColor",
					opacity: "0.7"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: "16",
					y: "3",
					width: "5",
					height: "18",
					rx: "1.2",
					fill: "currentColor"
				})
			]
		}), wordmark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xl font-medium tracking-tight",
			children: "Staylift"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Staylift"
		})]
	});
}
//#endregion
export { Mark as t };
