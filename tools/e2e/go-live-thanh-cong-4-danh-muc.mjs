// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-195): VÒNG ĐỜI 4 THỰC THỂ DANH MỤC.
//   `payment_plan` · `seal` · `legal_document` · `correspondence`
//
// ⭐ PHƯƠNG PHÁP 7 BƯỚC (TASK-193/194) + ⭐⭐ PHÉP THỬ THỨ 3 «CHỐT CHỐNG TRÙNG».
//
// ⭐ HỢP ĐỒNG ĐỌC TỪ MÃ (⛔ không đoán):
//   savePaymentPlan      : BẮT BUỘC `projectId` · TUỲ CHỌN `planId`/`contractId`/`poId`/`milestone`/
//                          `plannedDate`/`plannedAmount`/`note`   (⛔ `planId` khác dự án ⇒ 400)
//                          delete ⇒ `planId`
//   saveSeal             : BẮT BUỘC `sealNo`+`sealName`+`sealType` · TRÙNG `sealNo` ⇒ 400 «Số hiệu con dấu đã tồn tại.»
//                          delete ⇒ `sealId`
//   saveLegalDocument    : BẮT BUỘC `docNo`+`docType`+`title` · TRÙNG `docNo` ⇒ 400 «Số văn bản đã tồn tại.»
//                          delete ⇒ `docId`
//   saveCorrespondence   : BẮT BUỘC `docNo` + `direction` ∈ {IN,OUT} + `docType` · TRÙNG `docNo` ⇒ 400
//                          delete ⇒ `corrId`
//
// ⭐⭐ PHÉP THỬ THỨ 3 — «CHỐT CHỐNG TRÙNG» (⛔ KHÔNG CẦN BIẾT ID):
//   tạo với số hiệu **X** ⇒ 200; tạo **LẦN 2 cùng số hiệu X** (⛔ không gửi id) ⇒ PHẢI **400 «đã tồn tại»**
//   ⇒ ⭐ **chứng minh bản ghi ĐẦU ĐÃ ĐƯỢC GHI THẬT** — ⭐ mà ⛔ không cần đọc lại bảng nào ✓
//   ⭐ Nếu lần 2 trả 200 ⇒ ⛔ **GHI THẤT BẠI ÂM THẦM** ⇒ bài kiểm NÉM LỖI.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const T = Date.now().toString(36).toUpperCase();
const PRJ = "PRJ_0af3201a-22d0-4870-961a-26d367350d45";   // ⭐ E2E-DA-01 (đọc từ CSDL)
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời 4 thực thể danh mục (mã " + T + ")");

// mỗi mục: nhãn · action lưu · payload tạo · khoá chống trùng · action xoá · tên trường id · mã dò · ⭐ MẢNG BOOTSTRAP ĐÚNG
// ⛔⛔ SỬA LỖI CỦA TÔI (lần chạy đầu): bản cũ quét **MỌI** mảng bootstrap để tìm mã ⇒ ⭐ nó khớp
//    **mảng `audits`** (nhật ký cũng chứa mã đó) ⇒ **lấy NHẦM id của dòng nhật ký** ⇒ 4 lần `delete_*`
//    đều 400 «Không tìm thấy …» ⇒ **tạo ra 4 bản rác** (đã dọn bằng `go-live-don-4-danh-muc.mjs`).
//    ⭐ BÀI HỌC: **⛔ QUÉT MỌI MẢNG LÀ SAI — PHẢI QUÉT ĐÚNG MẢNG CỦA THỰC THỂ** — ⭐ một biến thể của
//    «đo sai tập hợp» (cùng họ với «đo sai tệp» ở TASK-187).
const DS = [
  { nhan: "payment_plan", luu: "save_payment_plan", tao: { projectId: PRJ, milestone: "E2E " + T, plannedAmount: 1 },
    trung: null, xoa: "delete_payment_plan", truongId: "planId", ma: "E2E " + T, mang: "paymentPlans" },
  { nhan: "seal", luu: "save_seal", tao: { sealNo: "E2E-SEL-" + T, sealName: "Dấu E2E " + T, sealType: "E2E" },
    trung: { sealNo: "E2E-SEL-" + T, sealName: "Trùng", sealType: "E2E" }, xoa: "delete_seal", truongId: "sealId", ma: "E2E-SEL-" + T, mang: "sealManagement" },
  { nhan: "legal_document", luu: "save_legal_document", tao: { docNo: "E2E-LGD-" + T, docType: "E2E", title: "VB E2E " + T },
    trung: { docNo: "E2E-LGD-" + T, docType: "E2E", title: "Trùng" }, xoa: "delete_legal_document", truongId: "docId", ma: "E2E-LGD-" + T, mang: "legalDocuments" },
  { nhan: "correspondence", luu: "save_correspondence", tao: { docNo: "E2E-COR-" + T, direction: "IN", docType: "E2E" },
    trung: { docNo: "E2E-COR-" + T, direction: "IN", docType: "E2E" }, xoa: "delete_correspondence", truongId: "corrId", ma: "E2E-COR-" + T, mang: "officialCorrespondence" },
];

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));

