// GIAI ĐOẠN 9 — CHỐNG HARDCODE: ĐỔI NGƯỜI DUYỆT TỪNG BƯỚC, RỒI ĐẢO THỨ TỰ PHÒNG BAN
//
// Câu hỏi người dùng đặt ra: «quy trình có bị hardcode không?». Hai cách kiểm chứng:
//   9.A — ĐỔI NGƯỜI Ở TỪNG BƯỚC: gán Owner khác vào `approval_project_assignments`, tạo phiếu MỚI,
//          kiểm `approvals[].approverUserId` có đổi theo không; và người CŨ có bị chặn không.
//   9.B — ĐẢO THỨ TỰ PHÒNG BAN: hoán đổi `allowedRoleCodes` + `name` của bước 3 và bước 4 trong
//          `approval_stage_catalog`, tạo phiếu MỚI, kiểm phòng ban đã đổi chỗ thật không.
// Mọi thay đổi cấu hình đều được TRẢ LẠI nguyên trạng ở bước 9.E.
import fs from "node:fs";
import { login, bootstrap, call, coThat, buoc, tomTatBuoc } from "./client.mjs";

const tt = JSON.parse(fs.readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const MK = tt.matKhau;
const BC = [];

// `save_email_settings` là THAY THẾ TOÀN BỘ `approval_project_assignments` (AdminOpsStoreAdapter:65
// `DELETE FROM approval_project_assignments`) ⇒ phải gửi LẠI MỌI dự án, không chỉ dự án E2E.
async function luuAssignments(bs, assignments) {
  const e = bs.emailSettings || {};
  return coThat("save_email_settings", {
    enabled: !!e.enabled, smtpHost: e.smtpHost, smtpPort: e.smtpPort, security: e.security,
    username: e.username, senderEmail: e.senderEmail, senderName: e.senderName, baseUrl: e.baseUrl,
    poSlaHours: 24, bchConfirmationSlaHours: 8,
    assignments, recipients: (bs.emailRecipients || []).map((r) => ({ projectId: r.projectId, stage: r.stage, emails: r.emails })),
  });
}

async function chay() {
  console.log("==============================================================================");
  console.log("GIAI ĐOẠN 9 — KIỂM TRA HARDCODE TRONG QUY TRÌNH PHÊ DUYỆT");
  console.log("==============================================================================");

  await login("admin", "Admin123456@");
  const bs = await bootstrap();
  const goc = bs.workflowAssignments.map((a) => ({ projectId: a.projectId, stage: a.stage, ownerUserId: a.ownerUserId, ccEmails: a.ccEmails }));
  const stages = () => (bs.approvalStages || []).filter((s) => (s.stageKind || "approval") === "approval" && s.active).sort((a, c) => a.stageNo - c.stageNo);
  const id = (n) => bs.users.find((u) => u.username === n)?.id;
  const ten = (uid) => bs.users.find((u) => u.id === uid)?.username || uid;
  const duAn = (n) => goc.filter((a) => a.projectId === tt.duAn).find((a) => a.stage === n);

  console.log("\n[9.0] CHUỖI HIỆN TẠI — nguồn: `approval_stage_catalog` (không phải modal «Quy trình phê duyệt»)");
  for (const s of stages()) {
    const a = duAn(s.stageNo);
    console.log(`      bước ${s.stageNo} ${String(s.name).padEnd(26)} roles=${String(s.allowedRoleCodes).padEnd(22)} owner=${a ? ten(a.ownerUserId) : "(chưa gán)"}`);
  }

  // ── Tạo phiếu mới để đo chuỗi ───────────────────────────────────────────────
  let soPhieu = 0;
  const taoPhieu = async (muc) => {
    await login("e2e.cht", MK);
    const b = await bootstrap();
    const dong = b.boqItems.filter((x) => x.boqVersionId === tt.boqVersionId && x.materialCode && x.materialId).slice(0, 2);
    if (dong.length < 2) { console.log("      ⛔ Thiếu dòng BOQ thật."); process.exitCode = 1; return null; }
    const lines = dong.map((x) => ({
      materialId: x.materialId, materialCode: x.materialCode, materialName: x.materialName, unit: x.unit || "cai",
      quantity: 1, unitPrice: x.unitPrice || 100000, boqItemId: x.id,
      contractLineNo: x.contractLineRef || x.lineNo || "", origin: "Hop dong",
      approvedSupplier: "", installationArea: "E2E", note: "GĐ9 — đo chuỗi phê duyệt",
    }));
    await login("e2e.project", MK);   // người lập KHÔNG giữ vai trò duyệt của bước 3 ⇒ không bị bỏ qua
    const r = await buoc("create_request " + muc, () => coThat("create_request", {
      projectId: tt.duAn, contractId: tt.hopDongId, boqVersionId: tt.boqVersionId,
      sourceWarehouseId: tt.khoSite, neededAt: "2026-10-20", area: "Công trường E2E",
      priority: "normal", purpose: muc, lines,
    }), BC);
    if (!r || r.ok === false) return null;
    await login("admin", "Admin123456@");
    const b2 = await bootstrap();
    const p = (b2.requests || []).find((x) => String(x.purpose || "") === muc);
    if (!p) { console.log("      ⛔ Không đọc lại được phiếu vừa tạo."); process.exitCode = 1; return null; }
    soPhieu++;
    return p;
  };
  const inChuoi = (p) => (p.approvals || []).map((a) => `${a.stage}:${a.department}=${a.approverName}`).join("  |  ");

  // ═══ 9.A ĐỔI NGƯỜI DUYỆT Ở TỪNG BƯỚC ═══════════════════════════════════════
  console.log("\n[9.A] ĐỔI NGƯỜI DUYỆT Ở BƯỚC 1 VÀ BƯỚC 2");
  const doi = goc.map((a) => {
    if (a.projectId !== tt.duAn) return a;
    if (a.stage === 1) return { ...a, ownerUserId: id("e2e.chtsa") };
    if (a.stage === 2) return { ...a, ownerUserId: id("e2e.thukysa") };
    return a;
  });
  const rA = await buoc("save_email_settings · gán lại Owner bước 1–2", () => luuAssignments(bs, doi), BC);
  if (!rA || rA.ok === false) { console.log("  ⛔ Dừng 9.A."); process.exitCode = 1; return; }
  await login("admin", "Admin123456@");
  let bs2 = await bootstrap();
  const sau = bs2.workflowAssignments.filter((a) => a.projectId === tt.duAn).sort((a, c) => a.stage - c.stage);
  // ⓘ So với MỌI bước với bản GỐC theo đúng thứ tự `stage`; bản đầu tiêm đã lấy `sau.slice(2)`
  //   nhưng lại tự dò `duAn(a.stage + 2)` (đánh số vô nghĩa) ⇒ luôn sai.
  const gocE2E = goc.filter((a) => a.projectId === tt.duAn).sort((a, c) => a.stage - c.stage);
  const doiDung = sau.length === gocE2E.length
    && sau[0].ownerUserId === id("e2e.chtsa") && sau[1].ownerUserId === id("e2e.thukysa")
    && sau.slice(2).every((a, i) => a.ownerUserId === gocE2E[i + 2].ownerUserId);
  console.log("      Owner sau khi đổi: " + sau.map((a) => `b${a.stage}=${ten(a.ownerUserId)}`).join(", "));
  console.log("      ✔ " + (doiDung ? "đúng 2 bước đổi, 3 bước còn lại giữ nguyên" : "SAI — phải xem lại"));

  console.log("\n[9.A2] Tạo phiếu MỚI ⇒ chuỗi phải trỏ sang người mới");
  const pA = await taoPhieu("E2E-GD9-A doi nguoi duyet");
  if (!pA) { console.log("  ⛔ Dừng 9.A2."); process.exitCode = 1; return; }
  console.log("      " + pA.requestNo + " → " + inChuoi(pA));
  const doiNguoiDung = (pA.approvals || [])[0]?.approverUserId === id("e2e.chtsa")
    && (pA.approvals || [])[1]?.approverUserId === id("e2e.thukysa");
  console.log("      " + (doiNguoiDung ? "✔ bước 1 và 2 đã đổi sang NGƯỜI MỚI" : "⛔ chuỗi KHÔNG đổi theo"));

  console.log("\n[9.A3] ÂM — người CŨ (e2e.cht) thử duyệt bước 1 ⇒ phải bị chặn");
  await login("e2e.cht", MK);
  const cu = await call("decide_approval", { requestId: pA.id, stage: 1, decision: "approved", comment: "thử bằng người cũ" }, { boQuaLoi: true, nhan: "9.A3" });
  console.log("      → " + (cu?.ok === false ? "✔ BỊ CHẶN: " + (cu._loi || cu.error) : "⛔ KHÔNG CHẶN — người cũ vẫn duyệt được"));
  const chanCu = cu?.ok === false;

  console.log("\n[9.A4] DƯƠNG — người MỚI (e2e.chtsa) duyệt bước 1");
  await login("e2e.chtsa", MK);
  const rA4 = await buoc("decide_approval bước 1 bởi e2e.chtsa", () => coThat("decide_approval", {
    requestId: pA.id, stage: 1, decision: "approved", comment: "E2E GĐ9 — người duyệt mới của bước 1",
  }), BC);
  await login("admin", "Admin123456@");
  bs2 = await bootstrap();
  const pA2 = (bs2.requests || []).find((x) => x.id === pA.id);
  const b1 = (pA2?.approvals || []).find((a) => a.stage === 1);
  console.log(`      bước 1 → ${b1?.status} · ${b1?.approverName}`);
  const okA4 = b1?.status === "approved" && b1?.approverUserId === id("e2e.chtsa");

  // ═══ 9.B ĐẢO THỨ TỰ PHÒNG BAN ══════════════════════════════════════════════
  console.log("\n[9.B] ĐẢO THỨ TỰ PHÒNG BAN — hoán đổi bước 3 (Dự án) và bước 4 (Kế hoạch)");
  const st = bs2.approvalStages.filter((s) => s.id === "ASTAGE-3" || s.id === "ASTAGE-4");
  const s3 = st.find((s) => s.id === "ASTAGE-3"), s4 = st.find((s) => s.id === "ASTAGE-4");
  console.log(`      trước: b3=${s3.name}(${s3.allowedRoleCodes})  b4=${s4.name}(${s4.allowedRoleCodes})`);
  // ⛔ KHÔNG đổi `stageNo` — `saveApprovalStage` chặn khi bước đã có phê duyệt
  //   (OpsTaskManagementUseCase:574 `countApprovalsByStageNo(beforeNo) > 0`). Thứ tự phòng ban
  //   do `stage_no` quy định, nên đổi THỨ TỰ phòng ban = hoán đổi phòng ban nào ngồi vị trí nào.
  const doiTen = async (s, layTu) => {
    const r = await buoc("save_approval_stage " + s.id + " ← lấy cấu hình của " + layTu.id, () => coThat("save_approval_stage", {
      stageId: s.id, stageNo: s.stageNo, name: layTu.name, description: layTu.description,
      allowedRoleCodes: layTu.allowedRoleCodes, approvalMode: layTu.approvalMode,
      slaHours: layTu.slaHours, autoApproveOnSubmit: false, sortOrder: layTu.sortOrder,
    }), BC);
    return r && r.ok !== false;
  };
  if (!await doiTen(s3, s4) || !await doiTen(s4, s3)) { console.log("  ⛔ Không đảo được bước 3/4."); process.exitCode = 1; return; }
  // Owner 3↔4 cũng phải đổi theo: `createRequest` kiểm Owner phải thuộc `allowedRoleCodes` của bước.
  const doiOwner34 = goc.map((a) => {
    if (a.projectId !== tt.duAn) return a;
    if (a.stage === 3) return { ...a, ownerUserId: duAn(4).ownerUserId };
    if (a.stage === 4) return { ...a, ownerUserId: duAn(3).ownerUserId };
    return a;
  });
  const rB = await buoc("save_email_settings · đổi Owner bước 3↔4 theo phòng ban mới", () => luuAssignments(bs2, doiOwner34), BC);
  if (!rB || rB.ok === false) { console.log("  ⛔ Dừng 9.B."); process.exitCode = 1; return; }

  await login("admin", "Admin123456@");
  bs2 = await bootstrap();
  const nS3 = bs2.approvalStages.find((s) => s.id === "ASTAGE-3");
  const nS4 = bs2.approvalStages.find((s) => s.id === "ASTAGE-4");
  console.log(`      sau:   b3=${nS3.name}(${nS3.allowedRoleCodes})  b4=${nS4.name}(${nS4.allowedRoleCodes})`);

  console.log("\n[9.B2] Tạo phiếu MỚI ⇒ phòng ban đã đổi chỗ");
  const pB = await taoPhieu("E2E-GD9-B dao thu tu phong ban");
  if (!pB) { console.log("  ⛔ Dừng 9.B2."); process.exitCode = 1; return; }
  console.log("      " + pB.requestNo + " → " + inChuoi(pB));
  // Sau khi đảo, ASTAGE-3 mang cấu hình của Phòng Kế hoạch ⇒ vị trí 3 trong chuỗi là Kế hoạch.
  const ab = pB.approvals || [];
  const daoDung = ab[2]?.department === nS3.name && ab[3]?.department === nS4.name
    && ab[2]?.approverUserId === gocE2E[3].ownerUserId && ab[3]?.approverUserId === gocE2E[2].ownerUserId;
  console.log("      " + (daoDung ? "✔ Kế hoạch đã lên vị trí 3, Dự án xuống vị trí 4" : "⛔ chưa đảo được"));

  console.log("\n[9.B3] ÂM — thử đánh số lại bước đã có phê duyệt (đổi `stageNo`)");
  await login("admin", "Admin123456@");
  // ⛔⛔ VÁ LỖI «ĐẠT GIẢ» (phát hiện 02/10/2026, khi chạy lại trên backend Java `:18081`):
  //   Bản cũ viết `call("<nhãn>", () => coThat("save_approval_stage", {...}), {...})` — SAI CHỮ KÝ.
  //   `call` nhận `(action, payload, opts)`, nên hàm mũi tên bị coi là `payload` và **KHÔNG hề được gọi**
  //   (`{action, ...payload}` trải một function ⇒ `{}`) ⇒ backend chỉ nhận một TÊN ACTION KHÔNG TỒN TẠI
  //   và trả «Action '…' chưa được triển khai trên backend Java (Strangler Fig)».
  //   Vì câu đó cũng là `ok === false`, bài test in «✔ BỊ CHẶN» ⇒ trông như ĐẠT nhưng **CHƯA KIỂM GÌ**.
  //   Đã đo lại bằng chữ ký đúng: backend CHẶN THẬT — HTTP 400
  //   «Bước đã có lịch sử phê duyệt nên không thể đổi số bước. Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.»
  const truocB3 = (await bootstrap()).approvalStages.find((s) => s.id === "ASTAGE-3");
  const rB3 = await call("save_approval_stage", {
    stageId: "ASTAGE-3", stageNo: 9, name: nS4.name, description: nS4.description,
    allowedRoleCodes: nS4.allowedRoleCodes, approvalMode: nS4.approvalMode,
    slaHours: nS4.slaHours, autoApproveOnSubmit: false, sortOrder: 90,
  }, { boQuaLoi: true, nhan: "9.B3" });
  const chanDoi = rB3?.ok === false;
  // Bổ sung cho khỏi «đạt giả» lần nữa: không chỉ đòi «có báo lỗi», mà `stageNo` phải THỰC SỰ không đổi
  // — đo lại từ máy chủ, không tin lời hứa của chính lời gọi.
  const sauB3 = (await bootstrap()).approvalStages.find((s) => s.id === "ASTAGE-3");
  const stageNoKhongDoi = Number(sauB3.stageNo) === Number(truocB3.stageNo);
  const chanDoiVaKhongDoi = chanDoi && stageNoKhongDoi;
  console.log("      → " + (chanDoi ? "✔ BỊ CHẶN: " + (rB3._loi || rB3.error) : "⛔ KHÔNG CHẶN"));
  console.log("      → " + (stageNoKhongDoi
    ? `✔ stageNo KHÔNG đổi (đo lại từ máy chủ: ${truocB3.stageNo} → ${sauB3.stageNo})`
    : `⛔ stageNo ĐÃ BỊ ĐỔI (${truocB3.stageNo} → ${sauB3.stageNo}) — LỖI THẬT`));

  // ═══ 9.E KHÔI PHỤC ═════════════════════════════════════════════════════════
  console.log("\n[9.E] KHÔI PHỤC cấu hình gốc");
  await login("admin", "Admin123456@");
  const bs3 = await bootstrap();
  const gocLai = bs3.approvalStages.filter((s) => s.id === "ASTAGE-3" || s.id === "ASTAGE-4");
  const o3 = gocLai.find((s) => s.id === "ASTAGE-3"), o4 = gocLai.find((s) => s.id === "ASTAGE-4");
  const b3 = (await buoc("save_approval_stage ASTAGE-3 ← gốc", () => coThat("save_approval_stage", {
    stageId: o3.id, stageNo: o3.stageNo, name: s3.name, description: s3.description,
    allowedRoleCodes: s3.allowedRoleCodes, approvalMode: s3.approvalMode,
    slaHours: s3.slaHours, autoApproveOnSubmit: false, sortOrder: s3.sortOrder,
  }), BC)) && true;
  const b4 = (await buoc("save_approval_stage ASTAGE-4 ← gốc", () => coThat("save_approval_stage", {
    stageId: o4.id, stageNo: o4.stageNo, name: s4.name, description: s4.description,
    allowedRoleCodes: s4.allowedRoleCodes, approvalMode: s4.approvalMode,
    slaHours: s4.slaHours, autoApproveOnSubmit: false, sortOrder: s4.sortOrder,
  }), BC)) && true;
  const b5 = (await buoc("save_email_settings · trả lại Owner gốc", () => luuAssignments(bs3, goc), BC)) && true;

  await login("admin", "Admin123456@");
  const bsF = await bootstrap();
  const f3 = bsF.approvalStages.find((s) => s.id === "ASTAGE-3");
  const f4 = bsF.approvalStages.find((s) => s.id === "ASTAGE-4");
  const fa = bsF.workflowAssignments.filter((x) => x.projectId === tt.duAn).sort((x, c) => x.stage - c.stage);
  const khoiPhuc = f3.allowedRoleCodes === s3.allowedRoleCodes && f4.allowedRoleCodes === s4.allowedRoleCodes
    && fa.every((a, i) => a.ownerUserId === goc.filter((g) => g.projectId === tt.duAn)[i].ownerUserId)
    && bsF.workflowAssignments.length === goc.length;
  console.log(`      b3=${f3.name}(${f3.allowedRoleCodes}) · b4=${f4.name}(${f4.allowedRoleCodes})`);
  console.log("      Owner: " + fa.map((a) => `b${a.stage}=${ten(a.ownerUserId)}`).join(", "));
  console.log("      " + (khoiPhuc ? "✔ đã về đúng trạng thái gốc" : "⛔ CHƯA khôi phục được"));

  console.log("\n[9.KẾT] CHUỖI PHÊ DUYỆT KHÔNG BỊ HARDCODE");
  const that = [doiDung, doiNguoiDung, chanCu, okA4, daoDung, chanDoiVaKhongDoi, khoiPhuc];
  const nhan = ["đổi Owner theo cấu hình", "phiếu mới nhận người duyệt mới", "người cũ bị chặn",
    "người mới duyệt được", "đảo thứ tự phòng ban", "chặn đánh số lại bước đã duyệt (VÀ stageNo không đổi)",
    "khôi phục cấu hình"];
  for (let i = 0; i < that.length; i++) console.log(`      ${that[i] ? "✔" : "⛔"} ${nhan[i]}`);
  if (that.some((x) => !x)) process.exitCode = 1;

  console.log("\n" + tomTatBuoc("GIAI ĐOẠN 9 — CHỐNG HARDCODE", BC));
}

chay().catch((e) => { console.log("[LOI]", e.message); process.exitCode = 1; });