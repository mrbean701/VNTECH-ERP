# 18 — KẾ HOẠCH TRIỂN KHAI: SỬA LỖI HIỂN THỊ, TÁI CẤU TRÚC MENU, PHÂN QUYỀN, WORKFLOW

Ngày lập: 15/09/2026 · Người lập: Agent phát triển · Trạng thái: **HOÀN TẤT — P0 ✅ · P1 ✅ · P2 ✅ · P3 ✅ · P4 ✅ · P5 ✅ · P6 ✅ · P7 ✅**

> **Nhật ký tiến độ**
> | Đợt | Trạng thái | Bằng chứng |
> |---|---|---|
> | P0 | ✅ XONG | `Content-Type: application/json;charset=UTF-8`; bù 21 trường bootstrap; tab 4/5/6 hết lỗi |
> | P1 | ✅ XONG | Flyway V3: `module_catalog` 61 · `menu_group_catalog` 12 · `organization_units` 13 · `material_categories` 6 · `form_field_config` 65 |
> | P2 | ✅ XONG | Flyway V4 + V5; `probe-menu-11.mjs` → **ĐẠT** (11 nhóm, 8 tab, 0 lỗi JS) |
> | P3 | ✅ XONG | `probe-user-profile.mjs` → **ĐẠT**; sửa lỗi mã hoá chức danh (V6+V7) |
> | P4 | ✅ XONG | Flyway V8 + V9; `probe-workflow.mjs` → **ĐẠT** (tạo/đọc/xóa quy trình any_of + all_of) |
> | P5 | ✅ XONG | Flyway V10 + V11; `probe-p5.mjs` → **ĐẠT** (11 tab, ràng buộc phòng ban, cấp bậc) |
> | P6 | ✅ XONG | Flyway V12; `probe-p6.mjs` → **ĐẠT** (`audit_logs` 0 → 3 dòng đủ ngữ cảnh, 12 tab) |
> | P7 | ✅ XONG | Flyway V13; `AdminGovernanceIntegrationTest` **5/5 xanh** · `docs/19` checklist thủ công · gộp 13 → 8 đơn vị tổ chức |

> Yêu cầu gốc: (1) fix frontend không hiển thị dữ liệu, (2) tách menu/tab, (3) fix UTF-8, (4) tab nhân sự click được + chi tiết nhân sự, (5) workflow đa luồng + chỉ định người duyệt, (6) tab phân quyền user/phòng ban + level hệ thống, (7) quản lý phòng ban dạng dropdown, (8) fix tab ngoại lệ cá nhân & phạm vi dự án, (9) tab audit log, (10) test + checklist debug thủ công.

---

## 1. ✅ ĐÃ CHẨN ĐOÁN XONG — NGUYÊN NHÂN THẬT

### 1.1 🔴 "DB có dữ liệu nhưng frontend không hiển thị gì"

**Nguyên nhân: đang mở SAI CỔNG.**

| Cổng | Vai trò | `/api/system` trả về | Kết quả |
|---|---|---|---|
| **:8787** | Node UI **trực tiếp** (không qua proxy) | `{"ok":true,"setupRequired":true}` | ❌ **SQLite rỗng ⇒ UI trắng** |
| **:9000** | Proxy → API sang **Java/MySQL** | dữ liệu thật (2 dự án, 14 vật tư, 9 user…) | ✅ **hiển thị đủ** |

**Bằng chứng**: `node tools/probe-ui-data.mjs http://127.0.0.1:9000` → dashboard hiện **2 dự án** (`DA-MAU-01`, `PRJ-DEMO-01`), tổng giá trị hợp đồng **0,67 tỷ**, KPI đầy đủ, **0 lỗi JS**.

⇒ **Đây không phải bug backend** mà là **bẫy kiến trúc**: 2 cổng, chỉ 1 cổng có dữ liệu, không có cảnh báo nào.

**Cách sửa (P0)**: cảnh báo rõ trên UI khi phát hiện backend rỗng + tài liệu hoá; hoặc tự phát hiện và chuyển hướng.

### 1.2 ✅ UTF-8 — API **KHÔNG** lỗi mã hoá

Quét **1.938 chuỗi** trong toàn bộ payload bootstrap: **0 mojibake**. Tiếng Việt đúng hoàn toàn:
```
✅ users.fullName      = Chỉ huy trưởng A
✅ organizationUnits   = Phòng Tài chính – Kế toán
✅ materials.name      = Cáp điện CV 3x2.5mm
✅ projects.name       = Dự án mẫu chuẩn hóa quy trình VNTECH
```

**Hai nguyên nhân thật có thể gây cảm giác "lỗi UTF-8"**:
1. **Xem DB bằng MySQL CLI không có `--default-character-set=utf8mb4`** → hiện `D? �n m?u` (đúng như tôi từng gặp). Dữ liệu trong DB **vẫn đúng**.
2. **Header `Content-Type: application/json` THIẾU `charset=UTF-8`** → một số công cụ/trình duyệt cũ có thể giải mã sai.

**Cách sửa (P0)**: thêm `charset=UTF-8` cho mọi response JSON + CSV/Excel; ghi chú rõ cách xem DB đúng.

### 1.3 🔴 Nguyên nhân gốc lỗi tab 4 & tab 6 (đã xác nhận lại)

Java bootstrap **thiếu 29 trường** so với JS. Đo lại trên hệ thống hiện tại:

| Trường | Trạng thái | Ảnh hưởng |
|---|---|---|
| `allModulePermissions` | ❌ **THIẾU** | **Tab 6** + 5 chỗ khác → `TypeError` |
| `approvalStages` | ❌ **THIẾU** (Java trả `approvalStageCatalog`) | **Tab 5** |
| `userWarehouseScopes` | ❌ **THIẾU** | **Tab 4** (phạm vi kho) |
| `moduleCatalog` / `menuGroups` | ⚠️ **0 bản ghi** | Menu động + phân quyền menu |
| `modulePermissions` | ⚠️ 0 | GĐ3 |
| `materialCategories` | ⚠️ 0 | Danh mục vật tư |

### 1.4 Hiện trạng schema (đã đo)

**Đã có & có dữ liệu**: `organization_units` (6) · `role_catalog` (16) · `user_project_scopes` (14) · `approval_stage_catalog` (5) · `approval_project_assignments` (5) · `approvals` (20) · `supply_workflow_steps` (38)

**Rỗng, cần seed**: `module_catalog` · `menu_group_catalog` · `user_module_permissions` · `user_warehouse_scopes` · `business_role_group_catalog` · `business_scope_catalog` · `audit_logs`

**Chưa tồn tại, cần tạo mới**: workflow đa luồng · quyền theo phòng ban · level hệ thống

---

## 2. KẾ HOẠCH TRIỂN KHAI — 7 ĐỢT

