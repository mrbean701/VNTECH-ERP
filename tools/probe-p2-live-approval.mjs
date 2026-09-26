#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · NGHIỆM THU **TRÊN ĐƯỜNG LIVE** luồng phê duyệt động
//
// MỤC ĐÍCH: chứng minh bằng HTTP THẬT (không suy đoán từ mã nguồn) rằng 4 việc của PHASE 2 đã
// có hiệu lực trên hệ thống ĐANG CHẠY:
//   (1) ĐĂNG NHẬP ≥2 tài khoản vai trò KHÁC NHAU qua chính cơ chế login của ứng dụng.
//   (2) `POST create_request` bằng tài khoản vai trò KHÁC ⇒ **KHÔNG còn 403**.
//       Trước đây `RequestManagementUseCase.java:63` chốt cứng `List.of("engineer","commander","admin")`
//       ⇒ mọi vai trò khác (kh_nv, thuky, thu_kho, accountant…) bị 403 dù có quyền `requests.canCreate`.
//   (3) LUẬT «NGƯỜI TẠO KHÔNG TỰ DUYỆT»: người lập phiếu trùng vai trò duyệt của một bước thì bước đó
//       bị MIỄN (status='approved', source='creator_role_waived') và bước chờ kế tiếp nhảy sang vai trò kế.
//   (4) CỘT `result` trên audit_logs: gọi hành động nghiệp vụ ⇒ đọc lại `audit_logs.result` qua API + DB.
//
// ĐƯỜNG ĐO (LIVE):  :9000 (proxy) ──/api/*──> :18081 (jar Java) ──> MySQL `vntech_erp`
//   BASE mặc định = http://127.0.0.1:9000  (đổi bằng VNTECH_BASE)
//   Kiểm chéo trực tiếp :18081 bằng VNTECH_API_DIRECT để chứng minh proxy chỉ là ống dẫn tới CÙNG engine.
//
// CÁCH LẤY PHIÊN (ghi rõ theo yêu cầu): KHÔNG đoán mật khẩu. Script dùng CHÍNH action `login` của
//   ứng dụng (`POST /api/system {action:"login"}`) rồi lấy cookie phiên từ header `Set-Cookie`.
//   Bộ tài khoản/mật khẩu lấy từ bộ probe live ĐÃ CÓ SẴN trong repo (`tools/probe-live-rolebase.mjs`
//   dòng 9-20 + `tools/probe-live-stack.mjs`): admin = `Admin123456@`, tài khoản demo = `Vntech@2026`.
//   Vai trò/`roleBase` của phiên được XÁC NHẬN lại bằng GET bootstrap (`data.user`) chứ không tin nhãn.
//
// CHỈ GHI 1 LOẠI DỮ LIỆU: các bản ghi phiếu đề nghị do chính script tạo (`create_request`) + nhật ký
//   kiểm toán kèm theo. Không UPDATE/DELETE bản ghi nghiệp vụ nào; phần đọc MySQL mở phiên
//   `SET SESSION TRANSACTION READ ONLY`.
//
// exit 0 = CẢ 4 PHÉP ĐO ĐẠT · exit 1 = có phép đo KHÔNG ĐẠT · exit 2 = BLOCKED (không đăng nhập / không gọi được API)

import { execFileSync } from "node:child_process";

const BASE = process.env.VNTECH_BASE || "http://127.0.0.1:9000";
const API_DIRECT = process.env.VNTECH_API_DIRECT || "http://127.0.0.1:18081";
const PROJECT_ID = process.env.VNTECH_PROJECT_ID || "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";
const MATERIAL_ID = process.env.VNTECH_MATERIAL_ID || "MAT_082196e5-02d0-45c5-84c2-eb2d0668566b";
const MYSQL = process.env.MYSQL_BIN || "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const DB = process.env.MYSQL_DB || "vntech_erp";

// Danh sách chốt cứng CŨ đã bị BỎ ở `RequestManagementUseCase.java` — dùng làm mốc "trước/sau".
const OLD_HARDCODED = ["engineer", "commander", "admin"];

