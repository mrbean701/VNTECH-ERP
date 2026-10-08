# 🎯 BẢNG TỔNG HỢP GO-LIVE — **1 TRANG** (mọi quyết định + việc chặn)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · ⛔ **không commit/push**
Mục đích: gom **8 tài liệu** (`docs/37`→`docs/44`) thành **một bảng để anh quyết** — ⛔ không phải đọc lại từng tài liệu.

> 📌 **Trạng thái hạ tầng phiên này**: shell DSH **HỎNG 5 vòng liên tiếp** (`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope`) ⇒ ⛔ **0 phép thử runtime** trong 8 vòng. Tất cả kết luận dưới đây là **[ĐỌC MÃ]** (có `file:line`).

---

## A. 🚨 VIỆC **CHẶN** (làm ngay, ⛔ không cần quyết nghiệp vụ)

| # | Việc | Ai | Vì sao chặn | Bằng chứng |
|---|---|---|---|---|
| **A1** | **Sửa profile DSH `web`** (thiếu gói `@deepseek-ai/dsh-scope`) | **USER** | ⛔ không phiên nào chạy được `tsc`/`test:regression`/`gd-cycle`/UI ⇒ **mọi kiểm định đều dừng** | đã liệt kê 5.119 đường trong `…\profiles\web\node_modules\@deepseek-ai\`, grep = **0** |
| **A2** | Dán **2 cổng tĩnh** (`docs/43` §2) + **script phân loại** (`docs/44` §2) rồi chạy | **S01** | Chống tái phát RBAC; ⛔ chạy được **không cần UI/DB** | `tests/golive-rbac-orphans.test.mjs` · `golive-rbac-public-actions.test.mjs` · `tools/rbac-classify-actions.mjs` |

---

## B. 🧭 QUYẾT ĐỊNH CẦN **USER** (7 câu — mỗi câu có đề xuất)

| # | Câu hỏi | Lựa chọn | **Đề xuất** | Nếu chọn đề xuất thì phải làm gì |
|---|---|---|---|---|
| **B1** | **P-08**: 12 action "mồ côi quyền" (danh mục vật tư 7 · tổ đội 2 · lịch trình duyệt 3) có **mở cho nghiệp vụ** không? | (a) Mở (b) Giữ admin-only | **(a) MỞ** — nếu ⛔ mở, Phòng Kế hoạch **không bảo trì được danh mục vật tư** và **không cấu hình được 5 bậc duyệt** (GĐ A2) | **BE**: điền module vào `ActionRbacRegistry` (12 dòng) + nhánh `ADMIN_ONLY_ACTIONS` cho 6 action cấu hình ⚠️ **`List.of("admin")` vẫn là rỗng ⇒ vẫn 403** |
| **B2** | **PROJECT CRUD** (`create/update/delete_project`, `set_project_status`) hiện **chỉ `admin`** — **chủ ý hay sót**? | (a) Chủ ý (b) Mở cho Phòng Dự án | **(a) CHỦ Ý** (dự án = tài sản cấp công ty) — ⛔ nếu mở ⇒ sửa **2 tầng** BE | (a) ⛔ không làm gì, chỉ ghi vào `docs/37` §2 là *«admin-only có chủ đích»* |
| **B3** | **Luật L**: `director`/`accountant` **thực thi được MỌI action module-gated** (bất kể capability) — giữ? | (a) Giữ (b) Siết về `canView` | **(a) GIỮ** (thực tế VNTECH: GĐ cần thao tác) | (b) ⇒ **BE** sửa `RbacService:69` |
| **B4** | **Cấp quyền**: tập trung ở admin hay **phân cấp** cho Trưởng phòng? | (a) Tập trung (b) Phân cấp | **(a) TẬP TRUNG** cho go-live (an toàn) | (b) ⇒ **BE** (khuôn MỐC 109) — ⚠️ kèm test chống mất dữ liệu (`save_user_access` là **FULL-REPLACE**) |
| **B5** | **`delete_supplier`** lệch registry↔controller (registry: M được · controller: chỉ admin) | (a) Giữ admin-only (sửa registry) (b) Cho M (bỏ hard-code) | **(a) GIỮ admin-only** (an toàn) + **sửa registry cho khớp** | **BE** 1 dòng (`docs/41` §7.1 · `BUG-20261008-D04`) |
| **B6** | **4 tệp màn mồ côi**: `ProjectAggregateTabs` · `SiteCommandCreateModal` · `WarehouseCreateModal` · `TeamManagement` | (a) Nối lại (b) Xoá (c) Giữ + ghi chú | **(c) GIỮ + ghi chú** cho `WarehouseCreateModal` (đang chôn tính năng *thêm kho cho dự án đã có*) · **(b) XOÁ** `ProjectAggregateTabs` | `HANDOFF-20261007-C15` |
| **B7** | **22 màn phòng ban mỏng** (`dept_plan_*`/`dept_project_*` = 1 form + 1 bảng) có **ẩn khỏi menu go-live**? | (a) Ẩn (b) Giữ | **(a) ẨN** | **FE**: `lib/menu-helpers.ts` (**S02**) |

---

## C. ✅ ĐÃ KIỂM & **SẠCH** (⛔ không cần làm gì — ghi để anh yên tâm)

| Vùng | Kết quả | Bằng chứng |
|---|---|---|
| **Chuỗi lõi go-live** | Mua hàng **13** + kho **12** + tài chính **3** action **module-gated đúng** (⛔ không chặn quyền sai) | `docs/40` §5 · `docs/41` §1-§3 |
| **Bảo mật** `PUBLIC_ACTIONS` | **7/7** action tự phục vụ `requireCurrentUser` + `cu.id()` (⛔ không IDOR) · `setup` **chặn chạy lại 409** · `login` **lockout 429** | `docs/43` §1 |
| **Nút chết** (lớp MỐC 109) | FE↔BE **nhất quán** — FE ẩn nút khi BE chặn | `docs/44` §1 |
| **JOBS** | 5 mục menu → `WorkCenter` 5 tab; 8 action đủ module+capability; lỗi cũ Dashboard **đã vá** | `docs/38` §1 |
| **Fingerprint/migration** | Số liệu theo log **(có ngày)**: migration `0339→0344` · hồi quy `865/864/0/1` · `tsc` 0 · `eslint` 0 | `SESSION_C/README.md` 08/10 |

---

## D. 🛠 KẾ HOẠCH THI HÀNH KHI ANH CHỐT (đúng thứ tự **FE → BE → DB**)

| Bước | Việc | Ai | Ước lượng | Phụ thuộc |
|---|---|---|---|---|
| 1 | **A1** sửa profile DSH ⇒ xác nhận `node -v` chạy | USER | 5–15 phút | — |
| 2 | Chạy **6 phép đo runtime** (`docs/39` §5 + `docs/44` §2 script) | S01/S04 | 30 phút | 1 |
| 3 | **FE** (nếu B6/B7 = có): ẩn 22 màn + vá 2 chỗ ngày ISO (`page.tsx:1024`) | S02/S01 | 1–2 h | — |
| 4 | **BE**: vá P-08 (B1) + `delete_supplier` (B5) + (nếu chọn) PROJECT CRUD (B2) | S01 | 2–4 h | B1·B5 |
| 5 | Dán 2 cổng tĩnh + script (**A2**), cập nhật allowlist | S01 | 30 phút | 1 |
| 6 | `tsc` + `test:regression` + build JAR + restart `:18081` + `gd-cycle` | S01 | 1 h | 1 |
| 7 | Chạy **5 phép thử API** (`docs/42` §4.2, kèm **đối chứng âm**) | S01 | 30 phút | 6 |
| 8 | Cập nhật `docs/41` (ma trận) + log + báo cáo | S04 | 30 phút | 7 |
| **DB** | ⛔ **KHÔNG cần migration** cho mọi việc trên (thuần mã Java + FE) | — | 0 | — |

---

## E. 📚 BẰNG CHỨNG ĐÃ CÓ (8 tài liệu + log)

| Tài liệu | Nội dung 1 dòng |
|---|---|
| `docs/37` | Kế hoạch go-live lõi (thay `docs/09` đã lỗi thời) |
| `docs/38` | Audit **JOBS & PROJECT** (11 phát hiện) |
| `docs/39` | ⚠️ **ĐÍNH CHÍNH** tầng cổng quyền + **P-08** |
| `docs/40` | Xác minh lại ⇒ **bác P-01** · **rút việc T-03** · chuỗi mua hàng **SẠCH** |
| `docs/41` | **Ma trận quyền go-live** (A/L/M) + tiền lệ vàng `update_user` |
| `docs/42` | **Spec vá P-08** (12+6 action · diff · 5 phép thử) |
| `docs/43` | **Rà PUBLIC_ACTIONS** (sạch) + **2 cổng tĩnh sẵn dán** |
| `docs/44` | **Đường cấp quyền** (nhất quán) + **script phân loại 65 action** |
| `SESSION_D/` | 9/9 log + README · đã APPEND `SHARED_STATE` §73′–76′ · `SHARED_TODO` · 2 sổ đăng ký |

---

## F. ⏭ NẾU CHƯA CÓ QUYẾT ĐỊNH — TÔI LÀM TIẾP GÌ (⛔ không bị chặn)

1. Soi nốt **thân `case`** các action lõi còn lại (`issue_stock` `:1257` → hết, `production_*`, `boq_*`, `material_*`) để **đóng 100% ma trận**.
2. Kiểm **`NO_CASE`** = hành động khai trong registry mà ⛔ không có `case` (mồ côi controller) — nếu > 0 ⇒ bug mới.
3. Rà **`ADMIN_ONLY_ACTIONS` tương lai**: chuẩn bị sẵn danh sách 6 action cấu hình (docs/42 §2.2) để S01 dán.
4. Kiểm **cổng `module_catalog`** (76 module ↔ action thật) xem có **module chết** (khai mà ⛔ action nào dùng) — ảnh hưởng cấu hình quyền GĐ A4.
