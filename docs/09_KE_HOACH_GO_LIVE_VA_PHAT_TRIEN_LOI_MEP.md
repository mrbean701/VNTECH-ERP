# BÁO CÁO KẾ HOẠCH GO-LIVE & PHÁT TRIỂN LÕI — VNTECH ERP V5.3.0 (MEP)

Ngày lập: 09/09/2026 · Trạng thái hệ thống: fingerprint `VNTECH-FP-54394992D738B8F0` · migrations `0000..0075` (76 file) · regression **61/61** · workflow E2E **PASS** · build exit 0 · đã push Git nhánh `unity` (commit `ab97b23`).

> Tài liệu này lập theo yêu cầu: *tập trung chức năng LÕI để go-live sớm* — mua hàng, quản lý đơn hàng, quy trình mua hàng, luồng duyệt đơn, quản lý phòng ban (phục vụ phân quyền workflow), quản lý dự án.

---

## 1. MÔ TẢ HỆ THỐNG (HIỆN TRẠNG ĐÃ KIỂM CHỨNG BẰNG CODE)

### 1.1 Kiến trúc hiện tại (giữ nguyên theo quyết định)
- **Monolith JS**: React SPA (`app/page.tsx` — 112 component, 39 modal CRUD) + backend `scripts/system-route.mjs` (**174 action nghiệp vụ**) + DB adapter (SQLite local `node:sqlite` / Cloudflare D1 / PostgreSQL).
- **Bảo vệ toàn vẹn**: 198 file hash fingerprint + gate release/master-baseline/CSS + migration append-only (0000..0075).
- **Chạy**: `node scripts/local-server.mjs` → http://localhost:8787 (SQLite) · `universal-server.mjs` (D1/PG).

### 1.2 Lõi nghiệp vụ mua hàng — ĐÃ CÓ THẬT (không phải placeholder)
| Bước nghiệp vụ | Backend action | Màn hình | Trạng thái |
|---|---|---|---|
| Tạo/sửa phiếu đề nghị | `create_request`, `update_returned_request`, `resubmit_request`, `delete_request`, `cancel_request`, `preview_request_import` | `requests` + `RequestModal`/`RequestDrawer` (9.8KB/10.4KB) | ✅ Sẵn sàng |
| **Duyệt 5 bậc (RBAC theo Owner từng bước)** | `decide_approval`, `save_approval_stage`, `set_approval_stage_status`, `delete_approval_stage` | `approvals` + `ApprovalStageModal` | ✅ Sẵn sàng |
| Lập đơn mua (nhiều PO từ 1 phiếu) | `create_po`, `close_po_line` | `purchasing` + `PoModal` | ✅ Sẵn sàng |
| Nhận hàng / giao nhiều chuyến | `confirm_delivery` | `receiving`, `delivered`, `warehouse_receipt` + `ReceiptModal`/`ReceiptDrawer` | ✅ Sẵn sàng |
| Nhập/xuất kho, chuyển kho | `issue_stock`, `return_stock`, `create_transfer_order`, `approve_transfer_order`, `ship_transfer_order`, `receive_transfer_order` | `inventory`, `warehouse_issue`, `central_warehouse` | ✅ Sẵn sàng |
| Kiểm kê & hoàn trả | `create_stock_count`, `approve_stock_count`, `create_central_return`, `approve_central_return`, `receive_central_return` | `stocktake` + `CountModal`/`ReturnModal` | ✅ Sẵn sàng |
| Nhà cung cấp | `save_supplier`, `set_supplier_status`, `delete_supplier` | `supplier_catalog` | ✅ Sẵn sàng |
| Vật tư & định mức | 33 action (material catalog, UoM, alias, BOQ mapping, norms) | `material_catalog`, `material_norms`, `boq` | ✅ Sẵn sàng |

