-- MỐC 103b (30/09/2026) — SỬA DỮ LIỆU MOJIBAKE do seed qua kết nối sai charset.
--
-- ⛔ NGUYÊN NHÂN: hai giá trị dưới đây được ghi bằng CHUỖI LITERAL trong câu INSERT của
--    một client có charset sai, nên ký tự Việt bị hỏng NGAY TRONG CSDL (không phải lỗi hiển thị):
--      · contract_reviews.contract_name  → DOUBLE-ENCODE  (khôi phục được)
--      · module_catalog.dept_legal_contract_review.label / group_name
--                                        → MẤT DỮ LIỆU: 'Đ' và 'ế' bị thay bằng '?' (0x3F)
--    Các cột `contract_no`, `sender_name` KHÔNG hỏng vì chúng được copy cột→cột bên trong MySQL
--    (không đi qua client).
--
-- ⛔ CÁCH SỬA: dùng HEX LITERAL + CONVERT(... USING utf8mb4) — đầu vào thuần ASCII nên
--    KHÔNG phụ thuộc charset của kết nối, chạy đúng dù client là latin1/cp850/utf8mb4.
--
-- ⛔ AN TOÀN: mỗi câu UPDATE đều có ĐIỀU KIỆN CHỈ CHẠM DÒNG HỎNG ⇒ chạy lại nhiều lần
--    vẫn đúng (idempotent) và KHÔNG ghi đè tên hợp đồng do người dùng tự nhập.

-- 1) contract_reviews.contract_name — chỉ sửa dòng còn ký tự box-drawing (dấu hiệu mojibake).
--    Giá trị đúng = 'Hợp đồng lao động ' || contract_no
UPDATE contract_reviews
SET contract_name = CONCAT(CONVERT(0x48E1BBA37020C491E1BB936E67206C616F20C491E1BB996E6720 USING utf8mb4),
                           IFNULL(contract_no, ''))
WHERE contract_name REGEXP '[├┬╗┤║╣]';

-- 2) module_catalog — chỉ sửa khi nhãn còn dấu '?' do mất ký tự.
--    label      = 'Review HĐ'
--    group_name = 'Hành chính & Pháp chế'
UPDATE module_catalog
SET label      = CONVERT(0x5265766965772048C490 USING utf8mb4),
    group_name = CONVERT(0x48C3A06E68206368C3AD6E682026205068C3A170206368E1BABF USING utf8mb4)
WHERE module_key = 'dept_legal_contract_review'
  AND label LIKE '%H?';
