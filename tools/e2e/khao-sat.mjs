// KHẢO SÁT — dữ liệu sẵn có trước khi tạo mới.
import { login, bootstrap, call, tieuDe } from "./client.mjs";

tieuDe("KHẢO SÁT DỮ LIỆU SẴN CÓ");

await login("admin", "Admin123456@");
const bs = await bootstrap();

const xem = (ten, khoa, n = 6) => {
  const v = bs[khoa];
  console.log("\n--- " + ten + "  (" + khoa + " = " + (Array.isArray(v) ? v.length : v) + ") ---");
  if (!Array.isArray(v) || !v.length) { console.log("    (rong)"); return; }
  for (const r of v.slice(0, n)) {
    const s = { ...r };
    for (const k of Object.keys(s)) if (typeof s[k] === "object" && s[k] !== null) s[k] = "…";
    const txt = JSON.stringify(s);
    console.log("    " + (txt.length > 300 ? txt.slice(0, 300) + "…" : txt));
  }
};

xem("SETUP", "setup", 3);
xem("USER", "user", 3);
xem("ORGANIZATION UNITS", "organizationUnits", 10);
xem("WORKFLOW DEFINITIONS", "workflowDefinitions", 5);
xem("WORKFLOW STEPS", "workflowSteps", 12);
xem("WORKFLOW STEP APPROVERS", "workflowStepApprovers", 12);
xem("PROJECTS", "projects", 4);
xem("TEAMS", "teams", 4);
xem("STAFF DIRECTORY", "staffDirectory", 4);
xem("REQUESTS (mau)", "requests", 4);
xem("USERS", "users", 4);

const demTheoTrangThai = (khoa, truong) => {
  const v = bs[khoa] || [];
  const n = {};
  for (const r of v) { const s = String(r[truong] ?? "(khong co)"); n[s] = (n[s] || 0) + 1; }
  console.log("\n--- " + khoa + " theo " + truong + " ---");
  for (const [k, c] of Object.entries(n).sort((a, b) => b[1] - a[1])) console.log("    " + String(c).padStart(4) + "  " + k);
};
demTheoTrangThai("requests", "status");
demTheoTrangThai("purchaseOrders", "status");
demTheoTrangThai("receipts", "status");
demTheoTrangThai("issues", "status");