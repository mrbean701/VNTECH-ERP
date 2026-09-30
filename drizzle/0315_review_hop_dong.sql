-- MỐC 103 (user 29/09) — MENU «REVIEW HĐ».
-- Nhân sự hành chính ghi nhận việc kiểm tra/review hợp đồng.
--
-- ⛔ KHÔNG dùng `KEY`/`ENGINE=` (làm hỏng test SQLite).
-- ⛔ KHÔNG dùng `DEFAULT CURRENT_TIMESTAMP` trên VARCHAR (ERROR 1067).
-- ⛔ KHÔNG dùng `) DEFAULT CHARSET=… COLLATE=…` — đó là cú pháp MySQL, SQLite KHÔNG có
--    ⇒ lỗi "near DEFAULT: syntax error" ⇒ scripts/local-runtime.mjs ném lỗi ⇒ UI KHÔNG
--    khởi động được. File trong `drizzle/` chỉ chạy trên SQLite; MySQL dùng riêng
--    `java-backend/…/db/migration/V*.sql` (Flyway) nên không cần (và không được) khai
--    CHARSET/COLLATE ở đây. Tương tự: dùng `datetime('now')` thay `NOW()`,
--    `a || b` thay `CONCAT(a,b)`.

-- 1) Danh sách hợp đồng cần review.
CREATE TABLE contract_reviews (
  id                    VARCHAR(64) NOT NULL,
  contract_id           VARCHAR(64) NOT NULL,   -- labor_contracts.id
  contract_no           VARCHAR(64) NULL,       -- mã hợp đồng (chụp để hiển thị nhanh)
  contract_type         VARCHAR(64) NULL,       -- loại hợp đồng
  contract_name         VARCHAR(128) NULL,      -- tên hợp đồng
  sender_name           VARCHAR(128) NULL,      -- BÊN GỬI
  receiver_name         VARCHAR(128) NULL,      -- BÊN NHẬN
  received_date         VARCHAR(32) NULL,       -- NGÀY NHẬN
  review_date           VARCHAR(32) NULL,       -- NGÀY REVIEW
  viewed                INT NOT NULL DEFAULT 0, -- TRẠNG THÁI: 1 = đã xem, 0 = chưa xem
  last_reviewer_id      VARCHAR(64) NULL,
  last_reviewer_name    VARCHAR(128) NULL,
  note                  VARCHAR(1000) NULL,
  created_by            VARCHAR(64) NULL,
  created_at            VARCHAR(32) NULL,
  updated_at            VARCHAR(32) NULL,
  PRIMARY KEY (id)
);

-- 2) LỊCH SỬ REVIEW — mỗi lần nhân sự mở/ghi nhận là 1 dòng.
--    `duration_seconds` = THỜI GIAN THAO TÁC (tính từ lúc mở tới lúc đóng modal).
CREATE TABLE contract_review_logs (
  id                VARCHAR(64) NOT NULL,
  review_id         VARCHAR(64) NOT NULL,      -- contract_reviews.id
  contract_id       VARCHAR(64) NULL,
  reviewed_at       VARCHAR(32) NULL,          -- THỜI GIAN REVIEW
  duration_seconds  INT NULL,                  -- THỜI GIAN THAO TÁC (giây)
  status            VARCHAR(32) NULL,          -- TRẠNG THÁI: viewed / reviewed
  reviewer_id       VARCHAR(64) NULL,          -- NGƯỜI REVIEW
  reviewer_name     VARCHAR(128) NULL,
  comment           VARCHAR(1000) NULL,
  created_at        VARCHAR(32) NULL,
  PRIMARY KEY (id)
);

-- 3) Seed: nạp 2 hợp đồng lao động hiện có vào danh sách cần review (chưa xem).
INSERT INTO contract_reviews (id,contract_id,contract_no,contract_type,contract_name,
                              sender_name,receiver_name,received_date,viewed,created_at,updated_at)
SELECT 'CR_' || lc.id, lc.id, lc.contract_no, lc.contract_type,
       'Hợp đồng lao động ' || IFNULL(lc.contract_no,''),
       u.full_name, NULL, lc.signing_date, 0, datetime('now'), datetime('now')
FROM labor_contracts lc LEFT JOIN users u ON u.id = lc.user_id;
