// DỌN RÁC + XÁC MINH — 4 bản ghi do bài `go-live-thanh-cong-4-danh-muc.mjs` tạo mà ⛔ chưa xoá được
// (⛔ lỗi CỦA TÔI: script cũ quét MỌI mảng bootstrap nên lấy NHẦM id từ mảng `audits`).
// ⭐ Lần này: chỉ đọc ĐÚNG mảng của từng thực thể ⇒ lấy id THẬT ⇒ xoá ⇒ xác nhận sạch.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
tieuDe("DỌN RÁC 4 THỰC THỂ DANH MỤC + XÁC NHẬN SẠCH");

// ⭐ mỗi mục: mảng bootstrap ĐÚNG · trường id · action xoá · đoạn mã nhận dạng
const DS = [
  { nhan: "payment_plan",     mang: "paymentPlans",           truongId: "planId", xoa: "delete_payment_plan",     khop: "E2E MUUERPZ6" },
  { nhan: "seal",             mang: "sealManagement",         truongId: "sealId", xoa: "delete_seal",             khop: "E2E-SEL-MUUERPZ6" },
  { nhan: "legal_document",   mang: "legalDocuments",         truongId: "docId",  xoa: "delete_legal_document",   khop: "E2E-LGD-MUUERPZ6" },
  { nhan: "correspondence",   mang: "officialCorrespondence", truongId: "corrId", xoa: "delete_correspondence",   khop: "E2E-COR-MUUERPZ6" },
];

await login("admin", "Admin123456@");
const bs0 = await bootstrap();

console.log("   Mảng bootstrap liên quan (TRƯỚC):");
for (const m of DS) console.log(`      ${m.mang.padEnd(24)} = ${(bs0[m.mang] || []).length}`);

for (const m of DS) {
  await buoc(`${m.nhan} — tìm id THẬT trong «${m.mang}» rồi XOÁ`, async () => {
    const bs = await bootstrap();
    const rows = bs[m.mang] || [];
    const row = rows.find((x) => JSON.stringify(x).includes(m.khop));
    if (!row) return `⛔ không thấy bản rác trong «${m.mang}» (⛔ có thể đã sạch)`;
    const id = String(row[m.truongId] || row.id || "");
    if (!id) throw new Error(`thấy bản rác nhưng ⛔ KHÔNG có «${m.truongId}»/«id» ⇒ dọn bằng SQL`);
    const r = await call(m.xoa, { [m.truongId]: id }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`⛔ xoá vẫn thất bại (id=${id.slice(0, 20)}…): «${String(r._loi || "").slice(0, 80)}»`);
    return `đã xoá id=${id.slice(0, 20)}… · «${String(r.message || "").slice(0, 40)}»`;
  }, BC);
}

const bs1 = await bootstrap();
console.log("\n   Mảng bootstrap liên quan (SAU):");
let sach = true;
for (const m of DS) {
  const n = (bs1[m.mang] || []).length;
  const con = (bs1[m.mang] || []).some((x) => JSON.stringify(x).includes(m.khop));
  if (con) sach = false;
  console.log(`      ${m.mang.padEnd(24)} = ${n}   ${con ? "⛔ VẪN CÒN RÁC" : "✔ sạch"}`);
}
console.log(`\n   ⇒ ${sach ? "✔ ĐÃ DỌN SẠCH CẢ 4" : "⛔ CÒN RÁC — phải dọn bằng SQL"}`);

console.log("\n" + tomTatBuoc("DỌN RÁC 4 THỰC THỂ", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