// 3 tài khoản, 3 VAI TRÒ KHÁC NHAU (≥2 là yêu cầu tối thiểu):
//   nvkhdemo  · role kh_nv  → roleBase procurement  ← KHÔNG thuộc danh sách chốt cứng cũ ⇒ trước đây 403
//   thukydemo · role thuky  → roleBase director     ← KHÔNG thuộc danh sách chốt cứng cũ ⇒ trước đây 403
//   ksda.demo · role ksda   → roleBase engineer     ← ĐỐI CHỨNG: vẫn tạo được (trước đây cũng được)
// ⚠️ MT2-P14-03c (23/09/2026) — BỔ SUNG tài khoản theo SỐ ĐO LIVE (⛔ không đoán): đo bằng chính action `login`
// rồi đọc `data.user` ⇒ ksda.demo=ksda/engineer · nvdademo=da_nv/project · nvkhdemo=kh_nv/procurement ·
// trdademo=da_truong/project · tkhodemo=thu_kho/warehouse · engineer.demo=ksda/engineer · **thukydemo=401** (mật khẩu lệch theo seed).
const ACCOUNTS = [
  { username: "nvkhdemo", password: "Vntech@2026", nhan: "Nhân viên Kế hoạch", expectBase: "procurement" },
  { username: "thukydemo", password: "Vntech@2026", nhan: "Thư ký Tổng giám đốc", expectBase: "director" },
  { username: "ksda.demo", password: "Vntech@2026", nhan: "Kỹ sư dự án", expectBase: "engineer" },
  { username: "trdademo", password: "Vntech@2026", nhan: "Trưởng phòng Dự án", expectBase: "project" },
  { username: "tkhodemo", password: "Vntech@2026", nhan: "Thủ kho", expectBase: "warehouse" },
];
const ADMIN = { username: "admin", password: "Admin123456@" };

let soDat = 0;
let soHong = 0;
let blocked = null;

function tieuDe(t) {
  console.log(`\n${"═".repeat(100)}\n${t}\n${"═".repeat(100)}`);
}
function dat(nhan, ok, chiTiet) {
  if (ok) soDat++; else soHong++;
  console.log(`  [${ok ? "ĐẠT" : "HỎNG"}] ${nhan}`);
  if (chiTiet) console.log(`         ${chiTiet}`);
}
/** In NGUYÊN VĂN thân request/response — yêu cầu "dán request/response THẬT". */
function inRaw(nhan, body) {
  const s = typeof body === "string" ? body : JSON.stringify(body);
  console.log(`  ${nhan}: ${s}`);
}

async function post(path, action, extra, cookie) {
  const body = JSON.stringify({ action, ...extra });
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8", ...(cookie ? { cookie } : {}) },
    body,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* giữ raw */ }
  const setCookies = res.headers.getSetCookie?.() || [];
  return { http: res.status, json, text, cookie: setCookies.map((c) => c.split(";")[0]).join("; "), body };
}

async function getBootstrap(cookie) {
  const res = await fetch(BASE + "/api/system", { headers: cookie ? { cookie } : {} });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* raw */ }
  return { http: res.status, json, text };
}

