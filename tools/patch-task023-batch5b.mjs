// SỬA LỖI patch-task023-batch5 (phép vá #15 rơi sai phương thức).
//
// Nguyên nhân: neo `if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))`
// xuất hiện HAI lần trong ProductionManagementUseCase (saveProductionReport ~dòng 50 và
// deleteConstructionDailyLog ~dòng 418). `String.prototype.replace` với mẫu CHUỖI chỉ thay lần ĐẦU
// ⇒ kiểm phạm vi bị chèn vào saveProductionReport thay vì deleteConstructionDailyLog.
//
// Sửa hai bước, mỗi bước KIỂM SỐ LẦN xuất hiện trước khi sửa:
//   (1) gỡ khối đã chèn nhầm (nhận diện bằng chính chú thích "JS 1208").
//   (2) chèn lại vào deleteConstructionDailyLog, neo vào `store.deleteDailyLog(logId);` (duy nhất).
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/application/src/main/java/com/vntech/erp/application/service/ProductionManagementUseCase.java";
const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

const CHECK = `        accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(old, "project_id"), true,\n`
            + `                "Không có quyền tại dự án này.");\n`;
const COMMENT = `        // JS 1208: phạm vi dự án của CHÍNH nhật ký.\n`;
const ANCHOR_LINE = `        if ("approved".equals(sv(old, "status")) && !"admin".equals(principal.role()))\n`;

const MISPLACED = COMMENT + CHECK + ANCHOR_LINE;
const countMisplaced = text.split(MISPLACED).length - 1;
const countDeleteCall = text.split("        store.deleteDailyLog(logId);\n").length - 1;

console.log(`Khối chèn nhầm (kèm chú thích JS 1208): ${countMisplaced} lần`);
console.log(`Neo deleteDailyLog(logId):               ${countDeleteCall} lần`);

if (countMisplaced !== 1 || countDeleteCall !== 1) {
  console.log("  X   So lan KHONG dung 1 — dung, khong sua.");
  process.exit(1);
}

// (1) gỡ khối chèn nhầm
text = text.replace(MISPLACED, ANCHOR_LINE);
// (2) chèn đúng chỗ
text = text.replace("        store.deleteDailyLog(logId);\n",
  COMMENT + CHECK + "        store.deleteDailyLog(logId);\n");

// Kiem chung: sau khi sua chi con DUNG 1 khoi JS 1208 va no phai nam trong deleteConstructionDailyLog
const after = text.split(COMMENT).length - 1;
const deleteIdx = text.indexOf("public Map<String, Object> deleteConstructionDailyLog(");
const commentIdx = text.indexOf(COMMENT);
const approveIdx = text.indexOf("public Map<String, Object> approveConstructionDailyLog(");
const inRightMethod = deleteIdx > 0 && commentIdx > deleteIdx && (approveIdx < 0 || commentIdx > approveIdx);
console.log(`Sau khi sua: khoi JS 1208 = ${after} lan; nam trong deleteConstructionDailyLog = ${inRightMethod}`);

if (after !== 1 || !inRightMethod) {
  console.log("  X   Kiem chung THAT BAI — khong ghi tep.");
  process.exit(1);
}

writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
console.log("  APD da go khoi chen nham va chen dung vao deleteConstructionDailyLog");
process.exit(0);
