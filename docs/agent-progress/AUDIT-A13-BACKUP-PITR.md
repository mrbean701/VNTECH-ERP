# AUDIT A-13 — XÁC NHẬN BACKUP / PITR CỦA MySQL (P0)

- **Ngày:** 20/09/2026 · **Trạng thái:** HOÀN THÀNH · **Kết luận tổng:** ⚠️ **PITR khả thi nhưng THIẾU backup nền ⇒ rủi ro P0**
- **Phương pháp (§45):** đo trực tiếp trên MySQL thật (`SELECT @@…`) + rà script/dump/scheduled task trong máy. **Không suy đoán.**

## 1. BẰNG CHỨNG ĐO ĐƯỢC (CONFIRMED)

| Hạng mục | Giá trị đo được | Ý nghĩa |
|---|---|---|
| version | **8.0.46** | MySQL 8 (hỗ trợ PITR đầy đủ) |
| `log_bin` | **1 (ON)** | ✅ Có binary log ⇒ **PITR khả thi** |
| `binlog_format` | **ROW** | ✅ An toàn nhất cho PITR/replication |
| `binlog_expire_logs_seconds` | **2592000 = 30 ngày** | ✅ Cửa sổ khôi phục 30 ngày |
| `sync_binlog` | **1** | ✅ Flush binlog mỗi transaction (bền) |
| `innodb_flush_log_at_trx_commit` | **1** | ✅ ACID bền (không mất transaction đã commit) |
| `datadir` | `C:\ProgramData\MySQL\MySQL Server 8.0\Data\` | Thư mục dữ liệu (cùng ổ đĩa hệ thống) |

## 2. KHOẢNG TRỐNG PHÁT HIỆN (CONFIRMED ABSENT / UNKNOWN)

| # | Phát hiện | Mức | Phân loại |
|---|---|---|---|
| G1 | **KHÔNG có script backup** (`mysqldump`/`mysqlpump`/`xtrabackup`) trong dự án — chỉ có `universal-installer.mjs`, `upgrade-preserve-data.mjs` (không phải backup định kỳ) | **P0** | CONFIRMED ABSENT |
| G2 | **KHÔNG có tệp dump `.sql`** nào (>100 KB) trong workspace | **P0** | CONFIRMED ABSENT |
| G3 | **KHÔNG có lịch backup MySQL**: các scheduled task tìm thấy (`MareBackup`, `Backup`, `BackupNonMaintenance`, `RegIdleBackup`) là **task của Windows**, không phải MySQL | **P0** | CONFIRMED ABSENT |
| G4 | `SHOW BINARY LOGS` ⇒ **Access denied** (user `vntech` thiếu `REPLICATION CLIENT`/`SUPER`) ⇒ **không thể liệt kê binlog** bằng tài khoản ứng dụng | P1 | UNKNOWN (không đo được bằng user này) |
| G5 | `datadir` **cùng ổ đĩa hệ thống** ⇒ mất ổ đĩa là mất cả dữ liệu lẫn binlog | P1 | CONFIRMED |

## 3. KẾT LUẬN (trả lời đúng câu hỏi audit)

- **PITR (Point-In-Time Recovery) khả thi?** ⇒ **CONFIRMED khả thi về mặt cấu hình** (log_bin ON · ROW · 30 ngày · sync_binlog=1 · flush=1).
- **Hệ thống có backup?** ⇒ **CONFIRMED KHÔNG có backup nền (base backup) tự động.**
- ⚠️ **Hệ quả then chốt:** PITR **chỉ phục hồi được khi có BASE BACKUP + chuỗi binlog từ base đó**. Hiện **không có base backup** ⇒ **khả năng khôi phục thực tế = rủi ro P0** (dù cấu hình binlog đúng).
- **Chưa đo được:** danh sách binlog thực tế (do G4) ⇒ cần tài khoản có `REPLICATION CLIENT`.

## 4. KHUYẾN NGHỊ (đề xuất, chờ user quyết định)

1. **Tạo base backup định kỳ** (khuyến nghị hàng ngày, giữ ≥ 7 ngày):
   `mysqldump --single-transaction --source-data=2 --routines --triggers --events --databases vntech_erp > vntech_erp_YYYYMMDD.sql`
   (cờ `--source-data=2` ghi **vị trí binlog** ⇒ cần để PITR).
2. **Cấp quyền đọc binlog** cho tài khoản vận hành: `GRANT REPLICATION CLIENT ON *.* TO ...` ⇒ kiểm tra/monitor binlog.
3. **Script + lịch** (`tools/backup-mysql.mjs` + Windows Task Scheduler), ghi log và **cảnh báo khi backup lỗi**.
4. **Diễn tập khôi phục (restore drill)** trên môi trường tạm — **backup chưa test = chưa có backup**.
5. Cân nhắc đặt **datadir/backup khác ổ đĩa** (hoặc đẩy bản sao ra ngoài máy) để tránh mất ổ đĩa ⇒ mất tất cả.

## 5. GHI CHÚ PHƯƠNG PHÁP

- Mọi kết luận ở mục 1 và 2 đều từ **lệnh đo được** (ghi rõ ở cột "Giá trị đo được").
- Riêng **G4** là **UNKNOWN** — không được suy đoán là "không có binlog"; chỉ kết luận **không đo được bằng tài khoản này**.
- Báo cáo này **chỉ kết luận + khuyến nghị**, **KHÔNG tự ý tạo backup hay đổi cấu hình** (chờ user quyết định).
