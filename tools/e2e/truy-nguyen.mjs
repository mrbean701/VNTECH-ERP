// TRUY NGUYÊN — in NGUYÊN VĂN phản hồi của từng action để tìm ra vì sao "ĐẠT" mà không ghi gì.
import { login, call, tieuDe } from "./client.mjs";

tieuDe("TRUY NGUYÊN");
await login("admin", "Admin123456@");

const thu = async (ten, payload) => {
  console.log("\n=== " + ten + " ===");
  console.log("  gui: " + JSON.stringify(payload).slice(0, 300));
  const r = await call(ten, payload, { lenient: true });
  console.log("  tra ve: " + JSON.stringify(r).slice(0, 700));
  return r;
};

await thu("create_project", {
  code: "E2E-DIAG-01", name: "Dự án chẩn đoán", contractNo: "HD-DIAG-01", contractName: "HD chẩn đoán",
  createWarehouse: true, warehouseCode: "KHO-DIAG", warehouseName: "Kho chẩn đoán",
});
await thu("create_project", { projectCode: "E2E-DIAG-02", projectName: "Dự án chẩn đoán 2", createWarehouse: false });
await thu("create_user", {
  employeeCode: "E2E-DIAG", fullName: "Chẩn đoán", username: "e2e.diag", email: "diag@vntech.vn",
  role: "ksda", organizationUnitId: "ORG-DA", password: "Vn@2026Test", projectIds: [],
});
await thu("create_project_team", { code: "E2E-DIAG", name: "Tổ đội chẩn đoán", projectId: "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3" });
await thu("save_organization_unit", {
  code: "E2E-DIAG-BCH", name: "BCH chẩn đoán", unitType: "site_command",
  projectId: "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3", description: "chẩn đoán",
});