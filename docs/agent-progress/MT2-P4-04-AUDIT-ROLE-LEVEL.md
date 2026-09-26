# MT2-P4-04 — AUDIT 5 BẢNG ROLE / LEVEL (BÁO CÁO + BẢNG ÁNH XẠ)

> Trạng thái: **IN_PROGRESS — audit xong, báo cáo hoàn tất**
> Phase: **PHASE 4 — RBAC & PHẠM VI THEO CHỨC VỤ** · Ngày: 22/09/2026
> Nguyên văn danh sách: *«Audit 5 bảng role/level (`role_catalog` · `business_role_*` · `user_*_scopes`)
> ⇒ **mở rộng đúng chỗ**, ⛔ **không tạo cơ chế quyền mới** · Báo cáo + bảng ánh xạ»*

## 0. ĐÍNH CHÍNH: **8 BẢNG**, ⛔ KHÔNG PHẢI 5
Đo `information_schema` (⛔ không đoán ✗):

| # | Bảng | Số dòng | Vai trò |
|---|---|---|---|
| 1 | `role_catalog` | **16** | **vai trò người dùng** (mã chuẩn) + `base_role` (mã ENGINE) |
| 2 | `system_level_catalog` | **5** | **cấp bậc hệ thống** (`level_rank`) |
| 3 | `business_role_engine_catalog` | **9** | mã ENGINE của vai trò nghiệp vụ |
| 4 | `business_role_group_catalog` | **11** | nhóm vai trò nghiệp vụ |
| 5 | `business_role_group_scopes` | **2** | phạm vi theo NHÓM vai trò |
| 6 | `business_scope_catalog` | **9** | danh mục phạm vi nghiệp vụ |
| 7 | `user_project_scopes` | **16** | phạm vi **theo DỰ ÁN** của user |
| 8 | `user_warehouse_scopes` | **12** | phạm vi **theo KHO** của user |

## 1. BẢNG ÁNH XẠ `role_catalog` → `base_role` → đơn vị mặc định (ĐO, ⛔ không suy diễn)

| `code` (mã chuẩn) | `base_role` (mã ENGINE) | `default_organization_unit_id` | active |
|---|---|---|---|
| `accountant` | accountant | `ORG_f60f9161…` | 1 |
| `cht` | **commander** | `ORG_7b07ef03…` | 1 |
| `commander` | commander | `ORG_7b07ef03…` | 1 |
| `da_nv` | **project** | `ORG-DA` | 1 |
| `da_truong` | **project** | `ORG-DA` | 1 |
| `director` | director | `ORG-BGD` | 1 |
| `engineer` | engineer | `ORG_7b07ef03…` | 1 |
| `kh_nv` | **procurement** | `ORG_1ef47315…` | 1 |
| `kh_truong` | **procurement** | `ORG_1ef47315…` | 1 |
| `ksda` | **engineer** | `ORG_7b07ef03…` | 1 |
| `procurement` | procurement | `ORG_1ef47315…` | 1 |
| `project` | project | `ORG-DA` | 1 |
| `team` | team | ⚠️ **NULL** | 1 |
| `thu_kho` | **warehouse** | `ORG_7b07ef03…` | 1 |
| `thuky` | **director** | `ORG-BGD` | 1 |
| `warehouse` | warehouse | `ORG_7b07ef03…` | 1 |

**Quan hệ NHIỀU-VỀ-MỘT** (⛔ đây là lý do `RbacService.requireRole` phải nhận **CẢ HAI** mã — ghi trong javadoc của hàm ✔):
```text
cht → commander · da_nv & da_truong → project · kh_nv & kh_truong → procurement
ksda → engineer · thu_kho & warehouse → warehouse · thuky → director
```
⇒ ⚠️ **KHÔNG giả định `position = permission`** (đúng GOAL §21) ✔ — vai trò chỉ là **nhãn**, quyền thật đến từ
**module + capability** (`user_module_permissions`) ✔ + **phạm vi** (`user_project_scopes` / `user_warehouse_scopes`) ✔

## 2. CẤP BẬC (`system_level_catalog`) — 5 cấp (ĐO)

| `code` | Tên | `level_rank` | `auto_grant_all` | `can_skip_levels` |
|---|---|---|---|---|
| `tong_giam_doc` | Tổng giám đốc (CEO) | **50** | 1 | 1 |
| `giam_doc` | Giám đốc | **40** | 1 | 0 |
| `truong_phong` | Trưởng phòng | **30** | 0 | 0 |
| `truong_nhom` | Trưởng nhóm / Tổ đội | **20** | 0 | 0 |
| `nhan_vien` | Nhân viên | **10** | 0 | 0 |

