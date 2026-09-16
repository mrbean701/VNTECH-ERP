// NGHIỆM THU — KIỂM TRA CHIỀU USER THIẾU QUYỀN (không phải admin)
//
// Vì sao bắt buộc: bài học đã kiểm chứng trong dự án này — MỌI test chạy bằng admin sẽ
// CHE lỗi phân quyền. Ở mục 5 và 6 tôi mới chứng minh được chiều admin (nút bật);
// chiều "user thiếu quyền thì nút phải mờ/không bấm được" CHƯA được kiểm chứng.
//
// Probe này tạo một user thường role engineer rồi mở màn Danh mục vật tư gốc để đo
// trạng thái thật của các nút CRUD.
//
//   node tools/probe-material-perm.mjs [base] [adminUser] [adminPass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";
const PORT = 10031 + Math.floor(Math.random() * 60);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const loginApi = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

console.log("═".repeat(74));
console.log("  NGHIỆM THU — CHIỀU USER THIẾU QUYỀN");
console.log("═".repeat(74));

const admin = await loginApi(ADMIN, ADMIN_PASS);
check("Đăng nhập admin", admin.ok);
if (!admin.ok) process.exit(1);

const stamp = Date.now().toString().slice(-6);
const uname = `probe_perm_${stamp}`;
const STAFF_PASS = "Engineer@2026";
const mk = await post(admin.cookie, "create_user", {
  username: uname, fullName: `KS nghiệm thu ${stamp}`, email: `${uname}@test.local`,
  employeeCode: `NV-PERM-${stamp}`, role: "engineer", password: STAFF_PASS, projectIds: [],
});
check("Tạo được user thường (engineer)", mk.status === 200 || mk.status === 201,
  `HTTP ${mk.status}${mk.json?.error ? " · " + mk.json.error : ""}`);

const staff = await loginApi(uname, STAFF_PASS);
check("Đăng nhập được bằng user thường", staff.ok);

// QUAN TRỌNG: user mới tạo KHÔNG có quyền gì nên không thấy được màn Danh mục vật tư
// (hành vi bảo mật ĐÚNG). Muốn đo được trạng thái nút thì phải cấp cho họ quyền
// XEM mà KHÔNG cấp quyền SỬA trên module material_catalog.
const boot = await (await fetch(BASE + "/api/system", { headers: { cookie: admin.cookie } })).json();
const newUser = (boot.data?.users || []).find((u) => String(u.username) === uname);
check("Tìm được user vừa tạo trong bootstrap", Boolean(newUser), newUser?.id);

