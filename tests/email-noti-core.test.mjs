// LÕI THÔNG BÁO EMAIL — cổng kiểm thử (không cần mạng, ⛔ không cần SMTP thật).
//
// Chạy riêng:  node --import tsx --test tests/email-noti-core.test.mjs
//
// Bố cục:
//   A. Mẫu thư dùng chung (subject · text · html) + chống tiêm header / XSS.
//   B. Hàng đợi `email_outbox`: xếp thư IDEMPOTENT (khoá chống trùng).
//   C. Bộ gửi (transport) CẮM ĐƯỢC: mặc định dry-run khi chưa cấu hình SMTP.
//   D. Thử lại CÓ GIỚI HẠN + phục hồi thư kẹt `sending` (MỐC 50).
//   E. Điểm nối sự kiện nghiệp vụ + worker thật `dispatchEmailOutbox`.
//   F. CỔNG MÃ NGUỒN + ĐỐI CHỨNG ÂM: mỗi vệ phải chứng minh nó THẬT SỰ bắt lỗi.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import {
  EMAIL_DRY_RUN_MARK,
  EMAIL_MAX_ATTEMPTS,
  EMAIL_TEMPLATE_KEYS,
  buildEmailModel,
  buildEmailMessage,
  buildRawMimeMessage,
  createMemoryEmailLogger,
  dispatchEmailQueue,
  emailInsertStatement,
  emailOutboxId,
  emailSettingsReady,
  enqueueEmail,
  normalizeEmailRecipients,
  notifyBusinessEvent,
  registerEmailTransport,
  renderEmailMessage,
  resolveEmailTransport,
  sanitizeHeader,
} from "../scripts/email-noti-core.mjs";
import { dispatchEmailOutbox } from "../scripts/email-dispatcher.mjs";

// ─────────────────────── HẠ TẦNG KIỂM THỬ (SQLite trong bộ nhớ, khuôn D1) ───────────────────────
const database = new DatabaseSync(":memory:");
class D1Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new D1Statement(this.sql, values); }
  async first() { return database.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { success: true, results: database.prepare(this.sql).all(...this.values) }; }
  async run() { return { success: true, meta: database.prepare(this.sql).run(...this.values) }; }
}
const d1 = {
  prepare(sql) { return new D1Statement(sql); },
  async batch(statements) {
    database.exec("BEGIN");
    try { const results = []; for (const statement of statements) results.push(await statement.run()); database.exec("COMMIT"); return results; }
    catch (error) { database.exec("ROLLBACK"); throw error; }
  },
};
for (const file of (await readdir("drizzle")).filter((name) => name.endsWith(".sql")).sort()) {
  const source = await readFile(`drizzle/${file}`, "utf8");
  for (const statement of source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) database.exec(statement);
}

/** Bộ gửi GIẢ ghi lại thư đã "gửi" — chứng minh toàn tuyến chạy được mà ⛔ không cần SMTP. */
const daGui = [];
registerEmailTransport("memory", () => ({
  name: "memory",
  deliverable: true,
  async send(message) { daGui.push(message); return { provider: "memory", dryRun: false }; },
}));
/** Bộ gửi LUÔN LỖI — dùng cho nhánh thử lại. */
registerEmailTransport("memory-loi", () => ({
  name: "memory-loi",
  deliverable: true,
  async send() { throw new Error("SMTP 550: hộp thư không tồn tại"); },
}));

const NOW = () => new Date().toISOString();
const luiPhut = (phut) => new Date(Date.now() - phut * 60000).toISOString();
const toiPhut = (phut) => new Date(Date.now() + phut * 60000).toISOString();

function dbSach() {
  database.exec("DELETE FROM email_outbox");
  daGui.length = 0;
  return d1;
}
function demThue(where = "1=1", ...binds) {
  return Number(database.prepare(`SELECT COUNT(*) AS total FROM email_outbox WHERE ${where}`).get(...binds).total);
}
function dong(id) {
  return database.prepare(`SELECT * FROM email_outbox WHERE id=?`).get(id) ?? null;
}
function datCauHinh({ enabled = 0, host = null, sender = null, baseUrl = "http://127.0.0.1:9000" } = {}) {
  const stamp = NOW();
  database.prepare(`INSERT INTO email_settings (id,enabled,smtp_host,smtp_port,security,username,password,sender_email,sender_name,base_url,created_at,updated_at) VALUES ('EMAIL',?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,smtp_host=excluded.smtp_host,sender_email=excluded.sender_email,base_url=excluded.base_url,updated_at=excluded.updated_at`)
    .run(enabled, host, 587, "starttls", null, null, sender, "VNTECH ERP", baseUrl, stamp, stamp);
}
function chenTho({ id, event = "test", recipients = "a@x.com", status = "queued", attempts = 0, nextAttemptAt = null, updatedAt = NOW() }) {
  const stamp = NOW();
  database.prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, null, null, event, recipients, `Thư thô ${id}`, "Nội dung thô", "<p>Nội dung thô</p>", status, attempts, nextAttemptAt, stamp, null, null, stamp, updatedAt);
}

