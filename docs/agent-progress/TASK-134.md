# TASK-134 — MÔ PHỎNG LẠI QUY TRÌNH DUYỆT MUA HÀNG THỰC TẾ THEO `WF-MUAHANG-01`

- **Trạng thái**: ✅ HOÀN THÀNH (chờ user xác nhận) · **Ngày**: 21/09/2026
- **Nhánh**: `unity-p2-full-20260920`
- **Báo cáo chính (deliverable)**: [`BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md`](./BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md)
- **Công cụ mới**: `tools/probe-wf-muahang-standard.mjs`

## Mục tiêu

Mô phỏng lại **quy trình duyệt mua hàng thực tế** theo luồng chuẩn `WF-MUAHANG-01` **theo cấu hình người dùng vừa chốt**
(`approval_stage_catalog` + `approval_project_assignments`), ghi lại **HTTP code + trạng thái phiếu TRƯỚC → SAU mỗi bước**,
kèm **đối chứng âm**, **đối chiếu SLA**, và **bằng chứng SQL** — không tin lời API.

## Phạm vi & ràng buộc đã tuân thủ

| Ràng buộc | Tuân thủ |
|---|---|
| Chỉ thêm `tools/probe-wf-muahang-standard.mjs` (mới) + 2 tệp `.md` trong `docs/agent-progress/` | ✅ 3 tệp; **không** sửa tệp nào khác |
| ⛔ KHÔNG sửa `approval_stage_catalog` / `approval_project_assignments` | ✅ chỉ `SELECT` |
| ⛔ KHÔNG sửa `tools/probe-purchasing-flow.mjs`, `probe-stock-issue-flow.mjs`, `probe-supplier-crud-flow.mjs` | ✅ chỉ ĐỌC `probe-purchasing-flow.mjs` để học khuôn |
| ⛔ KHÔNG sửa `java-backend/**` (lượt này) | ✅ 0 tệp Java bị sửa (mọi phát hiện ghi dạng đề xuất) |
| ⛔ KHÔNG DROP/ALTER/TRUNCATE/DELETE bảng/cột | ✅ mọi `DELETE` trong báo cáo là **đề xuất chưa chạy** |
| ⛔ KHÔNG build web · KHÔNG start/stop dịch vụ · chỉ HTTP | ✅ mọi thao tác qua proxy `:9000` |
| ⛔ KHÔNG `git add -A` · KHÔNG push · commit từng bước nhỏ | ✅ `git add` đích danh từng tệp |
| ⚠️ KHÔNG dùng PowerShell ghi tệp có tiếng Việt | ✅ dùng `write`/`edit` tool |

## Việc đã làm

1. **Đọc cấu hình thật từ MySQL** (chỉ đọc): 8 dòng `approval_stage_catalog` + 5 dòng `approval_project_assignments` của `PRJ-DEMO-01`
   ⇒ xác nhận **4 bước duyệt (2→3→4→5)** + **3 bước cung ứng (101→102→103)**; bước 1 `active=0`; `stage_kind` của 1–5 đều `'approval'`.
2. **Viết probe mới** `tools/probe-wf-muahang-standard.mjs` theo khuôn `probe-purchasing-flow.mjs`:
   - không `--apply` ⇒ **in kế hoạch, 0 ghi**;
   - có `--apply` ⇒ chạy thật, đếm **ĐẠT/HỎNG**, **đối chứng âm tính là ĐẠT**;
   - **ghi lại HTTP + trạng thái TRƯỚC → SAU** từng bước (đọc qua bootstrap, không SQL);
   - có **oracle quyền không ghi dữ liệu** (`decision` không hợp lệ) để đo RBAC mà không phá luồng;
   - xuất JSON kết quả ra thư mục tạm (`PROBE_OUT`), **không** ghi vào repo.
3. **Chạy `--apply`**: `26/28 bước ĐẠT`; luồng chạy **trọn vẹn** tới `supply_status = completed`.
4. **Đối chứng âm**: 8 ca (N1–N7 + N5b) trên luồng duyệt + 7 ca (S1–S7) trên 3 bước cung ứng — dán HTTP thật từng ca.
5. **Đối chiếu SLA**: `due_at = queued_at + sla_hours` **KHỚP 100%** cho cả 4 bước (12/24/24/12 giờ).
6. **Bằng chứng SQL**: `material_requests`, `approvals`, `purchase_orders`, `purchase_order_items`, `goods_receipts`,
   `goods_receipt_items`, `stock_movements`, `supply_workflow_steps`, `attachments` — dán SQL + kết quả nguyên văn.
