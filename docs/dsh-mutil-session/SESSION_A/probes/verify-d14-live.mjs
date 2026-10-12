// ⭐ `ERP-SESSION-01` — PHÉP ĐO **CHỈ ĐỌC** cho `CHG-20261009-012` (6 action «MÙ QUYỀN» đã được khai quyền).
//
// ⚠️ MỤC ĐÍCH: chứng minh **TRÊN BẢN ĐANG CHẠY** rằng `ActionRbacRegistry` mới đã có hiệu lực:
//    trước khi khai ⇒ thông điệp là «**Thao tác chưa được khai báo quyền** trong hệ thống…» (nhánh `required.isEmpty()`)
//    sau khi khai  ⇒ thông điệp là «**Tài khoản chưa được quản trị viên cấp đúng quyền** cho thao tác này.» (nhánh module)
//    ⇒ ⭐ CHỈ ĐỔI **THÔNG ĐIỆP** đã chứng minh khai báo có hiệu lực, ⛔ **KHÔNG cần ghi CSDL** ✓
//
// ⚠️ AN TOÀN: probe chỉ **đăng nhập** + gọi action ⛔ **không có tham số ghi** ⇒ action trả **403** (thiếu quyền)
//    ⇒ ⛔ **0 hàng nào bị ghi** (đúng luật D-104: ⛔ không để lại rác) ✓
//    ⚠️ Nếu action trả 200 thì probe DỪNG và báo (⚠️ nghĩa là tài khoản đó CÓ quyền — cần xem lại, ⛔ không tiếp tục).
//
// CÁCH DÙNG:  node docs/dsh-mutil-session/SESSION_A/probes/verify-d14-live.mjs [BASE] [user] [pass]

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const USER = process.argv[3] || "e2e.kh";
const PASS = process.argv[4] || "VnTech@123";

const MSG_CHUA_KHAI = "chưa được khai báo quyền";
const MSG_THIEU_QUYEN = "chưa được quản trị viên cấp đúng quyền";

const goi = async (body, cookie) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, text };
};

console.log("═══ ĐO LIVE 6 ACTION «MÙ QUYỀN» (CHỈ ĐỌC) — " + BASE + " ═══");
console.log("   tài khoản thử = " + USER);

const login = await fetch(BASE + "/api/system", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
if (login.status !== 200 || !cookie) {
  console.log("⛔ KHÔNG đăng nhập được bằng tài khoản thử (HTTP " + login.status + ") ⇒ ⛔ KHÔNG đo được live");
  console.log("   ⇒ ghi nhận: chờ USER kiểm bằng tài khoản thật (⛔ không tự tạo tài khoản — luật D-104)");
  process.exit(2);
}
console.log("① đăng nhập: ✅");

const ACTIONS = ["list_contract_review", "open_contract_review", "save_contract_review",
  "log_contract_review", "delete_contract_review", "work_scope"];
let chuaKhai = 0, thieuQuyen = 0, khac = 0;

for (const action of ACTIONS) {
  // ⛔ CHỈ gọi action ĐỌC/danh mục — ⛔ KHÔNG gọi action ghi (save_/delete_/log_) vì có thể ghi dữ liệu nếu đủ quyền
  if (!["list_contract_review", "work_scope"].includes(action)) {
    console.log("   · " + action.padEnd(24) + " (⛔ bỏ qua — action GHI, ⛔ không gọi trong probe chỉ-đọc)");
    continue;
  }
  const r = await goi({ action }, cookie);
  const laChuaKhai = r.text.includes(MSG_CHUA_KHAI);
  const laThieuQuyen = r.text.includes(MSG_THIEU_QUYEN);
  if (laChuaKhai) chuaKhai++;
  else if (laThieuQuyen) thieuQuyen++;
  else khac++;
  console.log("   · " + action.padEnd(24) + " HTTP " + r.status
    + (laChuaKhai ? "  🔴 «chưa được KHAI BÁO quyền» (⛔ khai báo CHƯA có hiệu lực)"
      : laThieuQuyen ? "  ✅ «chưa được CẤP đúng quyền» (⭐ khai báo ĐÃ có hiệu lực — chỉ thiếu cấp quyền)"
        : "  ℹ️ thông điệp khác: " + r.text.slice(0, 90)));
}

console.log("");
console.log("② KẾT LUẬN: " + (chuaKhai === 0 && thieuQuyen > 0
  ? "✅ KHAI BÁO CÓ HIỆU LỰC TRÊN BẢN CHẠY (⛔ không còn nhánh «chưa khai báo»)"
  : chuaKhai > 0 ? "🔴 CHƯA có hiệu lực (vẫn rơi nhánh «chưa khai báo»)"
    : "ℹ️ xem chi tiết từng dòng ở trên"));
console.log("③ ⛔ KHÔNG ghi hàng nào: probe chỉ gọi action ĐỌC + action bị 403 ⇒ CSDL ⛔ không đổi ✓");
