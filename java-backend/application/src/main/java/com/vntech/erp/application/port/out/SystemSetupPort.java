package com.vntech.erp.application.port.out;

import java.time.Instant;

/**
 * Port seed dữ liệu nền khi cài mới — tương đương `seedMasters()` của monolith JS:
 * company_settings, email_settings, warehouses (kho trung tâm), v.v.
 * Infrastructure implement bằng native SQL/JPA phù hợp bảng đã có trong V1__baseline.
 */
public interface SystemSetupPort {

    void seedMasters(String adminUserId, String companyName, Instant now);
}