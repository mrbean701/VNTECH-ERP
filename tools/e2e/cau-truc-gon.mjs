// IN GỌN — chỉ những trường cần dựng payload, không in toàn bộ JSON.
import { login, bootstrap, tieuDe } from "./client.mjs";

tieuDe("CẤU TRÚC GỌN");
await login("admin", "Admin123456@");
const bs = await bootstrap();

const cot = (ten, khoa, keys, lay = 99) => {
  const v = bs[khoa] || [];
  console.log("\n--- " + ten + " (" + khoa + ") n=" + v.length + " ---");
  if (!v.length) return;
  for (const r of v.slice(0, lay)) {
    console.log("    " + keys.map((k) => k + "=" + JSON.stringify(r[k])).join(" | "));
  }
};

cot("BƯỚC DUYỆT", "workflowSteps", ["id", "workflowId", "stepNo", "name", "approverRole", "requiredRole", "slaHours", "slaMinutes", "active"]);
console.log("    khoa: " + Object.keys(bs.workflowSteps[0] || {}).join(", "));

cot("NGƯỜI DUYỆT", "workflowStepApprovers", ["id", "stepId", "workflowId", "department", "userId", "approverUserId", "departmentId", "orderIndex", "active"]);
console.log("    khoa: " + Object.keys(bs.workflowStepApprovers[0] || {}).join(", "));

cot("KHO", "transferWarehouses", ["id", "code", "name", "projectId", "projectCode", "warehouseType", "active"]);
cot("TỔ ĐỘI", "teams", ["id", "code", "name", "projectId", "projectCode", "leaderName", "leaderUserId", "active"]);
cot("DỰ ÁN", "projects", ["id", "code", "name", "status", "managerName", "active"]);
cot("VẬT TƯ", "adminMaterials", ["id", "code", "name", "unit", "categoryId", "categoryName", "isActive", "active"], 6);
cot("TÊN PHỤ", "materialAliases", ["id", "materialId", "alias", "aliasName", "isPrimary"], 8);
cot("NHÓM HỆ", "adminMaterialCategories", ["id", "code", "name", "parentId", "systemCode"], 8);
cot("HỒ SƠ NHÂN SỰ", "hrRecords", ["id", "userId", "fullName", "employeeCode", "position", "status", "hireDate"]);
cot("HĐ LĐ", "laborContracts", ["id", "userId", "contractNo", "startDate", "endDate", "status", "position"]);
cot("BẢO HIỂM", "benefitRecords", ["id", "userId", "contractId", "type", "amount", "status", "month"]);
cot("NHÓM QUYỀN", "businessRoleGroups", ["id", "code", "name", "roleKey", "active"]);
cot("VAI TRÒ", "roleCatalog", ["id", "code", "name", "roleKey", "category"], 20);
cot("USER", "users", ["id", "username", "fullName", "role", "department", "organizationUnitId", "employeeCode", "active"]);