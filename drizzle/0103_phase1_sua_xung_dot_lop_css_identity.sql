-- VNTECH ERP V5.3.0 — PHASE 1: SỬA XUNG ĐỘT TÊN LỚP CSS CỦA THƯ VIỆN DÙNG CHUNG
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO CẦN VÒNG REFRESH NÀY:
-- Cổng so ảnh tools/probe-visual-regression.mjs báo 28/28 ảnh lệch sau khi thêm thư viện
-- app/components/ui — không phải nhiễu, mà là lỗi thật do đặt tên lớp thiếu namespace.
--
--   app/globals.css:161  đã định nghĩa .timeline { padding:14px; display:grid;
--                        grid-template-columns:repeat(3,1fr); gap:12px }
--                        cho DẢI PHÊ DUYỆT 3 CỘT đang chạy thật.
--   app/styles/canonical.css (mục 14) lại khai báo .timeline { list-style:none; margin:0;
--                        padding:0; display:flex; flex-direction:column }
--
-- Hai quy tắc trùng tên ⇒ quy tắc thêm sau ĐÈ toàn cục: dải phê duyệt 3 cột biến thành danh
-- sách dọc trên MỌI màn hình có dùng nó (kèm cả .timeline>div của request-drawer).
--
-- ĐÃ SỬA:
--   • Đổi toàn bộ họ lớp Timeline của thư viện sang namespace `vt-` khớp quy ước token --vt-*:
--       .timeline*  →  .vt-timeline*        (12 lớp, cả trong Timeline.tsx và canonical.css)
--   • Ghi quy tắc bắt buộc vào đầu mục 14 của canonical.css: lớp của thư viện dùng chung
--     PHẢI có tiền tố `vt-`, không dùng tên trần. Kèm ghi chú lỗi thật để không tái diễn.
--
-- ĐÃ RÀ SOÁT XUNG ĐỘT (trước khi sửa):
--   đối chiếu từng lớp mới với globals.css + font-floor.css + tokens.css —
--   .dt-* · .list-toolbar* · .edm-* · .entity-detail-modal  →  0 xung đột
--   .timeline                                                 →  1 xung đột (đã sửa)
--
-- Cổng so ảnh được chạy lại KHÔNG cập nhật baseline: nếu về 28/28 lệch 0 điểm ảnh thì
-- chứng minh đúng nguyên nhân là xung đột tên lớp, không phải thay đổi giao diện có chủ đích.
--
-- 13/13 probe hồi quy chức năng (layout · page-assets · request-page · project-screen ·
-- work-center · work-permission · team-screen · material-tabs · material-list · material-perm ·
-- dept-perm · staff-full · live-stack) đều ĐẠT — phần chức năng không suy suyển.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='3081f17f7474d2c97911ae67a85e7f5e3491b34e50b92a8f9ee730777aba7bf4'
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
