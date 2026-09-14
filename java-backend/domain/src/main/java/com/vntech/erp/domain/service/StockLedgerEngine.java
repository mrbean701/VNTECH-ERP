package com.vntech.erp.domain.service;

/**
 * StockLedgerEngine — chính sách tồn kho (port nguyên trạng monolith JS):
 *   - Tồn VẬT LÝ 1 kho: SUM(to) - SUM(from) trên stock_movements
 *   - Giữ chỗ (reserved): stock_reservations active (trừ request đang xét)
 *   - Tồn KẾ TOÁN theo Contract (ownership): contract_stock_ledger SUM(quantity_delta)
 * Đảm bảo KHÔNG âm kho và KHÔNG xuất vượt sở hữu Contract — lợi thế đa hợp đồng.
 */
public final class StockLedgerEngine {

    private StockLedgerEngine() { }

    public interface BalanceStore {
        double stockBalance(String warehouseId, String materialId);
        double reservedBalance(String warehouseId, String materialId, String excludeRequestId);
        double contractBalance(String projectId, String contractId, String warehouseId, String materialId);
        double reservedForRequest(String warehouseId, String materialId, String requestId);
    }

    public record Availability(double physical, double reserved, double available, double ownerContract) { }

    /** Tồn khả dụng 1 kho + tồn kế toán theo contract — kiểm tra trước khi xuất. */
    public static Availability availability(BalanceStore store, String projectId, String contractId,
                                            String warehouseId, String materialId, String requestId) {
        double physical = store.stockBalance(warehouseId, materialId);
        double reserved = store.reservedBalance(warehouseId, materialId, requestId);
        double available = Math.max(0, physical - reserved);
        double ownerContract = store.contractBalance(projectId, contractId, warehouseId, materialId);
        return new Availability(physical, reserved, available, ownerContract);
    }

    /** Chặn xuất: phải đủ cả tồn vật lý lẫn tồn kế toán contract. */
    public static String validateIssue(Availability av, double qty) {
        if (qty <= 0) return "Số lượng xuất phải lớn hơn 0.";
        if (qty > av.available() + 1e-9)
            return "Không đủ tồn khả dụng / tồn vật lý khả dụng (còn " + round(av.available()) + ").";
        if (qty > av.ownerContract() + 1e-9)
            return "Contract không đủ tồn kế toán tại kho nguồn (còn " + round(av.ownerContract()) + ").";
        return "";
    }

    private static String round(double v) {
        return String.format(java.util.Locale.ROOT, "%.4g", v);
    }
}