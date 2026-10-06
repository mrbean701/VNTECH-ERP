// GO-LIVE 05/10/2026 — ĐỔI KỸ THUẬT: KIỂM **ĐƯỜNG THÀNH CÔNG** TRÊN **DỮ LIỆU NHÁP**.
//
// ⛔ VÌ SAO ĐỔI: kỹ thuật «id bịa» (TASK-159→164) đã phủ **66/92** action UI gọi mà chưa hề được kiểm,
//   nhưng **2 vòng gần nhất 0 bug** ⇒ tới hạn hiệu quả. Và nó có **GIỚI HẠN CỐ HỮU**: nó chỉ chứng minh
//   **«đầu vào SAI bị chặn»**, ⛔ **KHÔNG** chứng minh **«đầu vào ĐÚNG thì chạy đúng»**.
//
// ⭐ KỸ THUẬT MỚI: **VÒNG ĐỜI CRUD TRỌN VẸN TRÊN BẢN GHI NHÁP DO CHÍNH BÀI TEST TẠO**
//   `save_*` → kiểm **XUẤT HIỆN** → `set_*_status` → kiểm **ĐỔI TRẠNG THÁI** → `delete_*` → kiểm **MẤT ĐI**
//   ⇒ ⛔ an toàn tuyệt đối (chỉ đụng bản ghi của mình) mà kiểm được **CẢ 3 action** ở **đường thành công**.
//
// ⛔ KHOÁ PAYLOAD đọc từ mã UI: `page.tsx` gọi `save_system_level` với
//   `{levelId?, code, name, description, rank, sortOrder, autoGrantAll, canSkipLevels}`.
import { login, bootstrap, call, ghi } from "./client.mjs";

const MK_ADMIN = "Admin123456@";
const MA_TMP = `E2E_TMP_${Date.now().toString().slice(-6)}`;

console.log("=".repeat(84));
console.log("GO-LIVE — VÒNG ĐỜI CRUD TRỌN VẸN TRÊN DỮ LIỆU NHÁP (kiểm ĐƯỜNG THÀNH CÔNG)");
console.log("=".repeat(84));

await login("admin", MK_ADMIN);
const truoc = await bootstrap();
const dsTruoc = truoc.systemLevelCatalog || [];
console.log(`   mã nháp: ${MA_TMP}`);
console.log(`   TRƯỚC: systemLevelCatalog = ${dsTruoc.length} dòng`);

const ds = (arr, code) => (arr || []).find((x) => String(x.code).toLowerCase() === String(code).toLowerCase());
// ⛔⛔ BÀI HỌC 05/10/2026 (từ chính vòng này): mã `business_scope` bị **CHUẨN HOÁ THÀNH CHỮ THƯỜNG**
//   bởi backend (kiểm tra của sản phẩm ghi rõ «Mã phạm vi gồm 2–40 ký tự **a-z**, số, gạch dưới»).
//   Tôi gửi `E2E_SCOPE_<ts>` (CHỮ HOA) ⇒ tra theo mã ⛔ **KHÔNG THẤY** ⇒ bài test ⛔ **không xoá được**
//   ⇒ **BỎ LẠI 1 DÒNG RÁC** (`business_scope_catalog` 9 → 10). ⭐ **Chính bước «KIỂM HẬU QUẢ» đã bắt
//   được** (`chup-so-dong.mjs`), và tôi đã **dọn sạch** (về 9).
//   ✅ Nay: dùng **mã CHỮ THƯỜNG** + tra **KHÔNG phân biệt hoa/thường** ⇒ ⛔ không tái diễn.

// ── ① TẠO ─────────────────────────────────────────────────────────────────────────────────
console.log("\n═══ ① TẠO (`save_system_level`) ═══");
const r1 = await call("save_system_level", {
  code: MA_TMP, name: `Cấp bậc nháp ${MA_TMP}`, description: "Bản ghi nháp cho kiểm thử vòng đời GO-LIVE.",
  rank: 99, sortOrder: 99, autoGrantAll: 0, canSkipLevels: 0,
}, { boQuaLoi: true, nhan: "L1-tao" });
console.log(`   → ${r1.ok ? "✔ " + (r1.message || "ok") : "⛔ " + r1._loi}`);