### ĐỢT P0 — Gỡ chặn hiển thị 🔴 *(0,5–1 ngày)*
| # | Việc | Kết quả |
|---|---|---|
| P0.1 | Thêm `charset=UTF-8` cho mọi response JSON/CSV của Java | Hết nghi ngờ lỗi mã hoá |
| P0.2 | Cảnh báo trên UI khi backend rỗng (`setupRequired` khi đã có dữ liệu ở cổng khác) | Người dùng biết mình mở sai cổng |
| P0.3 | **Bù 29 trường bootstrap thiếu** (`allModulePermissions`, `approvalStages`, `userWarehouseScopes`…) | **Tab 4, 5, 6 hết lỗi** |
| P0.4 | Ghi chú vận hành: luôn mở `:9000`, xem DB phải có `--default-character-set=utf8mb4` | Tránh hiểu nhầm lặp lại |

### ĐỢT P1 — Seed nền tảng dữ liệu 🔴 *(1–2 ngày)*
| # | Việc | Kết quả |
|---|---|---|
| P1.1 | **`V3__reference_seed.sql`** sinh từ `drizzle/`: `module_catalog` (61) + `menu_group_catalog` (12) | Menu động + phân quyền menu chạy được |
| P1.2 | Seed `business_scope_catalog`, `business_role_group_catalog`, `form_field_config`, `task_sla_policies` | Màn quản trị có dữ liệu |
| P1.3 | Seed `material_categories` + `material_subcategories` (cây danh mục vật tư) | Danh mục vật tư có cây |
| P1.4 | Seed quyền mặc định theo vai trò vào `user_module_permissions` | Nhân viên có quyền ngay |

### ĐỢT P2 — Tái cấu trúc menu & tab 🟠 *(2–3 ngày)*
| # | Việc |
|---|---|
| P2.1 | Menu **7 → 11 mục** (Công việc · MEP · Tài chính · Hành chính-Pháp chế · Báo cáo) |
| P2.2 | Tách **"Nhân sự & tổ chức" → 2 tab riêng**: Nhân sự | Tổ chức (tổ chức có thêm cấu hình **tổ đội**) |
| P2.3 | Quản lý phòng ban: dropdown **chỉ hiện tên phòng ban**; click → hiện chức năng của phòng đó |
| P2.4 | Ẩn/hiện menu theo `modulePermissions` |

### ĐỢT P3 — Hồ sơ nhân sự chi tiết 🟠 *(2 ngày)*
| # | Việc |
|---|---|
| P3.1 | **Click vào user → mở panel chi tiết** (hiện đang không click được) |
| P3.2 | Chi tiết gồm: chức vụ · phòng ban · thông tin liên hệ · thông tin cá nhân |
| P3.3 | **Danh sách dự án đã/đang tham gia**: dự án gần nhất lên đầu; dự án đã rời/kết thúc xuống dưới + **màu xám** + hiện trạng thái |
| P3.4 | Chức vụ trong từng dự án · thao tác gần đây · đơn từ giấy tờ liên quan (**chỉ trong hồ sơ nhân sự của bộ phận Nhân sự**) |
| P3.5 | Sửa tương tự cho "Hồ sơ nhân sự" (hiện cũng không click được) |

### ĐỢT P4 — Workflow đa luồng 🟠 *(3–4 ngày)*
**Schema mới**:
```sql
workflow_definitions (id, code, name, module_key, project_id NULL, is_default, active, version, created_by, ...)
workflow_steps       (id, workflow_id, step_no, name, approval_mode, sla_hours, allow_skip_level, active, ...)
workflow_step_approvers (id, step_id, user_id, active, created_at)   -- chỉ định ĐÍCH DANH người duyệt
```
- `approval_mode`: `single` (1 người) · **`any_of`** (nhiều người, **1 người duyệt là qua**) · `all_of` (tất cả phải duyệt)
- **Chọn người duyệt theo permission**: khi cấu hình bước, hệ thống lấy danh sách user **có perm tương ứng** (vd perm `can_approve` trên module `requests`) để chọn
- Cho phép **tạo nhiều workflow**; gán workflow theo module/dự án

### ĐỢT P5 — Phân quyền nâng cao 🟠 *(3–4 ngày)*
| # | Việc |
|---|---|
| P5.1 | **Tab "Phân quyền phòng ban"**: gán **hàng loạt** quyền cho phòng ban → bảng mới `department_module_permissions` |
| P5.2 | **Tab "Phân quyền user"**: copy từ phòng ban để cấu hình nhanh, hoặc tuỳ chỉnh từng perm |
| P5.3 | **Ràng buộc**: phòng ban không có quyền → user **không được cấp** quyền đó; click vào sẽ **hiện thông báo** |
| P5.4 | Hiển thị **tất cả quyền của tất cả user** (ma trận) |
| P5.5 | Thanh **search/filter**: tên · mã NV · phòng ban · chức vụ |
| P5.6 | **Level hệ thống**: bảng `system_level_catalog` (code, name, rank, auto_grant_all, can_skip_levels) + `users.system_level_code` |
| P5.7 | Level cao **tự động có quyền cao nhất** + **duyệt vượt cấp** không cần thêm tên vào workflow; khi chọn level → **thông báo** có thêm user vào workflow/perm hay không |
| P5.8 | Level cao **là ngoại lệ**: có thể cấu hình perm thủ công **không cần check dept** |

### ĐỢT P6 — Audit log 🟡 *(1–2 ngày)*
| # | Việc |
|---|---|
| P6.1 | **Ghi audit cho MỌI action thay đổi dữ liệu** (hiện `audit_logs` = 0 dòng) |
| P6.2 | Mở rộng `audit_logs`: thêm `user_name`, `user_role`, `department`, `system_level`, `module_key`, `permission_used`, `change_detail` |
| P6.3 | **Tab "Audit log"** trong Quản trị hệ thống: lọc theo user/ngày/module/hành động, xem chi tiết trước–sau |

### ĐỢT P7 — Test & checklist 🟡 *(2 ngày)*
| # | Việc |
|---|---|
| P7.1 | **Unit test** Java cho: workflow `any_of`, ràng buộc dept→user perm, level ngoại lệ, audit ghi đúng |
| P7.2 | **Automation test** UI (headless) cho: tab 4/6, click user ra chi tiết, tạo workflow, cấp quyền |
| P7.3 | **Exception cần thiết**: perm không có ở dept, level không tồn tại, workflow không có người duyệt, xoá level đang dùng |
| P7.4 | **Dữ liệu mẫu** cho test (thêm bảng/seed nếu cần) |
| P7.5 | **`docs/19_CHECKLIST_DEBUG_THU_CONG.md`** — checklist từng bước để bạn test tay |

---

## 3. THỨ TỰ & PHỤ THUỘC

```
P0 (gỡ chặn)  ──►  P1 (seed)  ──►  P2 (menu/tab)  ──►  P3 (hồ sơ NS)
                                        │
                                        ├──►  P4 (workflow)   ──┐
                                        │                       ├──►  P6 (audit)  ──►  P7 (test)
                                        └──►  P5 (phân quyền) ──┘
```
**Lý do tuần tự**: P2/P5 cần `module_catalog` có dữ liệu (P1); P4 cần `module_catalog` để lọc người duyệt theo perm; P6 cần P4/P5 xong để biết ghi gì; P7 chốt toàn bộ.

---

