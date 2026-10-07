// DÒ CẤU TRÚC — in toàn bộ khoá của từng bảng nghiệp vụ để biết chính xác payload cần gửi.
import { login, bootstrap, call, tieuDe } from "./client.mjs";

tieuDe("CẤU TRÚC DỮ LIỆU NGHIỆP VỤ");

await login("admin", "Admin123456@");
const bs = await bootstrap();

const hinh = (ten, khoa, lay = 1) => {
  const v = bs[khoa];
  console.log("\n--- " + ten + " (" + khoa + ") " + (Array.isArray(v) ? v.length + " bản ghi" : "") + " ---");
  if (!Array.isArray(v) || !v.length) { console.log("    (rong)"); return; }
  for (const r of v.slice(0, lay)) {
    console.log("    " + JSON.stringify(r, null, 2).split("\n").join("\n    "));
  }
  console.log("    TẤT CẢ THUỘC TÍNH: " + Object.keys(v[0]).join(", "));
};

hinh("PHIẾU ĐỀ NGHỊ MUA HÀNG", "requests", 1);
hinh("ĐƠN MUA HÀNG", "purchaseOrders", 1);
hinh("PHIẾU NHẬP (GRN)", "receipts", 1);
hinh("PHIẾU XUẤT / CẤP PHÁT", "issues", 1);
hinh("TRẢ VỀ VẬT TƯ", "returns", 1);
hinh("BƯỚC DUYỆT", "workflowSteps", 10);
hinh("NGƯỜI DUYỆT", "workflowStepApprovers", 10);
hinh("VẬT TƯ", "adminMaterials", 1);
hinh("TÊN PHỤ VẬT TƯ", "materialAliases", 3);
hinh("KHO", "transferWarehouses", 8);
hinh("TỔ ĐỘI", "teams", 3);
hinh("DỰ ÁN", "projects", 3);
hinh("NHÂN SỰ", "hrRecords", 1);
hinh("HỢP ĐỒNG LAO ĐỘNG", "laborContracts", 1);
hinh("BẢO HIỂM", "benefitRecords", 1);
hinh("BẢNG GIÁ / CẤU HÌNH NHÓM", "materialCategories", 3);
hinh("NHÓM QUYỀN", "businessRoleGroups", 3);