let sau = await bootstrap();
let moi = ds(sau.systemLevelCatalog, MA_TMP);
const taoDuoc = r1.ok && !!moi;
console.log(`   SAU : ${(sau.systemLevelCatalog || []).length} dòng · tìm theo mã ⇒ ${moi ? `✔ ${moi.id}` : "⛔ KHÔNG THẤY"}`);

let doiTrangThai = false, xoaDuoc = false;

if (moi) {
  // ── ② ĐỔI TRẠNG THÁI ───────────────────────────────────────────────────────────────────
  console.log("\n═══ ② ĐỔI TRẠNG THÁI (`set_system_level_status`) ═══");
  const r2 = await call("set_system_level_status", { levelId: moi.id, active: 0 }, { boQuaLoi: true, nhan: "L2-an" });
  sau = await bootstrap();
  const sauAn = ds(sau.systemLevelCatalog, MA_TMP);
  console.log(`   → ${r2.ok ? "✔ " + (r2.message || "ok") : "⛔ " + r2._loi}`);
  console.log(`   active: ${moi.active} → ${sauAn?.active}`);
  doiTrangThai = r2.ok && sauAn && Number(sauAn.active) === 0;

  // ── ③ XOÁ ──────────────────────────────────────────────────────────────────────────────
  console.log("\n═══ ③ XOÁ (`delete_system_level`) ═══");
  const r3 = await call("delete_system_level", { levelId: moi.id }, { boQuaLoi: true, nhan: "L3-xoa" });
  sau = await bootstrap();
  const conLai = ds(sau.systemLevelCatalog, MA_TMP);
  console.log(`   → ${r3.ok ? "✔ " + (r3.message || "ok") : "⛔ " + r3._loi}`);
  console.log(`   sau xoá: ${(sau.systemLevelCatalog || []).length} dòng · tìm theo mã ⇒ ${conLai ? "⛔ VẪN CÒN" : "✔ đã mất"}`);
  xoaDuoc = r3.ok && !conLai;
}

// ── ④ DỌN DẸP NẾU CÒN SÓT ──────────────────────────────────────────────────────────────────
if (moi && !xoaDuoc) {
  console.log("\n═══ ④ DỌN DẸP (bản ghi nháp còn sót) ═══");
  const rd = await call("delete_system_level", { levelId: moi.id }, { boQuaLoi: true, nhan: "L4-don" });
  const sauDon = ds((await bootstrap()).systemLevelCatalog, MA_TMP);
  console.log(`   dọn: ${rd.ok ? "✔" : "⛔ " + rd._loi} · còn lại ⇒ ${sauDon ? "⛔ VẪN CÒN" : "✔ sạch"}`);
}

// ── ⑤ VÒNG ĐỜI THỨ HAI: `business_scope` (nhân bằng chứng sang thực thể khác) ─────────────
// ⛔ KHOÁ: `page.tsx` gọi `save_business_scope` với `{...FormData, scopeId?}`; khoá của bản ghi
//    trong bootstrap là `{id, code, name, description, active, sortOrder, systemLocked}`.
console.log("\n" + "=".repeat(84));
console.log("VÒNG ĐỜI THỨ HAI — `business_scope` (save → set_status → delete)");
console.log("=".repeat(84));
const MA_SCOPE = `e2e_scope_${Date.now().toString().slice(-6)}`;   // ⛔ CHỮ THƯỜNG (backend chuẩn hoá)
const scopeTruoc = (await bootstrap()).businessScopes || [];
console.log(`   TRƯỚC: businessScopes = ${scopeTruoc.length} dòng · mã nháp: ${MA_SCOPE}`);