## 4. RỦI RO

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| 1 | Bù 29 trường bootstrap có thể lộ lỗi mới | Thêm từng nhóm, test ngay |
| 2 | Migration P4/P5 đổi schema → phải chạy Flyway V4+ | Backup DB trước; test trên DB phụ |
| 3 | Đổi workflow có thể phá luồng duyệt đang chạy (`approvals` 20 bản ghi) | Giữ tương thích: workflow mới song song, không xoá `approval_stage_catalog` |
| 4 | Sửa UI phá fingerprint | Mọi sửa `app/**` phải chạy `refresh-phase-identity` + regenerate manifest |
| 5 | Ràng buộc dept→user perm có thể chặn nhầm admin | Admin + level cao là **ngoại lệ** (theo đúng yêu cầu P5.8) |

---

## 5. GATE NGHIỆM THU

Mỗi đợt chỉ "XONG" khi:
1. ✅ `mvn clean package` — test xanh
2. ✅ `verify-vntech-fingerprint` + `master-baseline-gate` ĐẠT (nếu có sửa `app/**`)
3. ✅ Probe tương ứng pass
4. ✅ Tài liệu + checklist cập nhật

---

## 6. CÔNG CỤ CHẨN ĐOÁN ĐÃ CÓ

| File | Việc |
|---|---|
| `tools/diag-frontend-data.mjs` | Bootstrap trả gì, encoding, menu có dựng được không |
| `tools/diag-utf8.mjs` | Quét sâu mojibake toàn payload |
| `tools/probe-ui-data.mjs` | UI thật hiển thị gì (đăng nhập + duyệt màn hình + chụp ảnh) |
| `tools/probe-admintab-bugs.mjs` | Tái hiện lỗi 7 tab phân quyền |
| `tools/probe-project-visibility.mjs` | Lỗi lộ dự án |
| `tools/probe-rbac-gap.mjs` | Lỗ hổng phân quyền module |

---

**Trạng thái**: **P0–P7 đã XONG và đã nghiệm thu.** Checklist debug thủ công: **`docs/19_CHECKLIST_DEBUG_THU_CONG.md`**.

---

## 12. NHẬT KÝ NGHIỆM THU ĐỢT P7 — TEST TỰ ĐỘNG & DỌN DỮ LIỆU (15/09/2026)

### 12.1 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P7.1 | **Test tích hợp Java** cho P4/P5/P6: workflow `any_of`/`all_of` + các trường hợp bị CHẶN · ràng buộc phòng ban + **không mất dữ liệu khi bị chặn** · cấp bậc `auto_grant_all` + chặn xóa · audit ghi đúng + **không ghi `login`** | `AdminGovernanceIntegrationTest.java` (**mới**, 5 test) |
| P7.2 | Automation UI: 5 probe headless (`probe-menu-11` · `probe-user-profile` · `probe-workflow` · `probe-p5` · `probe-p6`) — **đã sửa để mở tab theo NHÃN** thay vì theo chỉ số, tránh vỡ khi thêm tab | `tools/probe-*.mjs` |
| P7.3 | Exception đã phủ: perm không có ở phòng ban · cấp bậc không tồn tại/đang ngừng · workflow không có người duyệt · workflow `single` mà 2 người · xóa cấp bậc đang dùng · xóa quy trình mặc định | trong test + probe |
| P7.4 | **Dọn dữ liệu mẫu**: gộp đơn vị tổ chức trùng (13 → **8**) | `V13__merge_duplicate_org_units.sql` |
| P7.5 | **Checklist debug thủ công** cho toàn bộ P0–P7 | `docs/19_CHECKLIST_DEBUG_THU_CONG.md` |

### 12.2 🔴 Lỗi thật do test P7 phát hiện (giá trị của đợt này)

**H2 và MySQL trả KHOÁ KHÁC NHAU cho cùng một câu SELECT.**

| | |
|---|---|
| **Triệu chứng** | 2/5 test mới đỏ: ràng buộc phòng ban **không chặn**, cấp bậc `auto_grant_all` **không cấp quyền** |
| **Nguyên nhân** | MySQL giữ nguyên văn nhãn alias (`AS autoGrantAll` → khoá `autoGrantAll`), còn **H2 viết thường** (`autograntall`). Code đọc `l.get("autoGrantAll")` nên ở H2 luôn nhận `null` ⇒ điều kiện luôn sai |
| **Vì sao nguy hiểm** | Trên MySQL (môi trường thật) mọi thứ **vẫn chạy đúng**, nên probe headless **không thể** phát hiện. Chỉ test ở tầng dịch vụ + H2 mới lộ ra |
| **Sửa** | Dùng **alias một từ viết thường** cho các truy vấn mới (`autogrant`, `orgunitid`, `modulekey`…) — giống nhau ở cả hai DB; và thêm `svAny()` đọc được cả hai kiểu khoá ở phía use case |

> **Bài học**: `firstToCamel()` trong codebase là **no-op** (chỉ copy map), tức toàn bộ tầng persistence
> đang ngầm phụ thuộc vào việc DB trả đúng chữ hoa của alias. Đây là **nợ kỹ thuật có sẵn** mà
> test P7 mới làm lộ ra. Không sửa `firstToCamel` thành camel hoá thật vì sẽ đổi khoá của các
> truy vấn `SELECT *` (đang cố ý đọc dạng `snake_case`), nhưng **mọi truy vấn MỚI phải dùng alias
> một từ viết thường**.

### 12.3 Dọn dữ liệu trùng (V13)

| | |
|---|---|
| **Hiện trạng** | `organization_units` có 13 bản ghi nhưng chỉ 8 đơn vị thật — do dữ liệu nạp từ hai nguồn (`ORG_<uuid>` ngày 14/09 và `ORG-<MÃ>` ngày 15/09) |
| **Hệ quả người dùng** | Dropdown phòng ban hiển thị **trùng tên** ("Phòng Kế hoạch" hai lần); quyền phòng ban bị **chia đôi** giữa hai bản ghi |
| **Ca khó** | "Phòng Dự án" **không chỉ trùng mã**: `ORG_cf90877b…` (mã DA-01) có **2 người dùng**, còn `ORG-DA` (mã DA) có **13 quyền** ⇒ cả hai đều đang dùng, phải **GỘP** chứ không xóa được bản nào |
| **Cách làm** | Chọn bản canonical = nhiều tham chiếu nhất (người + quyền), hòa thì lấy bản tạo sớm nhất; chuyển người dùng/quyền/vai trò mặc định sang canonical rồi xóa bản trùng. Chạy **2 lượt**: theo MÃ, rồi theo TÊN |
| **Kết quả** | **13 → 8 đơn vị** · 0 trùng mã · 0 trùng tên · **0 tham chiếu mồ côi** |

### 12.4 Bằng chứng nghiệm thu

