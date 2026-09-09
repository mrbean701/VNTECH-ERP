# VNTECH ERP – Project Navigation Consolidation Report

Ngày: 08/09/2026  
Baseline: `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1` / `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908`

## Phạm vi chốt

Hợp nhất navigation `Project → BCH` theo nguyên tắc **chỉ thay đổi frontend navigation/project context**, không đổi database, migration, API, workflow, RBAC, BOQ schema hoặc dữ liệu nghiệp vụ.

## Cấu trúc navigation mới

Top-level `BAN CHỈ HUY CÔNG TRƯỜNG` được đổi tên thành `QUẢN LÝ DỰ ÁN`. Top-level `QUẢN LÝ DỰ ÁN` cũ được loại khỏi cây menu để không còn hai nhóm trùng chức năng.

Mỗi dự án đang hoạt động tự render một workspace động gồm 8 miền nghiệp vụ:

1. Tổng quan & Nhân sự dự án
2. Kế hoạch & Tiến độ thi công
3. Đề xuất & Nhu cầu dự án
4. Nhật ký & Điều hành hiện trường
5. Sản lượng & Nghiệm thu chất lượng
6. Thầu phụ & Nhân công
7. Phát sinh (V.O) & BOQ/HĐ
8. Tài chính & Thanh quyết toán

Không hard-code A08/Hạ Đình hay số lượng dự án. Project active nào tồn tại trong dữ liệu thì node tương ứng được sinh động.

## Nguyên tắc dữ liệu giữ nguyên

- Project vẫn là entity gốc.
- BOQ vẫn giữ quan hệ `Project → Contract → BOQ Version → BOQ Item`.
- Không tạo `bch_id` mới cho BOQ.
- `Đề xuất & Nhu cầu` dùng chính module `requests` hiện hữu; hồ sơ vẫn thuộc module `MUA HÀNG` ở góc nhìn xử lý cấp công ty.
- `MUA HÀNG` và `KHO VẬT TƯ` vẫn là hai module top-level độc lập.
- Các liên kết kho trong workspace chỉ là alias/navigation theo cùng `projectId`, không duplicate CRUD/data.
- `Tài chính & Thanh quyết toán` dùng các module hiện hữu `capital_recovery` và `payments`.

## Project Context Lock

Khi người dùng đi vào một dự án từ `QUẢN LÝ DỰ ÁN`, project được chọn và khóa làm context cho các module liên quan như BOQ, nhu cầu, kho và tài chính. Khi người dùng quay lại module cấp công ty, project workspace lock được tự xóa để không rò context dự án cũ sang màn hình corporate.

## Tính tương thích UI/CSS

Không thêm một lớp CSS override mới. `app/globals.css` giữ nguyên tuyệt đối so với MASTER BASELINE R1.1.1 và tiếp tục dùng các class canonical có sẵn (`nav-subgroup`, `nav-subgroup-items`, `row-actions`, `inline-alert`, mobile tree...).

SHA256 `app/globals.css` trước/sau:
`58c5a9233decc1ed73f2861c4ad6fd23832071f93054c1fe852686e248ff0c6b`

## File source thay đổi

- `app/page.tsx` – navigation/project context frontend.
- `package.json` – thêm regression test cho contract navigation mới.
- `scripts/preflight-source.mjs` – gate contract mới.
- `tests/mobile-menu-interaction.test.mjs` – cập nhật expectation navigation mobile theo workspace dự án.
- `tests/project-navigation-consolidation.test.mjs` – regression mới.
- `MANIFEST_SHA256.txt` – tái sinh khi đóng gói.

Không thay đổi file trong `db/`, `drizzle/`, API route, workflow engine, BOQ engine hoặc schema.

## Gate đã chạy trước đóng gói

- CSS baseline audit: PASS – 2725 lines / 400653 bytes / 4950 `!important`, không historical marker.
- Source preflight: PASS.
- PostgreSQL migration preflight: PASS – 50 files / 554 statements.
- SQL bind arity: PASS – 510 literal / 6 dynamic.
- Navigation + mobile + BOQ/admin + security + Trust regression: PASS – 49/49.
- TypeScript syntax smoke: không có syntax error hoặc declaration-order error do thay đổi mới; môi trường kiểm tra source-only thiếu type definitions nên không được ghi nhận là full typecheck.

## Giới hạn cố ý

Đây là navigation consolidation, không phải vòng bổ sung backend nghiệp vụ mới. Các module hiện đang ở trạng thái Development trong baseline (ví dụ một số màn hiện trường/định mức) vẫn giữ nguyên trạng thái hiện hữu; việc đổi tên workspace không tự biến chúng thành chức năng backend mới.
