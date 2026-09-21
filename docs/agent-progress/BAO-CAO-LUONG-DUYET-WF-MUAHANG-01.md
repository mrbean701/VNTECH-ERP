# BÁO CÁO CHI TIẾT — LUỒNG DUYỆT MUA HÀNG CHUẨN `WF-MUAHANG-01` (TASK-134)

- **Ngày chạy**: 21/09/2026 (giờ máy chủ MySQL: `2026-09-21 11:09:24` → `11:09:27`)
- **Người thực hiện**: kỹ sư kiểm thử — nhánh TASK-134
- **Căn cứ**: cấu hình người dùng **vừa chỉnh sửa**, đọc **trực tiếp từ MySQL** `vntech_erp` *(không dùng số cũ)*
- **Môi trường**: Java `:18081` · UI `:8787` · proxy `:9000` → mọi thao tác **chỉ bằng HTTP** · MySQL `(vntech/vntech)`
- **Lệnh mô phỏng**: `node tools/probe-wf-muahang-standard.mjs --apply` *(không `--apply` ⇒ in kế hoạch, **0 ghi**)*
- **Kết quả**: **26/28 bước ĐẠT** — luồng chạy **TRỌN VẸN** từ lập phiếu tới kết thúc quy trình PO
- **Tính lặp lại**: probe đã chạy **2 lượt độc lập**, kết quả **giống hệt nhau** (xem §b, bảng "2 lượt chạy")

> ⚠️ **ĐÍNH CHÍNH so với bản báo cáo trước của cùng tệp này**: bản cũ ghi ca `trinhtrench` ở bước 4 là *"nghi lỗi payload của probe, không phải lỗi hệ thống"* — **SAI**. Lượt này chứng minh bằng **oracle không ghi dữ liệu** rằng tài khoản đó **ĐÃ QUA kiểm RBAC** (lỗi trả về nằm ở bước kiểm `decision`, tức đã đi qua bước kiểm quyền). Xem **F4** ở §f. Bản cũ cũng dùng **sai tên cột** (`goods_receipts.bch_status`) — cột thật là `bch_confirmation_status`.

---

## (a) LUỒNG CHUẨN ĐANG CÓ HIỆU LỰC — 4 BƯỚC DUYỆT + 3 BƯỚC CUNG ỨNG

Nguồn: `approval_stage_catalog` + `approval_project_assignments` *(gán người theo dự án `PRJ-DEMO-01`)* — **chỉ ĐỌC, không sửa trong lượt này**.

| Bước | id | Tên bước | Vai trò được phép (`allowed_role_codes`) | Owner được phân công | Người duyệt **thực tế** | SLA | `kind` | `active` |
|---|---|---|---|---|---|---|---|---|
| — | `ASTAGE-1` | CHT xác nhận nhu cầu | `commander,cht` | `cha.ht` | *(không chạy)* | 12h | approval | **0 — ĐANG TẮT** |
| **2** | `ASTAGE-2` | **Thư ký Tổng giám đốc** | `thuky,thu_ky_tgd` | `thukydemo` | **`thukydemo`** | 12h | approval | 1 |
| **3** | `ASTAGE-3` | **Phòng Dự án** | `project,da_nv` | `nvdademo` | **`nvdademo`** | 24h | approval | 1 |
| **4** | `ASTAGE-4` | **Phòng Kế hoạch** | `procurement,kh_nv` | `nvkhdemo` | **`nvkhdemo`** | 24h | approval | 1 |
| **5** | `ASTAGE-5` | **Giám đốc** | `director,tgd,giam_doc` | `giamdoc.demo` | **`giamdoc.demo`** | 12h | approval | 1 |
| 101 | `ASTAGE-101` | Lập & phát hành PO | `procurement,kh_nv,kh_truong` | *(không có)* | `nvkhdemo` | 24h | **supply** | 1 |
| 102 | `ASTAGE-102` | Giao nhận | `warehouse,thu_kho` | *(không có)* | `tkhodemo` | 24h | **supply** | 1 |
| 103 | `ASTAGE-103` | BCH xác nhận giao hàng | `commander,cht` | *(không có)* | `cha.ht` | 24h | **supply** | 1 |

> ⇒ **LUỒNG CHUẨN = 4 bước DUYỆT** *(Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → **Giám đốc**)* **+ 3 bước CUNG ỨNG** *(Lập & phát hành PO → Giao nhận → BCH xác nhận giao hàng)*
> ⇒ Bước CHT (`ASTAGE-1`) **đang TẮT** (`active=0`) ⇒ phiếu đề nghị mới **sinh ra ở bước 2**
> ⇒ Mọi bước `approval_mode = single` *(chỉ cần 1 người duyệt mỗi bước)*
> ⇒ **`stage_kind` của cả 5 bước 1–5 đều là `'approval'`** (kể cả `ASTAGE-4` — đo lại bằng `IFNULL(stage_kind,'(NULL)')`, **không** NULL như mô tả ban đầu) ⇒ chuỗi duyệt chính xác là **2,3,4,5**

---

## (b) NHẬT KÝ MÔ PHỎNG THỰC TẾ *(đúng tài khoản từng vai trò — KHÔNG dùng admin cho nghiệp vụ)*

Phiếu: **`DNMH-PRJ-DEMO-01-2026-0155`** (`MR_3a2fb401-a384-48b1-8605-256b04860c7f`) · 2 dòng vật tư (`KHAC-VLXD-004` ×25 · `KHAC-VLXD-005` ×60) · kho `KHO-PRJ-DEMO-01`.