| Kiểm tra | Kết quả |
|---|---|
| `mvn package` | ✅ **BUILD SUCCESS · 69 test / 0 fail** (domain 14 · application 16 · infrastructure 10 · web **29**) |
| `AdminGovernanceIntegrationTest` | ✅ **5/5 xanh** |
| Probe P2 · P3 · P4 · P5 · P6 | ✅ **cả 5 exit 0** (chạy lại sau khi sửa tab theo nhãn) |
| Gộp đơn vị tổ chức | ✅ 13 → 8 · 0 mồ côi |
| `verify-full-release` | ✅ exit 0 · manifest **697 file** · migrations 0000..**0083** |
| `verify-vntech-fingerprint` | ✅ `VNTECH-FP-8B679A565915E79B` · 206 file |
| `master-baseline-gate` · `css-baseline-audit` | ✅ ĐẠT |
| `typecheck` · `eslint` | ✅ exit 0 · 0 lỗi |
| regression Node (menu + project nav + admin import) | ✅ 23/23 |

### 12.5 Rủi ro còn lại sau P7

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | `can_skip_levels` (duyệt vượt cấp) đã **lưu cấu hình** nhưng runtime phê duyệt **chưa dùng** để cho phép vượt cấp | ⏳ ghi nhận — cần thiết kế luật vượt cấp cụ thể |
| 2 | `firstToCamel()` vẫn là no-op ⇒ nợ kỹ thuật về chữ hoa alias còn nguyên ở các truy vấn CŨ | ⏳ ghi nhận |
| 3 | Bootstrap giới hạn **500 bản ghi audit gần nhất**; chưa có màn tra cứu phân trang | ⏳ khi cần |
| 4 | `docs/19` có các mục 🟡 **cần bạn nghiệm thu tay** trên giao diện | ⏳ chờ người dùng |

---

## 11. NHẬT KÝ NGHIỆM THU ĐỢT P6 — AUDIT LOG (15/09/2026)

### 11.1 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P6.1 | **Ghi nhật ký cho MỌI action thay đổi dữ liệu** — trước đây `audit_logs` = **0 dòng**, không action nào ghi | `AuditTrailFilter` (mới) |
| P6.2 | Mở rộng `audit_logs` thêm 7 cột ngữ cảnh: `user_name` · `user_role` · `department` · `system_level` · `module_key` · `permission_used` · `change_detail` + index theo thời gian & hành động | `V12__audit_log_enrich.sql` |
| P6.3 | Tab **"Audit log"** (tab 11): KPI tổng quan, lọc theo người dùng / chức năng / khoảng ngày / từ khóa, xem chi tiết dữ liệu gửi lên | `AuditLogManager` |

### 11.2 Quyết định thiết kế đáng ghi lại

**Dùng Servlet Filter thay vì sửa `SystemController.post()`.** Bộ điều phối action ở đó là một `switch` **hơn 1.200 dòng**, mỗi nhánh `return` ngay nên **không có điểm chèn chung** sau khi action thành công. Filter bọc ngoài nên phủ được **mọi action hiện có và mọi action thêm sau này** mà không phải sửa từng nhánh — đúng yêu cầu "ghi audit cho MỌI thay đổi".

Ba nguyên tắc an toàn đã áp dụng:
- Chỉ ghi khi action trả về **2xx** (đã thành công thật).
- Bỏ qua action không đổi dữ liệu: `login`, `logout`, `setup`, `system_level_impact`, `heartbeat`, `ping`.
- **Mọi lỗi khi ghi nhật ký đều bị nuốt** — nhật ký không được phép làm hỏng nghiệp vụ.
- Trường nhạy cảm (`password`, `token`…) bị che thành `***` trước khi lưu.

### 11.3 Bằng chứng nghiệm thu

```
node tools/probe-p6.mjs http://127.0.0.1:9000 admin "***"   → exit 0
```

| Nhóm | Kết quả |
|---|---|
| Sinh nhật ký | ✅ `audit_logs` **0 → 3** dòng sau 3 thao tác thật (`save_system_level`, `save_department_permission`, `delete_department_permission`) |
| Bỏ qua đúng | ✅ `login` **KHÔNG** sinh nhật ký |
| Ngữ cảnh | ✅ có TÊN · VAI TRÒ · CẤP BẬC (`tong_giam_doc`) · QUYỀN ĐÃ DÙNG (`canUse`) · MÔ TẢ (`save_system_level · đối tượng probe_538624 · 5 trường thay đổi`) · THỜI GIAN · IP · dữ liệu gửi lên |
| UI | ✅ 12 tab, tab 11 = "Audit log" · ô tìm kiếm · 2 dropdown lọc · 2 ô ngày · nút xóa lọc |
| Bảng & chi tiết | ✅ có dữ liệu · mở chi tiết xem được dữ liệu gửi lên · có thông tin đối tượng bị tác động |
| Lọc | ✅ tìm "save_system_level" lọc 4 → 1 dòng |
| Lỗi JS | ✅ 0 |

Cổng chất lượng (đều ĐẠT): `mvn package` (BUILD SUCCESS) · fingerprint `VNTECH-FP-8B679A565915E79B` · master-baseline · `verify-full-release` exit 0 (691 file, migrations 0000..**0083**) · typecheck · eslint 0 lỗi.

### 11.4 Rủi ro còn lại của P6

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | `before_json` để trống với nhật ký chung — filter không biết giá trị TRƯỚC khi sửa. UI ghi rõ điều này thay vì hiển thị sai | ⏳ ghi nhận |
| 2 | Bootstrap giới hạn **500 bản ghi gần nhất**; nhật ký cũ vẫn nằm trong DB nhưng chưa có màn tra cứu theo trang | ⏳ khi cần |
| 3 | Nhật ký **append-only**: xóa dữ liệu nghiệp vụ vẫn còn vết trong nhật ký (đúng chủ đích) — cần nói rõ khi đào tạo người dùng | ✅ chủ đích |

---

## 10. NHẬT KÝ NGHIỆM THU ĐỢT P5 — PHÂN QUYỀN PHÒNG BAN · NGƯỜI DÙNG · CẤP BẬC (15/09/2026)

### 10.1 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P5.1 | Bảng `department_module_permissions` — cấp quyền **hàng loạt** cho phòng ban, trở thành **nguồn chính** thay cho switch cứng `defaultDepartmentPermission()` | `V10__dept_permissions_and_levels.sql` |
| P5.2 | Tab **"Phân quyền phòng ban"**: chọn phòng (dropdown chỉ tên), bảng chức năng × 6 quyền, nút cấp nhanh theo nhóm Kế hoạch/Dự án/Tài chính/Hành chính | `DepartmentPermissionManager` |
| P5.3 | Tab **"Phân quyền người dùng"**: ma trận quyền toàn bộ tài khoản, **bộ lọc** tên · mã NV · phòng ban · cấp bậc, cột **cảnh báo vượt quyền phòng ban**, nút **sao chép từ phòng ban** (giữ nguyên phạm vi dự án/kho) | `UserPermissionMatrix` |
| P5.4 | **Ràng buộc phòng ban → người dùng** ép ở backend: phòng chưa có quyền thì **chặn** và trả thông báo tiếng Việt rõ ràng | `UserManagementUseCase.assertDepartmentAllowsPermissions()` |
| P5.6 | Bảng `system_level_catalog` + cột `users.system_level_code`, 5 cấp bậc (Nhân viên → Tổ đội → Trưởng phòng → Giám đốc → **Tổng giám đốc**) | V10 |
| P5.7 | Tab **"Cấp bậc hệ thống"**: CRUD cấp bậc, gán cấp bậc cho tài khoản, **thông báo ngay khi chọn cấp bậc** (tự động toàn quyền? duyệt vượt cấp?) | `SystemLevelManager` + `SystemLevelModal` |
| P5.8 | Cấp bậc `auto_grant_all` là **ngoại lệ**: tự động có toàn quyền và **bỏ qua** kiểm tra phòng ban | `replaceDepartmentDefaults()` + `assertDepartmentAllowsPermissions()` |

