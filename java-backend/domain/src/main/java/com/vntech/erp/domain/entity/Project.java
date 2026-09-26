package com.vntech.erp.domain.entity;

import com.vntech.erp.domain.valueobject.ProjectStatus;

import java.time.Instant;
import java.util.Objects;

/**
 * Dự án (projects) — entity lõi, thuần Java, KHÔNG phụ thuộc framework/DB.
 * Port 1:1 từ bảng `projects` của monolith JS (drizzle/0000).
 */
public final class Project {

    private final String id;           // text id, định dạng uuid như bản JS
    private final String code;
    private final String name;
    private ProjectStatus status;
    private String managerUserId;
    private String startDate;          // ISO yyyy-MM-dd
    private String plannedEndDate;
    private String contractNo;
    private String contractName;
    private final Instant createdAt;
    private Instant updatedAt;

    public Project(String id, String code, String name, ProjectStatus status,
                   String managerUserId, String startDate, String plannedEndDate,
                   String contractNo, String contractName, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "id");
        this.code = Objects.requireNonNull(code, "code");
        this.name = Objects.requireNonNull(name, "name");
        this.status = Objects.requireNonNull(status, "status");
        this.managerUserId = managerUserId;
        this.startDate = startDate;
        this.plannedEndDate = plannedEndDate;
        this.contractNo = contractNo;
        this.contractName = contractName;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
    }

    /** Use-case chỉ được đổi status qua đây — mọi quy tắc nghiệp vụ nằm ở domain. */
    public void changeStatus(ProjectStatus newStatus) {
        this.status = Objects.requireNonNull(newStatus, "newStatus");
        this.updatedAt = Instant.now();
    }

    public String id() { return id; }
    public String code() { return code; }
    public String name() { return name; }
    public ProjectStatus status() { return status; }
    public String managerUserId() { return managerUserId; }
    public String startDate() { return startDate; }
    public String plannedEndDate() { return plannedEndDate; }
    public String contractNo() { return contractNo; }
    public String contractName() { return contractName; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}