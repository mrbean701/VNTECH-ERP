# MA TRẬN QUYỀN GO-LIVE — ACTION LÕI × 2 TẦNG CỔNG × AI CHẠY ĐƯỢC

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** (⛔ 0 dòng mã sản phẩm)
Mục đích: cho user **bảng tra cứu để cấu hình phân quyền go-live** (GĐ A3/A4 của `docs/37`) — ⛔ thay vì phải suy luận từ tài liệu cũ.
Nguồn: `ActionRbacRegistry.java` (**tầng ①**) + `SystemController.java` (**tầng ②**) + `RbacService.java` (luật) — **[ĐỌC MÃ]**, ⛔ **không có phép thử runtime** (shell hỏng, vòng 2).

## 0. BA KÝ HIỆU "AI CHẠY ĐƯỢC"

| Ký hiệu | Nghĩa | Căn cứ |
|---|---|---|
| **A** | Chỉ tài khoản có `role == "admin"` | `requireRequireAdmin` (`SystemController:1739-1745`) hoặc module chứa `"admin"` |
| **L** | Ban lãnh đạo: `director` · `accountant` | `RbacService:60-62, 69` — **qua được mọi action module-gated** (ngoại lệ: danh sách module **có chứa `"admin"`** thì ⛔ không áp dụng) |
| **M** | Người được cấp **module + capability** tương ứng (theo phòng ban hoặc ngoại lệ cá nhân) | `RbacService:85-88` (`canUseModule(userId, moduleKey, capability)`) |

> ⚠️ **Lưu ý thiết kế quan trọng (đã ghi `CURRENT_STATE` như `D-022`)**: vì luật **L**, Giám đốc/Kế toán trưởng **thực thi được mọi action module-gated bất kể capability** (trừ nhóm module `admin`). Nếu VNTECH muốn Ban lãnh đạo **chỉ xem**, phải đổi luật này (BE) — ⛔ không phải việc cấu hình quyền.

---

## 1. CHUỖI MUA HÀNG – GIAO NHẬN (**lõi go-live số 1**) — ✅ **SẠCH**

| Action | Module (tầng ①) | Capability | Tầng ② (controller) | Ai chạy | Dòng |
|---|---|---|---|---|---|
| `create_request` | `requests` | `canCreate` | `requireCurrentUser` | L · M | `:1122` |
| `decide_approval` | `approvals` | `canApprove` | `requireCurrentUser` | L · M | `:1130` |
| `request_supplement` | (theo registry) | — | `requireCurrentUser` | L · M | `:1141` |
| `create_po` | `purchasing` | `canCreate` | `requireCurrentUser` | L · M | `:1149` |
| `update_po_price` | `purchasing` | `canApprove` | `requireCurrentUser` | L · M | `:1156` |
| `approve_po` / `reject_po` | `purchasing` | `canApprove` | `requireCurrentUser` | L · M | `:1161` / `:1166` |
| `close_po_line` | `purchasing` | `canApprove` | `requireCurrentUser` | L · M | `:1170` |
| `receive_goods` | `receiving` + `warehouse_receipt` | `canCreate` | `requireCurrentUser` | L · M | `:1175` |
| `confirm_delivery` | `receiving` + `warehouse_receipt` | `canApprove` | `requireCurrentUser` | L · M | `:1182` |
| `save_supplier` · `set_supplier_status` | `supplier_catalog` | `canEdit` | `requireCurrentUser` | L · M | `:1434` / `:1439` |
| `delete_supplier` | `supplier_catalog` | `canEdit` | 🔴 **`requireRequireAdmin`** | **A** | `:1444-1445` |
| `resubmit_request` · `update_returned_request` · `cancel_request` · `delete_request` · `preview_request_import` | registry **có module** (⛔ không nằm trong 65 rỗng) | `canEdit`/… | ✅ `requireCurrentUser` (**đã soi** `:534-563`) | L · M | `:544` · `:549` · `:554` · `:559` · `:534` |

> ✅ **Kết luận**: chuỗi đề nghị → duyệt → PO → giao nhận → NCC **chạy được cho người dùng nghiệp vụ** (module-gated). Mã còn ghi rõ chủ ý: *«⛔ KHÔNG hard-code quyền ở đây — cổng nằm ở `ActionRbacRegistry` + `canApproveRequestStage`»* (`:1138-1140`).

## 2. KHO – KIỂM KÊ – ĐIỀU CHUYỂN — ✅ **SẠCH**