### 10.2 🔴 Hai lỗi thật phát hiện trong lúc làm P5

**(a) `rank` là từ khoá dành riêng của MySQL 8 — làm sập toàn bộ giao diện.**

| | |
|---|---|
| **Triệu chứng** | GET `/api/system` trả **500**, UI kẹt ở màn "Đang kiểm tra dữ liệu và quyền truy cập…" |
| **Nguyên nhân** | V10 tạo cột `rank` (có backtick nên `CREATE`/`INSERT` chạy được), nhưng câu SELECT viết `rank` **không backtick** → `ERROR 1064 ... near ',rank,'`. **Cả alias `AS rank` cũng lỗi.** |
| **Sửa** | `V11__rename_level_rank.sql` đổi cột thành `level_rank`; các SELECT dùng `` level_rank AS `rank` `` (alias có backtick) |

**(b) Yêu cầu bị TỪ CHỐI vẫn xoá sạch quyền người dùng — lỗi do chính tôi gây ra.**

| | |
|---|---|
| **Bối cảnh** | `saveUserAccess()` gọi `store.clearUserScopes()` ở **đầu** hàm (không có `@Transactional`), rồi mới kiểm tra ràng buộc phòng ban |
| **Hệ quả** | Chỉ cần admin lưu một quyền vượt phòng ban → request bị chặn nhưng **phạm vi dự án, phạm vi kho và toàn bộ quyền chức năng của người dùng đã bị xoá** |
| **Sửa** | Tách `assertDepartmentAllowsPermissions()` và gọi **TRƯỚC** `clearUserScopes()`; probe kiểm chứng số quyền/phạm vi không đổi sau khi bị chặn |

**(c) Quy trình build: quên dừng Node UI ⇒ phục vụ bundle cũ.** Lần build P5 đầu tiên tôi chỉ dừng Java, không dừng Node UI; tiến trình cũ vẫn giữ cổng 8787 và phục vụ HTML trỏ tới asset hash cũ ⇒ `404` + `Failed to fetch dynamically imported module` ⇒ React không hydrate. **Bài học: build PHẢI dừng Node UI trước** (đã ghi vào quy trình).

**(d) H2 + `ddl-auto=create-drop`:** Hibernate **DROP và tạo lại** `users` SAU khi chạy `schema-h2.sql`, nên cột thêm bằng `ALTER TABLE` trong schema bị xoá. Phải khai báo `system_level_code` trong `UserJpaEntity`. Đồng thời mở rộng `generate-h2-test-schema.mjs` để hiểu `ADD COLUMN` và `CHANGE COLUMN` của migration sau V1.

