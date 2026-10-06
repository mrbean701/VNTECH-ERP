// GO-LIVE 05/10/2026 — ĐƯỜNG THÀNH CÔNG (TASK-193): VÒNG ĐỜI CRUD `business_role_group`.
//
// ⛔⛔ VÌ SAO BÀI NÀY — ĐO ĐƯỢC Ở TASK-192: chỉ **69/220 (31%)** action từng GỌI THÀNH CÔNG.
//   Nguyên nhân: kỹ thuật «ID BỊA ⇒ 400» (dùng suốt phiên) **CHỈ chạy ĐƯỜNG TỪ CHỐI**.
//   ⇒ ⭐ Bài này chạy **ĐƯỜNG THÀNH CÔNG**: TẠO THẬT → SỬA THẬT → XOÁ THẬT trên **dữ liệu dùng-một-lần**.
//
// ⛔⛔ SỬA LỖI CỦA CHÍNH TÔI Ở LẦN CHẠY ĐẦU — hai lỗi, cả hai đều đáng ghi:
//   ① **PAYLOAD SAI vì tôi ĐOÁN tên trường** (⛔ không đọc mã): tôi gửi `groupCode` + `permissions: []`
//      nhưng `AdminSystemUseCase.saveBusinessRoleGroup` đọc **`code`** · **`engineRole`** · **`scopeIds`**
//      (`scopeIds` **BẮT BUỘC**, ⛔ rỗng thì ném «Nhóm quyền phải có ít nhất một Phạm vi nghiệp vụ»).
//      ⇒ ⭐ đúng bài học «⛔ ĐỪNG ĐOÁN TÊN TRƯỜNG — ĐỌC MÃ».
//   ② **BÀI KIỂM BÁO ĐỘNG GIẢ KHI BƯỚC ① HỎNG**: nó in «save trả 200 nhưng không thấy bản ghi ⇒ ghi thất bại
//      âm thầm» (⛔ SAI — save trả **400**) và «không dọn được — phải dọn tay» (⛔ không có gì để dọn).
//      ⇒ ⭐ SỬA: khi ① hỏng thì ②③④ **BỎ QUA có ghi chú**, ⛔ không tính là thất bại.
//      ⭐ Một bài kiểm báo **thất bại dây chuyền giả** là **TÍN HIỆU SAI** — cùng loại với `tomTatBuoc` (TASK-181).
//
// ⛔ KỶ LUẬT: bọc bằng `chup-so-dong.mjs --truoc/--sau` và **XOÁ SẠCH** ở cuối.
import { readFileSync } from "node:fs";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];
const MA = "E2E_BRG_" + Date.now().toString(36).toUpperCase();
// ⭐ Dữ liệu THẬT đọc từ CSDL (`business_scope_catalog`, active=1) — ⛔ không đoán
const SCOPE = "BSCOPE-BCH";
const ENGINE = "project";   // ⭐ thuộc ALLOWED_ENGINES (AdminSystemUseCase:317)
tieuDe("ĐƯỜNG THÀNH CÔNG — vòng đời CRUD `business_role_group` (mã " + MA + ")");

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const dem = (bs) => Object.fromEntries(KHOA.map((k) => [k, (bs[k] || []).length]));
const d0 = dem(bs0);
const tim = (bs) => (bs.businessRoleGroups || []).find((g) =>
  String(g.code || g.groupCode || "").toUpperCase() === MA || String(g.name || "").includes(MA));

let id = null, taoOk = false;

// ── ① TẠO THẬT ──────────────────────────────────────────────────────────────────────────
await buoc("① save_business_role_group (TẠO THẬT)", async () => {
  const r = await call("save_business_role_group", {
    code: MA, name: "Nhóm nghiệp vụ E2E " + MA, description: "TASK-193 · đường thành công · sẽ xoá",
    engineRole: ENGINE, scopeIds: [SCOPE], sortOrder: 999,
  }, { boQuaLoi: true });
  if (!r.ok) throw new Error(`save thất bại: «${String(r._loi || "").slice(0, 100)}»`);
  taoOk = true;
  return `200 · ${String(r.message || "").slice(0, 60)}`;
}, BC);

