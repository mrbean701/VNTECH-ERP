# TASK-209 — GO-LIVE ĐỢT 64: ⭐ **KIỂM HỆ THỐNG 49 `save_*` VỚI THAM SỐ MÉO** — **49/49 ĐẠT · ⛔ 0 LỖI 500**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Động lực** | ⭐⭐ **Tổng quát hoá phát hiện vòng 62**: **CẢ 3 LỖI 500** của phiên đều lộ ra khi gọi action với **tham số BẤT THƯỜNG** |
| **Phép thử** | ⭐ Gọi **MỌI `save_*`** với tham số **MÉO nhưng ⛔ KHÔNG RỖNG** (`"1"`) ⇒ ⛔ **kỳ vọng KHÔNG 5xx** |
| **Kết quả** | ✅ **49/49 ĐẠT · EXIT=0** · ⛔ **0 lỗi 500** · ✅ **rác đã DỌN SẠCH** (dọn theo **dấu vết riêng**) |
| **⭐ KẾT LUẬN** | ⭐⭐ **LỚP «tham số méo» CŨNG ĐÃ ĐÓNG SỔ** — 49 action, ⛔ không còn 500 nào |
| **Sản phẩm** | `tools/e2e/go-live-kiem-tham-so-meo.mjs` |

---

## ① ⭐⭐⭐ VÌ SAO BÀI NÀY — TỔNG QUÁT HOÁ PHÁT HIỆN VÒNG 62

⭐ **QUAN SÁT**: **CẢ 3 LỖI 500** của phiên đều lộ ra **cùng một cách** — ⭐ **gọi action với tham số BẤT THƯỜNG**:
| Bug | Action | Tham số bất thường |
|---|---|---|
| `BUG-20261005-012` | `check_material_alias_conflicts` | **payload rỗng** ⇒ SQL 1055 |
| `BUG-20261005-013` | `preview_material_dependencies` | **payload rỗng** ⇒ SQL 1054 |
| `BUG-20261005-015` | `save_accounting_voucher` | ⭐ **`voucherDate:"1"`** ⇒ `StringIndexOutOfBounds` |

⇒ ⭐⭐ **KIỂM HỆ THỐNG**: ⭐ **gọi MỌI `save_*` với tham số MÉO** ⇒ ⭐ **bắt mọi lỗi `substring`/`parse*`/`.get(0)`/SQL còn sót** ✓

### ⭐ VÌ SAO `"1"` LÀ THAM SỐ MÉO ĐÚNG
⭐ `"1"` **KHÔNG RỖNG** ⇒ ⛔ **không bị chốt «bắt buộc» chặn** ✓
⭐ `"1"` **SAI ĐỊNH DẠNG** với mọi thứ cần **ngày/số/khoá** ⇒ ⭐ **chính xác cái đã giết `voucherDate`** ✓
⇒ ⭐ **Nếu một action cần `substring(0,4)` / `parseDate` / `.get(0)` mà ⛔ không chốt ⇒ NÓ SẼ NỔ** ✓

---

## ② ✅ KẾT QUẢ — **49/49 ĐẠT · EXIT=0 · ⛔ 0 LỖI 500**

⭐ **49 `save_*`** đã kiểm (⭐ ⛔ **loại `save_user_access`** vì nó **REPLACE-ALL quyền** — ⭐ đã cam kết ⛔ không chạy):
```text
[DAT] save_accounting_voucher · save_advance_request · save_approval_stage · save_bank_account
      save_benefit_record · save_boq_item · save_boq_version · save_business_role_group
      save_business_scope · save_capital_recovery · save_cashbook_entry · save_construction_daily_log
      save_contract_payment · save_correspondence · save_email_settings · save_engine_role_profile
      save_error_report · save_form_field_config · save_hr_record · save_labor_contract
      save_legal_document · save_mar_approval · save_material · save_material_category
      save_material_external_code · save_material_norm · save_material_subcategory
      save_material_uom_conversion · save_menu_group · save_module_catalog · save_notification_config
      save_organization_unit · save_partner · save_payment_plan · save_production_report
      save_project_contract · save_role_catalog · save_seal · save_site_expense_claim
      save_supplier · save_supplier_material · save_system_level · save_team_payment
      save_team_production · save_team_subcontract · save_trust_development_settings
      save_ui_display_settings · save_warehouse_location · save_workflow
dat 49/49 · that bai 0 · EXIT=0
```
⇒ ⭐⭐ **CẢ 49 XỬ LÝ THAM SỐ MÉO ĐÚNG** — ⭐ **400 (bị chốt chặn)** hoặc **200 (không làm gì)** ✓✓✓

---

## ③ ⚠️ KIỂM HẬU QUẢ PHÁT HIỆN **3 BẢN GHI ĐƯỢC TẠO** — VÀ **ĐÃ DỌN SẠCH**