const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
const conLai = [];   // ⛔ những mã CHƯA DỌN ĐƯỢC ⇒ phải báo động

for (const m of DS) {
  console.log(`\n  ── ${m.nhan} ─────────────────────────────────────────`);
  let id = null, taoOk = false;

  // ③ TẠO THẬT
  await buoc(`${m.nhan} · ③ ${m.luu} (TẠO THẬT)`, async () => {
    const r = await call(m.luu, m.tao, { boQuaLoi: true });
    if (!r.ok) throw new Error(`tạo thất bại: «${String(r._loi || "").slice(0, 95)}»`);
    taoOk = true;
    return `200 · «${String(r.message || "").slice(0, 48)}»`;
  }, BC);

  if (!taoOk) { BOQUA(`${m.nhan} · ④⑤⑥ bỏ qua — ③ CHƯA tạo được gì ⇒ ⛔ không có gì để dọn`); continue; }

  // ④ PHÉP THỬ THỨ 3 — chốt chống trùng (⛔ không cần id)
  if (m.trung) {
    await buoc(`${m.nhan} · ④ TẠO LẦN 2 CÙNG SỐ HIỆU ⇒ phải 400 «đã tồn tại» (⛔ chứng minh ĐÃ GHI THẬT)`, async () => {
      const r = await call(m.luu, m.trung, { boQuaLoi: true });
      if (r.ok) throw new Error("⛔ lần 2 vẫn 200 ⇒ ⛔ GHI THẤT BẠI ÂM THẦM (hoặc thiếu chốt chống trùng)");
      if (!/đã tồn tại/i.test(String(r._loi || "")))
        throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
      return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
    }, BC);
  } else {
    BOQUA(`${m.nhan} · ④ không có chốt chống trùng để thử`);
  }

  // ⑤ TÌM ID để dọn — ⭐ CHỈ đọc ĐÚNG MẢNG của thực thể (⛔ không quét mọi mảng: sẽ khớp `audits`)
  const bs1 = await bootstrap();
  const rows = bs1[m.mang] || [];
  const row = rows.find((x) => JSON.stringify(x).includes(m.ma));
  if (row) { id = String(row[m.truongId] || row.id || ""); if (id) console.log(`      ⓘ thấy id trong «${m.mang}» (${rows.length} dòng)`); }

  if (!id) {
    console.log(`      ⛔ KHÔNG tìm được id trong bootstrap ⇒ ⛔ KHÔNG DỌN ĐƯỢC bằng API (mã «${m.ma}») ⇒ phải dọn bằng SQL`);
    conLai.push(m.ma);
    BC.push({ ten: `${m.nhan} · ⑤⑥ ⛔ KHÔNG DỌN ĐƯỢC — dọn bằng SQL`, ok: false, loi: "không tìm được id" });
    continue;
  }

  // ⑤b XOÁ THẬT
  await buoc(`${m.nhan} · ⑤b ${m.xoa} (XOÁ THẬT — DỌN SẠCH)`, async () => {
    const r = await call(m.xoa, { [m.truongId]: id }, { boQuaLoi: true });
    if (!r.ok) { conLai.push(m.ma); throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 85)}» ⇒ CÒN RÁC «${m.ma}»`); }
    return `200 · «${String(r.message || "").slice(0, 48)}»`;
  }, BC);

  // ⑥ XOÁ LẦN 2 ⇒ phải 400 ⇒ chứng minh đã xoá thật
  await buoc(`${m.nhan} · ⑥ XOÁ LẦN 2 ⇒ phải 400 (⛔ chứng minh ĐÃ XOÁ THẬT)`, async () => {
    const r = await call(m.xoa, { [m.truongId]: id }, { boQuaLoi: true });
    if (r.ok) throw new Error("⛔ xoá lần 2 vẫn 200 ⇒ NGHI XOÁ THẤT BẠI ÂM THẦM");
    if (!/Không tìm thấy/i.test(String(r._loi || "")))
      throw new Error(`⛔ 400 nhưng thông điệp LẠ: «${String(r._loi || "").slice(0, 70)}»`);
    return `400 «${String(r._loi || "").slice(0, 42)}» ✓`;
  }, BC);
}

// ⑦ KIỂM HẬU QUẢ
const bs2 = await bootstrap();
const d2 = Object.fromEntries(KHOA.map((k) => [k, (bs2[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d2[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d2[k]}`).join(" · ")}`);
if (conLai.length) console.log(`   ⛔⛔ CÒN RÁC CHƯA DỌN (${conLai.length}): ${conLai.join(" · ")} ⇒ PHẢI DỌN BẰNG SQL`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI 4 THỰC THỂ DANH MỤC (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
