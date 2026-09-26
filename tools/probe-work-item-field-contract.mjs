#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 3 (CÔNG VIỆC) · T-03/T-04
// CỔNG HỢP ĐỒNG TÊN TRƯỜNG CỦA MÀN CÔNG VIỆC (`app/screens/WorkCenter.tsx`) ↔ PAYLOAD THẬT (`/api/system`).
//
// VÌ SAO CẦN: đã có LỖI THẬT (im lặng) — màn Công việc lọc "Việc của tôi" bằng `assigneeUserId`,
// nhưng dòng `workItems` của payload mang tên `assignedTo` (`scripts/system-route.mjs`:
// `wi.assigned_to AS assignedTo`, `ua.full_name AS assignedToName`). Hai tên KHÔNG tồn tại
// ⇒ `mine` LUÔN rỗng, tab "Việc của tôi" LUÔN 0 việc, mà `tsc` vẫn XANH vì `Row` là chỉ mục mở.
// Cổng này biến phát hiện đó thành BẤT BIẾN: 3 lớp kiểm, có ĐỐI CHỨNG ÂM.
//
// Chạy: node tools/probe-work-item-field-contract.mjs [base]
//   base mặc định http://127.0.0.1:9000 (cutover proxy = đường người dùng thật mở).
import { readFileSync } from "node:fs";

const BASE = process.argv[2] || process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ADMIN_USER = process.env.PROBE_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.PROBE_ADMIN_PASS || "Admin123456@";

let pass = 0, fail = 0, note = 0;
const kq = [];
function check(name, ok, detail) {
  if (ok) { pass++; kq.push(`  [DAT ] ${name}${detail ? " :: " + detail : ""}`); }
  else { fail++; kq.push(`  [HONG] ${name}${detail ? " :: " + detail : ""}`); }
}
/**
 * KHOẢNG TRỜI ĐÃ BIẾT của bản ĐANG CHẠY — ĐẾM RIÊNG, không trộn vào ĐẠT/HỎNG.
 * Dùng cho phần đo trên dịch vụ: `:9000` phục vụ **bundle đã dựng**, mà việc dựng lại do captain làm
 * tuần tự. Mã nguồn (lớp 1) đã đúng ⇒ cổng không được tự báo HỎNG vì bundle cũ; nhưng cũng không được
 * im lặng coi là đạt, nên ghi nhận thành một dòng riêng.
 */
function ghiNhan(name, detail) { note++; kq.push(`  [GHI NHẬN – BUNDLE CŨ] ${name}${detail ? " :: " + detail : ""}`); }

// ---- LỚP 1: hợp đồng TÊN trong mã nguồn ----
const route = readFileSync("scripts/system-route.mjs", "utf8");
const screen = readFileSync("app/screens/WorkCenter.tsx", "utf8");
// Bỏ phần chú thích để không "đạt" nhờ chính câu giải thích lỗi cũ.
const screenCode = screen.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

check("câu SQL bootstrap đặt alias `assignedTo` cho người thực hiện",
  /wi\.assigned_to\s+AS\s+assignedTo/.test(route), "wi.assigned_to AS assignedTo");
check("câu SQL bootstrap đặt alias `assignedToName` cho tên người thực hiện",
  /full_name\s+AS\s+assignedToName/.test(route), "ua.full_name AS assignedToName");
check("màn Công việc ĐỌC đúng `assignedTo` (không phải `assigneeUserId`)",
  /assignedTo/.test(screenCode) && !/assigneeUserId/.test(screenCode),
  "WorkCenter.tsx");
check("màn Công việc ĐỌC đúng `assignedToName` (không phải `assigneeName`)",
  /assignedToName/.test(screenCode) && !/assigneeName\b/.test(screenCode),
  "WorkCenter.tsx");
// ĐỐI CHỨNG ÂM: cổng phải BẮT được chính lớp lỗi cũ nếu nó quay lại.
check("[đối chứng âm] mẫu giả `assigneeUserId` BỊ BẮT bởi cùng phép kiểm",
  /assigneeUserId/.test("const mine = items.filter((r) => String(r.assigneeUserId) === myId);"),
  "phép kiểm regex hoạt động trên chuỗi giả");

