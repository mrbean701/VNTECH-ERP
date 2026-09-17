#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG TASK-080C: GIAO VIỆC THẬT qua chính action của sản phẩm
//
// Mục đích: `work_items` đang RỖNG. Bảng này KHÔNG được phép nhét tay: chính sản phẩm chặn điều đó
// (`OpsTaskManagementUseCase:64-66` — "Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ
// nguồn. Task từ ERP phải được hệ thống tự sinh."). Vì vậy cổng này dùng ĐÚNG đường thật:
// Trưởng phòng (KH/DA) gọi action `create_work_item` qua cổng 9000, rồi đo lại payload UI nhận.
//
// Cách chạy:  node tools/probe-task080c-work-items.mjs
// (Đổi cổng bằng PROBE_BASE; đổi tài khoản bằng PROBE_MGR_USER/PROBE_MGR_PASS.)
//
// TỰ KIỂM SOÁT (chống "khẳng định rỗng"): cố tình gửi 2 payload SAI và BẮT BUỘC phải bị từ chối —
//   (a) có `sourceId` (việc gắn nghiệp vụ nguồn) ⇒ phải lỗi "Task từ ERP phải được hệ thống tự sinh"
//   (b) `title` rỗng                                                    ⇒ phải lỗi "Cần nhập nội dung công việc"

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const MGR_USER = process.env.PROBE_MGR_USER || "trdademo";
const MGR_PASS = process.env.PROBE_MGR_PASS || "Vntech@2026";
/** Người NHẬN việc — payload lọc thông báo theo chính người đăng nhập nên phải mở phiên riêng. */
const NV_USER = process.env.PROBE_NV_USER || "nvdademo";
const NV_PASS = process.env.PROBE_NV_PASS || "Vntech@2026";
/** Admin — chỉ admin thấy màn "Hộp thư gửi" (`email_outbox`). */
const ADMIN_USER = process.env.PROBE_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.PROBE_ADMIN_PASS || "Admin123456@";

let pass = 0;
let fail = 0;
let gap = 0;
const kq = [];
function check(ten, ok, chiTiet) {
  if (ok) {
    pass++;
    kq.push(`  [DAT ] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
  } else {
    fail++;
    kq.push(`  [HONG] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
  }
}
/** Khoảng trống đã biết của bản Java so với JS — ĐẾM RIÊNG, không trộn vào "ĐẠT/HỎNG". */
function ghiNhan(ten, chiTiet) {
  gap++;
  kq.push(`  [GHI NHẬN – CHƯA PORT] ${ten}${chiTiet ? " :: " + chiTiet : ""}`);
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
    redirect: "manual",
  });
  const jar = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookie = jar.length
    ? jar.map((c) => c.split(";")[0]).join("; ")
    : String(res.headers.get("set-cookie") || "").split(";")[0];
  return { status: res.status, cookie };
}

async function call(cookie, body) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function snapshot(cookie) {
  const res = await fetch(`${BASE}/api/system`, { headers: { Cookie: cookie }, cache: "no-store" });
  const body = await res.json();
  return body.data || body;
}

/**
 * ⚠️ BÀI HỌC (đã trả giá): payload `staffDirectory` **KHÔNG có khoá `username`**
 * (khoá thật: id · employeeCode · fullName · email · role · roleName · department · …).
 * Lượt chạy đầu map theo `username` ⇒ map RỖNG ⇒ mọi `assignedTo` gửi đi là chuỗi rỗng
 * ⇒ hệ thống rơi vào người nhận MẶC ĐỊNH, và phép "tự kiểm soát" trở thành VÔ NGHĨA
 * (nó xanh mà không hề kiểm gì). Nay map theo `fullName` + `employeeCode` và
 * BẮT BUỘC khẳng định tra được id trước khi dùng.
 */
function timTheoNhan(d) {
  const rows = Array.isArray(d.staffDirectory) ? d.staffDirectory : [];
  const byName = new Map();
  const byCode = new Map();
  for (const u of rows) {
    byName.set(String(u.fullName), String(u.id));
    byCode.set(String(u.employeeCode), String(u.id));
  }
  return { byName, byCode };
}