### 1.3 Luồng duyệt đơn — CƠ CHẾ ĐÃ KIỂM CHỨNG
Code `decide_approval` thực thi **4 lớp kiểm soát** (đọc trực tiếp từ source):
1. `canApproveRequestStage(user, requestId, stage)` — phải là **Owner được phân công** của đúng bước + đủ RBAC.
2. Kiểm tra **đúng bậc hiện tại** (`mr.approval_stage === stage`) và trạng thái `pending_approval` → chống duyệt lộn bậc/duyệt lại.
3. `canAccessProject(user, projectId, true)` — phải có quyền tại **dự án** của phiếu.
4. Decision chỉ nhận `approved`/`rejected`; cấu hình bậc linh hoạt qua `approval_stage_catalog` (`stage_no`, `sla_hours`, `auto_approve_on_submit`, `active`, `sort_order`).

**Email/SLA**: bảng `email_settings`, `email_outbox`, `sla_hours` + dispatcher `scripts/email-dispatcher.mjs` — **đã nối vào cả `local-server.mjs` và `universal-server.mjs`** (không phải code chết). Có `retry_email`, `save_email_settings`, `mark_task_notification_read`.

### 1.4 Quản lý phòng ban / phân quyền (nền cho workflow)
- **19 action**: `save_organization_unit`, `set_organization_unit_member`, `save_engine_role_profile`, `save_business_role_group`, `save_role_catalog`, `save_user_access`, `bulk_import_users`, `revoke_user_sessions`…
- **Ma trận quyền**: `ACTION_CAPABILITY` ánh xạ từng action → `canCreate/canEdit/canApprove/canView` (+ `canEditCentral`, `canApproveStage`).
- **25 nhóm nghiệp vụ** (Điện, Nước, HVAC, PCCC, BGD, TCKT, BCH, AUD…), kế thừa quyền theo phòng + ngoại lệ cấp riêng cho user.
- **Quản trị động**: mã/tên quyền, nhóm, vai trò, thứ tự biểu mẫu đều cấu hình được qua UI (`menu_group`, `module_catalog`, `field-config`).

### 1.5 Quản lý dự án
- **32 action**: `create_project`, `update_project`, `set_project_status`, `bulk_import_projects`, `save_project_contract`, `save_boq_version`, `save_boq_item`, `update_boq_contract_prices`, `reconcile_contract_stock`, `transfer_contract_ownership`, `save_contract_payment`, `import_contract_payments`, `create_project_team`…
- **Màn**: `site_command` (BCH dự án), `project_progress`, `boq` (BOQ 21.8KB, 7 action), `payments`, `teams`, `construction`, `production`.

### 1.6 Bằng chứng kiểm chứng lõi (chạy thật, không suy đoán)
```
node --import tsx tests/workflow-direct.test.ts
→ Workflow VNTECH ERP V5.3.0 FULL W2 passed:
  five-stage approvals/email/SLA → multi-PO/multi-delivery → strict material master
  → contract stock → inherited/override permissions → configurable groups/roles/UI → user safety
```
Kèm theo trong cùng test: 1 phiếu gốc tách **nhiều PO/nhiều hệ/nhiều chuyến giao**; đóng phần thiếu có phê duyệt giữ nhu cầu gốc; chống trùng vật tư theo mã gốc Kho Tổng; vật tư dư chỉ tăng Kho Tổng sau duyệt; quyền Phòng Dự án kế thừa; tài khoản nghỉ việc bị khóa + thu hồi phiên.

---

## 2. CHỨC NĂNG ĐÃ SẴN SÀNG GO-LIVE (CHECKLIST)

