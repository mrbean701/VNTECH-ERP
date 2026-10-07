// TRÍCH XUẤT DANH SÁCH ACTION CỦA API POST /api/system
//
// MỤC TIÊU: đọc MÃ NGUỒN (chỉ đọc, không sửa tệp nào của dự án) để lấy TOÀN BỘ tên action
// mà gateway chấp nhận, rồi ghi ra tools/e2e/action-registry.json cho kịch bản kiểm thử E2E.
//
// NGUỒN SỰ THẬT (thứ tự ưu tiên):
//   1. java-backend/web/.../SystemController.java  -> `switch (action) { case "ten_action" -> }`
//      ĐÂY LÀ BẢN CHẠY THẬT trên cổng 9000. Mọi tên action API Java nhận đều nằm trong switch này.
//   2. scripts/system-route.mjs                     -> `if (action === "ten_action")`
//      Bản Node legacy/tham chiếu. Chỉ dùng để đối chiếu.
//   3. java-backend/application/.../ActionRbacRegistry.java -> `Map.entry("ten_action", ...)`
//      Ma trận quyền action -> module. KHÔNG phải nơi đăng ký action, chỉ dùng đối chiếu.
//
// CHẠY: node tools/e2e/trich-xuat-action.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOC = resolve(HERE, "..", "..");

const JAVA_CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_RBAC = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const JAVA_PUBLIC = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java";
const OUT = "tools/e2e/action-registry.json";

function docDong(rel) {
  const p = resolve(GOC, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8").split(/\r?\n/);
}

// ---------------------------------------------------------------- 1. JAVA CONTROLLER
// Mẫu case: `case "ten" -> {` — chấp nhận cả biến thể `}case "ten" -> {` (dòng 1170 trong mã nguồn).
const RE_CASE = /^\s*\}?\s*case\s+"([a-z0-9_]+)"\s*->/;