/** Truy vấn MySQL CHỈ ĐỌC. Trả về mảng dòng (mảng giá trị). */
function sql(cau) {
  const out = execFileSync(
    MYSQL,
    ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", DB, "-N", "-B", "-e",
      `SET SESSION TRANSACTION READ ONLY; ${cau}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (/\bERROR\s+\d+\s*\(/.test(out)) throw new Error(`MySQL từ chối: ${cau}\n${out}`);
  return out.split(/\r?\n/).filter((l) => l.trim() !== "").map((l) => l.split("\t"));
}

const NHAN_TAO = `Nghiệm thu PHASE 2 (probe-p2-live-approval) — vai trò khác chốt cứng cũ`;

/** Payload create_request tối thiểu hợp lệ: dòng Ngoài HĐ/Phát sinh (không phụ thuộc dòng BOQ). */
function payloadCreateRequest(ghiChu) {
  return {
    projectId: PROJECT_ID,
    neededAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    area: "Khu vực nghiệm thu PHASE 2",
    priority: "normal",
    lines: [{
      materialId: MATERIAL_ID,
      quantity: 1,
      itemType: "outside_contract",
      note: ghiChu,
    }],
  };
}

async function main() {
  console.log("PHASE 2 — NGHIỆM THU LIVE: luồng phê duyệt động + cột audit_logs.result");
  console.log(`Cổng đo (LIVE)     : ${BASE}`);
  console.log(`Kiểm chéo engine   : ${API_DIRECT}`);
  console.log(`Dự án đo           : ${PROJECT_ID}`);
  console.log(`Vật tư đo          : ${MATERIAL_ID}`);

  // ══════════════════════════════════════════════════════════════════════════════════════
  tieuDe("[1] ĐĂNG NHẬP ≥2 TÀI KHOẢN VAI TRÒ KHÁC NHAU — qua chính action `login` của ứng dụng");
  // ══════════════════════════════════════════════════════════════════════════════════════
  const phien = [];
  // ⚠️ MT2-P14-03c (23/09/2026): tài khoản demo có thể LỆCH MẬT KHẨU theo môi trường seed
  // (đo: `thukydemo` trả 401 trong khi **6/7** tài khoản demo khác đăng nhập HTTP 200) ⇒ bản cũ `break` ngay
  // làm probe DỪNG dù vẫn đủ tài khoản khác. Nay: BỎ QUA tài khoản hỏng, chỉ chặn khi **< 2 phiên** thành công.
  const hong = [];
  for (const acc of ACCOUNTS) {
    const login = await post("/api/system", "login", { username: acc.username, password: acc.password });
    inRaw(`POST login(${acc.username}) → HTTP ${login.http}`, login.text);
    if (login.http !== 200 || !login.json?.ok || !login.cookie) {
      hong.push(`${acc.username} (HTTP ${login.http})`);
      console.log(`         ⚠ BỎ QUA \`${acc.username}\`: đăng nhập không được — HTTP ${login.http} (⛔ không phải lỗi sản phẩm: action login từ chối đúng khi sai mật khẩu)`);
      continue;
    }
    // Xác nhận phiên là DÒNG USER THẬT trong CSDL (không tin nhãn trong tệp cấu hình).
    const boot = await getBootstrap(login.cookie);
    const u = boot.json?.data?.user || {};
    console.log(`         → bootstrap HTTP ${boot.http} · user=${u.username} role=${u.role} roleBase=${u.roleBase} ` +
      `dept=${u.department ?? "-"}`);
    const thuocChotCu = OLD_HARDCODED.includes(String(u.role)) || OLD_HARDCODED.includes(String(u.roleBase));
    phien.push({ ...acc, cookie: login.cookie, role: u.role, roleBase: u.roleBase, userId: u.id, thuocChotCu });
  }
  if (phien.length < 2) {
    blocked = `chỉ đăng nhập được ${phien.length} tài khoản (cần ≥2 để đo luồng phê duyệt theo vai trò)` +
      (hong.length ? ` · tài khoản hỏng: ${hong.join(", ")}` : "");
  } else if (hong.length) {
    console.log(`\n  [GHI NHẬN] có ${hong.length} tài khoản demo không đăng nhập được (${hong.join(", ")}) — ⛔ KHÔNG chặn probe vì đã đủ ≥2 phiên vai trò khác nhau.`);
  }
  if (blocked) {
    console.log(`\n  [BLOCKED] ${blocked}`);
    return 2;
  }
  dat(`Đăng nhập ${phien.length} tài khoản, ${new Set(phien.map((p) => p.role)).size} vai trò KHÁC NHAU`,
    phien.length >= 2 && new Set(phien.map((p) => p.role)).size >= 2,
    phien.map((p) => `${p.username}=${p.role}/${p.roleBase}${p.thuocChotCu ? " (thuộc chốt cứng cũ)" : " (NGOÀI chốt cứng cũ)"}`).join(" · "));

  // ══════════════════════════════════════════════════════════════════════════════════════
  tieuDe("[2] `POST create_request` BẰNG VAI TRÒ KHÁC — chứng minh KHÔNG còn 403");
  // ══════════════════════════════════════════════════════════════════════════════════════
  console.log(`  Mốc đối chiếu: danh sách chốt cứng CŨ = ${JSON.stringify(OLD_HARDCODED)} ` +
    "(mọi vai trò ngoài danh sách này từng bị 403 tại RequestManagementUseCase.java:63)");
  const daTao = [];
  for (const p of phien) {
    const payload = payloadCreateRequest(`${NHAN_TAO} · người lập ${p.username} (${p.role})`);
    inRaw(`REQUEST create_request (${p.username} · ${p.role})`, payload);
    const res = await post("/api/system", "create_request", payload, p.cookie);
    inRaw(`RESPONSE create_request (${p.username} · ${p.role}) → HTTP ${res.http}`, res.text);
    const ok = res.http === 200 && res.json?.ok === true;
    dat(`create_request bằng \`${p.username}\` (vai trò ${p.role}${p.thuocChotCu ? " — trong chốt cũ" : " — NGOÀI chốt cũ"}) ⇒ HTTP ${res.http}`,
      ok, ok ? String(res.json?.message || "") : `KHÔNG ĐẠT: ${res.text.slice(0, 250)}`);
    if (ok) {
      const m = /DNMH-[A-Z0-9\-]+/i.exec(String(res.json?.message || ""));
      daTao.push({ ...p, requestNo: m ? m[0] : "(không đọc được số phiếu)", http: res.http, message: res.json?.message });
    }
  }
  if (daTao.length === 0) {
    blocked = "đăng nhập được nhưng KHÔNG tài khoản nào tạo được phiếu (create_request 100% thất bại)";
    console.log(`\n  [BLOCKED] ${blocked}`);
    return 2;
  }

  // ══════════════════════════════════════════════════════════════════════════════════════
  tieuDe("[3] LUẬT «NGƯỜI TẠO KHÔNG TỰ DUYỆT» — bước trùng vai trò người lập bị MIỄN");
  // ══════════════════════════════════════════════════════════════════════════════════════
  // Phiếu của `nvkhdemo` (kh_nv/procurement) phải bị MIỄN bước có allowed_role_codes chứa kh_nv/procurement.
  const ungVien = daTao.find((r) => r.username === "nvkhdemo") || daTao[0];
  console.log(`  Phiếu dùng để đo: ${ungVien.requestNo} · người lập ${ungVien.username} (${ungVien.role}/${ungVien.roleBase})`);

  const adminLogin = await post("/api/system", "login", { username: ADMIN.username, password: ADMIN.password });
  inRaw(`login(admin) → HTTP ${adminLogin.http}`, adminLogin.text);
  if (adminLogin.http !== 200 || !adminLogin.cookie) {
    blocked = `đăng nhập admin thất bại — HTTP ${adminLogin.http} · ${adminLogin.text.slice(0, 200)}`;
    console.log(`\n  [BLOCKED] ${blocked}`);
    return 2;
  }

  const bootAdmin = await getBootstrap(adminLogin.cookie);
  const dsPhieu = bootAdmin.json?.data?.requests || [];
  const phieu = dsPhieu.find((r) => String(r.requestNo) === String(ungVien.requestNo));
  if (!phieu) {
    console.log(`  [CẢNH BÁO] bootstrap của admin không trả phiếu ${ungVien.requestNo} ` +
      `(đã có ${dsPhieu.length} phiếu) ⇒ đọc thẳng MySQL bên dưới.`);
  } else {
    console.log(`  API bootstrap (admin) trả ${phieu.approvals?.length ?? 0} bước cho phiếu ${phieu.requestNo} ` +
      `· approvalStage=${phieu.approvalStage} · status=${phieu.status}`);
  }

  // Đọc thẳng DB (nguồn sự thật) — danh sách bước duyệt của phiếu.
  let buoc = [];
  let nguonBuoc = "MySQL";
  try {
    const mrId = sql(`SELECT id FROM material_requests WHERE request_no='${ungVien.requestNo}' LIMIT 1`)[0]?.[0];
    console.log(`  MySQL: id phiếu = ${mrId}`);
    const stageRoles = new Map(
      sql("SELECT stage_no,allowed_role_codes FROM approval_stage_catalog WHERE active=1")
        .map(([no, codes]) => [String(no), String(codes)])
    );
    buoc = sql(
      `SELECT a.stage,a.status,IFNULL(a.decided_at,'<NULL>'),IFNULL(a.comment,'<NULL>'),` +
      `IFNULL(a.approver_user_id,'<NULL>'),IFNULL(a.decision_snapshot,'<NULL>') ` +
      `FROM approvals a WHERE a.request_id='${mrId}' ORDER BY a.stage`
    ).map(([stage, status, decidedAt, comment, owner, snap]) => ({
      stage, status, decidedAt, comment, owner, snap, allowed: stageRoles.get(stage) || "",
    }));
  } catch (e) {
    console.log(`  [CẢNH BÁO] không đọc được MySQL: ${e.message?.slice(0, 200)}`);
    if (phieu?.approvals) {
      nguonBuoc = "API bootstrap";
      buoc = phieu.approvals.map((a) => ({
        stage: String(a.stage), status: String(a.status),
        decidedAt: String(a.decidedAt ?? "<NULL>"), comment: String(a.comment ?? "<NULL>"),
        owner: String(a.approverUserId ?? "<NULL>"), snap: "<không có trong API bootstrap>", allowed: "",
      }));
    }
  }

  console.log(`  ▼ DANH SÁCH BƯỚC DUYỆT của phiếu ${ungVien.requestNo} (nguồn: ${nguonBuoc}) — DÁN NGUYÊN VĂN:`);
  console.log("      stage | status   | decided_at                      | vai trò duyệt của bước   | approver_user_id");
  for (const b of buoc) {
    console.log(`      ${String(b.stage).padEnd(5)} | ${String(b.status).padEnd(8)} | ${String(b.decidedAt).padEnd(31)} | ` +
      `${String(b.allowed || "(không đọc được)").padEnd(24)} | ${b.owner}`);
    console.log(`            comment        = ${b.comment}`);
    console.log(`            decision_snap  = ${b.snap}`);
  }

  const roleNguoiLap = [ungVien.role, ungVien.roleBase].filter(Boolean);
  const buocTrungVaiTro = buoc.filter((b) => b.allowed
    .split(",").map((c) => c.trim()).some((c) => c && roleNguoiLap.includes(c)));
  const biMien = buocTrungVaiTro.filter((b) => b.status === "approved");
  dat(`Có bước mang vai trò TRÙNG người lập (${roleNguoiLap.join("/")})`,
    buocTrungVaiTro.length > 0,
    buocTrungVaiTro.map((b) => `bước ${b.stage} (vai trò ${b.allowed})`).join(" · ") || "KHÔNG có bước nào trùng");
  dat("Mọi bước trùng vai trò người lập đều bị MIỄN (status='approved')",
    buocTrungVaiTro.length > 0 && biMien.length === buocTrungVaiTro.length,
    `trùng=${buocTrungVaiTro.length} · bị miễn=${biMien.length}`);
  const coVetMien = biMien.some((b) => /creator_role_waived/.test(b.snap) || /trùng vai trò duyệt/.test(b.comment));
  dat("Vết kiểm toán ghi RÕ lý do miễn (`creator_role_waived` / «trùng vai trò duyệt»)",
    coVetMien,
    biMien.map((b) => `b${b.stage}: ${b.comment}`).join(" | ") || "không có vết");
  // Bước chờ kế tiếp phải là bước ĐẦU TIÊN không trùng vai trò người lập.
  const choKeTiep = buoc.find((b) => b.status === "pending");
  const buocTrongVaiTro = buoc.filter((b) => !b.allowed.split(",").map((c) => c.trim()).some((c) => c && roleNguoiLap.includes(c)));
  const mongDoi = buocTrongVaiTro[0];
  dat("Bước ĐANG CHỜ kế tiếp KHÔNG phải bước trùng vai trò người lập (đã nhảy sang vai trò kế)",
    Boolean(choKeTiep) && Boolean(mongDoi) && String(choKeTiep.stage) === String(mongDoi.stage),
    `đang chờ = bước ${choKeTiep?.stage ?? "(không còn bước chờ)"} · mong đợi = bước ${mongDoi?.stage ?? "-"}`);

  // ══════════════════════════════════════════════════════════════════════════════════════
  tieuDe("[4] CỘT `audit_logs.result` TRÊN LIVE — gọi hành động nghiệp vụ rồi ĐỌC LẠI `result`");
  // ══════════════════════════════════════════════════════════════════════════════════════
  // Hành động nghiệp vụ ở bước [2] đã ghi nhật ký. Đọc qua API (admin bootstrap `audits`) VÀ qua DB.
  const bootSau = await getBootstrap(adminLogin.cookie);
  const audits = bootSau.json?.data?.audits || bootSau.json?.data?.auditLogs || [];
  const taoPhieuAudit = audits.filter((a) => String(a.action) === "create_request");
  console.log(`  API bootstrap (admin) trả ${audits.length} dòng nhật ký · trong đó create_request = ${taoPhieuAudit.length}`);
  console.log("      id                               | action          | entity_id                        | result   | occurred_at");
  for (const a of taoPhieuAudit.slice(0, 5)) {
    console.log(`      ${String(a.id).padEnd(32)} | ${String(a.action).padEnd(15)} | ${String(a.entityId).padEnd(32)} | ` +
      `${String(a.result).padEnd(8)} | ${a.occurredAt}`);
  }
  const coTruongResult = taoPhieuAudit.length > 0 && taoPhieuAudit.every((a) => "result" in a);
  dat("API LIVE trả về TRƯỜNG `result` cho dòng nhật ký create_request (jar mới có SELECT cột result)",
    coTruongResult,
    taoPhieuAudit.slice(0, 3).map((a) => `${a.action} result=${JSON.stringify(a.result)}`).join(" · "));

  let dbResult = [];
  try {
    dbResult = sql(
      "SELECT id,action,entity_id,result,occurred_at FROM audit_logs " +
      "WHERE action='create_request' ORDER BY occurred_at DESC LIMIT 5"
    );
    console.log("  ▼ MySQL `audit_logs` (5 dòng create_request mới nhất) — DÁN NGUYÊN VĂN:");
    for (const [id, action, eid, result, at] of dbResult) {
      console.log(`      ${id} | ${action} | ${eid} | result=${JSON.stringify(result)} | ${at}`);
    }
  } catch (e) {
    console.log(`  [CẢNH BÁO] không đọc được MySQL: ${e.message?.slice(0, 200)}`);
  }
  const resultKhongRong = dbResult.filter((r) => String(r[3] || "").trim() !== "");
  dat("DB LIVE: mọi dòng create_request có `result` KHÔNG rỗng (từ vựng ok/denied/failed)",
    dbResult.length > 0 && resultKhongRong.length === dbResult.length,
    dbResult.map((r) => `result=${JSON.stringify(r[3])}`).join(" · "));

  // Kiểm chéo: proxy :9000 và engine :18081 trả CÙNG dữ liệu phiếu vừa tạo (proxy chỉ là ống dẫn).
  try {
    const directLogin = await fetch(API_DIRECT + "/api/system", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "login", username: ADMIN.username, password: ADMIN.password }),
    });
    const dc = (directLogin.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
    const directBoot = await (await fetch(API_DIRECT + "/api/system", { headers: { cookie: dc } })).json();
    const thayTrucTiep = (directBoot?.data?.requests || []).some((r) => String(r.requestNo) === String(ungVien.requestNo));
    dat(`Kiểm chéo ${API_DIRECT} (Java trực tiếp): thấy CÙNG phiếu ${ungVien.requestNo}`, thayTrucTiep,
      `:9000 HTTP ${bootAdmin.http} · :18081 HTTP ${directLogin.status} — cùng engine Java`);
  } catch (e) {
    console.log(`  [CẢNH BÁO] không gọi được ${API_DIRECT} để kiểm chéo: ${e.message?.slice(0, 160)}`);
  }

  tieuDe("KẾT LUẬN CỔNG NGHIỆM THU LIVE");
  console.log(`  ĐẠT: ${soDat} · HỎNG: ${soHong}`);
  console.log(`  ${soHong === 0 ? "KẾT LUẬN: ĐẠT — 4/4 phép đo có bằng chứng HTTP/DB THẬT." : "KẾT LUẬN: KHÔNG ĐẠT — xem các dòng [HỎNG] ở trên."}`);
  return soHong === 0 ? 0 : 1;
}

let code;
try {
  code = await main();
} catch (e) {
  console.error(`\n[BLOCKED] Lỗi khi chạy phép đo LIVE: ${e && e.message ? e.message : e}`);
  console.error(`  BASE=${BASE} · MySQL=${MYSQL}`);
  code = 2;
}
process.exit(code);
