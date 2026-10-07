// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-205): vòng đời `construction_daily_log`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_construction_daily_log` **đã thành công 13 lần** nhưng
//   ⛔ **`delete_construction_daily_log` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//   ⭐ VÀ nó có **dữ liệu CON** (`construction_daily_log_items`) ⇒ ⭐ **kiểm được TẦNG XOÁ CON** ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **NGUYÊN KHỐI, ⛔ KHÔNG LỌC** (⭐ bài học vòng 57: bộ lọc grep đã bỏ mất DÒNG GÁN):
//   `saveConstructionDailyLog`: ⚠️ `accessScope.requireProjectAccess(...)`
//     ⚠️⚠️ **CHỐT BẮT BUỘC**: `if (projectId.isEmpty() || !workDate.matches("\\d{4}-\\d{2}-\\d{2}"))`
//        ⇒ 400 «Nhật ký thi công phải có dự án và ngày **YYYY-MM-DD**.»
//        ⇒ ⭐ **`workDate` PHẢI đúng định dạng `YYYY-MM-DD`** ✓ (⭐ BẪY CHÍNH)
//     · trường: `logId` · `projectId` · `workDate` · `shift` (default `sang`) · `weather` · `workContent`
//       · `laborCount` (≥0) · `equipmentNote` · `note` · `warehouseId` · `items` (⭐ dòng ⛔ không có `itemName` bị BỎ QUA)
//     · ⭐ mỗi item: `itemName` (BẮT BUỘC) · `plannedQty`/`completedQty`/`laborHours` (**strictNonNegative** ⇒ phải gửi ≥0)
//     · ⭐ **`logNo` TỰ SINH**: `"CDL-" + mã dự án + "-" + năm + "-" + %04d(seq)` ✓
//     · ⚠️ **⛔ KHÔNG trả về `logId`** ⇒ ⭐ dùng «SO TẬP ID» ✓
//   `deleteConstructionDailyLog` — **3 CHỐT**:
//     ① ⛔ không tìm thấy ⇒ 400 «Không tìm thấy nhật ký thi công.»
//     ② ⚠️ **`status == "approved"` VÀ role ≠ admin** ⇒ 400 «Nhật ký đã duyệt; chỉ Quản trị được xóa.»
//     ③ `requireProjectAccess` ⇒ 400 «Không có quyền tại dự án này.»
//     · ⭐ `store.deleteDailyLog(logId)` — ⭐ adapter xoá CẢ `construction_daily_log_items` ✓
//
// ⭐⭐ 4 KỸ THUẬT CŨ: ĐỌC NGUYÊN KHỐI (v57) · SO TẬP ID (v55) · CHIỀU ÂM (v54) · DẤU VẾT RIÊNG (v55)
// ⭐ DỮ LIỆU THẬT: dự án `PRJ_0af3201a-…` (`E2E-DA-01`) · mảng `constructionDailyLogs` **1** ·
//   `constructionDailyLogItems` **2** ⇒ ⭐ **CẢ HAI phải về đúng** ✓ (`BootstrapDataAdapter:1692` và `:1816`)
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "constructionDailyLogs";            // ⭐ BootstrapDataAdapter:1692
const MANG_CON = "constructionDailyLogItems";    // ⭐ BootstrapDataAdapter:1816
const PRJ = "PRJ_0af3201a-22d0-4870-961a-26d367350d45";
const NGAY = "2026-12-31";                       // ⭐ đúng định dạng YYYY-MM-DD (⭐ BẪY)
const DAU_VET = "TASK-205";                      // ⭐ DẤU VẾT RIÊNG
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `construction_daily_log`");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let nkId = null, taoOk = false;

// ── ① TẠO THẬT (⭐ kèm 1 DÒNG CHI TIẾT để kiểm TẦNG XOÁ CON) ────────────────────────────
await buoc("① save_construction_daily_log (TẠO THẬT + 1 dòng chi tiết)", async () => {
  const r = await call("save_construction_daily_log", {
    projectId: PRJ, workDate: NGAY, shift: "sang", workContent: DAU_VET + " · đường thành công · sẽ xoá",
    laborCount: 1, note: DAU_VET,
    items: [{ itemName: DAU_VET + " dòng 1", plannedQty: 0, completedQty: 0, laborHours: 0, note: DAU_VET }],
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑤ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② SO TẬP ID ⇒ tìm id MỚI ──────────────────────────────────────────────────────────
  const bs1 = await bootstrap();
  const moi = [...new Set((bs1[MANG] || []).map((r) => String(r.id || "")))].filter((x) => x && !idTruoc.has(x));
  nkId = moi.length === 1 ? moi[0] : null;
  await buoc("② ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được ⇒ DỌN BẰNG SQL`);
    return `id=${nkId.slice(0, 18)}… · «${MANG}» ${d0[MANG]} → ${(bs1[MANG] || []).length} · «${MANG_CON}» ${d0[MANG_CON]} → ${(bs1[MANG_CON] || []).length}`;
  }, BC);

  if (!nkId) {
    conLai.push(DAU_VET);
    BOQUA("③…⑤ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (note LIKE '%TASK-205%')");
  } else {
    // ── ③ ⭐ CHỐT CHẶN THEO CHIỀU ÂM — id BỊA ⇒ PHẢI 400 ─────────────────────────────────
    await buoc("③ delete với ID BỊA ⇒ phải 400 «Không tìm thấy nhật ký thi công.» (CHIỀU ÂM)", async () => {
      const r = await call("delete_construction_daily_log", { logId: "CDL_KHONG-CO-THUC-THE-NAY" }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔⛔ XOÁ ĐƯỢC VỚI ID BỊA ⇒ ⭐ CHỐT TỒN TẠI KHÔNG HOẠT ĐỘNG!");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 45)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
    }, BC);

    // ── ④ XOÁ THẬT (⭐ kiểm luôn TẦNG XOÁ CON) ──────────────────────────────────────────
    await buoc("④ delete_construction_daily_log (XOÁ THẬT — ⭐ phải xoá CẢ dòng chi tiết)", async () => {
      const r = await call("delete_construction_daily_log", { logId: nkId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(DAU_VET); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑤ XOÁ LẦN 2 ⇒ PHẢI 400 ───────────────────────────────────────────────────────────
    await buoc("⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy nhật ký thi công.»", async () => {
      const r = await call("delete_construction_daily_log", { logId: nkId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑥ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
console.log(`   ⓘ «${MANG}»: ${d0[MANG]} → ${(d9[MANG] ?? "⛔")}   ·   «${MANG_CON}»: ${d0[MANG_CON]} → ${(d9[MANG_CON] ?? "⛔")}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (construction_daily_logs WHERE note LIKE '%${DAU_VET}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI construction_daily_log (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
