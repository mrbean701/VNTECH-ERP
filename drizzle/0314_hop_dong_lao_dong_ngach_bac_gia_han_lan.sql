-- MỐC 102 (user 29/09) — HỢP ĐỒNG LAO ĐỘNG: bổ sung trường dữ liệu.
--   1) `job_rank`      — NGẠCH (ví dụ: chuyên gia, nhà nghiên cứu…)
--   2) `grade`         — BẬC (ví dụ: bậc 1, bậc 2…)
--   3) `renewal_round` — GIA HẠN HĐ lần N (0 = hợp đồng gốc, 1 = gia hạn lần 1, 2 = lần 2…)
--
-- ⛔ ĐẶT TÊN `job_rank` THAY VÌ `rank`: `RANK` là **TỪ KHOÁ DỰ TRêNG** trong MySQL 8.0
--    (ERROR 1064 khi dùng làm tên cột) — đây là lý do, không phải lỗi cú pháp ngẫu nhiên.
-- ⛔ KHÔNG dùng `KEY`/`ENGINE=` (làm hỏng test SQLite); KHÔNG dùng `VARCHAR(32)` + `DEFAULT CURRENT_TIMESTAMP` (ERROR 1067).
-- ⛔ 3 cột đều NULL được ⇒ dữ liệu cũ KHÔNG hỏng.
ALTER TABLE labor_contracts ADD COLUMN job_rank VARCHAR(64) NULL;
ALTER TABLE labor_contracts ADD COLUMN grade VARCHAR(64) NULL;
ALTER TABLE labor_contracts ADD COLUMN renewal_round INT NULL;
-- ⛔ Hợp đồng cũ = lần 0 (không phải gia hạn).
UPDATE labor_contracts SET renewal_round = 0 WHERE renewal_round IS NULL;