/** Dữ liệu nền TỐI THIỂU: phiếu có THẬT ⇒ `email_outbox.request_id` thoả khoá ngoại (FK đang BẬT). */
{
  const stamp = NOW();
  database.prepare(`INSERT INTO users (id,employee_code,full_name,username,email,role,department,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run("U-1", "NV001", "Nguyễn Văn A", "nva", "a@x.com", "admin", "Kho", 1, stamp, stamp);
  database.prepare(`INSERT INTO projects (id,code,name,status,created_at,updated_at) VALUES (?,?,?,?,?,?)`)
    .run("P-1", "DA-01", "Dự án Mẫu", "active", stamp, stamp);
  database.prepare(`INSERT INTO material_requests (id,request_no,project_id,requested_by,requested_at,needed_at,area,status,approval_stage,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run("REQ-1", "DNMH-001", "P-1", "U-1", stamp, "2026-09-20", "Tầng 3", "pending_approval", 3, stamp, stamp);
}

const NGU_CANH = {
  requestId: "REQ-1",
  requestNo: "DNMH-001",
  projectCode: "DA-01",
  projectName: "Dự án Mẫu",
  requesterName: "Nguyễn Văn A",
  neededAt: "2026-09-20",
  area: "Tầng 3",
  itemCount: 5,
  total: 1250000,
  stage: 3,
  department: "Kho",
  deadline: "2026-09-21T10:00:00.000Z",
  baseUrl: "http://127.0.0.1:9000",
};
const THU_PHIEU = () => buildEmailMessage({ event: "approval_requested", recipients: "a@x.com, b@y.vn", context: NGU_CANH });

// ═══════════════════════════ A. MẪU THƯ DÙNG CHUNG ═══════════════════════════
test("A1 — người nhận: chuẩn hoá · khử trùng · ⛔ LOẠI địa chỉ sai và địa chỉ dính CR/LF", () => {
  assert.deepEqual(normalizeEmailRecipients("A@X.com, a@x.com; b@y.vn"), ["a@x.com", "b@y.vn"]);
  assert.deepEqual(normalizeEmailRecipients(["a@x.com", "a@x.com", "x@y", "", null]), ["a@x.com"]);
  assert.deepEqual(normalizeEmailRecipients("khong-phai-email"), []);
  // ⛔ Địa chỉ bị tiêm CR/LF nằm GIỮA mẩu ⇒ LOẠI NGUYÊN MẨU, ⛔ không được cắt thành 2 người nhận.
  assert.deepEqual(normalizeEmailRecipients("good@x.com\r\nBcc: ke-gian@x.com"), []);
  // Khoảng trắng ở ĐẦU/CUỐI mỗi địa chỉ thì vẫn hợp lệ (dữ liệu cấu hình hay có).
  assert.deepEqual(normalizeEmailRecipients(" a@x.com ,\r\n b@y.vn "), ["a@x.com", "b@y.vn"]);
});

test("A2 — MẪU DÙNG CHUNG: mọi sự kiện khai báo đều dựng được subject + text + html (tiếng Việt có dấu)", () => {
  assert.equal(EMAIL_TEMPLATE_KEYS.length, 8, "7 sự kiện nghiệp vụ + 1 mẫu chung");
  for (const key of EMAIL_TEMPLATE_KEYS) {
    const mail = renderEmailMessage(key, { ...NGU_CANH, title: "Tiêu đề kiểm thử", message: "Nội dung kiểm thử" });
    assert.ok(mail.subject.length > 5, `${key}: thiếu tiêu đề`);
    assert.equal(/[\r\n]/.test(mail.subject), false, `${key}: tiêu đề chứa CR/LF`);
    assert.ok(mail.textBody.length > 30, `${key}: thân thư text quá ngắn`);
    assert.match(mail.htmlBody, /^<div style="font-family:Arial/, `${key}: HTML sai khuôn dùng chung`);
    assert.ok(mail.htmlBody.includes("VNTECH-KHO-MEP-001"), `${key}: HTML thiếu dòng định danh sản phẩm`);
  }
});

test("A3 — 3 mốc duyệt ra ĐÚNG câu chữ nghiệp vụ (chờ duyệt · duyệt xong · bị trả lại)", () => {
  const choDuyet = renderEmailMessage("approval_requested", NGU_CANH);
  assert.equal(choDuyet.subject, "[DNMH] DNMH-001 chờ Kho duyệt");
  assert.ok(choDuyet.textBody.startsWith("Chờ duyệt bước 3 – Kho"));
  assert.ok(choDuyet.textBody.includes("Phiếu: DNMH-001"));
  assert.ok(choDuyet.textBody.includes("Dự án: DA-01 · Dự án Mẫu"));
  assert.ok(choDuyet.textBody.includes("Số dòng / Giá trị: 5 dòng · 1.250.000 đ"));
  assert.ok(choDuyet.textBody.includes("17:00:00"), "hạn xử lý phải đổi sang giờ Việt Nam");
  assert.ok(choDuyet.textBody.includes("http://127.0.0.1:9000/?request=REQ-1"));

  const duyetXong = renderEmailMessage("approved", NGU_CANH);
  assert.equal(duyetXong.subject, "[DNMH] DNMH-001 đã hoàn tất phê duyệt");
  assert.ok(duyetXong.textBody.startsWith("Đã hoàn tất luồng phê duyệt"));

  const biTraLai = renderEmailMessage("rejected", { ...NGU_CANH, actorName: "Trần Thị B", reason: "Thiếu chứng từ" });
  assert.equal(biTraLai.subject, "[DNMH] DNMH-001 bị từ chối");
  assert.ok(biTraLai.textBody.includes("Lý do: Thiếu chứng từ"));

  const quaHan = renderEmailMessage("overdue", { ...NGU_CANH, stage: 3 });
  assert.equal(quaHan.subject, "[QUÁ HẠN] DNMH-001 chưa duyệt cấp 3");
  assert.ok(quaHan.textBody.includes("Phiếu đã quá hạn phê duyệt"));
});

test("A4 — HTML thoát ký tự nguy hiểm; TEXT và HTML dựng từ CÙNG một mô hình", () => {
  const context = { ...NGU_CANH, projectName: "<script>alert(1)</script>", area: 'Kho "A" & B' };
  const mail = renderEmailMessage("approval_requested", context);
  assert.equal(mail.htmlBody.includes("<script>"), false, "HTML ⛔ không được chứa thẻ thô");
  assert.ok(mail.htmlBody.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(mail.htmlBody.includes("&quot;A&quot; &amp; B"));
  const model = buildEmailModel("approval_requested", context);
  assert.equal(model.rows.length, 7, "6 dòng phiếu + 1 dòng hạn xử lý");
  for (const row of model.rows) {
    assert.ok(mail.textBody.includes(`${row.label}: ${row.value}`), `TEXT thiếu dòng "${row.label}" có trong mô hình`);
  }
});

test("A5 — chống TIÊM HEADER: CR/LF trong tiêu đề ⛔ không tạo header mới trong MIME", () => {
  const ban = "Thử gửi\r\nBcc: ke-gian@x.com";
  assert.equal(sanitizeHeader(ban), "Thử gửi Bcc: ke-gian@x.com");
  assert.equal(/[\r\n]/.test(sanitizeHeader(ban)), false);

  const raw = buildRawMimeMessage(
    { sender_email: "erp@vntech.vn", sender_name: "VNTECH ERP" },
    { subject: ban, recipients: ["a@x.com"], textBody: "Nội dung", htmlBody: "<p>Nội dung</p>" },
  );
  assert.equal(/^Bcc:/im.test(raw), false, "⛔ không được sinh header Bcc");
  assert.equal(/\r\nBcc:/i.test(raw), false);
  const encoded = raw.match(/^Subject: =\?UTF-8\?B\?(.+)\?=$/m);
  assert.ok(encoded, "tiêu đề phải được mã hoá UTF-8");
  const giaiMa = Buffer.from(encoded[1], "base64").toString("utf8");
  assert.equal(/[\r\n]/.test(giaiMa), false, "tiêu đề sau giải mã ⛔ không còn CR/LF");
  assert.ok(giaiMa.includes("Bcc: ke-gian@x.com"), "phần chữ vẫn giữ nguyên, chỉ mất CR/LF");
  assert.match(raw, /Content-Type: multipart\/alternative/);
});

// ═══════════════════════════ B. HÀNG ĐỢI IDEMPOTENT ═══════════════════════════
test("B1 — xếp thư ghi ĐÚNG bảng email_outbox: 16 cột, status='queued', attempt_count=0", async () => {
  const db = dbSach();
  const ketQua = await enqueueEmail(db, THU_PHIEU());
  assert.equal(ketQua.queued, true);
  const row = dong(ketQua.id);
  assert.match(row.id, /^MAIL-NOTI_[0-9a-f]{24}$/);
  assert.equal(row.request_id, "REQ-1");
  assert.equal(row.stage, 3);
  assert.equal(row.event, "approval_requested");
  assert.equal(row.recipients, "a@x.com,b@y.vn");
  assert.equal(row.subject, "[DNMH] DNMH-001 chờ Kho duyệt");
  assert.ok(row.text_body.includes("Phiếu: DNMH-001"));
  assert.match(row.html_body, /^<div style="font-family:Arial/);
  assert.equal(row.status, "queued");
  assert.equal(row.attempt_count, 0);
  assert.equal(row.next_attempt_at, row.queued_at);
  assert.equal(row.sent_at, null);
  assert.equal(row.last_error, null);
  assert.ok(row.created_at && row.updated_at);
  assert.equal(demThue(), 1);
});

test("B2 — IDEMPOTENT: gọi 5 lần cho cùng sự kiện ⇒ hàng đợi vẫn CHỈ 1 thư", async () => {
  const db = dbSach();
  const lan1 = await enqueueEmail(db, THU_PHIEU());
  assert.equal(lan1.queued, true);
  for (let lan = 2; lan <= 5; lan += 1) {
    const ketQua = await enqueueEmail(db, THU_PHIEU());
    assert.equal(ketQua.queued, false, `lần ${lan} ⛔ không được xếp thêm`);
    assert.equal(ketQua.deduped, true);
    assert.equal(ketQua.reason, "duplicate");
    assert.equal(ketQua.id, lan1.id, "khoá chống trùng phải ổn định");
  }
  assert.equal(demThue(), 1);
  // Và qua ĐIỂM NỐI nghiệp vụ cũng vậy:
  for (let lan = 0; lan < 3; lan += 1) await notifyBusinessEvent(db, "approval_requested", { recipients: "a@x.com, b@y.vn", context: NGU_CANH });
  assert.equal(demThue(), 1, "điểm nối nghiệp vụ cũng phải idempotent");
});

test("B3 — ĐỐI CHỨNG ÂM (hành vi): cùng sự kiện nhưng KHÁC khoá chính ⇒ hàng đợi CÓ 2 dòng", async () => {
  const db = dbSach();
  const thu = THU_PHIEU();
  await enqueueEmail(db, thu);
  await enqueueEmail(db, { ...thu, id: "MAIL-NOTI_khoa-khac-000000000000" });
  // ⇒ Chứng minh B2 xanh là NHỜ khoá chống trùng, ⛔ không phải nhờ một điều kiện nào khác.
  assert.equal(demThue(), 2);
});

test("B4 — thư đã có sẵn trong hàng đợi (tiến trình khác ghi trước) ⇒ ⛔ không nhân bản, ⛔ không ném lỗi", async () => {
  const db = dbSach();
  const thu = THU_PHIEU();
  await emailInsertStatement(db, thu).run();
  const ketQua = await enqueueEmail(db, thu);
  assert.equal(ketQua.queued, false);
  assert.equal(ketQua.deduped, true);
  assert.equal(demThue(), 1);
  assert.equal(emailOutboxId(thu), emailOutboxId(THU_PHIEU()), "khoá phải ổn định giữa 2 lần gọi");
});

test("B5 — ⛔ KHÔNG người nhận hợp lệ ⇒ ⛔ không ghi hàng đợi, trả lý do 'no_recipients'", async () => {
  const db = dbSach();
  const ketQua = await notifyBusinessEvent(db, "approval_requested", { recipients: "khong-phai-email", context: NGU_CANH });
  assert.equal(ketQua.queued, false);
  assert.equal(ketQua.reason, "no_recipients");
  assert.equal(demThue(), 0);
});

test("B6 — thư 'failed' chỉ được xếp lại khi yêu cầu RÕ (requeueFailed)", async () => {
  const db = dbSach();
  const thu = THU_PHIEU();
  const lan1 = await enqueueEmail(db, thu);
  database.prepare(`UPDATE email_outbox SET status='failed',attempt_count=3,next_attempt_at=?,last_error=? WHERE id=?`).run(NOW(), "SMTP 550", lan1.id);
  const lan2 = await enqueueEmail(db, thu);
  assert.equal(lan2.queued, false);
  assert.equal(lan2.status, "failed");
  assert.equal(dong(lan1.id).attempt_count, 3, "⛔ không tự đụng vào thư đang lỗi");
  const lan3 = await enqueueEmail(db, thu, { requeueFailed: true });
  assert.equal(lan3.queued, true);
  assert.equal(lan3.requeued, true);
  const row = dong(lan1.id);
  assert.equal(row.status, "queued");
  assert.equal(row.attempt_count, 0);
  assert.equal(row.last_error, null);
  assert.equal(demThue(), 1);
});

// ═══════════════════════════ C. BỘ GỬI CẮM ĐƯỢC ═══════════════════════════
test("C1 — chưa cấu hình SMTP ⇒ bộ gửi mặc định là dry-run (⛔ không mở kết nối mạng)", () => {
  const { logger, lines } = createMemoryEmailLogger();
  assert.equal(resolveEmailTransport(null, { logger }).name, "dry-run");
  assert.equal(resolveEmailTransport({ enabled: 0, smtp_host: "smtp.vntech.vn", sender_email: "erp@vntech.vn" }, { logger }).name, "dry-run");
  assert.equal(resolveEmailTransport({ enabled: 1, smtp_host: "", sender_email: "erp@vntech.vn" }, { logger }).name, "dry-run");
  assert.equal(resolveEmailTransport({ enabled: 1, smtp_host: "smtp.vntech.vn", sender_email: "" }, { logger }).name, "dry-run");
  for (const cauHinh of [null, { enabled: 0 }, { enabled: 1, smtp_host: "smtp.vntech.vn", sender_email: "erp@vntech.vn" }]) {
    assert.equal(resolveEmailTransport(cauHinh, { logger }).deliverable, cauHinh?.smtp_host ? true : false);
  }
  assert.equal(emailSettingsReady({ enabled: 1, smtp_host: "smtp.vntech.vn", sender_email: "erp@vntech.vn" }), true);
  assert.equal(emailSettingsReady({ enabled: 0, smtp_host: "smtp.vntech.vn", sender_email: "erp@vntech.vn" }), false);
  assert.ok(lines.some((line) => line.includes("KHÔNG gửi thật")), "phải ghi log nói rõ là KHÔNG gửi thật");
});

test("C2 — lượt gửi khi bộ gửi KHÔNG gửi thật: thư VẪN 'queued' (⛔ không đánh dấu đã gửi) + log số thư chờ", async () => {
  const db = dbSach();
  await enqueueEmail(db, THU_PHIEU());
  await enqueueEmail(db, { ...THU_PHIEU(), recipients: "c@z.vn" });
  const { logger, lines } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { logger }), logger });
  assert.equal(tomTat.skipped, true);
  assert.equal(tomTat.reason, "transport_not_deliverable");
  assert.equal(tomTat.processed, 0);
  assert.equal(tomTat.pending, 2);
  assert.equal(demThue("status='queued'"), 2, "⛔ thư phải còn nguyên trong hàng đợi");
  assert.equal(demThue("sent_at IS NOT NULL"), 0);
  assert.ok(lines.some((line) => line.includes("2 thư đang chờ")), "log phải nói rõ còn bao nhiêu thư chờ");
});

test("C3 — cắm nhà cung cấp KHÁC: bộ gửi 'memory' gửi được mà ⛔ KHÔNG cần SMTP/mạng", async () => {
  const db = dbSach();
  await enqueueEmail(db, THU_PHIEU());
  await enqueueEmail(db, { ...THU_PHIEU(), recipients: "c@z.vn" });
  const { logger } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { provider: "memory", logger }), logger, limit: 5 });
  assert.equal(tomTat.transport, "memory");
  assert.equal(tomTat.processed, 2);
  assert.equal(tomTat.sent, 2);
  assert.equal(tomTat.failed, 0);
  assert.equal(daGui.length, 2);
  assert.deepEqual(daGui[0].recipients, ["a@x.com", "b@y.vn"], "bộ gửi nhận MẢNG người nhận đã chuẩn hoá");
  assert.equal(daGui[0].subject, "[DNMH] DNMH-001 chờ Kho duyệt");
  assert.ok(daGui[0].textBody.includes("Phiếu: DNMH-001"));
  assert.equal(demThue("status='sent' AND sent_at IS NOT NULL AND last_error IS NULL"), 2);
});

