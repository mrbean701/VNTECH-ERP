-- MỐC 103b (30/09/2026) — SỬA DỮ LIỆU MOJIBAKE do seed qua kết nối sai charset.
--
-- NGUYÊN NHÂN (đã đo bằng HEX, không phải phỏng đoán): hai giá trị dưới đây được ghi bằng
-- CHUỖI LITERAL trong câu INSERT của một client có charset sai, nên ký tự Việt hỏng NGAY
-- TRONG CSDL (không phải lỗi hiển thị):
--   · contract_reviews.contract_name                       -> DOUBLE-ENCODE (khôi phục được)
--   · module_catalog.dept_legal_contract_review.label/group_name
--                                                          -> MẤT DỮ LIỆU: 'Đ' và 'ế' thành '?' (0x3F)
-- Các cột `contract_no`, `sender_name` KHÔNG hỏng vì chúng được copy cột→cột bên trong CSDL
-- (không đi qua client).
--
-- ⛔ BẢN VIẾT LẠI 30/09/2026 — SAU SỰ CỐ UI :8787 KHÔNG KHỞI ĐỘNG ĐƯỢC:
--    Bản đầu dùng CONVERT(0x… USING utf8mb4) — cú pháp CHỈ CÓ Ở MySQL — làm
--    `scripts/local-runtime.mjs` chết với:  near "USING": syntax error
--    `drizzle/*.sql` được áp cho CẢ HAI nơi:
--      · SQLite  (UI :8787, `scripts/local-runtime.mjs`, file .local-data/warehouse.sqlite)
--      · MySQL   (backend Java :18081)
--    ⇒ MỌI CÂU LỆNH Ở ĐÂY PHẢI CHẠY ĐƯỢC TRÊN CẢ HAI.
--    ĐƯỢC dùng : UPDATE, LIKE, CONCAT(), IFNULL(), literal UTF-8.
--    CẤM dùng  : CONVERT(… USING …), REGEXP, phép `||`, introducer _utf8mb4''.
--    Khi chạy tay trên MySQL PHẢI chỉ định --default-character-set=utf8mb4.
--
-- AN TOÀN: mỗi câu UPDATE đều có ĐIỀU KIỆN CHỈ CHẠM DÒNG HỎNG ⇒ chạy lại nhiều lần vẫn
-- đúng (idempotent) và KHÔNG ghi đè tên hợp đồng do người dùng tự nhập.

UPDATE contract_reviews
SET contract_name = CONCAT('Hợp đồng lao động ', IFNULL(contract_no, ''))
WHERE contract_name LIKE '%├%'
   OR contract_name LIKE '%┬%'
   OR contract_name LIKE '%╗%'
--> statement-breakpoint
UPDATE module_catalog
SET label      = 'Review HĐ',
    group_name = 'Hành chính & Pháp chế'
WHERE module_key = 'dept_legal_contract_review'
  AND (label IS NULL OR label <> 'Review HĐ')
