import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readReleaseIdentity } from "./release-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const identity = readReleaseIdentity();
await import("./preflight-source.mjs");
for (const relative of ["scripts/system-route.mjs", "VNTECH_FINGERPRINT.json", "VNTECH_PRODUCT_IDENTITY.txt", "VNTECH_FULL_W2_ID.txt"]) {
  if (!existsSync(join(root, relative))) throw new Error(`Thiếu ${relative}.`);
}
if (existsSync(join(root, "dist/server/index.js"))) await import("./validate-built-artifact.mjs");
else console.log(`SOURCE ARTIFACT: ĐẠT · ${identity.BUILD} · built-artifact sẽ kiểm tra sau build.`);
