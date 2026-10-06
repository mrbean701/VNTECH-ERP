// GO-LIVE 05/10/2026 — VÒNG ĐỜI CRUD TRÊN **THỰC THỂ NGHIỆP VỤ** (nhà cung cấp · đối tác).
//
// ⭐ KỸ THUẬT (đã hiệu quả ở TASK-165): `save_*` → kiểm XUẤT HIỆN → `set_*_status` → kiểm ĐỔI TRẠNG THÁI
//   → `delete_*` → kiểm MẤT ⇒ ⛔ an toàn tuyệt đối (chỉ đụng bản ghi của mình) mà kiểm được **CẢ 3 action**
//   ở **ĐƯỜNG THÀNH CÔNG** — điều kỹ thuật «id bịa» ⛔ không chạm tới.
//
// ⛔ KHOÁ PAYLOAD: trích từ chính form của UI (⛔ không đoán):
//   `SupplierManager.tsx`: code · name · taxCode · contactName · phone · email · leadTimeDays · rating
//   `PartnerManager.tsx` : code · name · taxCode · address · contactName · contactPhone · email · partnerType
//   Đọc lại: `bootstrap.suppliers` / `bootstrap.partners`
//
// ⛔ BÀI HỌC ĐÃ ÁP DỤNG (từ chính TASK-165): mã danh mục bị backend **CHUẨN HOÁ CHỮ THƯỜNG** ⇒ dùng
//   **mã chữ thường** + tra **KHÔNG phân biệt hoa/thường**, ⛔ nếu không sẽ không xoá được và **bể rác**.
import { login, bootstrap, call, ghi } from "./client.mjs";

const MK_ADMIN = "Admin123456@";
const TS = Date.now().toString().slice(-6);

console.log("=".repeat(84));
console.log("GO-LIVE — VÒNG ĐỜI CRUD: NHÀ CUNG CẤP · ĐỐI TÁC (kiểm ĐƯỜNG THÀNH CÔNG)");
console.log("=".repeat(84));

await login("admin", MK_ADMIN);
/** Tra KHÔNG phân biệt hoa/thường (bài học TASK-165: backend chuẩn hoá mã thành chữ thường). */
const tim = (arr, code) => (arr || []).find((x) => String(x.code).toLowerCase() === String(code).toLowerCase());

const ket = [];