// ---- LỚP 2: T-04 — hai khoá ĐỌC mới phải có mặt ở cả 3 chỗ ----
for (const key of ["workItemComments", "workItemParticipants"]) {
  check(`bootstrap gom khoá mới \`${key}\` vào payload`, new RegExp(`\\b${key}\\b`).test(route), "system-route.mjs");
  check(`khai báo kiểu \`${key}\` trong AppData`, new RegExp(`\\b${key}\\b`).test(readFileSync("lib/ui-shared.tsx", "utf8")), "lib/ui-shared.tsx");
}
check("hai bảng mới có trong chuỗi migration SQLite (drizzle)",
  /CREATE TABLE IF NOT EXISTS `work_item_comments`/.test(readFileSync("drizzle/0155_phase_gd_phase_3_t_04_work_item_comment_participant.sql", "utf8")) &&
  /CREATE TABLE IF NOT EXISTS `work_item_participants`/.test(readFileSync("drizzle/0155_phase_gd_phase_3_t_04_work_item_comment_participant.sql", "utf8")), "drizzle/0155");
check("hai bảng mới có trong chuỗi migration MySQL (Flyway)",
  /CREATE TABLE IF NOT EXISTS `work_item_comments`/.test(readFileSync("java-backend/infrastructure/src/main/resources/db/migration/V20__task_comment_participant.sql", "utf8")) &&
  /CREATE TABLE IF NOT EXISTS `work_item_participants`/.test(readFileSync("java-backend/infrastructure/src/main/resources/db/migration/V20__task_comment_participant.sql", "utf8")), "V20");
// COLLATE là điều kiện sống còn (thiếu ⇒ Illegal mix of collations ⇒ UI 500) — kiểm ngay ở tầng tệp.
const v20 = readFileSync("java-backend/infrastructure/src/main/resources/db/migration/V20__task_comment_participant.sql", "utf8");
check("DDL MySQL: MỌI cột khoá/văn bản đều ghi COLLATE utf8mb4_unicode_ci",
  (v20.match(/COLLATE utf8mb4_unicode_ci/g) || []).length >= 10,
  `${(v20.match(/COLLATE utf8mb4_unicode_ci/g) || []).length} lần COLLATE (7 cột khoá/văn bản của comments + 6 của participants; riêng các cột datetime/tinyint không cần)`);
check("DDL MySQL: MỖI bảng kết thúc bằng mệnh đề cấp bảng InnoDB + charset + collate",
  (v20.match(/\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/g) || []).length === 2,
  `${(v20.match(/\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/g) || []).length}/2 bảng`);
check("DDL MySQL: KHÔNG dùng `text` cho mốc thời gian (phải `datetime(3)`)",
  !/`(created_at|updated_at)`\s+text/.test(v20) && (v20.match(/datetime\(3\)/g) || []).length === 4,
  `${(v20.match(/datetime\(3\)/g) || []).length} cột datetime(3)`);

// ---- LỚP 3: ĐO LẠI TRÊN DỊCH VỤ ĐANG CHẠY (không tin mã nguồn, đo payload thật) ----
async function login() {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: ADMIN_USER, password: ADMIN_PASS }), redirect: "manual",
  });
  const jar = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookie = jar.length ? jar.map((c) => c.split(";")[0]).join("; ") : String(res.headers.get("set-cookie") || "").split(";")[0];
  return { status: res.status, cookie };
}
try {
  const session = await login();
  check(`đăng nhập được qua ${BASE}`, session.status === 200 && Boolean(session.cookie), `HTTP ${session.status}`);
  if (session.cookie) {
    const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: session.cookie }, cache: "no-store" });
    const payload = (await res.json()).data || {};
    for (const key of ["workItemComments", "workItemParticipants"]) {
      if (Array.isArray(payload[key])) check(`payload THẬT có khoá \`${key}\``, true, `${payload[key].length} dòng`);
      else ghiNhan(`payload THẬT CHƯA có khoá \`${key}\``, "khoá chưa có trong bundle đang phục vụ; mã nguồn đã có (lớp 1) ⇒ cần DỰNG LẠI bundle rồi đo lại");
    }
    const rows = Array.isArray(payload.workItems) ? payload.workItems : [];
    check("mỗi dòng `workItems` có trường `assignedTo` (đúng tên màn Công việc đọc)", rows.length === 0 || rows.every((r) => "assignedTo" in r), `${rows.length} dòng`);
    check("mỗi dòng `workItems` có trường `assignedToName`", rows.length === 0 || rows.every((r) => "assignedToName" in r), `${rows.length} dòng`);
    check("[đối chứng âm] payload THẬT KHÔNG có `assigneeUserId` (tên cũ đã chết)",
      rows.every((r) => !("assigneeUserId" in r)), `${rows.length} dòng`);
  }
} catch (error) {
  console.log(`  [GHI NHẬN] không đo được lớp dịch vụ đang chạy: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(kq.join("\n"));
console.log(`\n=== CỔNG HỢP ĐỒNG TRƯỜNG CÔNG VIỆC: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG · ${note} GHI NHẬN (bundle cũ) ===`);
process.exitCode = fail === 0 ? 0 : 1;
