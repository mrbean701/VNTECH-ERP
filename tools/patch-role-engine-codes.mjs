// Patch: đưa các điểm gọi requireRole() trong java-backend về ĐÚNG mã ENGINE như monolith JS.
//
// Bằng chứng (scripts/system-route.mjs):
//   function effectiveRole(user) { return clean(user.roleBase || user.role); }   // dòng 193
//   function requireRole(user, roles) { if (!roles.includes(effectiveRole(user)) && !isAdmin(user)) ... } // 211-214
//   roleBase = COALESCE(rc.base_role, u.role)   (mọi truy vấn dựng phiên)
// và drizzle/0029_v530_erp_permissions_workflow.sql:71-80 cho thấy mã chuẩn ánh xạ NHIỀU-VỀ-MỘT:
//   cht → commander · da_nv, da_truong → project · kh_nv, kh_truong → procurement
//   thu_kho, kho_tong → warehouse · ksda → engineer · thuky, hcpc_truong → director
// Vì vậy danh sách vai trò phải là mã ENGINE; so bằng mã chuẩn sẽ bỏ sót các chức danh cùng nhóm.
//
// Mỗi phép thay thế kèm số lần xuất hiện mong đợi — lệch là dừng ngay, không sửa âm thầm.
import { readFileSync, writeFileSync } from "node:fs";

const A = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const T = "java-backend/application/src/test/java/com/vntech/erp/application/service/";

const EDITS = [
  // --- RequestManagementUseCase: create_request (JS 897) ---
  { file: A + "RequestManagementUseCase.java", expect: 1,
    from: 'List.of("ksda", "cht", "admin")', to: 'List.of("engineer", "commander", "admin")' },

  // --- ProductionManagementUseCase ---
  // saveTeamSubcontract (1238), saveTeamProduction (1241), approveTeamProduction (1244)
  { file: A + "ProductionManagementUseCase.java", expect: 3,
    from: 'List.of("admin", "cht", "da_nv")', to: 'List.of("admin", "commander", "project")' },
  // saveTeamPayment (1247)
  { file: A + "ProductionManagementUseCase.java", expect: 1,
    from: 'List.of("admin", "cht", "accountant", "da_nv")',
    to: 'List.of("admin", "commander", "accountant", "project")' },
  // settleTeamSubcontract (1250)
  { file: A + "ProductionManagementUseCase.java", expect: 1,
    from: 'List.of("admin", "cht", "accountant")', to: 'List.of("admin", "commander", "accountant")' },

  // --- StockManagementUseCase ---
  // issueStock (1510), reconcileContractStock (858), transferContractOwnership (855), reverseStockMovement (1277)
  { file: A + "StockManagementUseCase.java", expect: 3,
    from: 'List.of("thu_kho", "cht", "admin")', to: 'List.of("warehouse", "commander", "admin")' },
  // returnStock (1515)
  { file: A + "StockManagementUseCase.java", expect: 1,
    from: 'List.of("thu_kho", "team", "admin")', to: 'List.of("warehouse", "team", "admin")' },
  // confirmInstallation (1520)
  { file: A + "StockManagementUseCase.java", expect: 1,
    from: 'List.of("team", "thu_kho", "cht", "admin")', to: 'List.of("team", "warehouse", "commander", "admin")' },
  // (không còn điểm nào dùng cht/da_nv trần trong tệp này)
  { file: A + "StockManagementUseCase.java", expect: 1,
    from: 'List.of("cht", "da_nv", "admin")', to: 'List.of("commander", "project", "admin")' },

  // --- PurchaseManagementUseCase ---
  // createPo (1280)
  { file: A + "PurchaseManagementUseCase.java", expect: 1,
    from: 'List.of("kh_nv", "admin")', to: 'List.of("procurement", "admin")' },
  // closePoLine (1301)
  { file: A + "PurchaseManagementUseCase.java", expect: 1,
    from: 'List.of("kh_nv", "da_nv", "admin")', to: 'List.of("procurement", "project", "admin")' },
  // receiveGoods (1313)
  { file: A + "PurchaseManagementUseCase.java", expect: 1,
    from: 'List.of("thu_kho", "admin")', to: 'List.of("warehouse", "admin")' },
  // confirmDelivery (1383)
  { file: A + "PurchaseManagementUseCase.java", expect: 1,
    from: 'List.of("cht", "da_nv", "admin")', to: 'List.of("commander", "project", "admin")' },

  // --- Test double: hợp đồng port mới findRoleCatalogInfo ---
  { file: T + "AuthUseCaseTest.java", expect: 1,
    from: '        @Override public User save(User user) { byId.put(user.id(), user); byUsername.put(user.username(), user); return user; }',
    to: '        @Override public User save(User user) { byId.put(user.id(), user); byUsername.put(user.username(), user); return user; }\n'
      + '        @Override public Optional<RoleCatalogInfo> findRoleCatalogInfo(String roleCode) {\n'
      + '            // Test double: không có bảng role_catalog nên base_role = chính mã vai trò.\n'
      + '            return Optional.of(new RoleCatalogInfo(roleCode, roleCode, null));\n'
      + '        }' },
];

let failed = 0;
const rows = [];
for (const edit of EDITS) {
  const src = readFileSync(edit.file, "utf8");
  const parts = src.split(edit.from);
  const found = parts.length - 1;
  if (found !== edit.expect) {
    failed++;
    rows.push(`  ✗ ${edit.file.split("/").pop()} — thấy ${found}, mong đợi ${edit.expect}: ${edit.from.slice(0, 58)}`);
    continue;
  }
  writeFileSync(edit.file, parts.join(edit.to), "utf8");
  rows.push(`  ✓ ${edit.file.split("/").pop()} ×${found}  ${edit.from.slice(0, 46)} → ${edit.to.slice(0, 46)}`);
}

console.log("═══ ĐƯA ĐIỂM GỌI requireRole VỀ MÃ ENGINE ═══");
console.log(rows.join("\n"));
console.log(failed === 0
  ? `\nKẾT LUẬN: ${EDITS.length} phép thay thế đều khớp số lượng mong đợi ✅`
  : `\nKẾT LUẬN: ${failed} phép thay thế LỆCH — đã dừng, KHÔNG sửa phần lệch ❌`);
process.exit(failed === 0 ? 0 : 1);
