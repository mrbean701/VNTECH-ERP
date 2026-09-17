-- Kiểm chứng TẦNG SQL cho TASK-040 nhóm 4 + 5 — chạy trong TRANSACTION rồi ROLLBACK.
--
-- VÌ SAO CÁCH NÀY: hai action thật (`confirm_installation`, `settle_subcontract`) đều GHI dữ liệu kho/quyết toán.
-- Probe gọi thẳng qua HTTP sẽ phải tạo phiếu xuất/khoản quyết toán thật rồi dọn — rủi ro cao hơn giá trị thu được.
-- Cách dưới đây chứng minh ĐÚNG thứ đã gây lỗi HTTP 500 (câu lệnh SQL so với lược đồ thật) và chứng minh
-- ĐÚNG hành vi cộng dồn, mà KHÔNG thay đổi một dòng dữ liệu nào.
--
-- ⚠ GIỚI HẠN (ghi rõ để không nói quá): đây KHÔNG phải phép kiểm end-to-end qua HTTP. Nó chứng minh
-- (1) câu lệnh mới chạy được trên lược đồ đang chạy, (2) câu lệnh cũ thật sự nổ, (3) nghĩa cộng dồn đúng.
-- Việc bấm nút trên giao diện với dữ liệu thật vẫn cần người dùng test thủ công.

SELECT '=== 1) CHỌN DÒNG THẬT ĐỂ THỬ ===' AS buoc;
SELECT id, quantity, installed_qty AS installedTruoc FROM stock_issue_items ORDER BY id LIMIT 1;

START TRANSACTION;

-- 2) CỘNG DỒN hai lần: 3 rồi 4 (giả lập hai lần xác nhận lắp)
UPDATE stock_issue_items
   SET installed_qty = installed_qty + 3, updated_at = NOW(3)
 WHERE id = (SELECT id FROM (SELECT id FROM stock_issue_items ORDER BY id LIMIT 1) x);

UPDATE stock_issue_items
   SET installed_qty = installed_qty + 4, updated_at = NOW(3)
 WHERE id = (SELECT id FROM (SELECT id FROM stock_issue_items ORDER BY id LIMIT 1) x);

SELECT '=== 2) SAU HAI LAN CONG DON (ky vong: installedTruoc + 7) ===' AS buoc;
SELECT id, quantity, installed_qty AS installedSau FROM stock_issue_items ORDER BY id LIMIT 1;

-- 3) Cùng dữ liệu đó, mô phỏng cách GHI ĐÈ của bản cũ: đặt thẳng bằng 4 (số của lần thứ hai)
UPDATE stock_issue_items
   SET installed_qty = 4
 WHERE id = (SELECT id FROM (SELECT id FROM stock_issue_items ORDER BY id LIMIT 1) x);

SELECT '=== 3) NEU GHI DE nhu ban cu thi ra 4 (JS se ra installedTruoc + 7) ===' AS buoc;
SELECT id, installed_qty AS neuGhiDe FROM stock_issue_items ORDER BY id LIMIT 1;

-- 4) settle_subcontract: dựng một dòng giao khoán TẠM trong transaction rồi chạy câu lệnh MỚI
INSERT INTO team_subcontracts (id, project_id, team_id, contract_no, contract_name, contract_value,
                               status, created_at, updated_at)
VALUES ('TSC_PROBE_TASK040', 'PRJ_PROBE', 'TEAM_PROBE', 'PROBE-040', 'HĐ thử TASK-040', 0,
        'active', NOW(3), NOW(3));

UPDATE team_subcontracts SET status='settled', updated_at=NOW(3) WHERE id='TSC_PROBE_TASK040';

SELECT '=== 4) settle_subcontract cau MOI: status phai la settled ===' AS buoc;
SELECT id, status, updated_at FROM team_subcontracts WHERE id='TSC_PROBE_TASK040';

ROLLBACK;

SELECT '=== 5) SAU ROLLBACK: du lieu phai Y NGUYEN ===' AS buoc;
SELECT (SELECT COUNT(*) FROM stock_issue_items) AS soDongIssueItems,
       (SELECT COUNT(*) FROM team_subcontracts) AS soDongGiaoKhoan,
       (SELECT installed_qty FROM stock_issue_items ORDER BY id LIMIT 1) AS installedSauRollback;