if (newUser) {
  // P5.3 — LUẬT: không được cấp cho NGƯỜI DÙNG quyền mà PHÒNG BAN chưa có
  // (UserManagementUseCase.assertDepartmentAllowsPermissions). Chốt này chỉ hoạt động khi
  // phòng ban ĐÃ được cấu hình ít nhất một quyền. Sau GĐ-B, phòng "Ban chỉ huy công trường"
  // đã được cấp quyền nên chốt bật lên ⇒ phải cấp quyền XEM material_catalog cho PHÒNG trước,
  // rồi quyền của người dùng mới suy ra được từ đó.
  const deptGrant = await post(admin.cookie, "save_department_permission", {
    organizationUnitId: newUser.organizationUnitId,
    moduleKey: "material_catalog",
    canView: true, canUse: false, canCreate: false,
    canEdit: false, canApprove: false, canExport: false,
  });
  check("Cấp quyền XEM material_catalog cho PHÒNG BAN của user", deptGrant.status === 200,
    `HTTP ${deptGrant.status}${deptGrant.json?.error ? " · " + deptGrant.json.error : ""}`);

  const grant = await post(admin.cookie, "save_user_access", {
    userId: newUser.id,
    projectScopes: [], warehouseScopes: [],
    modulePermissions: [{
      moduleKey: "material_catalog",
      canView: true, canUse: false, canCreate: false,
      canEdit: false, canApprove: false, canExport: false,
      permissionExpiresAt: "",
    }],
  });
  check("Cấp được quyền XEM (không SỬA) cho user thường",
    grant.status === 200, `HTTP ${grant.status}${grant.json?.error ? " · " + grant.json.error : ""}`);
}

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (staff.ok && EDGE) {
  const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${join(ART, `edge-perm-${Date.now()}`)}`, "--no-first-run",
    "--no-default-browser-check", "--disable-gpu", "--window-size=1600,900", BASE], { stdio: "ignore" });
  let wsUrl;
  for (let i = 0; i < 60; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
    await sleep(500);
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
  const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => { pend.set(id, (m) => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result));
      setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("timeout"))), 60000); }); };
  const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
    return r.result.value; };

  await send("Page.enable"); await send("Runtime.enable");
  await sleep(2500);
  await ev(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(uname)},password:${JSON.stringify(STAFF_PASS)}})});return r.status;})()`);
  await send("Page.navigate", { url: BASE });
  await sleep(7000);

  console.log("\n▸ Mở Danh mục vật tư gốc bằng USER THƯỜNG");
  await ev(`(()=>{const sec=document.querySelector('[data-nav-group="material_master"]');
    const b=sec?sec.querySelector(':scope > button'):null;
    if(b && b.getAttribute('aria-expanded')==='false') b.click(); return 1;})()`);
  await sleep(1800);
  const nav = await ev(`(()=>{const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
    const sec=document.querySelector('[data-nav-group="material_master"]');
    const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
    const kid=kids.find(e=>norm(e.textContent).includes('danh mục vật tư'));
    if(kid){ kid.click(); return 'OK'; }
    const all=[...document.querySelectorAll('button,a,[role=button]')];
    const el=all.find(e=>norm(e.textContent).includes('danh mục vật tư'));
    if(!el) return 'NOT_FOUND'; el.click(); return 'OK';})()`);
  check("User thường mở được màn Danh mục vật tư", nav === "OK", nav);
  await sleep(3500);

  const perm = JSON.parse(await ev(`(()=>{
    const root=document.querySelector('.material-list-card');
    // XÁC NHẬN đang đăng nhập bằng AI — tránh kết luận sai vì session còn là admin
    const who=(document.querySelector('.topbar')?.textContent||'').replace(/\\s+/g,' ').slice(0,80);
    const bodyTxt=(document.body.textContent||'').replace(/\\s+/g,' ');
    const loggedOut=/Đăng nhập|Mật khẩu/.test(bodyTxt) && !root;
    if(!root) return JSON.stringify({found:false, who, loggedOut});
    const btns=[...root.querySelectorAll('tbody .row-actions button')];
    const byLabel={};
    for(const b of btns){ const k=b.textContent.trim(); byLabel[k]=byLabel[k]||{total:0,disabled:0}; byLabel[k].total++; if(b.disabled) byLabel[k].disabled++; }
    const addBtn=root.querySelector('.material-list-filters button');
    const note=root.querySelector('.material-list-note')?.textContent||'';
    return JSON.stringify({found:true, who, rows:root.querySelectorAll('tbody tr').length, byLabel,
      addDisabled: addBtn?addBtn.disabled:null, note:note.slice(0,120)});
  })()`));
  console.log("   " + JSON.stringify(perm).slice(0, 480));

  check("Bảng vẫn render cho user thường", perm.found === true);
  const s = perm.byLabel?.["Sửa"] || { total: 0, disabled: 0 };
  check("Nút 'Sửa' VẪN HIỆN cho user thường", s.total > 0, `${s.total} nút`);
  check("Nút 'Sửa' BỊ VÔ HIỆU HOÁ với user thiếu quyền", s.total > 0 && s.disabled === s.total,
    `${s.disabled}/${s.total} bị disable`);
  const n = perm.byLabel?.["Ngừng"] || { total: 0, disabled: 0 };
  check("Nút 'Ngừng' BỊ VÔ HIỆU HOÁ với user thường", n.total > 0 && n.disabled === n.total,
    `${n.disabled}/${n.total} bị disable`);
  check("Nút '＋ Thêm vật tư' bị vô hiệu hoá", perm.addDisabled === true || perm.addDisabled === null,
    `disabled=${perm.addDisabled}`);
  check("Có dòng ghi chú giải thích quyền", /quyền/i.test(String(perm.note || "")), perm.note);

  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
}

// dọn dẹp
const { execFileSync } = await import("node:child_process");
const mysql = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
try {
  execFileSync(mysql, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
    "-e", `DELETE FROM users WHERE username LIKE 'probe_perm_%';`], { stdio: "ignore" });
  console.log("\n▸ Đã dọn user probe");
} catch { console.log("\n▸ Không dọn được user probe"); }

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));
process.exit(failed.length === 0 ? 0 : 2);
