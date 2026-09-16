// Liệt kê TẤT CẢ khóa top-level của bootstrap + số dòng, để biết dữ liệu nào dùng được.
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const login = await fetch(BASE + "/api/system", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const d = (await (await fetch(BASE + "/api/system", { headers: { cookie } })).json()).data || {};

const rows = Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v.length : (v === null ? -1 : 0)]);
rows.sort((a, b) => (b[1] || 0) - (a[1] || 0) || a[0].localeCompare(b[0]));
console.log("KHÓA".padEnd(38) + "SỐ DÒNG");
for (const [k, n] of rows) console.log(k.padEnd(38) + (n < 0 ? "null" : n));

// mẫu các mảng chứng từ liên quan kho/dự án
for (const k of ["requests", "purchaseOrders", "receipts", "issues", "returns", "stockCounts", "deliveries", "workItems"]) {
  if (Array.isArray(d[k]) && d[k].length) {
    console.log(`\n=== ${k}[0] ===`);
    console.log(JSON.stringify(d[k][0]).slice(0, 420));
  }
}
