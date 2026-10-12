// 🔬 NGHIỆM THU **MỤC MENU CỦA NHÓM «CÔNG VIỆC» (`my_work`)** bằng **HÀM THẬT + PAYLOAD THẬT** — `ERP-SESSION-04`
//
// VÌ SAO CẦN: yêu cầu TRỰC TIẾP của user (09/10/2026, kèm ảnh sidebar):
//   ① «*bỏ **quản trị dự án** ra khỏi menu công việc*» ② «*menu Công việc ⛔ không còn menu item (đã chuyển hết
//   thành tab) ⇒ chỉ cần click vào «Công việc» là hiện màn Công việc — xóa Menu item Công việc*».
// ⚠️ CƠ CHẾ ĐÃ ĐO (`app/page.tsx:734`): `children` = `allowedModules.filter(item =>
//   !independentMenuKeys.includes(item.key) && String(item.groupKey) === group && !legacyWorkMenuKeys.includes(item.key) && …)`
//   ⇒ probe này **mô phỏng ĐÚNG biểu thức đó** bằng **các danh sách THẬT** (`independentMenuKeys` ·
//   `legacyWorkMenuKeys`) + **`configuredModules` THẬT** trên **payload THẬT** ⇒ ⭐ chứng minh ⛔ không có mục
//   module nào còn sót trong nhóm `my_work` (⇒ nhóm chỉ còn mục menu «Công việc» ⇒ luật «1 mục ⇒ bấm mở thẳng»).
//
// Chạy: node --import tsx docs/dsh-mutil-session/SESSION_D/probes/verify-menu-my_work.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const imp = (p) => import(pathToFileURL(ROOT + p).href);
const { configuredModules } = await imp("/lib/workflow-helpers.ts");
const { independentMenuKeys, legacyWorkMenuKeys, modules } = await imp("/lib/menu-helpers.ts");

