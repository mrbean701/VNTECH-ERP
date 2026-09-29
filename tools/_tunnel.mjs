// USER 28/09/2026 — Doc duong dan tunnel cloudflared moi nhat va kiem tra HTTP.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const dir = join(homedir(), ".cloudflared");
let found = null;
try {
  const files = readdirSync(dir).filter((n) => n.endsWith(".log") || n.endsWith(".txt"));
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  for (const n of files.slice(0, 3)) {
    const m = readFileSync(join(dir, n), "utf8").match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
    if (m && m.length) { found = m[m.length - 1]; console.log("  · nguon: " + n); break; }
  }
} catch { /* thu muc khong co */ }
console.log("  DUONG DAN: " + (found || "KHONG DOC DUOC tu log"));
if (found) {
  try {
    const r = await fetch(found, { signal: AbortSignal.timeout(30000) });
    const body = await r.text();
    console.log("  HTTP " + r.status + "  ·  " + body.length + " bytes");
  } catch (e) { console.log("  LOI: " + e.message.slice(0, 80)); }
}
