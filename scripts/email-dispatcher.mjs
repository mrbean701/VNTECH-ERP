// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
//
// WORKER gửi hàng đợi `email_outbox` — lớp VỎ MỎNG trên lõi `scripts/email-noti-core.mjs`.
//
// VÌ SAO RÚT GỌN TỆP NÀY
//   Trước đây tệp này vừa mở socket SMTP, vừa dựng MIME, vừa tự tính thời điểm thử lại, vừa
//   dựng nội dung thư nhắc quá hạn bằng chuỗi nối tay ⇒ cùng một luật gửi bị chép ở nhiều nơi
//   (JS worker + Java worker + route nghiệp vụ) nên sửa một chỗ là lệch ba chỗ.
//   Nay 4 việc đó nằm ở LÕI dùng chung: mẫu thư · khoá chống trùng · bộ gửi cắm được · thử lại.
//   Tệp này chỉ còn: (1) phục hồi thư kẹt, (2) xếp thư NHẮC QUÁ HẠN (nghiệp vụ phê duyệt),
//   (3) gọi lõi gửi hàng đợi, (4) móc `approvals.notified_at` sau khi gửi thành công.
//
// HỢP ĐỒNG GIỮ NGUYÊN: `dispatchEmailOutbox(database, emailSecret)` — `scripts/local-server.mjs`
//   gọi hàm này mỗi 30 giây và lúc khởi động. Hàm nay TRẢ VỀ bản tóm tắt lượt gửi (trước kia
//   trả `undefined`); nơi gọi cũ dùng `void` nên ⛔ không đổi hành vi.
import {
  buildEmailMessage,
  defaultEmailLogger,
  dispatchEmailQueue,
  emailInsertStatement,
  emailOutboxId,
  emailSettingsReady,
  findQueuedEmail,
  recoverStaleSending,
  resolveEmailTransport,
} from "./email-noti-core.mjs";

let dispatching = false;

async function dbFirst(database, sql, ...binds) {
  return database.prepare(sql).bind(...binds).first();
}
async function dbAll(database, sql, ...binds) {
  const result = await database.prepare(sql).bind(...binds).all();
  return result?.results ?? [];
}

/** Nhắc phiếu phê duyệt QUÁ HẠN: nghiệp vụ riêng của phê duyệt nên vẫn nằm ở worker. */
async function queueOverdueReminders(database, settings, logger) {
  const stamp = new Date().toISOString();
  const rows = await dbAll(database, `SELECT a.id AS approval_id,a.request_id,a.stage,a.due_at,mr.request_no,p.code AS project_code,p.name AS project_name,u.full_name AS requester_name,r.emails FROM approvals a JOIN material_requests mr ON mr.id=a.request_id JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by JOIN approval_email_recipients r ON r.project_id=mr.project_id AND r.stage=a.stage AND r.active=1 WHERE a.status='pending' AND a.queued_at IS NOT NULL AND a.due_at<? AND a.reminder_sent_at IS NULL AND mr.status='pending_approval' AND mr.approval_stage=a.stage`, stamp);
  const baseUrl = String(settings.base_url || process.env.VNTECH_PUBLIC_URL || "http://localhost:8787").replace(/\/+$/, "");
  let queued = 0;
  for (const row of rows) {
    // Mẫu thư DÙNG CHUNG của lõi (sự kiện `overdue`) — ⛔ không nối chuỗi tay ở đây nữa.
    const message = buildEmailMessage({
      event: "overdue",
      recipients: row.emails,
      context: {
        requestId: row.request_id,
        requestNo: row.request_no,
        stage: row.stage,
        projectCode: row.project_code,
        projectName: row.project_name,
        requesterName: row.requester_name,
        deadline: row.due_at,
        baseUrl,
      },
    });
    if (!message.recipients.length) continue;
    const statements = [];
    // Khoá chống trùng của lõi: thư nhắc đã nằm trong hàng đợi ⇒ chỉ đóng dấu `reminder_sent_at`,
    // ⛔ KHÔNG chèn thêm dòng (và ⛔ không để khoá chính làm hỏng cả giao dịch).
    if (!(await findQueuedEmail(database, emailOutboxId(message)))) {
      statements.push(emailInsertStatement(database, message, { now: stamp }));
      queued += 1;
    }
    statements.push(database.prepare(`UPDATE approvals SET reminder_sent_at=?,updated_at=? WHERE id=?`).bind(stamp, stamp, row.approval_id));
    await database.batch(statements);
  }
  if (queued) logger.info(`Kênh email: xếp ${queued} thư nhắc quá hạn vào email_outbox.`);
}

/** Sau khi gửi được thư "chờ duyệt" ⇒ đóng dấu `approvals.notified_at` (giữ nguyên hành vi cũ). */
function approvalNotifiedHook(database) {
  return async (message, { now }) => {
    if (message.event !== "approval_requested" || !message.request_id || !message.stage) return;
    const sentAt = now.toISOString();
    await database.prepare(`UPDATE approvals SET notified_at=?,updated_at=? WHERE request_id=? AND stage=?`).bind(sentAt, sentAt, message.request_id, message.stage).run();
  };
}

/**
 * Một lượt gửi hàng đợi.
 * @param database D1/Kychost-style: `prepare().bind().first()|all()|run()`, `batch()`
 * @param emailSecret khoá giải mã mật khẩu SMTP (`.local-data/email-secret.key`)
 * @param options `{ logger, provider, limit, maxAttempts, dryRunMarksSent }`
 */
export async function dispatchEmailOutbox(database, emailSecret, options = {}) {
  if (dispatching) return { skipped: true, reason: "already_running" };
  dispatching = true;
  const logger = options.logger ?? defaultEmailLogger;
  try {
    // MỐC 50 — PHỤC HỒI email kẹt ở trạng thái `sending` (tiến trình chết giữa chừng).
    // ⛔ TRƯỚC ĐÂY câu này nằm SAU lệnh `return` của `enabled=0` ⇒ tắt email là email kẹt
    //    `sending` **mãi không bao giờ được gửi lại**. Phục hồi KHÔNG liên quan gì tới
    //    `enabled` ⇒ chạy TRƯỚC khi đọc cấu hình và trước nhánh bật/tắt.
    const recovery = await recoverStaleSending(database);
    const settings = await dbFirst(database, `SELECT * FROM email_settings WHERE id='EMAIL'`);
    // Bộ gửi: SMTP khi cấu hình đã đủ, ⛔ mặc định "không gửi thật" (dry-run, chỉ ghi log) khi chưa đủ.
    const transport = resolveEmailTransport(settings, { secret: emailSecret, logger, provider: options.provider });
    // Nhắc quá hạn chỉ có nghĩa khi SMTP đã sẵn sàng (giữ đúng điều kiện cũ: enabled + host + sender).
    if (emailSettingsReady(settings)) await queueOverdueReminders(database, settings, logger);
    const summary = await dispatchEmailQueue(database, {
      transport,
      logger,
      secret: emailSecret,
      recoverStale: false,
      limit: options.limit,
      maxAttempts: options.maxAttempts,
      dryRunMarksSent: options.dryRunMarksSent === true,
      onSent: approvalNotifiedHook(database),
    });
    summary.recovered = recovery.recovered;
    return summary;
  } finally {
    dispatching = false;
  }
}
