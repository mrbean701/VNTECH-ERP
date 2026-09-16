// Smoke test the LIVE cutover stack through the proxy (:9000).
// Chain: proxy :9000 -> Node SSR (UI) + /api/system -> Java :18081 -> MySQL.
// Protocol: GET /api/system = read bootstrap, POST /api/system = mutation/action.
const BASE = process.env.VNTECH_BASE || 'http://127.0.0.1:9000';
const USER = process.env.VNTECH_USER || 'admin';
const PASS = process.env.VNTECH_PASS || 'Admin123456@';

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

async function post(action, extra = {}, cookie) {
  const res = await fetch(BASE + '/api/system', {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ action, ...extra }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, json, text, setCookies: res.headers.getSetCookie?.() || [] };
}

// --- 1. login ---
const login = await post('login', { username: USER, password: PASS });
const cookie = login.setCookies.map((c) => c.split(';')[0]).join('; ');
say(`[login]     HTTP ${login.status}  ok=${login.json?.ok}  mustChangePassword=${login.json?.mustChangePassword}`);
if (login.status !== 200 || !login.json?.ok) {
  say('LOGIN FAILED -> ' + login.text.slice(0, 300));
  process.exitCode = 1;
} else if (!cookie) {
  say('LOGIN OK but no session cookie returned');
  process.exitCode = 1;
} else {
  // --- 2. bootstrap via GET (read path) ---
  const res = await fetch(BASE + '/api/system', { headers: { cookie } });
  const body = await res.json();
  const d = body.data || {};
  say(`[bootstrap] HTTP ${res.status}  authenticated=${body.authenticated}`);

  const counts = {
    projects: d.projects?.length,
    users: d.users?.length,
    organizationUnits: d.organizationUnits?.length,
    menuGroups: d.menuGroups?.length,
    modules: (d.moduleCatalog ?? d.modules)?.length,
    approvalStages: d.approvalStages?.length,
    // NOTE: the UI (app/page.tsx) reads these exact two names — verify against it, not guesswork.
    departmentModulePermissions: d.departmentModulePermissions?.length,
    systemLevelCatalog: d.systemLevelCatalog?.length,
    auditLogs: d.auditLogs?.length,
    allModulePermissions: d.allModulePermissions?.length,
  };
  say('[bootstrap] ' + JSON.stringify(counts));

  let bad = 0;
  const need = (label, v, min) => {
    const ok = typeof v === 'number' && v >= min;
    if (!ok) bad++;
    say(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(22)} = ${v ?? 'undefined'}  (expect >= ${min})`);
  };
  say('[counts]');
  need('projects', counts.projects, 2);
  need('users', counts.users, 10);
  need('organizationUnits', counts.organizationUnits, 8);
  need('menuGroups', counts.menuGroups, 12);
  need('modules', counts.modules, 61);
  need('approvalStages', counts.approvalStages, 5);
  need('departmentModulePermissions', counts.departmentModulePermissions, 37);
  need('systemLevelCatalog', counts.systemLevelCatalog, 5);
  need('allModulePermissions', counts.allModulePermissions, 1);

  // --- 3. login user identity (proves session -> DB user row) ---
  const u = d.user || {};
  say(`[identity]  ${u.username} / ${u.fullName} / role=${u.role} / dept=${u.department ?? '-'}`);

  // --- 4. UTF-8 integrity on real DB values (mojibake regression guard) ---
  const vi = /[àáảãạăâđêôơưèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;
  const sample = [...(d.organizationUnits || []), ...(d.users || []), ...(d.menuGroups || [])]
    .map((x) => x.name).filter(Boolean);
  const mojibake = sample.filter((s) => /\?\?|Ã|â€|�/.test(s));
  const withVi = sample.filter((s) => vi.test(s));
  const utfOk = mojibake.length === 0 && withVi.length > 0;
  if (!utfOk) bad++;
  say(`  ${utfOk ? 'PASS' : 'FAIL'}  utf8-vietnamese      ${withVi.length} names ok, ${mojibake.length} mojibake` +
      (mojibake.length ? ' -> ' + mojibake.slice(0, 3).join(' | ') : ''));

  // --- 5. no Vietnamese-name loss: menu groups must actually be populated ---
  const named = (d.menuGroups || []).filter((g) => g.name && g.name.trim()).length;
  const namedOk = named === (d.menuGroups || []).length && named >= 12;
  if (!namedOk) bad++;
  say(`  ${namedOk ? 'PASS' : 'FAIL'}  menu group names     ${named}/${(d.menuGroups || []).length} non-empty`);

  say(`\nRESULT: ${bad === 0 ? 'ALL PASS' : bad + ' FAILED'}`);
  process.exitCode = bad === 0 ? 0 : 1;
}
