#!/usr/bin/env node
/**
 * ĐỢT P6 — thêm tab "Audit log" vào màn "Phân quyền người dùng".
 * Trước: … 10 Ngoại lệ cá nhân · 11 Cấu hình hệ thống
 * Sau:   … 10 Ngoại lệ cá nhân · 11 Audit log · 12 Cấu hình hệ thống
 *
 * Làm bằng script vì nhánh `{step===11&&}` là dòng rất dài, dán lại dễ sai một ký tự.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "app/page.tsx";
const lines = readFileSync(FILE, "utf8").split("\n");

// 1) step 11 → 12 (đi từ cao xuống để không đụng nhầm)
let n = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^\s*\{step===11&&/.test(lines[i])) {
    lines[i] = lines[i].replaceAll("step===11", "step===12");
    n++;
  }
}
console.log(`Đã đổi ${n} nhánh step 11 → 12.`);

// 2) Chèn tab Audit log ngay trước nhánh step 12 đầu tiên (tức tab Cấu hình hệ thống)
const anchor = lines.findIndex((l) => /^\s*\{step===12&&/.test(l));
if (anchor < 0) { console.error("Không tìm thấy nhánh step===12 để chèn."); process.exit(1); }
lines.splice(anchor, 0, "    {step===11&&<AuditLogManager data={data}/>}");
console.log(`Đã chèn tab Audit log tại dòng ${anchor + 1}.`);

// 3) Cập nhật mảng nhãn tab
const stepsLine = lines.findIndex((l) => /^\s*const steps=\[/.test(l));
if (stepsLine < 0) { console.error("Không tìm thấy mảng steps."); process.exit(1); }
const labels = JSON.parse(lines[stepsLine].replace(/^\s*const steps=/, "").replace(/;\s*$/, ""));
if (!labels.includes("Cấu hình hệ thống")) { console.error("Mảng steps không như mong đợi."); process.exit(1); }
labels.splice(labels.indexOf("Cấu hình hệ thống"), 0, "Audit log");
lines[stepsLine] = `  const steps=${JSON.stringify(labels)};`;
console.log(`Đã cập nhật mảng steps (${labels.length} tab).`);

// 4) Cập nhật mô tả đầu màn
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("Cấp bậc → Phạm vi → Workflow → Ngoại lệ")) {
    lines[i] = lines[i].replace("Cấp bậc → Phạm vi → Workflow → Ngoại lệ", "Cấp bậc → Phạm vi → Workflow → Ngoại lệ → Audit log");
    console.log(`Đã cập nhật mô tả đầu màn tại dòng ${i + 1}.`);
  }
}

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log("Xong.");
