// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
//
// LÕI THÔNG BÁO EMAIL (email notification core) — V5.3.0 MASTER BASELINE.
//
// VÌ SAO TỆP NÀY TỒN TẠI
//   Trước đây mọi mảnh của "gửi email" nằm rải rác: `scripts/system-route.mjs` tự dựng
//   subject/body bằng chuỗi nối tay (3 chỗ khác nhau), `scripts/email-dispatcher.mjs` tự mở
//   socket SMTP, và KHÔNG có chỗ nào gom 4 việc luôn đi cùng nhau:
//     (1) dựng nội dung thư từ một SỰ KIỆN NGHIỆP VỤ theo MẪU DÙNG CHUNG;
//     (2) đưa thư vào hàng đợi `email_outbox` một cách IDEMPOTENT (có khoá chống trùng);
//     (3) GỬI qua bộ gửi (transport) CẮM ĐƯỢC — mặc định "không gửi thật" khi chưa cấu hình SMTP;
//     (4) THỬ LẠI có giới hạn + ghi trạng thái/lỗi lại vào hàng đợi.
//   Tệp này là nguồn sự thật DUY NHẤT cho 4 việc đó; `email-dispatcher.mjs` (worker JS) chỉ còn
//   là lớp vỏ mỏng gọi vào đây, nên đường chạy thật và đường kiểm thử dùng CHUNG một mã.
//
// ⛔ KHÔNG thêm bảng mới: toàn bộ trạng thái nằm trong `email_outbox` sẵn có
//    (drizzle/0004_email_approval_sla.sql · V1__baseline.sql) với 16 cột:
//    id, request_id, stage, event, recipients, subject, text_body, html_body, status,
//    attempt_count, next_attempt_at, queued_at, sent_at, last_error, created_at, updated_at.
// ⛔ KHÔNG tự gửi SMTP từ use-case nghiệp vụ: chỉ XẾP THƯ vào hàng đợi (đúng khuôn Java
//    `NotificationStoreAdapter.insertNotificationEmail`).
import { createConnection } from "node:net";
import { createInterface } from "node:readline";
import { connect as connectTls } from "node:tls";
import { createHash, randomUUID, webcrypto } from "node:crypto";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

// ─────────────────────────── 1. CHÍNH SÁCH (một chỗ khai báo) ───────────────────────────
/** Số lần thử TỐI ĐA cho một thư trước khi nằm lại ở trạng thái `failed` vĩnh viễn. */
export const EMAIL_MAX_ATTEMPTS = 3;
/** Giãn cách thử lại cơ sở: lần thứ n chờ `n × 5 phút`. */
export const EMAIL_RETRY_BASE_MS = 5 * 60 * 1000;
/** Trần giãn cách thử lại (1 giờ) — chặn lui vô hạn khi số lần thử tăng. */
export const EMAIL_RETRY_MAX_MS = 60 * 60 * 1000;
/** Số thư nhặt ra mỗi lượt gửi. */
export const EMAIL_BATCH_LIMIT = 10;
/** Thư nằm ở `sending` quá lâu ⇒ coi như tiến trình trước đã chết, trả về `queued`. */
export const EMAIL_STALE_SENDING_MS = 5 * 60 * 1000;
/** Dấu vết ghi vào `last_error` khi thư được xử lý ở chế độ KHÔNG gửi thật. */
export const EMAIL_DRY_RUN_MARK = "[dry-run] Chưa cấu hình SMTP — thư KHÔNG được gửi thật.";
/** Tên hiển thị của sản phẩm trong thư (lấy từ SSOT định danh, không chốt cứng). */
export const EMAIL_PRODUCT_NAME = VNTECH_IDENTITY?.productName || "VNTECH ERP";

const LEGAL_OWNER = VNTECH_IDENTITY?.legalOwner || "VNTECH";
const PRODUCT_ID = VNTECH_IDENTITY?.productId || "VNTECH-KHO-MEP-001";

// ─────────────────────────── 2. GHI LOG (cắm được, mặc định ra console) ───────────────────────────
function writeLog(sink, level, message) {
  const fn = typeof sink?.[level] === "function" ? sink[level] : sink?.log;
  if (typeof fn !== "function") return;
  try {
    fn.call(sink, message);
  } catch {
    // ⛔ Ghi log hỏng KHÔNG được làm hỏng việc gửi thư.
  }
}

/** Bọc một `sink` (console/logger khác) thành bộ ghi log 4 mức dùng chung. */
export function createEmailLogger(sink = console) {
  return {
    debug: (message) => writeLog(sink, "debug", message),
    info: (message) => writeLog(sink, "info", message),
    warn: (message) => writeLog(sink, "warn", message),
    error: (message) => writeLog(sink, "error", message),
  };
}

/** Bộ ghi log GIỮ LẠI NỘI DUNG trong bộ nhớ — dùng cho kiểm thử (không cần mạng). */
export function createMemoryEmailLogger() {
  const lines = [];
  const push = (level) => (message) => lines.push(`${level}: ${message}`);
  return {
    lines,
    logger: { debug: push("debug"), info: push("info"), warn: push("warn"), error: push("error") },
  };
}

export const defaultEmailLogger = createEmailLogger(console);