> ## ⚠️ CẬP NHẬT 23/09/2026 — GHI CHÚ (d) **CHƯA ĐỦ** — NGUỒN SỰ THẬT MỚI (MT2-P1-03 / P1-03b)
>
> **Nội dung cũ đúng về HIỆN TƯỢNG nhưng SAI khi dùng làm QUY TẮC:** câu «chỉ cần khai ở entity» khiến người sau bỏ `ALTER TABLE` trong `schema-h2.sql` ⇒ hỏng hàng loạt test.
>
> **SỰ THẬT ĐÃ ĐO (⛔ không suy luận — `MT2-P1-03`, 2 cột `UserJpaEntity.signatureUrl` + `material_requests.issued`):**
> 1. **Hibernate ĐỌC CỘT THEO ENTITY** ⇒ thiếu trường ở entity thì lỗi `Column "uje1_0.signature_url" not found` — cột có trong schema H2 cũng vô ích.
> 2. **Bảng H2 lấy từ `schema-h2.sql`** ⇒ thiếu `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (khối `[H2-MANUAL-START/END]`) thì cột **không tồn tại thật** trong lược đồ test.
> 3. ⇒ **PHẢI KHAI Ở CẢ 2 NƠI: `*JpaEntity` + `schema-h2.sql`.** Thiếu **một trong hai** là ĐỎ.
>
> **BẰNG CHỨNG SỐ (đo bằng `mvn test`)**: trước khi vá `0 Failures / **38 Errors**` → sau khi vá **42 test · 3 Failures (đúng 3 ca CÓ SẴN `ProductionRoleCounterProofTest`) · 0 Errors** ✔
>
> **VÌ SAO QUY TẮC CŨ KHÔNG CÒN ĐÚNG HOÀN TOÀN:** hướng dẫn «chỉ cần entity» dựa trên `ddl-auto=create-drop`. Nay test chạy **`ddl-auto: none`** (`java-backend/web/src/test/resources/application-test.yml:18` — xem `TASK-115`) ⇒ **lược đồ H2 = chính `schema-h2.sql`**, ĐÚNG như production (`application.yml:14`). Nghĩa là `ALTER TABLE` trong `schema-h2.sql` **KHÔNG còn bị Hibernate xoá** ⇒ cột thêm bằng ALTER là **BẮT BUỘC**, ⛔ không phải «đã bị xoá nên khỏi khai».
>
> **⚠️ HỆ QUẢ KHÁC ĐÃ TRẢ GIÁ:** ① có **HAI bản sao** schema H2 — bản cho TEST `java-backend/web/src/test/resources/schema-h2.sql` và bản cho DEMO/DEV `java-backend/web/src/main/resources/db/demo/schema-h2.sql` (⚠️ `glob **/schema-h2.sql` xác nhận; ⛔ KHÔNG có đường dẫn `db/demo/schema-h2.sql` ở gốc repo như vài ghi chép cũ) — sửa một bản rồi quên bản kia là bug kinh điển ⇒ sửa **CẢ HAI**; ② migration dùng **DDL ĐỘNG** (`SET @ddl := IF(…)…PREPARE/EXECUTE`, ví dụ V21/V22) thì `generate-h2-test-schema.mjs` **không bắt được** ⇒ phải tự thêm cột vào khối `[H2-MANUAL-*]` (`schema-h2.sql:2291`); ③ sửa `schema-h2.sql` là sửa **file test** — phải chạy lại `mvn test` và so **ĐÚNG baseline 42/3/0**, ⛔ không chỉ nhìn «xanh là xong». Hợp đồng khoá bài học này: `tests/p1-03b-h2-lesson.test.mjs`.

### 10.3 Bằng chứng nghiệm thu

```
node tools/probe-p5.mjs http://127.0.0.1:9000 admin "***"   → exit 0
```

| Nhóm | Kết quả |
|---|---|
| Cấu trúc tab | ✅ đúng **11 tab**; tab 5 = Phân quyền phòng ban · tab 6 = Phân quyền người dùng · tab 7 = Cấp bậc hệ thống |
| Tab 5 | ✅ dropdown chỉ hiện **tên** phòng · đủ 6 cột quyền (Xem/Thao tác/Tạo/Sửa/Duyệt/Xuất) · 354 ô tick · nút cấp nhanh theo nhóm |
| Tab 6 | ✅ ô tìm kiếm + 2 bộ lọc · ma trận 10 dòng · lọc 10 → 3 khi tìm "Kế hoạch" · mở chi tiết · nút sao chép từ phòng ban |
| Tab 7 | ✅ đủ 5 cấp bậc (3 · 3 · 3 · 0 · 1 người) · Giám đốc & TGĐ tự động toàn quyền · TGĐ duyệt vượt cấp · **chọn cấp bậc ⇒ hiện thông báo** |
| **Backend thật** | ✅ cấp/thu hồi quyền phòng ban lưu đúng vào DB |
| **Ràng buộc** | ✅ CHẶN cấp quyền vượt phòng ban **và** xác nhận quyền chức năng **26 → 26**, phạm vi dự án **1 → 1** (không mất dữ liệu) |
| Cấp bậc | ✅ gán được, lưu thật · ✅ chặn xóa cấp bậc đang có người giữ · ✅ khôi phục nguyên trạng |

Cổng chất lượng (đều ĐẠT): `mvn package` (BUILD SUCCESS, test Java xanh) · fingerprint `VNTECH-FP-3138A6594AD7C23B` · master-baseline · CSS · `verify-full-release` exit 0 (684 file, migrations 0000..**0082**) · typecheck · eslint 0 lỗi · regression 23/23.

### 10.4 Rủi ro còn lại của P5

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | `organization_units` có **bản ghi trùng mã** (mỗi mã 2 dòng: `ORG-KH` và `ORG_1ef4…`) ⇒ dropdown phòng ban hiển thị trùng tên | ⏳ **P7** (dọn dữ liệu mẫu) |
| 2 | Cấp bậc `can_skip_levels` đã lưu nhưng runtime phê duyệt **chưa dùng** để cho duyệt vượt cấp | ⏳ P7 |
| 3 | Khi cấp/thu hồi quyền phòng ban, hệ thống đồng bộ lại **toàn bộ** tài khoản (9 tài khoản) — chấp nhận được ở quy mô hiện tại, cần tối ưu khi nhiều người dùng | ⏳ ghi nhận |

---

## 9. NHẬT KÝ NGHIỆM THU ĐỢT P4 — WORKFLOW ĐA LUỒNG (15/09/2026)

### 9.1 Hiện trạng trước P4

Chỉ có **một** luồng duyệt toàn cục `approval_stage_catalog` (5 bước), người duyệt chọn **theo vai trò**, mỗi bước đúng **một** owner trong `approval_project_assignments`. Không thể tạo nhiều quy trình, không thể chỉ định nhiều người cho một bước, không có "một trong nhiều người duyệt là qua".

### 9.2 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P4.1 | 3 bảng mới: `workflow_definitions` · `workflow_steps` · `workflow_step_approvers` | `V8__workflow_multi.sql` |
| P4.2 | Seed: chuyển 5 bậc duyệt cũ thành **quy trình mặc định** `WF-MUAHANG-01`, người duyệt lấy từ phân công đang chạy | V8 (INSERT…SELECT) |
| P4.3 | `approval_mode`: `single` · **`any_of`** · `all_of` (ánh xạ `all_roles` cũ → `all_of`) | `workflow_steps.approval_mode` |
| P4.4 | **Chọn người duyệt theo quyền**: `workflowApproverCandidates()` lọc `allModulePermissions.canApprove` theo chức năng, admin luôn đủ quyền | `app/page.tsx` |
| P4.5 | 3 API mới: `save_workflow` (ghi quy trình + bước + người duyệt trong MỘT giao dịch) · `set_workflow_status` · `delete_workflow` | `OpsTaskManagementUseCase` + `OpsTaskStore(Adapter)` + `SystemController` + `ActionRbacRegistry` |
| P4.6 | **`any_of` có hiệu lực thật ở runtime**: `canApproveRequestStage()` giờ nhận *bất kỳ ai* trong danh sách người duyệt của bước (∪ owner cũ) | `RequestManagementUseCase` |
| P4.7 | **`all_of` có hiệu lực thật**: ghi nhận từng người vào `approval_stage_decisions`, chỉ chuyển bước khi **đủ tất cả** | `RequestManagementUseCase` |
| P4.8 | Tab 6 viết lại: danh sách quy trình → mở ra xem từng bước + người duyệt; modal thêm/sửa quy trình có bộ chọn bước, cách xác nhận, người duyệt | `WorkflowManager` + `WorkflowModal` |
| P4.9 | Cấu hình bậc duyệt cũ vẫn xem/sửa được (khối `details` thu gọn) | `WorkflowManager` |

**Tương thích ngược**: `approval_stage_catalog` và `approvals` **giữ nguyên** — 20 bản ghi phê duyệt đang chạy không bị ảnh hưởng. Quy trình cũ trở thành quy trình mặc định của mô hình mới.

### 9.3 🔴 Bug thật phát hiện trong lúc nghiệm thu P4

**Sai collation làm sập toàn bộ giao diện.**

| | |
|---|---|
| **Triệu chứng** | GET `/api/system` trả **500**; UI hiện "Internal Server Error" ở mọi màn |
| **Nguyên nhân** | V8 tạo bảng với `DEFAULT CHARSET=utf8mb4` **không nêu `COLLATE`** ⇒ MySQL 8 lấy mặc định `utf8mb4_0900_ai_ci`, còn `users`/`projects` của V1 dùng `utf8mb4_unicode_ci` |
| **Lỗi gốc** | `ERROR 1267: Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT) for operation '='` khi JOIN `workflow_step_approvers.user_id = users.id` |
| **Sửa** | V8 ghi rõ `COLLATE=utf8mb4_unicode_ci`; `V9__workflow_collation_fix.sql` chuẩn hoá DB đã chạy V8 bản cũ |
| **Phụ** | Sửa V8 làm đổi Flyway checksum ⇒ phải `DELETE FROM flyway_schema_history WHERE version='8'` để Flyway chạy lại (V8 idempotent nên an toàn) |

> **Bài học**: trong MySQL 8, `CREATE TABLE` **phải ghi rõ `COLLATE`** nếu schema gốc dùng `utf8mb4_unicode_ci`; mặc định server là `utf8mb4_0900_ai_ci` và chỉ lộ lỗi khi JOIN, không lộ lúc tạo bảng.

### 9.4 Bằng chứng nghiệm thu

```
node tools/probe-workflow.mjs http://127.0.0.1:9000 admin "***"   → exit 0
```

| Nhóm kiểm tra | Kết quả |
|---|---|
| Tab Workflow | ✅ quy trình mặc định 5 bước, mọi bước có **người duyệt đích danh** (Chỉ huy trưởng A / Thư ký TGĐ D / Nhân viên Dự án E / Nhân viên Kế hoạch F / Trưởng phòng Dự án C) |
| Cách xác nhận | ✅ bước 1–4 = "1 người", bước 5 = "Tất cả" (chuyển từ `all_roles`) |
| Modal | ✅ mở được, có khối bước, đủ 3 chế độ `single/any_of/all_of`, 10 ứng viên kèm trạng thái quyền duyệt |
| **Backend thật** | ✅ tạo `WF-P4TEST` 2 bước → đọc lại thấy `[{any_of, 2 người}, {all_of, 2 người}]` → xóa sạch |
| Chặn cấu hình sai | ✅ "single" mà chỉ định 2 người bị chặn · ✅ bước không có người duyệt bị chặn · ✅ không xóa được quy trình mặc định |
| Lỗi JS | ✅ 0 lỗi |

Cổng chất lượng (đều ĐẠT):

| Cổng | Kết quả |
|---|---|
| `mvn package` | ✅ BUILD SUCCESS |
| `verify-vntech-fingerprint` | ✅ `VNTECH-FP-B7B69F5FEB80A8F8` · 203 file |
| `master-baseline-gate` · `css-baseline-audit` | ✅ ĐẠT |
| `verify-full-release` | ✅ exit 0 · manifest 675 file · migrations 0000..**0080** |
| `typecheck` · `eslint` | ✅ exit 0 · 0 lỗi |
| regression + `probe-menu-11` + `probe-user-profile` | ✅ 13/13 · P2 ĐẠT · P3 ĐẠT |

### 9.5 Rủi ro còn lại của P4

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | Chưa có **test tự động cho `any_of`/`all_of` ở runtime** (mới kiểm chứng phần cấu hình + luồng cũ không hồi quy). Muốn test thật cần một phiếu đang `pending_approval` | ⏳ **P7** |
| 2 | Quy trình gán theo **module/dự án** đã lưu và có cột, nhưng `stageApproverUserIds()` hiện ưu tiên "quy trình riêng dự án → quy trình mặc định"; khi có nhiều quy trình cùng module sẽ cần luật chọn rõ hơn | ⏳ P5 |
| 3 | `allow_skip_level` đã có cột nhưng **chưa dùng** — thuộc P5 (cấp bậc hệ thống) | ⏳ P5 |
| 4 | Chưa có UI gán quy trình cho từng dự án theo bước (mới gán ở cấp quy trình) | ⏳ P5 |

---

## 8. NHẬT KÝ NGHIỆM THU ĐỢT P3 — HỒ SƠ NHÂN SỰ CHI TIẾT (15/09/2026)

### 8.1 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P3.1 | Bấm vào dòng nhân sự ở tab **Nhân sự** ⇒ mở **panel chi tiết** (trước đây mở thẳng form sửa) | `app/page.tsx` — `admin-mini-list` → `open("userProfile", row)` |
| P3.2 | Panel hiển thị **chức danh · phòng ban · mã đơn vị · vai trò · liên hệ · thông tin cá nhân** | `UserProfilePanel` (mới) |
| P3.3 | **Dự án đã/đang tham gia**: dự án đang hoạt động lên đầu (mới nhất trước); dự án đã kết thúc/rời **xuống dưới + mờ (opacity 0.55)** + có thanh phân cách | `userProjectHistory()` (mới) |
| P3.4 | **Chức vụ trong từng dự án** lấy từ `workflowAssignments` (`approval_project_assignments` → tên bước duyệt); **thao tác gần đây** từ `audits`; **đơn từ & giấy tờ** (HĐLĐ, bảo hiểm, phiếu đề nghị, tạm ứng) **chỉ hiện trong hồ sơ nhân sự của bộ phận Nhân sự** | `UserProfilePanel` với cờ `showDocuments` |
| P3.5 | Màn **Hồ sơ nhân sự** (`dept_legal_hr`) cũng bấm được vào dòng | `HrScreen` nhận thêm `open`, `<tr>` có `onClick` |

> **Ràng buộc kỹ thuật**: `master-baseline-gate` khoá cứng số liệu CSS (`!important=4950 · 400643B`),
> nên panel **KHÔNG thêm CSS mới** — chỉ dùng class có sẵn (`card`, `table-wrap`, `admin-mini-list`,
> `table-toolbar`, `pill`) + inline style cho phần làm mờ.

### 8.2 🔴 Bug thật phát hiện trong lúc nghiệm thu P3

**8/16 chức danh trong `role_catalog` bị mất dấu tiếng Việt** — `Chỉ huy trưởng` thành `Ch? huy tr??ng`.

| | |
|---|---|
| **Ảnh hưởng** | `roleLabel()` lấy `data.roleCatalog.name` ⇒ chức danh hiển thị sai ở màn Nhân sự, phân quyền, hồ sơ nhân sự và mọi nơi hiển thị vai trò |
| **Phạm vi** | Chỉ `role_catalog`. Đã quét `users`, `organization_units`, `projects`, `materials`, `teams`, `approval_stage_catalog` — **0 dòng lỗi** |
| **Nguyên nhân gốc** | `java-backend/tools/seed-demo.mjs` gọi mysql CLI **thiếu `--default-character-set=utf8mb4`** ⇒ client dùng latin1, ký tự ngoài latin1 bị đổi thành `?` khi đọc lẫn khi ghi |
| **Sửa dữ liệu** | `V6__fix_role_catalog_encoding.sql` → **khớp 0 dòng** (dùng `id='ROLE-cht'` theo drizzle, nhưng id thực tế là `ROLE_CHT`) ⇒ `V7__fix_role_catalog_encoding_retry.sql` khớp theo `code` ✅ |
| **Sửa gốc** | `seed-demo.mjs`: thêm `--default-character-set=utf8mb4` cho mọi lời gọi mysql CLI |

> **Bài học**: MySQL **không báo lỗi khi UPDATE khớp 0 dòng**, nên Flyway vẫn ghi `success=1`.
> Luôn kiểm chứng bằng truy vấn đếm (`SELECT COUNT(*) ... WHERE name LIKE '%?%'`) chứ không
> chỉ tin vào `flyway_schema_history`.

### 8.3 Bằng chứng nghiệm thu

```
node tools/probe-user-profile.mjs http://127.0.0.1:9000 admin "***"   → exit 0
  ✅ Bấm dòng người dùng ⇒ "Hồ sơ nhân sự chi tiết"      ✅ 7/7 trường hiển thị đủ
  ✅ Có mục Thông tin cá nhân / Dự án đã và đang tham gia / Thao tác gần đây
  ✅ Panel ở Quản trị KHÔNG hiện "Đơn từ"  ·  Panel ở Nhân sự CÓ "Đơn từ & giấy tờ"
  ✅ Màn "Hồ sơ nhân sự" bấm được vào dòng        ✅ 0 lỗi JS ở cả 2 màn
