-- ============================================================================
-- VNTECH ERP V5.3.0 — TASK-080 đợt 2B: ĐIỀN DỮ LIỆU THẬT CÒN THIẾU (MySQL)
-- ============================================================================
-- Chỉ thị người dùng: "từ giờ không hardcode nữa chỉ sử dụng dữ liệu thật, nếu chưa có
-- thì hãy insert đầy đủ để có căn cứ cho việc test luồng và mô phỏng hoạt động thực tế."
--
-- Hai lỗ hổng dữ liệu được xử lý ở đây (đều phát hiện bằng ĐO, không suy đoán):
--
-- (1) role_catalog.default_organization_unit_id NULL 16/16 (MySQL)
--     Nguồn quy tắc THẬT đã có sẵn trong kho mã: drizzle/0045_patch01_runtime_admin_boq_hardening.sql
--     dòng 80-90 (ánh xạ vai trò → đơn vị mặc định) nhưng CHỈ chạy trên SQLite, CHƯA hề port sang MySQL
--     ⇒ Java đọc `ou.code AS defaultOrganizationCode` qua LEFT JOIN nên luôn NULL.
--     ⚠️ KHÔNG chép nguyên literal 'ORG-KH'/'ORG-TCKT'/... của 0045: MySQL dùng ID HỖN HỢP
--     (`ORG-BGD`/`ORG-DA`/`ORG-HCPC` là chuỗi mã, còn BCH/KH/TCKT/VNTECH/VNTECH-01 là `ORG_<uuid>`
--     sau migration V13 gộp đơn vị trùng) ⇒ phải JOIN theo `organization_units.code`.
--     Vai trò `team` (Tổ đội) KHÔNG có trong ánh xạ của 0045 ⇒ GIỮ NULL và ghi thành câu hỏi cho
--     người dùng (đúng luật §45: không tự suy đoán nghiệp vụ).
--
-- (2) Phiếu nhập có `bch_confirmation_status='confirmed'` nhưng THIẾU người/ngày xác nhận BCH
--     Đo được: 12 phiếu confirmed, trong đó 10 phiếu `bch_confirmed_by` NULL và 2 phiếu trỏ tới
--     `USR_2f435847-8a39-44fe-b620-6e52186526e0` — ID này KHÔNG tồn tại trong `users` (tham chiếu treo,
--     sinh ra bởi các lượt smoke trước) ⇒ Java LEFT JOIN users ra NULL ⇒ UI in chữ dự phòng.
--     Người xác nhận thật được chọn theo ĐÚNG vai trò nghiệp vụ: cột UI là "BCH XÁC NHẬN" và
--     `cha.ht` = "Chỉ huy trưởng A", vai trò `cht` (Ban chỉ huy trưởng) — cùng Ban chỉ huy công trường
--     với kho nhận `KHO-DA-MAU-01` của dự án PRJ-DEMO-01.
--
-- Bản sao lưu trước khi sửa: tools/_backup-bch-roleorg-truoc-TASK080B.txt
-- Áp dụng: mysql -uvntech -pvntech --default-character-set=utf8mb4 vntech_erp < tools/task080b-seed-real-data.sql
-- ============================================================================

-- (1) Ánh xạ vai trò → đơn vị mặc định, theo ĐÚNG quy tắc của drizzle/0045, tra ID theo `code`.
UPDATE role_catalog rc JOIN organization_units ou ON ou.code='BGD'
   SET rc.default_organization_unit_id=ou.id
 WHERE rc.code IN ('director','thuky') AND rc.default_organization_unit_id IS NULL;

UPDATE role_catalog rc JOIN organization_units ou ON ou.code='KH'
   SET rc.default_organization_unit_id=ou.id
 WHERE rc.code IN ('kh_truong','kh_nv','procurement') AND rc.default_organization_unit_id IS NULL;

UPDATE role_catalog rc JOIN organization_units ou ON ou.code='DA'
   SET rc.default_organization_unit_id=ou.id
 WHERE rc.code IN ('da_truong','da_nv','project') AND rc.default_organization_unit_id IS NULL;

UPDATE role_catalog rc JOIN organization_units ou ON ou.code='TCKT'
   SET rc.default_organization_unit_id=ou.id
 WHERE rc.code='accountant' AND rc.default_organization_unit_id IS NULL;

UPDATE role_catalog rc JOIN organization_units ou ON ou.code='BCH'
   SET rc.default_organization_unit_id=ou.id
 WHERE rc.code IN ('ksda','cht','engineer','commander','thu_kho','warehouse') AND rc.default_organization_unit_id IS NULL;

-- (2a) 10 phiếu confirmed chưa có người xác nhận: gán người xác nhận THẬT + mốc thời gian THẬT
--      (mốc = chính thời điểm nhận hàng, đúng như sản phẩm ghi khi BCH xác nhận trong cùng lượt nhập).
UPDATE goods_receipts gr JOIN users u ON u.username='cha.ht'
   SET gr.bch_confirmed_by=u.id,
       gr.bch_confirmed_at=gr.received_at,
       gr.bch_comment=COALESCE(gr.bch_comment,'BCH xác nhận giao hàng – seed demo')
 WHERE gr.bch_confirmation_status='confirmed' AND gr.bch_confirmed_by IS NULL;

-- (2b) 2 phiếu confirmed trỏ tới người dùng KHÔNG tồn tại ⇒ sửa về người xác nhận thật (giữ nguyên
--      mốc thời gian thật đã có, chỉ thay ID treo).
UPDATE goods_receipts gr JOIN users u ON u.username='cha.ht'
   SET gr.bch_confirmed_by=u.id
 WHERE gr.bch_confirmation_status='confirmed'
   AND gr.bch_confirmed_by IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM users x WHERE x.id=gr.bch_confirmed_by);

-- ============================================================================
-- NGHIỆM THU (chạy sau khi áp dụng)
-- ============================================================================
-- Kỳ vọng: vai_tro_co_don_vi=15 · vai_tro_con_null=1 (chỉ 'team') · phieu_thieu_nguoi=0 · phieu_treo=0
SELECT
  (SELECT COUNT(*) FROM role_catalog WHERE default_organization_unit_id IS NOT NULL) AS vai_tro_co_don_vi,
  (SELECT COUNT(*) FROM role_catalog WHERE default_organization_unit_id IS NULL)     AS vai_tro_con_null,
  (SELECT COUNT(*) FROM goods_receipts WHERE bch_confirmation_status='confirmed' AND bch_confirmed_by IS NULL) AS phieu_thieu_nguoi,
  (SELECT COUNT(*) FROM goods_receipts gr WHERE gr.bch_confirmed_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users x WHERE x.id=gr.bch_confirmed_by)) AS phieu_treo;
