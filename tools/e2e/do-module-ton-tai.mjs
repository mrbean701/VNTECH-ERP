// TASK-142 / D-081 — Điểm chưa khép lại: 6 tài khoản bị 403 «Thao tác chưa được khai báo quyền».
// Giả thuyết mới: `ActionRbacRegistry` trỏ tới module key `dept_legal_contract_review`,
// nhưng module key đó KHÔNG TỒN TẠI trong danh mục module thật ⇒ không có module để tra
// ⇒ hệ thống ném thông báo «chưa khai báo quyền».
// Nếu đúng thì đây KHÔNG phải lỗi kiểm quyền, mà là **module trỏ tới không tồn tại**.
// Cách kiểm: đọc danh mục module do MÁY CHỦ trả về (admin), không đọc mã nguồn.
import { login, call, bootstrap, ghi } from "./client.mjs";

const MODULE_REVIEW = "dept_legal_contract_review";
const NHAN = "Vn@2026Test";

async function chay() {
  await login("admin", "Admin123456@");
  const bs = await bootstrap();

  const ung = bs.moduleCatalog || bs.modules || bs.moduleList || [];
  if (!Array.isArray(ung)) {
    console.log("KHONG DOC DUOC danh muc module.");
    console.log("  cac khoa bootstrap co the chua module: " +
      Object.keys(bs).filter((k) => /modul|perm/i.test(k)).join(", ") || "(khong co khoa nao khop)");
    process.exitCode = 2;
    return;
  }

  const keys = ung.map((m) => m.key ?? m.moduleKey ?? m.code ?? m.id);
  console.log(`Danh muc module ma may chu tra ve: ${keys.length} muc`);
  console.log(`\nKiem tra module key ma RbacRegistry tro toi: "${MODULE_REVIEW}"`);
  console.log(`  co trong danh muc khong? ${keys.includes(MODULE_REVIEW) ? "CO" : "KHONG CO"}`);
  console.log(`  cac module dept_legal* dang ton tai: ${
    keys.filter((k) => typeof k === "string" && k.startsWith("dept_legal")).join(", ") || "(khong co)"}`);
  console.log(`  mau module bat ky: ${keys.slice(0, 6).join(", ")}`);

  const ketLuan = keys.includes(MODULE_REVIEW)
    ? "GIA THUYET SAI — module co that trong danh muc; van de nam o cho khac."
    : "GIA THUYET DUNG — module ma RbacRegistry tro toi KHONG TON TAI trong danh muc module.";
  console.log(`\n=> ${ketLuan}`);

  await login("e2e.ns", NHAN);
  const thu = await call("list_contract_review", {}, { boQuaLoi: true });
  console.log(`\nDoi chieu tren may chu: e2e.ns goi list_contract_review -> HTTP ${thu?.status}`);
  console.log(`  loi: ${thu?._loi || thu?.error || "(khong loi)"}`);

  ghi("module-key-ton-tai", { module: MODULE_REVIEW, co: keys.includes(MODULE_REVIEW), ketLuan, soModule: keys.length });
  process.exitCode = 0;
}

await chay();