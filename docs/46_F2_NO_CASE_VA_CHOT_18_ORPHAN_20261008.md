# F2 — KIỂM `NO_CASE` + **CHỐT CHÍNH XÁC 18 ACTION ORPHAN** (đối chiếu lịch sử)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** (⛔ 0 dòng mã sản phẩm)
Đây là mục **F2** của `docs/45` §F: kiểm **chiều ngược** của P-08 — action khai trong registry mà ⛔ **không có `case`** trong controller ("mồ côi controller").

> ⚠️ Shell vẫn hỏng (vòng **7**) ⇒ ⛔ chưa chạy script. Kết quả dưới đây lấy bằng **[ĐỌC MÃ]** (grep 65 tên action trên `SystemController.java`).

---

## 1. ✅ KẾT QUẢ: **`NO_CASE` = 0** — ⛔ không có action "mồ côi controller"

Grep 65 tên action khai module rỗng (`ActionRbacRegistry`) trên `SystemController.java` ⇒ **65/65 đều có `case "…" ->` thật**.

**Kiểm chứng ngược (để ⛔ không kết luận sai vì grep khớp cả chuỗi khác)**: mọi kết quả đều có dạng `case "<tên>" -> {` (⛔ không có dòng nào chỉ là chuỗi thông báo/ghi chú) — ví dụ `case "setup" -> {` (`:233`), `case "save_error_report" -> {` (`:1472`), `case "delete_project_team" -> {` (`:1025`).

⇒ **Kết luận**: registry và controller **khớp tên đầy đủ** ⇒ ⛔ **không có bug nào ở chiều này** (âm tính có chủ đích).

---

## 2. ⭐ CHỐT ĐƯỢC **18 ACTION ORPHAN** — trùng khớp 100% với lịch sử dự án

Với **65** action khai rỗng (`docs/44` §2), tôi phân loại bằng **vị trí dòng** trong `SystemController` + sự hiện diện của `requireRequireAdmin`:

| Nhóm | Số | Căn cứ | Ví dụ |
|---|---|---|---|
| **PUBLIC** (đã có cổng riêng) | **10** | `RbacService:43-58` | `setup` · `login` · `logout` · `save_error_report` |
| **ADMIN_HARD** (`requireRequireAdmin` ⇒ admin-only + **thông điệp ĐÚNG**) | **37** | khối `:267-525` | `create_user` (`:374-375`) · `save_user_access` (`:413-414`) · `save_organization_unit` (`:479-480`) |
| **ORPHAN** (registry rỗng **và** controller ⛔ không admin-gate ⇒ **403 sai bản chất** cho M) | **18** | xem §2.1 | — |
| **Tổng** | **65** ✅ | | khớp với grep |

### 2.1 Danh sách **18 ORPHAN** (chính xác, có dòng)

| # | Action | Dòng case | Nhóm nghiệp vụ |
|---|---|---|---|
| 1 | `save_material_category` | `:940` | **Danh mục vật tư** |
| 2 | `save_material_subcategory` | `:955` | nt |
| 3 | `set_material_category_status` | `:965` | nt |
| 4 | `set_material_subcategory_status` | `:980` | nt |
| 5 | `delete_material_category` | `:885` | nt |
| 6 | `delete_material_subcategory` | `:895` | nt |
| 7 | `import_material_catalog` | `:915` | nt |
| 8 | `set_project_team_status` | `:1020` | **Tổ đội dự án** |
| 9 | `delete_project_team` | `:1025` | nt |
| 10 | `save_approval_stage` | `:1030` | **Lịch trình duyệt** |
| 11 | `set_approval_stage_status` | `:1035` | nt |
| 12 | `delete_approval_stage` | `:1040` | nt |
| 13 | `bulk_import_projects` | `:1065` | **Nhập hàng loạt** |
| 14 | `bulk_import_users` | `:1070` | nt |
| 15 | `save_email_settings` | `:539` | **Cấu hình hệ thống** |
| 16 | `retry_email` | `:1107` | nt |
| 17 | `save_ui_display_settings` | `:1112` | nt |
| 18 | `save_trust_development_settings` | `:1117` | nt |

