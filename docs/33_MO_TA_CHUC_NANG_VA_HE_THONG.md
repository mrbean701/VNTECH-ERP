# MÔ TẢ CHỨC NĂNG VÀ HỆ THỐNG — VNTECH ERP V5.3.0

Bản cập nhật: 23/09/2026 · Bộ tài liệu bàn giao hệ thống.

Tài liệu này mô tả **toàn bộ các chức năng của hệ thống theo nhóm nghiệp vụ**, kèm danh mục màn hình, luồng xử lý và quyền. Đây là tài liệu "viết theo đúng hệ thống đang chạy" để làm cơ sở nghiệm thu và đào tạo.

---

## 1. CẤU TRÚC MENU

### 1.1 Menu tổng (ngoài dự án)
| Nhóm | Chức năng chính |
|---|---|
| Tổng quan | Dashboard (thẻ KPI, công việc chờ xử lý) |
| Quản lý dự án | Project Progress, Project Workspace (8 nhóm công việc), CRUD BCH |
| Mua hàng & cung ứng | Requests (MR), Trung tâm phê duyệt, Purchasing (PO), Nhà cung cấp, Đối tác, Nhận hàng (Receiving/Delivered) |
| Kho vật tư | Nhập kho, Xuất kho/Tổ đội, Tồn kho, Chuyển kho, Kiểm kê/Đối chiếu/(Cấp phát-Hoàn trả — mới) |
| Vật tư | Danh mục vật tư gốc, BOQ Workspace, Định mức (đang phát triển) |
| Dự án/BCH | Tổng quan dự án, nhân sự, pháp chế... |
| Tổ đội | Danh sách tổ đội, thanh toán/quyết toán tổ đội |
| Hệ thống (admin) | Tài khoản & Nhân sự, vai trò/quyền, menu & form, thông báo, bulk import, Trust Lock, Factory Reset |

### 1.2 Menu theo dự án (QUẢN LÝ DỰ ÁN — 8 nhóm)
Khi chọn một dự án, menu chuyển sang chế độ quản lý dự án, bao gồm các nhóm: tổng quan dự án, tiến độ, BOQ, mua sắm, kho, tổ đội, tài chính, pháp chế (tùy theo phân quyền).

### 1.3 Menu điện thoại
Menu thu gọn thành nút ☰; có chế độ theo từng phòng ban; tự cuộn tới mục đang dùng.

---

## 2. DANH MỤC MÀN HÌNH (42 màn trong `app/screens/` + màn chính `app/page.tsx`)

### 2.1 Danh sách màn chính đã vận hành
| Màn | `active` key / file | Mô tả |
|---|---|---|
| Dashboard | `dashboard` | Thẻ KPI: số dự án, giá trị hợp đồng, tiến độ, thu hồi vốn, công việc chờ bạn; tự đồng bộ định kỳ |
| Requests (Đề nghị mua) | `requests` (`Requests.tsx`) | Lập MR, theo dõi 5 bậc duyệt, danh sách, tìm kiếm/sort/filter |
| Approvals | `approvals` | Trung tâm phê duyệt: chỉ hiển thị phiếu thuộc quyền bạn; Duyệt/Trả về/Lý do; cột SLA |
| Purchasing | `purchasing` (`Purchasing.tsx`) | Đơn hàng mua (PO), đối chiếu với MR/Supplier |
| Receiving / Delivered | `receiving` / `delivered` (`Receiving.tsx`, `Delivered.tsx`) | Nhận hàng, xác nhận số lượng/chứng từ, ảnh; phiếu đã giao |
| Warehouse Issue | `warehouse_issue` | Xuất kho/Tổ đội |
| Warehouse Receipt | `warehouse_receipt` | Nhập kho |
| Inventory | `inventory` (`Inventory.tsx`) | Tồn kho theo dự án/hợp đồng |
| Central Warehouse | `central_warehouse` | Kho trung tâm |
| Stocktake | `stocktake` (`Stocktake.tsx`) | Kiểm kê, hoàn trả, đối chiếu |
| TeamDirectory | `team_directory` (`TeamDirectory.tsx`) | Danh sách tổ đội, 6 tab chi tiết, cấp phát |
| TeamManagement | `team_management` (`TeamManagement.tsx`) | Quản lý tổ đội |
| WorkCenter | `work_center` (`WorkCenter.tsx`) | Trung tâm công việc (giao việc, việc của tôi) |
| Supplier Manager | `supplier_manager` (`SupplierManager.tsx`) | Danh mục nhà cung cấp |
| Partner Manager | `partner_manager` | Danh mục đối tác (bảng riêng) |
| Material Catalog | `material_catalog` | Danh mục vật tư gốc, gán mã chuẩn |
| BoqControl | `boq` | Workspace BOQ + Material Matching |
| ProjectDetailTabs | `project_*` (`ProjectDetailTabs.tsx`) | Chi tiết dự án: 6 tab + toolbar |
| Admin | `admin` | Quản trị: User/Role/Org/Menu/Form/Thông báo/Bulk import/Trust/Factory Reset |
| Account Settings | `account` | Đổi mật khẩu, avatar, hiển thị |

