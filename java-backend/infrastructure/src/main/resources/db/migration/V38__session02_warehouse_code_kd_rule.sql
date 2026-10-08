-- ═══════════════════════════════════════════════════════════════════════════════════════════════
-- ⭐⭐⭐ V38 — CHUẨN HOÁ MÃ KHO VỀ QUY TẮC `KD-xxx` (⭐ USER CHỐT 08/10/2026) ⭐⭐⭐
--
--   NGUỒN (nguyên văn user — `DEC-20261008-013`):
--     «Mã kho sinh theo quy tắc : KD-xxx (xxx là số thứ tự KHÔNG được trùng với các kho khác)»
--     «12 mã kho thật thì sửa lại cho đúng quy tắc, đây chỉ là dữ liệu dev không quan trọng đâu.»
--
--   ⚠️⚠️ VÌ SAO PHẢI ĐỔI (⭐ đo được, ⛔ không suy đoán):
--     Đo trên CSDL thật: 12/12 kho có mã ⛔ KHÔNG theo `KD-xxx`
--     (KHO-DA-MAU-01 · KHO-DA06 · KHO-DIAG · KHO-E2E-01 · KHO-PRJ-DEMO-01 · KHO-TONG ·
--      TD-E2E-DA-01-E2E-TD01/02 · TD-PRJ-DEMO-01-TD-01/02/03 · TRANSIT)
--     ⇒ quy tắc `KD-xxx` sẽ ⛔ không khớp dữ liệu hiện có.
--
--   🔒 AN TOÀN (⭐ đã kiểm trước khi viết):
--     • `TRANSIT` ⛔ KHÔNG đổi — đó là kho HỆ THỐNG (`type='transit'`), mã nguồn tra theo
--       `WHERE type='transit'` (WarehouseStockStoreAdapter:690), ⛔ không tra theo mã.
--       ⚠️ Đổi mã kho hệ thống ⛔ không đem lại lợi ích mà lại rủi ro ⇒ GIỮ NGUYÊN.
--     • `KHO-TONG` ĐỔI ⇒ ⚠️ PHẢI cập nhật kèm: (a) seed `SystemSetupAdapter.java` và
--       (b) test `tests/w02-project-warehouse-relation.test.mjs:178` (test đọc CSDL THẬT và
--       assert `includes("KHO-TONG")` ⇒ nếu ⛔ không sửa thì test ĐỎ).
--     • `project_id` của kho ⛔ KHÔNG đổi ⇒ quan hệ kho↔dự án giữ nguyên.
--     • `id` kho ⛔ KHÔNG đổi ⇒ MỌI chứng từ cũ (`stock_ledger`, phiếu…) trỏ theo `id`
--       ⇒ ⛔ KHÔNG mồ côi ✅ (⚠️ đây là lý do đổi `code` an toàn hơn đổi `id`).
--
--   ⚠️ CHẠY LẠI ĐƯỢC (idempotent): mỗi câu có `WHERE code = '<mã cũ>'` ⇒ chạy lần 2 ⛔ không đổi gì.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════

-- ── ① KHO TỔNG (⭐ kho mặc định của hệ thống — quy tắc: «Mặc định hệ thống sẽ có 1 kho Tổng»)
UPDATE `warehouses` SET `code` = 'KD-001', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-TONG';

-- ── ② KHO DỰ ÁN / KHO MẪU
UPDATE `warehouses` SET `code` = 'KD-002', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-DA-MAU-01';
UPDATE `warehouses` SET `code` = 'KD-003', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-DA06';
UPDATE `warehouses` SET `code` = 'KD-004', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-DIAG';
UPDATE `warehouses` SET `code` = 'KD-005', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-E2E-01';
UPDATE `warehouses` SET `code` = 'KD-006', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'KHO-PRJ-DEMO-01';

-- ── ③ KHO TỔ ĐỘI (TD = tổ đội)
UPDATE `warehouses` SET `code` = 'KD-007', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'TD-E2E-DA-01-E2E-TD01';
UPDATE `warehouses` SET `code` = 'KD-008', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'TD-E2E-DA-01-E2E-TD02';
UPDATE `warehouses` SET `code` = 'KD-009', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'TD-PRJ-DEMO-01-TD-01';
UPDATE `warehouses` SET `code` = 'KD-010', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'TD-PRJ-DEMO-01-TD-02';
UPDATE `warehouses` SET `code` = 'KD-011', `updated_at` = CURRENT_TIMESTAMP(3) WHERE `code` = 'TD-PRJ-DEMO-01-TD-03';

-- ── ④ ⛔ KHÔNG đổi `TRANSIT` (kho HỆ THỐNG — xem khối giải thích ở đầu tệp)
--    ⛔ KHÔNG đổi các mã đã đúng quy tắc `KD-xxx` (chạy lại an toàn).