test("C4 — dry-run CÓ CHỦ Ý: xử lý khỏi hàng đợi nhưng GHI RÕ dấu vết dry-run", async () => {
  const db = dbSach();
  await enqueueEmail(db, THU_PHIEU());
  const { logger, lines } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { logger }), logger, dryRunMarksSent: true });
  assert.equal(tomTat.dryRun, 1);
  assert.equal(tomTat.sent, 0);
  const row = dong(emailOutboxId(THU_PHIEU()));
  assert.equal(row.status, "sent");
  assert.equal(row.last_error, EMAIL_DRY_RUN_MARK, "⛔ dấu vết dry-run phải nằm lại trong hàng đợi");
  assert.ok(lines.some((line) => line.includes("[email dry-run]")), "phải có dòng log dry-run");
});

// ═══════════════════════════ D. THỬ LẠI + PHỤC HỒI ═══════════════════════════
test("D1 — gửi lỗi ⇒ 'failed' + attempt_count=1 + lần thử sau = +5 phút + last_error nguyên văn", async () => {
  const db = dbSach();
  const id = emailOutboxId(THU_PHIEU());
  await enqueueEmail(db, THU_PHIEU());
  const { logger, lines } = createMemoryEmailLogger();
  const truoc = Date.now();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { provider: "memory-loi", logger }), logger });
  assert.equal(tomTat.failed, 1);
  assert.equal(tomTat.sent, 0);
  const row = dong(id);
  assert.equal(row.status, "failed");
  assert.equal(row.attempt_count, 1);
  assert.equal(row.last_error, "SMTP 550: hộp thư không tồn tại");
  const hen = new Date(row.next_attempt_at).getTime() - truoc;
  assert.ok(Math.abs(hen - 5 * 60000) < 5000, `hẹn thử lại phải ≈ 5 phút, đo được ${Math.round(hen / 1000)} giây`);
  assert.ok(lines.some((line) => line.includes("lần 1/3")), "log lỗi phải ghi rõ đang ở lần thử thứ mấy");
});