const r1s = await call("save_business_scope", {
  code: MA_SCOPE, name: `Phạm vi nháp ${MA_SCOPE}`, description: "Bản ghi nháp cho kiểm thử vòng đời GO-LIVE.",
}, { boQuaLoi: true, nhan: "S1-tao" });
console.log(`   ① TẠO → ${r1s.ok ? "✔ " + (r1s.message || "ok") : "⛔ " + r1s._loi}`);
let scopeMoi = ds((await bootstrap()).businessScopes, MA_SCOPE);
const scopeTao = r1s.ok && !!scopeMoi;
console.log(`      tìm theo mã ⇒ ${scopeMoi ? `✔ ${scopeMoi.id}` : "⛔ KHÔNG THẤY"}`);

let scopeDoi = false, scopeXoa = false;
if (scopeMoi) {
  const r2s = await call("set_business_scope_status", { scopeId: scopeMoi.id, active: 0 }, { boQuaLoi: true, nhan: "S2-an" });
  const sauS = ds((await bootstrap()).businessScopes, MA_SCOPE);
  console.log(`   ② ĐỔI TRẠNG THÁI → ${r2s.ok ? "✔ " + (r2s.message || "ok") : "⛔ " + r2s._loi} · active ${scopeMoi.active} → ${sauS?.active}`);
  scopeDoi = r2s.ok && sauS && !sauS.active;

  const r3s = await call("delete_business_scope", { scopeId: scopeMoi.id }, { boQuaLoi: true, nhan: "S3-xoa" });
  const conS = ds((await bootstrap()).businessScopes, MA_SCOPE);
  console.log(`   ③ XOÁ → ${r3s.ok ? "✔ " + (r3s.message || "ok") : "⛔ " + r3s._loi} · còn lại ⇒ ${conS ? "⛔ VẪN CÒN" : "✔ đã mất"}`);
  scopeXoa = r3s.ok && !conS;
  if (!scopeXoa) {
    const rd = await call("delete_business_scope", { scopeId: scopeMoi.id }, { boQuaLoi: true, nhan: "S4-don" });
    console.log(`   dọn dẹp ⇒ ${rd.ok ? "✔" : "⛔ " + rd._loi}`);
  }
}

// ── KẾT LUẬN ──────────────────────────────────────────────────────────────────────────────
const ket = [
  ["① TẠO: `save_system_level` ⇒ bản ghi XUẤT HIỆN trong danh mục", taoDuoc],
  ["② ĐỔI TRẠNG THÁI: `set_system_level_status` ⇒ `active` 1 → 0", doiTrangThai],
  ["③ XOÁ: `delete_system_level` ⇒ bản ghi MẤT khỏi danh mục", xoaDuoc],
  ["④ TẠO: `save_business_scope` ⇒ bản ghi XUẤT HIỆN", scopeTao],
  ["⑤ ĐỔI TRẠNG THÁI: `set_business_scope_status` ⇒ `active` 1 → 0", scopeDoi],
  ["⑥ XOÁ: `delete_business_scope` ⇒ bản ghi MẤT", scopeXoa],
];
console.log("\n═══ KẾT LUẬN ═══");
let dat = 0;
for (const [ten, ok] of ket) { console.log(`   ${ok ? "✔" : "⛔"} ${ten}`); if (ok) dat++; }
console.log(`   ĐẠT ${dat}/${ket.length}`);

const cuoi = (await bootstrap()).systemLevelCatalog || [];
console.log(`\n   [đo từ máy chủ] systemLevelCatalog: ${dsTruoc.length} → ${cuoi.length} (⛔ phải BẰNG NHAU nếu đã dọn sạch)`);
const sach = cuoi.length === dsTruoc.length && !ds(cuoi, MA_TMP);
console.log(`   ${sach ? "✔" : "⛔"} dữ liệu nháp đã DỌN SẠCH — ⛔ không để lại rác`);

ghi("go-live-vong-doi-cap-bac", { dat, tong: ket.length, ket, ma: MA_TMP, sach });
if (dat < ket.length || !sach) process.exitCode = 1;
