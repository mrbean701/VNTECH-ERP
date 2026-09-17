// Kiểm tầng HTTP cho TASK-040 nhóm 4 + 5 — chỉ chạm các nhánh CHẶN, KHÔNG ghi dữ liệu.
//
// VÌ SAO CHỈ KIỂM NHÁNH CHẶN: `confirm_installation` và `settle_subcontract` đều ghi dữ liệu kho/quyết toán
// thật. Tầng SQL đã được chứng minh riêng bằng transaction + ROLLBACK (tools/probe-task040-nhom45.sql).
// Ở đây chỉ cần chứng minh: action ĐẾN ĐƯỢC tới tầng nghiệp vụ, các phép chặn trả ĐÚNG thông điệp,
// và ranh giới phân quyền còn nguyên (GOAL §7). Mọi lệnh dưới đây đều dừng TRƯỚC khi ghi.
//
// Chạy: node tools/probe-task040-nhom45.mjs <issueItemId> [base]
const ISSUE_ITEM_ID = process.argv[2] || "";
const BASE = process.argv[3] || "http://127.0.0.1:18081";
if (!ISSUE_ITEM_ID) {
  console.error("Thiếu issueItemId. Lấy một dòng thật:");
  console.error("  SELECT id FROM stock_issue_items LIMIT 1;   (mysql -uvntech -pvntech -D vntech_erp)");
  process.exit(2);
}

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

async function login(u, p) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  if (!res.ok) return null;
  return (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
}
const cookie = await login("admin", "Admin123456@");
if (!cookie) { console.error("Đăng nhập admin thất bại"); process.exit(1); }
console.log(`Đăng nhập admin OK (${BASE}) · issueItemId=${ISSUE_ITEM_ID}\n`);

async function call(action, payload = {}, as = cookie) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie: as },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

console.log("--- confirm_installation: các nhánh CHẶN (không ghi) ---");
const bogus = await call("confirm_installation", { issueItemId: "SMII_KHONG_TON_TAI", quantity: 1 });
console.log(`  · issueItemId sai -> HTTP ${bogus.status}  ${bogus.error}`);
check("dòng xuất kho không tồn tại -> 400 đúng thông điệp",
  bogus.status === 400 && bogus.error === "Dòng xác nhận lắp đặt không hợp lệ.", `HTTP ${bogus.status} "${bogus.error}"`);
check("action ĐẾN ĐƯỢC tầng nghiệp vụ (không phải 500)", bogus.status !== 500, `HTTP ${bogus.status}`);

const zero = await call("confirm_installation", { issueItemId: ISSUE_ITEM_ID, quantity: 0 });
console.log(`  · quantity = 0 -> HTTP ${zero.status}  ${zero.error}`);
check("số lượng 0 -> 400 đúng thông điệp",
  zero.status === 400 && zero.error === "Dòng xác nhận lắp đặt không hợp lệ.", `HTTP ${zero.status} "${zero.error}"`);

const over = await call("confirm_installation", { issueItemId: ISSUE_ITEM_ID, quantity: 99999 });
console.log(`  · quantity vượt -> HTTP ${over.status}  ${over.error}`);
check("xác nhận vượt số lượng đã nhận -> 400 đúng thông điệp",
  over.status === 400 && over.error === "Số lượng xác nhận lắp vượt số lượng tổ đội đã nhận.",
  `HTTP ${over.status} "${over.error}"`);
check("KHÔNG có lỗi 500 nào lộ ra ở cả 3 nhánh",
  [bogus, zero, over].every((r) => r.status !== 500));

console.log("\n--- settle_team_subcontract: nhánh CHẶN ---");
// TÊN ACTION ĐÚNG là `settle_team_subcontract` (JS scripts/system-route.mjs:1249, Java SystemController:637).
// Bản đầu của probe này dùng `settle_subcontract` — tên do tôi tự suy từ tên phương thức, KHÔNG tồn tại,
// nên Java trả *"chưa được triển khai trên backend Java"* và tôi đã suýt kết luận sai rằng action là mã chết.
// Công cụ `probe-action-coverage-controller.mjs` phát hiện mâu thuẫn (0 action thiếu case) ⇒ mới lộ ra lỗi này.
const badSc = await call("settle_team_subcontract", { subcontractId: "TSC_KHONG_TON_TAI" });
console.log(`  · subcontractId sai -> HTTP ${badSc.status}  ${badSc.error}`);
check("hợp đồng giao khoán không tồn tại -> 400 (không phải 500)",
  badSc.status === 400 && badSc.error.length > 0, `HTTP ${badSc.status} "${badSc.error}"`);
check("action CÓ được Java triển khai (không phải thông điệp Strangler Fig)",
  !/chưa được triển khai/i.test(badSc.error), badSc.error);

console.log("\n--- GOAL §7: ranh giới phân quyền ---");
const userCookie = await login("nvdademo", "Vntech@2026");
check("đăng nhập được nvdademo (engine role project)", Boolean(userCookie));
const forbidden = await call("confirm_installation", { issueItemId: ISSUE_ITEM_ID, quantity: 1 }, userCookie);
console.log(`  · nvdademo gọi confirm_installation -> HTTP ${forbidden.status}  ${forbidden.error}`);
check("confirm_installation chặn ở backend khi thiếu quyền",
  forbidden.status === 403 || forbidden.status === 400, `HTTP ${forbidden.status}`);

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
console.log("\nGIỚI HẠN (nói rõ): probe này KHÔNG chứng minh đường GHI chạy hết vòng vì mọi nhánh đều dừng");
console.log("trước khi ghi. Tầng SQL đã chứng minh riêng bằng probe-task040-nhom45.sql (transaction + ROLLBACK).");
console.log("Xác nhận lắp đặt thật với dữ liệu thật vẫn cần người dùng bấm trên giao diện.");
process.exitCode = ok ? 0 : 1;
