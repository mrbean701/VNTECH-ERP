// Kiểm chứng LÚC CHẠY cho TASK-041 phần 2 — `delete_approval_stage`.
//
// HAI CHỐT CỦA JS (scripts/system-route.mjs:2200-2215) mà bản Java cũ THIẾU:
//   · Không xoá bước ĐÃ CÓ LỊCH SỬ HỒ SƠ  → "Bước đã có lịch sử hồ sơ nên không được xóa. Hãy dùng Ẩn để ngừng áp dụng cho phiếu mới."
//   · Không xoá BƯỚC HOẠT ĐỘNG CUỐI CÙNG  → "Không thể xóa bước hoạt động cuối cùng."
// Thông điệp thành công: "Đã xóa bước phê duyệt chưa từng sử dụng." (bản cũ: "Đã xóa bước duyệt tùy chỉnh.")
//
// ⚠ AN TOÀN: đã có `tools/_backup-task041.sql`. Kịch bản chốt cuối tạm tắt bước 1–4 bằng SQL
// nhưng KHÔI PHỤC trong `finally`; nhánh xoá dùng bước TẠM do probe tự tạo nên không mất dữ liệu thật.
//
// Chạy: node tools/probe-task041-delete.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const mysql = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "-D", "vntech_erp", "--batch", "--raw",
  "--skip-column-names", "-e", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

const activeBefore = mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog");
const countBefore = mysql("SELECT COUNT(*) FROM approval_stage_catalog");
console.log(`TRƯỚC: ${countBefore} bước · active ${activeBefore}\n`);

let restored = false;
const restore = () => {
  if (restored) return;
  mysql("UPDATE approval_stage_catalog SET active=1 WHERE stage_no BETWEEN 1 AND 4");
  restored = true;
};
try {
  // ---- 1) chốt LỊCH SỬ: bước 1 đã có bản ghi approvals ----
  console.log("--- 1) Chốt: KHÔNG xoá bước đã có lịch sử hồ sơ (bước 1) ---");
  const stage1 = mysql("SELECT id FROM approval_stage_catalog WHERE stage_no=1");
  const hist1 = mysql("SELECT COUNT(*) FROM approvals WHERE stage=1");
  console.log(`  bước 1 có ${hist1} bản ghi lịch sử`);
  const del1 = await call("delete_approval_stage", { stageId: stage1 });
  console.log(`  HTTP ${del1.status}  ${del1.error || del1.message}`);
  check("chặn đúng nguyên văn JS",
    del1.status === 400 && del1.error === "Bước đã có lịch sử hồ sơ nên không được xóa. Hãy dùng Ẩn để ngừng áp dụng cho phiếu mới.",
    `HTTP ${del1.status} "${del1.error}"`);
  check("bước 1 VẪN CÒN trong bảng (không bị xoá)",
    mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=1") === "1");

  // ---- 2) chốt BƯỚC CUỐI CÙNG ----
  console.log("\n--- 2) Chốt: KHÔNG xoá bước hoạt động CUỐI CÙNG ---");
  // LỖI CỦA CHÍNH TÔI ĐÃ SỬA: bản đầu tôi lấy bước 5 làm "bước cuối" nhưng bước 5 **có 20 bản ghi lịch sử**
  // ⇒ chốt LỊCH SỬ chặn trước (đúng thứ tự JS) nên chốt CUỐI không tới lượt. Muốn kiểm chốt cuối phải dùng
  // một bước **chưa từng có lịch sử**. Vì vậy: tạo bước tạm 902, tắt 1–5, để 902 thành bước hoạt động cuối.
  const created902 = await call("save_approval_stage", {
    stageId: null, stageNo: 902, name: "BƯỚC TẠM CHỐT CUỐI TASK-041", slaHours: 8,
    approvalMode: "single", autoApproveOnSubmit: false, allowedRoleCodes: ["commander"],
  });
  check("tạo được bước tạm 902 (chưa có lịch sử)", created902.status === 200, `HTTP ${created902.status} ${created902.error}`);
  mysql("UPDATE approval_stage_catalog SET active=0 WHERE stage_no BETWEEN 1 AND 5");
  const activeNow = mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE active=1");
  console.log(`  dựng kịch bản: ${activeNow} bước hoạt động (là bước tạm 902)`);
  const stage902 = mysql("SELECT id FROM approval_stage_catalog WHERE stage_no=902");
  const hist902 = mysql("SELECT COUNT(*) FROM approvals WHERE stage=902");
  check("bước 902 chưa có lịch sử (để chốt lịch sử không che chốt cuối)", hist902 === "0", hist902);
  const del902 = await call("delete_approval_stage", { stageId: stage902 });
  console.log(`  HTTP ${del902.status}  ${del902.error || del902.message}`);
  check("chặn đúng nguyên văn JS",
    del902.status === 400 && del902.error === "Không thể xóa bước hoạt động cuối cùng.",
    `HTTP ${del902.status} "${del902.error}"`);
  check("bước 902 VẪN CÒN", mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=902") === "1");
  mysql("DELETE FROM approval_stage_catalog WHERE stage_no=902");
  console.log(`  đã dọn bước tạm 902`);
} finally {
  restore();
  mysql("UPDATE approval_stage_catalog SET active=1 WHERE stage_no BETWEEN 1 AND 5");
  mysql("DELETE FROM approval_stage_catalog WHERE stage_no IN (901, 902)");
  console.log(`\n↩ Đã khôi phục active: ${mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog")}`);
}

// ---- 3) đường THÀNH CÔNG trên bước TẠM (không lịch sử) ----
console.log("\n--- 3) Đường thành công: xoá bước TẠM chưa từng dùng ---");
const created = await call("save_approval_stage", {
  stageId: null, stageNo: 901, name: "BƯỚC TẠM ĐỂ XOÁ TASK-041", slaHours: 8,
  approvalMode: "single", autoApproveOnSubmit: false, allowedRoleCodes: ["commander"],
});
check("tạo bước tạm để xoá", created.status === 200, `HTTP ${created.status} ${created.error}`);
const tempId = mysql("SELECT id FROM approval_stage_catalog WHERE stage_no=901");
const delTemp = await call("delete_approval_stage", { stageId: tempId });
console.log(`  HTTP ${delTemp.status}  ${delTemp.message || delTemp.error}`);
check("xoá bước chưa dùng trả 200 + thông điệp nguyên văn JS",
  delTemp.status === 200 && delTemp.message === "Đã xóa bước phê duyệt chưa từng sử dụng.",
  `HTTP ${delTemp.status} "${delTemp.message}"`);
check("bước tạm đã bị xoá", mysql("SELECT COUNT(*) FROM approval_stage_catalog WHERE stage_no=901") === "0");
check("bước không tồn tại -> 400 đúng nguyên văn JS",
  (await call("delete_approval_stage", { stageId: "ASTAGE_KHONG_TON_TAI" })).error === "Không tìm thấy bước phê duyệt.");

const activeFinal = mysql("SELECT GROUP_CONCAT(CONCAT(stage_no,':',active) ORDER BY stage_no) FROM approval_stage_catalog");
check("trạng thái cuối = trạng thái đầu", activeFinal === activeBefore, `${activeBefore}  →  ${activeFinal}`);
check("số bước cuối = số bước đầu", mysql("SELECT COUNT(*) FROM approval_stage_catalog") === countBefore, countBefore);

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
process.exitCode = ok ? 0 : 1;
