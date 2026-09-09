# VNTECH ERP V5.3.0 — MASTER BASELINE R1.1.1 FINAL

Bộ cài FULL độc lập sau vòng **MASTER BASELINE CLEANUP R1.1.1**, package `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1`, build `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908`.

Không cần replay PATCH/RC cũ. Vòng này **không bổ sung nghiệp vụ mới**; mục tiêu là loại đường runtime song song, khóa identity/migration và làm sạch CSS theo nguyên tắc không xóa nhầm.

## Cài mới trên Windows

1. Giải nén ZIP vào thư mục mới.
2. Bảo đảm Node.js 22.13+ và Docker Desktop/Engine + Docker Compose.
3. Chạy `00_CAI_MOI_SERVER_WINDOWS.bat`.
4. Bộ cài tự kiểm package, migration, dependency/build, database, health và release identity trước khi báo thành công.
5. Dùng `01_MO_VNTECH_ERP_WINDOWS.bat` để mở phần mềm và `02_QUAN_LY_HE_THONG_WINDOWS.bat` để quản lý/start/stop/backup/restore.

## Nâng cấp giữ nguyên dữ liệu

Chạy `00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat`. Luồng nâng cấp backup PostgreSQL, giữ storage/tài khoản/dự án, chạy migration tới `0049_master_baseline_identity_refresh_r1_1_1.sql`, kiểm health/release identity và rollback khi lỗi.

## R1.1.1 — điểm khóa chính

- `/api/files`: một SSOT tại `app/api/files/route.ts`.
- Universal/Local storage đều có `delete()` vật lý.
- Local Server không còn `filesRouteUrl` mồ côi.
- Schema Single Owner Approval đồng nhất migration 0047.
- Migration range `0000..0049`; 0049 metadata-only.
- CSS safe-clean: **400.653 B / 4.950 `!important` / 2.725 dòng / dead class=0 / dead var=0 / historical marker=0 / empty media=0**.
- Dynamic CSS Source ↔ CSS contract được khóa để không tái diễn lỗi xóa nhầm `.nav-glyph-green`.
- Visual equivalence: **12/12 state = 0 RGB pixel diff + 0 computed-style diff** so với R1 candidate ổn định.
- Source fingerprint: `7f76ccf7c21946d07ac670fb23c98ad04809aa2e9e144263f60fffa787de0d24` (`VNTECH-FP-7F76CCF7C21946D0`).
- UI contract: `VNTECH-UI-V5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908`.

## Trust Lock

Trust Lock Foundation vẫn ở `development`; License Enforcement và Online Attestation tắt theo thiết kế. Không có private key trong source/release.

## Tài liệu kiểm định

- `MASTER_BASELINE_CLEANUP_REPORT.md`
- `MASTER_BASELINE_CLEANUP_VALIDATION.md`
- `MASTER_BASELINE_CLEANUP_DIFF.txt`
- `MIGRATION_UPGRADE_ROLLBACK.md`