> Các file màn khác: `ReceiptDrawer.tsx`, `ProjectDetailTabs.tsx`, `Requests.tsx`, `Purchasing.tsx`, `Receiving.tsx`, `Delivered.tsx`, `Inventory.tsx`, `WorkCenter.tsx`, `SupplierManager.tsx`, `Stocktake.tsx`, `TeamDirectory.tsx`, `TeamManagement.tsx`, ... (tổng 42 trong `app/screens/`).

### 2.2 Màn "ĐANG PHÁT TRIỂN" (placeholder, theo thiết kế)
- **site_command**: Tổng quan & Nhân sự dự án (BCH).
- **construction**: Thi công.
- **material_norms**: Định mức vật tư.
- **6 màn tài chính** `dept_finance_*`: kế hoạch thanh toán, thu hồi vốn, tạm ứng, chi phí hiện trường, quỹ tiền mặt, chứng từ.
- **6 màn pháp chế/hành chính** `dept_legal_*`: nhân sự, lao động, công văn, tài liệu, con dấu, phúc lợi.

---

## 3. BACKEND — DANH MỤC ACTION (~224 case tại `SystemController.java`; monolith JS có ~135 action)

### 3.1 Nhóm action theo mô-đun (JS monolith, ~135)
| Nhóm | Số action | Đại diện |
|---|---|---|
| Auth/setup | + | setup, login, logout, me, change_password |
| User/session | 9 | user_create, user_update, user_list, ... |
| Phân quyền/vai trò | 12 | role_update, department_permission, action_permission, can_* |
| Cấu hình menu/form | 10 | menu_config, form_field_config |
| Trust/license | 2 | verify, license_register |
| Factory reset | 2 | factory_reset, ... |
| Dự án/hợp đồng | 8 | project_create, project_update, contract_create, delete_project, ... |
| MR & phê duyệt | 7 | mr_create, approval actions, approve/reject per stage |
| Nhà cung cấp | 3 | supplier_create/update, supplier_auto_detect |
| PO | 2 | po_create, po_update_price / approve_po / reject_po |
| Danh mục vật tư | 12 | material_create, material_matching, aliases, ... |
| BOQ | 9 | boq_import, boq_change_history, boq_mapping, ... |
| Kho xuất/nhập/tồn | 15 | wh_receipt, issue_stock, stock_issue_confirm, transfer, stocktake, adjust, ... |
| Giao nhận/lắp đặt | 2 | delivery, install |
| Sản xuất/sản lượng | 2 | production_report |
| Giao khoán tổ đội | 5 | team_contract, team_settlement |
| Thu hồi vốn/thanh toán | 5 | capital_recovery, payment, ... |
| Công việc | 5 | task_create, work_item actions, task_notification |
| Thông báo | + | notification_create (Web/Email), mark_read (read-once) |

### 3.2 Một số action trọng yếu (Java)
| Action | Vai trò |
|---|---|
| `approve_po` / `reject_po` / `update_po_price` | Duyệt/từ chối/sửa giá PO |
| `issue_stock_confirm` | Xác nhận xuất kho (thủ kho) → phiếu chuyển trạng thái |
| `delete_department_permission` | Xóa quyền phòng ban |
| `approve / reject` (per stage) | Phê duyệt động nhiều bậc |
| `retry_email` / `requeueEmail` | Phát lại email đang lỗi |
| `rebuild_department_permissions` | Tái sinh quyền phòng ban |

### 3.3 Phân quyền action
Mỗi action có khai báo capability trong `ACTION_CAPABILITY` / `ActionRbacRegistry`. Nếu action chưa được khai quyền, RBAC mặc-định **từ chối** (403).

---

## 4. LUỒNG NGHIỆP VỤ CHÍNH

### 4.1 Luồng Mua hàng 5 bậc (`WF-MUAHANG-01`)
```
1. Kỹ sư tạo MR (DNMH)
2. Duyệt bậc 1: Chỉ huy trưởng (cha.ht)
3. Duyệt bậc 2: Thư ký TGĐ (thukydemo)
4. Duyệt bậc 3: NV dự án (nvdademo)
5. Duyệt bậc 4: NV kế hoạch (nvkhdemo)
6. Duyệt bậc 5: Trưởng phòng DA (trdademo)
7. Tạo PO → PO completed
8. Nhận hàng → GRN confirmed (+ ảnh giao hàng)
```