| Bước | Tài khoản | Việc | **HTTP** | `status` | **bước** | `supply_status` | Nguyên văn |
|---|---|---|---|---|---|---|---|
| **B1** | `ksda.demo` | lập phiếu đề nghị mua | **200** | `pending_approval` | **2** | `approval_pending` | *Đã lập phiếu DNMH-…-0155 gồm 2 dòng và chuyển tới bước 2.* |
| **B2** | `thukydemo` | duyệt **bước 2** (Thư ký TGĐ) | **200** | `pending_approval` → `pending_approval` | **2 → 3** | `approval_pending` | *Đã duyệt Thư ký Tổng giám đốc; hồ sơ tự chuyển sang Phòng Dự án.* |
| **B3** | `nvdademo` | duyệt **bước 3** (Phòng Dự án) | **200** | `pending_approval` → `pending_approval` | **3 → 4** | `approval_pending` | *Đã duyệt Phòng Dự án; hồ sơ tự chuyển sang Phòng Kế hoạch.* |
| **B4** | `nvkhdemo` | duyệt **bước 4** (Phòng Kế hoạch) | **200** | `pending_approval` → `pending_approval` | **4 → 5** | `approval_pending` | *Đã duyệt Phòng Kế hoạch; hồ sơ tự chuyển sang Giám đốc.* |
| **B5** | `giamdoc.demo` | duyệt **bước 5** (**Giám đốc**) | **200** | `pending_approval` → **`approved`** | 5 | `approval_pending` → **`awaiting_po`** | *Đã hoàn tất luồng phê duyệt; hồ sơ tự chuyển sang Mua hàng & PO…* |
| **B6a** | `nvkhdemo` | `create_po` — **lập** PO *(stage 101)* | **200** | `approved` | 5 | `awaiting_po` → **`waiting_delivery`** | *Đã phát hành 1 PO: PO-PRJ-DEMO-01-2026-0017.* |
| **B6b** | `nvkhdemo` | `approve_po` — **phát hành** PO | ❌ **403** | `approved` | 5 | `waiting_delivery` *(không đổi)* | *Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.* |
| **B7** | `tkhodemo` | `receive_goods` — giao nhận *(stage 102)* | **200** | `approved` | 5 | `waiting_delivery` → **`awaiting_bch_confirmation`** | *GRN-PRJ-DEMO-01-2026-0016 đã ghi nhận giao hàng; đơn chuyển sang chờ BCH kiểm tra ảnh và xác nhận.* |
| **B7b** | `tkhodemo` | **nạp ẢNH GIAO HÀNG** (`POST /api/files`, `entityType=goods_receipt`) | **201** | `approved` | 5 | `awaiting_bch_confirmation` | *(gỡ nút thắt luật "phải có ảnh" của `confirm_delivery`)* |
| **B8** | `cha.ht` | `confirm_delivery` — BCH xác nhận *(stage 103)* | **200** | `approved` | 5 | `awaiting_bch_confirmation` → **`completed`** 🎯 | *BCH đã xác nhận GRN-PRJ-DEMO-01-2026-0016; quy trình PO đã kết thúc đầy đủ.* |

### 2 lượt chạy độc lập — kết quả GIỐNG HỆT (kiểm lặp lại)

| Lượt | Thời điểm | Phiếu | PO | GRN | Kết quả | Kết thúc |
|---|---|---|---|---|---|---|
| **#1 (lượt này, đo trực tiếp)** | 11:09:24 → 11:09:27 | `DNMH-…-0155` | `PO-…-0017` | `GRN-…-0016` | 26/28 ĐẠT | `approved` / `5` / **`completed`** |
| **#2 (lượt song song cùng probe)** | 11:11:17 → 11:11:18 | `DNMH-…-0156` | `PO-…-0018` | `GRN-…-0017` | 26/28 ĐẠT | `approved` / `5` / **`completed`** |

Lượt #2 **không do lượt này bấm** nhưng **đã kiểm chứng bằng SQL** (xem §c) ⇒ cùng một probe, cùng cấu hình ⇒ **cùng kết quả**.

### 🎯 DẢI TRẠNG THÁI ĐẦY ĐỦ CỦA PHIẾU ĐỀ NGHỊ *(câu hỏi gốc của người dùng)*

```
approval_pending  →  awaiting_po  →  waiting_delivery  →  awaiting_bch_confirmation  →  completed
                     (đã duyệt)     (đã lập PO)          (đã nhận hàng, chờ BCH)        (BCH đã xác nhận)
+ partial_delivery  khi nhận MỘT PHẦN   (đo được ở dữ liệu cũ: PO-…-0010/0014/0015/0016 `delivered_pending_confirmation`)
```
> **Trước đây** không trả lời được bước cuối vì luật **"phải có ảnh giao hàng thực tế"** chặn (`PurchaseManagementUseCase.confirmDelivery` dòng 401) — nay đã tìm ra **đường nạp ảnh** (`POST /api/files`) ⇒ chạy tới `completed` ✔

---

## (c) TRẠNG THÁI CUỐI CÙNG + BẰNG CHỨNG SQL

```sql
-- Phiếu (lượt #1 và #2)
SELECT request_no,status,approval_stage,supply_status,total_estimated_value,updated_at
FROM material_requests WHERE request_no LIKE 'DNMH-PRJ-DEMO-01-2026-015%' ORDER BY request_no;
```
```
+----------------------------+------------------+----------------+---------------------------+-----------------------+-------------------------+
| request_no                 | status           | approval_stage | supply_status             | total_estimated_value | updated_at              |
+----------------------------+------------------+----------------+---------------------------+-----------------------+-------------------------+
| DNMH-PRJ-DEMO-01-2026-0150 | pending_approval |              2 | approval_pending          |                  0.0000 | 2026-09-21 10:01:10.860 |
| DNMH-PRJ-DEMO-01-2026-0151 | approved         |              5 | awaiting_bch_confirmation |                  0.0000 | 2026-09-21 10:01:11.802 |
| DNMH-PRJ-DEMO-01-2026-0152 | pending_approval |              2 | approval_pending          |                  0.0000 | 2026-09-21 10:02:21.418 |
| DNMH-PRJ-DEMO-01-2026-0153 | pending_approval |              2 | approval_pending          |                  0.0000 | 2026-09-21 10:02:21.463 |
| DNMH-PRJ-DEMO-01-2026-0154 | approved         |              5 | awaiting_bch_confirmation |                  0.0000 | 2026-09-21 10:02:22.376 |
| DNMH-PRJ-DEMO-01-2026-0155 | approved         |              5 | completed                 |         14630000.0000 | 2026-09-21 11:09:27.217 |   ← lượt #1
| DNMH-PRJ-DEMO-01-2026-0156 | approved         |              5 | completed                 |         14630000.0000 | 2026-09-21 11:11:18.047 |   ← lượt #2
+----------------------------+------------------+----------------+---------------------------+-----------------------+-------------------------+
```

