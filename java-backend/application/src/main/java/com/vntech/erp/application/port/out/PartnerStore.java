package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Port ĐỐI TÁC (bảng riêng `partners`) — TASK-127, khuôn y hệt {@link SupplierStore}.
 * Bảng đã có sẵn trong CSDL (Flyway `V23__partners_table.sql` + `drizzle/0165…`) ⇒ CHỈ ĐỌC/GHI dữ liệu,
 * KHÔNG migration mới.
 */
public interface PartnerStore {

    boolean partnerCodeExists(String code, String excludeId);

    Optional<Map<String, Object>> findPartner(String partnerId);

    void insertPartner(String id, String code, String name, String taxCode, String address,
                       String contactName, String contactPhone, String email, String partnerType,
                       String status, boolean active, Instant now);

    void updatePartner(String id, String code, String name, String taxCode, String address,
                       String contactName, String contactPhone, String email, String partnerType,
                       String status, boolean active, Instant now);

    void setPartnerActive(String id, boolean active, String status, Instant now);

    void deletePartner(String id);
}
