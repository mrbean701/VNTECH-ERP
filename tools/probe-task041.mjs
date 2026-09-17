// Kiểm chứng LÚC CHẠY cho TASK-041 — `save_approval_stage` + `set_approval_stage_status`.
//
// NĂM THỨ ĐƯỢC KIỂM:
//   A. HỢP ĐỒNG PAYLOAD: UI (`app/page.tsx:3832`) gửi stageId/stageNo/sortOrder/name/description/slaHours/
//      approvalMode/autoApproveOnSubmit/allowedRoleCodes và **KHÔNG gửi `code`**. Bản Java cũ bắt buộc `code`
//      ⇒ HTTP 400. Nay phải nhận đúng payload của UI.
//   B. SLA ĐƯỢC GHI THẬT: bản cũ chỉ ghi 3 cột ⇒ sửa SLA báo thành công nhưng KHÔNG đổi. Nay sửa 8 → 33
//      rồi ĐỌC LẠI phải ra 33.
//   C. CÁC TRƯỜNG KHÁC: description, approvalMode, sortOrder phải ghi được.
//   D. CHỐT "CHỈ BƯỚC ĐẦU ĐƯỢC TỰ DUYỆT": đặt autoApproveOnSubmit ở bước không phải đầu ⇒ 400 nguyên văn JS.
//   E. CHỐT "KHÔNG ĐỔI SỐ BƯỚC KHI ĐÃ CÓ LỊCH SỬ DUYỆT": đổi stage_no của bước 1 (đang có 100 bản ghi lịch sử)
//      ⇒ 400 nguyên văn JS, và stage_no PHẢI GIỮ NGUYÊN.
//   F. CHỐT "KHÔNG TẮT BƯỚC ĐANG CÓ HỒ SƠ CHỜ": tắt bước 1 (7 hồ sơ chờ) ⇒ 400 nguyên văn JS, active giữ 1.
//
// AN TOÀN DỮ LIỆU: đã sao lưu `approval_stage_catalog` ra `tools/_backup-task041.sql` TRƯỚC khi chạy.
// Probe TẠO một bước tạm `stageNo=900` rồi tự dọn; các nhánh D/E/F đều là nhánh CHẶN nên không ghi gì.
//
// Chạy: node tools/probe-task041.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const TEMP_STAGE_NO = 900;
const TEMP_NAME = "BƯỚC TẠM TASK-041";

// LỖI CỦA CHÍNH TÔI ĐÃ SỬA: bản đầu tôi dùng `allowedRoleCodes: ["admin"]`. SAI — `admin` là vai trò
// dựng sẵn của `users.role`, KHÔNG có dòng trong `role_catalog`, và **UI không cho chọn** nó
// (`app/page.tsx:3833` lọc `item.code !== "admin"`). JS cũng kiểm vai trò với `SELECT code FROM role_catalog
// WHERE active=1` nên JS CŨNG từ chối `admin`. Dùng vai trò có thật trong `role_catalog`.
const ROLE_A = "commander";
const ROLE_B = "director";

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
console.log(`Đăng nhập OK (${BASE})\n`);

const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const stages = async () => (await boot()).approvalStages ?? [];

const before = await stages();
console.log(`TRƯỚC: ${before.length} bước duyệt — ${before.map((s) => `${s.stageNo}:${s.slaHours}h/${s.approvalMode}`).join(" · ")}\n`);
check("bootstrap CÓ khoá approvalStages với đủ trường cần kiểm",
  before.length > 0 && "slaHours" in before[0] && "approvalMode" in before[0] && "sortOrder" in before[0],
  JSON.stringify(before[0] ?? null).slice(0, 160));

// ---------- A + B + C: TẠO bước tạm bằng ĐÚNG payload UI ----------
console.log("--- 1) Tạo bước tạm (payload y hệt UI, KHÔNG có `code`) ---");
const created = await call("save_approval_stage", {
  stageId: null, stageNo: TEMP_STAGE_NO, sortOrder: TEMP_STAGE_NO * 10, name: TEMP_NAME,
  description: "mô tả tạm TASK-041", slaHours: 8, approvalMode: "single",
  autoApproveOnSubmit: false, allowedRoleCodes: [ROLE_A],
});
console.log(`  HTTP ${created.status}  ${created.message || created.error}`);
check("A. KHÔNG còn 400 vì thiếu `code`", created.status !== 400 || !/mã/i.test(created.error),
  `HTTP ${created.status} "${created.error}"`);
check("A. tạo mới trả 200 + thông điệp nguyên văn JS",
  created.status === 200
  && created.message === `Đã thêm bước phê duyệt ${TEMP_NAME}. Phiếu mới sẽ áp dụng luồng mới; phiếu cũ giữ nguyên luồng đã tạo.`,
  `HTTP ${created.status} "${created.message}"`);

const afterCreate = await stages();
const temp = afterCreate.find((s) => Number(s.stageNo) === TEMP_STAGE_NO);
check("A. bước tạm có trong bootstrap", Boolean(temp), temp ? `id=${temp.id}` : "không thấy");
check("C. description ghi được (bản cũ truyền null cứng)",
  String(temp?.description ?? "") === "mô tả tạm TASK-041", String(temp?.description));
check("C. approvalMode ghi được", String(temp?.approvalMode) === "single", String(temp?.approvalMode));
check("C. slaHours ghi được", Number(temp?.slaHours) === 8, String(temp?.slaHours));
check("C. sortOrder ghi được", Number(temp?.sortOrder) === TEMP_STAGE_NO * 10, String(temp?.sortOrder));
check("C. autoApproveOnSubmit = false", !temp?.autoApproveOnSubmit, String(temp?.autoApproveOnSubmit));

