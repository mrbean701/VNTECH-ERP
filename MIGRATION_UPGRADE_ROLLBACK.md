# Hướng dẫn migration, nâng cấp và khôi phục — MASTER BASELINE R1.1.1 FINAL

Bộ cài là FULL SOURCE độc lập. Không replay patch/RC cũ.

## Cài mới

1. Giải nén ZIP vào thư mục mới.
2. Chạy `00_CAI_MOI_SERVER_WINDOWS.bat`.
3. Bộ cài kiểm package/source, Docker image identity, PostgreSQL/Redis, migration, build, bootstrap và `/healthz`.
4. Chỉ đưa vào vận hành khi release identity trả đúng build `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` và package `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1`.

## Nâng cấp giữ dữ liệu

1. Backup PostgreSQL và kiểm tra backup.
2. Giải nén release mới vào thư mục riêng.
3. Chạy `00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat`.
4. Migration chạy tuần tự tới `0049_master_baseline_identity_refresh_r1_1_1.sql`.
5. Migration 0048/0049 chỉ refresh metadata product/trust identity; không đổi workflow/RBAC/BOQ/Kho hoặc dữ liệu giao dịch.
6. Kiểm lại đăng nhập, project scope, BOQ, phê duyệt, PO, tồn kho, tệp đính kèm và audit.

## Kiểm thử đường nâng cấp đã thực hiện

- R1.1 local baseline: 49 migration, head 0048.
- R1.1.1 sau nâng cấp: 50 migration, head 0049.
- Product fingerprint sau nâng cấp: đúng `7f76ccf7c21946d07ac670fb23c98ad04809aa2e9e144263f60fffa787de0d24`.

## Khôi phục

Không rollback bằng cách xóa thủ công bảng/cột. Dùng backup PostgreSQL trước nâng cấp và image/source release trước đó; sau restore phải kiểm `/healthz`, release identity và migration state.

## Điều kiện nghiệm thu

- SHA-256 ZIP khớp checksum.
- `node scripts/verify-release-package.mjs --strict-package` PASS.
- Migration hoàn tất tới head 0049.
- Docker/Compose build không fallback image cũ.
- `node scripts/verify-live-deployment.mjs` và server health PASS.
- Trust Lock hiển thị Development Mode; License Enforcement Disabled đúng thiết kế.
