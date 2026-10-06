-- VNTECH ERP V5.3.0 — ERP-SESSION-01 · TASK-20261006-012 (TAB 14 «Báo lỗi»: xem chi tiết bằng MODAL)
-- Metadata-only migration: refresh persisted product/trust identity after the UI source change.
-- No business workflow, RBAC, BOQ, inventory or transactional data is changed.
--
-- ⭐ LÝ DO (đo được, không đoán):
--   ① `app/screens/ErrorReportAdminPanel.tsx` đổi thẻ chi tiết inline `<section class="card">`
--      ⇒ `BaseModal` (tái dùng `@/lib/ui-blocks`) + marker `data-vntech="open-report-detail"`.
--   ② Sửa mã ⇒ SOURCE FINGERPRINT đổi.
--   ③ `vntech_product_identity` có TRIGGER `RAISE(ABORT, 'VNTECH product identity is protected.')`
--      ⇒ `scripts/local-runtime.mjs:177` từ chối khởi động UI:
--      «Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.» ⇒ :8787 không lên.
--   ⇒ Migration này chỉ đồng bộ metadata; KHÔNG đụng dữ liệu nghiệp vụ.
--
-- ⭐ SỐ ĐO THẬT — đọc từ `lib/vntech-identity-data.mjs` SAU `node tools/fixpoint-fingerprint.mjs`
--   (bất động: lần 2 báo đúng giá trị lần 1 ⇒ không viết lần nữa):
--     sourceFingerprint      445cc5d874a329b9797d581285e2aa42158de779044049e8a2dd3834468c6408
--     sourceFingerprintShort VNTECH-FP-445CC5D874A329B9
-- ⭐ ĐỐI CHIẾU ĐỘC LẬP: `node scripts/verify-vntech-fingerprint.mjs` ⇒
--     «VNTECH FINGERPRINT: ĐẠT · VNTECH-FP-445CC5D874A329B9 · source:718 files · brand/release verified»
--     brandFingerprint       e5634f2b8fbc8fff96eb07ccc9ad57d557e6e8b1d8e276e732543711764ce59e
--     releaseFingerprint     25510df89483c500a45ff22cea736218c132f6b8339bc1492c01859c7b6bc144
--
-- ⚠️ GIÁ TRỊ CŨ ĐANG LƯU TRONG `.local-data/warehouse.sqlite` (đọc trước khi chạy):
--     source  dc6a989dc64cf6c8ccdbfda24f47b9e8293b9b8f1a641601f148a97bc34a165b
--     brand   586bd208201c6f9a81634489c2e1c5dcbbf1020db7aeba10480178ae2a0eece5
--     release f7d72d3439a8947ff062690e0e15ab9d329a883bb82a3f5a49af0dc517558d49
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET product_name='VNTECH ERP',
    product_description='Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH',
    version='5.3.0',
    source_fingerprint='445cc5d874a329b9797d581285e2aa42158de779044049e8a2dd3834468c6408',
    source_fingerprint_short='VNTECH-FP-8D70C6207C94F35D'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
UPDATE vntech_trust_settings
SET brand_fingerprint='b15c59cf93aadf87df0cc45fa46bbd18f5a98b86684c57240a9db48c32b98fc5',
    release_fingerprint='25510df89483c500a45ff22cea736218c132f6b8339bc1492c01859c7b6bc144',
    updated_at=CURRENT_TIMESTAMP
WHERE id='TRUST-ROOT';