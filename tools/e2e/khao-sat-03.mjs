// KHẢO SÁT HIỆN TRẠNG nhóm Nhân sự — Giai đoạn 3 (chỉ ĐỌC, không ghi gì).
// ⛔ Không require, không node -e, không \uXXXX. Tiếng Việt thật.
import { login, bootstrap, tieuDe, dem, ghi } from "./client.mjs";
import { writeFileSync } from "node:fs";

await login("admin", "Admin123456@");
const bs = await bootstrap();
const out = {};

/** In mẫu N bản ghi, liệt kê ĐÚNG tên trường (key) của từng bản ghi. */
function mau(khoa, n) {
  const ds = Array.isArray(bs[khoa]) ? bs[khoa] : [];
  console.log("\n--- " + khoa + " : " + ds.length + " ban ghi ---");
  const keys = new Set();
  for (const r of ds) for (const k of Object.keys(r || {})) keys.add(k);
  console.log("  TEN TRUONG (" + keys.size + "): " + [...keys].join(", "));
  ds.slice(0, n).forEach((r, i) => console.log("  [" + (i + 1) + "] " + JSON.stringify(r)));
  return [...keys];
}

tieuDe("KHAO SAT HIEN TRANG — NHAN SU (GIAI DOAN 3)");

out.staffDirectory = mau("staffDirectory", 6);
out.hrRecords = mau("hrRecords", 6);
out.laborContracts = mau("laborContracts", 6);
out.benefitRecords = mau("benefitRecords", 6);

// ---- Danh sách TAI KHOAN ----
tieuDe("TAI KHOAN HE THONG (bs.users)");
const users = Array.isArray(bs.users) ? bs.users : [];
console.log("  Tong so tai khoan: " + users.length);
const userKeys = new Set();
for (const u of users) for (const k of Object.keys(u || {})) userKeys.add(k);
console.log("  TEN TRUONG user: " + [...userKeys].join(", "));
users.forEach((u) => console.log("  - " + [u.id, u.username, u.role, u.fullName, u.employeeCode, u.email, u.organizationUnitId, u.status].map((x) => String(x ?? "")).join(" | ")));

// ---- MOI LIEN HE ----
tieuDe("MOI LIEN HE");
const sdIds = new Set((bs.staffDirectory || []).map((u) => String(u.id)));
const hrIds = new Set((bs.hrRecords || []).map((r) => String(r.userId)));
const lcUser = new Set((bs.laborContracts || []).map((r) => String(r.userId)));
const bnUser = new Set((bs.benefitRecords || []).map((r) => String(r.userId)));
console.log("  staffDirectory      : " + sdIds.size);
console.log("  hrRecords           : " + hrIds.size);
console.log("  laborContracts      : " + bs.laborContracts.length + " (cover " + lcUser.size + " nguoi)");
console.log("  benefitRecords      : " + bs.benefitRecords.length + " (cover " + bnUser.size + " nguoi)");
const thieu = [...sdIds].filter((id) => !hrIds.has(id));
console.log("  staffDirectory CHUA CO ho so: " + thieu.length);
const ngoai = [...hrIds].filter((id) => !sdIds.has(id));
console.log("  hrRecords KHONG thuoc staffDirectory: " + ngoai.length + " -> " + ngoai.join(", "));

// ---- Tai khoan nao da co ho so / hop dong / bao hiem ----
tieuDe("MA TRAN TAI KHOAN <-> HO SO / HOP DONG / BAO HIEM");
for (const u of users) {
  const id = String(u.id);
  console.log(
    "  " + String(u.username).padEnd(18) +
    " | " + String(u.role ?? "").padEnd(12) +
    " | staff=" + (sdIds.has(id) ? "Y" : "n") +
    " hoSo=" + (hrIds.has(id) ? "Y" : "n") +
    " hopDong=" + (lcUser.has(id) ? "Y" : "n") +
    " baoHiem=" + (bnUser.has(id) ? "Y" : "n") +
    " | " + String(u.fullName ?? "")
  );
}

// ---- organizationUnits / userScopes ----
tieuDe("DON VI (bs.organizationUnits)");
for (const o of (bs.organizationUnits || [])) console.log("  " + [o.id, o.code, o.name, o.parentId].map((x) => String(x ?? "")).join(" | "));

writeFileSync("tools/e2e/khao-sat-03.json", JSON.stringify(out, null, 2), "utf8");
console.log("\n  Da luu tools/e2e/khao-sat-03.json");
ghi({ loai: "khao-sat-03", staff: sdIds.size, hr: hrIds.length, hd: bs.laborContracts.length, bh: bs.benefitRecords.length, users: users.length });
