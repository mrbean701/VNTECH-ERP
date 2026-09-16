package com.vntech.erp.web.controller;

import com.vntech.erp.application.service.AuthUseCase;
import com.vntech.erp.application.service.FileUseCase;
import com.vntech.erp.web.security.SessionCookieFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Port {@code app/api/files/route.ts} — endpoint **ngoài** {@code /api/system}.
 *
 * <p>Đây là mảnh còn thiếu khiến {@code confirm_delivery} luôn bị chặn ("Phải tải ít nhất một ảnh
 * giao hàng thực tế...") và mọi panel đính kèm ở Phase 1 không dùng được. Giữ nguyên hợp đồng JS:
 * <ul>
 *   <li>{@code POST} multipart (field {@code file|entityType|entityId}) → 201 {@code {ok,attachment}}</li>
 *   <li>{@code GET ?entityType=&entityId=} → {@code {ok,attachments:[...]}}</li>
 *   <li>{@code GET ?id=} → nhị phân, {@code Content-Disposition: attachment; filename*=UTF-8''…}</li>
 *   <li>{@code DELETE ?id=} → {@code {ok:true}}</li>
 *   <li>{@code GET ?projectArchive=} → ZIP (chỉ admin)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileUseCase fileUseCase;
    private final AuthUseCase authUseCase;

    public FileController(FileUseCase fileUseCase, AuthUseCase authUseCase) {
        this.fileUseCase = fileUseCase;
        this.authUseCase = authUseCase;
    }

    @PostMapping(produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> upload(@RequestParam(value = "file", required = false) MultipartFile file,
                                    @RequestParam(value = "entityType", required = false) String entityType,
                                    @RequestParam(value = "entityId", required = false) String entityId,
                                    HttpServletRequest request) {
        try {
            AuthUseCase.CurrentUser user = requireUser(request);
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(error("Thiếu tệp hoặc chứng từ liên quan."));
            }
            Map<String, Object> result = fileUseCase.upload(user, entityType, entityId,
                    file.getOriginalFilename(), file.getContentType(), file.getSize(), file.getBytes());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("ok", true);
            body.put("attachment", result.get("attachment"));
            return ResponseEntity.status(201).body(body);
        } catch (Exception e) {
            return errorResponse(e, "Không thể tải tệp.");
        }
    }

    /**
     * Một GET duy nhất cho cả 3 mục đích, đúng như JS: phân nhánh theo query param.
     * Không tách path riêng vì UI gọi cùng {@code /api/files}.
     */
    @GetMapping
    public ResponseEntity<?> get(@RequestParam(value = "projectArchive", required = false) String projectArchive,
                                 @RequestParam(value = "id", required = false) String id,
                                 @RequestParam(value = "entityType", required = false) String entityType,
                                 @RequestParam(value = "entityId", required = false) String entityId,
                                 HttpServletRequest request) {
        try {
            AuthUseCase.CurrentUser user = requireUser(request);
            if (projectArchive != null && !projectArchive.isBlank()) {
                FileUseCase.ProjectArchive archive = fileUseCase.projectArchive(user, projectArchive.trim());
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType("application/zip"));
                headers.set(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(archive.fileName()));
                headers.set(HttpHeaders.CACHE_CONTROL, "private, no-store");
                headers.set("X-VNTECH-Archive-Id", archive.archiveId());
                headers.set("X-VNTECH-Archive-SHA256", archive.sha256());
                headers.set("X-VNTECH-Record-Count", String.valueOf(archive.recordCount()));
                headers.set("X-VNTECH-Attachment-Count", String.valueOf(archive.attachmentCount()));
                return new ResponseEntity<>(archive.content(), headers, org.springframework.http.HttpStatus.OK);
            }
            if ((id == null || id.isBlank()) && entityType != null && !entityType.isBlank()
                    && entityId != null && !entityId.isBlank()) {
                List<Map<String, Object>> attachments = fileUseCase.list(user, entityType.trim(), entityId.trim());
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("ok", true);
                body.put("attachments", attachments);
                return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "private, no-store").body(body);
            }
            if (id == null || id.isBlank()) return plainError(new AuthUseCase.ApiError("Thiếu mã tệp", 400), "Thiếu mã tệp");
            FileUseCase.Download file = fileUseCase.download(user, id.trim());
            return binary(file.content(), file.contentType(), file.fileName());
        } catch (Exception e) {
            return plainError(e, "Không thể tải tệp");
        }
    }

    @DeleteMapping(produces = "application/json;charset=UTF-8")
    public ResponseEntity<?> delete(@RequestParam(value = "id", required = false) String id,
                                    HttpServletRequest request) {
        try {
            AuthUseCase.CurrentUser user = requireUser(request);
            fileUseCase.delete(user, id);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("ok", true);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return errorResponse(e, "Không thể xóa tệp.");
        }
    }

    // ================= helpers =================

    private AuthUseCase.CurrentUser requireUser(HttpServletRequest request) {
        Optional<AuthUseCase.CurrentUser> user =
                authUseCase.currentUser(SessionCookieFactory.decode(cookieValue(request)), Instant.now());
        if (user.isEmpty()) throw new AuthUseCase.ApiError("Chưa đăng nhập.", 401);
        return user.get();
    }

    private String cookieValue(HttpServletRequest request) {
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (jakarta.servlet.http.Cookie c : cookies) {
            if (SessionCookieFactory.COOKIE_NAME.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static Map<String, Object> error(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", false);
        body.put("error", message);
        return body;
    }

    private static ResponseEntity<?> errorResponse(Exception e, String fallback) {
        if (e instanceof AuthUseCase.ApiError api) {
            return ResponseEntity.status(api.status()).body(error(api.getMessage()));
        }
        String message = e.getMessage() == null ? fallback : e.getMessage();
        return ResponseEntity.status(500).body(error(message));
    }

    private static ResponseEntity<?> plainError(Exception e, String fallback) {
        if (e instanceof AuthUseCase.ApiError api) {
            return ResponseEntity.status(api.status()).body(api.getMessage());
        }
        return ResponseEntity.status(500).body(e.getMessage() == null ? fallback : e.getMessage());
    }

    private static ResponseEntity<byte[]> binary(byte[] content, String contentType, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        if (contentType != null && !contentType.isBlank()) {
            try {
                headers.setContentType(MediaType.parseMediaType(contentType));
            } catch (Exception ignored) {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        headers.set(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(fileName));
        headers.set(HttpHeaders.CACHE_CONTROL, "private, no-store");
        return new ResponseEntity<>(content, headers, org.springframework.http.HttpStatus.OK);
    }

    /** RFC 5987: filename*=UTF-8''<percent-encoded> — khớp JS để giữ tên tệp tiếng Việt. */
    private static String contentDisposition(String fileName) {
        String encoded = URLEncoder.encode(fileName == null ? "tai-lieu" : fileName, StandardCharsets.UTF_8)
                .replace("+", "%20");
        return "attachment; filename*=UTF-8''" + encoded;
    }
}
