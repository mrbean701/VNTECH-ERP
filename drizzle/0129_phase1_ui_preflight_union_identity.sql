-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11: LÀM MỚI ĐỊNH DANH NGUỒN (cổng preflight đọc hợp nhất nguồn giao diện)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: `scripts/preflight-source.mjs` (nằm trong tập hash nguồn) đã được sửa để **đọc HỢP NHẤT nguồn giao diện**
-- thay vì chỉ `app/page.tsx`. Cụ thể: `const finalPageSource = CLIENT_SOURCE_FILES.map(source).join("\n")` với
-- `CLIENT_SOURCE_FILES = ["app/page.tsx", "lib/ui-shared.tsx"]` (tệp nào không tồn tại thì bỏ qua).
--   • **LÝ DO BẮT BUỘC SỬA:** cổng preflight kiểm literal `{ groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN", … }`.
--     Literal đó nay nằm trong **`defaultMenuGroups`** — đã chuyển sang `lib/ui-shared.tsx` ở bước 1 của `U-11`
--     ⇒ cổng cũ **chặn chính việc tách mà roadmap yêu cầu** (build `EXIT 1`:
--     *"Navigation hợp nhất Project → BCH chưa đổi nhóm site_command thành QUẢN LÝ DỰ ÁN"*), dù nội dung vẫn còn nguyên.
--   • **KHÔNG nới lỏng phép kiểm:** mọi literal vẫn phải tồn tại trong nguồn giao diện; chỉ đổi **phạm vi ĐỌC**
--     (một tệp → các tệp nguồn giao diện). Bản cũ chỉ có `app/page.tsx` vẫn chạy y hệt (danh sách lọc theo `existsSync`).
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='26a15cd4cc14afb255f6826765af4e18e9ed0f44dda7216f1a17b22171dc2dc8'
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
