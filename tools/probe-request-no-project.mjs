// TASK-137 / TASK-141 — kiểm chứng: LẬP PHIẾU ĐỀ NGHỊ KHI KHÔNG CHỌN DỰ ÁN / HỢP ĐỒNG / BOQ / KHO
//   node tools/probe-request-no-project.mjs
//
// TASK-141 NÂNG CẤP PROBE — bản cũ chỉ kiểm `create_request` trả HTTP 200, nên KHÔNG phát hiện được
// lỗi INNER JOIN `projects`: phiếu tạo thành công nhưng **BIẾN MẤT** khỏi `data.requests` và
// KHÔNG mở/duyệt được. Probe nay kiểm CẢ 3 điều:
//   (1) tạo phiếu không-dự-án ⇒ HTTP 200;
//   (2) `GET /api/system` ⇒ phiếu đó **CÓ** trong `data.requests` (khớp theo `purpose`/`requestNo`);
//   (3) phiếu có `projectId` RỖNG/NULL + `approvals` (hàng đợi phê duyệt dùng chính dữ liệu này để
//       mở phiếu ra duyệt) + nằm ở bước duyệt hiện tại (mặc định 2 = sau bước 1 tự xác nhận khi gửi).
// Lưu ý: bootstrap phải GET /api/system (kèm cookie) — POST action=bootstrap trả 403.
const BASE = process.env.BASE || "http://127.0.0.1:9000";
const USER = process.env.U || "ksda.demo";
const PASS = process.env.P || "Vntech@2026";
// Bước duyệt hiện tại mà phiếu mới phải nằm ở đó (bước 1 «CHT xác nhận nhu cầu» tự xác nhận khi gửi).
const EXPECT_STAGE = Number(process.env.EXPECT_STAGE || 2);
// Bỏ qua kiểm tên bước (một số môi trường chưa seed `approval_stage_catalog`) — mặc định vẫn kiểm.
const REQUIRE_STAGE_NAME = process.env.REQUIRE_STAGE_NAME !== "0";

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

async function bootstrap(cookie) {
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie } });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, text, data: json?.data || {}, json };
}

const out = (k, v) => console.log(`  ${String(k).padEnd(44)}: ${v}`);
const checks = [];
const check = (ok, label, detail) => {
  checks.push({ ok, label, detail });
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
};
const clean = (v) => (v === null || v === undefined ? "" : String(v).trim());

