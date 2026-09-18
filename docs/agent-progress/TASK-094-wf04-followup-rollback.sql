-- WF-04-followup ROLLBACK (18/09) — SUA LAI cho DUNG (ban truoc bi ghi de RONG o lan chay thu hai vi luc do khong con dong nao thieu).
-- Y DINH: dua MySQL ve dung trang thai TRUOC khi dien (2018: trong/NULL) de KHONG tao lech quy uoc voi SQLite.
UPDATE workflow_steps SET required_permission=NULL WHERE workflow_id='WF-MUAHANG';