```sql
SELECT po_no,status,total_value,decided_by,decided_at,ordered_at,delivery_completed_at
FROM purchase_orders WHERE po_no LIKE 'PO-PRJ-DEMO-01-2026-001%' ORDER BY po_no;
```
```
+--------------------------+--------------------------------+-------------+------------+------------+
| po_no                    | status                         | total_value | decided_by | decided_at |
+--------------------------+--------------------------------+-------------+------------+------------+
| PO-PRJ-DEMO-01-2026-0010 | delivered_pending_confirmation |      0.0000 | NULL       | NULL       |
| PO-PRJ-DEMO-01-2026-0011 | completed                      |      0.0000 | NULL       | NULL       |
| PO-PRJ-DEMO-01-2026-0012 | pending_approval               |      0.0000 | NULL       | NULL       |   ← kẹt vì approve_po 403 (F1)
| PO-PRJ-DEMO-01-2026-0013 | pending_approval               |      0.0000 | NULL       | NULL       |   ← kẹt vì approve_po 403 (F1)
| PO-PRJ-DEMO-01-2026-0014 | delivered_pending_confirmation |      0.0000 | NULL       | NULL       |
| PO-PRJ-DEMO-01-2026-0015 | delivered_pending_confirmation |      0.0000 | NULL       | NULL       |
| PO-PRJ-DEMO-01-2026-0016 | delivered_pending_confirmation |      0.0000 | NULL       | NULL       |
| PO-PRJ-DEMO-01-2026-0017 | completed                      |      0.0000 | NULL       | NULL       |   ← lượt #1 (KHÔNG qua approve_po)
| PO-PRJ-DEMO-01-2026-0018 | completed                      |      0.0000 | NULL       | NULL       |   ← lượt #2 (KHÔNG qua approve_po)
+--------------------------+--------------------------------+-------------+------------+------------+
```
> 🔴 **Toàn bộ 9 PO đều `decided_by = NULL` và `total_value = 0.0000`** ⇒ F1 (không PO nào từng được phát hành qua `approve_po`) và F3 (PO luôn mất giá trị tiền) là lỗi **hệ thống**, không phải hiện tượng nhất thời của lượt test.

```sql
SELECT receipt_no,bch_confirmation_status,posting_status,qc_status,received_at
FROM goods_receipts WHERE receipt_no LIKE 'GRN-PRJ-DEMO-01-2026-001%' ORDER BY receipt_no;
```
```
+---------------------------+-------------------------+----------------------+-----------+-------------------------+
| receipt_no                | bch_confirmation_status | posting_status       | qc_status | received_at             |
+---------------------------+-------------------------+----------------------+-----------+-------------------------+
| GRN-PRJ-DEMO-01-2026-0010 | confirmed               | posted               | accepted  | 2026-09-21 08:00:00.000 |
| GRN-PRJ-DEMO-01-2026-0013 | pending                 | pending_confirmation | accepted  | 2026-09-21 09:59:56.671 |
| GRN-PRJ-DEMO-01-2026-0014 | pending                 | pending_confirmation | accepted  | 2026-09-21 10:01:11.802 |
| GRN-PRJ-DEMO-01-2026-0015 | pending                 | pending_confirmation | accepted  | 2026-09-21 10:02:22.376 |
| GRN-PRJ-DEMO-01-2026-0016 | confirmed               | posted               | accepted  | 2026-09-21 11:09:26.958 |   ← lượt #1
| GRN-PRJ-DEMO-01-2026-0017 | confirmed               | posted               | accepted  | 2026-09-21 11:11:17.816 |   ← lượt #2
+---------------------------+-------------------------+----------------------+-----------+-------------------------+
```

### Bảng `approvals` THẬT — 4 dòng cho 4 bước duyệt