### 2.1 Go-live được ngay (lõi, đã kiểm chứng)
| # | Chức năng | Bằng chứng |
|---|---|---|
| 1 | Phiếu đề nghị mua + import Excel | action + `RequestModal` + test |
| 2 | **Duyệt 5 bậc theo Owner + SLA + email** | `decide_approval` 4 lớp + workflow test |
| 3 | Tách nhiều PO từ 1 phiếu, nhiều chuyến giao | workflow test |
| 4 | Xác nhận giao hàng, đóng phần thiếu có duyệt | `confirm_delivery` + test |
| 5 | Nhập/xuất/chuyển kho, kiểm kê, hoàn trả | 11 action + `stocktake` |
| 6 | Vật tư: catalog, UoM, alias chống trùng, mapping BOQ | 33 action |
| 7 | Nhà cung cấp | 3 action |
| 8 | Dự án / BOQ / hợp đồng / thanh toán HĐ | 32 action + `boq` 21.8KB |
| 9 | **Phân quyền phòng ban + RBAC + ngoại lệ** | 19 action + test kế thừa/override |
| 10 | Cấu hình quyền/nhóm/vai trò/thứ tự form động | `RoleCatalogModal`, `BusinessGroupModal`, field-config |
| 11 | An toàn tài khoản: khóa, thu hồi phiên, xóa có kiểm soát | test user safety |
| 12 | Báo cáo vận hành + xuất CSV/XLSX/PDF | `reports` + `reportExport`/`reportPdf` |

### 2.2 Cần chốt trước go-live (không phải code, là cấu hình/nghiệp vụ)
1. **Nạp dữ liệu thật**: dự án, phòng ban, người dùng, nhà cung cấp, vật tư, BOQ, định mức.
2. **Cấu hình 5 bậc duyệt theo thực tế VNTECH** (`approval_stage_catalog`: bậc nào, Owner nào, SLA giờ) + `auto_approve_on_submit` cho bậc tự động.
3. **SMTP thật** trong `EmailSettingsModal` (host/port/user/password) — hiện dispatcher sẵn, cần thông tin mail server.
4. **Ma trận phân quyền thật** theo 4 phòng (KH / DA / TCKT / HC-PC) × 25 nhóm nghiệp vụ.
5. **Diễn tập 1 phiếu thật end-to-end** trên dữ liệu thật trước khi mở rộng.

### 2.3 Chưa sẵn sàng (khuyến nghị KHÔNG đưa vào go-live)
- **25 màn workspace phòng ban** (`dept_plan_*`, `dept_project_*`): khảo sát cho thấy `DepartmentTaskWorkspace` chỉ có **1 form "Giao việc bổ sung"** — nội dung rất mỏng so với tên màn. → Để sau go-live, hoặc ẩn khỏi menu chính.
- Các màn phụ trợ Phase 1 (nhân sự, công văn, con dấu, bảo hiểm, dòng tiền…) — có CRUD thật nhưng **không thuộc lõi MEP**, giữ nguyên không mở rộng thêm trước go-live.

---

## 3. ĐỀ XUẤT TRIỂN KHAI (CÁC BƯỚC, ƯU TIÊN LÕI)

### Giai đoạn A — Chuẩn bị go-live (1–2 tuần) ⚠️ ƯU TIÊN CAO NHẤT
| Bước | Việc | Kết quả |
|---|---|---|
| A1 | Tạo dữ liệu mẫu/nạp dữ liệu thật (dự án, phòng ban, user, NCC, vật tư, BOQ) | Menu Quản lý dự án + workspace hoạt động thật |
| A2 | Cấu hình 5 bậc duyệt + Owner + SLA theo quy trình VNTECH | Luồng duyệt chạy đúng thực tế |
| A3 | Cấu hình SMTP thật + test gửi mail duyệt | Email thông báo hoạt động |
| A4 | Chốt ma trận phân quyền 4 phòng × nhóm nghiệp vụ | Phân quyền đúng |
| A5 | Diễn tập end-to-end 1 phiếu thật (đề nghị → 5 bậc → PO → giao → nhận → kho) | Xác nhận sẵn sàng |
| A6 | Ẩn/khóa 25 màn phòng ban mỏng khỏi menu go-live | Tránh người dùng vào màn rỗng |

### Giai đoạn B — Ổn định sau go-live (2–4 tuần)
- B1 **Sao lưu tự động + quy trình phục hồi** (đã có `local-backup`, cần lịch chạy).
- B2 **Giám sát**: nhật ký thao tác, retry email, cảnh báo SLA quá hạn.
- B3 **Đào tạo 4 nhóm người dùng** theo vai trò (người đề nghị / duyệt / mua hàng / kho).
- B4 **Vá lỗi phát sinh** — ưu tiên tuyệt đối, mỗi bản vá qua đủ gates + refresh identity.