⇒ Ngưỡng dùng cho **MT2-P4-02** («≥ trưởng phòng») = **`level_rank >= 30`** ✔ (ĐO, ⛔ không bịa ✗)

## 3. HIỆN TRẠNG USER: `role` ↔ `system_level_code` (ĐO)

| `role` | `system_level_code` | Số user |
|---|---|---|
| `admin` | `tong_giam_doc` | 1 |
| `director` | `giam_doc` | 1 |
| `accountant` | `truong_phong` | 1 |
| `da_truong` | `truong_phong` | 1 |
| `kh_truong` | `truong_phong` | 1 |
| `cht` | `truong_nhom` | 1 |
| `thu_kho` | `truong_nhom` | 1 |
| `thuky` | `truong_nhom` | 1 |
| `da_nv` | `nhan_vien` | 1 |
| `kh_nv` | `nhan_vien` | 1 |
| `ksda` | `nhan_vien` | 1 |
| 🔴 **`ksda`** | ⛔ **(TRỐNG)** | **2** |

## 4. 🔴 HAI BLOCKER — **XÁC NHẬN BẰNG DỮ LIỆU THẬT** (không còn là phỏng đoán)
```text
BLK-01 · CẤP `pho_giam_doc` ⛔ **KHÔNG TỒN TẠI** ✗
   · `system_level_catalog` chỉ có 5 cấp; ⛔ KHÔNG có `pho_giam_doc` ✗
   · Thực tế: `admin`→`tong_giam_doc` · `director`→`giam_doc` · ⛔ không ai ở cấp giữa 40 và 30 ✗
   ⇒ Yêu cầu P4-01 («phó GĐ trở lên = toàn công ty») ⛔ **chưa diễn đạt được** bằng dữ liệu hiện có ✗
   ⇒ CẦN USER QUYẾT: (A) **thêm cấp mới** `pho_giam_doc`  hay  (B) quy ước **«từ `giam_doc` trở lên»** ✔

BLK-02 · 2 USER có `system_level_code` ⛔ **TRỐNG** ✗ (cả 2 đều `role='ksda'`)
   ⇒ ảnh hưởng trực tiếp: MT2-P4-02 dùng `level_rank >= 30` ⇒ user TRỐNG bị coi là **KHÔNG đủ** ✔ (an toàn ✔)
   ⇒ nhưng P4-01 cần biết họ thuộc phạm vi nào ⇒ CẦN USER QUYẾT: gán cấp nào cho 2 user này ✔
```

## 5. KẾT LUẬN AUDIT — **MỞ RỘNG ĐÚNG CHỖ, ⛔ KHÔNG TẠO CƠ CHẾ MỚI** (đúng GOAL §15/§21)
```text
① CƠ CHẾ QUYỀN HIỆN CÓ ĐÃ ĐỦ 3 TRỤC — ⛔ KHÔNG cần bảng/cơ chế mới ✗:
     · MODULE + CAPABILITY ..... `module_catalog` + `user_module_permissions` (⇒ `RbacService.requireActionModule`)
     · VAI TRÒ ................. `role_catalog` (+ `base_role`) ⇒ `requireRole`
     · CẤP BẬC ................. `system_level_catalog.level_rank` ⇒ **MT2-P4-02 vừa dùng** ✔
     · PHẠM VI ................. `user_project_scopes` / `user_warehouse_scopes`
② ⇒ MT2-P4-01/P4-03 chỉ cần **ĐỌC THÊM** các bảng sẵn có (⛔ 0 migration · ⛔ 0 bảng mới) ✔
③ ⚠️ `role_catalog` có `team` với `default_organization_unit_id` = **NULL** ⇒ khi resolve đơn vị phải chịu được NULL ✔
④ ⛔ KHÔNG đổi `role_catalog`/`system_level_catalog` khi chưa có quyết định của user (BLK-01/BLK-02) ✗
```
- **Deliverable**: **BÁO CÁO + BẢNG ÁNH XẠ** — hoàn tất tại tài liệu này ✔
- **Files Changed**: ⛔ **0 file mã** (task audit) ✔ — chỉ tài liệu này ✔
- **Tests**: ⛔ không cần test mã (task audit, ⛔ không đổi hành vi) ✔ — ⚠️ ghi rõ để ⛔ không “đánh DONE khống” ✗
- **Next Task**: chờ **BLK-01/BLK-02** cho P4-01 ⇒ nếu user chưa quyết thì chuyển **P4-03** (card «Chờ Giám đốc duyệt»).
