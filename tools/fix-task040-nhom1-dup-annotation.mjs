// Sửa lỗi do CHÍNH bản vá nhóm 1 gây ra: nhân đôi @Override + @Transactional.
//
// NGUYÊN NHÂN: trong patch nhóm 1 tôi splice bằng `lines.slice(0, 79)`, tức GIỮ LẠI dòng 78-79
// (`@Override`, `@Transactional`) trong khi khối thay thế CŨNG bắt đầu bằng hai annotation đó.
// Đúng phải là `slice(0, 77)` để thay từ dòng 78. Hậu quả: javac báo
// "Override is not a repeatable annotation interface" + "Transactional is not a repeatable ...".
//
// Bài học: khi splice theo DÒNG, chỉ số là 0-based còn số dòng là 1-based ⇒ thay dòng `n` phải dùng
// `slice(0, n-1)`. Và luôn khẳng định vùng sắp thay TRƯỚC khi ghi.
import { readFileSync, writeFileSync } from "node:fs";

const ADAPTER = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AdminOpsStoreAdapter.java";
const src = readFileSync(ADAPTER, "utf8");
const lines = src.split(/\r?\n/);
const at = (n) => lines[n - 1];

// ĐÃ SỬA thì bỏ qua (kiểm trạng thái ĐÍCH trước)
if (at(80).trim() !== "@Override" || at(81).trim() !== "@Transactional") {
  console.log("= adapter: không còn nhân đôi annotation — bỏ qua");
  process.exit(0);
}

const expects = [
  [78, "@Override"],
  [79, "@Transactional"],
  [80, "@Override"],
  [81, "@Transactional"],
  [82, "public void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now)"],
];
for (const [n, needle] of expects) {
  if (!at(n).includes(needle)) {
    console.error(`HỎNG: dòng ${n} không khớp "${needle}" — DỪNG.`);
    console.error(`      thực tế: ${JSON.stringify(at(n))}`);
    process.exit(1);
  }
}

// Bỏ ĐÚNG hai dòng nhân đôi (80, 81) = chỉ số 79, 80
const out = [...lines.slice(0, 79), ...lines.slice(81)].join("\n");
writeFileSync(ADAPTER, out, "utf8");

// Hậu kiểm
const after = readFileSync(ADAPTER, "utf8").split(/\r?\n/);
const checks = [
  ["dòng 78 @Override", after[77].trim() === "@Override"],
  ["dòng 79 @Transactional", after[78].trim() === "@Transactional"],
  ["dòng 80 là khai báo phương thức", after[79].includes("public void insertApprovalRecipient(String id, String projectId, int stage, String emails, Instant now)")],
  ["không còn cặp annotation nhân đôi", !(after[79].trim() === "@Override" && after[80].trim() === "@Transactional")],
  ["câu lệnh INSERT vẫn đúng 7 cột", after.join("\n").includes("INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at)")],
];
console.log("Hậu kiểm:");
let ok = true;
for (const [name, pass] of checks) { console.log(`  ${pass ? "ĐẠT" : "HỎNG"}  ${name}`); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