### 2.2 ⭐ ĐỐI CHIẾU LỊCH SỬ — **khớp chính xác**
`docs/dsh-state/CHECKLIST.md` (§「MỐC 110 §8」, 30/09/2026) ghi **«18 action mồ côi quyền»** và chia **5 nhóm**:
danh mục vật tư **7** · lịch trình duyệt **3** · nhập hàng loạt **2** · cấu hình hệ thống **4** · đội dự án **2** = **18** ✅
⇒ **Con số 18 KHÔNG đổi sau 8 ngày và nhiều thay đổi mã** — đồng thời **bảng quyết định `docs/42` §2 (12 nghiệp vụ + 6 cấu hình = 18)** **đã bao đúng và đủ** danh sách này ⇒ ⭐ **spec vá P-08 là ĐẦY ĐỦ, ⛔ không thiếu action nào**.

**Giải thích chênh lệch 8→10 PUBLIC (đã truy được)**: lịch sử ghi `8 public + 19 orphan + 38 admin-hard = 65`.
Nay đo được `10 public + 18 orphan + 37 admin-hard = 65` ⇒ **hoán đổi 1-1**: `save_error_report` (orphan → PUBLIC, MỐC 110) và `update_profile_signature` (admin-hard → PUBLIC, MT2 §13.4) ⇒ ⛔ **không có action nào mới bị mồ côi**.

---

## 3. ⚠️ HỆ QUẢ CẦN LƯU Ý CHO VIỆC VÁ (bổ sung cho `docs/42`)

1. **6 action "cấu hình" trong danh sách ORPHAN ⛔ KHÔNG được admin-gate ở controller** (`save_email_settings:539`, `retry_email:1107`, `save_ui_display_settings:1112`, `save_trust_development_settings:1117`, `bulk_import_projects:1065`, `bulk_import_users:1070`).
   ⇒ ⭐ **Xác nhận bằng mã** điều `docs/42` §2.2 đã cảnh báo: nếu chỉ khai `List.of("admin")` thì **vẫn là rỗng ⇒ vẫn 403 + vẫn thông điệp SAI** ⇒ **bắt buộc** dùng nhánh **`ADMIN_ONLY_ACTIONS`** ở `RbacService` (thông điệp đúng «Tài khoản không có quyền thực hiện nghiệp vụ này»).
2. **Danh mục vật tư là nhóm TRỘN**: 7 action **ORPHAN** (bảng trên) + các action **đã có module** (`merge_material_master` · `delete_selected_materials` · `delete_unused_materials` · `estimate_material_norms` · `preview_material_dependencies` · `reset_material_catalog_test` — ⛔ **không** nằm trong 65 rỗng).
   ⇒ ⭐ **Trước khi vá**: Phòng Kế hoạch **⛔ bảo trì được** danh mục (7 action chặn) nhưng **một số thao tác khác lại được** ⇒ dễ hiểu nhầm là "màn hỏng". Sau khi vá 7 action ⇒ dùng được **toàn bộ**.
3. **`update_user` là ADMIN_HARD duy nhất đã được gỡ cổng ②** (`:379-394`, MỐC 109) ⇒ ⭐ **khuôn mẫu** cho mọi lần mở quyền sau này (xem `docs/41` §6).

---

## 4. KẾT LUẬN VÒNG NÀY
| Câu hỏi | Kết quả |
|---|---|
| Có action khai registry mà ⛔ không có `case`? (**NO_CASE**) | ✅ **0** — ⛔ không có lỗi |
| Số action ORPHAN thật hiện nay? | ✅ **18** — **khớp 100%** với con số lịch sử 30/09/2026 |
| Bảng quyết định `docs/42` có đủ? | ✅ **ĐỦ** (12 + 6 = 18) — ⛔ không cần bổ sung |
| ⛔ Điều gì chưa làm được? | ⛔ **Chưa chạy script/API** — shell hỏng **7 vòng** |