7. **Kiểm lặp lại**: lượt chạy #2 (11:11:17) của cùng probe cho kết quả **giống hệt** lượt #1 (0155/0017/0016 vs 0156/0018/0017), đã xác minh bằng SQL.
8. **Cổng kiểm thẩm**: xem bảng dưới.

## Kết quả chính

| Nội dung | Kết quả |
|---|---|
| Luồng chuẩn | **4 bước duyệt (2→3→4→5) + 3 bước cung ứng (101→102→103)** — **KHỚP** đặc tả về cấu trúc & thứ tự |
| Phiếu test | `DNMH-PRJ-DEMO-01-2026-0155` → `approved` · bước 5 · **`supply_status = completed`** |
| PO / GRN | `PO-PRJ-DEMO-01-2026-0017` `completed` · `GRN-PRJ-DEMO-01-2026-0016` `confirmed` / `posted` |
| SLA | `due_at` tính **ĐÚNG** cho cả 4 bước |
| Đối chứng âm luồng duyệt | 7/8 ca chặn đúng (400); ca `trinhtrench`/bước 4 ⇒ **rò RBAC** (phát hiện F4) |
| Đối chứng âm cung ứng | S1–S3 chặn đúng (403) |
| Probe `--apply` | **26/28 ĐẠT** |

## Phát hiện (chi tiết ở báo cáo chính, §f)

| # | Mô tả | Loại | Mức |
|---|---|---|---|
| **F1** | `approve_po` trả **403** cho mọi vai trò nghiệp vụ (`ActionRbacRegistry:19` khai module **rỗng**) ⇒ bước 101 không thể hoàn tất; **9/9 PO** có `decided_by = NULL` | 🔴 LỖI THẬT | CAO |
| **F2** | `receive_goods` **không kiểm trạng thái PO** (`findPoForReceiving` thiếu điều kiện `status`) ⇒ nhận hàng khi PO còn `pending_approval` ⇒ cổng "phát hành PO" bị vô hiệu | 🔴 LỖI THẬT | TRUNG BÌNH |
| **F3** | **9/9 PO** `total_value = 0` và `unit_price = 0` dù dòng phiếu có `estimated_unit_price` | 🟠 LỖI THẬT | TRUNG BÌNH |
| **F4** | `allowed_role_codes` trộn **mã vai trò GỐC** (`project`,`procurement`) với mã vị trí ⇒ `trinhtrench` (base `procurement`) **vượt RBAC** ở bước 4 | 🟠 **KỲ VỌNG TEST CŨ vs thiết kế 2 đường** | TRUNG BÌNH |
| **F5** | `po_creation` bị ghi **2 dòng**, 1 dòng `pending` tồn đọng; `completed_by = NULL` | ℹ️ LỖI NHỎ | THẤP |
| **F6** | Phiếu xuất `PX-PRJ-DEMO-01-2026-0028` do **phiên khác** tạo trên chính phiếu test (sau mô phỏng ≈88s) ⇒ `issued_qty = 5` | ℹ️ NGOÀI PHẠM VI | — |

## Cổng kiểm thẩm

| Cổng | Lệnh | Kết quả |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ **exit 0** (0 lỗi) |
| Regression | `npm run test:regression` | ✅ **tests 69 · pass 69 · fail 0** (exit 0) |
| Workflow | `npm run test:workflow` | ✅ `Workflow VNTECH ERP V5.3.0 FULL W2 passed` (exit 0) |
| Java | `mvn -pl web -am test` | ⛔ **KHÔNG chạy** — lượt này **không sửa** `java-backend/**` |

## Commit

| Hash | Nội dung |
|---|---|
| `53b28f8` | `test(wf-muahang): them probe mo phong luong WF-MUAHANG-01 theo cau hinh dang chay (TASK-134)` |
| `41a8fe0` | `fix(probe-wf-muahang-standard): sua loi cu phap ternany trong step() (TASK-134)` |
| *(xem `git log`)* | `docs(wf-muahang): bao cao luong duyet WF-MUAHANG-01 + ho so TASK-134` |

## UNKNOWN / cần captain + user chốt

1. **Module key** đúng cho `approve_po` trong `module_catalog`/`module_permissions` (chặn F1).
2. Đặc tả đúng của cổng duyệt: *"đúng vai trò của bước"* (hiện tại) hay *"chỉ owner được phân công của dự án"* (F4)?
3. `unit_price` của PO có chủ ý để `0` và chỉ đặt qua `update_po_price` không (F3)?
4. Bước CHT (`ASTAGE-1`) **TẮT** có phải chủ ý (lượt này không sửa cấu hình)?
5. Dữ liệu test (`DNMH-…-0155/0156`, `PO-…-0017/0018`, `GRN-…-0016/0017`) có cần **hoàn tác** không — SQL hoàn tác ở §g2 báo cáo chính **chưa chạy**.
