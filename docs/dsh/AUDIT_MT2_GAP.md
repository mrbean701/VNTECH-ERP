# AUDIT MT2 — GAP ANALYSIS (MT2-000) — VNTECH ERP V5.3.0

> Ngày: 21/09/2026 · Task: **MT2-000** (AUDIT & GAP ANALYSIS) · Trạng thái: IN_PROGRESS
> Căn cứ: `docs/dsh/MASTER_TASK_2.md` + `docs/dsh/GOAL_MASTER_TASK_2.md` (§2 — CẤM code trước audit)
> ⛔ NO COMMIT · NO PUSH · NO FAKE DATA

---

# 1. NỀN TẢNG **ĐÃ CÓ SẴN** *(MT2 §15 REUSE_EXISTING_LOGIC — PHẢI TÁI DÙNG, KHÔNG TẠO LẠI)*

## 1.1. Cơ sở dữ liệu — bảng liên quan MT2 (đo bằng `SHOW TABLES`)
| Nhóm MT2 | Bảng **đã có** |
|---|---|
| **Notification** | `task_notifications` ✔ · `approval_email_recipients` ✔ |
| **SLA / quá hạn** | `task_sla_policies` ✔ · `approvals.due_at` ✔ |
| **Cấp phát** | `procurement_allocations` ✔ |
| **Hoàn trả** | `central_returns` + `central_return_items` ✔ · `material_returns` + `material_return_items` ✔ |
| **Nhà cung cấp** | `suppliers` ✔ |
| **Tổ đội** | `teams` ✔ · `team_members` ✔ · `team_subcontracts` ✔ · `team_payments` ✔ |
| **Workflow / duyệt** | `workflow_definitions` ✔ · `workflow_steps` ✔ · `workflow_step_approvers` ✔ · `approval_stage_catalog` ✔ · `approval_project_assignments` ✔ · `approval_stage_decisions` ✔ · `approvals` ✔ · `supply_workflow_steps` ✔ |
| **Vật tư gốc** | `materials` ✔ · `material_categories` ✔ · `material_subcategories` ✔ · `material_aliases` ✔ · `material_norms` ✔ · `material_uom_conversions` ✔ · `material_external_codes` ✔ · `material_code_history` ✔ |
| **Kho / xuất kho** | `stock_issues` ✔ · `stock_issue_items` ✔ |
| **Người dùng / phạm vi** | `users` ✔ · `user_module_permissions` ✔ · `user_project_scopes` ✔ · `user_warehouse_scopes` ✔ |

## 1.2. Mã Java đã có *(đếm tệp có nhắc)*
```
SLA / Sla   : **25 tệp** ✔   (có cả worker quét định kỳ — đã thấy log "SLA worker: … BCH chờ xác nhận")
Notification:  **9 tệp** ✔
Overdue     :  **4 tệp** ✔
Signature   :  **0 tệp** ❌   → MT2 §13.4 (chữ ký user) PHẢI LÀM MỚI
SupplierMaterial: **0 tệp** ❌ → MT2 §6.3/6.4 (tab vật tư NCC + auto-detect) PHẢI LÀM MỚI
```

## 1.3. Cột đã có trong 2 bảng trọng tâm
```
approvals : stage ✔ · approver_user_id ✔ · status ✔ · **due_at ✔ (SLA)** · comment ✔
users     : employee_code ✔ (mã user — MT2 §13.3 "user chưa có mã" ⇒ đã có cột, cần audit DỮ LIỆU)
            created_at ✔ (MT2 §13 audit Created At) · avatar_url ✔ · system_level_code ✔ (chức vụ/cấp — MT2 §3.2 phân cấp)
```

---

# 2. **CHƯA CÓ** — PHẢI LÀM MỚI *(có thể cần migration + API + service + UI)*