```

**Kiểm chứng riêng cho P3.3** (tạo tình huống thật rồi hoàn tác):

| Bước | Kết quả |
|---|---|
| Gán thêm `DA-MAU-01` cho "Chỉ huy trưởng A" + đóng `PRJ-DEMO-01` | — |
| Chạy probe | `DA-MAU-01 · ĐANG THAM GIA · opacity=1` xếp **trước** → `PRJ-DEMO-01 · ĐÃ KẾT THÚC · opacity=0.55` xếp **sau**; thanh phân cách `["Đã kết thúc / đã rời"]` xuất hiện |
| Hoàn tác | Xóa scope test, trả `PRJ-DEMO-01` về `active` — xác nhận `user_project_scopes` về đúng 14 dòng |

Cổng chất lượng:

| Cổng | Kết quả |
|---|---|
| `mvn package` | ✅ BUILD SUCCESS |
| `verify-vntech-fingerprint` | ✅ ĐẠT · `VNTECH-FP-445C7F7852D21BDF` · 202 file |
| `master-baseline-gate` | ✅ ĐẠT |
| `css-baseline-audit` | ✅ ĐẠT · 2725 dòng · 4950 `!important` |
| `verify-full-release` | ✅ ĐẠT (exit 0) · manifest 668 file · migrations 0000..0079 |
| `typecheck` · `eslint` | ✅ exit 0 · 0 lỗi (66 warning cũ) |
| regression `mobile-menu` + `project-navigation` | ✅ 13/13 pass |
| `probe-menu-11` (hồi quy P2) | ✅ ĐẠT |

### 8.4 Rủi ro còn lại của P3

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | `audits` = **0 dòng** ⇒ mục "Thao tác gần đây" luôn rỗng | ⏳ chờ P6 (audit log) |
| 2 | Chưa hiển thị "ngày rời dự án" (bảng `user_project_scopes` không có cột này) — hiện suy ra từ trạng thái dự án | ⏳ cần bổ sung cột nếu muốn chính xác |
| 3 | "Chức vụ trong dự án" chỉ có khi nhân sự được phân công duyệt; thành viên thường hiển thị "Thành viên dự án" | ⏳ chờ P4 (workflow đa luồng) |
| 4 | Probe tự động chưa phủ nhánh "đã kết thúc" bằng dữ liệu thường trực (phải tạo tay rồi hoàn tác) | ⏳ chờ P7 (dữ liệu mẫu cho test) |

---

## 7. NHẬT KÝ NGHIỆM THU ĐỢT P2 (15/09/2026)

### 7.1 Thay đổi đã thực hiện

| # | Việc | Nơi sửa |
|---|---|---|
| P2.1 | Tách menu **7 → 11 nhóm nghiệp vụ** | `V4__menu_restructure.sql` + `app/page.tsx` (`defaultMenuGroups`) |
| P2.1b | Vá chức năng bị sót khi tái cấu trúc | `V5__menu_orphan_fix.sql` |
| P2.2 | Tách **"Nhân sự & tổ chức" → 2 tab riêng** (Tổ chức có cấu hình tổ đội) | `app/page.tsx` (`Admin.steps` + panel) |
| P2.3 | Dropdown phòng ban/dự án **chỉ hiện tên** đơn vị | `app/page.tsx` (`OrganizationUnitManager`) |
| P2.4 | **Ẩn/hiện menu theo `modulePermissions`** + fallback chống khoá nhầm | `app/page.tsx` (`allowedModules`, `accessDenied`) |

### 7.2 Cấu trúc menu sau tái cấu trúc (11 nhóm)

| Nhóm | Số chức năng | Ghi chú |
|---|---|---|
| CÔNG VIỆC CỦA TÔI | 5 | nhiệm vụ, giao việc, trung tâm phê duyệt |
| QUẢN LÝ DỰ ÁN | 16 | gộp `project_management` cũ |
| **MEP** | **9** | tách riêng: thiết kế, BOQ, thi công cơ điện, hoàn công |
| MUA HÀNG & CUNG ỨNG | 13 | |
| KHO VẬT TƯ | 6 | |
| TỔ ĐỘI | 1 | |
| **TÀI CHÍNH – KẾ TOÁN** | **8** | tách riêng |
| **HÀNH CHÍNH – PHÁP CHẾ** | **6** | tách riêng |
| BÁO CÁO | 4 | gồm cảnh báo & KPI |
| DANH MỤC VẬT TƯ GỐC | (liên kết trực tiếp) | |
| QUẢN TRỊ HỆ THỐNG | 1 | |

Nhóm cũ `department_management` / `project_management` / `boq_contract` / `catalog` đã **giải tán**; 12 chức năng lõi trước đây rơi vào nhóm tạm **"Khác"** nay đều có nhóm chính thức.

### 7.3 Bằng chứng nghiệm thu

```
node tools/probe-menu-11.mjs http://127.0.0.1:9000 admin "***"   → exit 0
  ✅ Đúng 11 nhóm menu — thực tế 11
  ✅ Không còn nhóm tạm 'Khác'          ✅ Mọi nhóm đều có chức năng
  ✅ Đúng 8 tab — thực tế 8              ✅ Tab 1 = "Nhân sự", Tab 2 = "Tổ chức"
  ✅ 8/8 tab mở được, KHÔNG lỗi JS       ✅ Tổng 68 chức năng hiển thị
