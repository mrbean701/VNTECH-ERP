package com.vntech.erp.domain.entity;

import java.util.Objects;

/**
 * Tài khoản người dùng (users) — entity lõi thuần Java.
 * Port 1:1 từ bảng `users` monolith JS; role/status giữ nguyên chuỗi gốc.
 */
public final class User {

    private final String id;
    private final String employeeCode;
    private final String fullName;
    private final String username;
    private final String email;
    private String passwordHash;       // pbkdf2$iter$salt$hash — do PasswordHasher port
    private final String role;         // admin / engineer / commander / project / procurement / warehouse...
    private final String department;
    private final String organizationUnitId;
    private final double approvalLimit;
    private final boolean active;
    private boolean mustChangePassword;
    private String avatarUrl;

    public User(String id, String employeeCode, String fullName, String username, String email,
                String passwordHash, String role, String department, String organizationUnitId,
                double approvalLimit, boolean active, boolean mustChangePassword, String avatarUrl) {
        this.id = Objects.requireNonNull(id, "id");
        this.employeeCode = Objects.requireNonNull(employeeCode, "employeeCode");
        this.fullName = Objects.requireNonNull(fullName, "fullName");
        this.username = Objects.requireNonNull(username, "username");
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = Objects.requireNonNull(role, "role");
        this.department = Objects.requireNonNull(department, "department");
        this.organizationUnitId = organizationUnitId;
        this.approvalLimit = approvalLimit;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.avatarUrl = avatarUrl;
    }

    /** Chỉ dùng khi rotate password hash (login với PBKDF2 iterations cũ hơn chuẩn). */
    public void replacePasswordHash(String newHash) {
        this.passwordHash = Objects.requireNonNull(newHash, "newHash");
    }

    public void changeAvatar(String newUrl) {
        this.avatarUrl = newUrl;
    }

    /** Sau khi đổi mật khẩu thành công, dỡ cờ bắt buộc đổi mật khẩu (must_change_password=0). */
    public void clearMustChangePassword() {
        this.mustChangePassword = false;
    }

    public String id() { return id; }
    public String employeeCode() { return employeeCode; }
    public String fullName() { return fullName; }
    public String username() { return username; }
    public String email() { return email; }
    public String passwordHash() { return passwordHash; }
    public String role() { return role; }
    public String department() { return department; }
    public String organizationUnitId() { return organizationUnitId; }
    public double approvalLimit() { return approvalLimit; }
    public boolean active() { return active; }
    public boolean mustChangePassword() { return mustChangePassword; }
    public String avatarUrl() { return avatarUrl; }
}