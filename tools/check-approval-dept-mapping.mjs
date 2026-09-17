// Chứng minh ở mức DỮ LIỆU cho bản vá §8.1 (TASK-033).
//
// Bản vá trong `app/page.tsx` suy phòng ban của người duyệt bằng:
//     data.staffDirectory?.find((u) => u.id === approval.approverUserId)?.department || ""
// rồi chỉ hiển thị khi giá trị khác rỗng.
//
// ⇒ Điều kiện để bản vá HIỆN ĐƯỢC là: với mọi bước phê duyệt ĐÃ có người quyết định,
//    `approverUserId` phải tra ra một dòng staffDirectory có `department` KHÁC RỖNG.
//
// Cổng ảnh không kiểm được phần này (drawer đang đóng trong ảnh chuẩn) và bản dựng UI đang bị chặn
// (TASK-034), nên đây là phép kiểm thay thế có giá trị thật: nó chứng minh ĐẦU VÀO của phép ánh xạ.
//
// Chạy: node tools/check-approval-dept-mapping.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:9000";

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
const d = (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data;

const staff = new Map((d.staffDirectory || []).map((s) => [s.id, s]));
const requests = d.requests || [];

let decided = 0, resolved = 0, empty = 0, missing = 0, nullUser = 0;
const problems = [];

for (const r of requests) {
  for (const a of r.approvals || []) {
    if (!a.decidedAt) continue;              // chỉ kiểm bước ĐÃ có người quyết định
    decided++;
    if (!a.approverUserId) { nullUser++; problems.push(`${r.requestNo} bước ${a.stage}: có decidedAt nhưng approverUserId rỗng`); continue; }
    const s = staff.get(a.approverUserId);
    if (!s) { missing++; problems.push(`${r.requestNo} bước ${a.stage}: approverUserId không có trong staffDirectory`); continue; }
    if (!String(s.department || "").trim()) { empty++; problems.push(`${r.requestNo} bước ${a.stage}: ${s.fullName} thiếu department`); continue; }
    resolved++;
  }
}

console.log(`Nguồn: ${BASE}`);
console.log(`Phiếu: ${requests.length} · staffDirectory: ${staff.size}\n`);
console.log(`Bước ĐÃ có người quyết định : ${decided}`);
console.log(`  → tra được phòng ban       : ${resolved}`);
console.log(`  → approverUserId rỗng      : ${nullUser}`);
console.log(`  → không có trong danh bạ   : ${missing}`);
console.log(`  → có trong danh bạ nhưng department TRỐNG: ${empty}`);

if (problems.length) {
  console.log("\nChi tiết:");
  for (const p of problems.slice(0, 15)) console.log("  - " + p);
}

const pass = decided > 0 && resolved === decided;
console.log("\n" + (pass
  ? `KẾT LUẬN: toàn bộ ${decided} bước đã quyết đều tra được phòng ban KHÁC RỖNG ⇒ bản vá §8.1 sẽ HIỂN THỊ "Phòng ban: …".`
  : `KẾT LUẬN: ${decided - resolved} bước KHÔNG tra được phòng ban ⇒ bản vá §8.1 sẽ KHÔNG hiện ở các bước đó.`));

// KHÔNG dùng `process.exit()` ở đây: khi còn handle của `fetch` đang đóng, Node trên Windows sập với
// "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c" và trả mã thoát KHÁC 0
// DÙ kết luận đã là ĐẠT — tức một cổng "đạt" lại báo lỗi, rất dễ gây kết luận sai.
// Đặt `process.exitCode` rồi để Node tự thoát êm.
process.exitCode = pass ? 0 : 1;
