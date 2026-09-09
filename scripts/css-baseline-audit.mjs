import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(root, "app/globals.css");
const pagePath = join(root, "app/page.tsx");
const css = readFileSync(cssPath, "utf8");
const page = readFileSync(pagePath, "utf8");
const byteCount = Buffer.byteLength(css, "utf8");
const lineCount = css.split(/\r?\n/).length;
const importantCount = (css.match(/!important/g) || []).length;
const beginMarker = "VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN";
const endMarker = "VNTECH_MASTER_BASELINE_CSS_R1_1_1_END";
const beginCount = css.split(beginMarker).length - 1;
const endCount = css.split(endMarker).length - 1;
const historicalMarkers = [
  "UI-only patch", "older runtime rules", "runtime audit fixes layered", "Final responsive override",
  "FULL W2 UI PASS", "VNTECH_FULL_W2_UI_REGRESSION_LOCK", "VNTECH_FULL_UI_20260907_BEGIN",
  "VNTECH_MASTER_BASELINE_CSS_R1_1_BEGIN", "VNTECH_MASTER_BASELINE_CSS_R1_1_END",
].filter((marker) => css.includes(marker));

const sourceExt = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".html"]);
const sourceParts = [];
function walkUi(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["node_modules", "dist", ".next", ".git", "tests", "scripts", "drizzle"].includes(name)) continue;
      walkUi(path);
    } else if (sourceExt.has(extname(name)) && path !== cssPath) sourceParts.push(readFileSync(path, "utf8"));
  }
}
walkUi(join(root, "app"));
const source = sourceParts.join("\n");
const dynamicPrefixes = new Set([...source.matchAll(/([A-Za-z_][\w-]*-)\$\{/g)].map((match) => match[1]));
const cssClasses = new Set([...css.matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)].map((match) => match[1]));
const deadClasses = [...cssClasses].filter((name) => !source.includes(name) && ![...dynamicPrefixes].some((prefix) => name.startsWith(prefix))).sort();
const definedVars = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const usedVars = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]));
for (const name of definedVars) if (source.includes(name)) usedVars.add(name);
const deadVars = [...definedVars].filter((name) => !usedVars.has(name)).sort();

const failures = [];
const requireClass = (name, reason) => {
  if (!new RegExp(`\\.${name}(?![A-Za-z0-9_-])`).test(css)) failures.push(`${reason}: thiếu .${name}`);
};
const requireCssProp = (block, prop, reason) => {
  if (!new RegExp(`(?:^|;)\\s*${prop}\\s*:`).test(block)) failures.push(`${reason}: thiếu ${prop}`);
};

if (beginCount !== 1 || endCount !== 1) failures.push(`canonical markers ${beginCount}/${endCount}, expected 1/1`);
if (historicalMarkers.length) failures.push(`historical markers remain: ${historicalMarkers.join(", ")}`);
if (byteCount > 400653) failures.push(`CSS size ${byteCount} > 400653 bytes (safe-clean R1.1.1 baseline)`);
if (importantCount > 4950) failures.push(`!important ${importantCount} > 4950 (safe-clean R1.1.1 baseline)`);
if (deadClasses.length) failures.push(`dead CSS classes remain: ${deadClasses.slice(0, 25).join(", ")}`);
if (deadVars.length) failures.push(`dead CSS variables remain: ${deadVars.slice(0, 25).join(", ")}`);
if (/@media\s*\([^{}]+\)\s*\{\s*\}/.test(css)) failures.push("còn @media rỗng");
const endIndex = css.indexOf(endMarker);
if (endIndex < 0 || css.slice(endIndex + endMarker.length).replace(/[\s*/]/g, "").length) failures.push("CSS declarations/content found after canonical end marker");

// Two-way dynamic contract: source-generated nav icon tones must remain styled.
const toneObject = page.match(/const NAV_ICON_TONE:[^{]+\{([\s\S]*?)\n\};/i)?.[1] || "";
const navTones = new Set([...toneObject.matchAll(/:\s*["']([a-z0-9_-]+)["']/gi)].map((m) => m[1]));
navTones.add("blue"); navTones.add("green");
const navBase = css.match(/\.nav-glyph\{([^}]*)\}/)?.[1] || "";
for (const prop of ["width", "height", "min-width", "display", "place-items", "background", "color", "border"]) requireCssProp(navBase, prop, ".nav-glyph base contract");
for (const tone of [...navTones].sort()) if (tone !== "blue") requireClass(`nav-glyph-${tone}`, `NAV_ICON_TONE ${tone}`);

for (const tone of ["plan", "project", "finance", "legal"]) {
  requireClass(`nav-subgroup-${tone}`, `department subgroup ${tone}`);
  requireClass(`nav-child-dept-${tone}`, `department child ${tone}`);
}
for (const status of ["exact", "review", "not_found", "manual"]) requireClass(`request-match-${status}`, `request match ${status}`);
for (const status of ["already_mapped", "exact", "very_high", "high", "review", "low", "not_found", "conflict"]) requireClass(`mapping-status-${status}`, `mapping status ${status}`);
for (const density of ["normal", "comfortable", "compact"]) requireClass(`density-${density}`, `density ${density}`);

// BOQ dynamically emits boq-row-${role}. Some roles intentionally inherit neutral table styling.
const backendRoleSet = readFileSync(join(root, "scripts/system-route.mjs"), "utf8").match(/allowedRoles=new Set\(\[([^\]]+)\]\)/)?.[1] || "";
const boqRoles = new Set([...backendRoleSet.matchAll(/["']([a-z0-9_-]+)["']/gi)].map((m) => m[1]));
const intentionallyNeutralBoqRoles = new Set(["material", "heading", "description"]);
for (const role of boqRoles) if (!intentionallyNeutralBoqRoles.has(role)) requireClass(`boq-row-${role}`, `BOQ row role ${role}`);
for (const requiredRole of ["material", "component", "section", "system", "group", "heading", "description", "subtotal", "note"]) {
  if (!boqRoles.has(requiredRole)) failures.push(`backend BOQ role contract thiếu ${requiredRole}`);
}

if (failures.length) {
  console.error(`CSS BASELINE AUDIT: KHÔNG ĐẠT · ${failures.join(" · ")}`);
  process.exit(1);
}
console.log(`CSS BASELINE AUDIT: ĐẠT · ${lineCount} lines · ${byteCount} bytes · ${importantCount} !important · dead classes=0 · dead vars=0 · dynamic contracts=PASS · empty media=0 · historical patch markers=0`);
