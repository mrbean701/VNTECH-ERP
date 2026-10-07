// TASK-142 / D-081 — Phép thử QUYẾT ĐỊNH cho giả thuyết còn lại ở vòng 200.
// Câu hỏi: registry RBAC đang chạy CÓ hoạt động không?
//
// RbacService ném HAI thông báo khác nhau, phân biệt được ngay:
//   A) «Thao tác chưa được khai báo quyền trong hệ thống»  ⇔ required.isEmpty()  ⇔ CHƯA KHAI
//   B) «Tài khoản chưa được quản trị viên cấp đúng quyền» ⇔ có module, thiếu quyền ⇔ ĐÃ KHAI
//
// Nếu gọi 1 action CHẮC CHẮN đã khai (dòng 215: save_material → material_catalog)
// mà nhận thông báo B  ⇒ registry CHẠY ⇒ kết luận «manage_contract_review chưa khai trong bản
// đang chạy» là ĐÚNG.
// Nếu nhận thông báo A ⇒ cả registry trong bản chạy đều cũ.
//
// ⛔ AN TOÀN: mọi lời gọi dùng payload RỖNG. guard chạy TRƯỚC; nếu qua guard thì thiếu tham số
// ⇒ 400, không ghi gì. Lời gọi nào trả 200 sẽ được in CẢNH BÁO để kiểm lại thủ công.
import { login, call, ghi } from "./client.mjs";

const NHAN = "Vn@2026Test";
const A = "Thao tác chưa được khai báo quyền trong hệ thống";
const B = "Tài khoản chưa được quản trị viên cấp đúng quyền";

// Action lấy từ chính ActionRbacRegistry — tất cả đều có module KHÁC dept_legal,
// nên kết quả đo được làm chuẩn so sánh, không phụ thuộc vào vòng tròn suy luận.
const THU = [
  ["save_material", "material_catalog"],
  ["save_material_category", "material_catalog"],
  ["save_mar_approval", "boq|purchasing"],
  ["save_material_external_code", "material_catalog"],
  ["list_contract_review", "dept_legal_contract_review"],
  ["work_scope", "(khong khai)"],
];

async function chay() {
  // Dùng tài khoản KHÔNG thuộc ban lãnh đạo, để không bị nhánh isCompanyLeadership bỏ qua.
  await login("e2e.ns", NHAN);
  const ketQua = [];

  for (const [action, module] of THU) {
    const r = await call(action, {}, { boQuaLoi: true });
    const loi = r?._loi || r?.error || "";
    const nhan =
      loi.includes(A) ? "A — CHUA KHAI (module rong)" :
      loi.includes(B) ? "B — DA KHAI, thieu quyen" :
      loi ? `KHAC — ${loi.slice(0, 48)}` : "(khong loi)";
    ketQua.push({ action, module, http: r?.status, nhan });
    console.log(`  ${action.padEnd(28)} HTTP ${String(r?.status).padEnd(4)} ${nhan}`);
    if (r?.status === 200) console.log("     ^ CẢNH BÁO: trả 200 — cần kiểm tra xem có ghi dữ liệu không");
  }

  const coA = ketQua.filter((k) => k.nhan.startsWith("A"));
  const coB = ketQua.filter((k) => k.nhan.startsWith("B"));

  console.log(`\nA (chua khai module) : ${coA.length}/${ketQua.length} — ${coA.map((k) => k.action).join(", ") || "-"}`);
  console.log(`B (da khai, thieu quyen): ${coB.length}/${ketQua.length} — ${coB.map((k) => k.action).join(", ") || "-"}`);

  let ketLuan;
  if (coB.length > 0 && coA.some((k) => k.action === "list_contract_review")) {
    ketLuan = "REGISTRY CHAY. `list_contract_review` CHUA KHAI trong ban dang chay, "
      + "con cac action khai truoc do VAN KHAI. ⇒ GIA THUYET VONG 200 XAC NHAN.";
  } else if (coB.length > 0) {
    ketLuan = "REGISTRY CHAY va `list_contract_review` da khai ⇒ can dung lai ket luan.";
  } else {
    ketLuan = "KHONG TIM THAY thong bao B ⇒ chua phan biet duoc. KHONG KET LUAN.";
  }
  console.log(`\n=> ${ketLuan}`);

  ghi("registry-co-chay-khong", { ketQua, ketLuan });
  process.exitCode = 0;
}

await chay();