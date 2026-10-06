// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-200): vòng đời `project_contract`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_project_contract` **đã thành công 2 lần** nhưng
//   ⛔ **`delete_project_contract` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`ProjectContractUseCase` + `SystemController`) — ⛔ không chỉ payload.get:
//   `save_project_contract`: payload cần `projectId` (⭐ controller lấy từ payload + `requireProjectAccess`)
//     + BẮT BUỘC `contractNo` + `contractName` ⇒ 400 «Số hợp đồng và tên hợp đồng là bắt buộc.»
//     + ⚠️ `parentContractId` phải THUỘC dự án ⇒ 400 «Hợp đồng/phụ lục cha không thuộc dự án.»
//     ⭐ **TRẢ VỀ `contractId` TRONG PHẢN HỒI** ⇒ ⛔ không cần dò bootstrap ✓
//   `set_project_contract_status({contractId, active})`:
//     ⛔ không tìm thấy ⇒ 400 · `requireProjectAccess` · ⚠️ **TẮT mà `contractStockResidual > 0`**
//     ⇒ 400 «Hợp đồng còn tồn kế toán theo Contract; phải điều chuyển/hoàn trả hết trước khi ngừng áp dụng.»
//   `delete_project_contract({contractId, confirmText})` — **4 CHỐT**:
//     ① ⛔ không tìm thấy ⇒ 400 · ② `requireProjectAccess`
//     ③ ⚠️⚠️ **CHUỖI XÁC NHẬN**: `expected = "XOA " + contract_no` ⇒ ⛔ khác ⇒ 400 «Xác nhận chưa đúng. Hãy nhập “…”.»
//     ④ ⚠️ **`contractUsageCount > 0`** ⇒ 400 «Hợp đồng vẫn còn phụ lục/BOQ Version/giao dịch/lịch sử…»
//     + ⭐ **tự chuyển hợp đồng mặc định** nếu xoá hợp đồng primary ✓
//
// ⭐⭐ ĐIỂM MỚI SO VỚI TASK-199: KIỂM CHỐT CHẶN **THEO CHIỀU ÂM** — gọi `delete` với **chuỗi xác nhận SAI**
//    ⇒ PHẢI 400 ⇒ ⭐ **chứng minh chốt chống xoá nhầm HOẠT ĐỘNG**, ⛔ không chỉ «đọc thấy trong mã» ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const T = Date.now().toString(36).toUpperCase();
const PRJ = "PRJ_0af3201a-22d0-4870-961a-26d367350d45";   // ⭐ E2E-DA-01 (đọc từ CSDL)
const SO_HD = "E2E-HD-" + T;
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `project_contract` (" + SO_HD + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let hdId = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_project_contract (TẠO THẬT)", async () => {
  const r = await call("save_project_contract", {
    projectId: PRJ, contractNo: SO_HD, contractName: "Hợp đồng E2E " + T,
    contractType: "main", note: "TASK-200 · đường thành công · sẽ xoá",
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
  taoOk = true;
  // ⭐ ĐỌC `contractId` TỪ PHẢN HỒI (⛔ không dò bootstrap — ⭐ thiết kế API đã trả về)
  hdId = String(r.contractId || "").trim() || null;
  return `200 · «${String(r.message || "").slice(0, 40)}» · contractId=${hdId ? hdId.slice(0, 20) + "…" : "⛔ THIẾU"}`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑥ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else if (!hdId) {
  conLai.push(SO_HD);
  BOQUA("②…⑥ bỏ qua — ⛔ phản hồi KHÔNG có contractId ⇒ ⛔ không dọn được bằng API (dọn bằng SQL)");
} else {
  // ── ② ⭐⭐ CHỐT CHẶN THEO CHIỀU ÂM — chuỗi xác nhận SAI ⇒ PHẢI 400 ─────────────────────
  await buoc("② delete với CONFIRMTEXT SAI ⇒ phải 400 «Xác nhận chưa đúng.»", async () => {
    const r = await call("delete_project_contract", { contractId: hdId, confirmText: "XOA SAI-BE-BET" }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔⛔ XOÁ ĐƯỢC VỚI CONFIRMTEXT SAI ⇒ ⭐ CHỐT CHỐNG XOÁ NHẦM KHÔNG HOẠT ĐỘNG!");
    if (!/Xác nhận chưa đúng/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
    return `400 «${String(r._loi || "").slice(0, 60)}» ✓ ⭐ CHỐT HOẠT ĐỘNG`;
  }, BC);

  // ── ③ SỬA THẬT — ngừng áp dụng (⭐ tồn kho = 0 nên qua được chốt) ───────────────────────
  await buoc("③ set_project_contract_status(active=false) — SỬA THẬT", async () => {
    const r = await call("set_project_contract_status", { contractId: hdId, active: false }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`ngừng áp dụng thất bại: «${String(r._loi || "").slice(0, 95)}»`);
    return `200 · «${String(r.message || "").slice(0, 40)}»`;
  }, BC);

  // ── ④ XOÁ THẬT — chuỗi xác nhận ĐÚNG (⭐ theo đúng công thức «XOA » + số hợp đồng) ──────
  await buoc("④ delete_project_contract với CONFIRMTEXT ĐÚNG (XOÁ THẬT)", async () => {
    const r = await call("delete_project_contract", { contractId: hdId, confirmText: "XOA " + SO_HD }, { boQuaLoi: true });
    if (!r.ok) { conLai.push(SO_HD); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}» ⇒ CÒN RÁC «${SO_HD}»`); }
    return `200 · «${String(r.message || "").slice(0, 55)}»`;
  }, BC);

  // ── ⑤ XOÁ LẦN 2 ⇒ PHẢI 400 (⭐ chốt tồn tại nổ TRƯỚC chốt confirmText) ─────────────────
  await buoc("⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy hợp đồng.»", async () => {
    const r = await call("delete_project_contract", { contractId: hdId, confirmText: "XOA " + SO_HD }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
    if (!/Không tìm thấy/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
    return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
  }, BC);
}

// ── ⑥ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (contract_no LIKE '${SO_HD}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI project_contract (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