// ---------- B: SỬA SLA — phép kiểm quan trọng nhất ----------
console.log("\n--- 2) Sửa SLA 8 → 33 rồi ĐỌC LẠI (đây là lỗi cũ: báo thành công nhưng SLA không đổi) ---");
const updated = await call("save_approval_stage", {
  stageId: temp?.id, stageNo: TEMP_STAGE_NO, sortOrder: 9010, name: TEMP_NAME + " (đã sửa)",
  description: "mô tả mới", slaHours: 33, approvalMode: "all_roles",
  autoApproveOnSubmit: false, allowedRoleCodes: [ROLE_A, ROLE_B],
});
console.log(`  HTTP ${updated.status}  ${updated.message || updated.error}`);
check("B. sửa trả 200 + thông điệp nguyên văn JS",
  updated.status === 200 && updated.message === `Đã cập nhật bước phê duyệt ${TEMP_NAME} (đã sửa).`,
  `HTTP ${updated.status} "${updated.message}"`);
const afterUpdate = (await stages()).find((s) => Number(s.stageNo) === TEMP_STAGE_NO);
check("B. *** SLA = 33 (bản cũ giữ nguyên 8) ***", Number(afterUpdate?.slaHours) === 33, String(afterUpdate?.slaHours));
check("C. approvalMode đổi thành all_roles", String(afterUpdate?.approvalMode) === "all_roles", String(afterUpdate?.approvalMode));
check("C. description đổi được", String(afterUpdate?.description ?? "") === "mô tả mới", String(afterUpdate?.description));
check("C. sortOrder = 9010", Number(afterUpdate?.sortOrder) === 9010, String(afterUpdate?.sortOrder));
check("C. allowedRoleCodes giữ đủ 2 vai trò",
  String(afterUpdate?.allowedRoleCodes ?? "").split(",").map((x) => x.trim()).filter(Boolean).length === 2,
  String(afterUpdate?.allowedRoleCodes));

// ---------- D: chốt "chỉ bước đầu được tự duyệt" ----------
console.log("\n--- 3) Chốt: tự duyệt chỉ cho BƯỚC ĐẦU (bước 900 không phải đầu) ---");
const auto = await call("save_approval_stage", {
  stageId: temp?.id, stageNo: TEMP_STAGE_NO, name: TEMP_NAME, slaHours: 8,
  autoApproveOnSubmit: true, allowedRoleCodes: [ROLE_A],
});
console.log(`  HTTP ${auto.status}  ${auto.error || auto.message}`);
check("D. chặn đúng nguyên văn JS",
  auto.status === 400 && auto.error === "Tự xác nhận khi gửi phiếu chỉ được đặt cho bước đầu tiên của luồng. Hãy đưa bước này lên đầu hoặc bỏ tùy chọn tự xác nhận.",
  `HTTP ${auto.status} "${auto.error}"`);

// ---------- E: chốt "không đổi số bước khi đã có lịch sử duyệt" ----------
console.log("\n--- 4) Chốt: KHÔNG đổi số bước khi bước đã có lịch sử duyệt (bước 1) ---");
const stage1 = before.find((s) => Number(s.stageNo) === 1);
const rename = await call("save_approval_stage", {
  stageId: stage1?.id, stageNo: 7, name: String(stage1?.name ?? "x"), slaHours: Number(stage1?.slaHours ?? 8),
  approvalMode: String(stage1?.approvalMode ?? "single"), allowedRoleCodes: String(stage1?.allowedRoleCodes ?? ROLE_A).split(",").filter(Boolean),
});
console.log(`  HTTP ${rename.status}  ${rename.error || rename.message}`);
check("E. chặn đúng nguyên văn JS",
  rename.status === 400 && rename.error === "Bước đã có lịch sử phê duyệt nên không thể đổi số bước. Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.",
  `HTTP ${rename.status} "${rename.error}"`);
const stage1After = (await stages()).find((s) => s.id === stage1?.id);
check("E. số bước của bước 1 GIỮ NGUYÊN (không bị đổi dù bị chặn)",
  Number(stage1After?.stageNo) === 1, String(stage1After?.stageNo));

// ---------- F: chốt "không tắt bước đang có hồ sơ chờ" ----------
console.log("\n--- 5) Chốt: KHÔNG tắt bước đang có hồ sơ chờ (bước 1 có 7 hồ sơ) ---");
const off = await call("set_approval_stage_status", { stageId: stage1?.id, active: 0 });
console.log(`  HTTP ${off.status}  ${off.error || off.message}`);
check("F. chặn đúng nguyên văn JS",
  off.status === 400 && off.error === "Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; phiếu đang chạy không được cắt ngang.",
  `HTTP ${off.status} "${off.error}"`);
check("F. bước 1 vẫn đang hoạt động", Boolean((await stages()).find((s) => s.id === stage1?.id)?.active));

// ---------- DỌN DẸP ----------
console.log("\n--- 6) Dọn dẹp: xoá bước tạm qua API ---");
const del = await call("delete_approval_stage", { stageId: temp?.id });
console.log(`  HTTP ${del.status}  ${del.message || del.error}`);
const finalStages = await stages();
check("dọn sạch bước tạm, về đúng số bước ban đầu",
  finalStages.length === before.length && !finalStages.some((s) => Number(s.stageNo) === TEMP_STAGE_NO),
  `${before.length} -> ${finalStages.length}`);

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
if (!ok) console.log("Nếu còn bước tạm chưa xoá, dọn bằng SQL: DELETE FROM approval_stage_catalog WHERE stage_no=900;");
process.exitCode = ok ? 0 : 1;