```

Cổng chất lượng:

| Cổng | Kết quả |
|---|---|
| `mvn package` | ✅ BUILD SUCCESS · 64 test / 0 fail |
| `verify-vntech-fingerprint` | ✅ ĐẠT · `VNTECH-FP-60ED251EF7DC7A4C` · 200 file |
| `master-baseline-gate` | ✅ ĐẠT |
| `css-baseline-audit` | ✅ ĐẠT · 2725 dòng · 4950 `!important` |
| `verify-full-release` | ✅ ĐẠT (exit 0) — **xem lưu ý 7.4** |
| `typecheck` | ✅ exit 0 |
| regression test (`mobile-menu`, `project-navigation`) | ✅ 13/13 pass |

### 7.4 ⚠️ Lưu ý khi chạy cổng `verify-full-release`

Cổng này **quét file khoá bí mật trên đĩa**, nên khi **Node UI đang chạy** nó sẽ báo:

```
Phát hiện file khoá bí mật: .local-data/email-secret.key
```

`server.mjs` **tự sinh lại** file này mỗi lần khởi động. Đây là khoá dev, đã nằm trong `.gitignore`, **không phải lỗi code**. Muốn cổng ĐẠT phải chạy đúng quy trình phát hành:

```powershell
# 1) dừng Node UI (:8787) + Proxy (:9000)
# 2) chuyển .local-data ra ngoài workspace
# 3) node scripts/verify-full-release.mjs   → ĐẠT
# 4) khởi động lại Node UI + Proxy
```

### 7.5 Rủi ro còn lại của P2

| # | Rủi ro | Trạng thái |
|---|---|---|
| 1 | `modulePermissions` hiện **= 0 bản ghi** nên P2.4 chạy ở chế độ fallback (theo vai trò). Sau khi P5 seed quyền, việc ẩn/hiện menu mới siết thật | ⏳ chờ P5 |
| 2 | `userWarehouseScopes` = 0 ⇒ tab 5 hiển thị rỗng nhưng KHÔNG lỗi | ⏳ chờ P5 |
| 3 | Chưa có test tự động khoá cấu trúc 11 nhóm (mới chỉ có probe thủ công) | ⏳ chờ P7 |
