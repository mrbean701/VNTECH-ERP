-- D5/B2 end-to-end ROLLBACK (18/09) — khôi phục PO test nếu script bị dừng giữa chừng
UPDATE purchase_orders SET status='delivered_pending_confirmation', decision_reason=NULL, decided_by=NULL, decided_at=NULL WHERE id='PO_8de5877e-9160-422b-9d80-6fb47899258d';
DELETE FROM task_notifications WHERE user_id='USR_8869ca60-7c6a-4e7f-bebd-0547f38bcdb8' AND body LIKE '%KIỂM THỬ end-to-end%';
