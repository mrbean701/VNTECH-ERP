#!/usr/bin/env node
/**
 * ĐỢT P5 — thêm 3 tab vào màn "Phân quyền người dùng" và đánh số lại các tab sau.
 *
 * Trước: 1 Nhân sự · 2 Tổ chức · 3 Chức danh · 4 Nhóm quyền · 5 Phạm vi dự án & kho
 *         · 6 Workflow · 7 Ngoại lệ cá nhân · 8 Cấu hình hệ thống
 * Sau:   1 Nhân sự · 2 Tổ chức · 3 Chức danh · 4 Nhóm quyền
 *         · 5 Phân quyền phòng ban · 6 Phân quyền người dùng · 7 Cấp bậc hệ thống
 *         · 8 Phạm vi dự án & kho · 9 Workflow · 10 Ngoại lệ cá nhân · 11 Cấu hình hệ thống
 *
 * Làm bằng script vì 4 nhánh `{step===N&&}` là những dòng rất dài, dán lại nguyên văn
 * qua công cụ edit rất dễ sai một ký tự.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
const text = readFileSync(FILE, "utf8");
const lines = text.split("\n");

const NEW_TABS = [
  ["Nhân sự", "Tổ chức", "Chức danh / vai trò", "Nhóm quyền nghiệp vụ",
    "Phân quyền phòng ban", "Phân quyền người dùng", "Cấp bậc hệ thống",
    "Phạm vi dự án & kho", "Workflow phê duyệt", "Ngoại lệ cá nhân", "Cấu hình hệ thống"],
];

// ---- 1) Đánh số lại các nhánh {step===N&&} (5→8, 6→9, 7→10, 8→11) ----
const REMAP = { 5: 8, 6: 9, 7: 10, 8: 11 };
let renumbered = 0;
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)\{step===(\d+)&&/);
  if (!m) continue;
  const oldNo = Number(m[2]);
  const newNo = REMAP[oldNo];
  if (!newNo) continue;
  lines[i] = lines[i].replace(`{step===${oldNo}&&`, `{step===${newNo}&&`);
  lines[i] = lines[i].replaceAll(`step===${oldNo}`, `step===${newNo}`);
  renumbered++;
}
console.log(`Đã đánh số lại ${renumbered} nhánh tab.`);

// ---- 2) Chèn 3 tab mới ngay sau tab "Nhóm quyền nghiệp vụ" (step===4) ----
const anchor = lines.findIndex((l) => /^\s*\{step===4&&/.test(l));
if (anchor < 0) { console.error("Không tìm thấy nhánh step===4 để chèn."); process.exit(1); }
lines.splice(anchor + 1, 0,
  "    {step===5&&<DepartmentPermissionManager data={data} action={action}/>}",
  "    {step===6&&<UserPermissionMatrix data={data} open={open} action={action}/>}",
  "    {step===7&&<SystemLevelManager data={data} open={open} action={action}/>}");
console.log(`Đã chèn 3 tab mới sau dòng ${anchor + 1}.`);

// ---- 3) Cập nhật mảng nhãn tab ----
const stepsLine = lines.findIndex((l) => /^\s*const steps=\[/.test(l));
if (stepsLine < 0) { console.error("Không tìm thấy mảng steps."); process.exit(1); }
lines[stepsLine] = `  const steps=${JSON.stringify(NEW_TABS[0]).replace(/","/g, '","')};`
  .replace('["', '["').replace('"]', '"]');
// Giữ nguyên định dạng mảng chuỗi của dự án
lines[stepsLine] = `  const steps=${JSON.stringify(NEW_TABS[0])};`;
console.log(`Đã cập nhật mảng steps (${NEW_TABS[0].length} tab) tại dòng ${stepsLine + 1}.`);

// ---- 4) Cập nhật mô tả đầu màn ----
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("Nhân sự → Tổ chức → Chức danh → Nhóm quyền → Phạm vi → Workflow → Ngoại lệ")) {
    lines[i] = lines[i].replace(
      "Nhân sự → Tổ chức → Chức danh → Nhóm quyền → Phạm vi → Workflow → Ngoại lệ",
      "Nhân sự → Tổ chức → Chức danh → Nhóm quyền → Quyền phòng ban → Quyền người dùng → Cấp bậc → Phạm vi → Workflow → Ngoại lệ");
    console.log(`Đã cập nhật mô tả đầu màn tại dòng ${i + 1}.`);
  }
}

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log("Xong.");