| MT2 | Thiếu gì | Ghi chú |
|---|---|---|
| §4.4 SLA quá hạn | **`overdue_reason`** · **`expired_flag`** · **`overdue_duration`** (hiện chỉ có `due_at` + `status`) | migration an toàn (ADD COLUMN) · phải đủ để tính `total overdue approvals` |
| §4.4 | **Validate backend**: chặn submit khi `SLA expired + reason empty` | hiện chưa có |
| §13.4 Chữ ký | **cột chữ ký** trên `users` + upload 1 ảnh + thay ảnh cũ + API | `avatar_url` KHÁC chữ ký — ⛔ không dùng chung |
| §6.3/6.4 Vật tư NCC | **bảng liên kết NCC ↔ vật tư** + API + auto-detect hỏi user khi tạo PO | hiện **0** tệp Java nhắc |
| §13.1/13.2 Notification admin | tab Thông báo (CRUD + recipient targeting user/nhiều user/phòng ban/dự án/toàn bộ + hẹn giờ + thời gian kết thúc Web) | `task_notifications` có sẵn nhưng cần audit cột có đủ recipient/active-period chưa |
| §14 Web notification | modal khi đăng nhập + “không nhắc lại hôm nay” + lưu theo `userID + notificationID` + đánh dấu đã đọc theo user | cần bảng trạng thái đọc theo user |
| §15 Email notification | notification **engine** theo event + `Notification Rule` + `Recipient Resolver` + log | 9 tệp Java nhắc Notification — cần audit xem đã đủ kiến trúc chưa |
| §7.4 Tạo phiếu nhập từ STO/phiếu xuất | luồng tự fill kho đi/kho đến + upload ảnh + chứng chỉ | cần audit `goods_receipts` ⇄ `stock_issues` |
| §7.6 Cấp phát-Hoàn trả (menu mới, 2 tab) | UI/list/tab + data foundation | bảng đã có (`procurement_allocations`, `central_returns`) ⇒ **tái dùng**, ⛔ không tạo bảng trùng |

---

# 3. GHI CHÚ AUDIT FRONTEND

- `lib/ui-shared.tsx` (384 dòng) — **grep `export function|export const` = 0** ⇒ file dùng kiểu export khác ⇒ **PHẢI đọc lại** để lập danh mục **component dùng chung** (MT2 §22–24 yêu cầu dùng shared component thay vì layout riêng).
- `app/page.tsx` 2.780 dòng chứa **205 dấu hiệu logic nghiệp vụ** ⇒ liên quan trực tiếp MT2 §17 “backend là enforcement layer” + chỉ đạo kiến trúc “frontend chỉ render”.

---

# 4. PHÁT HIỆN AUDIT SÂU *(đợt 2)*

## 4.1. `task_notifications` — **KHÔNG đủ** cho MT2 §13.2/§45/§48 ✗
```
Cột hiện có: id · work_item_id · user_id · channel · title · body · status · read_at · sent_at · last_error · created_at · updated_at
⇒ Đây là HÀNG ĐỢI thông báo gắn với CÔNG VIỆC (work_item_id), KHÔNG phải "cấu hình thông báo" mà MT2 yêu cầu.
MT2 §45 cần: Loại (Web/Email) · Tên · Mã · Nội dung · NGƯỜI NHẬN (user đơn / nhiều user / phòng ban / dự án / toàn bộ)
             · THỜI GIAN GỬI · THỜI GIAN KẾT THÚC (Web)   ⇒ **THIẾU toàn bộ nhóm này** ✗
MT2 §48 cần trạng thái "KHÔNG NHẮC LẠI HÔM NAY" theo **userID + notificationID**  ⇒ **THIẾU** ✗
⇒ Kết luận: cần BẢNG MỚI cho notification campaign/config + bảng trạng thái theo user
   (⛔ KHÔNG sửa/xoá `task_notifications` — nó phục vụ luồng công việc hiện có)
```

## 4.2. `task_sla_policies` — **CÓ SẴN `requires_reason`** ✔ *(tái dùng cho MT2 §4.4)*
```
Cột: department_code · status · responsibility_clock_runs · process_clock_runs · **requires_reason ✔** · updated_at
⇒ MT2 §4.4 "SLA quá hạn ⇒ vẫn cho duyệt nhưng BẮT BUỘC nhập lý do" ⇒ **đã có cờ `requires_reason`** ⇒ REUSE ✔
⚠️ Nhưng KHÔNG thấy cột THỜI LƯỢNG SLA (số giờ/ngày) ⇒ cần audit tiếp xem quy định SLA nằm ở đâu ✗
```

## 4.3. PHÂN CẤP CHỨC VỤ **ĐÃ TỒN TẠI** ✔ *(nền cho MT2 §3.2)*
```
users.system_level_code hiện có: nhan_vien (3) · truong_nhom (3) · truong_phong (3) · tong_giam_doc (1) · giam_doc (1) · **(trống) 2**
⇒ Thứ bậc: nhan_vien < truong_nhom < truong_phong < giam_doc < tong_giam_doc  ⇒ MT2 §3.2 (trưởng phòng trở lên /
   phó giám đốc trở lên) XÂY TRÊN NỀN NÀY được ✔ · bảng danh mục `system_level_catalog` ✔ đã có
⚠️ 2 ĐIỂM CẦN CHÚ Ý:
   ① KHÔNG có cấp **`pho_giam_doc`** ⇒ MT2 §3.2 nói "phó giám đốc trở lên" ⇒ cần quyết: thêm cấp này vào
      `system_level_catalog` (thay đổi DỮ LIỆU/DANH MỤC) hay quy ước "từ giam_doc trở lên" ✗ ⇒ **sẽ hỏi user khi tới task đó**
   ② **2 user có system_level_code TRỐNG** ✗ ⇒ liên quan MT2 §13.3 (user thiếu mã/định danh) ⇒ phải audit dữ liệu
```

