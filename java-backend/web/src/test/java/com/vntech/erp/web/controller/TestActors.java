package com.vntech.erp.web.controller;

import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * [TASK-115] Fixture dùng chung cho các test chuỗi: tạo **NGƯỜI LẬP PHIẾU khác NGƯỜI DUYỆT** + đăng nhập.
 *
 * <p><b>Vì sao cần:</b> luật «người tạo đơn KHÔNG tự duyệt» (commit {@code 42f91be},
 * {@code RequestManagementUseCase#creatorMatchedStageRole}) BỎ QUA bước mà NGƯỜI LẬP PHIẾU có vai trò nằm
 * trong {@code allowed_role_codes} của bước đó (ghi vết {@code creator_role_waived}). Các test chuỗi trước đây
 * lập phiếu BẰNG {@code admin} trong khi bước 1 cấu hình {@code 'engineer,commander,admin'} nên bước 1 bị bỏ qua
 * ⇒ {@code decide_approval(stage=1)} trả 400 «Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.».
 *
 * <p><b>Cách sửa ĐÚNG (luật GIỮ NGUYÊN):</b> người lập phiếu là tài khoản khác, vai trò KHÔNG nằm trong danh sách
 * duyệt của bước; người duyệt vẫn là {@code admin} được chỉ định làm owner của bước
 * ({@code approval_project_assignments}) — đúng mô hình dữ liệu thật của đặc tả §6.
 */
final class TestActors {

    static final String PASSWORD = "VnTech@123";

    private TestActors() { }

    /**
     * PBKDF2-SHA256 600.000 vòng — ĐÚNG định dạng {@code Pbkdf2PasswordHasher}:
     * {@code pbkdf2$<iterations>$<saltHex>$<hashHex>}, salt 16 bytes, khoá 32 bytes (256 bit).
     */
    static String passwordHash(String password) {
        try {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 600_000, 256);
            byte[] key = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            spec.clearPassword();
            return "pbkdf2$600000$" + HexFormat.of().formatHex(salt) + "$" + HexFormat.of().formatHex(key);
        } catch (Exception e) {
            throw new IllegalStateException("PBKDF2 unavailable", e);
        }
    }

    /**
     * Tạo tài khoản lập phiếu: users + phạm vi dự án (write) + quyền module {@code requests} (canCreate)
     * + dòng {@code module_catalog} mà {@code ModulePermissionStoreAdapter.canUseModule} JOIN tới.
     */
    static void seedRequester(JdbcTemplate jdbc, String userId, String username, String fullName,
                              String role, String department, String projectId, Instant now) {
        Integer modules = jdbc.queryForObject(
                "SELECT COUNT(*) FROM module_catalog WHERE module_key='requests'", Integer.class);
        if (modules == null || modules == 0) {
            jdbc.update("INSERT INTO module_catalog (module_key,label,icon,active,sort_order,created_at,updated_at)"
                    + " VALUES ('requests','Phiếu đề nghị mua hàng','X',1,10,?,?)", now, now);
        }
        jdbc.update("INSERT INTO users (id,employee_code,full_name,username,password_hash,role,department,"
                        + "approval_limit,active,must_change_password,created_at,updated_at)"
                        + " VALUES (?,?,?,?,?,?,?,0,1,0,?,?)",
                userId, "NV-" + userId, fullName, username, passwordHash(PASSWORD), role, department, now, now);
        jdbc.update("INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at)"
                + " VALUES (?,?,?,'write',?,?)", "ups_" + userId, userId, projectId, now, now);
        jdbc.update("INSERT INTO user_module_permissions (id,user_id,module_key,can_view,can_use,can_create,"
                        + "can_edit,can_approve,can_export,permission_source,created_at,updated_at)"
                        + " VALUES (?,?,'requests',1,1,1,1,0,0,'manual_override',?,?)",
                "ump_" + userId, userId, now, now);
    }

    /** Đăng nhập và trả cookie phiên ({@code mep_session}). */
    static Cookie login(MockMvc mockMvc, String username) throws Exception {
        var res = mockMvc.perform(post("/api/system").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"login\",\"username\":\"" + username + "\",\"password\":\""
                                + PASSWORD + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return res.getResponse().getCookie("mep_session");
    }
}
