package com.vntech.erp.domain.valueobject;

/** Trạng thái dự án — khớp chuỗi status của bản JS (projects.status). */
public enum ProjectStatus {
    ACTIVE("active"),
    INACTIVE("inactive"),
    COMPLETED("completed"),
    ARCHIVED("archived");

    private final String code;

    ProjectStatus(String code) {
        this.code = code;
    }

    public String code() { return code; }

    /** Đọc từ chuỗi lưu DB; fallback ACTIVE nếu lạ (giống hành vi JS mặc định 'active'). */
    public static ProjectStatus fromCode(String raw) {
        if (raw == null) return ACTIVE;
        for (ProjectStatus s : values()) {
            if (s.code.equalsIgnoreCase(raw)) return s;
        }
        return ACTIVE;
    }
}