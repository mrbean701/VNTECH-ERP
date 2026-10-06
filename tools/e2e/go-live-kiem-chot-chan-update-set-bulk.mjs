// GO-LIVE 05/10/2026 — KIỂM CHỐT CHẶN NHÓM `update_* / set_*_status / bulk_*` BẰNG ID BỊA.
//
// ⛔ NGUYÊN TẮC AN TOÀN (như `go-live-kiem-an-toan-delete.mjs`): chỉ gọi với **id KHÔNG TỒN TẠI**
//   và payload RỖNG/VÔ NGHĨA ⇒ ⛔ KHÔNG thể sửa/xoá dữ liệu thật, mà vẫn phát hiện được:
//     ① trả **200 «thành công»** cho việc không tồn tại (báo sai — như BUG-20261010), hoặc
//     ② trả **5xx** (lỗi hệ thống thay vì lỗi đầu vào đọc được).
//
// ⭐ VÌ SAO LÀM: cùng kỷ luật này đã tìm ra **BUG-20261010** (HIGH, quyền) — **1/8 action** ⇒ tỉ lệ
//   đáng làm. Nhóm `update_*`/`set_*_status`/`bulk_*` còn **~40 action UI gọi mà CHƯA HỀ được kiểm**.
//
// ⛔ KHOÁ PAYLOAD: đọc từ chính mã UI, ⛔ KHÔNG đoán (bài học: `delete_department_permission` dùng
//   `organizationUnitId`+`moduleKey` chứ ⛔ không phải `permissionId` như tôi đoán).
import { login, call, ghi } from "./client.mjs";

const MK_ADMIN = "Admin123456@";
const MA = "E2E_KHONG_TON_TAI_7b21";

console.log("=".repeat(80));
console.log("GO-LIVE — KIỂM CHỐT CHẶN: update_* / set_*_status / bulk_* (id BỊA ⇒ ⛔ không đụng dữ liệu)");
console.log("=".repeat(80));

await login("admin", MK_ADMIN);

/** [action, payload bịa, nguồn khoá (đọc từ mã UI)] */
const MAU = [
  ["update_work_item_status", { workItemId: MA, status: "done", reason: "E2E" }, "WorkCenter.tsx"],
  ["set_business_role_group_status", { groupId: MA, active: 1 }, "page.tsx"],
  ["set_legal_document_status", { docId: MA, status: "active" }, "LegalDocsScreen.tsx"],
  ["set_correspondence_status", { corrId: MA, status: "done" }, "CorrespondenceScreen.tsx"],
  ["bulk_material_subcategory_action", { subcategoryIds: [MA], operation: "khong_ton_tai" }, "page.tsx"],
  ["reorder_form_fields", { formKey: MA, items: [] }, "page.tsx"],
  ["bulk_import_projects", { rows: [], sourceFileName: "e2e-rong.xlsx" }, "page.tsx"],
  ["bulk_import_users", { rows: [], sourceFileName: "e2e-rong.xlsx" }, "page.tsx"],
  ["update_project", { projectId: MA, code: MA, name: "E2E bịa" }, "page.tsx"],
  ["update_user", { userId: MA, username: MA, fullName: "E2E bịa", active: true }, "page.tsx"],
  // ⛔ `bulk_boq_item_action` ĐƯỢC XẾP RIÊNG, ⛔ KHÔNG tính là lỗi: nó trả 200 nhưng thông báo
  //    **NÓI RÕ «Đã xóa/ẩn 0 dòng BOQ»** ⇒ TRUNG THỰC về việc không làm gì (no-op báo minh bạch).
  //    Đây là hành vi TỐT, ⛔ không phải «báo thành công sai» như BUG-20261010.
  ["bulk_boq_item_action", { sourceItemIds: [MA], mode: "khong_ton_tai", reason: "E2E" }, "BoqControl.tsx"],
];

