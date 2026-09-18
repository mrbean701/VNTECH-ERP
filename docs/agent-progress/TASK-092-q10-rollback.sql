-- Q10 ROLLBACK (18/09) — hoàn tác sửa materials.system 4 dòng (người dùng: dữ liệu test thì sửa cho đúng).
UPDATE materials SET `system`='DIEN' WHERE code='CTN-ONG-NHUA-002'; -- CTN-ONG-NHUA-002
UPDATE materials SET `system`='HVAC' WHERE code='CTN-VAN-001'; -- CTN-VAN-001
UPDATE materials SET `system`='KHAC' WHERE code='DIEN-DAY-CAD-001'; -- DIEN-DAY-CAD-001
UPDATE materials SET `system`='CTN' WHERE code='DIEN-ONG-LUON-001'; -- DIEN-ONG-LUON-001
