import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routePath = join(root, "scripts/system-route.mjs");
const workerPath = join(root, "dist/server/index.js");
const hostingPath = join(root, "dist/.openai/hosting.json");
for (const path of [routePath, workerPath, hostingPath]) if (!existsSync(path)) throw new Error(`Built artifact thiếu: ${path}`);

const route = await readFile(routePath, "utf8");
const workerSource = await readFile(workerPath, "utf8");
for (const marker of [
  "bulk_import_projects",
  "bulk_import_users",
  "save_organization_unit",
  "verifyLicenseEnvelope",
  "row_role IN ('material','component')",
]) {
  if (!route.includes(marker)) throw new Error(`Backend source thiếu contract: ${marker}`);
}
for (const marker of [
  "bulk_import_projects",
  "bulk_import_users",
  "save_organization_unit",
  "install_license_foundation",
  "LICENSE_VERIFIED",
  "row_role IN ('material','component')",
]) {
  if (!workerSource.includes(marker)) throw new Error(`Backend bundle thiếu contract: ${marker}`);
}
JSON.parse(await readFile(hostingPath, "utf8"));
const version = (await readFile(join(root, "dist/.mep-version"), "utf8")).trim();
if (version !== VNTECH_IDENTITY_DATA.version) throw new Error(`Built version sai: ${version || "missing"}`);
const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("artifact-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerUrl.href);
if (!worker.default || typeof worker.default.fetch !== "function") throw new Error("Built server không có fetch handler.");
console.log(`BUILT ARTIFACT VALIDATION: ĐẠT · ${VNTECH_IDENTITY_DATA.release.build}`);