// ─────────────────────────── 3. CHUẨN HOÁ DỮ LIỆU ───────────────────────────
function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

/** Văn bản tự do: gộp khoảng trắng thừa, giữ nội dung. */
export function cleanText(value) {
  return text(value).replace(/\s+/g, " ");
}

/**
 * Văn bản đi vào TIÊU ĐỀ thư: ⛔ bắt buộc cắt CR/LF/TAB.
 * Không có bước này thì một `subject` chứa `\r\nBcc: ke-gian@x.com` sẽ TIÊM THÊM header SMTP.
 */
export function sanitizeHeader(value) {
  return text(value).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Ngày giờ theo giờ Việt Nam; giá trị rỗng/không hợp lệ ⇒ "—" (⛔ không bịa ngày). */
export function formatDateTime(value) {
  const raw = text(value);
  if (!raw) return "—";
  const moment = new Date(raw);
  if (Number.isNaN(moment.getTime())) return raw;
  return moment.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Số tiền kiểu Việt Nam; không phải số ⇒ chuỗi rỗng (để dòng đó tự biến mất). */
export function formatCurrency(value) {
  if (value === null || value === undefined || text(value) === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

// ─────────────────────────── 4. NGƯỜI NHẬN ───────────────────────────
// ⛔ Khuôn địa chỉ loại luôn khoảng trắng/CR/LF/dấu phân cách ⇒ vừa khử trùng vừa chống tiêm header.
const EMAIL_PATTERN = /^[^\s@,;:<>"\\[\]]+@[^\s@,;:<>"\\[\]]+\.[A-Za-z]{2,}$/;

/**
 * Nhận chuỗi ("a@x.com, b@y.vn") hoặc mảng ⇒ danh sách email ĐÃ chuẩn hoá, KHỬ TRÙNG, giữ thứ tự.
 * ⛔ CHỈ tách theo dấu phẩy/chấm phẩy (đúng khuôn `emailsFrom` của repo): một mẩu còn khoảng trắng
 *    — ví dụ `"a@x.com\r\nBcc: ke-gian@x.com"` — bị LOẠI NGUYÊN MẨU, ⛔ không cắt thành 2 người nhận.
 */
export function normalizeEmailRecipients(value) {
  const items = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const output = [];
  for (const item of items) {
    for (const piece of String(item ?? "").split(/[,;]+/)) {
      const email = text(piece).toLowerCase();
      if (!EMAIL_PATTERN.test(email) || seen.has(email)) continue;
      seen.add(email);
      output.push(email);
    }
  }
  return output;
}

// ─────────────────────────── 5. MẪU THƯ DÙNG CHUNG ───────────────────────────
export const EMAIL_EVENTS = Object.freeze({
  APPROVAL_REQUESTED: "approval_requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  OVERDUE: "overdue",
  TASK_ASSIGNED: "task_assigned",
  SYSTEM_NOTIFICATION: "system_notification",
  TEST: "test",
});

export const EMAIL_TEMPLATE_KEYS = Object.freeze([...Object.values(EMAIL_EVENTS), "generic"]);

function stageNo(context) {
  const stage = Number(context?.stage);
  return Number.isFinite(stage) && stage > 0 ? String(Math.trunc(stage)) : "?";
}

function pick(...values) {
  for (const value of values) {
    const candidate = cleanText(value);
    if (candidate) return candidate;
  }
  return "";
}

function projectLine(context) {
  const code = cleanText(context?.projectCode);
  const name = cleanText(context?.projectName);
  return pick([code, name].filter(Boolean).join(" · "), "—");
}

/** Các dòng nhãn/giá trị của phiếu đề nghị vật tư (dùng lại cho 3 mốc duyệt). */
function requestRows(context) {
  return [
    ["Phiếu", pick(context?.requestNo, context?.requestId)],
    ["Dự án", projectLine(context)],
    ["Người đề nghị", pick(context?.requesterName)],
    ["Ngày cần", pick(context?.neededAt)],
    ["Khu vực", pick(context?.area)],
    ["Số dòng / Giá trị", [context?.itemCount ? `${cleanText(context.itemCount)} dòng` : "", formatCurrency(context?.total)].filter(Boolean).join(" · ")],
  ];
}

/**
 * SỔ MẪU THƯ: mỗi sự kiện nghiệp vụ ⇒ một hàm dựng `{subject,title,subtitle,rows,paragraphs,linkLabel,note}`.
 * Thêm sự kiện mới = thêm MỘT mục ở đây; ⛔ KHÔNG nối chuỗi rải rác trong route.
 */
export const EMAIL_TEMPLATES = Object.freeze({
  [EMAIL_EVENTS.APPROVAL_REQUESTED]: (context) => ({
    subject: `[DNMH] ${pick(context?.requestNo, "Phiếu")} chờ ${pick(context?.department, `bước ${stageNo(context)}`)} duyệt`,
    title: `Chờ duyệt bước ${stageNo(context)} – ${pick(context?.department, `Bước ${stageNo(context)}`)}`,
    subtitle: pick(context?.requestNo, context?.requestId),
    rows: [...requestRows(context), ["Hạn xử lý", context?.deadline || context?.dueAt ? formatDateTime(context?.deadline || context?.dueAt) : ""]],
    paragraphs: [],
    linkLabel: "Mở phiếu trong phần mềm",
    note: "Thư do hệ thống gửi tự động khi phiếu tới bước duyệt của bạn.",
  }),
  [EMAIL_EVENTS.APPROVED]: (context) => ({
    subject: `[DNMH] ${pick(context?.requestNo, "Phiếu")} đã hoàn tất phê duyệt`,
    title: "Đã hoàn tất luồng phê duyệt",
    subtitle: pick(context?.requestNo, context?.requestId),
    rows: requestRows(context),
    paragraphs: [pick(context?.detail)],
    linkLabel: "Mở phiếu trong phần mềm",
    note: "Thư do hệ thống gửi tự động khi phiếu được duyệt xong toàn bộ các bước.",
  }),
  [EMAIL_EVENTS.REJECTED]: (context) => ({
    subject: `[DNMH] ${pick(context?.requestNo, "Phiếu")} bị từ chối`,
    title: `Bị từ chối tại bước ${stageNo(context)}`,
    subtitle: pick(context?.requestNo, context?.requestId),
    rows: [...requestRows(context), ["Người từ chối", pick(context?.actorName)], ["Lý do", pick(context?.reason, context?.detail)]],
    paragraphs: [],
    linkLabel: "Mở phiếu trong phần mềm",
    note: "Thư do hệ thống gửi tự động khi phiếu bị trả lại.",
  }),
  [EMAIL_EVENTS.OVERDUE]: (context) => ({
    subject: `[QUÁ HẠN] ${pick(context?.requestNo, "Phiếu")} chưa duyệt cấp ${stageNo(context)}`,
    title: "Phiếu đã quá hạn phê duyệt",
    subtitle: pick(context?.requestNo, context?.requestId),
    rows: [
      ["Cấp duyệt", pick(context?.stage)],
      ["Dự án", projectLine(context)],
      ["Hạn xử lý", formatDateTime(context?.deadline || context?.dueAt)],
    ],
    paragraphs: [],
    linkLabel: "Mở phiếu trong phần mềm",
    note: "Thư nhắc tự động: phiếu đã quá hạn xử lý ở bước duyệt này.",
  }),
  [EMAIL_EVENTS.TASK_ASSIGNED]: (context) => ({
    subject: `[${EMAIL_PRODUCT_NAME}] ${pick(context?.taskNo, "Nhiệm vụ")} - ${pick(context?.title, "Công việc mới")}`,
    title: pick(context?.title, "Bạn được giao công việc mới"),
    subtitle: pick(context?.taskNo),
    rows: [
      ["Dự án", projectLine(context)],
      ["Người giao", pick(context?.actorName)],
      ["Thời điểm giao", context?.assignedAt ? formatDateTime(context?.assignedAt) : ""],
      ["Hạn hoàn thành", context?.dueText ? formatDateTime(context?.dueText) : ""],
      ["Ưu tiên", pick(context?.priority)],
      ["Chứng từ gốc", pick(context?.sourceNo)],
    ],
    paragraphs: [pick(context?.detail)],
    linkLabel: "Mở nhiệm vụ",
    note: "Thư do hệ thống gửi tự động khi bạn được giao việc.",
  }),
  [EMAIL_EVENTS.SYSTEM_NOTIFICATION]: (context) => ({
    subject: `[${EMAIL_PRODUCT_NAME}] ${pick(context?.title, "Thông báo hệ thống")}`,
    title: pick(context?.title, "Thông báo hệ thống"),
    subtitle: pick(context?.subtitle),
    rows: [],
    paragraphs: [pick(context?.message, context?.detail)],
    linkLabel: "Mở phần mềm",
    note: pick(context?.note),
  }),
  [EMAIL_EVENTS.TEST]: (context) => ({
    subject: `[${EMAIL_PRODUCT_NAME}] Kiểm tra cấu hình gửi email`,
    title: "Kiểm tra cấu hình gửi email",
    subtitle: PRODUCT_ID,
    rows: [["Thời điểm lưu cấu hình", context?.savedAt ? formatDateTime(context?.savedAt) : ""]],
    paragraphs: [`Cấu hình gửi email của ${EMAIL_PRODUCT_NAME} (${PRODUCT_ID}) đã hoạt động. Đây là thư kiểm tra từ máy chủ nội bộ của công ty.`],
    linkLabel: "",
    note: "Nếu bạn nhận được thư này, cấu hình SMTP đang đúng.",
  }),
  generic: (context) => ({
    subject: `[${EMAIL_PRODUCT_NAME}] ${pick(context?.title, context?.subject, "Thông báo")}`,
    title: pick(context?.title, "Thông báo"),
    subtitle: pick(context?.subtitle, context?.requestNo, context?.taskNo),
    rows: Array.isArray(context?.rows) ? context.rows : [],
    paragraphs: [pick(context?.message, context?.detail)],
    linkLabel: pick(context?.linkLabel, "Mở phần mềm"),
    note: pick(context?.note),
  }),
});

// ─────────────────────────── 6. DỰNG THƯ (một mô hình ⇒ cả TEXT lẫn HTML) ───────────────────────────
function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  const output = [];
  for (const row of rows) {
    const label = cleanText(Array.isArray(row) ? row[0] : row?.label);
    const value = cleanText(Array.isArray(row) ? row[1] : row?.value);
    if (!label || !value) continue;
    output.push({ label, value });
  }
  return output;
}

/** Đường dẫn mở hồ sơ trong phần mềm: ưu tiên `context.link`, rồi `?request=` / `?task=`. */
function linkOf(context, label) {
  const base = text(context?.baseUrl).replace(/\/+$/, "");
  const explicit = text(context?.link);
  let url = explicit;
  if (!url && base) {
    if (text(context?.requestId)) url = `${base}/?request=${encodeURIComponent(text(context.requestId))}`;
    else if (text(context?.taskId)) url = `${base}/?task=${encodeURIComponent(text(context.taskId))}`;
  }
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return { url, label: sanitizeHeader(label) || "Mở phần mềm" };
}

/** Dựng MÔ HÌNH thư (dữ liệu thuần) từ sự kiện nghiệp vụ + ngữ cảnh. */
export function buildEmailModel(event, context = {}) {
  const key = text(event).toLowerCase();
  const builder = EMAIL_TEMPLATES[key] ?? EMAIL_TEMPLATES.generic;
  const part = builder(context ?? {}) ?? {};
  const subject = sanitizeHeader(part.subject) || `${EMAIL_PRODUCT_NAME}: thông báo`;
  const title = cleanText(part.title) || subject;
  return {
    event: key || "generic",
    subject,
    title,
    subtitle: cleanText(part.subtitle),
    rows: normalizeRows(part.rows),
    paragraphs: (Array.isArray(part.paragraphs) ? part.paragraphs : []).map(cleanText).filter(Boolean),
    link: linkOf(context, part.linkLabel),
    note: cleanText(part.note),
  };
}

/** Bản TEXT (thư thuần) — suy ra từ CÙNG mô hình với bản HTML nên hai bản không thể lệch nhau. */
export function renderEmailText(model) {
  const lines = [model.title];
  if (model.subtitle) lines.push(model.subtitle);
  if (model.rows.length) {
    lines.push("");
    for (const row of model.rows) lines.push(`${row.label}: ${row.value}`);
  }
  if (model.paragraphs.length) {
    lines.push("");
    lines.push(...model.paragraphs);
  }
  if (model.link) {
    lines.push("");
    lines.push(`${model.link.label}: ${model.link.url}`);
  }
  if (model.note) {
    lines.push("");
    lines.push(model.note);
  }
  return lines.join("\n");
}

/** Bản HTML — MỌI giá trị động đều đi qua `escapeHtml` (⛔ không nội suy thô). */
export function renderEmailHtml(model) {
  const rows = model.rows
    .map((row) => `<tr><td style="padding:7px 0;color:#6b8190">${escapeHtml(row.label)}</td><td style="padding:7px 0"><b>${escapeHtml(row.value)}</b></td></tr>`)
    .join("");
  const paragraphs = model.paragraphs.map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`).join("");
  const link = model.link
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(model.link.url)}" style="background:#0b78be;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px">${escapeHtml(model.link.label)}</a></p>`
    : "";
  const note = model.note ? `<p style="margin:16px 0 0;color:#6b8190;font-size:13px">${escapeHtml(model.note)}</p>` : "";
  return [
    `<div style="font-family:Arial,sans-serif;max-width:680px;color:#173f58">`,
    `<div style="background:#0b78be;color:#ffffff;padding:16px 20px"><b>${escapeHtml(EMAIL_PRODUCT_NAME)}</b><div style="font-size:18px;margin-top:6px">${escapeHtml(model.title)}</div></div>`,
    `<div style="border:1px solid #d9e4ea;padding:20px">`,
    model.subtitle ? `<h2 style="margin:0 0 14px">${escapeHtml(model.subtitle)}</h2>` : "",
    rows ? `<table style="width:100%;border-collapse:collapse">${rows}</table>` : "",
    paragraphs,
    link,
    note,
    `</div>`,
    `<div style="color:#6b8190;font-size:11px;padding:10px 20px">${escapeHtml(LEGAL_OWNER)} · ${escapeHtml(PRODUCT_ID)}</div>`,
    `</div>`,
  ]
    .filter(Boolean)
    .join("");
}

/** Dựng thẳng thư hoàn chỉnh (subject + 2 bản body) từ sự kiện + ngữ cảnh. */
export function renderEmailMessage(event, context = {}) {
  const model = buildEmailModel(event, context);
  return { event: model.event, subject: model.subject, textBody: renderEmailText(model), htmlBody: renderEmailHtml(model), model };
}

/** Gói một THƯ SẴN SÀNG XẾP HÀNG ĐỢI: người nhận đã chuẩn hoá + nội dung + khoá hồ sơ. */
export function buildEmailMessage({ event, recipients, context = {} } = {}) {
  const rendered = renderEmailMessage(event, context);
  const stage = Number(context?.stage);
  return {
    event: rendered.event,
    recipients: normalizeEmailRecipients(recipients ?? context?.recipients),
    subject: rendered.subject,
    textBody: rendered.textBody,
    htmlBody: rendered.htmlBody,
    requestId: text(context?.requestId) || null,
    stage: Number.isFinite(stage) && stage > 0 ? Math.trunc(stage) : null,
  };
}

// ─────────────────────────── 7. HÀNG ĐỢI: KHOÁ CHỐNG TRÙNG + XẾP THƯ IDEMPOTENT ───────────────────────────
async function dbFirst(database, sql, ...binds) {
  return database.prepare(sql).bind(...binds).first();
}
async function dbAll(database, sql, ...binds) {
  const result = await database.prepare(sql).bind(...binds).all();
  return result?.results ?? [];
}

/**
 * KHOÁ CHỐNG TRÙNG: băm (sự kiện · hồ sơ · bước · người nhận).
 * Cùng một sự kiện nghiệp vụ gửi cho cùng nhóm người nhận ⇒ CÙNG một khoá ⇒ không nhân bản thư.
 */
export function emailDedupeKey(message) {
  const parts = [
    text(message?.event).toLowerCase(),
    text(message?.requestId),
    message?.stage === null || message?.stage === undefined ? "" : String(message.stage),
    normalizeEmailRecipients(message?.recipients).join(","),
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

/** Khoá chính của dòng `email_outbox`: `MAIL-NOTI_<24 hex>` (34 ký tự, thừa sức chứa VARCHAR(64)). */
export function emailOutboxId(message) {
  return text(message?.id) || `MAIL-NOTI_${emailDedupeKey(message)}`;
}

function requireEmailContent(message) {
  if (!text(message?.subject)) throw new Error("Thư thông báo thiếu tiêu đề (subject).");
  if (!text(message?.textBody) && !text(message?.htmlBody)) throw new Error("Thư thông báo thiếu nội dung (text_body/html_body).");
}

/**
 * Lỗi "đã có thư này rồi" (hai tiến trình cùng chèn) — CHỈ nhận diện lỗi TRÙNG KHOÁ.
 * ⛔ KHÔNG được nhận diện chung chung mọi lỗi ràng buộc: lỗi khoá ngoại (`FOREIGN KEY constraint
 * failed`) là LỖI THẬT (ví dụ `request_id` trỏ vào phiếu không tồn tại) — nuốt nó đi thì thư
 * biến mất âm thầm mà hàng đợi vẫn "sạch".
 */
function isDuplicateKeyError(error) {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return /unique constraint failed|primary key constraint failed|duplicate entry|duplicate key name|er_dup_entry/i.test(detail);
}

/** Câu lệnh INSERT dùng lại được (ví dụ để nằm trong `database.batch` cùng giao dịch khác). */
export function emailInsertStatement(database, message, options = {}) {
  requireEmailContent(message);
  const recipients = normalizeEmailRecipients(message?.recipients);
  if (!recipients.length) throw new Error("Thư thông báo không có người nhận hợp lệ.");
  const stamp = options.now ?? new Date().toISOString();
  return database
    .prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(emailOutboxId(message), message.requestId ?? null, message.stage ?? null, message.event, recipients.join(","), message.subject, message.textBody, message.htmlBody, "queued", 0, stamp, stamp, null, null, stamp, stamp);
}

/** Đọc nhanh một thư trong hàng đợi theo khoá chống trùng. */
export async function findQueuedEmail(database, id) {
  return dbFirst(database, `SELECT id,status,attempt_count AS attemptCount FROM email_outbox WHERE id=?`, text(id));
}

/**
 * XẾP THƯ VÀO HÀNG ĐỢI — IDEMPOTENT.
 * Gọi 1 lần hay 10 lần cho cùng sự kiện ⇒ hàng đợi vẫn CHỈ có 1 thư.
 * Trả về `{queued, id, deduped, reason}` — ⛔ không ném lỗi khi chỉ là "đã có thư rồi".
 */
export async function enqueueEmail(database, message, options = {}) {
  const id = emailOutboxId(message);
  const existing = await findQueuedEmail(database, id);
  if (existing) {
    if (existing.status === "failed" && options.requeueFailed === true) {
      const stamp = options.now ?? new Date().toISOString();
      await database.prepare(`UPDATE email_outbox SET status='queued',attempt_count=0,next_attempt_at=?,last_error=NULL,updated_at=? WHERE id=?`).bind(stamp, stamp, id).run();
      return { queued: true, id, deduped: false, requeued: true, reason: "requeued" };
    }
    return { queued: false, id, deduped: true, reason: "duplicate", status: existing.status };
  }
  const recipients = normalizeEmailRecipients(message?.recipients);
  if (!recipients.length) return { queued: false, id: null, deduped: false, reason: "no_recipients" };
  requireEmailContent(message);
  try {
    await emailInsertStatement(database, { ...message, recipients }, options).run();
  } catch (error) {
    // Hai tiến trình cùng xếp một thư ⇒ khoá chính chặn: vẫn là "đã có thư", KHÔNG phải lỗi.
    if (isDuplicateKeyError(error)) return { queued: false, id, deduped: true, reason: "duplicate" };
    throw error;
  }
  return { queued: true, id, deduped: false, reason: "queued" };
}

// ─────────────────────────── 8. BỘ GỬI (TRANSPORT) CẮM ĐƯỢC ───────────────────────────
const TRANSPORT_FACTORIES = new Map();

/** Đăng ký một nhà cung cấp bộ gửi mới (ví dụ `memory` cho kiểm thử, `api` cho dịch vụ ngoài). */
export function registerEmailTransport(name, factory) {
  const key = text(name).toLowerCase();
  if (!key) throw new Error("Tên bộ gửi email không được để trống.");
  if (typeof factory !== "function") throw new Error(`Bộ gửi email "${key}" phải là một hàm dựng.`);
  TRANSPORT_FACTORIES.set(key, factory);
  return factory;
}

export function emailTransportNames() {
  return [...TRANSPORT_FACTORIES.keys()];
}

/** Cấu hình SMTP đã ĐỦ để gửi thật chưa? (bật + có máy chủ + có email người gửi) */
export function emailSettingsReady(settings) {
  if (!settings) return false;
  if (Number(settings.enabled) !== 1) return false;
  if (!text(settings.smtp_host)) return false;
  if (!text(settings.sender_email)) return false;
  return true;
}

/** Giải mã mật khẩu SMTP: `plain$...` (thô) · `aesgcm$iv$cipher` (mã hoá bằng khoá trong `.local-data`). */
export async function decryptEmailPassword(value, secret) {
  const stored = String(value || "");
  if (stored.startsWith("plain$")) return stored.slice(6);
  if (!stored.startsWith("aesgcm$")) return stored;
  if (!secret) throw new Error("Thiếu khóa bảo vệ mật khẩu SMTP trong thư mục dữ liệu.");
  const [, ivHex, cipherHex] = stored.split("$");
  const keyBytes = createHash("sha256").update(secret).digest();
  const key = await webcrypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const decrypted = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: Buffer.from(ivHex, "hex") }, key, Buffer.from(cipherHex, "hex"));
  return Buffer.from(decrypted).toString("utf8");
}

function openSocket(settings) {
  const options = { host: settings.smtp_host, port: Number(settings.smtp_port), servername: settings.smtp_host, timeout: 15000 };
  return new Promise((resolve, reject) => {
    const socket = settings.security === "tls" ? connectTls(options, () => resolve(socket)) : createConnection(options, () => resolve(socket));
    socket.once("error", reject);
    socket.once("timeout", () => socket.destroy(new Error("Máy chủ SMTP không phản hồi trong 15 giây.")));
  });
}

function responseReader(socket) {
  const lines = createInterface({ input: socket, crlfDelay: Infinity });
  return { lines, iterator: lines[Symbol.asyncIterator]() };
}

async function readReply(reader, accepted) {
  const messages = [];
  while (true) {
    const { value, done } = await reader.iterator.next();
    if (done) throw new Error("Kết nối SMTP đã đóng trước khi hoàn tất.");
    messages.push(value);
    if (/^\d{3} /.test(value)) break;
  }
  const code = Number(String(messages.at(-1)).slice(0, 3));
  if (!accepted.includes(code)) throw new Error(`SMTP ${code}: ${messages.join(" | ").slice(0, 400)}`);
  return messages;
}

async function writeCommand(socket, reader, command, accepted) {
  socket.write(`${command}\r\n`);
  return readReply(reader, accepted);
}

function encodedHeader(value) {
  return `=?UTF-8?B?${Buffer.from(sanitizeHeader(value), "utf8").toString("base64")}?=`;
}

/** Nguồn MIME `multipart/alternative` (bản text + bản HTML), đã chống tiêm header và chống `.` đầu dòng. */
export function buildRawMimeMessage(settings, message) {
  const boundary = `mep-${randomUUID()}`;
  const safeSender = sanitizeHeader(settings.sender_email);
  const safeRecipients = normalizeEmailRecipients(message.recipients);
  const source = [
    `From: ${encodedHeader(settings.sender_name || EMAIL_PRODUCT_NAME)} <${safeSender}>`,
    `To: ${safeRecipients.join(", ")}`,
    `Subject: ${encodedHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@vntech-erp.local>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message.textBody ?? "", "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message.htmlBody ?? "", "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return source.split("\r\n").map((line) => (line.startsWith(".") ? `.${line}` : line)).join("\r\n");
}

/** Gửi THẬT qua SMTP (EHLO · STARTTLS/AUTH LOGIN khi cần · DATA). */
export async function sendSmtpMessage(settings, message) {
  let socket = await openSocket(settings);
  let reader = responseReader(socket);
  try {
    await readReply(reader, [220]);
    await writeCommand(socket, reader, "EHLO vntech-erp.local", [250]);
    if (settings.security === "starttls") {
      await writeCommand(socket, reader, "STARTTLS", [220]);
      reader.lines.close();
      socket = await new Promise((resolve, reject) => {
        const secured = connectTls({ socket, servername: settings.smtp_host, timeout: 15000 }, () => resolve(secured));
        secured.once("error", reject);
      });
      reader = responseReader(socket);
      await writeCommand(socket, reader, "EHLO vntech-erp.local", [250]);
    }
    if (settings.username) {
      await writeCommand(socket, reader, "AUTH LOGIN", [334]);
      await writeCommand(socket, reader, Buffer.from(settings.username).toString("base64"), [334]);
      await writeCommand(socket, reader, Buffer.from(settings.password || "").toString("base64"), [235]);
    }
    await writeCommand(socket, reader, `MAIL FROM:<${sanitizeHeader(settings.sender_email)}>`, [250]);
    for (const recipient of normalizeEmailRecipients(message.recipients)) await writeCommand(socket, reader, `RCPT TO:<${recipient}>`, [250, 251]);
    await writeCommand(socket, reader, "DATA", [354]);
    socket.write(`${buildRawMimeMessage(settings, message)}\r\n.\r\n`);
    await readReply(reader, [250]);
    await writeCommand(socket, reader, "QUIT", [221]);
  } finally {
    reader.lines.close();
    socket.destroy();
  }
}

// Nhà cung cấp mặc định #1 — SMTP thật (mật khẩu giải mã MỘT LẦN cho cả lượt gửi).
registerEmailTransport("smtp", (settings, context = {}) => {
  let credentials = null;
  const resolved = () => (credentials ??= (async () => ({ ...settings, password: await decryptEmailPassword(settings.password, context.secret) }))());
  return {
    name: "smtp",
    deliverable: true,
    async send(message) {
      await sendSmtpMessage(await resolved(), message);
      return { provider: "smtp", dryRun: false };
    },
  };
});

// Nhà cung cấp mặc định #2 — KHÔNG GỬI THẬT: chỉ ghi log rồi báo "đã xử lý".
// Dùng khi chưa cấu hình SMTP (mặc định) hoặc khi muốn chạy thử toàn tuyến mà không phát thư ra ngoài.
registerEmailTransport("dry-run", (settings, context = {}) => ({
  name: "dry-run",
  deliverable: false,
  async send(message) {
    const logger = context.logger ?? defaultEmailLogger;
    logger.info(`[email dry-run] ${normalizeEmailRecipients(message.recipients).join(", ")} · ${sanitizeHeader(message.subject)}`);
    return { provider: "dry-run", dryRun: true, messageId: `dry-run-${randomUUID()}` };
  },
}));

/**
 * Chọn bộ gửi: `options.provider` (nếu chỉ định) → SMTP khi cấu hình đã đủ → mặc định `dry-run`.
 * ⛔ Chưa cấu hình SMTP thì KHÔNG được ném lỗi và KHÔNG được mở kết nối mạng.
 */
export function resolveEmailTransport(settings, options = {}) {
  const logger = options.logger ?? defaultEmailLogger;
  const ready = emailSettingsReady(settings);
  const name = text(options.provider).toLowerCase() || (ready ? "smtp" : "dry-run");
  const factory = TRANSPORT_FACTORIES.get(name);
  if (!factory) throw new Error(`Chưa có bộ gửi email "${name}" trong sổ đăng ký (${emailTransportNames().join(", ")}).`);
  const transport = factory(settings ?? {}, { secret: options.secret, logger, dependencies: options.dependencies ?? {} });
  if (transport.deliverable !== true) logger.warn(`Kênh email: dùng bộ gửi "${transport.name}" (KHÔNG gửi thật)${ready ? "" : " — SMTP chưa cấu hình hoặc đang tắt"}.`);
  return transport;
}

// ─────────────────────────── 9. CHÍNH SÁCH THỬ LẠI ───────────────────────────
/** Lần thử thứ `attemptCount` sẽ chạy lại sau `attemptCount × 5 phút` (trần 1 giờ). */
export function nextRetryAt(attemptCount, now = new Date(), options = {}) {
  const attempts = Math.max(1, Math.trunc(Number(attemptCount) || 1));
  const base = Math.max(1000, Number(options.baseMs) || EMAIL_RETRY_BASE_MS);
  const cap = Math.max(base, Number(options.maxMs) || EMAIL_RETRY_MAX_MS);
  const moment = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return new Date(moment + Math.min(base * attempts, cap)).toISOString();
}

/** Còn lượt thử không? (mặc định trần 3 lần) */
export function shouldRetryEmail(attemptCount, options = {}) {
  const maxAttempts = Math.max(0, Number(options.maxAttempts ?? EMAIL_MAX_ATTEMPTS));
  return Number(attemptCount) < maxAttempts;
}

// ─────────────────────────── 10. VÒNG GỬI HÀNG ĐỢI ───────────────────────────
/**
 * PHỤC HỒI thư kẹt `sending` (tiến trình chết giữa chừng).
 * 📌 MỐC 50: việc phục hồi ⛔ KHÔNG liên quan tới `enabled` ⇒ luôn chạy TRƯỚC nhánh bật/tắt.
 */
export async function recoverStaleSending(database, options = {}) {
  const moment = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const stamp = moment.toISOString();
  const before = new Date(moment.getTime() - Math.max(0, Number(options.staleMs ?? EMAIL_STALE_SENDING_MS))).toISOString();
  const result = await database.prepare(`UPDATE email_outbox SET status='queued',updated_at=? WHERE status='sending' AND updated_at<?`).bind(stamp, before).run();
  return { recovered: Number(result?.meta?.changes ?? result?.changes ?? 0) };
}

/** Đếm thư đang chờ (queued + failed) — dùng cho log và cho màn "Hộp thư gửi". */
export async function countPendingEmails(database) {
  const row = await dbFirst(database, `SELECT COUNT(*) AS total FROM email_outbox WHERE status IN ('queued','failed')`);
  return Number(row?.total ?? 0);
}

/**
 * GỬI HÀNG ĐỢI: nhặt thư tới hạn → GIÀNH chỗ bằng UPDATE có điều kiện (2 worker không gửi trùng)
 * → gửi qua bộ gửi → ghi `sent` hoặc `failed` + số lần thử + thời điểm thử lại.
 */
export async function dispatchEmailQueue(database, options = {}) {
  const logger = options.logger ?? defaultEmailLogger;
  const moment = options.now instanceof Date ? options.now : new Date(options.now ?? Date.now());
  const stamp = moment.toISOString();
  const transport = options.transport ?? resolveEmailTransport(options.settings, options);
  const maxAttempts = Math.max(0, Number(options.maxAttempts ?? EMAIL_MAX_ATTEMPTS));
  const summary = { transport: transport.name, deliverable: transport.deliverable === true, recovered: 0, processed: 0, sent: 0, failed: 0, dryRun: 0, skipped: false, reason: null, pending: 0 };
  if (options.recoverStale !== false) summary.recovered = (await recoverStaleSending(database, { now: moment, staleMs: options.staleMs })).recovered;
  if (!summary.deliverable && options.dryRunMarksSent !== true) {
    summary.skipped = true;
    summary.reason = "transport_not_deliverable";
    summary.pending = await countPendingEmails(database);
    logger.info(`Kênh email: bỏ qua lượt gửi (bộ gửi "${transport.name}" không gửi thật). ${summary.pending} thư đang chờ trong email_outbox.`);
    return summary;
  }
  const limit = Math.max(1, Number(options.limit) || EMAIL_BATCH_LIMIT);
  const messages = await dbAll(database, `SELECT * FROM email_outbox WHERE status IN ('queued','failed') AND attempt_count<? AND (next_attempt_at IS NULL OR next_attempt_at<=?) ORDER BY queued_at LIMIT ?`, maxAttempts, stamp, limit);
  for (const message of messages) {
    const claimed = await database.prepare(`UPDATE email_outbox SET status='sending',updated_at=? WHERE id=? AND status IN ('queued','failed') AND attempt_count<?`).bind(stamp, message.id, maxAttempts).run();
    if (!Number(claimed?.meta?.changes ?? claimed?.changes ?? 0)) continue;
    summary.processed += 1;
    try {
      const outcome = await transport.send({
        id: message.id,
        event: message.event,
        requestId: message.request_id,
        stage: message.stage,
        recipients: normalizeEmailRecipients(message.recipients),
        subject: message.subject,
        textBody: message.text_body,
        htmlBody: message.html_body,
      });
      const sentAt = new Date().toISOString();
      const dryRun = outcome?.dryRun === true || summary.deliverable === false;
      await database.prepare(`UPDATE email_outbox SET status='sent',sent_at=?,last_error=?,updated_at=? WHERE id=?`).bind(sentAt, dryRun ? EMAIL_DRY_RUN_MARK : null, sentAt, message.id).run();
      if (dryRun) summary.dryRun += 1;
      else summary.sent += 1;
      if (typeof options.onSent === "function") await options.onSent(message, { now: new Date(sentAt), transport, dryRun });
    } catch (error) {
      const attempts = Number(message.attempt_count) + 1;
      const detail = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      await database.prepare(`UPDATE email_outbox SET status='failed',attempt_count=?,next_attempt_at=?,last_error=?,updated_at=? WHERE id=?`).bind(attempts, nextRetryAt(attempts, moment, options), detail, new Date().toISOString(), message.id).run();
      summary.failed += 1;
      logger.error(`Không gửi được email ${message.id} (lần ${attempts}/${maxAttempts}): ${detail}`);
    }
  }
  return summary;
}

// ─────────────────────────── 11. ĐIỂM NỐI SỰ KIỆN NGHIỆP VỤ ───────────────────────────
/**
 * ĐIỂM NỐI cho nghiệp vụ: "có phiếu chờ duyệt" · "duyệt xong" · "bị trả lại" · "quá hạn" · "giao việc"…
 * Một lời gọi = dựng thư theo mẫu chung + xếp hàng đợi idempotent. ⛔ KHÔNG gửi SMTP ở đây.
 *
 * @example
 *   await notifyBusinessEvent(env.DB, "approval_requested", {
 *     recipients: ["owner@vntech.vn", "cc@vntech.vn"],
 *     context: { requestId, requestNo, projectCode, projectName, stage, dueAt, baseUrl },
 *   });
 */
export async function notifyBusinessEvent(database, event, payload = {}, options = {}) {
  const logger = options.logger ?? defaultEmailLogger;
  const context = { ...(payload.context ?? payload) };
  if (payload.baseUrl && !context.baseUrl) context.baseUrl = payload.baseUrl;
  if (payload.requestId && !context.requestId) context.requestId = payload.requestId;
  if (payload.stage !== undefined && context.stage === undefined) context.stage = payload.stage;
  const message = buildEmailMessage({ event, recipients: payload.recipients ?? options.recipients, context });
  const result = await enqueueEmail(database, message, options);
  if (result.queued) logger.info(`Kênh email: xếp thư "${message.event}" vào email_outbox (${result.id}) → ${message.recipients.join(", ")}.`);
  else logger.info(`Kênh email: KHÔNG xếp thư "${message.event}" (${result.reason})${result.id ? ` · ${result.id}` : ""}.`);
  return { ...result, event: message.event, subject: message.subject, recipients: message.recipients };
}