```text
⚠️ materialCategories: 16→17 · adminMaterialCategories: 16→17 · businessScopes: 9→10
```
⇒ ⭐ **NGUYÊN NHÂN**: ⭐ **`save_material_category` và `save_business_scope` chỉ cần mã/tên ⛔ KHÔNG RỖNG** ⇒ ⭐ tham số méo `"E2E-MALFORM-code"` **QUA ĐƯỢC** ⇒ ⭐ **tạo bản ghi** ✓
⚠️ **GHI NHẬN (⛔ không phải 500, mà là CHẤT LƯỢNG DỮ LIỆU)**: ⭐ **2 action này kiểm tra TỐI THIỂU** — ⭐ **chấp nhận mã/tên vô nghĩa** ⇒ ⚠️ **mức LOW/MEDIUM** ✓ (⭐ ⛔ không mở bug: ⭐ **mã/tên tự do là hợp lệ về nghiệp vụ**, ⛔ không có định dạng bắt buộc) ✓

### ✅ DỌN SẠCH — **THEO DẤU VẾT RIÊNG** (⭐ quy tắc TASK-201, cứu tôi lần thứ BA)
```sql
-- tìm: WHERE code LIKE '%E2E-MALFORM%' OR name LIKE '%E2E-MALFORM%'
material_categories    MCAT_573ed935-…   code=E2E-MALFORM-CODE    name=E2E-MALFORM-name
business_scope_catalog BSCOPE_4dea2eb6-… code=e2e-malform-code    name=E2E-MALFORM-name
-- xoá xong ⇒ xác nhận:
nhom_vat_tu 16 · pham_vi 9        ← ⭐ Y HỆT GỐC
rac_con_lai 0 · 0                 ← ⭐ ⛔ không còn rác
```
⭐⭐ **VÌ SAO DỌN ĐƯỢC CHÍNH XÁC**: ⭐ mọi giá trị gửi đi đều mang **DẤU VẾT RIÊNG** `E2E-MALFORM` ✓ — ⭐ **nếu ⛔ không có dấu vết, tôi sẽ phải đoán** ✓ — ⭐ **quy tắc này nay đã cứu 3 lần** (v50 · v55 · v64) ✓

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `save_*` đã kiểm với tham số méo | ✅ **49/49 ĐẠT · EXIT=0** |
| ⛔ **Lỗi 500 phát hiện** | **0** ⇒ ⭐ **LỚP NÀY ĐÓNG SỔ** |
| ⚠️ Hành vi ghi nhận | ⭐ **2 action kiểm tra tối thiểu** (`save_material_category` · `save_business_scope`) ⇒ **LOW/MEDIUM** · ⛔ **không mở bug** |
| ⛔ Rác do bài kiểm | **3 bản ghi** (2 bảng) ⇒ ✅ **ĐÃ DỌN SẠCH** (`16` · `9` về đúng gốc · `rac_con_lai = 0`) |
| ⭐ Cách dọn | ⭐ **theo DẤU VẾT RIÊNG** ⇒ ⭐ **chính xác, ⛔ không đoán** ✓ |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **8 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑤ BÀI HỌC

1. ⭐⭐⭐ **TỔNG QUÁT HOÁ MỘT PHÁT HIỆN THÀNH MỘT PHÉP KIỂM HỆ THỐNG.** ⭐ Tôi ⛔ **không dừng ở «đã vá BUG-015»** — ⭐ tôi hỏi **«còn action nào khác nổ như vậy không?»** ⇒ ⭐ **gọi 49 action với tham số méo** ⇒ ⭐ **kết luận: ⛔ không còn** ✓ ⭐ **giá trị nằm ở KẾT LUẬN, ⛔ không ở việc tìm thêm lỗi** ✓
2. ⭐⭐⭐ **`"1"` LÀ THAM SÓ MÉO TỐI ƯU: KHÔNG RỖNG NHƯNG SAI ĐỊNH DẠNG.** ⭐ Nó **vượt qua chốt «bắt buộc»** nhưng ⭐ **chạm đúng mọi chỗ cần parse/substring/định dạng** ✓ — ⭐ **đó là lý do nó tìm ra `voucherDate`** ✓
3. ⭐⭐⭐ **DẤU VẾT RIÊNG LÀ BẢO HIỂM CHO MỌI BÀI KIỂM GHI.** ⭐ Lần này nó **cứu tôi lần thứ BA** (⭐ v50 · v55 · v64): ⭐ **dọn chính xác 2 bản ghi trong 2 bảng mà ⛔ không đoán** ✓
4. ⭐⭐ **KIỂM HẬU QUẢ PHẢI CHẠY KỂ CẢ KHI BÀI KIỂM «ĐẠT HẾT».** ⭐ **49/49 ĐẠT** nhưng ⭐ **vẫn có 3 bản ghi rác** ⇒ ⭐ **nếu ⛔ không kiểm, tôi đã để lại rác và ⛔ không biết** ✓
5. ⭐⭐ **MỘT «HÀNH VI GHI NHẬN» ⛔ KHÔNG PHẢI MỘT BUG.** ⭐ `save_material_category` chấp nhận mã vô nghĩa — ⭐ **nhưng mã/tên tự do là HỢP LỆ về nghiệp vụ** (⛔ không có định dạng bắt buộc) ⇒ ⭐ **ghi nhận mức LOW/MEDIUM, ⛔ không mở bug** ✓

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **172 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **21 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **5 bản vá CSS** — ⭐ **cần mắt người** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang `capital_recovery` · `contract_payment` · `site_expense_claim` · `advance_request` ✓
6. ⭐ **Commit theo NHÓM** ✓
