// GIAI ĐOẠN 1 — DỰNG TỔ CHỨC (chạy lại được: có thể chạy nhiều lần mà không tạo trùng)
// Kịch bản: admin dựng phòng ban, người dùng, nhóm quyền, vai trò, chức danh, dự án, ban chỉ huy, tổ đội.
// ⛔ KHÔNG xoá dữ liệu sẵn có. Mọi thứ mới mang tiền tố "E2E".
import { writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const MK = "Vn@2026Test"; // ≥8 ký tự, có hoa/thường/số/ký tự đặc biệt (ràng buộc biểu mẫu create_user)
const BC = [];

tieuDe("GIAI ĐOẠN 1 — DỰNG TỔ CHỨC");
await login("admin", "Admin123456@");
const bs0 = await bootstrap();
ghi({ giaiDoan: 1, buoc: "truoc-khi-chay", projects: bs0.projects.length, teams: bs0.teams.length, users: bs0.users.length, units: bs0.organizationUnits.length });

// ── 1.1 KIỂM KÊ PHÒNG BAN ────────────────────────────────────────────────────
console.log("\n[1.1] Phòng ban / đơn vị sẵn có:");
for (const u of bs0.organizationUnits) console.log("      " + u.code + " · " + u.name + " [" + u.unitType + "]" + (u.active === false ? " (NGUNG)" : ""));
const donVi = bs0.organizationUnits.filter((u) => u.active !== false && u.unitType !== "company");
const theoTen = (tu) => donVi.find((u) => String(u.name).toLowerCase().includes(tu.toLowerCase()));
const mapPb = {
  "Dự án": theoTen("Dự án")?.id || null,
  "Kế hoạch": theoTen("Kế hoạch")?.id || null,
  "Kế toán": theoTen("Kế toán")?.id || null,
  "Ban giám đốc": theoTen("Ban giám đốc")?.id || null,
  "Nhân sự": theoTen("Nhân sự")?.id || null,
  "Hành chính Pháp chế": theoTen("Hành chính")?.id || null,
};
console.log("      ánh xạ: " + Object.entries(mapPb).map(([k, v]) => k + "→" + (v ? "OK" : "THIẾU")).join(" · "));

// ⭐ Kịch bản yêu cầu có phòng "Nhân sự" — hiện KHÔNG có, HR đang gộp trong "Hành chính Pháp chế".
let pbNs = mapPb["Nhân sự"];
if (!pbNs) {
  await buoc("save_organization_unit PHÒNG NHÂN SỰ", () => coThat("save_organization_unit", {
    code: "NS", name: "Phòng Nhân sự", unitType: "department", description: "Tạo cho kịch bản kiểm thử E2E — trước đó nhân sự nằm gộp trong Hành chính Pháp chế",
  }), BC);
}

// ── 1.2 VAI TRÒ + NHÓM QUYỀN ────────────────────────────────────────────────
console.log("\n[1.2] Vai trò (roleCatalog) và nhóm quyền (businessRoleGroups):");
for (const r of bs0.roleCatalog) console.log("      vai " + r.code + " · " + r.name);
console.log("      nhóm quyền: " + bs0.businessRoleGroups.map((g) => g.code).join(", "));

// ── 1.3 DỰ ÁN + KHO ──────────────────────────────────────────────────────────
console.log("\n[1.3] Tạo dự án E2E + kho công trường:");
let bs = await bootstrap();
let duAn = bs.projects.find((p) => String(p.code) === "E2E-DA-01");
if (duAn) console.log("      [CO ] dự án E2E-DA-01 đã có (" + duAn.id + ")");
else {
  await buoc("create_project E2E-DA-01", () => coThat("create_project", {
    code: "E2E-DA-01", name: "Dự án chuẩn hoá quy trình E2E",
    contractNo: "HD-E2E-DA-01", contractName: "Hợp đồng E2E kiểm thử toàn hệ thống",
    createWarehouse: true, warehouseCode: "KHO-E2E-01", warehouseName: "Kho công trường E2E Đà Nẵng",
  }), BC);
  bs = await bootstrap();
  duAn = bs.projects.find((p) => String(p.code) === "E2E-DA-01");
}
if (!duAn) { console.log("      [LOI] không tạo được dự án — dừng."); process.exitCode = 1; }
console.log("      dự án = " + (duAn?.id || "KHÔNG CÓ"));
const khoSite = bs.warehouses.find((w) => w.projectId === duAn?.id && w.type === "site");
console.log("      kho công trường = " + (khoSite?.code || "KHÔNG CÓ") + " (" + (khoSite?.id || "") + ")");

// ── 1.4 BAN CHỈ HUY CÔNG TRƯỜNG ──────────────────────────────────────────────
console.log("\n[1.4] Tạo Ban chỉ huy công trường cho dự án:");
let bch = bs.organizationUnits.find((u) => u.projectId === duAn?.id && u.unitType === "site_command");
if (bch) console.log("      [CO ] " + bch.code + " · " + bch.name);
else {
  await buoc("save_organization_unit BCH-E2E-01", () => coThat("save_organization_unit", {
    code: "E2E-BCH-01", name: "Ban chỉ huy công trường E2E Đà Nẵng",
    unitType: "site_command", projectId: duAn.id,
    description: "Ban chỉ huy công trường tạo cho kịch bản kiểm thử E2E",
  }), BC);
  bs = await bootstrap();
  bch = bs.organizationUnits.find((u) => u.projectId === duAn?.id && u.unitType === "site_command");
}
console.log("      BCH = " + (bch?.id || "KHÔNG CÓ"));

// ── 1.5 TỔ ĐỘI ───────────────────────────────────────────────────────────────
console.log("\n[1.5] Tạo 2 tổ đội công trường (bắt buộc có `trade` = Hạng mục/chuyên môn):");
for (const td of [["E2E-TD01", "Tổ đội 1 — Xây dựng kết cấu", "Xây dựng"], ["E2E-TD02", "Tổ đội 2 — Hoàn thiện", "Hoàn thiện"]]) {
  const daCo = bs.teams.find((t) => t.projectId === duAn?.id && t.code === td[0]);
  if (daCo) { console.log("      [CO ] " + daCo.code); continue; }
  await buoc("create_project_team " + td[0], () => coThat("create_project_team", {
    code: td[0], name: td[1], trade: td[2], projectId: duAn.id,
  }), BC);
}

// ── 1.6 NGƯỜI DÙNG ────────────────────────────────────────────────────────────
console.log("\n[1.6] Tạo người dùng E2E (vai trò phải có thật trong roleCatalog):");
const boNguoi = [
  { code: "E2E-DA", ten: "E2E Kỹ sư Dự án", vai: "ksda", pb: "Dự án", username: "e2e.ksda" },
  { code: "E2E-KH", ten: "E2E Trưởng phòng Kế hoạch", vai: "kh_truong", pb: "Kế hoạch", username: "e2e.kh" },
  { code: "E2E-KT", ten: "E2E Kế toán", vai: "accountant", pb: "Kế toán", username: "e2e.kt" },
  { code: "E2E-NS", ten: "E2E Nhân viên Nhân sự", vai: "hr", pb: "Nhân sự", username: "e2e.ns" },
  { code: "E2E-BGD", ten: "E2E Giám đốc", vai: "director", pb: "Ban giám đốc", username: "e2e.bgd" },
  { code: "E2E-BCH", ten: "E2E Chỉ huy trưởng", vai: "cht", pb: "__BCH__", username: "e2e.cht" },
  { code: "E2E-TK", ten: "E2E Thủ kho", vai: "thu_kho", pb: "Dự án", username: "e2e.tk" },
];
bs = await bootstrap();
if (mapPb["Nhân sự"] === null) mapPb["Nhân sự"] = bs.organizationUnits.find((u) => u.code === "NS")?.id || mapPb["Hành chính Pháp chế"];
for (const n of boNguoi) {
  if (bs.users.some((u) => u.username === n.username)) { console.log("      [CO ] " + n.username); continue; }
  const orgId = n.pb === "__BCH__" ? (bch?.id || mapPb["Dự án"]) : mapPb[n.pb];
  if (!orgId) { console.log("      [BO QUA] " + n.username + " — chưa có đơn vị " + n.pb); continue; }
  await buoc("create_user " + n.username, () => coThat("create_user", {
    employeeCode: n.code, fullName: n.ten, username: n.username, email: n.username + "@vntech.vn",
    role: n.vai, organizationUnitId: orgId, password: MK, projectIds: duAn ? [duAn.id] : [],
  }), BC);
}

// ── 1.7 KIỂM CHỨNG THẬT ──────────────────────────────────────────────────────
const bs4 = await bootstrap();
console.log("\n[1.7] Kiểm chứng (đo lại từ máy chủ, không tin vào báo cáo của chính lệnh ghi):");
const dong = (ten, khoa) => {
  const a = bs0[khoa]?.length ?? 0, b = bs4[khoa]?.length ?? 0;
  console.log("      " + ten.padEnd(20) + String(a).padStart(4) + "  ->  " + String(b).padStart(4) + "   " + (b > a ? "+" + (b - a) : b < a ? "-" + (a - b) : "khong doi"));
};
dong("organizationUnits", "organizationUnits"); dong("users", "users"); dong("projects", "projects");
dong("teams", "teams"); dong("warehouses", "warehouses");

const trang = {
  duAn: duAn?.id || null, duAnCode: duAn?.code || null,
  khoSite: khoSite?.id || null, khoSiteCode: khoSite?.code || null,
  bch: bch?.id || null, donVi: mapPb, matKhau: MK,
  users: bs4.users.filter((u) => String(u.username).startsWith("e2e.") && u.username !== "e2e.diag")
    .map((u) => ({ id: u.id, username: u.username, vai: u.role, donVi: u.organizationUnitId, ten: u.fullName })),
  // ⓘ Mã tổ đội do MÁY CHỦ tự sinh thành `<MãDự án>-<MãTổĐội>` (E2E-DA-01-E2E-TD01) ⇒ lọc theo tên/mã dự án, không theo tiền tố mã tổ đội.
  teams: bs4.teams.filter((t) => t.projectId === duAn?.id).map((t) => ({ id: t.id, code: t.code, ten: t.name, kho: t.warehouseId })),
  khoTeam: bs4.warehouses.filter((w) => w.projectId === duAn?.id && w.type === "team").map((w) => ({ id: w.id, code: w.code })),
};
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify(trang, null, 2), "utf8");
ghi({ giaiDoan: 1, buoc: "ket-thuc", duAn: trang.duAn, bch: trang.bch, soUser: trang.users.length, thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
console.log("\n  Đã lưu tools/e2e/trang-thai-01.json");
console.log("  user E2E = " + trang.users.length + " · tổ đội E2E = " + trang.teams.length);
tomTatBuoc("GIAI ĐOẠN 1", BC);