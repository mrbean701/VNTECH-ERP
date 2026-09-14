package com.vntech.erp.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * JPA entity cho bảng `projects` (MySQL, Flyway V1).
 * Thuộc tầng infrastructure — KHÔNG được rò rỉ lên domain/application.
 * Cột timestamp TEXT của bản JS lưu thành DATETIME(3) ở MySQL.
 */
@Entity
@Table(name = "projects")
public class ProjectJpaEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "manager_user_id", length = 64)
    private String managerUserId;

    @Column(name = "start_date", length = 10)
    private String startDate;

    @Column(name = "planned_end_date", length = 10)
    private String plannedEndDate;

    @Column(name = "contract_no", length = 100)
    private String contractNo;

    @Column(name = "contract_name", length = 255)
    private String contractName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProjectJpaEntity() { } // JPA

    public ProjectJpaEntity(String id, String code, String name, String status,
                            String managerUserId, String startDate, String plannedEndDate,
                            String contractNo, String contractName, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.status = status;
        this.managerUserId = managerUserId;
        this.startDate = startDate;
        this.plannedEndDate = plannedEndDate;
        this.contractNo = contractNo;
        this.contractName = contractName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public String getManagerUserId() { return managerUserId; }
    public String getStartDate() { return startDate; }
    public String getPlannedEndDate() { return plannedEndDate; }
    public String getContractNo() { return contractNo; }
    public String getContractName() { return contractName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}