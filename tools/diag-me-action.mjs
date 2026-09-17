// Chẩn đoán: gọi action=me bằng vài tài khoản và in NGUYÊN VĂN phản hồi (status + body).
const BASE = process.argv[2] || "http://127.0.0.1:18081";
const ACCOUNTS = [["admin", "Admin123456@"], ["thukydemo", "Vntech@2026"], ["ksda.demo", "Vntech@2026"]];

async function call(path, body, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const text = await res.text();
  const setCookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, text, setCookie };
}

for (const [username, password] of ACCOUNTS) {
  console.log(`\n===== ${username} =====`);
  const login = await call("/api/system", { action: "login", username, password });
  console.log(`login : HTTP ${login.status} · cookie=${login.setCookie ? "co" : "khong"} · ${login.text.slice(0, 120)}`);

  const me = await call("/api/system", { action: "me" }, login.setCookie);
  console.log(`me    : HTTP ${me.status}`);
  console.log(`        ${me.text.slice(0, 600)}`);

  // Thu them bootstrap neu me bi chan
  if (me.status !== 200) {
    const boot = await call("/api/system", { action: "bootstrap" }, login.setCookie);
    console.log(`boot  : HTTP ${boot.status} · ${boot.text.slice(0, 200)}`);
  }
}
process.exit(0);