### 4.2 Luồng Xuất kho (`WF-XUATKHO-01`)
```
1. Lập phiếu xuất (status = pending_cht)
2. Chỉ huy trưởng duyệt
3. Thủ kho xác nhận (issue_stock_confirm → status = issued)
4. Sinh GRN / cập nhật tồn
```

### 4.3 Trung tâm phê duyệt (Approval Center)
- Dashboard card "Chờ Giám đốc duyệt" dữ liệu thật (chỉ admin / ≥ trưởng phòng).
- Danh sách chờ duyệt → "phiếu đang xử lý" → nút Chi tiết (modal).
- Approval timeline dạng "Bước 1…" (không dùng cột dọc).
- SLA quá hạn vẫn duyệt được, bắt buộc nhập lý do.

### 4.4 Giao việc & công việc
- Trưởng phòng trở lên: xem/giao việc trong phòng ban mình.
- Phó GĐ trở lên: xem/giao toàn công ty.
- Backend kiểm user · chức vụ · phòng ban · project scope (không hard-code frontend).
- Tab "Việc của tôi" lọc theo đúng assignee (đã vá lỗi lọc bằng tên không tồn tại).

---

## 5. QUYỀN NGƯỜI DÙNG (RBAC)

| Khái niệm | Mô tả |
|---|---|
| Vai trò (role) | `cht`, `kh_truong`, `da_truong`, `thuky`, `da_nv`, `kh_nv`, `thu_kho`, `accountant`, engine, phó GĐ... (mã ENGINE + mã chức danh thật từ `role_catalog`) |
| Module capability | canView / canUse / canCreate / canEdit / canDelete / canApprove |
| Phạm vi dữ liệu | user_project_scopes (dự án), phòng ban, kho; thông tin tổng hợp theo dự án không chia menu theo phòng ban mù |
| Nhóm quyền nghiệp vụ | nhóm bản ghi hạn chế kết hợp role → cho phép resource-scoped rights |
| Audit | user_module_permissions 484→926, department_module_permissions 51→480 (dữ liệu thật) |

---

## 6. CHỨC NĂNG QUẢN TRỊ (ADMIN)

1. **Tài khoản / Actor:** tách khái niệm user tài khoản và actor người dùng (AD-13); màn "Nhân sự" đổi tên "Tài khoản"; 13 cột; sort Trạng thái→Mã; lọc phòng ban; 2 sub-tab tổ chức; đặt Position/System Role.
2. **Đổi tên / email:** chỉ Admin sửa `full_name`/`email`; user tự sửa avatar + mật khẩu (AD-16).
3. **Phân quyền phòng ban:** theo MẪU/GIỚI HẠN, không phải đường kiểm quyền (AD-07, khớp A-15).
4. **Menu & form động:** cấu hình ẩn/hiện/required field; cấu hình menu không lồng nhau.
5. **Thông báo:** tab Thông báo CRUD; create notification Web/Email; recipient 1 user / nhiều user / phòng ban / dự án / toàn bộ; web notification read-once.
6. **Bulk import:** user Excel 12 cột, project Excel 9 cột, preflight nguyên tử.
7. **Audit:** xem lịch sử thay đổi mọi hành động; audit theo 2 phạm vi; ghi trước—sau.
8. **Trust Lock & Factory Reset.**

---

## 7. TÍNH NĂNG ĐẶC THÙ

| Tính năng | Mô tả |
|---|---|
| Xuất CSV/XLSX | Hầu hết màn danh sách có nút xuất |
| Export BOQ Excel/CSV | Định dạng chuẩn không lộ GUID (TASK-122) |
| Chế độ sáng/tối | Nút ☀/☾, nhớ theo tài khoản |
| Tìm kiếm toàn hệ thống | Tìm dự án/vật tư/số phiếu/đơn vị |
| Responsive | 4 kích thước màn hình |
| Material Matching | Tự đề xuất vật tư / kiểm tra NCC khi lập PO ("Vật tư này chưa có trong NCC...") |
| Modal chuẩn | Không vượt viewport (bất biến đo được) |

---

## 8. DỮ LIỆU MẪU BÀN GIAO (PRJ-DEMO-01)

Chuỗi chứng từ đã thông qua đầy đủ:
`DNMH-PRJ-DEMO-01-2026-0008 (approved 5/5)` → `PO-PRJ-DEMO-01-2026-0005 (completed)` → `GRN-PRJ-DEMO-01-2026-0005 (confirmed)` → `PX-PRJ-DEMO-01-2026-0007 (posted)` → `RET-PRJ-DEMO-01-2026-0008 (received)`.
Chi tiết: `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md`.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 (23/09/2026).*