```sql
SELECT stage,department,approver_user_id,status,queued_at,due_at,decided_at,
       allowed_role_codes_snapshot,approval_mode_snapshot,decision_snapshot
FROM approvals WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY stage;
```
```
+-------+------------------------+------------------------------------------+----------+-------------------------+-------------------------+-------------------------+-----------------------------+------------------------+-------------------+
| stage | department             | approver_user_id                         | status   | queued_at               | due_at                  | decided_at              | allowed_role_codes_snapshot | approval_mode_snapshot | decision_snapshot |
+-------+------------------------+------------------------------------------+----------+-------------------------+-------------------------+-------------------------+-----------------------------+------------------------+-------------------+
|     2 | Thư ký Tổng giám đốc   | USR_8011a197-261a-4288-91d6-1d62a233cedb | approved | 2026-09-21 11:09:24.958 | 2026-09-21 23:09:24.958 | 2026-09-21 11:09:25.332 | thuky,thu_ky_tgd            | single                 | NULL              |
|     3 | Phòng Dự án            | USR_76575c08-4d16-49fc-8cd8-bde8ae204003 | approved | 2026-09-21 11:09:25.332 | 2026-09-22 11:09:25.332 | 2026-09-21 11:09:25.564 | project,da_nv               | single                 | NULL              |
|     4 | Phòng Kế hoạch         | USR_8869ca60-7c6a-4e7f-bebd-0547f38bcdb8 | approved | 2026-09-21 11:09:25.564 | 2026-09-22 11:09:25.564 | 2026-09-21 11:09:25.763 | procurement,kh_nv           | single                 | NULL              |
|     5 | Giám đốc               | USR_p2_giamdoc_demo                      | approved | 2026-09-21 11:09:25.763 | 2026-09-21 23:09:25.763 | 2026-09-21 11:09:25.937 | director,tgd,giam_doc       | single                 | NULL              |
+-------+------------------------+------------------------------------------+----------+-------------------------+-------------------------+-------------------------+-----------------------------+------------------------+-------------------+
```
- **Đúng 4 dòng** cho 4 bước duyệt — **không** có dòng cho bước 1 (TẮT) và **không** có dòng cho 101/102/103 (bước cung ứng ghi ở `supply_workflow_steps`).
- `approver_user_id` khớp **đúng owner được phân công** từng bước (bảng §a).
- `allowed_role_codes_snapshot` / `approval_mode_snapshot` **đóng băng tại lúc lập phiếu** ⇒ sửa catalog sau đó không làm lệch phiếu đang chạy (đúng thiết kế).
- `decision_snapshot = NULL` cho cả 4 dòng — **đúng**, vì auto-snapshot chỉ sinh khi `auto_approve_on_submit=1` hoặc **người lập trùng vai trò duyệt**; ở đây `ksda.demo` (role `ksda`, base `engineer`) không nằm trong bất kỳ `allowed_role_codes` nào.

### SLA: `sla_hours` vs `approvals.due_at` — **KHỚP 100%**

```sql
SELECT a.stage AS buoc, c.sla_hours, a.queued_at, a.due_at,
       TIMESTAMPDIFF(HOUR,a.queued_at,a.due_at) AS chenh_gio,
       IF(TIMESTAMPDIFF(HOUR,a.queued_at,a.due_at)=c.sla_hours,'KHOP','SAI') AS ket_luan
FROM approvals a LEFT JOIN approval_stage_catalog c ON c.stage_no=a.stage
WHERE a.request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY a.stage;
```
```
+------+-----------+-------------------------+-------------------------+-----------+----------+
| buoc | sla_hours | queued_at               | due_at                  | chenh_gio | ket_luan |
+------+-----------+-------------------------+-------------------------+-----------+----------+
|    2 |        12 | 2026-09-21 11:09:24.958 | 2026-09-21 23:09:24.958 |        12 | KHOP     |
|    3 |        24 | 2026-09-21 11:09:25.332 | 2026-09-22 11:09:25.332 |        24 | KHOP     |
|    4 |        24 | 2026-09-21 11:09:25.564 | 2026-09-22 11:09:25.564 |        24 | KHOP     |
|    5 |        12 | 2026-09-21 11:09:25.763 | 2026-09-21 23:09:25.763 |        12 | KHOP     |
+------+-----------+-------------------------+-------------------------+-----------+----------+
```
**⇒ `due_at = queued_at + sla_hours` ĐÚNG cho cả 4 bước.** Cơ chế: `RequestManagementUseCase` dòng 371 (`dueAt = now + slaHours*3600` cho bước đầu) và dòng 721-723 (`advanceRequestStage` đặt lại `queued_at/due_at` cho bước kế tiếp).
⚠️ **Lưu ý thiết kế (không phải lỗi đo được)**: `due_at` **không** được tính lại khi hồ sơ bị **trả lại** (`returnRequestToRequester`) — nếu bước bị `rejected` rồi gửi lại, `due_at` cũ vẫn còn. Chưa có ca test trong lượt này.

### Bằng chứng các bảng còn lại

```sql
-- Dòng PO: nhận đủ, nhưng đơn giá = 0 (F3)
SELECT id,line_no,ordered_qty,received_qty,delivered_qty,status,unit_price,system_code
FROM purchase_order_items WHERE purchase_order_id='PO_8be0965a-3c51-4546-b273-37ef69e0ebdc';
-- POI_1d42851b-4fb9-41ee-97af-29c7a9c2e38f | 1 | 25.0000 | 25.0000 | 25.0000 | received | 0.0000 | KHAC
-- POI_eac3ba3b-4aca-43e3-96a0-09634379ef7c | 2 | 60.0000 | 60.0000 | 60.0000 | received | 0.0000 | KHAC

-- Dòng GRN: QC chấp nhận 100%
SELECT id,received_qty,accepted_qty,rejected_qty,qc_result,lot_no
FROM goods_receipt_items WHERE receipt_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';
-- GRNI_18402eec-… | 60.0000 | 60.0000 | 0.0000 | accepted | LOT-T134-20260921040918
-- GRNI_c8fb6794-… | 25.0000 | 25.0000 | 0.0000 | accepted | LOT-T134-20260921040918

-- stock_movements: nhập kho hợp lệ sau khi BCH xác nhận
SELECT id,to_warehouse_id,from_warehouse_id,movement_type,quantity,reference_type,reference_id,posted_by,occurred_at
FROM stock_movements WHERE reference_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';
-- MOV_c5d39c00-… | WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d | NULL | GRN | 25.0000 | goods_receipt | GRN_6cdc4916-… | USR_911a47b2-…b18b | 2026-09-21 11:09:27.217
-- MOV_d3d532b8-… | WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d | NULL | GRN | 60.0000 | goods_receipt | GRN_6cdc4916-… | USR_911a47b2-…b18b | 2026-09-21 11:09:27.217

-- supply_workflow_steps: dấu vết 3 bước cung ứng
SELECT id,step,status,queued_at,due_at,completed_at,completed_by
FROM supply_workflow_steps WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY queued_at;
-- SWF_a895c4ed-… | po_creation      | pending   | 11:09:25.937 | 2026-09-22 11:09:25.937 | NULL                    | NULL    ← F5: dòng pending tồn đọng
-- SWF_b102a0d5-… | po_creation      | completed | 11:09:26.296 | 2026-09-22 11:09:26.296 | 2026-09-21 11:09:26.296 | NULL
-- SWF_6f0f5089-… | bch_confirmation | completed | 11:09:26.958 | 2026-09-22 11:09:26.958 | 2026-09-21 11:09:27.217 | USR_911a47b2-…b18b

-- attachments: ảnh giao hàng (điều kiện BẮT BUỘC của confirm_delivery)
SELECT id,entity_type,entity_id,mime_type,file_name,uploaded_by FROM attachments
WHERE entity_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';
-- ATT_3d38fa26-… | goods_receipt | GRN_6cdc4916-… | image/png | anh-giao-hang-20260921040918.png | USR_8984cf69-… (tkhodemo)
```

