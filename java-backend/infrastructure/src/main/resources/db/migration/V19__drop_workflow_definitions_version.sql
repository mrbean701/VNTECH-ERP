-- [PHASE 8 · WF-03] Xoá cột DEAD workflow_definitions.version
-- Bằng chứng: KHÔNG nơi nào đọc cột này (không getInt/AS/select); chỉ có INSERT liệt kê vì cột NOT NULL DEFAULT 1.
-- Lộ trình WF-03: "Dùng cột workflow_definitions.version hoặc xoá nếu không dùng" => đã chứng minh KHÔNG DÙNG => XOÁ.
ALTER TABLE workflow_definitions DROP COLUMN version;