### Giai đoạn C — Hoàn thiện lõi (1–2 tháng)
- C1 **Báo cáo mua hàng chuyên sâu**: tiến độ PO theo NCC, tỷ lệ giao đúng hạn, so sánh giá.
- C2 **Cảnh báo chủ động qua email**: PO trễ hạn, đề nghị quá SLA, tồn dưới định mức.
- C3 **Hoàn thiện workspace phòng ban** (chỉ khi đã có nghiệp vụ rõ).
- C4 **Tối ưu hiệu năng** khi dữ liệu lớn (phân trang server).

---

## 4. PHƯƠNG HƯỚNG PHÁT TRIỂN TƯƠNG LAI

### 4.1 Nguyên tắc
- **Giữ monolith JS** — không tách layered (theo quyết định đã chốt), tránh rủi ro sát go-live.
- **Ưu tiên "chạy mượt" hơn "hoàn hảo"**: lõi đúng trước, tính năng phụ sau.
- Mọi thay đổi source → gates + `tools/refresh-phase-identity.mjs` + migration append-only.

### 4.2 Hướng mở rộng (sau khi lõi ổn định)
1. **Mobile/PDA hiện trường** (`dept_project_pda` đang có tên) — nhập nhận hàng/nghiệm thu tại công trường.
2. **Tích hợp kế toán** — đã có sổ kế toán tổng hợp + JSON MISA, mở rộng đối chiếu tự động.
3. **Phân tích & KPI** — dashboard tiến độ mua hàng, hiệu suất NCC, thời gian duyệt trung bình.
4. **Đa công ty/đa kho** — hiện đã có Kho Tổng + kho dự án, mở rộng nếu cần.
5. **(Tùy chọn dài hạn)** Java Clean Architecture + MySQL nếu cần mở rộng quy mô — tài liệu `docs/06`, chỉ khi có quyết định đầu tư.

### 4.3 Rủi ro cần quản lý
| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Cấu hình duyệt/SLA chưa khớp thực tế | **Cao** | Diễn tập A5 trên phiếu thật trước go-live |
| SMTP chưa có → không có mail duyệt | **Cao** | Hoàn tất A3, có phương án thông báo nội bộ dự phòng |
| Người dùng vào màn phòng ban mỏng | Trung bình | Ẩn khỏi menu (A6) |
| Sai phân quyền → duyệt nhầm/lộ dữ liệu | **Cao** | Chốt ma trận A4 + test kế thừa/override đã có |
| Mất dữ liệu | **Cao** | B1 sao lưu tự động + thử phục hồi |
| Fingerprint/CI vỡ khi vá gấp | Trung bình | Quy trình refresh identity đã chuẩn hóa |

---

## 5. KẾT LUẬN

**Hệ thống đã sẵn sàng go-live ở phần LÕI**: toàn bộ chuỗi mua hàng (đề nghị → duyệt 5 bậc có Owner/SLA/email → nhiều PO → nhiều chuyến giao → nhập kho → kiểm kê/hoàn trả), cùng nền phân quyền phòng ban động và quản lý dự án/BOQ/hợp đồng, **đã được kiểm chứng bằng test end-to-end chạy thật** (workflow PASS) và 61/61 regression, build xanh, đã push Git.

**Việc quyết định thành công go-live hiện KHÔNG nằm ở code mà ở cấu hình**: nạp dữ liệu thật, chốt 5 bậc duyệt + SLA, bật SMTP, chốt ma trận phân quyền, và diễn tập 1 phiếu thật (Giai đoạn A). Khuyến nghị **không mở** 25 màn workspace phòng ban mỏng trong bản go-live để tránh trải nghiệm rỗng.

**Đề xuất hành động ngay**: bắt đầu A1–A2 (dữ liệu + cấu hình duyệt) song song A3 (SMTP) — đây là 3 việc có thể hoàn tất trong 1–2 tuần và quyết định 80% thành công go-live.
