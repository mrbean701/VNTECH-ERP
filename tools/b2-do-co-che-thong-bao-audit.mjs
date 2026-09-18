// [PHASE 8 · B2 · bước 2] Đo cơ chế THÔNG BÁO + AUDIT hiện có trong JS để dùng ĐÚNG chuẩn cho approve_po/reject_po.
import { readFileSync } from "node:fs";
const lines = readFileSync("scripts/system-route.mjs", "utf8").split("\n");
const show = (label, re, max = 6) => {
  console.log(`\n=== ${label} ===`);
  let n = 0;
  lines.forEach((l, i) => {
    if (n < max && re.test(l)) { console.log(`${i + 1}: ${l.trim().slice(0, 200)}`); n++; }
  });
  if (!n) console.log("  (không thấy)");
};
show("hàm notify / thông báo (định nghĩa)", /function\s+\w*notif|const\s+\w*notif\w*\s*=|notifyUser/);
show("INSERT INTO task_notifications", /INSERT INTO task_notifications|task_notifications\s*\(/);
show("INSERT INTO email_outbox", /INSERT INTO email_outbox|email_outbox\s*\(/);
show("hàm audit (định nghĩa)", /async function audit|function audit\s*\(/);
show("gọi audit trong handler mới nhất", /await audit\(user\.id/);