// ⭐ KHI ① HỎNG THÌ ②③④ LÀ **BỎ QUA**, ⛔ KHÔNG PHẢI THẤT BẠI (sửa lỗi báo động giả)
const BOQUA = (ly) => { BC.push({ ten: ly, ok: true, loi: null }); console.log(`  [BO QUA] ${ly}`); };
if (!taoOk) {
  BOQUA("②③④ bỏ qua — bước ① CHƯA tạo được gì nên ⛔ KHÔNG có gì để đọc/sửa/xoá");
  console.log("      ⓘ ⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn.");
} else {
  // ── ② ĐỌC LẠI ĐỂ XÁC NHẬN ĐÃ GHI (⛔ không tin lời hứa 200) ───────────────────────────
  let bs1 = await bootstrap();
  await buoc("② ĐỌC LẠI — phải THẤY bản ghi vừa tạo", async () => {
    const g = tim(bs1);
    if (!g) throw new Error(`⛔ save trả 200 nhưng ⛔ KHÔNG thấy bản ghi «${MA}» ⇒ GHI THẤT BẠI ÂM THẦM`);
    id = String(g.id || "");
    return `thấy id=${id.slice(0, 18)}… · mã=${String(g.code || "")} · SL tổng=${(bs1.businessRoleGroups || []).length}`;
  }, BC);

  // ── ③ SỬA THẬT ────────────────────────────────────────────────────────────────────────
  await buoc("③ set_business_role_group_status (SỬA THẬT)", async () => {
    if (!id) throw new Error("⛔ không có id ⇒ bỏ qua (bước ② đã hỏng)");
    const r = await call("set_business_role_group_status", { groupId: id, id, active: false }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`set_status thất bại: «${String(r._loi || "").slice(0, 90)}»`);
    return `200 · ${String(r.message || "").slice(0, 60)}`;
  }, BC);

  // ── ④ XOÁ THẬT (BẮT BUỘC) ─────────────────────────────────────────────────────────────
  await buoc("④ delete_business_role_group (XOÁ THẬT — DỌN SẠCH)", async () => {
    if (!id) throw new Error(`⛔ không có id ⇒ ⛔ KHÔNG DỌN ĐƯỢC — dọn tay mã «${MA}»!`);
    const r = await call("delete_business_role_group", { groupId: id, id }, { boQuaLoi: true });
    if (!r.ok) throw new Error(`⛔ XOÁ THẤT BẠI: «${String(r._loi || "").slice(0, 90)}» ⇒ CÒN RÁC «${MA}»`);
    return `200 · ${String(r.message || "").slice(0, 60)}`;
  }, BC);
}

// ── ⑤ XÁC NHẬN SẠCH ─────────────────────────────────────────────────────────────────────
const bs2 = await bootstrap();
await buoc("⑤ ĐỌC LẠI — ⛔ không còn bản ghi nào mang mã dọn", async () => {
  if (tim(bs2)) throw new Error(`⛔ VẪN CÒN «${MA}» ⇒ DỌN THẤT BẠI`);
  return `sạch ✓ · SL tổng=${(bs2.businessRoleGroups || []).length}`;
}, BC);

const d2 = dem(bs2);
const doi = KHOA.filter((k) => d0[k] !== d2[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (tạo rồi xoá ⇒ về như cũ)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d2[k]}`).join(" · ")}`);
if (doi.length) console.log("   ⛔ Mảng đổi KHÁC dự kiến ⇒ phải kiểm tay trước khi kết luận.");
console.log(`   ⓘ Mã dùng-một-lần: ${MA}`);

console.log("\n" + tomTatBuoc("VÒNG ĐỜI business_role_group (ĐƯỜNG THÀNH CÔNG)", BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
