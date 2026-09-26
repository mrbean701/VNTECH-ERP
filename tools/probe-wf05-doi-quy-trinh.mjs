// [PHASE 8 · WF-05] CỔNG KIỂM CHỨNG (P1): "Đổi workflow khi có phiếu đang chờ ⇒ PHIẾU CŨ GIỮ NGUYÊN LUỒNG".
// Cách làm (an toàn, tự khôi phục): đọc 1 dòng `approvals` đang PENDING + snapshot của nó → SỬA `approval_stage_catalog`
// (đổi vai trò được phép của đúng bước đó) → ĐỌC LẠI snapshot của phiếu ⇒ PHẢI KHÔNG ĐỔI → khôi phục catalog → xác nhận đã khôi phục.
// ĐỐI CHỨNG DƯƠNG (bắt buộc, để chứng minh phép đo CÓ độ nhạy): giá trị catalog sau khi sửa PHẢI KHÁC snapshot của phiếu cũ.
import { execFileSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const rows = (sql) => q(sql).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));

const results = [];
const check = (ok, label, evidence) => { results.push({ ok, label, evidence }); console.log(`  [${ok ? "ĐẠT " : "HỎNG"}] ${label} :: ${evidence}`); };

// 1) Chọn 1 phiếu ĐANG CHỜ có snapshot
const pend = rows("SELECT id, stage, COALESCE(allowed_role_codes_snapshot,'(trống)'), COALESCE(approval_mode_snapshot,'(trống)') FROM approvals WHERE status='pending' AND allowed_role_codes_snapshot IS NOT NULL LIMIT 1;")[0];
if (!pend) { console.error("✖ Không có phiếu pending nào có snapshot ⇒ DỪNG (không tự tạo dữ liệu)."); process.exit(1); }
const [aprId, stage, snapRoles, snapMode] = pend;
console.log(`phiếu thử: ${aprId} · bước ${stage} · snapshot vai trò = [${snapRoles}] · mode = ${snapMode}`);

const cat = rows(`SELECT id, COALESCE(allowed_role_codes,'') FROM approval_stage_catalog WHERE stage_no=${stage} LIMIT 1;`)[0];
if (!cat) { console.error(`✖ Không có bước ${stage} trong approval_stage_catalog ⇒ DỪNG.`); process.exit(1); }
const [catId, catRolesOld] = cat;
console.log(`catalog: ${catId} · vai trò cũ = [${catRolesOld}]`);

// 2) SỬA catalog (sentinel) rồi đo
const SENTINEL = "__WF05_PROBE__";
q(`UPDATE approval_stage_catalog SET allowed_role_codes='${SENTINEL}' WHERE id='${catId}';`);
const catRolesNew = q(`SELECT COALESCE(allowed_role_codes,'') FROM approval_stage_catalog WHERE id='${catId}';`);
const snapAfter = q(`SELECT COALESCE(allowed_role_codes_snapshot,'') FROM approvals WHERE id='${aprId}';`);

check(catRolesNew === SENTINEL, "đã SỬA được catalog (phép thử có tác động thật)", `catalog = [${catRolesNew}]`);
check(snapAfter === snapRoles, "SN PS HỢP CỦA PHIẾU ĐANG CHỜ KHÔNG ĐỔI (đúng yêu cầu WF-05)", `snapshot vẫn = [${snapAfter}]`);
check(catRolesNew !== snapAfter, "ĐỐI CHỨNG DƯƠNG: catalog mới KHÁC snapshot phiếu cũ (phép đo có độ nhạy)", `[${catRolesNew}] ≠ [${snapAfter}]`);

// 3) Khôi phục + xác nhận
q(`UPDATE approval_stage_catalog SET allowed_role_codes='${catRolesOld}' WHERE id='${catId}';`);
const catRolesRestored = q(`SELECT COALESCE(allowed_role_codes,'') FROM approval_stage_catalog WHERE id='${catId}';`);
check(catRolesRestored === catRolesOld, "đã KHÔI PHỤC catalog như trước", `catalog = [${catRolesRestored}]`);

const pendingTotal = q("SELECT COUNT(*) FROM approvals WHERE status='pending';");
check(Number(pendingTotal) > 0, "số phiếu đang chờ KHÔNG bị thay đổi bởi phép thử", `pending = ${pendingTotal}`);

const bad = results.filter((r) => !r.ok).length;
console.log(`\n=== KẾT QUẢ WF-05: ${results.length - bad}/${results.length} ĐẠT · ${bad} HỎNG ===`);
process.exit(bad ? 1 : 0);