test("D2 — ngưỡng thử lại là THẬT: attempt_count=2 còn nhặt, attempt_count=3 ⛔ hết lượt", async () => {
  const db = dbSach();
  chenTho({ id: "MAIL-NOTI_con-luot-000000000000", status: "failed", attempts: EMAIL_MAX_ATTEMPTS - 1, nextAttemptAt: luiPhut(1) });
  chenTho({ id: "MAIL-NOTI_het-luot-000000000000", status: "failed", attempts: EMAIL_MAX_ATTEMPTS, nextAttemptAt: luiPhut(1) });
  const { logger } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { provider: "memory", logger }), logger });
  assert.equal(tomTat.processed, 1, "chỉ thư còn lượt mới được nhặt");
  assert.equal(dong("MAIL-NOTI_con-luot-000000000000").status, "sent");
  const hetLuot = dong("MAIL-NOTI_het-luot-000000000000");
  assert.equal(hetLuot.status, "failed");
  assert.equal(hetLuot.attempt_count, EMAIL_MAX_ATTEMPTS);
});

test("D3 — next_attempt_at ở TƯƠNG LAI ⇒ ⛔ chưa gửi (tôn trọng giãn cách thử lại)", async () => {
  const db = dbSach();
  chenTho({ id: "MAIL-NOTI_cho-lau-0000000000000", status: "failed", attempts: 1, nextAttemptAt: toiPhut(10) });
  const { logger } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailQueue(db, { transport: resolveEmailTransport(null, { provider: "memory", logger }), logger });
  assert.equal(tomTat.processed, 0);
  assert.equal(daGui.length, 0);
  assert.equal(dong("MAIL-NOTI_cho-lau-0000000000000").status, "failed");
});