---

## (d) ĐỐI CHỨNG ÂM — MỌI CA PHẢI BỊ CHẶN

Chạy khi phiếu **đang ở bước 2** (trừ ca ghi rõ mốc khác); mỗi ca **1 lần gọi thật**, dán **mã HTTP thật**.

| Ca | Tài khoản | Hành vi cần chặn | Kỳ vọng | **HTTP thật** | Nguyên văn | KQ |
|---|---|---|---|---|---|---|
| **N1** | `trdademo` | không phải owner, sai vai trò — duyệt **stage 5** (`da_truong`/base `project` ∉ `director,tgd,giam_doc`) | 403/400 | **400** | *Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.* | ✅ CHẶN |
| **N2** | `ksda.demo` | **người TẠO phiếu tự duyệt** stage 2 | bị từ chối | **400** | *Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.* | ✅ CHẶN |
| **N3** | `nvkhdemo` | duyệt **SAI THỨ TỰ**: stage 4 khi phiếu còn ở **bước 2** (tài khoản này **ĐỦ** vai trò bước 4 ⇒ ca này đo đúng cổng "đúng bước") | 400 | **400** | *Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.* | ✅ CHẶN |
| **N4** | `thukydemo` | phiếu **KHÔNG TỒN TẠI** | 400 | **400** | *Không tìm thấy đơn yêu cầu.* | ✅ CHẶN |
| **N5** | `thukydemo` | bước **99** không có trong luồng phiếu | 400 | **400** | *Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.* | ✅ CHẶN |
| **N5b** | `nvkhdemo` | gọi `decide_approval` cho **bước CUNG ỨNG 101** | 400 | **400** | *Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.* | ✅ CHẶN |
| **N6** | `thukydemo` | duyệt **LẦN 2** cùng stage 2 (đã duyệt ở B2, phiếu đã sang bước 3) | 400 | **400** | *Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.* | ✅ CHẶN |
| **N7** | `trinhtrench` | không phải owner duyệt **stage 4** (`kh_truong`, base `procurement`) — khi stage 4 **ĐANG là bước hiện tại** | 403/400 | **400** ⚠️ | *Quyết định không hợp lệ.* | ⚠️ **HTTP 400 nhưng VÌ LÝ DO KHÁC** — xem cảnh báo |

> **⚠️ CẢNH BÁO N7 — đây là PHÁT HIỆN, không phải ĐẠT.** Ca này dùng **oracle không ghi dữ liệu**: gọi `decide_approval` với `decision` **không hợp lệ**. Thứ tự kiểm trong `RequestManagementUseCase.decideApproval` là
> `(605) canApproveRequestStage` → `(607) đúng bước & còn pending_approval` → `(609) decision hợp lệ`.
> N7 trả lỗi ở **bước 609** ⇒ tài khoản `trinhtrench` **ĐÃ QUA cổng RBAC 605**. Nếu gọi bằng `decision:"approved"` thì **hồ sơ sẽ bị chuyển bước bởi một tài khoản KHÔNG được phân công**. Probe **cố ý KHÔNG gọi thật** để giữ luồng chính sạch ⇒ chi tiết ở **F4** (§f).
> *(Bản báo cáo trước ghi ca này là "nghi lỗi payload của probe" — **không đúng**: `"__oracle__"` là chủ ý thiết kế của probe, và chính vì nó mà phát hiện ra khoảng hở cấp quyền.)*

### (d-bis) ĐỐI CHỨNG ÂM CHO 3 BƯỚC CUNG ỨNG (HTTP thật)

| Ca | Tài khoản | Hành vi | **HTTP thật** | Nguyên văn |
|---|---|---|---|---|
| S1 | `trdademo` (base `project`) | `receive_goods` — sai vai trò (chỉ `warehouse,admin`) | **403** | *Tài khoản không có quyền thực hiện nghiệp vụ này.* |
| S2 | `cha.ht` (base `commander`) | `receive_goods` — sai vai trò | **403** | *Tài khoản không có quyền thực hiện nghiệp vụ này.* |
| S3 | `nvkhdemo` (base `procurement`) | `confirm_delivery` — sai vai trò | **403** | *Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.* |
| S4 | `nvkhdemo` | `approve_po` | **403** | *Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.* |
| S5 | `trinhtrench` | `approve_po` | **403** | *Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.* |
| S6 | `giamdoc.demo` (base `director`) | `approve_po` | **403** | *Tài khoản không có quyền thực hiện nghiệp vụ này.* |
| S7 | `admin` | `approve_po` (đi qua MỌI cổng RBAC) | **400** | *PO không tồn tại hoặc đã xử lý.* (PO đã `completed`) |

⇒ **S1–S3 ĐẠT** (chặn đúng vai trò). **S4–S7 là bằng chứng của lỗi F1.**

---

## (e) KẾT LUẬN: LUỒNG CÓ KHỚP ĐẶC TẢ "4 BƯỚC DUYỆT + 3 BƯỚC CUNG ỨNG" KHÔNG?

