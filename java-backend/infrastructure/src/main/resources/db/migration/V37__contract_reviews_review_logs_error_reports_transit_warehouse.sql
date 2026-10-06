-- V37 — BỔ SUNG CẤU TRÚC MÀ JAVA DÙNG NHƯNG CHƯA MIGRATION NÀO TẠO.
-- Sinh từ kiểm chứng thực tế (TASK-142 · L-09 + L-10), không đoán:
--   · `contract_reviews` + `contract_review_logs` — `ContractReviewStoreAdapter.java:53,76,83,101,130,143`
--   · `error_reports`                             — `ErrorReportStoreAdapter.java:47,72,86,95`
--   · kho `TRANSIT`                              — `StockManagementUseCase.java:624 findTransitWarehouse()`
--
-- ⛔ GHI CHÚ QUAN TRỌNG: tại thời điểm viết file này, CSDL thật (`flyway_schema_history`)
--    mới tới V31; V32–V35 và V37 này CHƯA từng chạy. Ba bảng dưới đây có thể đã tồn tại
--    do `drizzle/` tạo trước đó ⇒ dùng `CREATE TABLE IF NOT EXISTS` và `INSERT IGNORE`
--    để chạy lại nhiều lần vẫn an toàn, không ghi đè dữ liệu đang có.
-- ⛔ File này CHƯA được chạy. Xem `DECISIONS.md` D-082.

-- 1) contract_reviews — danh sách hợp đồng cần review (menu «REVIEW HĐ»).
--    Cột bám sát `drizzle/0315_review_hop_dong.sql` và đúng thứ tự truy vấn của adapter.
CREATE TABLE IF NOT EXISTS contract_reviews (
  id                   VARCHAR(64)   NOT NULL,
  contract_id          VARCHAR(64)   NOT NULL,  -- labor_contracts.id
  contract_no          VARCHAR(64)   NULL,      -- chụp mã để hiển thị nhanh
  contract_type        VARCHAR(64)   NULL,      -- loại hợp đồng
  contract_name        VARCHAR(128)  NULL,
  sender_name          VARCHAR(128)  NULL,      -- BÊN GỬI
  receiver_name        VARCHAR(128)  NULL,      -- BÊN NHẬN
  received_date        VARCHAR(32)   NULL,      -- NGÀY NHẬN
  review_date          VARCHAR(32)   NULL,      -- NGÀY REVIEW
  viewed               INT           NOT NULL DEFAULT 0,  -- 1 = đã xem, 0 = chưa xem
  last_reviewer_id     VARCHAR(64)   NULL,
  last_reviewer_name   VARCHAR(128)  NULL,
  note                 VARCHAR(1000) NULL,
  created_by           VARCHAR(64)   NULL,
  created_at           VARCHAR(32)   NULL,
  updated_at           VARCHAR(32)   NULL,
  PRIMARY KEY (id)
);

-- 2) contract_review_logs — lịch sử, mỗi lần nhân sự mở/ghi nhận là 1 dòng.
--    `duration_seconds` = THỜI GIAN THAO TÁC (tính từ lúc mở tới lúc đóng modal).
CREATE TABLE IF NOT EXISTS contract_review_logs (
  id                VARCHAR(64)   NOT NULL,
  review_id         VARCHAR(64)   NOT NULL,     -- contract_reviews.id
  contract_id       VARCHAR(64)   NULL,
  reviewed_at       VARCHAR(32)   NULL,         -- THỜI GIAN REVIEW
  duration_seconds  INT           NULL,         -- THỜI GIAN THAO TÁC (giây)
  status            VARCHAR(32)   NULL,         -- viewed / reviewed
  reviewer_id       VARCHAR(64)   NULL,
  reviewer_name     VARCHAR(128)  NULL,
  comment           VARCHAR(1000) NULL,
  created_at        VARCHAR(32)   NULL,
  PRIMARY KEY (id)
);

-- 3) error_reports — chức năng Báo lỗi · tab 14 (MỐC 42).
CREATE TABLE IF NOT EXISTS error_reports (
  id                  VARCHAR(64)   NOT NULL,
  report_code         VARCHAR(64)   NULL,
  report_type         VARCHAR(64)   NULL,
  title               VARCHAR(255)  NULL,
  module_key          VARCHAR(64)   NULL,
  content             TEXT          NULL,
  user_id             VARCHAR(64)   NULL,
  username            VARCHAR(128)  NULL,
  full_name           VARCHAR(128)  NULL,
  employee_code       VARCHAR(64)   NULL,
  organization_unit_id VARCHAR(64)  NULL,
  organization_name   VARCHAR(128)  NULL,
  status              VARCHAR(32)   NOT NULL DEFAULT 'open',  -- open / resolved
  resolved_at         VARCHAR(32)   NULL,
  resolution_note     VARCHAR(1000) NULL,
  created_at          VARCHAR(32)   NULL,
  updated_at          VARCHAR(32)   NULL,
  PRIMARY KEY (id)
);

-- 4) Kho Transit — `createTransferOrder` (StockManagementUseCase:624) gọi
--    `findTransitWarehouse()`; không có kho này thì mọi phiếu điều chuyển kho trung tâm
--    → kho đội đều dừng ở bước kiểm tra kho trước khi ghi bất cứ thứ gì.
--    `transit` là loại kho mà `:623` cố ý CHỐN, nên tuyệt đối không gán kho dự án vào đây.
INSERT IGNORE INTO warehouses
  (id, code, name, type, project_id, parent_warehouse_id, keeper_user_id, active, created_at, updated_at)
VALUES
  ('WH-TRANSIT', 'TRANSIT', 'Hàng đang vận chuyển', 'transit', NULL, NULL, NULL, 1,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5) Nạp hợp đồng lao động hiện có vào danh sách cần review — chỉ khi bảng vừa tạo rỗng,
--    để không nhân bản những dòng người dùng đã xử lý trên DB đã có bảng sẵn.
INSERT INTO contract_reviews
  (id, contract_id, contract_no, contract_type, contract_name,
   sender_name, receiver_name, received_date, viewed, created_at, updated_at)
SELECT CONCAT('CR_', lc.id), lc.id, lc.contract_no, lc.contract_type,
       CONCAT('Hợp đồng lao động ', IFNULL(lc.contract_no, '')),
       u.full_name, NULL, lc.signing_date, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM labor_contracts lc
LEFT JOIN users u ON u.id = lc.user_id
WHERE NOT EXISTS (SELECT 1 FROM contract_reviews cr WHERE cr.contract_id = lc.id);