## 4.4. MÔ HÌNH QUYỀN **ĐÃ PHONG PHÚ** ✔ *(MT2 §16/§52 phải REUSE)*
```
system_level_catalog ✔ · role_catalog ✔ · business_role_engine_catalog ✔ · business_role_group_catalog ✔
business_role_group_scopes ✔ · user_module_permissions ✔ · user_project_scopes ✔ · user_warehouse_scopes ✔
⇒ ⛔ KHÔNG tạo thêm cơ chế quyền mới — phải audit 5 bảng role/level này rồi mở rộng ĐÚNG chỗ
```

## 4.5. `lib/ui-shared.tsx` — **không phải nơi chứa component dùng chung** ✗
```
Nội dung thực tế: HẰNG SỐ + HÀM TIỆN ÍCH (defaultMenuGroups · roleNames · Intl.NumberFormat · projectPeriod ·
NAV_ICON_TYPE/TONE · DEPT_MODULE_GROUP · taskStatusLabel · WORK_STATUS_LABELS · PROJECT_STATUS_LABELS ·
initials · durationText · kpiIconName · APPROVAL_STAGE_LABELS · sanitizeUiText · normalizeBoqHeader · boqStatusLabel …)
⇒ Các COMPONENT dùng chung (CardHead · Kpi · DataTable · BaseModal · toolbar …) hiện **NẰM TRONG `app/page.tsx`** ✗
⇒ MT2 §22–24 ("dùng shared component, không tạo layout riêng") ⇒ PHẢI **TÁCH RA component dùng chung** trước khi
   làm các task UI, nếu không sẽ tiếp tục sinh layout riêng lệch ✗
```

---

# 5. BƯỚC AUDIT TIẾP THEO *(chưa xong MT2-000)*

```
① Đọc lại lib/ui-shared.tsx + liệt kê component dùng chung (toolbar · modal · table · card · tab · upload · toolbar ngang)
② Audit menu/router: cấu trúc menu hiện tại (MT2 §3.1 Công việc · §4.6 menu 1 cấp Trung tâm phê duyệt · §6.1 NCC xuống cuối)
③ Audit enum/state: PR status vs approval step (§6.9) · `issued` có phù hợp với PR không
④ Audit RBAC: module × capability · `system_level_code` (chức vụ) vs quyền (MT2 §3.2 · §4.1 · §16)
⑤ Audit `task_notifications` + `task_sla_policies` + 9 tệp Java Notification: đã đủ cho §13–15 chưa
⑥ Audit bootstrap ⇄ UI: trường nào thiếu cho các tab/dashboard MT2 yêu cầu
⑦ Lập TODO.md + TASK_INDEX_MT2.md + MASTER_STATUS_MT2.md + bảng GAP đầy đủ theo từng mục MT2
```
⇒ Sau đó chọn task đầu theo **priority MT2 §42** và bắt đầu implement (TODO tool + Telegram mỗi mốc).

---

# ĐỐI SOÁT «TODO RỖNG» — 23/09/2026 (GOAL §11: TODO EMPTY ≠ MASTER TASK COMPLETE)

**Bối cảnh**: sau `MT2-P1-03b`, danh sách task **hết TODO** (0 dòng). Theo GOAL §11, ⛔ KHÔNG được tuyên bố hoàn thành — phải **đọc lại MASTER TASK 2, đối chiếu yêu cầu ⇄ triển khai, tìm yêu cầu thiếu**.

## 1. Đối chiếu 14 PHASE ⇄ các mục của `MASTER_TASK_2.md` (đo bằng máy + đọc tay)

