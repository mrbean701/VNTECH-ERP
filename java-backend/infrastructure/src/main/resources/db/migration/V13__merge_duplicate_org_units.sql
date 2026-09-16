-- ============================================================================
-- V13 — GỘP ĐƠN VỊ TỔ CHỨC TRÙNG (DỌN DỮ LIỆU MẪU — ĐỢT P7)
-- ----------------------------------------------------------------------------
-- HIỆN TRẠNG: `organization_units` có nhiều bản ghi cho cùng một đơn vị, do dữ liệu
-- được nạp từ hai nguồn (seed cũ 14/09 dạng `ORG_<uuid>` và seed mới 15/09 dạng
-- `ORG-<MÃ>`). Hệ quả người dùng thấy: dropdown phòng ban hiển thị TRÙNG tên
-- ("Phòng Kế hoạch" hai lần), và quyền phòng ban bị chia đôi giữa hai bản ghi.
--
-- Trường hợp đáng chú ý — "Phòng Dự án" KHÔNG chỉ trùng mã:
--   • ORG_cf90877b… (mã DA-01) có 2 NGƯỜI DÙNG
--   • ORG-DA        (mã DA)    có 13 QUYỀN PHÒNG BAN
--   ⇒ cả hai đều đang được dùng, phải GỘP chứ không xóa được bản nào.
--
-- CÁCH LÀM: chọn bản "canonical" = bản có nhiều tham chiếu nhất (số người dùng +
-- số dòng quyền phòng ban), hòa thì lấy bản tạo sớm nhất. Sau đó:
--   1. chuyển người dùng / quyền phòng ban / vai trò mặc định sang bản canonical,
--   2. xóa các bản trùng.
-- Chạy HAI LƯỢT: lượt 1 gộp theo MÃ, lượt 2 gộp theo TÊN (bắt trường hợp DA/DA-01).
--
-- Chỉ 3 bảng tham chiếu đơn vị tổ chức (đã kiểm tra information_schema):
--   users.organization_unit_id · department_module_permissions.organization_unit_id
--   · role_catalog.default_organization_unit_id
--
-- Kiểm chứng sau khi chạy (cả hai phải rỗng):
--   SELECT code FROM organization_units GROUP BY code HAVING COUNT(*)>1;
--   SELECT name FROM organization_units GROUP BY name HAVING COUNT(*)>1;
-- ============================================================================

CREATE TEMPORARY TABLE `tmp_org_merge` (
  `old_id` varchar(64) NOT NULL,
  `new_id` varchar(64) NOT NULL,
  PRIMARY KEY (`old_id`)
);

-- ---------------------------------------------------------------------------
-- LƯỢT 1 — gộp theo MÃ đơn vị
-- ---------------------------------------------------------------------------
INSERT INTO `tmp_org_merge` (`old_id`, `new_id`)
SELECT o.id,
       (SELECT c.id FROM `organization_units` c WHERE c.code = o.code
         ORDER BY ((SELECT COUNT(*) FROM `users` u WHERE u.organization_unit_id = c.id)
                 + (SELECT COUNT(*) FROM `department_module_permissions` d WHERE d.organization_unit_id = c.id)) DESC,
                  c.created_at ASC, c.id ASC
         LIMIT 1)
  FROM `organization_units` o;
DELETE FROM `tmp_org_merge` WHERE `old_id` = `new_id`;

-- Bỏ các dòng quyền sẽ ĐỤNG khóa duy nhất (organization_unit_id, module_key) sau khi gộp
DELETE d FROM `department_module_permissions` d
  JOIN `tmp_org_merge` m ON m.old_id = d.organization_unit_id
  JOIN `department_module_permissions` c ON c.organization_unit_id = m.new_id AND c.module_key = d.module_key;
UPDATE `department_module_permissions` d
  JOIN `tmp_org_merge` m ON m.old_id = d.organization_unit_id
   SET d.organization_unit_id = m.new_id;
UPDATE `users` u JOIN `tmp_org_merge` m ON m.old_id = u.organization_unit_id
   SET u.organization_unit_id = m.new_id;
UPDATE `role_catalog` r JOIN `tmp_org_merge` m ON m.old_id = r.default_organization_unit_id
   SET r.default_organization_unit_id = m.new_id;
DELETE o FROM `organization_units` o JOIN `tmp_org_merge` m ON m.old_id = o.id;

-- ---------------------------------------------------------------------------
-- LƯỢT 2 — gộp theo TÊN đơn vị (bắt trường hợp "Phòng Dự án" mã DA / DA-01)
-- ---------------------------------------------------------------------------
TRUNCATE TABLE `tmp_org_merge`;
INSERT INTO `tmp_org_merge` (`old_id`, `new_id`)
SELECT o.id,
       (SELECT c.id FROM `organization_units` c WHERE c.name = o.name
         ORDER BY ((SELECT COUNT(*) FROM `users` u WHERE u.organization_unit_id = c.id)
                 + (SELECT COUNT(*) FROM `department_module_permissions` d WHERE d.organization_unit_id = c.id)) DESC,
                  c.created_at ASC, c.id ASC
         LIMIT 1)
  FROM `organization_units` o;
DELETE FROM `tmp_org_merge` WHERE `old_id` = `new_id`;

DELETE d FROM `department_module_permissions` d
  JOIN `tmp_org_merge` m ON m.old_id = d.organization_unit_id
  JOIN `department_module_permissions` c ON c.organization_unit_id = m.new_id AND c.module_key = d.module_key;
UPDATE `department_module_permissions` d
  JOIN `tmp_org_merge` m ON m.old_id = d.organization_unit_id
   SET d.organization_unit_id = m.new_id;
UPDATE `users` u JOIN `tmp_org_merge` m ON m.old_id = u.organization_unit_id
   SET u.organization_unit_id = m.new_id;
UPDATE `role_catalog` r JOIN `tmp_org_merge` m ON m.old_id = r.default_organization_unit_id
   SET r.default_organization_unit_id = m.new_id;
DELETE o FROM `organization_units` o JOIN `tmp_org_merge` m ON m.old_id = o.id;

DROP TEMPORARY TABLE `tmp_org_merge`;