| Action | Module (tầng ①) | Capability | Tầng ② | Ai chạy | Dòng |
|---|---|---|---|---|---|
| `issue_stock` | `teams` + `warehouse_issue` | `canCreate` | `requireCurrentUser` | L · M | `:1257` |
| `return_stock` | `teams` + `warehouse_issue` | `canCreate` | `requireCurrentUser` | L · M | `:1187` |
| `create_transfer_order` | `inventory` | `canCreate` | `requireCurrentUser` | L · M | `:1192` |
| `approve_transfer_order` · `ship_transfer_order` · `receive_transfer_order` | `inventory` (theo registry) | — | `requireCurrentUser` | L · M | `:1197` · `:1202` · `:1247` |
| `create_stock_count` · `approve_stock_count` | `stocktake` (theo registry) | — | `requireCurrentUser` | L · M | `:1222` · `:1242` |
| `create_central_return` · `approve_central_return` · `receive_central_return` | `central_warehouse`/`stocktake` | — | `requireCurrentUser` | L · M | `:1207` · `:1212` · `:1217` |
| `reconcile_contract_stock` · `transfer_contract_ownership` · `reverse_stock_movement` · `confirm_installation` | (theo registry) | — | `requireCurrentUser` | L · M | `:1227` · `:1232` · `:1237` · `:1252` |

## 3. TÀI CHÍNH – HỢP ĐỒNG – SẢN LƯỢNG — ✅ SẠCH (phần đã soi)

| Action | Tầng ② | Ai chạy | Dòng |
|---|---|---|---|
| `save_contract_payment` · `import_contract_payments` | `requireCurrentUser` | L · M | `:639` · `:644` |
| `save_team_subcontract` | `requireCurrentUser` | L · M | `:649` |
| `save_project_contract` · `save_boq_item` · `save_boq_version` · `set_boq_item_status` | `boq` (theo registry) | `canEdit` | ✅ `requireCurrentUser` (**đã soi**) ⭐ **+ TẦNG ③**: `save_project_contract` gọi `accessScopeService.requireProjectAccess(cu.id(), cu.role(), projectId, true, "Không có quyền sửa hợp đồng dự án này.")` | L · M (⚠️ **chỉ với dự án được cấp phạm vi**) | `:304-310` · `:564` · `:569` · `:574` |

## 4. CÔNG VIỆC – TỔ ĐỘI — ✅/⚠️

| Action | Module (tầng ①) | Capability | Tầng ② | Ai chạy | Dòng |
|---|---|---|---|---|---|
| `create_project_team` | `site_command` | `canUse` | `requireCurrentUser` | L · M | `:1015` |
| `mark_task_notification_read` | `dept_plan_tasks`/`dept_project_tasks` | `canView` | `requireCurrentUser` | L · M | `:1010` |
| `set_project_team_status` | 🔴 **RỖNG `List.of()`** | (`canEdit` khai ở map capability) | `requireCurrentUser` | ⚠️ **chỉ A · L** | `:1020` (registry `:283`) |
| `delete_project_team` | 🔴 **RỖNG** | — | `requireCurrentUser` | ⚠️ **chỉ A · L** | registry `:137` |

## 5. DANH MỤC VẬT TƯ · LỊCH TRÌNH DUYỆT — 🔴 **NHÓM MỒ CÔI (P-08)**

| Action | Module (tầng ①) | Tầng ② | Ai chạy | Ghi chú |
|---|---|---|---|---|
| `save_material_category` · `save_material_subcategory` · `set_material_category_status` · `set_material_subcategory_status` · `delete_material_category` · `delete_material_subcategory` · `import_material_catalog` | 🔴 **RỖNG** | `requireCurrentUser` (`:896-931`) | ⚠️ **chỉ A · L** | ⇒ **M bị 403** «Thao tác chưa được khai báo quyền trong hệ thống» ⇒ **Phòng Kế hoạch ⛔ không bảo trì được danh mục vật tư** |
| `save_approval_stage` · `set_approval_stage_status` · `delete_approval_stage` | 🔴 **RỖNG** | `requireCurrentUser` (`:1030-1039`) | ⚠️ **chỉ A · L** | ⇒ ảnh hưởng **GĐ A2** (cấu hình 5 bậc duyệt) nếu người cấu hình ⛔ không phải admin |

## 6. QUẢN TRỊ HỆ THỐNG (phân quyền – người dùng) — **A** phần lớn, có 1 ngoại lệ đã sửa đúng

| Action | Module (tầng ①) | Tầng ② | Ai chạy | Dòng |
|---|---|---|---|---|
| `create_user` · `set_user_status` · `reset_user_password` · `delete_user` | RỖNG/kết hợp | **`requireRequireAdmin`** | **A** | `:375` · `:396` · `:401` · `:409` |
| `save_user_access` · `delete_user_module_override` | RỖNG | **`requireRequireAdmin`** | **A** | `:413-414` · `:418-419` |
| ⭐ **`update_user`** | `admin_tab_01` · `canEdit` | `requireCurrentUser(request, false)` — **tầng ② CỐ Ý BỎ** | **L · M (có `admin_tab_01`)** | `:379-394` |
| `save_organization_unit` · `set_organization_unit_status` | RỖNG | `requireRequireAdmin` | **A** | `:479-485` |
| `bulk_import_users` | RỖNG | (theo khối `:1070`) | ⏳ chưa soi | `:1070` |