| Mục MASTER TASK 2 | Phase phụ trách | Kết luận |
|---|---|---|
| §3 (§3.1 Dashboard · §3.2 Giao việc & kiểm soát) | **PHASE 5** (4 dòng) + **PHASE 4** (RBAC phạm vi) | ✅ có task; P5-03/P5-04 **BLOCKED** chờ user chốt ngưỡng cấp bậc |
| §4 (§4.1–§4.6 Trung tâm phê duyệt) | **PHASE 6** (8 dòng) | ✅ **8/8 DONE** |
| §5 (§5.1–§5.3 Quản lý dự án) | **PHASE 7** (5 dòng) | ✅ 4 DONE + `P7-05` SKIPPED (§38) |
| §6 (§6.1–§6.13 Mua hàng & cung ứng) | **PHASE 8** (12 dòng) | ✅ 11 DONE + `P8-05` SKIPPED (§38) |
| §7 (§7.1–§7.6 Kho vật tư) | **PHASE 9** (9 dòng) | ✅ **9/9 DONE** |
| §8 Tổ đội · §10 Hành chính–Pháp chế | **PHASE 10** (6 dòng) | ✅ 5 DONE + `P10-05` **BLOCKED** (`BLK-04`) |
| §11 Báo cáo · §12 Danh mục vật tư gốc | **PHASE 11** (5 dòng) | ✅ 4 DONE + `P11-05` SKIPPED (§38) |
| §13 Quản trị hệ thống (§13.1–§13.4) | **PHASE 12** (7 dòng) | ✅ **7/7 DONE** |
| §14 Web notification · §15 Email notification (§15.1) | **PHASE 13** (6 dòng) | ✅ **6/6 DONE** |
| §16 RBAC · §17 Responsive/UI consistency · §18 Modal standard · §19 Data integrity · §1/§2/§6.5/§9/§12.3 (skip) | **PHASE 1 · 2 · 3 · 4** (32 dòng) | ✅ **8/8 · 9/9 · 9/9 · 4/4**; phần «tạm bỏ qua» ⛔ KHÔNG tạo task (đúng §38) |
| §20 Backward compatibility · §21 Testing · §22 Documentation · §24 Final acceptance · §25 Completion condition · §26 Absolute rules | **PHASE 14** (5 dòng) | ⏳ 3 DONE + `P14-03`/`P14-05` **BLOCKED** (final audit chạy sau khi gỡ blocker) |

⇒ **KẾT LUẬN ĐỐI SOÁT: ⛔ KHÔNG phát hiện yêu cầu nào của MASTER TASK 2 bị THIẾU TASK.** ⛔ Không tạo task giả để «lấp» danh sách.

## 2. ✅ CHỐT MẪU SỐ TIẾN ĐỘ = **99** (trước đây ghi 98 — MÂU THUẪN NỘI BỘ)

- Dải phase ở đầu `MT2_PHASE_TASK_LIST.md` tự nó cộng ra: 8+10+9+5+4+8+5+12+9+6+5+7+6+5 = **99**.
- Máy đếm số dòng thật `| MT2-…` = **99**.
- ⇒ Con số «98» là **số cũ còn sót**; đã sửa tiêu đề + công thức sang **x/99** (90/99 = **90,9 %**).
- Chênh theo phase: **P2 = 9 dòng (kế hoạch 10)** · **P3 = 10 dòng (kế hoạch 9, gồm `P3-06b`)** ⇒ bù trừ, tổng vẫn 99.

## 3. ✅ XOÁ «NỢ ĐỐI SOÁT PHASE 2»

Trước đây `MT2_EXECUTION_STATE.md` ghi «PHASE 2 = 7/8 (nợ đối soát)». Đếm máy hôm nay: **PHASE 2 có 9 dòng, TẤT CẢ DONE** (`P2-01 · P2-02 · P2-03 · P2-04 · P2-05 · P2-06 · P2-06b · P2-07 · P2-08`) ⇒ **PHASE 2 = 9/9 ✅**, ⛔ không còn nợ.

## 4. ⚠️ GHI CHÚ KỸ THUẬT CHO MÁY ĐẾM VỀ SAU

Script phân loại theo ô trạng thái cuối dòng xếp **2 dòng vào nhóm «KHÁC»**: **`P6-04`** và **`P11-03`** — ô trạng thái viết khác mẫu nhưng **cả hai đã DONE** ⇒ công thức đúng là **DONE 88 + KHÁC 2 = 90 DONE**.

## 5. CÒN LẠI ĐỂ HOÀN THÀNH MASTER TASK 2

| Nhóm | Nội dung | Trạng thái |
|---|---|---|
| 🔴 **BLOCKED (6)** | `P4-01` · `P5-03` · `P5-04` (ngưỡng «phó GĐ trở lên») · `P10-05` (`correspondence_id`) · `P14-03` (lệch schema license) · `P14-05` (final audit) | **chờ USER quyết** — đã nêu lựa chọn A/B cụ thể |
| ⏭️ SKIPPED (3) | `P7-05` · `P8-05` · `P11-05` | theo §38 — ⛔ không implement |
| ✅ DONE (90) | toàn bộ phần còn lại | có bằng chứng (contract/probe/bundle) |