function quetJavaController(dong) {
  const batDau = dong.findIndex((l) => /^\s*switch\s*\(\s*action\s*\)\s*\{\s*$/.test(l));
  if (batDau < 0) return { switchLine: -1, defaultLine: -1, danhSach: [] };
  const ketThuc = dong.findIndex((l, i) => i > batDau && /^\s*default\s*->/.test(l));
  const danhSach = [];
  for (let i = batDau; i < (ketThuc < 0 ? dong.length : ketThuc); i++) {
    const m = dong[i].match(RE_CASE);
    if (!m) continue;
    // Ghi chú: chỉ lấy 3 dòng // LIÊN TIẾP cuối cùng ngay phía trên nhánh case.
    // (Tác giả hay viết nhiều khối // nối nhau; lấy cả khối sẽ lẫn mô tả của case trước đó.)
    const ghiChu = [];
    for (let j = i - 1; j >= 0 && ghiChu.length < 3; j--) {
      const s = dong[j].trim();
      if (s.startsWith("//")) { ghiChu.unshift(s.replace(/^\/+\s*/, "").trim()); continue; }
      break;
    }
    // Use-case được gọi trong thân case (đọc 8 dòng kế tiếp) — giúp người đọc JSON hiểu action làm gì.
    const uc = dong.slice(i + 1, i + 9).join(" ").match(/([A-Za-z]+UseCase)\.(\w+)\(/);
    danhSach.push({
      ten: m[1],
      dong: i + 1,
      useCase: uc ? `${uc[1]}.${uc[2]}` : "",
      ghiChu: ghiChu.join(" ").replace(/`/g, "").replace(/\s+/g, " ").trim().slice(0, 260),
    });
  }
  return { switchLine: batDau + 1, defaultLine: (ketThuc < 0 ? -1 : ketThuc + 1), danhSach };
}

// ---------------------------------------------------------------- 2. JS ROUTE
function quetJsRoute(dong) {
  const map = new Map();
  if (!dong) return map;
  dong.forEach((l, i) => {
    const m = l.match(/action\s*===\s*"([a-z0-9_]+)"/);
    if (m && !map.has(m[1])) map.set(m[1], i + 1);
  });
  return map;
}

// ---------------------------------------------------------------- 3. RBAC REGISTRY
function quetRbac(dong) {
  const map = new Map();
  if (!dong) return map;
  dong.forEach((l, i) => {
    const m = l.match(/Map\.entry\("([a-z0-9_]+)"\s*,\s*(?:List\.of\(([^)]*)\)|"(.*?)")/);
    if (m && !map.has(m[1])) {
      const ds = (m[2] ?? m[3] ?? "").split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
      map.set(m[1], { dong: i + 1, module: ds.join(",") });
    }
  });
  return map;
}

// Quét `RbacService.PUBLIC_ACTIONS = Set.of(...)` — dừng ở dòng đóng `);`.
function quetPublicActions(dong) {
  if (!dong) return [];
  const i = dong.findIndex((l) => /PUBLIC_ACTIONS\s*=/.test(l));
  if (i < 0) return [];
  const khoi = [];
  for (let j = i; j < dong.length; j++) {
    khoi.push(dong[j]);
    if (/;\s*$/.test(dong[j])) break;
  }
  const ds = [...khoi.join("\n").matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);
  return [...new Set(ds)];
}

// ---------------------------------------------------------------- PHÂN NHÓM
const NHOM = {
  "quan-tri": "quản trị: tài khoản, phòng ban, nhóm quyền, vai trò, chức danh (cấp bậc), tổ chức, cấu hình hệ thống",
  "workflow": "workflow: định nghĩa quy trình, bước, người duyệt, quyết định phê duyệt",
  "nhan-su": "nhân sự: hồ sơ nhân sự, hợp đồng lao động, bảo hiểm/phúc lợi",
  "ke-toan-vat-tu": "kế toán & vật tư: nhóm hệ vật tư, mã vật tư, tên phụ (danh mục vật tư)",
  "mua-hang": "mua hàng: phiếu đề nghị mua hàng (PR/MR), đơn mua hàng (PO), tách PO, đặt PO",
  "kho": "kho: nhập GRN, xuất issue, trả về (return), điều chuyển (STO), kiểm kê",
  "khac": "khác: dự án, hợp đồng, BOQ, sản xuất, thi công, tài chính, pháp chế, nhiệm vụ, nhà cung cấp/đối tác, đăng nhập",
};

// Ghi đè tay cho các action dễ nhầm nhóm — mọi mục dưới đây đều đã đối chiếu với thân case trong mã nguồn.
const GHI_DE = {
  // --- kho ---
  receive_goods: "kho", confirm_delivery: "kho", issue_stock: "kho", confirm_installation: "kho",
  return_stock: "kho", create_stock_count: "kho", approve_stock_count: "kho", reverse_stock_movement: "kho",
  create_transfer_order: "kho", approve_transfer_order: "kho", ship_transfer_order: "kho", receive_transfer_order: "kho",
  create_central_return: "kho", approve_central_return: "kho", receive_central_return: "kho",
  create_issue_grn: "kho", create_transfer_grn: "kho", approve_stock_issue: "kho",
  issue_stock_confirm: "kho", confirm_stock_issue: "kho", save_warehouse_location: "kho",
  transfer_contract_ownership: "kho", reconcile_contract_stock: "kho",
  // --- mua hàng ---
  create_request: "mua-hang", preview_request_import: "mua-hang", update_returned_request: "mua-hang",
  resubmit_request: "mua-hang", cancel_request: "mua-hang", delete_request: "mua-hang",
  create_po: "mua-hang", approve_po: "mua-hang", reject_po: "mua-hang", update_po_price: "mua-hang",
  close_po_line: "mua-hang",
  // Phiếu ứng trước là TÀI CHÍNH (module `dept_finance_advance`), không phải phiếu đề nghị mua hàng
  // dù tên có đuôi `_request` — không để từ khoá `request` kéo nhầm vào nhóm mua-hang.
  save_advance_request: "khac", settle_advance_request: "khac", delete_advance_request: "khac",
  // Vật tư của NHÀ CUNG CẤP / ĐỐI TÁC thuộc nhóm danh mục NCC, không phải nhóm hệ vật tư.
  supplier_materials: "khac", save_supplier_material: "khac", supplier_material_gaps: "khac",
  // --- workflow ---
  decide_approval: "workflow", request_supplement: "workflow",
  save_approval_stage: "workflow", set_approval_stage_status: "workflow", delete_approval_stage: "workflow",
  save_workflow: "workflow", set_workflow_status: "workflow", delete_workflow: "workflow",
  work_scope: "workflow", director_pending_approvals: "workflow",
  // Phê duyệt thuộc nghiệp vụ khác (không phải cấu hình/định nghĩa luồng duyệt) -> để nhóm nghiệp vụ của nó.
  approve_production_report: "khac", approve_construction_daily_log: "khac",
  approve_site_expense_claim: "khac", approve_team_production: "khac",
  // --- kế toán & vật tư ---
  save_material: "ke-toan-vat-tu", set_material_status: "ke-toan-vat-tu", delete_material: "ke-toan-vat-tu",
  save_material_category: "ke-toan-vat-tu", set_material_category_status: "ke-toan-vat-tu",
  delete_material_category: "ke-toan-vat-tu", save_material_subcategory: "ke-toan-vat-tu",
  set_material_subcategory_status: "ke-toan-vat-tu", delete_material_subcategory: "ke-toan-vat-tu",
  bulk_material_subcategory_action: "ke-toan-vat-tu", import_material_catalog: "ke-toan-vat-tu",
  merge_material_master: "ke-toan-vat-tu", check_material_alias_conflicts: "ke-toan-vat-tu",
  save_material_external_code: "ke-toan-vat-tu", save_material_uom_conversion: "ke-toan-vat-tu",
  save_material_norm: "ke-toan-vat-tu", set_material_norm_status: "ke-toan-vat-tu",
  delete_material_norm: "ke-toan-vat-tu", estimate_material_norms: "ke-toan-vat-tu",
  save_mar_approval: "ke-toan-vat-tu", preview_material_dependencies: "ke-toan-vat-tu",
  delete_unused_materials: "ke-toan-vat-tu", delete_selected_materials: "ke-toan-vat-tu",
  reset_material_catalog_test: "ke-toan-vat-tu", request_material_master_from_boq: "ke-toan-vat-tu",
  compare_boq_materials: "ke-toan-vat-tu", confirm_boq_material_mappings: "ke-toan-vat-tu",
  // --- nhân sự ---
  save_hr_record: "nhan-su", save_labor_contract: "nhan-su", set_labor_contract_status: "nhan-su",
  delete_labor_contract: "nhan-su", save_benefit_record: "nhan-su", set_benefit_record_status: "nhan-su",
  delete_benefit_record: "nhan-su",
  // --- quản trị ---
  create_user: "quan-tri", update_user: "quan-tri", set_user_status: "quan-tri", delete_user: "quan-tri",
  reset_user_password: "quan-tri", save_user_access: "quan-tri", delete_user_module_override: "quan-tri",
  bulk_import_users: "quan-tri", save_department_permission: "quan-tri", delete_department_permission: "quan-tri",
  rebuild_department_permissions: "quan-tri", save_system_level: "quan-tri", set_system_level_status: "quan-tri",
  delete_system_level: "quan-tri", set_user_system_level: "quan-tri", system_level_impact: "quan-tri",
  save_role_catalog: "quan-tri", set_role_status: "quan-tri", delete_role_catalog: "quan-tri",
  save_business_role_group: "quan-tri", set_business_role_group_status: "quan-tri",
  delete_business_role_group: "quan-tri", save_business_scope: "quan-tri", set_business_scope_status: "quan-tri",
  delete_business_scope: "quan-tri", save_engine_role_profile: "quan-tri",
  save_organization_unit: "quan-tri", set_organization_unit_status: "quan-tri",
  set_organization_unit_member: "quan-tri", save_menu_group: "quan-tri", set_menu_group_status: "quan-tri",
  delete_menu_group: "quan-tri", save_module_catalog: "quan-tri", set_module_status: "quan-tri",
  save_form_field_config: "quan-tri", delete_form_field_config: "quan-tri", reorder_form_fields: "quan-tri",
  reorder_menu_layout: "quan-tri", revoke_session: "quan-tri", revoke_user_sessions: "quan-tri",
  save_notification_config: "quan-tri", set_notification_config_status: "quan-tri",
  delete_notification_config: "quan-tri", notification_configs: "quan-tri", notification_log: "quan-tri",
  save_trust_development_settings: "quan-tri", install_license_foundation: "quan-tri",
  request_license_transfer: "quan-tri", error_reports: "quan-tri", mark_error_report_resolved: "quan-tri",
  factory_reset_preview: "quan-tri", factory_reset_execute: "quan-tri", save_ui_display_settings: "quan-tri",
};

// Khớp theo từ khoá (chạy SAU GHI_DE) — bảo đảm action mới chưa có trong bảng ghi đè vẫn vào đúng nhóm.
const TUA_KHOA = [
  ["quan-tri", /(^|_)(user|department|role|organization_unit|menu|module_catalog|form_field|system_level|permission|business_scope|notification_config|license|factory_reset|error_report|revoke|engine_role)/],
  ["workflow", /(^|_)(workflow|approval|approver|approve|reject|decide|stage|pending_approval)/],
  ["nhan-su", /(^|_)(hr_|labor|benefit|personnel|employee)/],
  ["ke-toan-vat-tu", /(^|_)(material|norm|catalog|mar_)/],
  ["mua-hang", /(^|_)(request|purchase|_po|supplier_gap)/],
  ["kho", /(^|_)(stock|grn|receipt|warehouse|issue|return|transfer|delivery|installation|central_return)/],
];

function phanNhom(ten) {
  if (GHI_DE[ten]) return GHI_DE[ten];
  for (const [nhom, re] of TUA_KHOA) if (re.test(ten)) return nhom;
  return "khac";
}

// ---------------------------------------------------------------- CHẠY
const dongJava = docDong(JAVA_CTRL);
const dongJs = docDong(JS_ROUTE);
const dongRbac = docDong(JAVA_RBAC);
const dongPublic = docDong(JAVA_PUBLIC);
if (!dongJava) { console.error("KHÔNG ĐỌC ĐƯỢC " + JAVA_CTRL); process.exit(2); }

const java = quetJavaController(dongJava);
const js = quetJsRoute(dongJs);
const rbac = quetRbac(dongRbac);
const publicActions = quetPublicActions(dongPublic);

const trung = java.danhSach.filter((a, i, arr) => arr.findIndex((b) => b.ten === a.ten) === i);
const tenJava = new Set(trung.map((a) => a.ten));
const chiCoJs = [...js.keys()].filter((t) => !tenJava.has(t)).sort();
const chiCoRbac = [...rbac.keys()].filter((t) => !tenJava.has(t)).sort();

const actions = trung.map((a) => ({
  ten: a.ten,
  nhom: phanNhom(a.ten),
  file: JAVA_CTRL,
  dong: a.dong,
  useCase: a.useCase,
  moduleRbac: rbac.get(a.ten)?.module ?? "",
  dongRbac: rbac.get(a.ten)?.dong ?? 0,
  dongJs: js.get(a.ten) ?? 0,
  congKhai: publicActions.includes(a.ten),
  ghiChu: a.ghiChu,
}));

const theoNhom = {};
for (const nhom of Object.keys(NHOM)) theoNhom[nhom] = actions.filter((a) => a.nhom === nhom).length;

const ketQua = {
  moTa: "Danh sách action mà API POST http://127.0.0.1:9000/api/system chấp nhận, trích trực tiếp từ mã nguồn. Body: {\"action\":\"<ten>\", ...payload}.",
  nguon: [
    `${JAVA_CTRL}:${java.switchLine} — câu lệnh \`switch (action) {\`: ĐÂY LÀ NƠI ĐĂNG KÝ / RẼ NHÁNH DUY NHẤT mà API POST /api/system chấp nhận action (đây là bản Java chạy thật trên cổng 9000). Đã đọc ${trung.length} nhánh \`case "ten_action" ->\`.`,
    `${JAVA_CTRL}:${java.defaultLine} — nhánh \`default ->\` trả HTTP 400 «Action 'X' chưa được triển khai trên backend Java (Strangler Fig)» ⇒ danh sách lấy từ switch này là DANH SÁCH ĐẦY ĐỦ, không có nơi nào khác đăng ký thêm action.`,
    `${JS_ROUTE} — triển khai tham chiếu/legacy bằng Node, rẽ nhánh bằng \`if (action === "ten_action")\`. Đối chiếu được ${js.size} action. KHÔNG dùng làm nguồn chính vì backend đang chạy là Java.`,
    `${JAVA_RBAC} — ma trận quyền \`Map.entry("ten_action", List.of("module"))\`. KHÔNG phải nơi đăng ký action; dùng để đối chiếu module RBAC của từng action. Đối chiếu được ${rbac.size} action.`,
    `KẾT QUẢ ĐỐI CHIẾU: ${chiCoJs.length} action chỉ có ở JS mà KHÔNG có trong switch Java; ${chiCoRbac.length} action có trong ma trận RBAC mà không có trong switch Java (xem 2 khoá tương ứng bên dưới).`,
    "LƯU Ý VỀ GET: `GET /api/system?action=template&kind=boq|material_catalog|projects|users|payments` là THAM SỐ TRUY VẤN của GET (tải file Excel mẫu), KHÔNG phải action POST — xem khoá `getKhongPhaiAction`.",
  ],
  tongSoAction: actions.length,
  switchJava: { file: JAVA_CTRL, dongSwitch: java.switchLine, dongNhanhDefault: java.defaultLine },
  moTaNhom: NHOM,
  quyTacPhanNhom: "Bảng ghi đè tay (GHI_DE trong tools/e2e/trich-xuat-action.mjs) được áp trước, sau đó mới tới từ khoá (TUA_KHOA); không khớp -> 'khac'.",
  theoNhom,
  actions,
  chiCoTrongJsKhongCoTrongJava: chiCoJs.map((t) => ({ ten: t, dongJs: js.get(t), file: JS_ROUTE })),
  chiCoTrongRbacKhongCoTrongJava: chiCoRbac.map((t) => ({ ten: t, dong: rbac.get(t).dong, module: rbac.get(t).module, file: JAVA_RBAC })),
  actionCongKhai: publicActions,
  getKhongPhaiAction: [
    { ten: "template", moTa: "GET /api/system?action=template&kind=boq|material_catalog|projects|users|payments — tải file Excel mẫu. KHÔNG phải action POST.", file: JAVA_CTRL, dong: 161 },
  ],
  luuYQuanTrong: [
    { tinhHuong: "Tạo/sửa phòng ban (department)", action: ["save_organization_unit", "set_organization_unit_status"], chiTiet: "KHÔNG có action tên `create_department`. Phòng ban là bản ghi `organization_units` có `unitType/unit_type = 'department'` (xem migration V10__dept_permissions_and_levels.sql:77). Tạo/sửa bằng `save_organization_unit`, bật/tắt bằng `set_organization_unit_status`. Quyền theo phòng ban: `save_department_permission` / `delete_department_permission` / `rebuild_department_permissions`." },
    { tinhHuong: "Tạo user", action: ["create_user"], chiTiet: "Kèm `update_user` (sửa), `set_user_status`, `delete_user`, `reset_user_password`." },
    { tinhHuong: "Gán quyền", action: ["save_user_access", "delete_user_module_override"], chiTiet: "Gán quyền theo module cho tài khoản. Cấp quyền ở cấp vai trò/nhóm: `save_role_catalog`, `save_business_role_group`, `save_module_catalog`, `set_user_system_level`." },
    { tinhHuong: "Tạo workflow + bước + người duyệt", action: ["save_workflow"], chiTiet: "MỘT action duy nhất tạo cả 3 tầng: payload `{ code, name, moduleKey?, isDefault?, sortOrder?, stages: [{ stepNo, name, description?, approvalMode: single|any_of|all_of, slaHours, allowSkipLevel?, approverUserIds: [...] }] }` (xem OpsTaskManagementUseCase.saveWorkflow:650). KHÔNG có action riêng cho bước hay người duyệt. Sửa/xoá quy trình: `set_workflow_status`, `delete_workflow`. Cấu hình bước duyệt dùng chung khác: `save_approval_stage` / `set_approval_stage_status` / `delete_approval_stage` (bảng `approval_stage_catalog`)." },
    { tinhHuong: "Duyệt / từ chối phiếu", action: ["decide_approval", "request_supplement"], chiTiet: "`decide_approval` là quyết định duyệt/từ chối theo bước (approval engine). Ngoài ra có các duyệt riêng theo phiếu: `approve_po`/`reject_po`, `approve_stock_issue`, `approve_transfer_order`, `approve_central_return`, `approve_stock_count`." },
    { tinhHuong: "Tạo phiếu đề nghị mua hàng (PR/MR)", action: ["create_request"], chiTiet: "Kèm `preview_request_import` (xem trước import), `resubmit_request`, `cancel_request`, `delete_request`, `update_returned_request`." },
    { tinhHuong: "Chuyển PR sang PO / đặt PO", action: ["create_po"], chiTiet: "`create_po` vừa là lúc CHUYỂN PR SANG PO (tạo đơn mua hàng) vừa là lúc ĐẶT PO. Theo docs/agent-progress/PHASE2-GAP-ANALYSIS.md:316-317, 1 lần gọi `create_po` có thể tách ra nhiều PO theo nhà cung cấp." },
    { tinhHuong: "Tách PO", action: ["create_po"], chiTiet: "KHÔNG tồn tại action tên `split_po` — tách PO thực hiện TRONG `create_po` ở mức DÒNG qua `purchase_order_items.request_item_id` (xem docs/agent-progress/PHASE2-GAP-ANALYSIS.md:327 và :174). Không có action riêng." },
    { tinhHuong: "Tạo phiếu nhập GRN", action: ["receive_goods", "create_issue_grn", "create_transfer_grn"], chiTiet: "`receive_goods` tạo GRN từ PO; `create_issue_grn` sinh GRN nhập vào kho khác từ phiếu xuất; `create_transfer_grn` sinh GRN từ lệnh điều chuyển (STO). BCH xác nhận giao hàng: `confirm_delivery`." },
    { tinhHuong: "Tạo phiếu điều chuyển STO", action: ["create_transfer_order"], chiTiet: "Vòng đầy đủ: `create_transfer_order` -> `approve_transfer_order` -> `ship_transfer_order` -> `create_transfer_grn` (sinh phiếu nhập) -> `receive_transfer_order`." },
    { tinhHuong: "Tạo phiếu xuất issue", action: ["issue_stock"], chiTiet: "Vòng đầy đủ (WF-XUATKHO-01): `issue_stock` (tạo phiếu) -> `approve_stock_issue` (CHT duyệt) -> `issue_stock_confirm` (tiến hành xuất, ghi stock_movements) -> `confirm_stock_issue` (thủ kho xác nhận) -> `create_issue_grn` (sinh GRN nhập kho khác)." },
    { tinhHuong: "Tạo phiếu trả về (material return)", action: ["return_stock"], chiTiet: "`return_stock` tạo bản ghi `material_returns` (mã phiếu `RET-...`, xem StockManagementUseCase.returnStock:501). Nhóm trả về khác: `create_central_return` -> `approve_central_return` -> `receive_central_return` (phiếu trả về kho trung ương)." },
  ],
};

const outPath = resolve(GOC, OUT);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(ketQua, null, 2) + "\n", "utf8");

console.log("ĐÃ GHI: " + OUT);
console.log(`switch(action) dòng ${java.switchLine} · default dòng ${java.defaultLine} · tổng ${actions.length} action`);
for (const [k, v] of Object.entries(theoNhom)) console.log(`  - ${k}: ${v}`);
console.log("Chỉ có ở JS, không có ở Java: " + chiCoJs.length + " → " + chiCoJs.join(", "));
console.log("Trong RBAC nhưng không có trong switch Java: " + chiCoRbac.length + " → " + chiCoRbac.join(", "));