async function vongDoi({ nhan, khoaDoc, ma, payload, actionTao, actionTrangThai, actionXoa, truongTrangThai }) {
  console.log(`\n${"─".repeat(84)}\n${nhan} — mã nháp: ${ma}\n${"─".repeat(84)}`);
  const truoc = (await bootstrap())[khoaDoc] || [];
  console.log(`   TRƯỚC: ${khoaDoc} = ${truoc.length} dòng`);

  const r1 = await call(actionTao, payload, { boQuaLoi: true, nhan: `${nhan}-tao` });
  console.log(`   ① TẠO → ${r1.ok ? "✔ " + (r1.message || "ok") : "⛔ " + r1._loi}`);
  let moi = tim((await bootstrap())[khoaDoc], ma);
  const tao = r1.ok && !!moi;
  console.log(`      tìm theo mã ⇒ ${moi ? `✔ ${moi.id}` : "⛔ KHÔNG THẤY"}`);

  let doi = false, xoa = false;
  if (moi) {
    const r2 = await call(actionTrangThai, { ...truongTrangThai(moi) }, { boQuaLoi: true, nhan: `${nhan}-tt` });
    const sauTT = tim((await bootstrap())[khoaDoc], ma);
    console.log(`   ② ĐỔI TRẠNG THÁI → ${r2.ok ? "✔ " + (r2.message || "ok") : "⛔ " + r2._loi}`);
    console.log(`      active/status: ${JSON.stringify(moi.active ?? moi.status)} → ${JSON.stringify(sauTT?.active ?? sauTT?.status)}`);
    doi = r2.ok && JSON.stringify(moi.active ?? moi.status) !== JSON.stringify(sauTT?.active ?? sauTT?.status);

    const r3 = await call(actionXoa, { [actionXoa.includes("partner") ? "partnerId" : "supplierId"]: moi.id },
      { boQuaLoi: true, nhan: `${nhan}-xoa` });
    const con = tim((await bootstrap())[khoaDoc], ma);
    console.log(`   ③ XOÁ → ${r3.ok ? "✔ " + (r3.message || "ok") : "⛔ " + r3._loi} · còn lại ⇒ ${con ? "⛔ VẪN CÒN" : "✔ đã mất"}`);
    xoa = r3.ok && !con;
    if (!xoa) {
      const rd = await call(actionXoa, { [actionXoa.includes("partner") ? "partnerId" : "supplierId"]: moi.id },
        { boQuaLoi: true, nhan: `${nhan}-don` });
      console.log(`   dọn dẹp ⇒ ${rd.ok ? "✔" : "⛔ " + rd._loi} · ${tim((await bootstrap())[khoaDoc], ma) ? "⛔ VẪN CÒN" : "✔ sạch"}`);
    }
  }
  const cuoi = (await bootstrap())[khoaDoc] || [];
  const sach = cuoi.length === truoc.length;
  console.log(`   SAU : ${khoaDoc} = ${cuoi.length} dòng ⇒ ${sach ? "✔ sạch" : "⛔ CÒN RÁC"}`);

  ket.push([`${nhan} · ① TẠO ⇒ bản ghi XUẤT HIỆN`, tao]);
  ket.push([`${nhan} · ② ĐỔI TRẠNG THÁI`, doi]);
  ket.push([`${nhan} · ③ XOÁ ⇒ bản ghi MẤT`, xoa]);
  ket.push([`${nhan} · ④ DỌN SẠCH (số dòng về như cũ)`, sach]);
}

// ── NHÀ CUNG CẤP ──────────────────────────────────────────────────────────────────────────
await vongDoi({
  nhan: "NHÀ CUNG CẤP",
  khoaDoc: "suppliers",
  ma: `e2e_ncc_${TS}`,
  payload: {
    code: `e2e_ncc_${TS}`, name: `NCC nháp ${TS}`, taxCode: "", contactName: "E2E",
    phone: "", email: "", leadTimeDays: 0, rating: 0, active: true,
  },
  actionTao: "save_supplier",
  actionTrangThai: "set_supplier_status",
  actionXoa: "delete_supplier",
  truongTrangThai: (m) => ({ supplierId: m.id, active: Number(m.active) === 0 ? 1 : 0 }),
});

// ── ĐỐI TÁC ───────────────────────────────────────────────────────────────────────────────
await vongDoi({
  nhan: "ĐỐI TÁC",
  khoaDoc: "partners",
  ma: `e2e_dt_${TS}`,
  payload: {
    code: `e2e_dt_${TS}`, name: `Đối tác nháp ${TS}`, taxCode: "", address: "",
    contactName: "E2E", contactPhone: "", email: "", partnerType: "supplier",
  },
  actionTao: "save_partner",
  actionTrangThai: "set_partner_status",
  actionXoa: "delete_partner",
  truongTrangThai: (m) => ({ partnerId: m.id, active: Number(m.active) === 0 ? 1 : 0 }),
});

// ── KẾT LUẬN ──────────────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(84));
console.log("KẾT LUẬN");
console.log("=".repeat(84));
let dat = 0;
for (const [ten, ok] of ket) { console.log(`   ${ok ? "✔" : "⛔"} ${ten}`); if (ok) dat++; }
console.log(`   ĐẠT ${dat}/${ket.length}`);

ghi("go-live-vong-doi-ncc-doi-tac", { dat, tong: ket.length, ket, ts: TS });
if (dat < ket.length) process.exitCode = 1;