async function main() {
  console.log(`=== PROBE TASK-080C (giao việc thật) — ${BASE} · quản lý: ${MGR_USER} ===\n`);

  const mgr = await login(MGR_USER, MGR_PASS);
  check(`Đăng nhập Trưởng phòng Dự án (${MGR_USER}) HTTP 200`, mgr.status === 200, `HTTP ${mgr.status}`);
  if (!mgr.cookie) {
    console.log(kq.join("\n"));
    console.log("\nKHÔNG CÓ PHIÊN — dừng.");
    process.exitCode = 1;
    return;
  }

  const truoc = await snapshot(mgr.cookie);
  const truocItems = Array.isArray(truoc.workItems) ? truoc.workItems : [];
  const truocTitles = new Set(truocItems.map((r) => String(r.title)));
  const ids = timTheoNhan(truoc);
  console.log(`work_items trước: ${truocItems.length} dòng · staffDirectory=${(truoc.staffDirectory || []).length} người\n`);

  // Người nhận THẬT theo đúng luật của sản phẩm (base_role phải khớp phòng: DA -> 'project'):
  //   nvdademo  = "Nhân viên Dự án E"            (da_nv,   base_role=project)
  //   trdademo  = "Trưởng phòng Dự án C"         (da_truong, base_role=project) — người giao việc
  //   ksda.demo = "Kỹ sư dự án (đề nghị mua)"    (ksda,    base_role=engineer)  — dùng cho phép KIỂM NGƯỢC
  const idNvda = ids.byName.get("Nhân viên Dự án E") || "";
  const idTrda = ids.byName.get("Trưởng phòng Dự án C") || "";
  const idKsda = ids.byName.get("Kỹ sư dự án (đề nghị mua)") || "";
  check("tra được id người nhận THẬT `nvdademo` (Nhân viên Dự án E)", Boolean(idNvda), idNvda);
  check("tra được id người giao/người nhận `trdademo` (Trưởng phòng Dự án C)", Boolean(idTrda), idTrda);
  check("tra được id `ksda.demo` (Kỹ sư dự án) để làm phép KIỂM NGƯỢC", Boolean(idKsda), idKsda);

  // 3 việc THẬT, gắn dự án thật PRJ-DEMO-01 và người nhận thật
  const duAn = (Array.isArray(truoc.projects) ? truoc.projects : []).find((p) => String(p.code) === "PRJ-DEMO-01");
  const duAnId = duAn ? String(duAn.id) : "";
  check("Tìm thấy dự án thật PRJ-DEMO-01", Boolean(duAnId), duAnId || "(khong thay)");

  const keHoach = [
    {
      title: "Rà soát tiến độ nhập kho vật tư PO-PRJ-DEMO-01-2026-0011",
      departmentCode: "DA",
      assignedTo: idNvda,
      priority: "high",
      dueAt: "2026-09-25 17:00:00",
      workGroup: "GIAO_VIEC_BO_SUNG",
      description: "Đối chiếu khối lượng đã nhập với PO và chứng từ giao nhận.",
      projectId: duAnId,
    },
    {
      title: "Kiểm tra chứng chỉ vật tư các phiếu nhập tháng 2",
      departmentCode: "DA",
      assignedTo: idNvda,
      priority: "normal",
      dueAt: "2026-09-28 17:00:00",
      workGroup: "GIAO_VIEC_BO_SUNG",
      description: "Đối chiếu certificate_status của các phiếu nhập với hồ sơ thực tế.",
      projectId: duAnId,
    },
    {
      title: "Đối chiếu chứng từ giao nhận với PO-PRJ-DEMO-01-2026-0010",
      departmentCode: "DA",
      assignedTo: idTrda,
      priority: "normal",
      dueAt: "2026-09-30 17:00:00",
      workGroup: "GIAO_VIEC_BO_SUNG",
      description: "Kiểm tra delivery_note_no và tình trạng hạch toán của phiếu nhập.",
      projectId: duAnId,
    },
  ];

  // ---- 1. Giao việc qua ĐÚNG action của sản phẩm (chạy lại an toàn) ----
  let daTao = 0;
  let daDoiNguoi = 0;
  for (const viec of keHoach) {
    const coSan = truocItems.find((r) => String(r.title) === viec.title);
    if (coSan) {
      kq.push(`  [BO QUA] đã có sẵn: ${viec.title}`);
      // Nếu người nhận hiện tại KHÁC kỳ vọng (dấu vết lượt chạy lỗi trước đó) thì sửa bằng CHÍNH
      // action thật `reassign_work_item` — vừa dọn dữ liệu, vừa kiểm luôn một luồng nữa.
      if (String(coSan.assignedTo || "") !== viec.assignedTo) {
        const rr = await call(mgr.cookie, {
          action: "reassign_work_item",
          workItemId: coSan.id,
          assignedTo: viec.assignedTo,
          reason: "Cổng kiểm chứng TASK-080C: gán lại đúng người nhận của phòng Dự án",
        });
        const okR = rr.status === 200 && /Đã chuyển nhiệm vụ/.test(String(rr.json && rr.json.message));
        check(`… gán lại người nhận cho "${viec.title.slice(0, 38)}…"`, okR, okR ? String(rr.json.message) : `HTTP ${rr.status} · ${JSON.stringify(rr.json).slice(0, 150)}`);
        if (okR) daDoiNguoi++;
      }
      continue;
    }
    const r = await call(mgr.cookie, { action: "create_work_item", ...viec });
    const ok = r.status === 200 && r.json && /Đã giao CV-/.test(String(r.json.message || ""));
    check(`Giao việc "${viec.title.slice(0, 46)}…"`, ok, ok ? String(r.json.message) : `HTTP ${r.status} · ${JSON.stringify(r.json).slice(0, 160)}`);
    if (ok) daTao++;
  }
  console.log(`\nĐã tạo mới: ${daTao} việc · gán lại người nhận: ${daDoiNguoi} · bỏ qua (đã đúng): ${keHoach.length - daTao - daDoiNguoi}\n`);

  // Dọn dấu vết của lượt chạy HỎNG đầu tiên (bài học: map theo `username` ra rỗng ⇒ giao sai người):
  // việc thử đó phải được HUỶ bằng chính action thật `update_work_item_status` + lý do bắt buộc.
  const viecThu = truocItems.find((r) => /phải bị từ chối/.test(String(r.title)) && String(r.status) !== "CANCELLED");
  if (viecThu) {
    const rx = await call(mgr.cookie, {
      action: "update_work_item_status",
      workItemId: viecThu.id,
      status: "CANCELLED",
      reason: "Dữ liệu thử của cổng kiểm chứng TASK-080C (lượt chạy lỗi) — huỷ để không lẫn vào dữ liệu thật",
    });
    check("huỷ được việc thử bằng action thật `update_work_item_status`", rx.status === 200, `HTTP ${rx.status} · ${JSON.stringify(rx.json).slice(0, 140)}`);
  }

  // ---- 1bis. VIỆC "CANARY": tạo mới MỖI LƯỢT CHẠY để đo được bước GỬI THÔNG BÁO (KP #78) ----
  // 3 việc kế hoạch ở trên chỉ tạo một lần (chạy lại thì bỏ qua) nên không thể dùng để đo lại
  // bước gửi thông báo; canary được tạo mới rồi HUỶ bằng action thật khi đo xong ⇒ vừa đo được,
  // vừa không để lại rác.
  const nhan = new Date().toISOString().slice(11, 19);
  const canaryTitle = `[canary ${nhan}] Kiểm chứng gửi thông báo khi giao việc`;
  const canary = await call(mgr.cookie, {
    action: "create_work_item",
    departmentCode: "DA",
    title: canaryTitle,
    assignedTo: idNvda,
    projectId: duAnId,
    priority: "normal",
    dueAt: "2026-10-05 17:00:00",
  });
  const canaryOk = canary.status === 200 && /Đã giao CV-/.test(String((canary.json || {}).message || ""));
  check("tạo việc canary (để đo bước gửi thông báo mỗi lượt chạy)", canaryOk, canaryOk ? String(canary.json.message) : `HTTP ${canary.status} · ${JSON.stringify(canary.json).slice(0, 140)}`);

  // ---- 2. TỰ KIỂM SOÁT: 4 payload SAI phải bị TỪ CHỐI ----
  const sai1 = await call(mgr.cookie, {
    action: "create_work_item",
    departmentCode: "DA",
    title: "Việc gắn nghiệp vụ nguồn (phải bị từ chối)",
    sourceId: "REQ_khong_ton_tai",
    sourceType: "material_request",
    sourceModule: "requests",
  });
  check(
    "[tự kiểm soát] việc có `sourceId` PHẢI bị từ chối (luật: task ERP do hệ thống tự sinh)",
    /tự sinh/i.test(JSON.stringify(sai1.json || {})),
    JSON.stringify(sai1.json || {}).slice(0, 150)
  );
  const sai2 = await call(mgr.cookie, { action: "create_work_item", departmentCode: "DA", title: "" });
  check(
    "[tự kiểm soát] việc thiếu nội dung PHẢI bị từ chối",
    /nội dung công việc/i.test(JSON.stringify(sai2.json || {})),
    JSON.stringify(sai2.json || {}).slice(0, 150)
  );
  const sai3 = await call(mgr.cookie, { action: "create_work_item", departmentCode: "XX", title: "Phòng ban sai" });
  check("[tự kiểm soát] phòng ban ngoài KH/DA PHẢI bị từ chối", /Phòng ban không hợp lệ/i.test(JSON.stringify(sai3.json || {})), JSON.stringify(sai3.json || {}).slice(0, 150));
  // Quy tắc JS `system-route.mjs:251`: người nhận phải có base_role khớp phòng (DA -> 'project').
  // `ksda.demo` là Kỹ sư dự án (base_role='engineer') và CÓ phạm vi dự án ⇒ phải bị từ chối vì SAI PHÒNG,
  // chứ không phải vì thiếu phạm vi — đây là phép kiểm chứng minh luật đã được port đúng nguồn dữ liệu.
  const sai4 = await call(mgr.cookie, {
    action: "create_work_item",
    departmentCode: "DA",
    title: "Giao cho người ngoài phòng (phải bị từ chối)",
    assignedTo: idKsda,
    projectId: duAnId,
  });
  check(
    "[tự kiểm soát] giao cho người KHÁC phòng (base_role=engineer) PHẢI bị từ chối",
    /Chưa có nhân sự/i.test(JSON.stringify(sai4.json || {})),
    JSON.stringify(sai4.json || {}).slice(0, 170)
  );

  // ---- 3. ĐO LẠI: payload UI nhận phải có việc thật, đúng người nhận, đúng dự án ----
  const sau = await snapshot(mgr.cookie);
  const items = Array.isArray(sau.workItems) ? sau.workItems : [];
  check("work_items KHÔNG còn rỗng (trước: " + truocItems.length + ")", items.length > truocItems.length || truocItems.length > 0, `${truocItems.length} → ${items.length} dòng`);

  for (const viec of keHoach) {
    const row = items.find((r) => String(r.title) === viec.title);
    check(
      `payload có việc: "${viec.title.slice(0, 40)}…"`,
      Boolean(row),
      row ? `taskNo=${row.taskNo} · status=${row.status} · department=${row.departmentCode}` : "(khong thay)"
    );
    if (row) {
      check(
        `… gắn ĐÚNG người nhận thật (${viec.assignedTo || "?"})`,
        String(row.assignedTo || "") === viec.assignedTo,
        `assignedTo=${row.assignedTo}`
      );
      check(`… gắn ĐÚNG dự án PRJ-DEMO-01`, String(row.projectId || "") === duAnId, `projectId=${row.projectId}`);
      check(`… có mã việc do hệ thống sinh (CV-DA-…)`, /^CV-DA-/.test(String(row.taskNo || "")), String(row.taskNo));
    }
  }

  // ---- 4. BƯỚC GỬI THÔNG BÁO / EMAIL (KP #78) — JS `system-route.mjs:261-267`, đo bằng canary ----
  // ⚠️ Payload lọc thông báo theo CHÍNH người đang đăng nhập (`WHERE n.user_id=?`) nên phiên của
  // Trưởng phòng KHÔNG thấy thông báo của nhân viên — phải mở PHIÊN CỦA NGƯỜI NHẬN để đo cho đúng.
  const nv = await login(NV_USER, NV_PASS);
  const payloadNv = await snapshot(nv.cookie);
  const tb = Array.isArray(payloadNv.taskNotifications) ? payloadNv.taskNotifications : [];
  const tbCanary = tb.find((n) => String(n.title || "").includes(canaryTitle));
  check(
    "người nhận TỰ THẤY thông báo việc mới trong ứng dụng",
    Boolean(tbCanary),
    tbCanary
      ? `title="${String(tbCanary.title).slice(0, 56)}" · status=${tbCanary.status}`
      : `${tb.length} thông báo của phiên ${NV_USER} nhưng KHÔNG có bản ghi cho canary`
  );
  if (tbCanary) {
    check("thông báo ở trạng thái đã gửi (SENT)", String(tbCanary.status) === "SENT", `status=${tbCanary.status}`);
  }
  // Hàng đợi email nằm ở màn "Hộp thư gửi" (admin) — đo bằng phiên admin.
  const adm = await login(ADMIN_USER, ADMIN_PASS);
  const payloadAdm = await snapshot(adm.cookie);
  const hopThu = Array.isArray(payloadAdm.emailOutbox) ? payloadAdm.emailOutbox : [];
  const mailCanary = hopThu.find((m) => String(m.subject || "").includes(canaryTitle));
  check(
    "việc giao cho người CÓ email ⇒ xếp 1 thư vào `email_outbox` (status=queued)",
    Boolean(mailCanary),
    mailCanary
      ? `subject="${String(mailCanary.subject).slice(0, 55)}" · status=${mailCanary.status}`
      : `${hopThu.length} thư trong hàng đợi, không có thư cho canary`
  );
  const events = Array.isArray(sau.workItemEvents) ? sau.workItemEvents : [];
  const eventAssigned = events.filter((e) => String(e.eventType) === "ASSIGNED");
  check(
    "mỗi lần giao việc có 1 sự kiện `ASSIGNED` trong lịch sử",
    eventAssigned.length > 0,
    `${eventAssigned.length}/${events.length} sự kiện là ASSIGNED`
  );
  if (hopThu.length) {
    ghiNhan(
      `Hàng đợi email đang có ${hopThu.length} thư — cần bật cấu hình email để gửi thật`,
      "cổng chỉ kiểm việc XẾP THƯ vào hàng đợi (đúng luồng), KHÔNG kiểm việc gửi ra ngoài"
    );
  }

  // Dọn canary bằng CHÍNH action thật (không xoá tay) sau khi đã đo xong.
  const canaryRow = items.find((r) => String(r.title) === canaryTitle);
  if (canaryRow) {
    const rx = await call(mgr.cookie, {
      action: "update_work_item_status",
      workItemId: canaryRow.id,
      status: "CANCELLED",
      reason: "Việc canary của cổng kiểm chứng TASK-080C — đã đo xong bước gửi thông báo",
    });
    check("dọn việc canary bằng action thật `update_work_item_status`", rx.status === 200, `HTTP ${rx.status}`);
  }

  console.log(kq.join("\n"));
  console.log(`\n=== KẾT QUẢ: ${pass}/${pass + fail} ĐẠT · ${fail} HỎNG · ${gap} KHOẢNG TRỐNG ĐÃ GHI NHẬN ===`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error("PROBE LOI:", e && e.message ? e.message : e);
  process.exitCode = 2;
});
