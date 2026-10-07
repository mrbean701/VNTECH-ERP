// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-203): vòng đời `workflow`.
//
// ⭐ VÌ SAO CHỌN CẶP NÀY: `save_workflow` **đã thành công 5 lần** nhưng
//   ⛔ **`delete_workflow` CHƯA TỪNG THÀNH CÔNG** ⇒ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» — ⭐ CẶP CUỐI CÙNG ✓
//
// ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`OpsTaskManagementUseCase`) — ⛔ không chỉ payload.get:
//   `saveWorkflow`: BẮT BUỘC `code` + `name` ⇒ 400 «Quy trình cần mã và tên.»
//     ⚠️ `code` PHẢI khớp `[A-Za-z0-9._-]{3,64}` ⇒ 400 «Mã quy trình chỉ gồm chữ, số, dấu chấm, gạch ngang/gạch dưới (3–64 ký tự).»
//     ⚠️⚠️ **`stages` PHẢI CÓ ≥1 bước** ⇒ 400 «Quy trình phải có ít nhất một bước duyệt.»
//     ⭐ MỖI BƯỚC cần: `stepNo` (⭐ ⛔ không trùng ⇒ 400 «Số thứ tự bước bị trùng: N.») · `stepName` (⇒ 400 «Bước N chưa có tên.»)
//        · `mode` ∈ {`single`,`any_of`,`all_of`} (⇒ 400 «Cách xác nhận của bước N không hợp lệ…»)
//        · ⚠️ **`approverUserIds` BẮT BUỘC** (⇒ 400 «Bước N (“…” ) chưa chỉ định người duyệt.»)
//        · ⚠️ **`mode="single"` ⇒ ĐÚNG 1 NGƯỜI** (⇒ 400 «…chỉ được chỉ định đúng một người.»)
//     ⭐ **CHỐT CHỐNG TRÙNG MÃ**: `findWorkflowByCode` ⇒ 400 «Mã quy trình “X” đã tồn tại.» ✓
//   `deleteWorkflow` — **2 CHỐT**:
//     ① ⛔ không tìm thấy ⇒ 400 «Không tìm thấy quy trình.»
//     ② ⭐⭐ **CHỐT CỨNG BẢO VỆ HỆ THỐNG**: `WF-MUAHANG` (theo id HOẶC theo code `WF-MUAHANG-01`)
//        ⇒ 400 «Đây là quy trình mặc định của hệ thống — chỉ được ngừng áp dụng, không được xóa.» ✓
//     ⭐ `deleteWorkflowSafe` **XOÁ CẢ CÁC BƯỚC** ⇒ «Đã xóa quy trình và toàn bộ bước của quy trình.» ✓
//
// ⭐⭐ 3 KỸ THUẬT CŨ DÙNG LẠI: «ĐỌC TRỌN» (TASK-199) · «SO TẬP ID» (TASK-201) · «CHIỀU ÂM» (TASK-200)
//    + ⭐ «LỌC THEO DẤU VẾT RIÊNG» (TASK-201) ✓
//
// ⭐ DỮ LIỆU THẬT: người duyệt `USR_e66f85ff-…` (`e2e.bgd`) · hiện có `workflowDefinitions` **5** ·
//   `workflowSteps` **14** · `workflowStepApprovers` **14** · `workflowAssignments` **10** ⇒ ⭐ cả 4 phải về đúng ✓
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MANG = "workflowDefinitions";                             // ⭐ đọc từ BootstrapDataAdapter:1029
const NGUOI = "USR_e66f85ff-96ad-40d5-a632-10be87ab10d5";       // ⭐ e2e.bgd (đọc từ CSDL)
const MA = "E2E-WF-" + Date.now().toString(36).toUpperCase();   // ⭐ khớp regex [A-Za-z0-9._-]{3,64}
const DAU_VET = "TASK-203";                                     // ⭐ DẤU VẾT RIÊNG
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời `workflow` (" + MA + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));
const idTruoc = new Set((bs0[MANG] || []).map((r) => String(r.id || "")));   // ⭐ TẬP ID TRƯỚC

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];
let wfId = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_workflow (TẠO THẬT — 1 bước, mode=single)", async () => {
  const r = await call("save_workflow", {
    code: MA, name: "Quy trình E2E " + MA, description: DAU_VET + " · đường thành công · sẽ xoá",
    moduleKey: "requests", isDefault: false, sortOrder: 999,
    // ⛔⛔ SỬA LỖI CỦA TÔI (lần chạy đầu ⇒ 400 «Bước 1 chưa có tên.»): ⭐ TÊN TRƯỜNG THẬT đọc từ
    //   DÒNG GÁN trong `OpsTaskManagementUseCase:689-693`:
    //     `String stepName = trim(raw.get("name"));`      ⇒ ⛔ KHÔNG phải "stepName" — là **"name"**
    //     `String mode = trim(raw.get("approvalMode"));`  ⇒ ⛔ KHÔNG phải "mode" — là **"approvalMode"**
    //   (⭐ `stepNo` và `approverUserIds` thì ĐÚNG)
    // ⭐⭐ BÀI HỌC MỚI, CHÍNH XÁC HƠN TASK-199: ⭐ **ĐỌC DÒNG GÁN, ⛔ KHÔNG CHỈ DÒNG DÙNG.**
    //   ⭐ Tôi ĐÃ đọc trọn khối validate ⚠️ nhưng **bộ lọc grep chỉ giữ dòng `if (`/`throw`**
    //   ⇒ ⛔ **nó BỎ MẤT các dòng GÁN** ⇒ tôi ⛔ không thấy tên trường ✓
    //   ⭐ **Dòng DÙNG (`x.isEmpty()`) cho biết CÓ kiểm tra; dòng GÁN (`x = raw.get("KEY")`) cho biết TÊN TRƯỜNG.**
    stages: [{ stepNo: 1, name: "Bước E2E 1", approvalMode: "single", approverUserIds: [NGUOI] }],
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  taoOk = true;
  return `200 · «${String(r.message || "").slice(0, 45)}»`;
}, BC);

