import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const release = VNTECH_IDENTITY.release;
const env = {};
if (existsSync(join(root, ".env"))) {
  for (const raw of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
    const index = raw.indexOf("=");
    if (index > 0 && !raw.trim().startsWith("#")) env[raw.slice(0, index).trim()] = raw.slice(index + 1).trim();
  }
}
const port = env.VNTECH_APP_PORT || "8787";
const base = `http://127.0.0.1:${port}`;
const health = await fetch(`${base}/healthz`, { cache: "no-store", headers: { "cache-control": "no-cache" } });
const healthText = await health.text();
let data = {};
try { data = JSON.parse(healthText); } catch {}
if (!health.ok || data.build !== release.build || data.package !== release.packageId || data.uiContract !== release.uiContractId) {
  throw new Error(`SAI RUNTIME tại ${base}: ${healthText}`);
}
for (const [header, expected] of [
  ["x-vntech-build", release.build],
  ["x-vntech-package", release.packageId],
  ["x-vntech-ui-contract", release.uiContractId],
]) {
  if ((health.headers.get(header) || "") !== expected) throw new Error(`Sai header ${header}: ${health.headers.get(header) || "missing"}`);
}
const response = await fetch(`${base}/?vntech_build=full-w2`, { cache: "no-store", headers: { "cache-control": "no-cache" } });
const html = await response.text();
for (const marker of [release.build, release.packageId, release.uiContractId, release.uiGeneration]) {
  if (!html.includes(marker)) throw new Error(`HTML thật thiếu ${marker}; trình duyệt đang nhận build/instance cũ.`);
}
const ps = spawnSync("docker", ["ps", "--format", "{{.Names}}|{{.Image}}|{{.Ports}}|{{.Label \"com.docker.compose.project\"}}"], { encoding: "utf8" });
console.log(`ĐẠT: ${base} · ${release.build} · ${release.uiGeneration}`);
console.log("Container đang chạy:");
console.log(String(ps.stdout || "").trim() || "(không đọc được docker ps)");
