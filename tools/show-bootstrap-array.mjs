// In cấu trúc một mảng trong payload bootstrap (nguồn: đường chạy thật của UI).
// Dùng để biết CHÍNH XÁC tên trường trước khi viết mã — không đoán trường.
//
// Chạy: node tools/show-bootstrap-array.mjs <tên-mảng> [base] [chỉ-số-dòng] [lọcTrường=giáTrị]
// Ví dụ: node tools/show-bootstrap-array.mjs requests
const NAME = process.argv[2];
const BASE = process.argv[3] || "http://127.0.0.1:9000";
const ROW = Number(process.argv[4] || 0);

if (!NAME) { console.error("Thiếu tên mảng. Ví dụ: node tools/show-bootstrap-array.mjs requests"); process.exit(1); }

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
const d = (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data;

const arr = d[NAME];
if (!Array.isArray(arr)) {
  console.error(`Không thấy mảng '${NAME}'. Các mảng có sẵn: ${Object.keys(d).filter((k) => Array.isArray(d[k])).join(", ")}`);
  process.exit(1);
}

console.log(`data.${NAME}: ${arr.length} phần tử\n`);
if (!arr.length) process.exit(0);

const item = arr[Math.min(ROW, arr.length - 1)];
console.log(`=== Trường của phần tử [${Math.min(ROW, arr.length - 1)}] ===`);
for (const k of Object.keys(item)) {
  const v = item[k];
  const kind = Array.isArray(v) ? `mảng ${v.length}` : v === null ? "null" : typeof v;
  const show = Array.isArray(v) ? "" : ` = ${String(v).slice(0, 90)}`;
  console.log(`  ${k.padEnd(26)} ${kind}${show}`);
}

// Nếu có mảng con (vd requests[].approvals) thì in luôn cấu trúc phần tử đầu của nó.
for (const k of Object.keys(item)) {
  if (!Array.isArray(item[k]) || !item[k].length) continue;
  console.log(`\n=== Trường của ${NAME}[].${k}[0] ===`);
  for (const kk of Object.keys(item[k][0])) {
    const v = item[k][0][kk];
    const kind = Array.isArray(v) ? `mảng ${v.length}` : v === null ? "null" : typeof v;
    console.log(`  ${kk.padEnd(24)} ${kind}${Array.isArray(v) ? "" : ` = ${String(v).slice(0, 80)}`}`);
  }
}
