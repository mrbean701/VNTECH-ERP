// Kiểm tra trạng thái sau khi một lượt bị gián đoạn — ⛔ KHÔNG retry mù.
import { existsSync, statSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const out = (s) => console.log("  " + s);

out("=== 1. BA SERVICE ===");
for (const port of [18081, 8787, 9000]) {
  let pid = "?";
  try {
    const r = execSync(`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -EA SilentlyContinue | Select-Object -First 1).OwningProcess"`, { encoding: "utf8" }).trim();
    pid = r || "TAT";
  } catch { pid = "TAT"; }
  out(`  :${port} -> ${pid === "TAT" ? "🔴 TAT" : "✅ PID " + pid}`);
}

out("=== 2. DU LIEU CHAY ===");
out("  .local-data            : " + (existsSync(".local-data") ? "✅ CON" : "🔴 KHONG"));
out("  ..\\_local-data-held    : " + (existsSync("..\\_local-data-held") ? "⚠ DANG CON (phai tra ve)" : "✅ da tra ve"));

out("=== 3. MA DA SUA CO TRONG NGUON ===");
const css = readFileSync("app/globals.css", "utf8");
out("  khoi CSS moi          : " + (css.includes("BINH LUAN + 3 KHUNG BANG NHAU") ? "✅ co" : "🔴 KHONG"));
out("  .approval-comment grid: " + (/\.approval-comment\{display:grid/.test(css) ? "✅ co" ? "co" : "x" : "🔴 KHONG"));
out("  align-items:stretch   : " + (css.includes("align-items:stretch!important") ? "✅ co" : "🔴 KHONG"));
out("  globals.css so dong   : " + css.split("\n").length);
const ts = readFileSync("app/page.tsx", "utf8");
out("  phong thu ?? \"\"       : " + (ts.includes('value={approvalComment ?? ""}') ? "✅ co" : "🔴 KHONG"));
out("  uu tien buoc da duyet : " + (ts.includes('approval?.status==="approved"?(approval?.approverName||"Nguoi duyet")') || ts.includes('approval?.status==="approved"?(approval?.approverName') ? "✅ co" : "KHONG ro"));

out("=== 4. BUNDLE ===");
if (existsSync("dist")) {
  out("  dist/ sua luc: " + statSync("dist").mtime.toISOString().slice(0, 16).replace("T", " "));
  // Tìm khối CSS mới trong bundle (Vite gói CSS vào file .css riêng).
  let hit = false;
  for (const f of ["dist/client/assets", "dist/client"]) {
    if (!existsSync(f)) continue;
  }
  const { readdirSync } = await import("node:fs");
  const flat = readdirSync("dist", { recursive: true }).filter((x) => String(x).endsWith(".css"));
  for (const f of flat) {
    try {
      const t = readFileSync("dist/" + String(f).replace(/\\/g, "/"), "utf8");
      if (t.includes("approval-comment") && t.includes("grid")) { out("  ✅ bundle CSS co .approval-comment: dist/" + String(f).replace(/\\/g, "/")); hit = true; break; }
    } catch {}
  }
  if (!hit) out("  ⚠ khong tim thay khoi CSS moi trong bundle (co the chua build lai)");
} else out("  🔴 KHONG CO dist/");

out("=== 5. GIT ===");
try {
  out("  HEAD  : " + execSync("git log -1 --oneline", { encoding: "utf8" }).trim());
  const st = execSync("git status --short", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  out("  thay doi chua commit: " + st.length + " tep");
  for (const s of st.slice(0, 8)) out("     " + s.slice(0, 100));
} catch (e) { out("  git loi: " + e.message); }