if (!taoOk) {
  BOQUA("②…⑥ bỏ qua — ① CHƯA tạo được gì ⇒ ⛔ không có gì để dọn");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② ⭐ CHỐT CHỐNG TRÙNG MÃ ⇒ chứng minh ĐÃ GHI THẬT (⛔ không cần id) ──────────────────
  await buoc("② TẠO LẦN 2 CÙNG MÃ ⇒ phải 400 «Mã quy trình … đã tồn tại.»", async () => {
    const r = await call("save_workflow", {
      code: MA, name: "Trùng", stages: [{ stepNo: 1, name: "X", approvalMode: "single", approverUserIds: [NGUOI] }],
    }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔ lần 2 vẫn 200 ⇒ ⛔ GHI THẤT BẠI ÂM THẦM (hoặc thiếu chốt chống trùng)");
    if (!/đã tồn tại/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
    return `400 «${String(r._loi || "").slice(0, 45)}» ✓ ⭐ ĐÃ GHI THẬT`;
  }, BC);

  // ── ③ ⭐⭐ CHIỀU ÂM QUAN TRỌNG — KHÔNG được xoá quy trình mặc định của hệ thống ──────────
  await buoc("③ delete «WF-MUAHANG» ⇒ phải 400 «quy trình mặc định của hệ thống…» (CHIỀU ÂM)", async () => {
    const r = await call("delete_workflow", { workflowId: "WF-MUAHANG" }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔⛔ XOÁ ĐƯỢC QUY TRÌNH MẶC ĐỊNH CỦA HỆ THỐNG ⇒ ⭐ CHỐT BẢO VỆ KHÔNG HOẠT ĐỘNG!");
    if (!/mặc định của hệ thống/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 90)}»`);
    return `400 «${String(r._loi || "").slice(0, 60)}» ✓ ⭐ CHỐT BẢO VỆ HOẠT ĐỘNG`;
  }, BC);

  // ── ④ SO TẬP ID ⇒ tìm id bản của mình ──────────────────────────────────────────────────
  const bs1 = await bootstrap();
  const idSau = new Set((bs1[MANG] || []).map((r) => String(r.id || "")));
  const moi = [...idSau].filter((x) => x && !idTruoc.has(x));
  wfId = moi.length === 1 ? moi[0] : null;
  await buoc("④ ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID", async () => {
    if (moi.length === 0) throw new Error(`⛔ tạo 200 nhưng ⛔ KHÔNG thấy id mới trong «${MANG}»`);
    if (moi.length > 1) throw new Error(`⚠️ thấy ${moi.length} id mới ⇒ ⛔ không xác định được ⇒ DỌN BẰNG SQL`);
    return `id mới = ${wfId.slice(0, 20)}… · SL ${d0[MANG]} → ${(bs1[MANG] || []).length}`;
  }, BC);

  if (!wfId) {
    conLai.push(MA);
    BOQUA("⑤⑥ bỏ qua — ⛔ không xác định được id ⇒ dọn bằng SQL (code LIKE 'E2E-WF-%')");
  } else {
    // ── ⑤ XOÁ THẬT ────────────────────────────────────────────────────────────────────────
    await buoc("⑤ delete_workflow (XOÁ THẬT — ⭐ xoá cả các bước)", async () => {
      const r = await call("delete_workflow", { workflowId: wfId }, { boQuaLoi: true });
      if (!r.ok) { conLai.push(MA); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}»`); }
      return `200 · «${String(r.message || "").slice(0, 50)}»`;
    }, BC);

    // ── ⑥ XOÁ LẦN 2 ⇒ PHẢI 400 ───────────────────────────────────────────────────────────
    await buoc("⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy quy trình.»", async () => {
      const r = await call("delete_workflow", { workflowId: wfId }, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
      if (!/Không tìm thấy/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 80)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  }
}

// ── ⑦ KIỂM HẬU QUẢ — ⭐ BẮT BUỘC CẢ 94 MẢNG VỀ ĐÚNG GIÁ TRỊ GỐC ──────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);
for (const k of ["workflowDefinitions", "workflowSteps", "workflowStepApprovers", "workflowAssignments"])
  console.log(`   ⓘ «${k}»: ${d0[k] ?? "⛔ không có trong bootstrap"} → ${d9[k] ?? "⛔ không có trong bootstrap"}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN: ${conLai.join(" · ")} ⇒ DỌN BẰNG SQL (workflow_definitions WHERE code LIKE 'E2E-WF-%')`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI workflow (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