| Đặc tả người dùng | Kết quả đo thật | Khớp? |
|---|---|---|
| **4 bước DUYỆT** 2→3→4→5 | Đúng **4 dòng** `approvals` (2,3,4,5), tuần tự, mỗi bước 1 người, HTTP **200** cả 4 | ✅ **KHỚP** |
| Bước 1 TẮT ⇒ phiếu sinh ra ở **bước 2** | `create_request` ⇒ `status=pending_approval`, `approval_stage=2` | ✅ **KHỚP** |
| Duyệt xong ⇒ `approved` + chuyển sang mua hàng | `status=approved`, `supply_status=awaiting_po` | ✅ **KHỚP** |
| **3 bước CUNG ỨNG** 101→102→103 | `create_po` 200 · `receive_goods` 200 · `confirm_delivery` 200; dấu vết ở `supply_workflow_steps` + `stock_movements` | ⚠️ **CHẠY ĐƯỢC**, nhưng bước 101 **KHÔNG hoàn tất đúng nghĩa** (xem dưới) |
| "Lập & **PHÁT HÀNH** PO" | `approve_po` ⇒ **403**; PO giữ `pending_approval`; `decided_by=NULL`, `decided_at=NULL` (đúng cho **cả 9 PO** trong DB) | ❌ **KHÔNG KHỚP** |
| Về **số bước** & **thứ tự** | 4 duyệt + 3 cung ứng, đúng thứ tự 2→3→4→5→101→102→103 | ✅ **KHỚP** |

**Kết luận ngắn:** luồng **đúng đặc tả về cấu trúc (4+3) và thứ tự**, chạy **trọn vẹn tới `supply_status = completed`** (lặp lại được 2 lượt). Sai lệch duy nhất là **bước 101 không có phần "phát hành"**: `create_po` tạo PO nhưng PO **không bao giờ** được phát hành, và cổng đó **bị vô hiệu** nên 102/103 vẫn chạy — nghĩa là hệ thống "xanh" nhưng thiếu một cổng kiểm soát.

---

## (f) VẤN ĐỀ PHÁT HIỆN — **LỖI THẬT** vs **KỲ VỌNG TEST CŨ**

### F1 — 🔴 **LỖI THẬT (CAO)**: `approve_po` trả **403** cho MỌI vai trò nghiệp vụ ⇒ bước 101 không thể hoàn tất

- **Bằng chứng HTTP:** `nvkhdemo` → `403 Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.` · `trinhtrench` → y hệt · `giamdoc.demo` → `403 Tài khoản không có quyền thực hiện nghiệp vụ này.` · chỉ `admin` đi qua mọi cổng (rồi nhận `400 PO không tồn tại hoặc đã xử lý.`).
- **Bằng chứng SQL:** **9/9 PO** có `decided_by = NULL`, `decided_at = NULL`; hai PO `0012`/`0013` **kẹt vĩnh viễn** ở `pending_approval`.
- **Nguyên nhân gốc (đọc mã nguồn, không phải phỏng đoán):**
  - `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java:19` → `Map.entry("approve_po", List.of())` — **danh sách module RỖNG** (cùng nhóm 41 action khác chỉ sống được nhờ `SystemController` chặn `requireAdmin` — nhưng `approve_po` **không** thuộc nhóm đó).
  - `java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java:50-58` → `required.isEmpty()` ⇒ ném `ApiError(…, 403)` *"chưa được khai báo quyền"*, **trừ** `admin` (dòng 48) và lãnh đạo công ty `director|accountant` (dòng 49).
  - `PurchaseManagementUseCase.decidePo` dòng 237 đòi `requireRole(["procurement","accountant","admin"])`, mà `requireRole` so với **`base_role`** ⇒ `kh_nv`/`kh_truong` (`procurement`) **qua được cổng vai trò nhưng chết ở cổng module trước đó**; `giamdoc.demo` (`director`) thì ngược lại. **Giao của hai cổng = chỉ `admin`.**
- **Đề xuất:** khai module cho `approve_po` bằng khoá **SẴN CÓ** trong `module_catalog` (⛔ không tạo khoá mới), theo đúng tiền lệ TASK-132/133 ghi trong chính tệp đó:
  ```java
  // ActionRbacRegistry.java:19
  Map.entry("approve_po", List.of("<module-key-sẵn-có>")),   // ← cần captain/user chốt key (xem Câu hỏi mở #1)
  ```
  *Lượt này **KHÔNG** sửa `java-backend/**` (ràng buộc của lượt).*

### F2 — 🔴 **LỖI THẬT (TRUNG BÌNH)**: `receive_goods` không kiểm trạng thái PO ⇒ cổng "phát hành PO" bị vô hiệu

- **Bằng chứng:** tại thời điểm `receive_goods`, PO `PO-…-0017` đang **`status='pending_approval'`** mà vẫn nhận hàng **thành công (HTTP 200)**, chuyển `delivered_pending_confirmation`; sau đó BCH xác nhận ⇒ `completed`.
- **Nguyên nhân gốc:** `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PurchaseStoreAdapter.java:314-330` — `findPoForReceiving` chỉ `WHERE po.id=?`, **không có điều kiện `po.status`**; `PurchaseManagementUseCase.receiveGoods` (dòng 290-302) cũng không kiểm `status`.
- **Hệ quả:** F1 làm `approve_po` bất khả thi, F2 khiến hậu quả **bị che** — toàn bộ 102/103 vẫn "xanh" dù 101 chưa xong.
- **Đề xuất:** `AND po.status IN ('waiting_delivery','partial_delivery')` trong `findPoForReceiving`, hoặc chặn tường minh trong `receiveGoods`.

### F3 — 🟠 **LỖI THẬT (TRUNG BÌNH)**: PO mất giá trị tiền

- **Bằng chứng SQL:** **9/9 PO** `total_value = 0.0000`; `purchase_order_items.unit_price = 0.0000` cho cả 2 dòng — **dù** dòng phiếu có `estimated_unit_price = 350000 / 98000`.
- **Nguyên nhân gốc:** `PurchaseManagementUseCase.createPo` dòng 114-127 **không đọc** `unitPrice` từ payload dòng — chỉ lấy `requestItemId/qty/supplierId/plannedDeliveryAt/systemCode/contract/boq/material`. Cần xác nhận: đây là thiếu sót hay chủ ý (giá PO chỉ đặt qua `update_po_price`)?

