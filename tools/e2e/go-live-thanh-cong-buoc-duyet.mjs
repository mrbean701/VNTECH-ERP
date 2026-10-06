// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-199): vòng đời `approval_stage`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY — ĐO ĐƯỢC: `save_approval_stage` **đã thành công 22 lần** nhưng
//   ⛔ **`delete_approval_stage` CHƯA TỪNG THÀNH CÔNG** ⇒ ⭐ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC»
//   — ⭐ đúng loại đã sinh ra BUG-012/-013 (lỗi CHỈ lộ ra khi chạy đường thật) ✓
//
// ⭐ HỢP ĐỒNG ĐỌC TỪ MÃ (`OpsTaskManagementUseCase`) — ⭐ CẶP NÀY CÓ **5 CHỐT CHẶN**:
//   `saveApprovalStage`      : BẮT BUỘC `name` + `allowedRoleCodes` (⛔ rỗng ⇒ 400 «Bước phê duyệt
//                              phải có tên và ít nhất một vai trò được phép duyệt.»)
//                              · tuỳ chọn `stageId`/`description`/`stageNo`/`sortOrder`/`slaHours`
//   `setApprovalStageStatus` : ⛔ không tìm thấy ⇒ 400 «Không tìm thấy bước phê duyệt.»
//                              ⚠️ TẮT mà **đang có hồ sơ chờ xử lý** ⇒ 400 «Bước này đang có hồ sơ chờ xử lý…»
//                              ⚠️ **bước hoạt động cuối cùng** ⇒ 400 «Hệ thống phải có ít nhất một bước…»
//   `deleteApprovalStage`    : ⛔ không tìm thấy ⇒ 400
//                              ⚠️ **đã có lịch sử hồ sơ** ⇒ 400 «…không được xóa. Hãy dùng Ẩn…»
//                              ⚠️ **≤1 bước hoạt động** ⇒ 400 «Không thể xóa bước hoạt động cuối cùng.»
//
// ⚠️⚠️ DỮ LIỆU THẬT ĐỌC TỪ CSDL (⛔ không đoán):
//   · `approval_stage_catalog`: **8 dòng, CẢ 8 đang hoạt động** ⇒ `countActiveStages() = 8 > 1` ⇒ xoá được ✓
//   · `MAX(stage_no) = 103` ⇒ ⭐ dùng **999** (⛔ chưa dùng ⇒ **0 lịch sử hồ sơ** ⇒ qua được chốt xoá) ✓
//   · mã vai trò hợp lệ (ví dụ thật): `commander,cht` · `warehouse,thu_kho` · `project,da_nv` ✓
//
// ⚠️⚠️ BẪY HAI MẢNG (⛔ đã tránh): adapter ghi rõ «`approvalStages: approvalStageCatalog` —
//   **CÙNG một dữ liệu, HAI TÊN**» ⇒ ⭐ đọc id từ **CẢ HAI** và đối chiếu chéo, ⛔ không quét mọi mảng
//   (⭐ bài học TASK-195: quét mọi mảng sẽ khớp `audits` và lấy NHẦM id) ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const T = Date.now().toString(36).toUpperCase();
const MA = "E2E_BUOC_" + T;
const STAGE_NO = 999;   // ⭐ chưa dùng (max thật = 103) ⇒ 0 lịch sử ⇒ qua được chốt xoá
// ⛔⛔ SỬA LỖI CỦA TÔI (lần chạy đầu): tôi để `VAI_TRO = "admin"` ⇒ ⭐ API trả 400
//   «Vai trò admin không tồn tại hoặc đang bị ẩn.» ✓ ⭐ CÓ WHITELIST THẬT:
//   `OpsTaskManagementUseCase:549-551` ⇒ `List<String> validRoles = store.activeRoleCodes();`
//   ⇒ ⭐ mã hợp lệ đọc từ `role_catalog` (active=1): `hr` · `cht` · `da_nv` · `da_truong` · `kh_nv` ·
//     `kh_truong` · `ksda` · `thu_kho` · `thuky` · `accountant` · **`commander`** · `director` ✓
//   ⭐ BÀI HỌC LẶP LẠI: **tôi đọc phần `payload.get` mà ⛔ KHÔNG đọc HẾT khối kiểm tra** ⇒
//     ⭐ phải đọc **TRỌN khối validate**, ⛔ không chỉ các dòng đọc tham số ✓
const VAI_TRO = "commander";
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `approval_stage` (" + T + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));

// ⭐ CHỈ đọc ĐÚNG hai mảng của thực thể này (⛔ không quét mọi mảng)
const MANG = ["approvalStages", "approvalStageCatalog"];
const timId = (bs) => {
  const thay = [];
  for (const k of MANG) for (const r of bs[k] || [])
    if (String(r.name || "").includes(MA)) { const id = String(r.id || r.stageId || ""); if (id) thay.push([k, id]); }
  const id = thay.length ? thay[0][1] : null;
  return { id, thay, dongNhat: thay.every(([, i]) => i === id) };
};

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
let stageId = null, taoOk = false;
await buoc("① save_approval_stage (TẠO THẬT)", async () => {
  const r = await call("save_approval_stage", {
    name: MA, description: "TASK-199 · đường thành công · sẽ xoá",
    stageNo: STAGE_NO, allowedRoleCodes: [VAI_TRO], slaHours: 8,
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑤ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② ĐỌC LẠI — đọc ĐÚNG hai mảng, đối chiếu chéo ──────────────────────────────────────
  const bs1 = await bootstrap();
  const t1 = timId(bs1);
  stageId = t1.id;
  await buoc("② ĐỌC LẠI — tìm id trong ĐÚNG hai mảng (đối chiếu chéo)", async () => {
    if (!stageId) throw new Error(`⛔ KHÔNG tìm thấy «${MA}» trong ${MANG.join("/")} ⇒ ⛔ KHÔNG DỌN ĐƯỢC`);
    return `${t1.thay.map(([k, i]) => k + "=" + i.slice(0, 12)).join(" · ")}${t1.dongNhat ? " · ✔ HAI MẢNG ĐỒNG NHẤT" : " · ⚠️ HAI MẢNG KHÁC NHAU"}`;
  }, BC);

  if (!stageId) {
    conLai.push(MA);
    BOQUA("③④⑤ bỏ qua — ⛔ không có id ⇒ dọn bằng SQL");
  } else {
    // ── ③ SỬA THẬT — TẮT bước (⭐ chốt: 0 hồ sơ chờ xử lý ở stage 999) ────────────────────
    await buoc("③ set_approval_stage_status(active=false) — SỬA THẬT", async () => {
      const r = await call("set_approval_stage_status", { stageId, active: false }, { boQuaLoi: true });
      if (!r.ok) throw new Error(`tắt thất bại: «${String(r._loi || "").slice(0, 95)}»`);
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ④ XOÁ THẬT (⭐ chốt: 0 lịch sử hồ sơ ở stage 999; còn 8 bước hoạt động ⇒ >1) ────────
    await buoc("④ delete_approval_stage (XOÁ THẬT — DỌN SẠCH)", async () => {
      const r = await call("delete_approval_stage", { stageId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(MA); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}» ⇒ CÒN RÁC «${MA}»`); }
      return `200 · «${String(r.message || "").slice(0, 45)}»`;
    }, BC);

    // ── ⑤ XOÁ LẦN 2 ⇒ PHẢI 400 (⛔ chứng minh ĐÃ XOÁ THẬT) ──────────────────────────────
    await buoc("⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bước phê duyệt.»", async () => {
      const r = await call("delete_approval_stage", { stageId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑥ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ PHẢI DỌN BẰNG SQL (name LIKE '${MA}%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI approval_stage (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