test("D4 — PHỤC HỒI thư kẹt 'sending' > 5 phút ⇒ về 'queued' NGAY CẢ KHI email ĐANG TẮT (MỐC 50)", async () => {
  const db = dbSach();
  datCauHinh({ enabled: 0 });
  chenTho({ id: "MAIL-NOTI_ket-lau-0000000000000", status: "sending", updatedAt: luiPhut(10) });
  chenTho({ id: "MAIL-NOTI_dang-gui-000000000000", status: "sending", updatedAt: luiPhut(0.2) });
  const tomTat = await dispatchEmailOutbox(db, "khoa-gia");
  assert.equal(tomTat.recovered, 1, "chỉ thư kẹt quá 5 phút mới bị thu hồi");
  assert.equal(dong("MAIL-NOTI_ket-lau-0000000000000").status, "queued");
  assert.equal(dong("MAIL-NOTI_dang-gui-000000000000").status, "sending", "thư đang gửi THẬT ⛔ không bị giành lại");
});

// ═══════════════════════════ E. ĐIỂM NỐI + WORKER THẬT ═══════════════════════════
test("E1 — điểm nối nghiệp vụ CHỈ XẾP HÀNG ĐỢI: status='queued', sent_at NULL (⛔ không gửi trong use-case)", async () => {
  const db = dbSach();
  const ketQua = await notifyBusinessEvent(db, "approval_requested", { recipients: "owner@vntech.vn", context: NGU_CANH });
  assert.equal(ketQua.queued, true);
  assert.equal(ketQua.subject, "[DNMH] DNMH-001 chờ Kho duyệt");
  assert.deepEqual(ketQua.recipients, ["owner@vntech.vn"]);
  const row = dong(ketQua.id);
  assert.equal(row.status, "queued");
  assert.equal(row.sent_at, null);
  assert.equal(row.attempt_count, 0);
  assert.equal(demThue("status='sent'"), 0);
});

