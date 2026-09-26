package com.vntech.erp.infrastructure.worker;

import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * MT2-P13-05 §15 — worker gửi hàng đợi {@code email_outbox} trong backend Java.
 *
 * <p>⛔ Use-case chỉ xếp thư; worker là nơi duy nhất gửi SMTP. Claim dùng UPDATE có điều kiện
 * để hai lượt worker không gửi cùng một thư. Không thêm bảng mới: {@code email_outbox} đã có
 * đủ trạng thái gửi, số lần thử và lỗi.
 */
@Component
public class EmailOutboxDispatchWorker {
    private static final Logger log = LoggerFactory.getLogger(EmailOutboxDispatchWorker.class);
    private static final int BATCH_SIZE = 10;
    private static final int MAX_ATTEMPTS = 3;
    private static final long STALE_SENDING_MINUTES = 5;
    private static final long RETRY_BASE_SECONDS = 5 * 60L;

    private final JdbcTemplate jdbc;
    private final Function<Map<String, Object>, JavaMailSender> senderFactory;

    @Autowired
    public EmailOutboxDispatchWorker(JdbcTemplate jdbc) {
        this(jdbc, EmailOutboxDispatchWorker::createSender);
    }

    /** Constructor riêng cho kiểm thử: cung cấp sender giả, không mở kết nối SMTP thật. */
    EmailOutboxDispatchWorker(JdbcTemplate jdbc, Function<Map<String, Object>, JavaMailSender> senderFactory) {
        this.jdbc = jdbc;
        this.senderFactory = senderFactory;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
    public void run() {
        Instant now = Instant.now();
        Map<String, Object> config = activeSettings();
        if (config == null) {
            log.debug("Email worker: cấu hình SMTP chưa đủ hoặc đang tắt; bỏ qua lượt gửi.");
            return;
        }
        recoverStaleSending(now);
        List<Map<String, Object>> messages = pendingMessages(now);
        for (Map<String, Object> row : messages) dispatch(config, row, now);
    }

    private Map<String, Object> activeSettings() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT enabled,smtp_host AS smtpHost,smtp_port AS smtpPort,security,username,password,
                       sender_email AS senderEmail,sender_name AS senderName
                FROM email_settings WHERE id='EMAIL'""");
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.get(0);
        if (intValue(row.get("enabled")) != 1 || text(row.get("smtpHost")).isEmpty()
                || text(row.get("senderEmail")).isEmpty()) return null;
        return row;
    }

    private void recoverStaleSending(Instant now) {
        jdbc.update("""
                UPDATE email_outbox SET status='queued',updated_at=?
                WHERE status='sending' AND updated_at<?""", now, now.minusSeconds(STALE_SENDING_MINUTES * 60));
    }

    private List<Map<String, Object>> pendingMessages(Instant now) {
        return jdbc.queryForList("""
                SELECT id,request_id AS requestId,stage,event,recipients,subject,
                       text_body AS textBody,html_body AS htmlBody,attempt_count AS attemptCount
                FROM email_outbox
                WHERE status IN ('queued','failed') AND attempt_count<?
                  AND (next_attempt_at IS NULL OR next_attempt_at<=?)
                ORDER BY queued_at,id LIMIT ?""", MAX_ATTEMPTS, now, BATCH_SIZE);
    }

    private void dispatch(Map<String, Object> config, Map<String, Object> row, Instant now) {
        String id = text(row.get("id"));
        if (!claim(id, now)) return;
        try {
            JavaMailSender sender = senderFactory.apply(config);
            MimeMessage message = sender.createMimeMessage();
            message.setFrom(new InternetAddress(text(config.get("senderEmail")), text(config.get("senderName"))));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(text(row.get("recipients")), false));
            message.setSubject(text(row.get("subject")), StandardCharsets.UTF_8.name());
            message.setContent(multipart(text(row.get("textBody")), text(row.get("htmlBody"))));
            message.setSentDate(new java.util.Date());
            sender.send(message);
            jdbc.update("""
                    UPDATE email_outbox SET status='sent',sent_at=?,last_error=NULL,updated_at=?
                    WHERE id=? AND status='sending'""", now, now, id);
        } catch (Exception error) {
            int attempts = intValue(row.get("attemptCount")) + 1;
            Instant retryAt = now.plusSeconds(attempts * RETRY_BASE_SECONDS);
            String detail = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            detail = detail.length() > 500 ? detail.substring(0, 500) : detail;
            jdbc.update("""
                    UPDATE email_outbox SET status='failed',attempt_count=?,next_attempt_at=?,last_error=?,updated_at=?
                    WHERE id=? AND status='sending'""", attempts, retryAt, detail, now, id);
            log.warn("Email worker không gửi được {}: {}", id, detail);
        }
    }

    private boolean claim(String id, Instant now) {
        return jdbc.update("""
                UPDATE email_outbox SET status='sending',updated_at=?
                WHERE id=? AND status IN ('queued','failed') AND attempt_count<?""",
                now, id, MAX_ATTEMPTS) == 1;
    }

    private static Multipart multipart(String textBody, String htmlBody) throws Exception {
        MimeMultipart multipart = new MimeMultipart("alternative");
        MimeBodyPart text = new MimeBodyPart();
        text.setText(textBody, StandardCharsets.UTF_8.name());
        multipart.addBodyPart(text);
        if (!htmlBody.isEmpty()) {
            MimeBodyPart html = new MimeBodyPart();
            html.setContent(htmlBody, "text/html; charset=UTF-8");
            multipart.addBodyPart(html);
        }
        return multipart;
    }

    private static JavaMailSender createSender(Map<String, Object> config) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(text(config.get("smtpHost")));
        sender.setPort(Math.max(1, intValue(config.get("smtpPort"))));
        String security = text(config.get("security")).toLowerCase();
        if ("plain".equals(security)) {
            sender.setJavaMailProperties(properties("mail.smtp.auth", "true", "mail.smtp.starttls.enable", "false"));
        } else if ("tls".equals(security)) {
            sender.setJavaMailProperties(properties("mail.smtp.auth", "true", "mail.smtp.starttls.enable", "false",
                    "mail.smtp.starttls.required", "true"));
        } else {
            sender.setJavaMailProperties(properties("mail.smtp.auth", "true", "mail.smtp.starttls.enable", "true"));
        }
        String username = text(config.get("username"));
        if (!username.isEmpty()) {
            sender.setUsername(username);
            sender.setPassword(text(config.get("password")));
        }
        return sender;
    }

    private static java.util.Properties properties(String... values) {
        java.util.Properties properties = new java.util.Properties();
        for (int i = 0; i < values.length; i += 2) properties.setProperty(values[i], values[i + 1]);
        return properties;
    }

    private static int intValue(Object value) {
        return value instanceof Number number ? number.intValue() : Integer.parseInt(text(value));
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
