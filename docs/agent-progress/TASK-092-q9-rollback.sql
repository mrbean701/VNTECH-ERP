-- Q9 ROLLBACK (18/09/2026) — hoàn tác chỉnh lịch thanh toán PRJ-DEMO-01 về số cũ.
-- Sinh tự động TRƯỚC khi ghi. Chạy trên CSDL nào thì hoàn tác CSDL đó.
UPDATE payment_plans SET planned_amount=500000000 WHERE id='PPL_671078e9-1ddf-4e19-b7a8-1330505e9c18'; -- PPL-PRJ-DEMO-01-0001 (Tạm ứng 20%)
UPDATE payment_plans SET planned_amount=1000000000 WHERE id='PPL_c4518d08-317e-4d54-a771-632b060d9c41'; -- PPL-PRJ-DEMO-01-0002 (Nghiệm thu giai đoạn 1)
UPDATE payment_plans SET planned_amount=800000000 WHERE id='PPL_daf6e99d-8883-41b8-82c1-43026bec4336'; -- PPL-PRJ-DEMO-01-0003 (Quyết toán công trình)
