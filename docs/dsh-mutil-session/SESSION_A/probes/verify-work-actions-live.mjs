// ⭐ `ERP-SESSION-01` — PHÉP ĐO LIVE cho 2 action WORK vừa port sang Java (`docs/61` Q3 · `BUG-20261009-015`).
//
// ⚠️ MỤC ĐÍCH: đưa `BUG-20261009-015` từ **FIXED** lên **VERIFIED** bằng chứng cớ THẬT trên bản đang chạy
//    (⛔ không chỉ test H2) — luật §24: `VERIFIED = FIXED + RECHECK`.
//
// ⚠️ AN TOÀN / DỌN DẸP (luật **D-104**): probe CÓ ghi 1 hàng `work_item_comments` + 1 hàng
//    `work_item_participants` (⚠️ bắt buộc — muốn chứng minh action chạy được thì phải gọi thật),
//    ⭐ người chạy PHẢI xoá ĐÚNG 2 hàng đó sau khi đo (đối chiếu bằng MÃ ĐÁNH DẤU `[S01-VERIFY]`).
//    ⚠️ Chỉ dùng trên nhiệm vụ THỬ/không ảnh hưởng nghiệp vụ; ⛔ KHÔNG chạy khi 2 bảng đã có dữ liệu thật.
//
// CÁCH DÙNG:
//   node docs/dsh-mutil-session/SESSION_A/probes/verify-work-actions-live.mjs <BASE> <workItemId> <targetUserId>

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const WORK_ITEM = process.argv[3];
const TARGET_USER = process.argv[4];
const MARK = "[S01-VERIFY]";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123456@";

if (!WORK_ITEM || !TARGET_USER) {
  console.log("⛔ Thiếu tham số: <BASE> <workItemId> <targetUserId>");
  process.exit(2);
}

const goi = async (body, cookie) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* giữ text thô */ }
  return { status: r.status, json, text };
};

const dangNhap = async () => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return r.status === 200 && cookie ? cookie : null;
};

console.log("═══ ĐO LIVE 2 ACTION WORK (port Java) — " + BASE + " ═══");
console.log("   nhiệm vụ = " + WORK_ITEM + " · người tham gia = " + TARGET_USER);

const cookie = await dangNhap();
if (!cookie) {
  console.log("⛔ không đăng nhập được bằng tài khoản probe ⇒ ⛔ DỪNG (không đo được)");
  process.exit(1);
}
console.log("① đăng nhập admin: ✅");

const c1 = await goi({ action: "add_work_item_comment", workItemId: WORK_ITEM, comment: MARK + " bình luận đo live", visibility: "internal" }, cookie);
console.log("② add_work_item_comment  ⇒ HTTP " + c1.status + "  " + (c1.json?.message || c1.text).slice(0, 140));
console.log("   (⛔ 400 'chưa triển khai' = CHƯA port · 200 = ĐÃ CHẠY THẬT)");

const c2 = await goi({ action: "set_work_item_participant", workItemId: WORK_ITEM, userId: TARGET_USER, roleInTask: "supporter" }, cookie);
console.log("③ set_work_item_participant ⇒ HTTP " + c2.status + "  " + (c2.json?.message || c2.text).slice(0, 140));

// Đối chứng ÂM ngay trên bản chạy: gọi ẨN DANH ⇒ phải bị chặn (⛔ không nới quyền)
const c3 = await goi({ action: "add_work_item_comment", workItemId: WORK_ITEM, comment: MARK + " ẩn danh" }, null);
console.log("④ ĐỐI CHỨNG ÂM (ẩn danh) ⇒ HTTP " + c3.status + "  ⇒ " + (c3.status === 200 ? "🔴 HỞ QUYỀN!" : "✅ bị chặn"));

console.log("⑤ KẾT LUẬN: " + (c1.status === 200 && c2.status === 200 && c3.status !== 200
  ? "✅ CẢ 2 ACTION CHẠY THẬT + ⛔ không nới quyền"
  : "🔴 CHƯA ĐẠT — xem mã HTTP ở trên"));