⇒ **MASTER TASK 2 ⛔ CHƯA COMPLETE** — chỉ còn phụ thuộc **6 quyết định nghiệp vụ của user** (GOAL §13). ⛔ Không tự bịa ngưỡng/nghiệp vụ để «đóng» 6 mục này.

> ⚠️ **BẢNG TRÊN LÀ ẢNH CHỤP CŨ** — xem **§6** ngay dưới để có số hiện hành (đã đổi sau các đợt đính chính + đóng nợ test).

---

## 6. ĐỐI CHIẾU §-MỤC LẦN 2 (đo bằng MÁY) + ẢNH CHỤP TRẠNG THÁI 23/09/2026

### 6.1 — Máy quét: mọi đề mục của `MASTER_TASK_2.md` có được danh sách 100 task tham chiếu?
| Chỉ số | Số đo |
|---|---|
| Tổng đề mục nhận dạng (`#`/`##`/`###` có số) | **70** (27 mục cấp 1 + **43 mục cấp 2**) |
| Số hiệu `§` được nhắc trong `MT2_PHASE_TASK_LIST.md` | **77** số hiệu khác nhau |
| **Mục cấp 2 (`x.y`) ⛔ KHÔNG được nhắc** | **0 / 43** ✅ ⇒ **không bỏ sót đề mục nào** |
| Mục cấp 1 ⛔ không được nhắc | **5**: `§0 EXECUTION DIRECTIVE` · `§1 MUST IMPLEMENT` (2 mục **meta**) · `§18 MODAL STANDARD` · `§20 BACKWARD COMPATIBILITY` · `§21 TESTING` |

**Kết luận §6.1:** 3 mục còn lại (`§18` · `§20` · `§21`) là **LUẬT CHẤT LƯỢNG XUYÊN SUỐT**, ⛔ không phải tính năng — chúng được cưỡng chế bằng **cổng kiểm chứng** chứ ⛔ không bằng một dòng task:
- `§18 MODAL STANDARD` ⇒ contract `p2-08-modal-reuse-contract` · `ad03-user-detail-modal` · `pr04-entity-modal` · `p2-06b-lightbox-contract` + `BaseModal`/`EntityDetailModal` (`app/components/ui/`, 33 chỗ dùng).
- `§20 BACKWARD COMPATIBILITY` ⇒ regression **69/69** + **570 hợp đồng 0 FAIL** + `verify:master-baseline` (canonical CSS/markers) + migration backward-compatible (29 tệp V*, ⛔ không drop).
- `§21 TESTING` ⇒ toàn bộ hệ cổng: frontend 570 · Java **64/64** · DB 3 cổng · probe LIVE.
⇒ **Không phát hiện thiếu task.**

### 6.2 — Ảnh chụp trạng thái hiện hành (thay cho bảng cũ ở §5)
| Nhóm | Nội dung | Trạng thái |
|---|---|---|
| 🔴 **BLOCKED (5)** | `P4-01` · `P5-03` · `P5-04` (ngưỡng «phó GĐ trở lên») · `P10-05` (`correspondence_id`) · `P14-05` (final audit §52/§53) | **chờ USER quyết** — đã nêu lựa chọn A/B cụ thể |
| ⏭️ **SKIPPED (2)** | `P7-05` (logic đánh giá tiến độ) · `P11-05` (BOQ đối chiếu · soát trùng Alias) | theo **§38** — ⛔ không implement (đã ĐO LẠI 23/09: ⛔ 0 mã liên quan) |
| ✅ **DONE (93)** | phần còn lại | có bằng chứng chạy được |

> ✅ **ĐÍNH CHÍNH so với §5**: `P8-05` đã chuyển **SKIPPED ⇒ DONE** (lý do skip cũ «§6.5 Đối tác» là **SAI PHẠM VI**; deliverable là §6.3 Nhà cung cấp, đã có đủ đường: component 218 dòng · nút «Chi tiết» · 19/19 hợp đồng) · `P14-03` **DONE** (3 cổng DB xanh) ⇒ BLOCKED 6 → **5**.
> ✅ **NỢ CỔNG TEST CŨ ĐÃ ĐÓNG: 22 → 0** (`MT2_LEGACY_CONTRACT_TRIAGE.md`) · **bộ probe tĩnh + luồng live: 0 lỗi sản phẩm đang đỏ** (`MT2_GATE_SWEEP_23-09.md` §E–§H).