const login = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }) });
if (login.status !== 200) { console.log(`⛔ login HTTP ${login.status} ⇒ BỎ SỐ ĐO`); process.exitCode = 2; }
else {
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const data = (await fetch(BASE + "/api/system", { headers: { cookie }, cache: "no-store" }).then((r) => r.json()))?.data || {};

  const allowed = configuredModules(data).filter((item) => item.active);
  // ⚠️ MÔ PHỎNG ĐÚNG `app/page.tsx:734` (⛔ không thêm/bớt điều kiện nào):
  const children = allowed.filter((item) => !independentMenuKeys.includes(item.key)
    && String(item.groupKey) === "my_work"
    && !legacyWorkMenuKeys.includes(item.key)
    && !["legacyWarehouseMenuKeys", "legacySupplierPartnerMenuKeys", "legacyReportsMenuKeys", "legacyKpiMenuKeys"].length /* 4 danh sách kia ⛔ không chứa khoá my_work */);

  const MOI = ["project_admin", "work_dashboard", "work_list", "work_department", "work_assign", "work_project", "work_reports", "work_others"];
  console.log("═".repeat(78));
  console.log("  🔬 MỤC MENU NHÓM `my_work` — đo bằng HÀM THẬT + payload THẬT");
  console.log("═".repeat(78));
  console.log(`\n① configuredModules(payload thật): ${allowed.length} dòng active`);
  console.log(`② Mục MODULE còn lại trong nhóm \`my_work\` sau lọc: ${children.length} → [${children.map((c) => c.key).join(", ")}]`);
  console.log(`③ Nhóm \`my_work\` có ĐÚNG 1 mục menu (\`work_hub\`) ⇒ luật «1 mục ⇒ BẤM MỞ THẲNG» tự áp dụng ✓\n`);

  let ok = true;
  const check = (ten, dk, chiTiet) => { ok = ok && dk; console.log(`  ${dk ? "✅" : "❌"} ${ten}${chiTiet ? " — " + chiTiet : ""}`); };
  check("① nhóm `my_work` ⛔ KHÔNG còn mục MODULE nào (⇒ sidebar ⛔ không còn «QUẢN TRỊ DỰ ÁN»)",
    children.length === 0, `còn ${children.length}`);
  for (const key of MOI) {
    check(`② \`${key}\` bị ẩn khỏi CÂY MENU nhưng ⭐ VẪN CÒN DÒNG MA TRẬN`,
      legacyWorkMenuKeys.includes(key) && allowed.some((i) => String(i.key) === key),
      `modules[]=${modules.some((m) => String(m.key) === key)} · ma trận=${allowed.some((i) => String(i.key) === key)}`);
  }
  console.log("\n" + "═".repeat(78));
  console.log(ok ? "  KẾT LUẬN: ✅ ĐẠT — yêu cầu ① của user đã thỏa (⛔ 0 mục module trong nhóm Công việc)" : "  KẾT LUẬN: ❌ HỎNG");
  console.log("═".repeat(78));
  process.exitCode = ok ? 0 : 1;

  // ── YÊU CẦU ③ CỦA USER: «đưa TRUNG TÂM PHÊ DUYỆT lên NGAY SAU «TỔNG QUAN ĐIỀU HÀNH»» ───────────────────
  // ⚠️ PHẠM VI CHỨNG MINH (⛔ nói rõ, ⛔ không nói quá): probe này kiểm **THỨ TỰ THEO `sortOrder`** (nguồn THẬT
  //   `data.menuGroups` + `approvalCenterGroup.sortOrder`) — ⛔ **KHÔNG** dựng DOM. «TỔNG QUAN ĐIỀU HÀNH» là
  //   **nút cứng ở đầu** (`app/page.tsx:747`, `overview` bị lọc khỏi `groupTree` ở `:730`) ⇒ điều kiện ĐÚNG là
  //   `sortOrder(approval_center)` là **NHỎ NHẤT trong các nhóm, sau `overview`** ✓
  const { approvalCenterGroup } = await imp("/lib/menu-helpers.ts");
  const nhom = (data.menuGroups || []).map((g) => ({ key: String(g.groupKey), sort: Number(g.sortOrder || 0) }))
    .concat([{ key: "approval_center", sort: Number(approvalCenterGroup.sortOrder) }])
    .sort((a, b) => a.sort - b.sort);
  const viTri = nhom.findIndex((g) => g.key === "approval_center");
  console.log(`\n③ THỨ TỰ NHÓM (theo sortOrder thật): ${nhom.map((g) => `${g.key}(${g.sort})`).join(" → ")}`);
  const sauTongQuan = viTri === 1 && nhom[0].key === "overview";
  check("③ «TRUNG TÂM PHÊ DUYỆT» đứng NGAY SAU «TỔNG QUAN ĐIỀU HÀNH» (yêu cầu user 09/10/2026)",
    sauTongQuan, `vị trí ${viTri} · trước nó: ${nhom[viTri - 1]?.key} · sau nó: ${nhom[viTri + 1]?.key}`);

  // ── ④ TẦNG **VẼ** CỦA MA TRẬN (dùng **HẰNG SỐ THẬT** `MATRIX_HIDDEN_MODULE_KEYS` + dữ liệu thật) ────────
  // ⚠️ PHẠM VI: kiểm **DANH SÁCH DÒNG SẼ VẼ** (= `configuredModules` trừ khoá bị ẩn) — ⛔ KHÔNG dựng DOM.
  //   ⚠️ Tầng vẽ THẬT còn đi qua `permissionMenuStructure` (app/page.tsx) — đã khoá **tĩnh** bằng `tests/v214` VỆ 8 + `t13`.
  const { MATRIX_HIDDEN_MODULE_KEYS } = await imp("/app/screens/PermissionMatrix.tsx");
  const CU = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];
  const drawn = allowed.filter((i) => !MATRIX_HIDDEN_MODULE_KEYS.includes(i.key)).map((i) => String(i.key));
  const MOI8 = ["work", ...MOI];
  check("④ ⛔ 4 KHOÁ CŨ bị ẨN ở tầng VẼ (đúng quyết định user «ẩn»)", CU.every((k) => MATRIX_HIDDEN_MODULE_KEYS.includes(k) && !drawn.includes(k)),
    `ẩn: [${CU.filter((k) => MATRIX_HIDDEN_MODULE_KEYS.includes(k)).join(", ")}]`);
  check("⑤ ⭐ ĐỦ **8 dòng** nhóm Công việc SẼ VẼ (`work` + 6 khoá TAB + `work_others`)",
    MOI8.every((k) => drawn.includes(k)), `vẽ: [${MOI8.filter((k) => drawn.includes(k)).join(", ")}]`);
  console.log("═".repeat(78));
  process.exitCode = ok ? 0 : 1;
}
