// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { createConnection } from "node:net";
import { createInterface } from "node:readline";
import { connect as connectTls } from "node:tls";
import { createHash, randomUUID, webcrypto } from "node:crypto";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

let dispatching = false;

async function decryptPassword(value, secret) {
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
  const iterator = lines[Symbol.asyncIterator]();
  return { lines, iterator };
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
  return `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;
}

function messageSource(settings, message) {
  const boundary = `mep-${randomUUID()}`;
  const safeSender = String(settings.sender_email).replace(/[\r\n]/g, "");
  const safeRecipients = message.recipients.map((value) => String(value).replace(/[\r\n]/g, ""));
  const source = [
    `From: ${encodedHeader(settings.sender_name || VNTECH_IDENTITY.productName)} <${safeSender}>`,
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
    Buffer.from(message.textBody, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(message.htmlBody, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return source.split("\r\n").map((line) => line.startsWith(".") ? `.${line}` : line).join("\r\n");
}

async function sendSmtp(settings, message) {
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
    await writeCommand(socket, reader, `MAIL FROM:<${settings.sender_email}>`, [250]);
    for (const recipient of message.recipients) await writeCommand(socket, reader, `RCPT TO:<${recipient}>`, [250, 251]);
    await writeCommand(socket, reader, "DATA", [354]);
    socket.write(`${messageSource(settings, message)}\r\n.\r\n`);
    await readReply(reader, [250]);
    await writeCommand(socket, reader, "QUIT", [221]);
  } finally {
    reader.lines.close();
    socket.destroy();
  }
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function dbFirst(database, sql, ...binds) {
  return database.prepare(sql).bind(...binds).first();
}
async function dbAll(database, sql, ...binds) {
  const result = await database.prepare(sql).bind(...binds).all();
  return result.results ?? [];
}
async function queueOverdueReminders(database, settings) {
  const stamp = new Date().toISOString();
  const rows = await dbAll(database, `SELECT a.id AS approval_id,a.request_id,a.stage,a.due_at,mr.request_no,p.code AS project_code,p.name AS project_name,u.full_name AS requester_name,r.emails FROM approvals a JOIN material_requests mr ON mr.id=a.request_id JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by JOIN approval_email_recipients r ON r.project_id=mr.project_id AND r.stage=a.stage AND r.active=1 WHERE a.status='pending' AND a.queued_at IS NOT NULL AND a.due_at<? AND a.reminder_sent_at IS NULL AND mr.status='pending_approval' AND mr.approval_stage=a.stage`, stamp);
  for (const row of rows) {
    const recipients = String(row.emails || "").split(",").map((item) => item.trim()).filter(Boolean);
    if (!recipients.length) continue;
    const link = `${String(settings.base_url || process.env.VNTECH_PUBLIC_URL || "http://localhost:8787").replace(/\/$/, "")}/?request=${encodeURIComponent(row.request_id)}`;
    const deadline = new Date(row.due_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const subject = `[QUÁ HẠN] ${row.request_no} chưa duyệt cấp ${row.stage}`;
    const textBody = `Phiếu ${row.request_no} đã quá hạn duyệt cấp ${row.stage}. Hạn xử lý: ${deadline}. Dự án: ${row.project_code} - ${row.project_name}. Mở phiếu: ${link}`;
    const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:640px"><h2 style="color:#c33">Phiếu đã quá hạn phê duyệt</h2><p><b>${escapeHtml(row.request_no)}</b> · Cấp ${row.stage}</p><p>Dự án: ${escapeHtml(row.project_code)} · ${escapeHtml(row.project_name)}</p><p>Hạn xử lý: <b>${escapeHtml(deadline)}</b></p><p><a href="${escapeHtml(link)}">Mở phiếu trong phần mềm</a></p></div>`;
    await database.batch([
      database.prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(`MAIL_${randomUUID()}`, row.request_id, row.stage, "overdue", recipients.join(","), subject, textBody, htmlBody, "queued", 0, stamp, stamp, null, null, stamp, stamp),
      database.prepare(`UPDATE approvals SET reminder_sent_at=?,updated_at=? WHERE id=?`).bind(stamp, stamp, row.approval_id),
    ]);
  }
}

export async function dispatchEmailOutbox(database, emailSecret) {
  if (dispatching) return;
  dispatching = true;
  try {
    const settings = await dbFirst(database, `SELECT * FROM email_settings WHERE id='EMAIL'`);
    if (!settings || !Number(settings.enabled) || !settings.smtp_host || !settings.sender_email) return;
    settings.password = await decryptPassword(settings.password, emailSecret);
    const stamp = new Date().toISOString();
    await database.prepare(`UPDATE email_outbox SET status='queued',updated_at=? WHERE status='sending' AND updated_at<?`).bind(stamp, new Date(Date.now() - 5 * 60000).toISOString()).run();
    await queueOverdueReminders(database, settings);
    const messages = await dbAll(database, `SELECT * FROM email_outbox WHERE status IN ('queued','failed') AND attempt_count<3 AND (next_attempt_at IS NULL OR next_attempt_at<=?) ORDER BY queued_at LIMIT 10`, stamp);
    for (const message of messages) {
      const claimed = await database.prepare(`UPDATE email_outbox SET status='sending',updated_at=? WHERE id=? AND status IN ('queued','failed')`).bind(stamp, message.id).run();
      if (!Number(claimed.meta?.changes || 0)) continue;
      try {
        await sendSmtp(settings, { subject: message.subject, textBody: message.text_body, htmlBody: message.html_body, recipients: String(message.recipients).split(",").map((item) => item.trim()).filter(Boolean) });
        const sentAt = new Date().toISOString();
        await database.prepare(`UPDATE email_outbox SET status='sent',sent_at=?,last_error=NULL,updated_at=? WHERE id=?`).bind(sentAt, sentAt, message.id).run();
        if (message.event === "approval_requested" && message.request_id && message.stage) await database.prepare(`UPDATE approvals SET notified_at=?,updated_at=? WHERE request_id=? AND stage=?`).bind(sentAt, sentAt, message.request_id, message.stage).run();
      } catch (error) {
        const attempts = Number(message.attempt_count) + 1;
        const retryAt = new Date(Date.now() + attempts * 5 * 60000).toISOString();
        const detail = (error instanceof Error ? error.message : String(error)).slice(0, 500);
        await database.prepare(`UPDATE email_outbox SET status='failed',attempt_count=?,next_attempt_at=?,last_error=?,updated_at=? WHERE id=?`).bind(attempts, retryAt, detail, new Date().toISOString(), message.id).run();
        console.error(`Khong gui duoc email ${message.id}: ${detail}`);
      }
    }
  } finally {
    dispatching = false;
  }
}