// 1) đăng nhập
const lg = await login(USER, PASS);
out("1. login HTTP", `${lg.status} (${USER})`);
if (!lg.ok || !lg.cookie) {
  console.log("  ✗ không đăng nhập được — dừng");
  process.exitCode = 1;
} else {
  // 2) GET /api/system để lấy vật tư + baseline danh sách phiếu TRƯỚC khi tạo
  const boot0 = await bootstrap(lg.cookie);
  const materials = boot0.data?.materials || [];
  out("2. GET /api/system HTTP", boot0.status);
  out("   số vật tư trong bootstrap", materials.length);
  out("   số phiếu TRƯỚC khi tạo", (boot0.data?.requests || []).length);
  const envId = process.env.MATERIAL_ID || "";
  const envCode = process.env.MATERIAL_CODE || "(env)";
  const m = materials.length
    ? { id: materials[0].id, code: materials[0].code, name: materials[0].name, unit: materials[0].unit }
    : { id: envId, code: envCode, name: envCode, unit: "" };
  if (!m.id) {
    console.log("  ✗ không có vật tư (bootstrap rỗng và chưa truyền MATERIAL_ID) — dừng");
    process.exitCode = 1;
  } else {
    out("   dùng vật tư", `${m.code} · ${m.name}`);

    // 3) TẠO PHIẾU — CỐ Ý ĐỂ TRỐNG dự án / hợp đồng / BOQ / kho
    const today = new Date().toISOString().slice(0, 10);
    const purpose = `Kiem chung TASK-141: lap phieu khong du an ${Date.now()}`;
    const payload = {
      projectId: "",          // ← TRỐNG (yêu cầu người dùng)
      contractId: "",         // ← TRỐNG
      boqVersionId: "",       // ← TRỐNG
      sourceWarehouseId: "",  // ← TRỐNG
      neededAt: today,
      area: "Kiem chung TASK-141",
      priority: "normal",
      purpose,
      lines: [{
        materialId: m.id, materialCode: m.code, materialName: m.name,
        unit: m.unit, quantity: 1, note: "TASK-141",
      }],
    };
    const cr = await call(lg.cookie, "create_request", payload);
    out("3. create_request HTTP", cr.status);
    out("   phản hồi", (cr.text || "").slice(0, 200));
    check(cr.status === 200, "TẠO ĐƯỢC phiếu khi bỏ trống dự án/HĐ/BOQ/kho", `HTTP ${cr.status}`);
    const requestNo = (cr.text || "").match(/DNMH-[A-Z0-9]+-\d{4}-\d{4}/)?.[0] || "";

    if (cr.status === 200) {
      // 4) BOOTSTRAP LẦN 2 — phiếu PHẢI XUẤT HIỆN trong data.requests (lỗi INNER JOIN đã sửa)
      const boot1 = await bootstrap(lg.cookie);
      const requests = boot1.data?.requests || [];
      out("4. GET /api/system (lần 2) HTTP", boot1.status);
      out("   số phiếu TRONG danh sách", requests.length);
      const row = requests.find((r) => clean(r.purpose) === purpose)
        || (requestNo ? requests.find((r) => clean(r.requestNo) === requestNo) : null)
        || null;
      check(!!row, "PHIẾU KHÔNG-DỰ-ÁN CÓ trong data.requests (không còn biến mất)",
        row ? `${clean(row.requestNo)} · id=${clean(row.id)}` : `KHÔNG thấy phiếu (danh sách ${requests.length} dòng)`);
      if (row) {
        out("   requestNo / id", `${clean(row.requestNo)} · ${clean(row.id)}`);
        out("   projectId / projectCode / projectName",
          `"${clean(row.projectId)}" / "${clean(row.projectCode)}" / "${clean(row.projectName)}"`);
        out("   status / approvalStage", `${clean(row.status)} / ${clean(row.approvalStage)}`);
        check(clean(row.projectId) === "", "projectId của phiếu là RỖNG/NULL", `"${clean(row.projectId)}"`);
        check(Number(row.approvalStage) === EXPECT_STAGE,
          `phiếu nằm ở bước duyệt ${EXPECT_STAGE}`, `approvalStage=${clean(row.approvalStage)}`);
        // Hàng đợi phê duyệt của UI đọc CHÍNH `approvals` này để mở phiếu ra duyệt.
        const approvalRows = Array.isArray(row.approvals) ? row.approvals : [];
        out("   số bước duyệt (approvals)", approvalRows.length);
        check(approvalRows.length > 0, "phiếu có dữ liệu bước duyệt để MỞ RA DUYỆT",
          approvalRows.map((a) => `bước ${clean(a.stage)}:${clean(a.status)}`).join(", ") || "không có");
        const current = approvalRows.find((a) => Number(a.stage) === Number(row.approvalStage));
        if (current) out("   bước hiện tại", `${clean(current.department) || clean(current.stage)} / ${clean(current.status)}`);
        if (REQUIRE_STAGE_NAME && current) {
          check(!!clean(current.department), "bước hiện tại có tên bước (UI hiển thị được)",
            clean(current.department) || "(rỗng)");
        }
        check(!/^DNMH--/.test(clean(row.requestNo)), "mã phiếu không rỗng tiền tố dự án (DNMH-CTY-…)",
          clean(row.requestNo));
      }
    } else {
      check(false, "BỎ QUA kiểm danh sách/mở duyệt vì tạo phiếu thất bại", "");
    }

    const failed = checks.filter((c) => !c.ok);
    console.log(`\n  TỔNG KẾT: ${checks.length - failed.length}/${checks.length} kiểm tra ĐẠT`);
    if (failed.length) {
      console.log("  ❌ KẾT LUẬN: TÍNH NĂNG PHIẾU KHÔNG THUỘC DỰ ÁN CHƯA HOẠT ĐỘNG — xem mục ❌ ở trên:");
      for (const f of failed) console.log(`     · ${f.label}${f.detail ? ` — ${f.detail}` : ""}`);
    } else {
      console.log("  ✅ KẾT LUẬN: LẬP ĐƯỢC + THẤY TRONG DANH SÁCH + MỞ ĐƯỢC ĐỂ DUYỆT khi KHÔNG chọn dự án/HĐ/BOQ/kho");
    }
    process.exitCode = failed.length ? 2 : 0;
  }
}