test("E2 — điểm nối phủ 3 mốc: chờ duyệt · duyệt xong · bị trả lại ⇒ 3 thư, gọi lại ⛔ không nhân bản", async () => {
  const db = dbSach();
  const nguoiNhan = "owner@vntech.vn, cc@vntech.vn";
  for (const suKien of ["approval_requested", "approved", "rejected"]) {
    await notifyBusinessEvent(db, suKien, { recipients: nguoiNhan, context: NGU_CANH });
  }
  assert.equal(demThue(), 3, "3 sự kiện khác nhau ⇒ 3 thư");
  assert.deepEqual(database.prepare(`SELECT event FROM email_outbox ORDER BY event`).all().map((row) => row.event), ["approval_requested", "approved", "rejected"]);
  for (const suKien of ["approval_requested", "approved", "rejected"]) {
    const lai = await notifyBusinessEvent(db, suKien, { recipients: nguoiNhan, context: NGU_CANH });
    assert.equal(lai.deduped, true, `${suKien}: lần gọi lại phải bị chặn trùng`);
  }
  assert.equal(demThue(), 3);
});

test("E3 — worker thật: SMTP CHƯA cấu hình ⇒ ⛔ không gửi thật, thư vẫn nằm chờ", async () => {
  const db = dbSach();
  datCauHinh({ enabled: 0 });
  await enqueueEmail(db, THU_PHIEU());
  const { logger, lines } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailOutbox(db, "khoa-gia", { logger });
  assert.equal(tomTat.transport, "dry-run");
  assert.equal(tomTat.deliverable, false);
  assert.equal(tomTat.skipped, true);
  assert.equal(tomTat.pending, 1);
  assert.equal(dong(emailOutboxId(THU_PHIEU())).status, "queued");
  assert.ok(lines.some((line) => line.includes("KHÔNG gửi thật")));
});

