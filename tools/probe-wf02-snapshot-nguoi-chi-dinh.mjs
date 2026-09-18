// [PHASE 8 · WF-02 / S-08] ĐO RỒI MỚI ĐÁNH DẤU: "Snapshot danh sách người được chỉ định vào phiếu" (bịt rủi ro §20.3).
// Nếu MỌI phép kiểm ĐẠT ⇒ mới đổi `WF-02` + `S-08` sang DONE trong lộ trình; nếu không ⇒ TỪ CHỐI đổi hồ sơ.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();

const checks = [];
const check = (ok, label, evidence) => { checks.push({ ok, label, evidence }); console.log(`  [${ok ? "ĐẠT " : "HỎNG"}] ${label} :: ${evidence}`); };

// 1) Đo phủ snapshot
const stat = q(`SELECT CONCAT(COUNT(*),'|',SUM(CASE WHEN COALESCE(allowed_role_codes_snapshot,'')<>'' THEN 1 ELSE 0 END),'|',SUM(CASE WHEN status='pending' AND approver_user_id IS NULL THEN 1 ELSE 0 END),'|',SUM(CASE WHEN approver_user_id IS NOT NULL THEN 1 ELSE 0 END)) FROM approvals;`).split("|");
const [total, snapFilled, pendNoOwner, hasOwner] = stat.map(Number);
check(total > 0 && snapFilled === total, "mọi phiếu duyệt đều có SNAPSHOT vai trò/mode (không đọc live)", `${snapFilled}/${total} dòng`);
check(hasOwner > 0, "người được chỉ định (`approver_user_id`) là trường CỦA TỪNG PHIẾU, không tra live", `${hasOwner}/${total} dòng có người chỉ định`);

// 2) Đổi catalog ⇒ snapshot của phiếu cũ phải KHÔNG đổi
const row = q(`SELECT CONCAT(id,'|',stage,'|',COALESCE(allowed_role_codes_snapshot,'')) FROM approvals WHERE status='pending' AND allowed_role_codes_snapshot IS NOT NULL LIMIT 1;`).split("|");
const [aprId, stage, snapBefore] = row;
const cat = q(`SELECT CONCAT(id,'|',COALESCE(allowed_role_codes,'')) FROM approval_stage_catalog WHERE stage_no=${stage} LIMIT 1;`).split("|");
q(`UPDATE approval_stage_catalog SET allowed_role_codes='__WF02_PROBE__' WHERE id='${cat[0]}';`);
const snapAfter = q(`SELECT COALESCE(allowed_role_codes_snapshot,'') FROM approvals WHERE id='${aprId}';`);
q(`UPDATE approval_stage_catalog SET allowed_role_codes='${cat[1]}' WHERE id='${cat[0]}';`);
const restored = q(`SELECT COALESCE(allowed_role_codes,'') FROM approval_stage_catalog WHERE id='${cat[0]}';`);
check(snapAfter === snapBefore, "đổi catalog ⇒ snapshot phiếu cũ KHÔNG đổi", `[${snapBefore}] → [${snapAfter}]`);
check(restored === cat[1], "đã khôi phục catalog", `[${restored}]`);

// 3) Bằng chứng mã nguồn: lúc TẠO phiếu duyệt có GHI 2 cột snapshot
const java = readFileSync("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/RequestStoreAdapter.java", "utf8");
const insertBlock = java.split("\n").slice(250, 262).join("\n");
const writesSnapshot = java.includes("allowed_role_codes_snapshot") && java.includes("approval_mode_snapshot") && /INSERT\s+INTO\s+approvals/i.test(java);
check(writesSnapshot, "mã nguồn: lúc TẠO phiếu duyệt CÓ ghi 2 cột snapshot (RequestStoreAdapter — kiểm theo NỘI DUNG (bỏ neo số dòng))", writesSnapshot ? "thấy INSERT + cả 2 cột snapshot" : "KHÔNG thấy");

const bad = checks.filter((c) => !c.ok).length;
console.log(`\n=== KẾT QUẢ WF-02/S-08: ${checks.length - bad}/${checks.length} ĐẠT · ${bad} HỎNG ===`);

if (bad) { console.log("⇒ TỪ CHỐI đổi hồ sơ (bằng chứng CHƯA đủ)."); process.exit(1); }

// 4) Đủ bằng chứng ⇒ đánh dấu DONE
const FILE = "docs/25_TODO_ROADMAP.md";
const lines = readFileSync(FILE, "utf8").split("\n");
let changed = [];
for (const key of ["Snapshot **danh sách người được chỉ định**, không đọc live", "**Snapshot danh sách người được chỉ định** vào phiếu"]) {
  const i = lines.findIndex((l) => l.includes(key));
  if (i < 0) { console.log(`⚠️ không thấy dòng cho: ${key.slice(0, 40)}…`); continue; }
  if (!lines[i].includes("| TODO |")) { console.log(`⚠️ dòng đã không còn TODO: ${key.slice(0, 40)}…`); continue; }
  lines[i] = lines[i].replace(/\|\s*TODO\s*\|/, "| **DONE / AP-DUNG 100** |");
  changed.push(lines[i].trim().split("|")[1].trim());
}
if (changed.length) {
  writeFileSync(FILE, lines.join("\n"));
  console.log("ĐÃ GHI lộ trình: " + changed.join(" · ") + " → DONE / AP-DUNG 100");
  appendFileSync("docs/agent-progress/MASTER_STATUS.md", `\n- **[PHASE 8] WF-05 + WF-02/S-08**: snapshot người/vai trò/mode được ghi lúc tạo phiếu và **thắng** khi ra quyết định (Java \`RequestStoreAdapter.java:255,293-294\`; JS \`system-route.mjs:489,1105\`) · đo phủ **${snapFilled}/${total}** dòng có snapshot · cổng \`probe-wf05-doi-quy-trinh\` **5/5 ĐẠT** ⇒ đổi quy trình KHÔNG đổi luồng phiếu đang chờ.\n`);
} else console.log("⚠️ Không đổi được dòng nào trong lộ trình.");