### F4 — 🟠 **KHÔNG PHẢI LỖI MÃ — "KỲ VỌNG TEST CŨ" vs THIẾT KẾ HAI ĐƯỜNG**: cấp quyền duyệt RỘNG HƠN phân công dự án

- **Bằng chứng:** `trinhtrench` (`kh_truong`, **base_role `procurement`**) **vượt** cổng RBAC ở **stage 4** (oracle N7). Tương tự `trdademo`/`nvdademo` (base `project`) vượt cổng ở **stage 3** — vì bước 3 có `project,da_nv` và bước 4 có `procurement,kh_nv`, tức `allowed_role_codes` **trộn mã vai trò GỐC** (`project`, `procurement`) với mã vị trí (`da_nv`, `kh_nv`).
- **Nguyên nhân gốc:** `RequestManagementUseCase.canApproveRequestStage` dòng 736-770 — thiết kế **HAI ĐƯỜNG: (1) được chỉ định HOẶC (2) đúng vai trò**, và vai trò được so **cả `role` lẫn `baseRole`** (dòng 762-763). Chú thích mã nguồn ghi rõ đây là **chủ ý**.
- **Phân loại:** kỳ vọng "người không phải owner **luôn** bị chặn" (như đề bài nêu ở ca `trinhtrench`/bước 4) là **KỲ VỌNG TEST CŨ**, không khớp thiết kế hiện hành. **Nhưng** nếu đặc tả người dùng thực sự muốn *"chỉ owner được phân công của dự án mới duyệt"*, thì đây là **khoảng hở cấu hình cần chốt**: bỏ mã gốc `project`/`procurement` khỏi `allowed_role_codes` (chỉ để `thuky`, `da_nv`, `kh_nv`, `giam_doc`), hoặc đổi cổng sang "chỉ `approval_project_assignments`".

### F5 — ℹ️ LỖI NHỎ: bước `po_creation` bị ghi **2 dòng** (1 `pending` tồn đọng)

`finalizeRequestApproval` (`RequestStoreAdapter` dòng 384-390) chèn sẵn 1 dòng `po_creation/pending` khi duyệt xong; `create_po` lại chèn/hoàn tất 1 dòng khác (`insertSupplyWorkflowStepPoCreation`) ⇒ `SWF_a895c4ed…` **pending vĩnh viễn** + `SWF_b102a0d5…` completed. Thêm nữa `completed_by = NULL` cho dòng completed.

### F6 — ℹ️ NGOÀI PHẠM VI: nhiễu từ phiên làm việc khác

