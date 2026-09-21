// TASK-137 — kiểm chứng: LẬP PHIẾU ĐỀ NGHỊ KHI KHÔNG CHỌN DỰ ÁN / HỢP ĐỒNG / BOQ / KHO
//   node tools/tmp-check-request-no-project.mjs
// Kỳ vọng: HTTP 200, phiếu được tạo, material_requests.project_id = NULL.
// Lưu ý: bootstrap phải GET /api/system (kèm cookie) — POST action=bootstrap trả 403.
const BASE = process.env.BASE || "http://127.0.0.1:9000";
const USER = process.env.U || "ksda.demo";
const PASS = process.env.P || "Vntech@2026";

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, ok: res.ok && json?.ok !== false, json, cookie };
}

async function call(cookie, action, payload) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, text, json };
}

const out = (k, v) => console.log(`  ${String(k).padEnd(40)}: ${v}`);
let failed = false;

// 1) đăng nhập
const lg = await login(USER, PASS);
out("1. login HTTP", `${lg.status} (${USER})`);
if (!lg.ok || !lg.cookie) { console.log("  ✗ không đăng nhập được — dừng"); process.exitCode = 1; }
else {
  // 2) GET /api/system để lấy vật tư (chỉ tài khoản quản trị mới nhận danh mục ⇒ có thể để trống)
  const bootRes = await fetch(`${BASE}/api/system`, { headers: { cookie: lg.cookie } });
  const boot = await bootRes.json();
  const materials = boot?.materials || [];
  out("2. GET /api/system HTTP", bootRes.status);
  out("   số vật tư trong bootstrap", materials.length);
  const envId = process.env.MATERIAL_ID || "";
  const envCode = process.env.MATERIAL_CODE || "(env)";
  const m = materials.length
    ? { id: materials[0].id, code: materials[0].code, name: materials[0].name, unit: materials[0].unit }
    : { id: envId, code: envCode, name: envCode, unit: "" };
  if (!m.id) { console.log("  ✗ không có vật tư (bootstrap rỗng và chưa truyền MATERIAL_ID) — dừng"); process.exitCode = 1; }
  else {
    out("   dùng vật tư", `${m.code} · ${m.name}`);

    // 3) TẠO PHIẾU — CỐ Ý ĐỂ TRỐNG dự án / hợp đồng / BOQ / kho
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      projectId: "",          // ← TRỐNG (yêu cầu người dùng)
      contractId: "",         // ← TRỐNG
      boqVersionId: "",       // ← TRỐNG
      sourceWarehouseId: "",  // ← TRỐNG
      neededAt: today,
      area: "Kiem chung TASK-137",
      priority: "normal",
      purpose: "Kiem chung: lap phieu khong chon du an",
      lines: [{
        materialId: m.id, materialCode: m.code, materialName: m.name,
        unit: m.unit, quantity: 1, note: "TASK-137",
      }],
    };
    const cr = await call(lg.cookie, "create_request", payload);
    out("3. create_request HTTP", cr.status);
    out("   phản hồi", (cr.text || "").slice(0, 200));
    if (cr.status !== 200) failed = true;
    console.log(failed
      ? "\n  ❌ KẾT LUẬN: VẪN KHÔNG LẬP ĐƯỢC KHI BỎ TRỐNG DỰ ÁN — xem phản hồi ở trên"
      : "\n  ✅ KẾT LUẬN: LẬP ĐƯỢC PHIẾU KHI KHÔNG CHỌN DỰ ÁN / HỢP ĐỒNG / BOQ / KHO");
    process.exitCode = failed ? 2 : 0;
  }
}