> ⭐ **`update_user` là TIỀN LỆ VÀNG trong repo** (ghi hẳn trong mã `:380-390`): trước đây bị `requireRequireAdmin` ⇒ **mọi tài khoản không phải admin LUÔN 403** *dù đã được cấp `admin_tab_01`* ⇒ biến registry + guard trong use case thành **CODE CHẾT**. **Cách sửa đúng đã dùng**: ⛔ **bỏ cổng hard-code ở controller**, để **cổng DUY NHẤT ở tầng ①** (`requireActionModule`), và giữ phần nhạy cảm (đổi vai trò) bằng **guard trong use case** (`UserManagementUseCase.guardRoleChange`).
> ⇒ **Đây chính là khuôn mẫu để sửa `P-08` và (nếu user muốn) `PROJECT CRUD`.**

---

## 7. BA BẤT NHẤT QUÁN ĐÃ ĐO ĐƯỢC (chỉ ra chính xác — ⛔ không phải phỏng đoán)

| # | Bất nhất quán | Hướng | Bằng chứng |
|---|---|---|---|
| 1 | `delete_supplier`: registry nói `supplier_catalog`+`canEdit` (**M chạy được**) nhưng controller đòi **admin** | **AN TOÀN** (chặt hơn khai báo) nhưng **lệch tài liệu** ⇒ `CHECKLIST` §8 từng ghi «2 mâu thuẫn `delete_partner`/`delete_supplier`» — nay **đã định vị được dòng** | `ActionRbacRegistry:352`(?)+`SystemController:1444-1445` |
| 2 | **PROJECT CRUD** (`create/update/delete_project`, `set_project_status`): **hard-code admin** giữa một hệ **module-gated** | Cần user xác nhận **chủ ý hay sót** | `SystemController:281-302` |
| 3 | **P-08** (danh mục vật tư 7 · tổ đội 2 · lịch trình duyệt 3): registry **RỖNG** + controller **không** admin-gate ⇒ **403 cho M** | ⚠️ **CHẶN NGHIỆP VỤ** (nghi vấn CAO) | registry `:109,129,131,137,157,189,216,219,263,271,274,283` + controller `:893-1040` |

---

## 8. DÙNG NGAY ĐƯỢC: GỢI Ý CẤU HÌNH CHO 4 PHÒNG (GĐ A3/A4)

| Phòng | Module cần cấp (tối thiểu) | Capability | Ghi chú |
|---|---|---|---|
| **Phòng Kế hoạch** | `requests` · `approvals` · `purchasing` · `supplier_catalog` · `material_catalog`? ⚠️ | `canCreate` `canEdit` `canApprove` | ⚠️ **`material_catalog` hiện VÔ DỤNG** vì 7 action danh mục vật tư là **mồ côi** ⇒ **phải vá P-08 trước**, nếu không cấp quyền vẫn 403 |
| **Phòng Dự án** | `site_command` · `boq` · `teams` · `inventory`(?) | `canUse` `canEdit` | ⚠️ tạo/sửa **dự án** vẫn **admin-only** dù có `site_command` (xem §7.2) |
| **Tài chính – Kế toán** | `purchasing`(xem) · `boq` · `finance` · `central_warehouse` | `canView` `canEdit` `canApprove` | `save_contract_payment` module-gated ✅ |
| **Hành chính – Pháp chế** | `hr_legal` · `dept_legal_*` | `canView` `canEdit` | ngoài lõi go-live |
| **Kho (thủ kho)** | `inventory` · `warehouse_receipt` · `warehouse_issue` · `stocktake` · `central_warehouse` · `teams` | `canCreate` `canApprove` | chuỗi kho **SẠCH** ✅ |

> ⛔ **Cảnh báo dùng bảng này**: `docs/37` §2 từng khuyến nghị «ẩn 22 màn phòng ban mỏng». Bảng trên là **module cho nghiệp vụ**, ⛔ không phải khuyến nghị bật 22 màn đó.

---

## 9. VIỆC CÒN CHỜ (⛔ không tự làm vì thiếu phép thử / thiếu quyền)

1. ⏳ **Soi nốt thân** `:304` (`save_project_contract`) · `:534-563` (5 action request) · `:564-573` (BOQ) · `:1070` (`bulk_import_users`) — phần **chưa đọc**, ⛔ không kết luận.
2. ⏳ **Chạy phép thử** `docs/39` §5 khi shell hồi phục (đặc biệt P-08: M ⇒ 403?, A ⇒ 200?).
3. ⏳ **User xác nhận** §7.2 (PROJECT CRUD chủ ý?) và **luật L** (Ban lãnh đạo thực thi được mọi module — có muốn giữ?).
