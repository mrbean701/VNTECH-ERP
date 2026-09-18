-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11: LÀM MỚI ĐỊNH DANH NGUỒN (tầng kiểm thử đọc hợp nhất nguồn giao diện)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: 3 tệp trong `tests/` (nằm trong tập hash nguồn) đã được sửa để **đọc HỢP NHẤT nguồn giao diện**
-- (`app/page.tsx` + `lib/ui-shared.tsx`) thay vì chỉ `app/page.tsx`:
--   • `tests/runtime-admin-boq-regression.test.mjs` — thêm helper `readUiSource()`, thay **9 chỗ** đọc trực tiếp.
--   • `tests/project-navigation-consolidation.test.mjs` — thay 1 chỗ.
--   • `tests/mobile-menu-interaction.test.mjs` — thay 1 chỗ.
-- **LÝ DO BẮT BUỘC:** bước 1 của `U-11` chuyển các hằng số dùng chung (`defaultMenuGroups`, `NAV_ICON_TONE`…) sang
-- `lib/ui-shared.tsx`. Tầng test vẫn đọc cứng `app/page.tsx` ⇒ **2 test ĐỎ OAN**:
--   `Project/BCH navigation is consolidated into one top-level group` (regex `groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN"`)
--   và `MASTER BASELINE R1.1.1 CSS dynamic contracts` (*"Phải đọc được NAV_ICON_TONE từ source"*).
--   Đo được: **57 pass / 4 fail**, trong khi nền là **59 pass / 2 fail**. Sau khi vá: **về đúng 59/2** (đúng 2 ca đã biết).
--   ⇒ Nếu không vá, **chính tầng kiểm thử chặn việc tách mà roadmap `U-11` yêu cầu**.
--   • **KHÔNG nới lỏng phép kiểm:** mọi literal vẫn phải tồn tại trong nguồn giao diện; chỉ đổi **phạm vi ĐỌC**.
--     Tệp nào chưa tồn tại thì bỏ qua (tương thích ngược với bản chỉ có `app/page.tsx`).
--   • ⚠️ **LỖI CỦA CHÍNH TÔI trong lượt này (ghi lại):** dùng `Set-Content -Encoding UTF8` của PowerShell để thay chuỗi
--     ⇒ **MOJIBAKE toàn bộ tiếng Việt** trong tệp test (đúng lỗi đã ghi trong sổ, nay tái phạm lần nữa).
--     Đã `git checkout --` hoàn tác tệp rồi làm lại **hoàn toàn bằng node (UTF-8)**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='864b84d9f05ae3df5c549ccb30f8d2f057179e0f60105a26b004a8b2f7280ffc'
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
