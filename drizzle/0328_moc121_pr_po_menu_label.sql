-- 0328 — MỐC 121: ĐỔI TÊN MENU «Mua hàng & PO» → «PR & PO» (bản SQLite, khớp V35)
-- ⛔ Chỉ UPDATE 1 dòng. Idempotent, không INSERT/DELETE/TRUNCATE.
UPDATE module_catalog
   SET label      = 'PR & PO',
       updated_at = datetime('now')
 WHERE module_key = 'purchasing'
   AND (label = 'Mua hàng & PO' OR label LIKE '%?%');
