/**
 * CẤP QUYỀN CHỨC NĂNG THEO VAI TRÒ NGHIỆP VỤ (Giai đoạn 8 trước khi chạy chuỗi kho).
 *
 * VÌ SAO CẦN FILE NÀY: `create_po`/`approve_po` chỉ cần VAI TRÒ (`requireRole`), nên tới GĐ7 vẫn chạy
 * được. Nhưng từ GĐ8 trở đi, `receive_goods` / `confirm_delivery` bị chặn ở CỔNG MODULE
 * (`SystemController:230` → `RbacService.requireActionModule`), tra `user_module_permissions`.
 * Tài khoản E2E được cấp đủ khoá module nhưng mọi cờ đều 0 ⇒ 403.
 *
 * Ma trận lấy từ `ActionRbacRegistry` (module + capability):
 *   receive_goods        → receiving | warehouse_receipt · canCreate
 *   confirm_delivery     → receiving | warehouse_receipt · canApprove
 *   create_transfer_order/approve/ship/receive → inventory · canCreate/canApprove/canEdit/canApprove
 *   issue_stock          → teams | warehouse_issue · canCreate
 *   approve_stock_issue  → approvals · canApprove
 *   issue_stock_confirm  → warehouse_issue · canCreate
 *   confirm_stock_issue  → warehouse_issue · canEdit
 *   create_issue_grn / create_transfer_grn → receiving · canCreate
 *   return_stock         → teams | stocktake · canCreate
 * Ngoài ra `FileUseCase.moduleAllowed` còn đòi `can_edit=1` trên `receiving|central_warehouse`
 * để tải ảnh giao hàng (PurchaseManagementUseCase:412 chặn BCH xác nhận nếu chưa có ảnh).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const XEM = { canView: 1, canUse: 1 };
const GHI = { canView: 1, canUse: 1, canCreate: 1, canEdit: 1 };
const DUYET = { canView: 1, canUse: 1, canApprove: 1 };

// Quyền tối thiểu theo vai trò — mô phỏng cách một công ty cấu quyền thật, không phải «cho tất cả».
const VAI_TRO = {
  "e2e.tk": { ten: "Thủ kho công trường", quyen: {
    receiving: GHI, warehouse_receipt: GHI, delivered: XEM,
    inventory: GHI, warehouse_issue: GHI, stocktake: XEM, teams: XEM, central_warehouse: XEM,
  } },
  "e2e.cht": { ten: "Chỉ huy trưởng", quyen: {
    receiving: DUYET, warehouse_receipt: DUYET, delivered: XEM,
    teams: { ...XEM, canCreate: 1 }, approvals: DUYET, inventory: XEM, warehouse_issue: XEM,
  } },
  "e2e.bgd": { ten: "Giám đốc", quyen: {
    approvals: DUYET, receiving: DUYET, warehouse_receipt: DUYET, inventory: DUYET, reports: { ...XEM, canExport: 1 },
  } },
  "e2e.khnv": { ten: "Nhân viên Kế hoạch", quyen: {
    inventory: { ...GHI, canApprove: 1 }, purchasing: GHI, teams: XEM, supplier_catalog: XEM,
  } },
  "e2e.project": { ten: "Nhân viên Dự án", quyen: {
    teams: { ...XEM, canCreate: 1 }, warehouse_issue: XEM, stocktake: XEM, receiving: XEM, inventory: XEM,
    // ⛔ VÁ 05/10/2026 (GO-LIVE · TASK-180 · khiếm khuyết B) — THÊM `requests`.
    //   VÌ SAO: `ActionRbacRegistry` gác `create_request` bằng **module `requests` + `canCreate`**
    //     (dòng 98: `Map.entry("create_request", List.of("requests"))`
    //      dòng 365: `Map.entry("create_request", "canCreate")`).
    //   ⚠️ ĐO ĐƯỢC: ma trận này **⛔ KHÔNG vai trò nào có `requests` + `canCreate`** — chỉ `e2e.thukysa`
    //     có `requests: XEM` (chỉ XEM) ⇒ **`create_request` BẤT KHẢ THI với MỌI tài khoản E2E** ⇒
    //     `giai-doan-09` dừng ở bước **9.A2**. Và `requests` còn gác **6 action**:
    //     `cancel_request` · `create_request` · `delete_request` · `preview_request_import` ·
    //     `resubmit_request` · `update_returned_request` ⇒ **cả một nhóm chức năng ⛔ không cấp được cho ai**.
    //   ⭐ VÌ SAO CHỌN `e2e.project`: (a) `giai-doan-09` **gọi `create_request` bằng chính `e2e.project`**;
    //     (b) **hợp nghiệp vụ** — nhân viên dự án lập phiếu đề nghị mua hàng là luồng đúng của ERP;
    //     (c) **theo khuôn có sẵn** trong tệp: `teams: { ...XEM, canCreate: 1 }` — ⛔ không phát minh dạng mới.
    requests: { ...XEM, canCreate: 1 },
  } },
  "e2e.to": { ten: "Tổ trưởng (đơn vị trả vật tư)", quyen: {
    // Tổ đội KHÔNG xuất kho; nó là đơn vị NHẬN vật tư rồi TRẢ LẠI kho công trường.
    teams: { ...XEM, canCreate: 1 }, warehouse_issue: XEM, stocktake: XEM, receiving: XEM, inventory: XEM,
  } },
  "e2e.kt": { ten: "Kế toán", quyen: {
    inventory: { ...XEM, canApprove: 1 }, purchasing: { ...XEM, canApprove: 1 }, payments: GHI, reports: { ...XEM, canExport: 1 },
  } },
  // ── GĐ9: hai tài khoản DỰ PHÒNG cùng vai trò, dùng để chứng minh bước phê duyệt
  //    ĐỔI NGƯỜI được theo `approval_project_assignments` (không hardcode tên người).
  "e2e.chtsa": { ten: "Chỉ huy trưởng (dự phòng A)", quyen: {
    receiving: DUYET, warehouse_receipt: DUYET, teams: { ...XEM, canCreate: 1 },
    approvals: DUYET, inventory: XEM,
  } },
  "e2e.thukysa": { ten: "Thư ký TGD (dự phòng A)", quyen: {
    approvals: DUYET, delivered: XEM, requests: XEM,
  } },
};

tieuDe("CẤP QUYỀN CHỨC NĂNG THEO VAI TRÒ NGHIỆP VỤ");

// ── 8.0 Tạo tài khoản mới (tổ đội + 2 tài khoản dự phòng cho GĐ9 chống hardcode) ──
await login("admin", "Admin123456@");
let bs = await bootstrap();
const TAI_KHOAN_MOI = [
  { username: "e2e.to", employeeCode: "E2E-TO", fullName: "E2E Tổ Trưởng", email: "e2e.to@vntech.vn", role: "team", note: "E2E-08 · tài khoản tổ đội để trả vật tư" },
  { username: "e2e.chtsa", employeeCode: "E2E-CHTSA", fullName: "E2E Chỉ Huy Trưởng SA", email: "e2e.chtsa@vntech.vn", role: "cht", note: "E2E-09 · chỉ huy trưởng dự phòng để thử đổi người duyệt" },
  { username: "e2e.thukysa", employeeCode: "E2E-THKSA", fullName: "E2E Thư ký SA", email: "e2e.thukysa@vntech.vn", role: "thuky", note: "E2E-09 · thư ký dự phòng để thử đổi người duyệt" },
];
for (const tk of TAI_KHOAN_MOI) {
  if (bs.users.some((u) => u.username === tk.username)) { console.log("      ✔ " + tk.username + " đã tồn tại"); continue; }
  const donVi = tt.donVi["Dự án"];
  await buoc("create_user " + tk.username + " (vai trò `" + tk.role + "`)", () => coThat("create_user", {
    ...tk, organizationUnitId: donVi, password: MK, projectIds: [tt.duAn],
  }), BC);
  bs = await bootstrap();
  if (!bs.users.some((u) => u.username === tk.username)) {
    console.log("      [LOI] không tạo được " + tk.username + " — dừng, không đoán tiếp.");
    process.exitCode = 1;
  } else console.log("      ✔ đã có " + tk.username);
}

// ── 8.1 CẤP QUYỀN PHÒNG BAN TRƯỚC (tab «Phân quyền phòng ban») ───────────────────
// BẮT BUỘC PHẢI LÀM TRƯỚC: `saveUserAccess` gọi `assertDepartmentAllowsPermissions`
// (UserManagementUseCase:266 → :480) và TỪ CHỐI mọi quyền mà phòng ban chưa có nền
// (`department_module_permissions.active=1 AND can_view=1`).
// ⓘ Cổng này CHỈ đọc `can_view` — nên ta cấp đúng mức tối thiểu (canView=1) cho phòng ban;
//   quyền thật (create/edit/approve) vẫn do bước 8.2 gán từng người.
const canBoPhan = new Map();
for (const [tk, moTa] of Object.entries(VAI_TRO)) {
  const u = bs.users.find((x) => x.username === tk);
  if (!u?.organizationUnitId) continue;
  if (!canBoPhan.has(u.organizationUnitId)) canBoPhan.set(u.organizationUnitId, new Set());
  for (const k of Object.keys(moTa.quyen)) canBoPhan.get(u.organizationUnitId).add(k);
}
console.log("\n[8.1] Cấp nền quyền cho " + canBoPhan.size + " đơn vị (mức tối thiểu canView=1)");
for (const [org, keys] of canBoPhan) {
  const tenPB = bs.organizationUnits.find((o) => o.id === org)?.name || org.slice(0, 14);
  let n = 0;
  for (const k of keys) {
    await buoc("save_department_permission · " + tenPB + " · " + k, () => coThat("save_department_permission", {
      organizationUnitId: org, moduleKey: k, canView: 1, canUse: 0, canCreate: 0, canEdit: 0, canApprove: 0, canExport: 0,
    }), BC);
    n++;
  }
  console.log("      · " + tenPB + ": " + n + " chức năng nền");
}

// ── 8.2 Cộng cờ quyền vào bộ quyền sẵn có rồi lưu lại ───────────────────────────
// ⚠ `save_user_access` là THAY THẾ TOÀN BỘ. Phải trả lại MỌI dòng quyền đang có, kèm dữ liệu phạm vi.
for (const [tenDangNhap, moTa] of Object.entries(VAI_TRO)) {
  const u = bs.users.find((x) => x.username === tenDangNhap);
  if (!u) { console.log("      [BO QUA] " + tenDangNhap + " — không có tài khoản"); continue; }
  const hienTai = bs.allModulePermissions.filter((p) => p.userId === u.id);
  const gop = new Map(hienTai.map((p) => [p.moduleKey, { ...p }]));
  for (const [khoa, co] of Object.entries(moTa.quyen)) {
    const cu = gop.get(khoa);
    // Chỉ NÂNG cờ, không hạ: giữ nguyên mọi quyền nghiệp vụ đã cấp sẵn cho tài khoản.
    gop.set(khoa, {
      userId: u.id, moduleKey: khoa, canView: 1, canUse: 1, canCreate: 0, canEdit: 0,
      canApprove: 0, canExport: 0, permissionExpiresAt: null,
      // ⛔ HOÀN TÁC 05/10/2026 (TASK-177) — chỗ này TỪNG bị tôi đổi thành `"manual_override"` với
      //   giả thuyết «khai `department_default` nên cờ cấp riêng bị bỏ». ⛔ GIẢ THUYẾT SAI:
      //   `UserManagementUseCase.saveUserAccess` (dòng ~325) **TỰ TÍNH** `permissionSource`:
      //       String source = differsFromDefault ? "manual_override" : "department_default";
      //   ⇒ giá trị trong payload ⛔ **BỊ BỎ QUA HOÀN TOÀN** ⇒ đổi ở đây ⛔ **không có tác dụng gì**.
      //   ⭐ Giữ nguyên `department_default` cho khớp hành vi thật, ⛔ không để lại «bản vá» vô hiệu
      //   gây hiểu nhầm cho người đọc sau.
      //   ⛔ TÌNH TRẠNG THẬT: `e2e.to`/`e2e.tk` có `can_use=0` trên mọi module kho ⛔ **CHƯA rõ nguyên nhân**
      //   — đã loại trừ: (a) backend không lưu cờ (CÓ lưu: 1989 dòng `can_use=1`);
      //   (b) hàm `assertDepartmentAllowsPermissions` kẹp cờ (nó CHỈ đọc `can_view`, và THROW 400
      //   chứ không kẹp). ⭐ Muốn biết chắc phải **CHẠY THỬ THẬT** (cấp 1 module cho 1 tài khoản rồi
      //   đọc lại dòng DB) — ⛔ cần user cho phép vì đó là `save_user_access` (replace-all).
      permissionSource: "department_default",
      ...(cu || {}), ...co,
    });
  }
  const modulePermissions = [...gop.values()];
  const scopes = bs.userScopes.filter((s) => s.userId === u.id);
  const gopPhamVi = new Map();
  for (const s of scopes) if (s.projectId) gopPhamVi.set(s.projectId, { projectId: s.projectId, permission: s.permission });
  // ⚠ KHÔNG dùng `has()` — `create_user { projectIds: [tt.duAn] }` đã tạo sẵn dòng phạm vi
  //   với mức `read`, nên `has()` luôn đúng ⇒ tài khoản mãi không lên `write` ⇒ mọi cổng
  //   `requireProjectAccess(..., write = true)` trả 403 «không có quyền tại dự án này».
  //   Phải NÂNG MỨC khi mức hiện tại thấp hơn `write`.
  const hienTaiDuAn = gopPhamVi.get(tt.duAn);
  if (!hienTaiDuAn || hienTaiDuAn.permission !== "write") {
    gopPhamVi.set(tt.duAn, { projectId: tt.duAn, permission: "write" });
  }
  const gopKho = new Map();
  for (const s of scopes) if (s.warehouseId) gopKho.set(s.warehouseId, { warehouseId: s.warehouseId, permission: s.permission });
  // ⚠ `tt.khoTeam` là mảng OBJECT `{id, code}` — gửi thẳng `warehouseId: object` sẽ vi phạm
  //   FK `user_warehouse_scopes.warehouse_id` ⇒ HTTP 409 «vi phạm ràng buộc». Phải lấy `.id`.
  const khoIds = [tt.khoSite, ...(tt.khoTeam || []).map((k) => (typeof k === "string" ? k : k.id))];
  for (const id of khoIds) {
    if (id && !gopKho.has(id)) gopKho.set(id, { warehouseId: id, permission: "write" });
  }
  await buoc("save_user_access " + tenDangNhap, () => coThat("save_user_access", {
    userId: u.id,
    projectScopes: [...gopPhamVi.values()],
    warehouseScopes: [...gopKho.values()],
    modulePermissions,
  }), BC);
  console.log("      · " + tenDangNhap + " (" + moTa.ten + "): "
    + Object.keys(moTa.quyen).map((k) => k + (moTa.quyen[k].canApprove ? "·DUYET" : moTa.quyen[k].canEdit ? "·GHI" : "")).join(", "));
}

// ── 8.3 Đối chiếu lại từ máy chủ ──────────────────────────────────────────────
bs = await bootstrap();
console.log("\n[Đối chiếu] Cổng module của các action chuỗi kho:");
const KIEM = [
  ["receive_goods", "e2e.tk", "receiving", "canCreate"],
  ["xác nhận giao hàng", "e2e.cht", "receiving", "canApprove"],
  ["tạo điều chuyển (STO)", "e2e.tk", "inventory", "canCreate"],
  ["duyệt STO", "e2e.khnv", "inventory", "canApprove"],
  ["xuất kho", "e2e.project", "teams", "canCreate"],
  ["duyệt xuất kho", "e2e.bgd", "approvals", "canApprove"],
  ["trả vật tư", "e2e.to", "teams", "canCreate"],
];
for (const [ten, tk, khoa, co] of KIEM) {
  const u = bs.users.find((x) => x.username === tk);
  const p = bs.allModulePermissions.find((x) => x.userId === u?.id && x.moduleKey === khoa);
  const duoc = !!p?.[co];
  console.log("      " + (duoc ? "✔" : "✘") + " " + ten.padEnd(24) + " " + tk.padEnd(12) + khoa + "." + co
    + " = " + (p?.[co] ?? "KHÔNG CÓ DÒNG QUYỀN"));
  if (!duoc) process.exitCode = 1;
}
ghi({ giaiDoan: "8-perm", buoc: "ket-thuc", thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
tomTatBuoc("CẤP QUYỀN CHỨC NĂNG THEO VAI TRÒ", BC);