test("E4 — worker thật dùng ĐƯỢC bộ gửi khác qua tham số (đổi nhà cung cấp ⛔ không cần sửa worker)", async () => {
  const db = dbSach();
  datCauHinh({ enabled: 1, host: "smtp.khong-ton-tai.local", sender: "erp@vntech.vn" });
  await enqueueEmail(db, THU_PHIEU());
  const { logger } = createMemoryEmailLogger();
  const tomTat = await dispatchEmailOutbox(db, "khoa-gia", { logger, provider: "memory" });
  assert.equal(tomTat.transport, "memory");
  assert.equal(tomTat.sent, 1);
  const row = dong(emailOutboxId(THU_PHIEU()));
  assert.equal(row.status, "sent");
  assert.ok(row.sent_at);
  assert.equal(row.last_error, null);
});

// ═══════════════════════════ F. CỔNG MÃ NGUỒN + ĐỐI CHỨNG ÂM ═══════════════════════════
const coreSource = await readFile("scripts/email-noti-core.mjs", "utf8");
const dispatcherSource = await readFile("scripts/email-dispatcher.mjs", "utf8");

/** Cổng 1 — vệ chống trùng phải còn ĐỦ 4 mảnh thì tính idempotent mới thật. */
function congChongTrung(source) {
  const thieu = [];
  if (!/export function emailDedupeKey\(/.test(source)) thieu.push("thiếu hàm băm khoá chống trùng");
  if (!/emailOutboxId\(message\)/.test(source)) thieu.push("INSERT không dùng khoá chống trùng làm khoá chính");
  if (!/const existing = await findQueuedEmail\(database, id\);/.test(source)) thieu.push("enqueueEmail không kiểm tra thư đã có trước khi chèn");
  if (!/function isDuplicateKeyError\(/.test(source)) thieu.push("không bắt lỗi trùng khoá chính khi hai tiến trình cùng chèn");
  if (thieu.length) throw new Error(`Cổng chống trùng HỎNG: ${thieu.join(" · ")}`);
  return true;
}

/** Cổng 2 — chưa cấu hình SMTP thì ⛔ KHÔNG được gửi thật và ⛔ KHÔNG được nhặt thư lên. */
function congMacDinhKhongGuiThat(source) {
  const thieu = [];
  if (!/registerEmailTransport\("dry-run"/.test(source)) thieu.push("chưa đăng ký bộ gửi dry-run");
  if (!/registerEmailTransport\("dry-run"[\s\S]{0,160}?deliverable: false,/.test(source)) thieu.push("dry-run phải khai deliverable: false");
  if (!/options\.dryRunMarksSent !== true/.test(source)) thieu.push("thiếu cổng chặn: bộ gửi không gửi thật thì ⛔ không được nhặt thư lên");
  if (!/const name = text\(options\.provider\)\.toLowerCase\(\) \|\| \(ready \? "smtp" : "dry-run"\);/.test(source)) thieu.push("chưa mặc định về dry-run khi SMTP chưa sẵn sàng");
  if (thieu.length) throw new Error(`Cổng mặc-định-không-gửi-thật HỎNG: ${thieu.join(" · ")}`);
  return true;
}

/** Cổng 3 — worker phải PHỤC HỒI thư kẹt TRƯỚC khi đọc cấu hình (MỐC 50) và ⛔ không tự bật dry-run đánh dấu đã gửi. */
function congWorker(source) {
  const thieu = [];
  const viTriPhucHoi = source.indexOf("await recoverStaleSending(database);");
  const viTriDocCauHinh = source.indexOf("SELECT * FROM email_settings WHERE id='EMAIL'");
  if (viTriPhucHoi < 0) thieu.push("worker không gọi phục hồi thư kẹt");
  if (viTriDocCauHinh < 0) thieu.push("worker không đọc cấu hình email");
  if (viTriPhucHoi >= 0 && viTriDocCauHinh >= 0 && viTriPhucHoi > viTriDocCauHinh) thieu.push("phục hồi thư kẹt phải chạy TRƯỚC khi đọc cấu hình");
  if (/dryRunMarksSent: true/.test(source)) thieu.push("worker ⛔ không được mặc định đánh dấu đã gửi khi chỉ chạy dry-run");
  if (!/onSent: approvalNotifiedHook\(database\)/.test(source)) thieu.push("thiếu móc đóng dấu approvals.notified_at sau khi gửi");
  if (thieu.length) throw new Error(`Cổng worker HỎNG: ${thieu.join(" · ")}`);
  return true;
}

test("F1 — cổng mã nguồn: lõi + worker hiện ĐỦ cả 3 vệ", () => {
  assert.equal(congChongTrung(coreSource), true);
  assert.equal(congMacDinhKhongGuiThat(coreSource), true);
  assert.equal(congWorker(dispatcherSource), true);
});

test("F2 — ĐỐI CHỨNG ÂM: gỡ vệ 'kiểm tra thư đã có' ⇒ cổng chống trùng PHẢI ĐỎ", () => {
  const hong = coreSource.replace(/const existing = await findQueuedEmail\(database, id\);/, "const existing = null;");
  assert.notEqual(hong, coreSource, "phép biến đổi phải THẬT SỰ đổi mã nguồn (nếu không thì đối chứng âm rỗng)");
  assert.throws(() => congChongTrung(hong), /Cổng chống trùng HỎNG/);
});

test("F3 — ĐỐI CHỨNG ÂM: đổi dry-run thành deliverable:true ⇒ cổng mặc-định-không-gửi-thật PHẢI ĐỎ", () => {
  const hong = coreSource.replace(/(registerEmailTransport\("dry-run"[\s\S]{0,160}?)deliverable: false,/, "$1deliverable: true,");
  assert.notEqual(hong, coreSource, "phép biến đổi phải THẬT SỰ đổi mã nguồn");
  assert.throws(() => congMacDinhKhongGuiThat(hong), /Cổng mặc-định-không-gửi-thật HỎNG/);
});

test("F4 — ĐỐI CHỨNG ÂM: đảo phục hồi thư kẹt xuống SAU khi đọc cấu hình ⇒ cổng worker PHẢI ĐỎ", () => {
  const hong = dispatcherSource
    .replace("const recovery = await recoverStaleSending(database);", "const recovery = { recovered: 0 };")
    .replace("const settings = await dbFirst(database, `SELECT * FROM email_settings WHERE id='EMAIL'`);", "const settings = await dbFirst(database, `SELECT * FROM email_settings WHERE id='EMAIL'`); await recoverStaleSending(database);");
  assert.notEqual(hong, dispatcherSource, "phép biến đổi phải THẬT SỰ đổi mã nguồn");
  assert.throws(() => congWorker(hong), /Cổng worker HỎNG/);
});
