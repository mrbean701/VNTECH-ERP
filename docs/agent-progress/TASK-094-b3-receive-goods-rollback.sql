-- B3 rollback (chạy nếu probe bị dừng giữa chừng)
DELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT id FROM goods_receipts WHERE purchase_order_id='PO_0843c57c-8531-483a-919e-d99712e3da9e');
DELETE FROM goods_receipts WHERE purchase_order_id='PO_0843c57c-8531-483a-919e-d99712e3da9e';
UPDATE purchase_orders SET status='pending_approval' WHERE id='PO_0843c57c-8531-483a-919e-d99712e3da9e';
UPDATE purchase_order_items SET delivered_qty=0, received_qty=0 WHERE id='POI_c90386c0-2fa7-4323-bcd1-c9ec088ea2d2';
UPDATE material_requests SET status='approved' WHERE id='MR_4ef05500-ce77-4d06-93a6-c77e99048ceb';
