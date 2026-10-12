// ✅ KIỂM CHỨNG `P-08` **HAI CHIỀU** — ⛔ KHÔNG TẠO TÁC DỤNG PHỤ (payload RỖNG ⇒ cổng quyền chạy TRƯỚC use case).
//   • NHÂN VIÊN  ⇒ kỳ vọng **403** + «Tài khoản không có quyền thực hiện nghiệp vụ này.»   (sau BUILD)
//   • ADMIN      ⇒ kỳ vọng **400** («thiếu/không hợp lệ dữ liệu») = ⭐ đã QUA cổng quyền ⇒ admin ĐƯỢC PHÉP ✅
//   ⛔ KHÔNG BAO GIỜ gửi payload thật cho các action này (tránh ghi dữ liệu).
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const STAFF = { u: process.argv[3] || "probe_self_186408", p: "Engineer@2026" };
const ADMIN = { u: "admin", p: "Admin123456@" };
const ACTIONS = ["bulk_import_projects", "delete_material_category"];
const EXPECT_MSG = "Tài khoản không có quyền thực hiện nghiệp vụ này.";

const post = async (cookie, action) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify({ action }) });
  let j = null; try { j = await r.json(); } catch { }
  return { status: r.status, msg: String(j?.error || j?.message || "") };
};
const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", username: u, password: p }) });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};

let pass = 0, fail = 0;
const check = (ok, label, detail) => { ok ? pass++ : fail++; console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`); };

const admin = await login(ADMIN.u, ADMIN.p);
const staff = await login(STAFF.u, STAFF.p);
console.log("═".repeat(84));
console.log(`  KIỂM CHỨNG P-08 HAI CHIỀU · base=${BASE} · admin=${admin.ok} · nhân viên=${staff.ok}`);
for (const a of ACTIONS) {
  const s = staff.ok ? await post(staff.cookie, a) : { status: 0, msg: "(không đăng nhập được)" };
  check(s.status === 403 && s.msg.includes(EXPECT_MSG), `NHÂN VIÊN · ${a}`, `HTTP ${s.status} · ${s.msg.slice(0, 70)}`);
  const d = admin.ok ? await post(admin.cookie, a) : { status: 0, msg: "" };
  check(d.status === 400, `ADMIN · ${a} (400 = ĐÃ QUA cổng quyền)`, `HTTP ${d.status} · ${d.msg.slice(0, 60)}`);
}
console.log("═".repeat(84));
console.log(`  KẾT QUẢ: ${pass} ĐẠT · ${fail} HỎNG  ${fail ? "⇒ ⚠️ chưa đạt (nếu chưa BUILD thì thông điệp còn SAI là ĐÚNG kỳ vọng «trước»)" : "⇒ ⭐ P-08 ĐẠT HAI CHIỀU"}`);