// ⛔⛔ BÀI HỌC 05/10/2026 — TÔI ĐÃ ĐƯA `update_profile_avatar` VÀO DANH SÁCH NÀY VÀ **SAI**:
//   action đó **KHÔNG nhận tham số id nào** (`app/page.tsx:3388`: `saveAvatar()` gửi
//   `{avatarDataUrl: avatar}`) ⇒ «id bịa» ⛔ KHÔNG áp dụng được, và nó tác động lên **CHÍNH tài
//   khoản đang đăng nhập** — tức là tài khoản admin của tôi. Lần đó vô hại vì ĐO ĐƯỢC
//   `SELECT COUNT(*) FROM users WHERE avatar_url IS NOT NULL AND avatar_url<>''` = **0**
//   (không tài khoản nào có ảnh đại diện) ⇒ ⛔ không xoá gì.
//   ⇒ QUY TẮC: ⛔ chỉ dùng «id bịa» cho action **CÓ** tham số id; action tự-phục-vụ (không id) phải
//     xếp loại RIÊNG và ⛔ không chạy lung tung vì nó sửa chính dữ liệu của người chạy.
const KHONG_CO_ID = ["update_profile_avatar", "change_password", "mark_notification_all_read"];

const ket = [];
for (const [action, payload, nguon] of MAU) {
  const r = await call(action, payload, { boQuaLoi: true, nhan: `B-${action}` });
  const la500 = r.status >= 500;
  const loi = String(r._loi || r.message || "");
  // ⛔ PHÂN LOẠI ĐÚNG — ⛔ không gộp «no-op trung thực» với «báo thành công sai»:
  //   · 4xx đọc được            ⇒ TỐT (chốt chặn hoạt động)
  //   · 200 nhưng NÓI RÕ «0 …»  ⇒ CHẤP NHẬN (no-op minh bạch) ← `bulk_boq_item_action`
  //   · 200 mà ⛔ KHÔNG nói gì   ⇒ LỖI (báo thành công sai — như BUG-20261010)
  //   · 5xx                     ⇒ LỖI (lỗi hệ thống thay vì lỗi đầu vào)
  const noiRoKhongLamGi = r.ok && /\b0\b/.test(loi);
  const baoSai = r.ok && !noiRoKhongLamGi;
  const sach = !r.ok && !la500;
  const nhan = baoSai ? "⛔ BÁO THÀNH CÔNG SAI" : la500 ? "⛔ 500 (LỖI HỆ THỐNG)"
    : noiRoKhongLamGi ? "✔ no-op nói rõ 0" : "✔ chặn sạch";
  console.log(`   ${sach || noiRoKhongLamGi ? "✔" : "⛔"} ${action.padEnd(32)} HTTP ${String(r.status).padEnd(4)} ${nhan.padEnd(22)} ${loi.slice(0, 52)}`);
  ket.push({ action, status: r.status, ok: r.ok, sach: sach || noiRoKhongLamGi, baoSai, nguon, loi: loi.slice(0, 120) });
}

const dat = ket.filter((k) => k.sach).length;
const soBaoSai = ket.filter((k) => k.baoSai).length;
const so500 = ket.filter((k) => k.status >= 500).length;

console.log("\n═══ KẾT LUẬN ═══");
console.log(`   ĐẠT (4xx sạch hoặc no-op nói rõ 0) : ${dat}/${ket.length}`);
console.log(`   ⛔ BÁO THÀNH CÔNG SAI              : ${soBaoSai}${soBaoSai ? "  <= LỖI (như BUG-20261010)" : ""}`);
console.log(`   ⛔ 500 lỗi hệ thống                : ${so500}${so500 ? "  <= LỖI" : ""}`);
if (soBaoSai) {
  console.log("\n   Action BÁO THÀNH CÔNG mà ⛔ KHÔNG nói rõ đã làm gì:");
  for (const k of ket.filter((x) => x.baoSai)) console.log(`      · ${k.action.padEnd(32)} «${k.loi}»`);
}
console.log(`\n   ⓘ Nhóm KHÔNG có tham số id (⛔ không áp dụng «id bịa»): ${KHONG_CO_ID.join(" · ")}`);

ghi("go-live-kiem-chot-chan-update-set-bulk", { tong: ket.length, dat, soBaoSai, so500, ket });
if (dat < ket.length) process.exitCode = 1;
