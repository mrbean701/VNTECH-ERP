package com.vntech.erp.infrastructure.worker;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** MT2-P13-05 — worker gửi {@code email_outbox}; kiểm thử đỏ-xanh cho lỗi và claim an toàn. */
class EmailOutboxDispatchWorkerTest {

    @Test
    void guiThanhCong_ganhTrangThaiSentVaGhiSentAt() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = mock(MimeMessage.class);
        when(sender.createMimeMessage()).thenReturn(message);
        when(jdbc.queryForList(anyString())).thenReturn(List.of(settings()));
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(mail(0)));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        new EmailOutboxDispatchWorker(jdbc, ignored -> sender).run();

        verify(sender).send(message);
        verify(jdbc).update(contains("status='sent'"), any(), any(), eq("MAIL_1"));
    }

    @Test
    void smtpLoi_giuThuVaTangSoLanThu() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = mock(MimeMessage.class);
        when(sender.createMimeMessage()).thenReturn(message);
        when(jdbc.queryForList(anyString())).thenReturn(List.of(settings()));
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(mail(1)));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        doThrow(new IllegalStateException("smtp unavailable")).when(sender).send(message);

        new EmailOutboxDispatchWorker(jdbc, ignored -> sender).run();

        ArgumentCaptor<Object[]> args = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).update(contains("status='failed'"), args.capture());
        Object[] values = args.getValue();
        assertEquals(2, values[0]);
        assertEquals("MAIL_1", values[4]);
    }

    @Test
    void khongCoThu_vaKhongClaimDuoc_chiDungWorker() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        when(jdbc.queryForList(anyString())).thenReturn(List.of(settings()));
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(mail(0)));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0);

        new EmailOutboxDispatchWorker(jdbc, ignored -> sender).run();

        verify(sender, never()).send(any(MimeMessage.class));
    }

    /**
     * ⭐ BUG-20261008-004 — ĐỐI CHỨNG ĐÚNG KIỂU DỮ LIỆU MySQL TRẢ VỀ.
     *
     * <p>⚠️ VÌ SAO LỌT LƯỚI TỪ 29/09/2026: 3 test trên dùng {@code "enabled", 1} = **Integer** ⇒
     * {@code value instanceof Number} = TRUE ⇒ ⛔ chưa bao giờ chạm nhánh **Boolean**. Nhưng
     * {@code email_settings.enabled} là {@code TINYINT(1)} và trình điều khiển MySQL mặc định
     * ({@code tinyInt1isBit=true}) trả về **Boolean** ⇒ {@code Integer.parseInt("false")} ⇒
     * {@code NumberFormatException} **mỗi 60 giây** (bằng chứng: {@code java-run.log} 29/09/2026 và
     * log backend 08/10/2026, đúng nhịp {@code @Scheduled(fixedDelay=60_000)}).
     */
    @Test
    void enabledLaBoolean_tuMySQL_khongNemNumberFormatException() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        MimeMessage message = mock(MimeMessage.class);
        when(sender.createMimeMessage()).thenReturn(message);
        when(jdbc.queryForList(anyString())).thenReturn(List.of(settings(Boolean.TRUE)));
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(mail(0)));
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        new EmailOutboxDispatchWorker(jdbc, ignored -> sender).run();

        verify(sender).send(message);
    }

    /** Cùng ca trên nhưng {@code enabled = false} ⇒ worker phải BỎ QUA (⛔ không gửi), ⛔ không ném lỗi. */
    @Test
    void enabledBooleanFalse_boQuaKhongGui() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        when(jdbc.queryForList(anyString())).thenReturn(List.of(settings(Boolean.FALSE)));

        new EmailOutboxDispatchWorker(jdbc, ignored -> sender).run();

        verify(sender, never()).send(any(MimeMessage.class));
    }

    private static Map<String, Object> settings() {
        return settings(1);
    }

    /** {@code enabled} nhận CẢ Integer (H2) LẪN Boolean (MySQL {@code TINYINT(1)}). */
    private static Map<String, Object> settings(Object enabled) {
        return Map.of("enabled", enabled, "smtpHost", "smtp.example.com", "smtpPort", 587,
                "security", "starttls", "username", "mailer", "password", "secret",
                "senderEmail", "erp@example.com", "senderName", "VNTECH ERP");
    }

    private static Map<String, Object> mail(int attempts) {
        return Map.of(
                "id", "MAIL_1", "requestId", "REQ_1", "stage", 2, "event", "approval_requested",
                "recipients", "a@example.com,b@example.com", "subject", "Phiếu chờ duyệt",
                "textBody", "Nội dung", "htmlBody", "<p>Nội dung</p>", "attemptCount", attempts);
    }
}
