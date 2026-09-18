-- VNTECH ERP V5.3.0 — [WF] PHASE 8 · ĐỢT B2 / D3: trạng thái + QUYẾT ĐỊNH cho ĐƠN MUA HÀNG (PO)
-- Người dùng đã xác nhận báo cáo CSDL (D1–D5) ngày 18/09. Parity với `drizzle/0144_wf_b2_po_decision.sql`.
--
-- VÌ SAO: luồng **TỪ CHỐI PO** (người dùng chốt) cần ghi được: PO bị HỦY, **lý do**, **ai quyết**, **khi nào**
-- và **PR vẫn mở** (KHÔNG đổi `material_requests`) + **thông báo cho người tạo PO**.
--
-- ĐÃ ĐO TRƯỚC KHI VIẾT (không đoán):
--   • `purchase_orders.status` = **varchar(255) NOT NULL DEFAULT 'draft'** ⇒ các giá trị mới
--     (`pending_approval` / `approved` / `cancelled`) **KHÔNG cần ALTER kiểu/enum**.
--   • Trạng thái đang dùng thực tế: `completed` · `delivered_pending_confirmation` · `waiting_delivery` (7 PO) ⇒ **giữ nguyên**.
--   • **Chưa có** cột quyết định nào ⇒ thêm **3 cột NULLABLE** (an toàn với 7 dòng hiện có, không backfill).

ALTER TABLE purchase_orders ADD COLUMN decision_reason VARCHAR(500) NULL;
ALTER TABLE purchase_orders ADD COLUMN decided_by VARCHAR(64) NULL;
ALTER TABLE purchase_orders ADD COLUMN decided_at DATETIME NULL;

-- (Không tạo bảng mới. Không đổi kiểu cột. Không backfill ⇒ 7 PO hiện có giữ nguyên hành vi.)
