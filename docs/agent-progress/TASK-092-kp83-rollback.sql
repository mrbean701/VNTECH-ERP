-- KP #83 ROLLBACK (18/09) — hoàn tác sửa contract_payments PRJ-DEMO-01 (người dùng đã duyệt sửa dữ liệu test).
UPDATE contract_payments SET amount=1000000000.0000 WHERE id='PAY_ed2efce9-cb2b-4262-99ab-fcc06b379071'; -- Thanh toán đợt 2 - nghiệm thu giai đoạn 1
UPDATE contract_payments SET amount=500000000.0000 WHERE id='PAY_e7737af2-1cd3-4e79-a757-d53341523204'; -- Tạm ứng 20% giá trị hợp đồng
