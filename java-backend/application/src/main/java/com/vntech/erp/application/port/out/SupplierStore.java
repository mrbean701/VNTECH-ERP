package com.vntech.erp.application.port.out;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Port nhà cung cấp — port nguyên trạng save_supplier/set_supplier_status/delete_supplier JS. */
public interface SupplierStore {

    boolean supplierCodeExists(String code, String excludeId);
    Optional<Map<String, Object>> findSupplier(String supplierId);
    long countSupplierPurchaseOrders(String supplierId);
    void insertSupplier(String id, String code, String name, String taxCode, String contactName,
                        String phone, int leadTimeDays, double rating, boolean active, Instant now);
    void updateSupplier(String id, String code, String name, String taxCode, String contactName,
                        String phone, int leadTimeDays, double rating, boolean active, Instant now);
    void setSupplierActive(String id, boolean active, Instant now);
    void deleteSupplier(String id);
}