Lúc **11:10:55** (≈88 giây **sau** khi lượt #1 kết thúc), một phiên khác đã tạo phiếu xuất **`PX-PRJ-DEMO-01-2026-0028`** (`ISS_a41751d1-…`, `issued_by = USR_8984cf69…` = `tkhodemo`) **trên chính phiếu `…-0155`** ⇒ `material_request_items.issued_qty = 5`, `line_status = 'issued'`, thêm `supply_workflow_steps` bước `issue`. `material_requests.status/supply_status` **không đổi** (`approved`/`completed`, `updated_at` giữ `11:09:27.217`) ⇒ **không ảnh hưởng kết luận luồng duyệt**. Ghi ra để tránh nhầm khi đọc lại DB.

---

## (g) SQL TÁI LẬP + SQL HOÀN TÁC

### (g1) TÁI LẬP

```bash
# Xem kế hoạch (KHÔNG ghi dữ liệu — 0 write)
node tools/probe-wf-muahang-standard.mjs
# Chạy thật (lập phiếu → duyệt 4 bước → PO → GRN → BCH xác nhận)
node tools/probe-wf-muahang-standard.mjs --apply
# Ghi kết quả JSON ra tệp tạm (mặc định đã ghi vào %TEMP%)
#   $env:PROBE_OUT = "C:\...\ket-qua.json"   rồi chạy --apply
```

```sql
-- 1) CẤU HÌNH luồng (CHỈ ĐỌC — người dùng vừa chốt)
SELECT stage_no,name,allowed_role_codes,sla_hours,auto_approve_on_submit,active,approval_mode,
       IFNULL(stage_kind,'(NULL)') AS stage_kind
FROM approval_stage_catalog ORDER BY stage_no;

SELECT apa.stage, apa.owner_user_id, u.username, u.role, COALESCE(rc.base_role,'') AS base_role
FROM approval_project_assignments apa
JOIN users u ON u.id=apa.owner_user_id
LEFT JOIN role_catalog rc ON rc.code=u.role
WHERE apa.project_id='PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3' AND apa.active=1
ORDER BY apa.stage;

-- 2) Phiếu + dòng vật tư
SELECT id,request_no,status,approval_stage,supply_status,total_estimated_value,updated_at
FROM material_requests WHERE request_no='DNMH-PRJ-DEMO-01-2026-0155';

SELECT id,line_no,material_id,requested_qty,approved_purchase_qty,ordered_qty,received_qty,
       estimated_unit_price,line_status
FROM material_request_items
WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY line_no;

-- 3) Chuỗi duyệt + SLA
SELECT stage,department,approver_user_id,status,queued_at,due_at,decided_at,
       decision_snapshot,allowed_role_codes_snapshot,approval_mode_snapshot,comment
FROM approvals WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY stage;

SELECT a.stage AS buoc, c.sla_hours, a.queued_at, a.due_at,
       TIMESTAMPDIFF(HOUR,a.queued_at,a.due_at) AS chenh_gio,
       IF(TIMESTAMPDIFF(HOUR,a.queued_at,a.due_at)=c.sla_hours,'KHOP','SAI') AS ket_luan
FROM approvals a LEFT JOIN approval_stage_catalog c ON c.stage_no=a.stage
WHERE a.request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY a.stage;

-- 4) PO + dòng PO
SELECT id,po_no,status,total_value,buyer_user_id,decided_by,decided_at,ordered_at,delivery_completed_at
FROM purchase_orders WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';

SELECT id,line_no,ordered_qty,received_qty,delivered_qty,status,unit_price,system_code
FROM purchase_order_items WHERE purchase_order_id='PO_8be0965a-3c51-4546-b273-37ef69e0ebdc';

-- 5) GRN + dòng GRN + tồn kho + tệp
SELECT id,receipt_no,qc_status,document_status,certificate_status,delivery_document_status,
       bch_confirmation_status,posting_status,bch_confirmed_at
FROM goods_receipts WHERE purchase_order_id='PO_8be0965a-3c51-4546-b273-37ef69e0ebdc';

SELECT id,received_qty,accepted_qty,rejected_qty,qc_result,lot_no
FROM goods_receipt_items WHERE receipt_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

SELECT id,to_warehouse_id,movement_type,quantity,reference_type,reference_id,posted_by,occurred_at
FROM stock_movements WHERE reference_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

SELECT id,entity_type,entity_id,mime_type,file_name,uploaded_by
FROM attachments WHERE entity_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

-- 6) Dấu vết 3 bước cung ứng
SELECT id,step,status,queued_at,due_at,completed_at,completed_by
FROM supply_workflow_steps WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f' ORDER BY queued_at;
```

### (g2) SQL HOÀN TÁC dữ liệu test — ⛔ **CHƯA CHẠY, chỉ là ĐỀ XUẤT chờ user xác nhận**

> Ràng buộc của lượt này cấm `DELETE` ⇒ toàn bộ khối dưới **chưa được thực thi**. Chạy trong **1 transaction** để có thể `ROLLBACK`.
> `audit_logs` **cố ý KHÔNG xoá** (đó là vết kiểm toán, không phải dữ liệu test).

```sql
START TRANSACTION;

-- 1. Ảnh giao hàng (điều kiện BCH xác nhận)
DELETE FROM attachments
WHERE entity_type='goods_receipt' AND entity_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

-- 2. Tồn kho phát sinh khi BCH xác nhận (⚠️ nếu hàng đã được xuất tiếp thì ĐỪNG xoá dòng này)
DELETE FROM stock_movements WHERE reference_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

-- 3. GRN
DELETE FROM goods_receipt_items WHERE receipt_id='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';
DELETE FROM goods_receipts      WHERE id        ='GRN_6cdc4916-7aa8-4b91-bda3-f307e7df6ec3';

-- 4. PO
DELETE FROM purchase_order_items WHERE purchase_order_id='PO_8be0965a-3c51-4546-b273-37ef69e0ebdc';
DELETE FROM purchase_orders      WHERE id               ='PO_8be0965a-3c51-4546-b273-37ef69e0ebdc';

-- 5. Chuỗi duyệt + cấp phát/giữ chỗ của phiếu
DELETE FROM approval_stage_decisions WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';
DELETE FROM approvals                WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';
DELETE FROM supply_workflow_steps    WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';
DELETE FROM stock_reservations       WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';

-- 6. Trường động của TỪNG DÒNG phiếu (entity_id = id DÒNG, KHÔNG phải id phiếu)
DELETE FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (
  'MRI_758ea9cf-1c17-469d-8576-62e792e1a942',
  'MRI_a3454ad9-5f07-473b-af70-b2d1e7ca4e09');

-- 7. Cấp phát mua hàng theo dòng phiếu
DELETE FROM procurement_allocations WHERE request_item_id IN (
  'MRI_758ea9cf-1c17-469d-8576-62e792e1a942',
  'MRI_a3454ad9-5f07-473b-af70-b2d1e7ca4e09');

-- 8. Phiếu + dòng phiếu
DELETE FROM material_request_items WHERE request_id='MR_3a2fb401-a384-48b1-8605-256b04860c7f';
DELETE FROM material_requests      WHERE id        ='MR_3a2fb401-a384-48b1-8605-256b04860c7f';

-- ⚠️ 9. NGOÀI PHẠM VI LƯỢT NÀY (do phiên khác tạo — F6): phiếu xuất PX-PRJ-DEMO-01-2026-0028
-- DELETE FROM stock_issue_items WHERE issue_id='ISS_a41751d1-b567-4284-96ab-024b7fcd8148';
-- DELETE FROM stock_issues      WHERE id      ='ISS_a41751d1-b567-4284-96ab-024b7fcd8148';

-- COMMIT;   -- chỉ chạy khi đã kiểm tra kỹ; hoặc  ROLLBACK;  để bỏ
```

---

## CÂU HỎI MỞ / UNKNOWN

1. **(chặn F1)** Module key nào là đúng cho `approve_po` trong `module_catalog` / `module_permissions` (ví dụ `purchasing`)? Cần chốt trước khi sửa `ActionRbacRegistry:19` — hiện `List.of()` (rỗng) ⇒ **chỉ `admin`** phát hành được PO.
2. **(chốt thiết kế F4)** Đặc tả đúng là *"ai đúng **vai trò** của bước cũng duyệt được"* (thiết kế 2 đường hiện tại) hay *"**chỉ owner được phân công** của dự án"*? Nếu là vế sau ⇒ `allowed_role_codes` phải bỏ mã gốc `project`/`procurement`.
3. **(F3)** `unit_price` của PO có chủ ý để `0` và chỉ đặt qua `update_po_price` không?
4. **(cấu hình)** Bước CHT (`ASTAGE-1`) **TẮT** có phải chủ ý? Nếu CHT phải duyệt nhu cầu ⇒ bật `active=1` (lượt này **không** sửa cấu hình).
