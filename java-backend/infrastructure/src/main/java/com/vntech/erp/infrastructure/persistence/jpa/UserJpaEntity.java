package com.vntech.erp.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** JPA entity bảng `users` — khớp V1__baseline.sql (cột TEXT -> VARCHAR/DATETIME trong MySQL). */
@Entity
@Table(name = "users")
public class UserJpaEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "employee_code", nullable = false, length = 64)
    private String employeeCode;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "username", nullable = false, length = 64)
    private String username;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "role", nullable = false, length = 32)
    private String role;

    @Column(name = "department", nullable = false, length = 255)
    private String department;

    @Column(name = "organization_unit_id", length = 64)
    private String organizationUnitId;

    @Column(name = "approval_limit", nullable = false)
    private double approvalLimit;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /**
     * P5 — mã cấp bậc trong `system_level_catalog`.
     * PHẢI khai báo ở đây (không chỉ ở migration): test dùng H2 với
     * `spring.jpa.hibernate.ddl-auto=create-drop`, Hibernate DROP + tạo lại bảng `users`
     * SAU khi chạy schema-h2.sql, nên cột thêm bằng ALTER trong schema sẽ bị xoá.
     */
    @Column(name = "system_level_code", length = 64)
    private String systemLevelCode;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserJpaEntity() { } // JPA

    public UserJpaEntity(String id, String employeeCode, String fullName, String username, String email,
                         String passwordHash, String role, String department, String organizationUnitId,
                         double approvalLimit, boolean active, boolean mustChangePassword,
                         String avatarUrl, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.department = department;
        this.organizationUnitId = organizationUnitId;
        this.approvalLimit = approvalLimit;
        this.active = active;
        this.mustChangePassword = mustChangePassword;
        this.avatarUrl = avatarUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getEmployeeCode() { return employeeCode; }
    public String getFullName() { return fullName; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
    public String getDepartment() { return department; }
    public String getOrganizationUnitId() { return organizationUnitId; }
    public double getApprovalLimit() { return approvalLimit; }
    public boolean isActive() { return active; }
    public boolean isMustChangePassword() { return mustChangePassword; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getSystemLevelCode() { return systemLevelCode; }
    public void setSystemLevelCode(String systemLevelCode) { this.systemLevelCode = systemLevelCode; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}