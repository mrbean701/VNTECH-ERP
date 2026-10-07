// USER 28/09/2026 — them nut 「＋ Tạo dự án」 vao nhanh danh sach.
//   · TAI DUNG modal ĐÃ CÓ: open("projectMaster")  ⇒ hành động create_project (máy chủ chặn quyền)
//   · QUYỀN: isAdminUser(data.user) || modulePermission(data,"site_command").canCreate
// ⚠️ GIU NGUYEN nút 「⇩ XUẤT」 và biểu thức disabled={!canExport} (hợp đồng pr01 kiểm đúng chỗ này).
// ⛔ KHÔNG dùng dấu ` trong tệp .mjs này (sẽ phá template literal).
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
let t = readFileSync(F, "utf8");
let ok = 0, bad = 0;
const ed = (a, b, n) => { const c = t.split(a).length - 1; if (c !== 1) { console.log("  FAIL " + n + " (khop " + c + ")"); bad += 1; return; } console.log("  OK   " + n); ok += 1; t = t.replace(a, b); };

// ① biến quyền TẠO dự án — đặt ngay cạnh canExport đã có
ed(
  "  const canExport = Boolean(permission?.canExport);",
  "  const canExport = Boolean(permission?.canExport);\n" +
  "  // USER 28/09/2026 — quyền TẠO dự án: admin hoặc có capability canCreate của module site_command.\n" +
  "  // ⚠️Máy chủ vẫn chặn ở `create_project`; nút chỉ để UX khỏi hiện với user không đủ quyền (goal §12).\n" +
  "  const canCreateProject = isAdminUser(data.user) || Boolean(modulePermission(data, \"site_command\").canCreate);",
  "them bien canCreateProject");

// ② bat dau nhom nut trong `actions` (mot fragment bao 2 nut)
ed(
  "          actions={<button\n            type=\"button\"\n            className=\"secondary\"\n            disabled={!canExport}",
  "          actions={<>\n" +
  "            <button\n" +
  "              type=\"button\"\n" +
  "              className=\"primary\"\n" +
  "              disabled={!canCreateProject}\n" +
  "              title={canCreateProject ? \"Thêm dự án mới (action create_project)\" : \"Chưa được cấp quyền TẠO của chức năng Quản lý dự án\"}\n" +
  "              onClick={() => open(\"projectMaster\")}\n" +
  "            >＋ Tạo dự án</button>\n" +
  "            <button\n            type=\"button\"\n            className=\"secondary\"\n            disabled={!canExport}",
  "them nut 「＋ Tạo dự án」truoc nut Xuat");

// ③ dong nhom nut
ed(
  "          >\u21E9 XU\u1EA5T</button>}\n        />",
  "          >\u21E9 XU\u1EA5T</button></>}\n        />",
  "dong fragment `actions`");

if (bad > 0) { console.log("  ⛔ KHONG ghi tep"); process.exit(1); }
writeFileSync(F, t, "utf8");
console.log("  ==> da ghi " + F + " · " + ok + " thay doi");
