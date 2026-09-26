#!/usr/bin/env node
/**
 * Kiểm chứng đường đi THẬT của trình duyệt qua proxy: login → lấy cookie → bootstrap.
 * Node fetch xử lý Set-Cookie chính xác, tránh lỗi cắt chuỗi của PowerShell.
 */
const BASE = process.argv[2] || "http://127.0.0.1:9000";

async function main() {
  console.log(`→ Kiểm chứng qua: ${BASE}\n`);

  // 1) Trang chủ (UI do Node phục vụ)
  const ui = await fetch(`${BASE}/`);
  const html = await ui.text();
  const backend = ui.headers.get("x-vntech-product-id") || "(none)";
  console.log(`1) UI trang chủ       : HTTP ${ui.status} · ${(html.length / 1024).toFixed(1)} KB · có <title>=${html.includes("<title>")}`);

  // 2) Xác định API do ai phục vụ
  const health = await fetch(`${BASE}/api/health`);
  const hj = await health.json().catch(() => null);
  console.log(`2) /api/health        : HTTP ${health.status} · backend=${hj?.backend ?? "?"}  ← phải là java-clean-arch`);

  // 3) Login
  const login = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username: "admin", password: "Vntech@2026" }),
  });
  const lj = await login.json().catch(() => null);
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  console.log(`3) login              : HTTP ${login.status} · ok=${lj?.ok} · cookie=${cookie ? "có" : "KHÔNG"}`);

  if (!cookie) { console.log("\n❌ không nhận được cookie — dừng"); process.exit(1); }

  // 4) Bootstrap bằng session (2 tầng: UI lấy dữ liệu để render)
  const boot = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } });
  const bj = await boot.json().catch(() => null);
  console.log(`4) bootstrap          : HTTP ${boot.status} · ok=${bj?.ok} · authenticated=${bj?.authenticated}`);
  if (boot.status === 200 && bj?.data) {
    const d = bj.data;
    console.log(`   user               : ${d.user?.username} · ${d.user?.role}`);
    console.log(`   công ty            : ${d.settings?.companyName?.slice(0, 46) ?? "?"}`);
    console.log(`   KHO                : warehouses=${(d.warehouses || []).length} · projects=${(d.projects || []).length} · materials=${(d.materials || []).length}`);
    console.log(`   DANH MỤC HỆ THỐNG  : approvalStages=${(d.approvalStageCatalog || []).length} · roles=${(d.roleCatalog || []).length}`);
    console.log(`   nhóm dữ liệu       : ${Object.keys(d).length} khóa`);
  }

  // 5) Kiểm tra ghi dữ liệu qua proxy (tạo dự án thật để UI có nội dung)
  const mk = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "create_project", code: "DA-MAU-01",
      name: "Dự án mẫu kiểm chứng cutover",
      status: "active", startDate: "2026-01-01", plannedEndDate: "2026-12-31",
    }),
  });
  const mj = await mk.json().catch(() => null);
  console.log(`5) create_project     : HTTP ${mk.status} · ${mk.status === 200 ? "tạo được dữ liệu qua Java" : (mj?.error || "").slice(0, 90)}`);

  const boot2 = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie } });
  const b2 = await boot2.json().catch(() => null);
  console.log(`6) bootstrap lại      : projects=${(b2?.data?.projects || []).length} · warehouses=${(b2?.data?.warehouses || []).length}`);

  const ok = ui.status === 200 && hj?.backend === "java-clean-arch"
    && login.status === 200 && boot.status === 200;
  console.log(`\n===== KẾT LUẬN: ${ok ? "PHƯƠNG ÁN A HOẠT ĐỘNG ✅" : "CÒN LỖI ❌"} =====`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error("Lỗi:", e.message); process.exit(1); });
