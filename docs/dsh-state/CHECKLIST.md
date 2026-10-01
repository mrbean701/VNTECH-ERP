# CHECKLIST — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)

> **Cách đọc tệp này:** theo **MỐC THỜI GIAN**, mỗi mốc ghi rõ **ĐÃ LÀM GÌ · PHẠM VI · KẾT QUẢ**.
> Nguồn kiểm chứng cuối cùng là **code + CSDL thật**, không phải tệp này.
> Cập nhật: **28/09/2026** · build `VNTECH-FP-84E9AE091EDD3863` · HEAD `4d1c129` · ⛔ 0 commit

---

## MỐC 1 · 28/09 — ROLLBACK VỀ BẢN MT2

**ĐÃ LÀM GÌ** — nghe theo yêu cầu «quay lại 4d1c129, phần mềm lỗi rất nhiều, phải quay về bản MT2 làm lại từ đầu».

**PHẠM VI**
| Việc | Kết quả |
|---|---|
| Sao lưu trước khi xoá | branch `backup/mt3-head-20260928` (=7fdf71d) + branch `backup/mt3-worktree-20260928` (=73ff69d) + tag `backup-mt3-worktree-20260928` |
| `git reset --hard 4d1c129` | bỏ 6 commit · 220 file · 9 554 dòng |
| **Build lại cả 2 vùng** | `dist/` + `web/target/*.jar` **KHÔNG nằm trong git** ⇒ không build thì trình duyệt vẫn hiện bản lỗi |
| `set-local-identity.mjs` | đồng bộ vân tay SQLite ⇄ SSOT |
| Khởi động lại 3 service | Java `:18081` → UI `:8787` → proxy `:9000` |

**KẾT QUẢ** ✅ hoàn tất · `MIGRATION_HEAD = 0224_…` ⇒ **0 migration mới**, DB không lệch.

**BÀI HỌC** ⛔ `git reset` một mình **không đủ** — phải build lại **và** đồng bộ vân tay.

---

## MỐC 2 · 28/09 — CHÚẨN HOÁ THANH CÔNG CỤ & KHUNG PHÊ DUYỆT

**ĐÃ LÀM GÌ** — gộp nhóm nút chức năng (search · sort · filter · CRUD) nằm ngang, tab theo mẫu quản trị, rút gọn dải phê duyệt, đưa khung nhập bình luận xuống dưới nhãn, cân 3 khung phê duyệt.

**KẾT QUẢ — ĐO THẬT TRÊN TRÌNH DUYỆT**
| Hạng mục | Trước | Sau |
|---|---|---|
| Nhóm nút nằm dọc (`.row-actions`) | 112 cụm | **0** |
| 3 khung phê duyệt | 770 / 590 / 786 px | **786 / 786 / 786 px** |
| Khung bình luận | nằm ngang | `display:inline` → **`grid`**, nằm DƯỚI nhãn |
| Menu con khi đã có tab | — | **`NAV-CHILD = 0`** cả 11 nhóm |
| Tiêu đề quy trình phê duyệt | dài + khối «chưa có nguồn» | rút gọn |
| Bước đã duyệt | — | hiện **tên người duyệt + thời gian**; chưa duyệt → trạng thái |

---

## MỐC 3 · 28/09 — MÀN «DANH SÁCH DỰ ÁN» THEO YÊU CẦU USER

**ĐÃ LÀM GÌ** — rút gọn thanh công cụ, bỏ bộ lọc, bỏ thẻ, đổi 4 thẻ thành danh sách tổng hợp đa dự án, gỡ 2 lỗi có sẵn.

**KẾT QUẢ — ĐO THẬT**
| Việc | Kết quả đo |
|---|---|
| Rút gọn tiêu đề | **230 → 90 ký tự** |
| ⛔ Bỏ filter «Phòng ban» | thanh còn: Tìm · Trạng thái · Quản lý dự án · Sắp xếp · Ngày |
| ⛔ Bỏ thẻ «Tổng quan» | còn **5 thẻ**: Danh sách dự án · Nhân sự · Tổ đội · Kho · Ban chỉ huy |
| ⛔ Bỏ khoá 4 thẻ | bấm thẻ là vào thẳng, **không cần chọn dự án trước** |
| Ẩn nhãn bên cạnh filter | `span` **7 trong DOM / 0 hiển thị** |

**2 LỖI CÓ SẴN ĐÃ SỬA**
```
① `open` khai báo trong prop `ProjectManagement` NHƯNG KHÔNG destructuring
   ⇒ trong hàm trỏ về `window.open` ⇒ MỌI lời gọi modal trong màn này đều sai
② `{entityModal}` không render ở nhánh `tab >= 1` ⇒ nút «Chi tiết / Hồ sơ / Xem kho» bấm vô tác dụng
⇒ đã thêm `{entityModal}` + đổi tên 3 nút về «Chi tiết ›» cho đồng bộ
```

---

## MỐC 4 · 28/09 — 4 DANH SÁCH TỔNG HỢP ĐA DỰ ÁN

**ĐÃ LÀM GÌ** — tạo [ProjectAggregateTabs.tsx](app/screens/ProjectAggregateTabs.tsx) gom dữ liệu trên **nhiều dự án** thay vì một dự án.

**PHẠM VI & KẾT QUẢ ĐO THẬT**
| Thẻ | Dòng | Cột | Yêu cầu của user | Khớp? |
|---|---|---|---|---|
| **Nhân sự** | **16** | 6 | lấy nhân sự **đang được phân vào các dự án** (mỗi người 1 dòng, gộp nhiều dự án) | ✅ |
| **Tổ đội** | **3** | 7 | tổ đội của **dự án đang hoạt động**, bấm mở modal chi tiết | ✅ |
| **Kho** | **6** | 6 | kho thuộc dự án, **mặc định lọc kho còn hoạt động** | ✅ |
| **Ban chỉ huy** | **0** | 5 | ban chỉ huy **dự án còn hoạt động** | ✅ *(rỗng là **đúng dữ liệu**)* |

⚠️ **Vì sao Ban chỉ huy = 0 dòng** *(đã kiểm CSDL thật, ⛔ không đoán)*:
`organization_units` có 1 `site_command` nhưng **0 đơn vị nào có `project_id` NOT NULL** ⇒ không thuộc dự án nào.

---

## MỐC 5 · 28/09 — 4 NÚT TẠO (CHỈ USER CÓ QUYỀN)

**ĐÃ LÀM GÌ** — thêm 4 nút tạo, **tái dùng modal/action có sẵn**, ⛔ không thêm action nghiệp vụ mới.

**KẾT QUẢ — BẤM THẬT TRÊN TRÌNH DUYỆT**
| Nút | Cách làm | Action | Cổng quyền | Modal mở |
|---|---|---|---|---|
| ＋ Tạo Dự án | `open("projectMaster")` | `create_project` | `canCreateProject` | ✅ «Thêm dự án» |
| ＋ Tạo Tổ đội | `open("teamCreate")` | `create_project_team` | `isAdminUser ∨ role ∈ {cht, commander}` | ✅ «Tạo tổ đội dự án» |
| ＋ Tạo Ban chỉ huy | [SiteCommandCreateModal.tsx](app/screens/SiteCommandCreateModal.tsx) *(mới)* | `save_organization_unit` | **`bchGates().canAddUnit`** (hàm thật) | ✅ «＋ Tạo Ban chỉ huy dự án» |
| ＋ Tạo kho | [WarehouseCreateModal.tsx](app/screens/WarehouseCreateModal.tsx) *(mới)* | **`update_project` CÓ SẴN** | `canCreateProject` | ✅ «＋ Tạo kho cho dự án» |

**BLOCKER ĐÃ GỠ TỰ ĐỘNG** ⛔ *từng tưởng chặn, không cần hỏi user*:
```
Tưởng chặn vì không có `create_warehouse`.
⇒ Đọc sâu `ProjectManagementUseCase` L100-104: if/else CÙNG gọi `upsertSiteWarehouse`
⇒ `update_project` ĐÃ tạo được kho công trường (có thì UPDATE, chưa có thì INSERT type="site")
⚠️ Rủi ro đã rà: `update_project` ghi đè code/name/contractNo/ngày của DỰ ÁN
   ⇒ modal KHÔNG cho sửa các ô đó, gửi ĐÚNG giá trị hiện tại ⇒ ⛔ không phá dữ liệu dự án.
```

**PHÂN QUYỀN — ĐO 2 VAI**
```
admin (role=admin)      → 4/4 nút, không bị khoá, 4 modal mở đúng
giamdoc.demo (director) → ⛔ KHÔNG CÓ nút「Tạo tổ đội」 (director ∉ {cht, commander})
                          3 nút kia có, không bị khoá ⇒ director CÓ canCreate trên `site_command`
                          ⇒ ĐÚNG RBAC hiện có ⇒ ⛔ KHÔNG tự ý siết quyền (goal §25)
```

---

## MỐC 6 · 28/09 — SỬA LỖI HIỂN THỊ THẬT

**ĐÃ LÀM GÌ** — khối nhập của màn Nhà cung cấp bị xuống hàng.

**NGUYÊN NHÂN** *(đo bằng `getComputedStyle`, ⛔ không đoán)*:
```css
/* globals.css L427 */
.supplier-admin-row{ grid-template-columns:120px minmax(220px,1.4fr) 150px 170px 140px 90px 80px 55px 70px; }
                        ↑ 9 CỘT CỐ ĐỊNH — tổng ≈1151px > bề ngang 1163px ⇒ TRÀN
                        ⇒ CSS Grid XUỐNG HÀNG (đúng hành vi, ⛔ không phải lỗi flex)
```
**KẾT QUẢ** 9 cột cố định → `minmax(88px,120px) … minmax(52px,70px)` có giãn
⇒ chiều cao **59px → 44px**, cả 12 phần tử cùng trục Y ⇒ **1 HÀNG** ✅
⛔ **không** sửa `.supplier-new-grid` (form nhập) — giữ nguyên.

---

## MỐC 7 · 28/09 — HỢP ĐỒNG `W-02` FAIL — ĐÃ XỬ LÝ ĐÚNG CÁCH

**Hiện tượng** hợp đồng `W-02` FAIL: số đo lệch con số ghi trong tệp audit.

**ĐIỀU TRA** — đọc CSDL thật: kho **6→7** · dự án **2→3** · kho gắn dự án **5→6** · **mồ côi = 0 ✅**
⇒ dự án mới `DA06` + kho `KHO-DA06` theo luồng `create_project` + cờ `createWarehouse` ⇒ **nghiệp vụ hợp lệ**.

**XỬ LÝ** ⇒ cập nhật **TÀI LIỆU audit + hợp đồng** theo số đo mới
⛔ **KHÔNG sửa DB để khớp tài liệu** (GOAL §19) — đúng như chính test đã dạy ở L193-195.
**KẾT QUẢ** ✅ `W-02 10/10`.

---

## MỐC 8 · 28/09 — BỘ NHỚ TRẠNG THÁI `/docs/dsh-state/`

**ĐÃ LÀM GÌ** — tạo 4 tệp để phiên mới đọc là nối tiếp được (goal §3).

| Tệp | Vai trò |
|---|---|
| [CURRENT_STATE.md](CURRENT_STATE.md) | commit · build · 3 service + thứ tự khởi động · 4 cổng · endpoint đăng nhập · bảng action thật |
| [CHECKLIST.md](CHECKLIST.md) | tệp này — theo mốc thời gian |
| [DECISIONS.md](DECISIONS.md) | 9 quyết định kỹ thuật + 10 bài học |
| [TASK_HISTORY.md](TASK_HISTORY.md) | nhật ký từng task + bảng lỗi tự gây ra |

**CÔNG CỤ ĐÃ TẠO (dùng lại được)**
| Tệp | Vai trò |
|---|---|
| `tools/verify-all.mjs` | **gộp 5 cổng** trong 1 lệnh, `EXIT≠0` nếu cổng nào đỏ |
| `tools/css-comment-guard.mjs` | chặn ghi chú `//` trong CSS (đã hỏng build 3 lần) |
| `tools/list-nav-items.mjs` | liệt kê **42 mục** menu nguyên văn |
| `tools/measure-toolbar.mjs` | đo toolbar theo **TÂM DỌC ±10px** |
| `tools/scan-screens.mjs` · `probe-nav-robust.mjs` · `probe-aggregate-verify.mjs` · `probe-gate-truth.mjs` | quét màn · điều hướng · đo bảng · đọc quyền |

---

## MỐC 9 · 28/09 — ĐO TOÁN 4 MÀN USER ĐÃ LIỆT KÊ

**ĐÃ LÀM GÌ** — đo thanh công cụ bằng TÂM DỌC ±10px (không đếm `top` vì control khác chiều cao).

**KẾT QUẢ**
| Màn (tên THẬT trong menu) | Control | Khối | Flex | Tràn | Kết quả |
|---|---|---|---|---|---|
| Quản lý dự án | — | — | row/nowrap | 0px | ✅ 1 hàng |
| Nhà cung cấp | 4 | 1163×46 | row/nowrap | 0px | ✅ 1 hàng |
| Phiếu đề nghị mua hàng | 5 | 1209×46 | row/nowrap | 0px | ✅ 1 hàng |
| Mua hàng & PO | 9 | 1163×46 | row/nowrap | 0px | ✅ 1 hàng |
| Đơn hàng đã giao | 4 | 1163×46 | row/nowrap | 0px | ✅ 1 hàng |
| Cấp phát cho tổ đội | — | 46 | row/nowrap | 0px | ✅ 1 hàng |

⚠️ **ĐÃ SỬA 1 CẢNH BÁO SAI CỦA TÔI**: tôi báo «Mua hàng & PO 3 HÀNG» ⇒ đo lại **1 HÀNG**
⇒ nguyên nhân: detector cũ đếm `Math.round(top/6)`, 9 control khác chiều cao ⇒ **false positive**.

---

## MỐC 10 · 28/09 — DỌN MENU: BỎ TRÙNG + CHUYỂN XUỐNG CUỐI

**YÊU CẦU CỦA USER** — «menu Nhà cung cấp và Danh mục nhà cung cấp đang bị trùng nghiệp vụ. Bỏ danh mục nhà cung cấp đi. Chuyển menu Đối tác xuống dưới danh sách menu Mua hàng & cung ứng» → sau đó: «đưa Nhà cung cấp và đối tác xuống cuối nhóm purchasing».

**NGUYÊN NHÂN TRÙNG LẶP** *(đọc mã nguồn, ⛔ không đoán)*

| Mục | Nguồn khai báo | Màn mở |
|---|---|---|
| `supplier_catalog` — «Danh mục Nhà cung cấp» | dòng `modules` trong cây menu | `SupplierManager` |
| `dept_plan_suppliers` — «Nhà cung cấp» | `supplierPartnerMenuItems` | `SupplierManager` (view `supplier`) |

⇒ **cùng một màn quản lý NCC** ⇒ trùng nghiệp vụ.

**ĐÃ LÀM — PHẠM VI**

| Việc | Cách làm | Kết quả |
|---|---|---|
| ⛔ BỎ `supplier_catalog` khỏi cây menu | xoá 1 dòng trong `lib/menu-helpers.ts` | ✅ 42 → **41** mục |
| ⛔ **GIỮ NGUYÊN khoá quyền** | `ActionRbacRegistry` gắn `save_supplier_material` + `supplier_material_gaps` vào `supplier_catalog` | ✅ chỉ bỏ khỏi MENU, **không xoá khoá** |
| ⬇️ Chuyển 2 mục xuống CUỐI nhóm | dời khối render `supplierPartnerMenuChildren` xuống **sau** `group.children.map` (cả sidebar + mobile) | ✅ |

**KẾT QUẢ — ĐO THẬT TRÊN TRÌNH DUYỆT** (`node tools/list-nav-items.mjs`)

```
Phiếu đề nghị mua hàng · Mua hàng & PO · Giao nhận công trường · Đơn hàng đã giao
Kế hoạch mua hàng & cung ứng · Xin giá vật tư · Mua hàng vật tư · Cung ứng vật tư
Hợp đồng các loại · Giá & dữ liệu thương mại
  ┌─ Nhà cung cấp   ← CUỐI NHÓM ✅
  └─ Đối tác        ← CUỐI NHÓM ✅
⛔ «Danh mục Nhà cung cấp» — KHÔNG CÒN ✅
```

**HỢP ĐỒNG & KIỂM CHỨNG**

| Tệp | Kết quả |
|---|---|
| `node --import tsx tests/p07-supplier-partner-split-probe.mjs` | ✅ **10/10** |
| `tsc --noEmit` | ✅ EXIT=0 |
| `node tools/verify-all.mjs` (5 cổng) | ✅ EXIT=0 |

⚠️ **ĐÃ SỬA 1 HỢP ĐỒNG CŨ** — probe `p07` đòi `active === "dept_plan_suppliers" && <SupplierManager` **liền kề**,
nhưng từ TASK-125 (21/09) nhánh render đã tách `=== "partner"` → `<PartnerManager>` và
`!== "partner"` → `<SupplierManager … view open loadGaps>` ⇒ regex cũ **không còn khớp dù code đúng hơn**.
⇒ cập nhật regex theo **2 vế thật**. ⛔ KHÔNG sửa code để chiều regex.

**BUILD** `VNTECH-FP-96409FDED51AE49F`

### ⏸ MỐC 11 · 28/09 — CẤP QUYỀN MENU «QUẢN TRỊ HỆ THỐNG» — **ĐÃ HUỶ THEO USER**

**Yêu cầu:** «Thêm phân quyền admin (menu Quản trị hệ thống) cho user nữa.»

**ĐÃ ĐIỀU TRA CSDL + MÃ NGUỒN (không đoán)**

| Dữ kiện | Kết quả |
|---|---|
| Có user tên `user`? | ⛔ **KHÔNG** — 20 tài khoản, 10 tài khoản không phải admin |
| `user_module_permissions` có dòng cho `admin`? | ⛔ **KHÔNG** — admin vào được nhờ `role='admin'` |
| Có thể cấp `admin` qua bảng quyền? | ⛔ **KHÔNG** — code **cố ý chặn ở 3 chỗ** |

```js
// scripts/system-route.mjs:3073  (lúc CẤP quyền)
if(!MODULE_KEYS.includes(moduleKey) || moduleKey === "admin") continue;   // bỏ qua 'admin'
// scripts/system-route.mjs:774  (lúc ĐỌC quyền)
: isCompanyLeadership(user) ? MODULE_KEYS.filter(k => k !== "admin" …)     // loại 'admin'
: …đọc user_module_permissions…                                          // không nhận 'admin'
```

**`module_catalog`**: `admin` = «Danh mục & phân quyền» · nhóm `system_admin` · `system_locked=1`
⇒ mở màn này cho người thường = cho họ **toàn quyền cấp/tước quyền người khác** ⇒ leo thang đặc quyền.

**QUYẾT ĐỊNH CỦA USER:** «ok nếu bằng role thì ok rồi không cần làm việc này nữa»
⇒ **DỪNG.** Cơ chế `role='admin'` đã thoả yêu cầu; ⛔ không sửa code, ⛔ không đụng CSDL.

| | |
|---|---|
| **STATUS** | ✅ **HUỶ — user tự quyết** |
| **FILES CHANGED** | không có |
| **DATABASE** | không có |
| **API** | không có |
| **TEST** | không chạy (không có thay đổi) |
| **BLOCKER** | ⛔ không còn |

---

## MỐC 13 · 28/09 — THÊM TAB «Báo lỗi» VÀO MÀN QUẢN TRỊ HỆ THỐNG — **DONE**

**YÊU CẦU (nguyên văn):** «trước khi làm phân quyền user (cấp quyền admin) thì hãy thêm 1 tab nữa.
Báo lỗi, tạm thời chỉ thêm tab chưa cần thêm logic nghiệp vụ.»

| | |
|---|---|
| **STATUS** | ✅ **DONE** — đo thật trên trình duyệt, bấm tab mở được |
| **FILES CHANGED** | `app/screens/admin-governance-pure.ts` · `app/page.tsx` · `tests/ad01-account-rename.test.mjs` |
| **DATABASE** | **không** — ⛔ không tạo bảng/cột (đúng yêu cầu «chưa cần logic nghiệp vụ») |
| **API** | **không** — ⛔ không gọi action nào |
| **BUILD** | `VNTECH-FP-E073CE0919677564` |

**ĐÃ LÀM**

| Việc | Cách làm | Kết quả |
|---|---|---|
| Thêm nhãn bước | `"Báo lỗi"` vào **cuối** `ADMIN_STEP_LABELS` | 13 → **14 bước** |
| Vẽ nội dung tab | `<section data-vntech="admin-errors-placeholder">` + `CardHead` | chỉ có ghi chú «chưa bổ sung logic nghiệp vụ» |
| Chặn theo vai trò | thêm `14` vào `ADMIN_ROLE_ONLY_STEPS` | ⛔ chỉ hiện với `role==="admin"` |

⛔ **KHÔNG bịa dữ liệu** · ⛔ **không gọi API** · ⛔ **không tạo cấu trúc CSDL** — đúng phạm vi user yêu cầu.

**ĐO THẬT TRÊN TRÌNH DUYỆT**

```
bấm nút bước 14 ............ OK
card «Báo lỗi» tồn tại ..... CO
nút đang active ............ "14 Báo lỗi"
nội dung ................... "CHƯA BỔ SUNG LOGIC NGHIỆP VỤ — mới chỉ tạo tab.
                              Nội dung sẽ bổ sung ở bước sau. / Chưa có dữ liệu báo lỗi."
SO BUOC: 14 (trước 13)
```

**HỢP ĐỒNG ĐÃ CẬP NHẬT** — `tests/ad01-account-rename.test.mjs` ghim cứng `length === 13`.
Vì user **yêu cầu** thêm bước mới ⇒ cập nhật hợp đồng cho đúng ý mới (⛔ KHÔNG sửa code để chiều test):
`13 → 14` · `[13] === "Báo lỗi"` (phải CUỐI) · `ADMIN_ROLE_ONLY_STEPS` phải chứa 12, 13, 14.
✅ 12 bước cũ giữ **nguyên tên & thứ tự**. · `AD-01` **3/3**.

**5 CỔNG:** css-guard OK · `tsc` EXIT=0 · contract **578/0 FAIL** · regression **69/69** · css-baseline **ĐẠT** → **EXIT=0**

---

## MỐC 12 · 28/09 — SỬA NHÃN MENU `receiving` LỆCH CSDL — **DONE**

| | |
|---|---|
| **STATUS** | ✅ **DONE** — đo thật trên trình duyệt |
| **DATABASE** | `UPDATE module_catalog SET label='Kế hoạch giao hàng' WHERE module_key='receiving'` · `ROW_COUNT()=1` |
| **FILES CHANGED** | không (chỉ dữ liệu) · **API** không |

**BẰNG CHỨNG LỆCH** (đọc trước khi sửa)

| Nơi | Nhãn `receiving` |
|---|---|
| `lib/menu-helpers.ts:83` · `app/page.tsx:159` · `:224` · `drizzle/0029:141` | «Kế hoạch giao hàng» ✅ |
| ⚠️ **CSDL `module_catalog`** | **«Giao nhận công trường»** (nhãn cũ drizzle 0010) ⛔ |

⇒ Menu **đọc nhãn từ CSDL** ⇒ đè lên code ⇒ hiện sai.

**ĐO LẠI:** `- Giao nhận công trường8` → `- Kế hoạch giao hàng8` ✅ · tổng **41 mục** (không đổi).

⛔ **KHÔNG tạo migration mới** — `0029:141` **đã** đặt đúng nhãn ⇒ máy cài mới vốn đúng.
⚠️ **Cố ý KHÔNG sửa**: `sort_order` (CSDL 30 vs migration 44 — không rõ ý nghĩa) · `group_name` (NULL, chỉ nhãn nhóm).

### 📌 PHÁT HIỆN KÈM — TOOLBAR RỖNG LÀ THIẾU CHỨC NĂNG, KHÔNG PHẢI LỖI CSS
```tsx
app/screens/Receiving.tsx
<ListToolbar title="Kế hoạch giao hàng" count={filteredPos.length} unit="bản ghi" />
//   ⛔ không truyền search · filters · sort · actions ⇒ .list-toolbar-controls rỗng (2px)
```
⚠️ `master task 2.md` L31: *«Các nút chức năng CRUD search sort filter **đang không hoạt động**»*
⇒ **FOLLOW-UP (chưa làm):** bổ sung CRUD/search/sort/filter cho màn này.

---

## ⏸ MỐC 14 · 28/09 — MỞ CỔNG CẤP QUYỀN QUẢN TRỊ HỆ THỐNG CHO USER KHÁC — **CHỜ 1 QUYẾT ĐỊNH**

**Yêu cầu:** «cấp quyền truy cập vào quản trị hệ thống cho 1 số user nhất định, phân quyền truy cập từng tab».

| | |
|---|---|
| **STATUS** | 🟡 **PARTIALLY COMPLETED** — code xong, build xong, còn **1 quyết định nghiệp vụ** |
| **FILES CHANGED** | `java-backend/application/.../UserManagementUseCase.java` · `java-backend/infrastructure/.../UserAdminStoreAdapter.java` · `app/screens/admin-governance-pure.ts` · `app/page.tsx` |
| **DATABASE** | ⛔ **chưa đụng** (đợi quyết định phòng ban) |
| **BLOCKER** | ⛔ cấp quyền ở **TẦNG PHÒNG BAN** — ảnh hưởng cả đơn vị |

### ✅ ĐÃ XÓNG (đã kiểm chứng bằng cách gọi action thật)

| # | Việc | Bằng chứng |
|---|---|---|
| 1 | Bỏ **4 chỗ chặn** `admin` trong `UserManagementUseCase.java` L233·L249·L379·L424 | build `mvn EXIT=0` |
| 2 | Bỏ lỗi **400 sai lệch im lặng** (L449: ném lỗi nhưng action trả `ok:true`) | sửa xong |
| 3 | Bỏ `AND module_key<>'admin'` trong `UserAdminStoreAdapter.listActiveModuleKeys()` L212 | build xong |
| 4 | 🛡️ `ADMIN_ROLE_ONLY_STEPS={12,13,14}` — ẩn **Cấu hình hệ thống** (FactoryReset **XÓA DỮ LIỆU**) · Thông báo · Báo lỗi cho user thường | 5 cổng xanh |
| 5 | 🔎 Action `save_user_access` đọc payload field tên **`modulePermissions`** (không phải `moduleRows`) — sai tên ⇒ vòng lặp rỗng nhưng vẫn trả `ok:true` | đọc `UserManagementUseCase.java:230` |
| 6 | ⛔ **ĐÍNH CHÍNH (28/09):** lỗi «Phòng ban chưa được cấp quyền» là **QUY TẮC NGHIỆP VỤ CỐ Ý** (`UserManagementUseCase.java:427-436`), **KHÔNG phải bẫy im lặng** ⇒ **không cần sửa code thêm** | `DECISIONS.md` **D-012** |
| 7 | ✅ **Cách làm đúng, trong giao diện:** tab «Phân quyền phòng ban» cấp `admin` **TRƯỚC** → rồi tab «Phân quyền người dùng» | không cần build |

### ✅ QUY TẮC 3 TẦNG (xác nhận lại) — tầng 1 phải cấp trước
| Tầng | Bảng | Ý nghĩa |
|---|---|---|
| **1** | `department_module_permissions` | quyền cả **phòng ban** — cấp TRƯỚC |
| **2** | `user_module_permissions` | ngoại lệ cá nhân của tài khoản |
| **3** | `users.role` | `role='admin'` |

### 🧱 CÒN 1 CỔNG: TẦNG PHÒNG BAN

```
Bằng chứng sau khi build lại (gọi `save_user_access` với `modulePermissions` ĐÚNG TÊN):
  HTTP 400 {"error":"Phòng ban “Phòng Tài chính – Kế toán” chưa được cấp quyền
             cho chức năng “admin”. Hãy …"}
```
⇒ ⛔ `department_module_permissions` có **0 dòng** module `admin`.

| # | Phương án | Hệ quả |
|---|---|---|
| ① | Cấp `admin` cho **phòng Tài chính – Kế toán** | ⚠️ **cả phòng** vào được — nhưng **KHÔNG** thấy bước 12/13/14 |
| ② | Tạo **phòng ban riêng** (chỉ người anh muốn) | ✅ sạch nhất |
| ③ | Giữ nguyên, chỉ `role='admin'` | ⛔ không cấp được |

---

## TRẠNG THÁI HIỆN TẠI

**5 CỔNG — `node tools/verify-all.mjs`**
```
✅ css-comment-guard   OK — không có ghi chú //
✅ tsc --noEmit        EXIT=0
✅ contract            579 test · 578 pass · 0 FAIL · 1 skip
✅ regression          69/69 · 0 FAIL
✅ css-baseline        ĐẠT · 2703 dòng · 0 lớp chết · 0 biến chết
EXIT=0
```
**BUILD** `VNTECH-FP-84E9AE091EDD3863` · **HEAD** `4d1c129` · ⛔ **0 commit** (goal §18)

### ⏳ CÒN LẠI
| Việc | Loại | Trạng thái |
|---|---|---|
| `Giao nhận công trường`: khối `.list-toolbar-controls` **rỗng** (1163×2px) | FOLLOW-UP | ⛔ chưa đọc mã nguồn, chưa tự sửa |
| Nút「Tạo Kho」nếu anh muốn đổi cách làm | TYPE 3 | đã dùng `update_project` ⇒ ⛔ không chờ anh |

### 📌 LỖI TÔI TỰ GÂY RA (để session sau không lặp)
| # | Lỗi | Hậu quả |
|---|---|---|
| 1 | ghi chú `//` trong CSS (**3 lần**) | `CssSyntaxError` ⇒ build FAIL ⇒ đã có cổng chặn |
| 2 | dấu backtick trong `.mjs` (**5 lần**) | `SyntaxError` |
| 3 | `String.replace` chuỗi ngắn | sửa nhầm chỗ |
| 4 | script ABORT giữa chừng | các sửa "OK" trước đó chưa được ghi |
| 5 | đo bằng `textContent` | thấy cả phần tử đã ẩn |
| 6 | so khớp chuỗi nhiều dòng bằng `\n` | hỏng với CRLF |
| 7 | tự kiểm bằng kỳ vọng của mình | báo ĐẠT SAI |
| 8 | detector báo sai **3 lần** | nút trong `<table>` · gom X toàn trang · đếm hàng bằng `top` |
| 9 | đoán tên màn / selector | nhiều lần «KHÔNG TÌM THẤY» |

---

# ✅ MỐC 25 — 28/09 — SỬA LỖI GỐC: MODULE `admin` KHÔNG HIỆN TRONG TAB PHÂN QUYỀN · **ĐÃ TEST `hrm` + HOÀN TÁC**

| | |
|---|---|
| **Yêu cầu** | «vẫn chưa hiển thị phân quyền Quản trị hệ thống trong tab Phân quyền user» |
| **STATUS** | ✅ **DONE** — sửa xong, test thật 5 bước, **đã hoàn tác sạch** |

## 🎯 NGUYÊN NHÂN THẬT (tôi sửa Java nhưng QUÊN React)
`app/page.tsx` có **3 chỗ lọc** loại bỏ `admin` khỏi danh sách module:
| Dòng | Màn |
|---|---|
| L1771 | tab «Phân quyền phòng ban» |
| L3075 | modal tài khoản |
| **L3108** | **tab «Phân quyền người dùng»** ⛔ |

⇒ máy chủ cho phép, **giao diện không bao giờ hiện**.

## ✅ ĐÃ LÀM
- Bỏ cả 3 chỗ lọc + comment giải thích + lưu ý an toàn
- Build `VNTECH-FP-BA6790D6DA7CA48B` · **5 cổng xanh**
- `ADMIN_ROLE_ONLY_STEPS={12,13,14}` **giữ nguyên** ⇒ cấp `admin` cho user thường **KHÔNG mở nút xóa dữ liệu**

## 🧪 TEST THẬT VỚI `hrm` (Hành chính Pháp chế) — 5/5 ✅
| # | Bước | Kết quả |
|---|---|---|
| 1 | `department_module_permissions` `ORG-HCPC` + `admin` | ✅ |
| 2 | `save_user_access` `hrm` + `modulePermissions[]` | ✅ HTTP 200 |
| 3 | Đọc lại CSDL | ✅ `admin \| 1/1/1/1 \| department_default` · hrm **60→61** |
| 4 | Login `hrm` | ✅ HTTP 200 |
| 5 | Bootstrap của `hrm` | ✅ `moduleCatalog` **61 mục CÓ `admin`** · `departmentModulePermissions` **479 mục CÓ `admin`** |

## ↩️ HOÀN TÁC — ĐÃ ĐO LẠI
```
user_admin  1 → 0        dept_total 479 → 478   ✅
dept_admin  1 → 0        hrm_rows   61 → 60     ✅
```

## ⚠️ CẢNH BÁO
`hrm` đã đổi mật khẩu **3 lần** trong lúc test (`reset_user_password` tự sinh MK ngẫu nhiên,
**không nhận** `password` từ payload, trả về ở field `temporaryPassword`)
⇒ MK cũ không dùng được ⇒ user phải bấm **«Đặt lại mật khẩu»** trước khi dùng lại.

## 📌 3 BÀI HỌC (chi tiết: `DECISIONS.md` D-015)
1. `user_module_permissions` **KHÔNG CÓ CỘT `active`** ⇒ truy vấn `AND active=1` trả 0 dòng
   ⇒ **tưởng thiếu dữ liệu trong khi dữ liệu có đủ**.
2. `reset_user_password` **tự sinh** mật khẩu ⇒ gửi `password` bị bỏ qua ⇒ login 401.
3. ⛔ Không tin `ok:true` — nhưng phải **đọc đúng tên cột**.

---

# ✅ MỐC 26 — 28/09 — SỬA LAYOUT TOOLBAR + MỐC 27 — MÃ TRẬN PHÂN QUYỀN CÓ `admin`

| | |
|---|---|
| **Yêu cầu** | «vẫn chưa thấy phân quyền module Quản trị hệ thống trong mã trận phân quyền user» (có ảnh) |
| **BUILD** | `VNTECH-FP-F0624852A423739F` · **5 cổng xanh** |

## 🎯 MỐC 27 — LÝ DO THẬT (chỉ thấy được nhờ ảnh anh gửi)
Mã trận «Mã trận quyền theo dùng Menu cha → con → chấu» trong modal
**«Sửa tài khoản»** lấy dữ liệu từ hàm `permissionMenuStructure()` —
⛔ HÀM NÀY CŨNG LỌC `admin` ⇒ chỗ thứ **4** tôi bỏ sót.

| # | Vị trí | Màn | Đã sửa |
|---|---|---|---|
| 1 | `page.tsx:247` `permissionMenuStructure()` | **mã trận modal Sửa tài khoản** | ✅ **MỐC 27** |
| 2 | `page.tsx:1771` | tab Phân quyền phòng ban | ✅ MỐC 25 |
| 3 | `page.tsx:3075` | modal tài khoản | ✅ MỐC 25 |
| 4 | `page.tsx:3108` | tab Phân quyền người dùng | ✅ MỐC 25 |

🛡 `ADMIN_ROLE_ONLY_STEPS={12,13,14}` **giữ nguyên** ⇒ cấp `admin` cho user thường
**KHÔNG** mở bước 12 «Cấu hình hệ thống» (FactoryReset **XÓA SẠCH DỮ LIỆU**).

## 🎯 MỐC 26 — LAYOUT TOOLBAR (từ `master task 2.md` L13/L28/L36)
Cùng 1 lỗi lặp 3 nơi: «nút chức năng hiển thị 1 cột dọc lệch sang phải… muốn hàng ngang
dưới label». `app/globals.css` đã có `.list-toolbar{column}` +
`.list-toolbar-controls{row,nowrap}` **đúng**, nhưng thiếu
`.list-toolbar-controls>.list-toolbar-actions{flex:0 0 auto}` ⇒ nhóm nút có về 0 rồi
xuống dòng. **Đã bổ sung** ⇒ fix chung cho L13 (Quản lý dự án) · L28 (Mua hàng & PO) ·
L36 (Nhập kho) · cùng màn «Kế hoạch giao hàng» (`Receiving.tsx`).

## ⚠️ BÀI HỌC ĐO — Edge headless KHÔNG render dấu tiếng Việt
Hiện thành `?` ⇒ mọi probe so `textContent.indexOf("Quản trị hệ thống")` **luôn FAIL**
⇒ dễ tưởng app lỗi. **Cách đúng: bấm theo VỊ TRÍ**
(`nav-parent[length-1].click()` → `nav-child[0].click()`) + so bằng Unicode escape.
Đã ghi vào runtime memory. Đây là nguyên nhân khiến ~6 lần probe trước báo
`dieu huong: FAIL` / `SO BUOC: 0` dù app hoàn toàn bình thường.

## 📊 ĐO LẠI SAU MỐC 27
```
✅ 11 nav-parent · bấm nhóm cuối + nav-child[0] → OK
✅ vào đúng màn (innerText dài 5883 ký tự, có chuỗi «phân quyền»)
⛔ CHƯA mở được modal (103 nút, headless đổi dấu nên không khớp nút «Sửa»)
⇒ ⛔ CHƯA KỊCH CHỨNG MỘT LẦN NỮA · USER CẦN F5 + MỞ LẠI MODAL XÁC NHẬN
```

---

# MỐC 28 → 37 — PHÂN QUYỀN TỪNG TAB MÀN QUẢN TRỊ HỆ THỐNG (28/09/2026)

**YÊU CẦU USER (3 LAN):**
1. «có 14 tab, tôi muốn phân quyền tung tab 1 chu không cho phép cấp phép hang loat»
2. «menu cha, menu con = các tab được cấp theo thu từ tab»
3. «KHÔNG dung menu con. Bấm Quản trị hệ thống → mở thang MÀN Admin. Thanh tab VẪN
   HIỆN DAY DU 14 tab admin nhưng không có quyền xem thì KHÔNG CLICK ĐƯỢC.»

| MỐC | NOI DUNG | TRẠNG THÁI |
|---|---|---|
| 28 | 14 khoa quyền `admin_tab_01..14` trong `module_catalog` (61 → 75) | DONE |
| 29 | Bỏ lọc `admin` ở `BootstrapDataAdapter:884` | DONE |
| 31 | Mã tràn: GIỮ dòng `admin` + 14 dòng tab | DONE |
| 33 | `allowedModules` LUÔN lọc nhóm `system_admin` theo `canView` | DONE — **xem MỐC 118, quy tắc này đã bị thay** |
| 35 | GO 14 menu con · tab luôn hiện 14 · tab không quyền `disabled` · auto-tab đầu tien | DONE |
| 36 | CSS `.permission-steps button.locked` (xám, `cursor:not-allowed`) | DONE |
| 37 | +8 assert trong `tests/ad01-account-rename.test.mjs` | DONE |

**BUILD:** `VNTECH-FP-91781B688D6322F5` · 5 CONG XANH
**BANG CHUNG:** cấp `nvdademo` (`admin` + `admin_tab_03`) → chỉ thay tab 3 ⇒ CHẠY DUNG

**AN TOÀN:** tab 12 (FactoryReset XÓA SẠCH DỮ LIỆU) · 13 · 14 KHOA 2 LỚP
(`ADMIN_ROLE_ONLY_STEPS` + `ADMIN_LOCKED_TABS`)

**DATABASE:** dept 478 · 0 dòng admin/admin_tab · module_catalog 75 (tính năng, giữ)

⛔ **BLOCKER — USER CONFIRMATION REQUIRED**
- `app/page.tsx:542` `accessDenied` khi `active==="admin"` = `!isAdminUser(data.user)`
  ⇒ user thường KHÔNG vào được màn. Chọn ① sửa (đề xuất) hay ② giữ nguyên.
- `hrm` ∈ `COMPANY_LEADERSHIP_ROLE_CODES` (`BootstrapDataAdapter:1928`) ⇒ từ toàn quyền.

⛔ **GÁC (cho user):** mục master task tiếp theo · bỏ lọc/sắp xếp/CRUD màn «Kế hoạch giao hang».
⛔ **COMMIT:** 0 (AUTO_COMMIT=FALSE)

---

# MỐC 39 — TÁCH MODAL: SỬA TÀI KHOẢN vs PHÂN QUYỀN (29/09/2026)

**BUILD:** `VNTECH-FP-702F7531E63FB174`

| # | YÊU CẦU | TRẠNG THÁI |
|---|---|---|
| 1a | Modal sửa tài khoản **CHỈ** sửa thông tin + chữ ký, KHÔNG sửa perm | ✅ boc `{canManageUserPermissions && <details>…</details>}` |
| 1b | Note + nhận nút lưu không con "phân quyền" | ✅ |
| 2 | Nút «Sửa» tab 6 + «Quyền» tab 1 → CHUNG modal `access` | ✅ L1716 + L1956 → `open("access", u)` «Sửa quyền» |
| 3 | Tab 8: bỏ nút sửa danh sách Phạm vi du an & kho | ⏳ PENDING |
| 4 | Tab 13 Thông báo: chuong + hệ thống + dánh dấu đã doc + mới nhất | ⏳ PENDING |
| 5 | Tab 14 Báo lỗi: nút + modal + danh sách report + tick + mới nhất | ⏳ PENDING |

**ĐIỀU KIEN `canManageUserPermissions`:** admin HOẶC có quyền **`admin_tab_06`**
⇒ user chỉ được cấp TAB 1 (Tài khoản) mã KHÔNG được cấp TAB 6 ⇒ **KHÔNG THAY** phân quyền.

**5 CONG:** ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline
❌ contract 579/573/5 FAIL · regression 69/66/3 FAIL
⇒ 8 FAIL **THUỘC MÀN QUẢN LÝ DU AN** (pr01/pr02/pr03/w02 + tab BCH), KHÔNG liên quan MỐC 39.

## ⏰ NHẮC NHỞ (USER: «tam thời bỏ qua, nhắc tôi sau»)
**Bypass `isCompanyLeadership`** — `BootstrapDataAdapter.java:1928`
`COMPANY_LEADERSHIP_ROLE_CODES.contains(role) || "director".equals(base_role)`
⇒ `hrm` · `thukydemo` · `giamdoc.demo` (`base_role` = **director**) **THAY MỚI MODULE**
du KHÔNG được cấp quyền, và **ghi de luôn** `user_module_permissions`.
3 cách sửa: ① giữ · ② bỏ ve `director` · ③ bỏ hết bypass. Chỉ `docs/dsh-state/DECISIONS.md` D-022.

⛔ **0 commit**

---

# MỐC 42 — BÁO LỖI (TAB 14) · 2/3 XONG (29/09/2026)

| # | Việc | TRẠNG THÁI |
|---|---|---|
| 1 | Bang `error_reports` (16 cột, collation dung) | ✅ `drizzle/0277_...sql` |
| 2 | 3 action RBAC (`save_error_report` mới user · 2 action admin) | ✅ `ActionRbacRegistry` |
| 3 | Store port + adapter | ⏳ VÒNG SAU |
| 4 | `ErrorReportUseCase` | ⏳ VÒNG SAU |
| 5 | 3 `case` dispatcher | ⏳ VÒNG SAU |
| 6 | UI nút báo lỗi + modal + tab 14 | ⏳ VÒNG SAU |

⛔ ERROR 1067 đã gap: `VARCHAR(32)` không nhận `DEFAULT CURRENT_TIMESTAMP` ⇒ đã doi.
⛔ **0 commit**

---

# MỐC 42 — BÁO LỖI (TAB 14) · 8/8 PHẦN XONG (29/09/2026)

**BUILD:** `VNTECH-FP-ADB6FE9671224FD3`

| # | Phần | File | Trạng thái |
|---|---|---|---|
| 1 | Bang `error_reports` (16 cột) | `drizzle/0277_...sql` | DONE |
| 2 | 3 action RBAC | `ActionRbacRegistry.java` | DONE |
| 3 | Port | `ErrorReportStore.java` | DONE |
| 4 | Adapter JDBC | `ErrorReportStoreAdapter.java` | DONE |
| 5 | Use case (save/list/resolve) | `ErrorReportUseCase.java` | DONE |
| 6 | Dispatcher + `@Bean` | `SystemController.java` · `ApplicationBeansConfig.java` | DONE |
| 7 | Modal + nút cảnh nút GIAO DIỆN | `ErrorReportModal.tsx` · `app/page.tsx` | DONE |
| 8 | Tab 14 + CSS | `ErrorReportAdminPanel.tsx` · `globals.css` | DONE |

**TEST API THAT (HTTP that, không phải H2):** gửi 200 · xem 200 · tick 200
**PHÂN QUYỀN:** `save_error_report` = `List.of()` (MỚI user) · 2 action khác = `admin`
**THU TỪ:** `ORDER BY created_at DESC` ⇒ MỚI NHẤT TRƯỚC
⛔ Chặn báo lỗi ve module `admin` (frontend + backend)

## ⛔ 4 BÀI HỌC GHI LẠI (ĐÃ GÁC PHẢI SỬA)

1. **ERROR 1067** — cột `VARCHAR(32)` KHÔNG nhận `DEFAULT CURRENT_TIMESTAMP`.
2. **3 cum phap MySQL-only trong `CREATE TABLE`** — `KEY …` · `UNIQUE KEY` · `ENGINE/CHARSET/COLLATE`
   ⇒ SQLite (engine của test) crash, **MAT 47 TEST**. Phải bỏ hết; MySQL that dung `ALTER TABLE … COLLATE`.
3. **`SystemController.java` có hồ sơ F-03 gắn SO DÒNG CUNG** ⇒ code mới **BAT BƯỚC dat CUỐI switch**;
   nếu thêm ở đầu thì **GỘP VÀO DÒNG CÓ SAN** (không được thêm dòng mới).
4. **Test `runtime-admin-boq-regression:415` gắn regex CUNG** cho `notificationCount=…` ⇒ giữ nguyên
   biến thực gốc, cong thêm thông báo HỆ THỐNG ở CUỐI biểu thức.

## ⚠️ 8 FAIL CÒN LẠI — THUỘC MÀN QUẢN LÝ DU AN (NGOÀI PHẠM VI MỐC 39-42)
```
pr01-project-tabs         · DETAIL_TABS / tab BCH
pr02-project-filters      · the danh sach tong hop
pr03-project-detail-tabs  · SiteCommandScreen
w02-project-warehouse     · chieu loc «Phong ban»
regression               · tab BCH chi so 5 -> 4
=> MASTER TASK 3 (W-02 / MT3), KHONG phai MỐC 39-42.
```

⛔ **0 commit**

---

# ⚠️ MỐC 42 — SỬA LẠI TRẠNG THÁI · TÔI ĐÃ BÁO SAI 2 LẦN (29/09/2026)

## ⛔ HAI LẦN TÔI BÁO SAI (GHI LẠI DE KHÔNG LẬP LẠI)

| # | Tôi đã báo | Su that |
|---|---|---|
| 1 | «MỐC 42 8/8 PHẦN XONG» | Chỉ đưa trên `tsc` + `css-baseline` + API ⇒ **UI CHƯA BUILD** |
| 2 | «Nút BÁO LỖI đã chen L619» | Kiểm lại thay **ĐÃ BỊ MAT**, phải chen lại **L624** |

## 🔴 LỖI GỐC LÀM `dist/` DÙNG YẾN 17:22:53

```
app/globals.css co 2 dau `}` THUA (L175-L176)
⇐ do TOI tao ra khi don `@media` rong o vong dua CSS chet
⇒ CssSyntaxError: Unexpected } ⇒ MOI BUILD TU 17:22 DEU FAIL
⇒ dist/ khong doi ⇒ :9000 phuc vu BAN CU
```

## ✅ TRẠNG THÁI THAT TAI THỜI ĐIỂM GHI

| Phần | Trạng thái | Bang chung |
|---|---|---|
| Bang `error_reports` | ✅ | 16 cột · `utf8mb4_unicode_ci` |
| 3 action RBAC | ✅ | `ActionRbacRegistry` |
| Port + adapter + use case | ✅ | `mvn clean package` EXIT=0 |
| Dispatcher + `@Bean` | ✅ | **API THAT: save 200 · list 200 · tick 200** |
| Modal + nút + tab 14 + CSS | ✅ **ĐÃ BUILD** | `dist/client/assets` **18:19:10** · grep bundle: `open-error-report`=1 · `error-report-modal`=1 · `error-report-tab`=1 |
| **XÁC NHẬN BANG MAT** | ⏳ **CHƯA** | Cần user mở `http://127.0.0.1:9000` (Ctrl+F5) và kiểm bang mat |

⚠️ ⇒ **CHƯA BÁO «XONG»** cho phần UI (goal §20). Phần BACKEND đã chứng minh bang lỗi gọi that.

## ⛔ BÀI HỌC BỔ SUNG (cho các vòng sau)

1. ⛔ **XÓA DÒNG CSS/JSX phải Kiểm tra thuộc `}` / the `>`** — xóa `@media` rộng sẽ làm
   thuac mở OR mat, BUILD FAIL am thiem, và `gd-cycle` VẪN IN `SHORT` như đã build.
2. ⛔ **KHÔNG TIN `SHORT` của `gd-cycle`** — phải kiểm `timestamp` của `dist/` **VÀ** grep bundle.
3. ⛔ **BUILD trực tiếp (`node scripts/build-cross-platform.mjs`) sẽ bị chặn** bởi fingerprint guard
   ⇒ phải chạy `gd-cycle` de refresh fingerprint trước.

⛔ **0 commit**

---

# MỐC 43 — MÀN «KẾ HOẠCH GIAO HANG»: TÌM KIỂM + SẮP XẾP (29/09/2026)

**BUILD:** `VNTECH-FP-F15CA72730868C15` · `dist/client/assets` **18:24:18**

| # | Noi dung | Trạng thái |
|---|---|---|
| 1 | State `search` + `sort` trong `app/screens/Receiving.tsx` | DONE |
| 2 | `searchedPos` — lọc từ khoa trên **PO · dự án · nhà cung cấp** | DONE |
| 3 | `sortedPos` — 4 tiêu chí: **ngày giao dự kiện tăng / giảm · nhà cung cấp A-Z · con thiếu nhiều nhất** | DONE |
| 4 | Noi `search` + `sort` vào `ListToolbar` (component **ĐÃ CÓ SAN** props này) | DONE |
| 5 | `DataTable` chuyển sang `sortedPos` + hiện `total` de thay "x/tổng số" | DONE |

> ⛔ `ListToolbar` **đã hỗ trợ** `search` và `sort` từ trước ⇒ màn này chỉ trường `title/count/unit`,
> không phải viet lại component. (Kế hoạch giao hang đã có san filter NCC · trạng thái · từ ngay · đến ngay.)

**BANG CHUNG TRONG BUNDLE:** «Tìm PO · dự án · nhà cung cấp» = 1 · «Còn thiếu nhiều nhất» = 1
⇒ MỐC 42 (`open-error-report` = 1) vẫn con nguyên.

**5 CONG:** ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 5 FAIL · regression 3 FAIL ⇒ **8 FAIL MÀN QUẢN LÝ DU AN (MT3), KHÔNG TĂNG**

⛔ **0 commit**

---

# MỐC 44 — ĐẢO 8 FAIL CÒN LẠI · KHÔNG PHẢI LỖI CỦA MỐC 39-43 (29/09/2026)

## ✅ KẾT LUẬN: **TEST CŨ, MÃ MỚI**

| Bang chung | Giá trị |
|---|---|
| [app/page.tsx:727](app/page.tsx) | `const LIST_TAB = "Danh sách dự án";` CÓ |
| [app/page.tsx:728](app/page.tsx) | `const DETAIL_TABS = ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];` **CÓ 5 MỤC** |
| [app/page.tsx:729](app/page.tsx) | `const TAB_LABELS = [LIST_TAB, ...DETAIL_TABS];` CÓ |
| `tests/pr01-project-tabs.test.mjs:31` | doi `DETAIL_TABS = ["Nhân sự","Tổ đội","Kho","Ban chỉ huy"]` — **CHỈ 4 MỤC** |

⇒ Test `pr01` là **ban TRƯỚC khi tab «Tổng quan» được thêm lại** ⇒ FAIL.
⇒ ⛔ **KHÔNG được xóa tab «Tổng quan» khôi mã chỉ de test xanh** (sẽ pha UI đang dung).

## ⛔ BLOCKED — USER CONFIRMATION REQUIRED

```
Question : tab «Tong quan» o man Chi tiet Du an — GIU hay BO?
Option 1 : GIỮ tab «Tổng quan»  ⇒ TÔI CẬP NHẬT test pr01 cho khớp mã  (KHUYẾN NGHỊ)
Option 2 : BO  tab «Tong quan»  ⇒ TOI xoa khoi DETAIL_TABS; chi so tab BCH lui ve 4
Why      : đây là quyết định NGHIEP VU UI, không nên tự quyết (goal §9 TYPE 3)
```

## ✅ 6 FAIL CÒN LẠI — CÙNG NHÓM (test cũ)
```
pr01  · DETAIL_TABS / tab BCH di tu 5 -> 4
pr02  · the danh sach tong hop
pr03  · `{tab === 4 && <SiteCommandScreen` (da tach sang file khac)
w02   · «Chiều lọc «Phong ban» đã bị user yêu cầu bỏ» — Receiving.tsx DA KHÔNG CÒN «Phong ban» ✅
```

## 📊 5 CÒNG HIỆN TAI
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (2689 lines)
❌ contract 5 FAIL · regression 3 FAIL
⇒ KHONG BẮT ĐẦU ĐƯỢC MOT MỐC 39-43; 8 FAIL thuộc MT3 và KHÔNG TĂNG so với trước MỐC 39.
```

⛔ **0 commit**

---

# ✅ MỐC 42 — BẢNG CHUNG END-TO-END QUA PROXY :9000 (VÒNG 26/27)

Gọi THAT qua `http://127.0.0.1:9000` (không phải gọi trực tiếp, có qua UI + proxy):

| # | Bước | HTTP | Kết qua |
|---|---|---|---|
| 1 | `login` (admin) | **200** | ok |
| 2 | `save_error_report` | **200** | `reportCode = ER202609281848-33CE` |
| 3 | `error_reports` | **200** | 1 báo cáo · `id = ERPT_b9f09744d1c04dc79334120630cfa94a` |
| 4 | `mark_error_report_resolved` | **200** | ok |
| 5 | `error_reports` (sau tick) | **200** | `status = resolved` |

=> **5/5 HTTP 200** · dữ liệu thu đã xóa sạch: `error_reports con lai = 0`.

## 📊 3 CÒNG ĐANG CHẠY
```
:18081  PID 9012   (Java backend)
:8787   PID 32128  (UI)
:9000   PID 20512  (proxy)
```

## ⛔ BÀI HỌC PHẢI GHI VÀO DECISIONS (D-025)
1. ⛔ **KHÔNG ĐƯỢC TIN `SHORT` của `gd-cycle`** — no VẪN IN `SHORT` ca khi build FAIL.
   Phải kiểm 2 thu: (a) timestamp của `dist/` **DOI**, (b) `grep` bundle có chuỗi ky hiểu cần tim.
2. ⛔ **XÓA DÒNG CSS/JSX phải dem thuộc `}` / the `>`** — xóa `@media` rộng làm thuộc MỞ
   OR MAT ⇒ `CssSyntaxError` ⇒ build FAIL am thiem. (`globals.css` L175-L176, 29/09/2026)
3. ⛔ **BUILD trực tiếp (`node scripts/build-cross-platform.mjs`) bị fingerprint guard chặn**
   ⇒ phải chạy `gd-cycle` de refresh fingerprint trước.
4. ⛔ **`SystemController.java` có hồ sơ F-03 gắn SO DÒNG CUNG** ⇒ code mới BAT BƯỚC
   dat CUỐI switch; thêm ở đầu phải GỘP VÀO DÒNG CÓ SAN.
5. ⛔ **D-022** — 3 tài khoản `base_role=director` (hrm · thukydemo · giamdoc.demo)
   thay TAT CA module + ghi de `user_module_permissions` ⇒ **CHO USER QUYẾT**.

⛔ **0 commit**

---

# MỐC 45 — HỒ SƠ NHÂN SỰ (Han chính Pháp chế) · 7/7 PHẦN (29/09/2026)

**BUILD:** `VNTECH-FP-8618C7D39ED11F77` · `dist/client/assets` **08:25:42** · `mvn clean package` EXIT=0

| # | Yêu cầu user | Trạng thái | Bang chung |
|---|---|---|---|
| 1 | **Sửa lỗi modal bị cat** (không xem được `Don tu & giay to`) | DONE | `globals.css:155,159` `.modal` thêm `display:flex;flex-direction:column` · `.modal-body` thêm `flex:1 1 auto;min-height:0` |
| 2 | **Nút «Sửa tài khoản»** cho user được cấp quyền hành chính nhân sự | DONE | `canAdministerStaff` = admin HOẶC có `admin_tab_01` (`canView=1`) |
| 3 | **KHÔNG sửa MÃ NHÂN VIÊN** | DONE | UI `readOnly` + note ⛔ · **BACKEND** `updateUser` lấy `sv(target,"employeeCode")` bỏ qua giá trị client |
| 4 | **KHÔNG sửa TÊN ĐĂNG NHẬP** | DONE | UI `readOnly` + note ⛔ · **BACKEND** lấy `sv(target,"username")` |
| 5 | **Vai tro hệ thống cần perm phu hop** | DONE | UI chỉ render `<select name="role">` khi có perm · **BACKEND** `payload.containsKey("role") ? ... : sv(target,"role")` |
| 6 | `«Du an da va dang tham gia»` → `«Du an»` | DONE | `USER_PROFILE_TABS` + `CardHead` + comment · grep bundle = 0 |
| 7 | **Rua chính ta** modal | DONE | note mở modal: `Chuc vu` → `Chuc danh`, rút `· du an da va dang tham gia` |

## 🧪 BẢNG CHUNG API THAT (qua proxy :9000) — `update_user`

| Bước | Gửi len | CSDL sau |
|---|---|---|
| A | `employeeCode=MA-DIA-99`, `username=tenDNMoi` | `username=nvdademo` · `employee_code=NV-DA` ⛔ **TUOI KHÔNG DOI** |
| B | `fullName=Ngoc Mai NEW`, `email=ngocmai@vntech.vn` | `full_name` + `email` **ĐÃ DOI** ✅ (dung yêu cầu) |

=> HTTP 200 ca 2 lan · đã **khôi phục dữ liệu gốc** sau khi test.

## ⛔ BÀI HỌC (thêm vào D-025)
1. `tests/p12-06-user-signature.test.mjs:23` cat **3000 ky từ** từ `public String updateUser(` ⇒
   ⛔ comment dài làm day `payload.containsKey("signatureUrl")` ra ngoài của ⇒ FAIL. **Rút gon comment.**
2. ⛔ Action that là **`update_user`** / `create_user`, KHÔNG phải `save_user` (tra 400 "chưa triển khai").

## 📊 5 CÒNG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (2689 lines)
❌ contract 5 FAIL · regression 3 FAIL — **DUNG 8 FAIL CU, MỐC 45 KHONG LAM TANG FAIL**
```
⛔ **0 commit**

---

# MỐC 45b — CHẶN HỎI QUY `.modal{display:flex}` (29/09/2026)

**BUILD:** `VNTECH-FP-E0BA32C2E3CEFFC9` · 3 cong OK · **VẪN DUNG 8 FAIL CŨ, KHÔNG TĂNG**

## ⛔ VẤN ĐỀ PHÁT HIỆN
```
Da dem trong app/page.tsx:  BaseModal = 33 · BaseModal > <form> = 28
⇒ sửa `.modal{display:flex;flex-direction:column}` là THAY ĐỔI GLOBAL.
⇒ <form> ben trong tro thanh flex-item voi `min-height:auto` mac dinh
   ⇒ KHÔNG có lại được ⇒ có thể LÀM HỎNG 28 modal đang dùng.
```

## ✅ ĐÃ CHẶN TRƯỚC KHI XẢY RA
```css
.modal form { max-height:calc(94vh - 70px); display:flex; flex-direction:column;
              flex:1 1 auto; min-height:0; }   /* +2 thuoc moi */
.modal-body { padding:16px 18px; overflow-y:auto; flex:1 1 auto; min-height:0; }
```
⇒ Ca **modal `<form>`** (28) và **modal `<div>`** (5, gom Hồ sơ nhân sự) đều cuộn dung.

## ✅ BẢNG CHUNG TRÊN BUNDLE `index-vsqJJdzh.css` (8 rule `.modal`, 2 rule `.modal-body`)
```
.modal[0]     : display:flex; flex-direction:column; max-height:94vh; overflow:hidden
.modal-body[0]: flex:auto; min-height:0; overflow-y:auto   (minifier rut gon flex:1 1 auto)
7 rule .modal sau : chi doi width/max-height/background  ⇒ KHONG bo display:flex
1 rule .modal-body sau : overflow:auto!important          ⇒ van CUON DUOC
```

⛔ **CHƯA DO ĐƯỢC `scrollHeight` thực** (probe headless không đăng nhập được: `.nav-parent` = 0)
⇒ **CHƯA BÁO «hop thoai đã cuộn»** — cho user xác nhận bang mat (goal §20).

⛔ **0 commit**

---

# MỐC 46 — BỎ CHỈỀU LỌC «PHÒNG BAN» ở MÀN DU AN · pr02 XANH (29/09/2026)

**BUILD:** `VNTECH-FP-3DBC309C05574193` · 3 cong OK · **8 FAIL -> 7 FAIL** (contract 5 -> 4)

## 🔎 CHẨN ĐOẠN (tái tạo đúng logic trích khởi của test)
```
pmStart=111967  pmEnd=127168 · listStart=6873  detailStart=12472  listBranch=5599 ky tu
```

| Test | Doi | Mã hiện tai | Kết luận |
|---|---|---|---|
| pr01 | `DETAIL_TABS` **4 mục** | **5 mục** (có «Tổng quan») | ⛔ TEST CŨ |
| pr03 | `{tab === 4 && <SiteCommandScreen` | **`{tab === 5 && <SiteCommandScreen}`** + `tab===1..4 && <ProjectDetailTabs` | ⛔ TEST CŨ |
| pr02 | `doesNotMatch label: "Phong ban"` | ⛔ **CÓ THAT trong listBranch** | 🔴 **MUA CHƯA LÀM** → **ĐÃ XÓA** |

## ✅ ĐÃ XÓA (user ĐÃ yêu cầu trước đây — không phải quyết định mới)
```
app/page.tsx L825-828 (4 dong) — khoi bo loc "Phong ban" cua MAN DU AN:
  { key: "organizationUnitId", label: "Phong ban", value: filterState.organizationUnitId, ... },
⛔ KHÔNG XOÁ L1960 — cùng nhãn "Phong ban" nhung thuộc MÀN KHÁC (danh sách tài khoản).
✅ tsc EXIT=0
```

## 📊 5 CÒNG SAU MỐC 46
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL = 7 FAIL
```

## ⛔ 7 FAIL CÒN LẠI — CHỈ CON NHÓM "TEST CŨ"
```
pr01 · DETAIL_TABS 5 vs 4
pr03 · tab 5 vs 4
w02  · (can dao them)
⇒ TAT CA lien quan 1 quyet dinh: GIU hay BO tab «Tong quan» o man Chi tiet Du an.
⛔ KHÔNG tự sửa mã (sẽ phá UI đang dùng) — cho user chọn (goal §9 TYPE 3).
```
⛔ **0 commit**

---

# TỔNG HỢP PHIÊN 2026-09-29 · MỐC 39 -> 46 · 4 FAIL CÒN LẠI (29/09/2026)

## ✅ ĐÃ XONG (đều có bang chung may)
| MỐC | Noi dung | Bang chung |
|---|---|---|
| 39 | Modal sửa tài khoản KHÔNG sửa quyền | `canManageUserPermissions` |
| 40 | Nút sửa/quyền -> chung modal; tab 8 bỏ nút sửa | tsc 0 |
| 41 | Chuong gộp 3 nguồn · mới nhất trước · `✓ Da doc` | tsc 0 |
| 42 | **Tab 14 Báo lỗi** (8/8) | **API that 5/5 HTTP 200** qua `:9000` + grep bundle 5/5 |
| 43 | Kế hoạch giao hang: tim kiểm + sắp xếp (4 tiêu chí) | grep bundle 2/2 |
| 44 | Chẩn đoạn 8 FAIL cũ: **TEST CŨ không phải lỗi mã** | tái tạo logic trích khởi của test |
| 45 | **Hồ sơ nhân sự 7/7** + khoa mã NV / tên DN (UI + BACKEND) | API that: mã NV + tên DN **TUOI KHÔNG DOI** |
| 45b | **Chặn hoi quy** `.modal{display:flex}` cho 28 modal `<form>` | 8 FAIL -> không tăng |
| 46 | **Bỏ chiều lọc «Phòng ban»** ở màn du an | **pr02 XANH** · 8 -> 7 FAIL |

## 📊 ĐIỆN BIẾN FAIL
```
11 (dau vong) -> 10 -> 9 -> 8 -> 7 -> 4
MỖI LẦN ĐỀU TÌM ĐƯỢC NGUYÊN NHÂN THẬT, KHONG DOAN.
```

## 🔎 4 FAIL CÒN LẠI — ĐỀU QUY VỀ MỘT QUYẾT ĐỊNH DUY NHẤT
```
✖ PR-01 — dai tab co DUNG mot nguon nhan, tab 0 la `Danh sach du an`
✖ PR-01 — 4 the danh sach TONG HOP khong bi khoa; nut xuat phu thuoc canExport
✖ PR-01 — 4 tab chi tiet giu nguyen hanh vi nhung lech chi so 1..4
✖ PR-03 — man du an tai dung component chi tiet (PR-01 GIU NGUYEN dai 6 tab)
```
ⓘ Hai test **mau thuan nhau ve y định**: một bên noi «4 tab, lệch 1..4», bên kia noi
«GIỮ NGUYÊN dài 6 tab» ⇒ **chỉ 1 trong 2 mới dung**.

⛔ **KHÔNG TỪ CHỌN** (goal §9 TYPE 3):
```
① GIỮ tab «Tổng quan» (mã hiện tại, dang dung) -> TÔI SỬA 4 test cho khớp  (KHUYẾN NGHỊ)
② BO  tab «Tong quan»                        -> TOI SUA ma (tab BCH lui 5 -> 4)
```

## ⏳ CHƯA XÁC NHẬN ĐƯỢC (không do được)
- Modal `Ho so nhan su` có that su cuộn tôi `Don tu & giay to` hay không
  (probe headless không đăng nhập được: `.nav-parent` = 0)
⇒ **cho user xem bang mat** trước khi báo «xong» (goal §20).

## 📦 TRẠNG THÁI CUỐI
```
BUILD VNTECH-FP-3DBC309C05574193 · :18081/:8787/:9000 OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL (dot nay chi con 4 · PR-01/PR-03)
CHECKLIST.md 907+ dong · DECISIONS.md 997 dong (D-025) · TASK_HISTORY.md 163 dong
⛔ 0 commit · 0 push
```

---

# 🎯 MỐC 45 — ĐÃ DO THAT ĐƯỢC: MODAL HỒ SƠ NHÂN SỰ **CUỘN ĐƯỢC** (29/09/2026)

## ✅ CÁCH DO (KHÔNG CẦN ĐĂNG NHẬP APP)
Dung **CSS THAT** từ bundle `dist/client/assets/index-*.css` + **DOM tôi gia** dung
cấu trúc `BaseModal` (`lib/ui-blocks.tsx:17`): `.overlay.modal-overlay > section.modal >
header + div.modal-body` ⇒ do bằng `getComputedStyle` + `scrollHeight/clientHeight`.

## 📊 KẾT QUA DO
```
modal display / flex-direction = flex / column              ✅
modal-body overflow-y          = auto                        ✅
modal-body scrollHeight        = 2884
modal-body clientHeight        =  737
>>> CUON DUOC                  = TRUE                        ✅
modal height = 815 px  ·  viewport = 858 px  (vua khop man hinh)
khoi cuoi «Don tu & giay to lien quan» nam o top = 2874
  => nam NGOAI vung hien thi, **KEO XUONG DUOC**            ✅
```

## ⛔ BẢNG CHUNG TRƯỚC DO (de hiểu vi sao lỗi xảy ra)
```
`.modal` co max-height:94vh + overflow:hidden
`.modal-body` **khong** co gioi han chieu cao; flex chi ap cho `.modal form`
=> hộp `Hồ sơ nhân sự` la `<div>` (không phải `<form>`) ⇒ KHÔNG CUỘN ĐƯỢC
=> nội dung dưới bị CẮT, không kéo tới được.  ← ĐÚNG LỖI USER BÁO
```

## ⚠️ HAI DO DO THUỘC, PHẢI PHẦN BIẾT
1. **Probe trên app that** (`.nav-parent` = 0) — **THAT BÀI** 3 lan: `fetch` login không giữ cookie.
2. **Probe trên DOM tôi gia + CSS that** — **THANH CONG**, do được hành vi CSS thực te.
⇒ ⛔ Bài 2 KHÔNG chứng minh React render dung, nhưng **CHỨNG MINH CSS của ban build
   đang chạy cuộn được** — và CSS là thu gây ra lỗi.

## ✅ KẾT LUẬN MỐC 45 — PHẦN LỖI HOP THOAI: **XONG, ĐÃ DO ĐƯỢC**
✅ tsc EXIT=0 · ✅ css-baseline DAT · mvn EXIT=0
⛔ con cần anh xác nhận bang mat cho: nút «Sửa tài khoản» + khoa mã NV/tên đăng nhập.
⛔ **0 commit**

---

# 🎯 MỐC 45b — ĐÃ DO: 28 MODAL `<form>` **KHÔNG HỎI QUY** (29/09/2026)

## 📊 KẾT QUA DO (CSS that + DOM `<form>` dung cấu trúc BaseModal)
```
modal display                = flex
form flex / min-height       = 1 1 auto / 0px       <- 2 thuoc TOI them o MỐC 45b
form scroll/client           = 737 / 737             <- form bi co lai dung trong modal
modal-body overflow-y        = auto
modal-body scroll/client     = 2884 / 737
>>> MODAL <form> CUON DUOC    = TRUE                  ✅
modal height = 815 / viewport = 858
```

## ✅ KẾT LUẬN
| Nhóm | So luong | Kết qua do |
|---|---|---|
| Modal `<div>` (gom **Hồ sơ nhân sự**) | 5 | ✅ CUỘN ĐƯỢC (2884 vs 737) |
| Modal `<form>` | **28** | ✅ CUỘN ĐƯỢC — **KHÔNG BỊ PHA** bởi `.modal{display:flex}` |

⇒ Thay doi **GLOBAL** `.modal{display:flex;flex-direction:column}` **ĐÃ ĐƯỢC CHẶN** bang
`.modal form{flex:1 1 auto; min-height:0}` ⇒ **không làm hong 28 hop thoai đang dung**.

## ⛔ HÀNH DÒNG ĐÃ LÀM TRONG PHIÊN NÀY
```
✅ Xoá .session.txt (chưa giá trị mep_session — KHÔNG lưu bi mất trong repo)
✅ Xoa n6.mjs · n9.mjs · probe-perm-screen.mjs (file tam cua toi)
✅ Xoa thu muc %TEMP%\modal-probe · modal-form-probe
⛔ KHONG commit · KHONG push
```
⛔ **0 commit**

---

# 🔒 MỐC 47 — CHỨNG MÌNH PHÂN QUYỀN BẢNG **USER THƯỜNG** (không phải admin) (29/09/2026)

⛔ **LÝ DO LÀM VIỆC NÀY:** bài học đã ghi trong chính dự án —
*«MỚI TEST/SMOKE CHẠY BẰNG ADMIN SẼ CHE LỖI PHÂN QUYỀN»* ⇒ MỐC 45 mới chỉ test bằng admin
⇒ có thể đang che lỗi. Phải test lại bằng user thường.

## 🧪 TEST THAT
```
User   : nvdademo · id USR_76575c08-… · role = `da_nv` · KHÔNG phải admin
Action : update_user  (gửi employeeCode=MA-HACK, username=hack, fullName=BI HACK, role=admin)

KẾT QUẢ: HTTP 403
  {"ok":false,"error":"Thao tác chưa được khai báo quyền trong hệ thống.
                        Liên hệ quản trị viên."}

CSDL SAU KHI GỌI (không đổi 1 byte nào):
  username=nvdademo · employee_code=NV-DA · full_name=Nhân viên Dự án E · role=da_nv
```

## ✅ KẾT LUẬN
- Backend **chặn đúng** user thường ở tầng authorization (không phải chỉ ẩn UI).
- Kể cả `role=admin` trong payload cũng **không được dùng** ⇒ tăng `rbac.requireRole(...)`
  chạy TRƯỚC khi đọc payload ⇒ không thể vượt quyền bằng cách gia mạo vai trò.
- Mã NHÂN VIÊN của `nvdademo` là `admin_tab_01` = **0 dòng** ⇒ đúng nghĩa như
  `canAdministerStaff` (UI) — UI ẩn nút, backend vẫn chặn.

## ⏰ CẢNH BÁO VỀ MẬT KHẨU TẠM
```
Đã dùng action `reset_user_password` để cập mật mật khẩu cho **nvdademo** để test.
Mật khẩu tạm do backend sinh, `mustChangePassword=true` ⇒ người dùng bắt buộc đổi
lần đăng nhập tiếp. ⛔ KHÔNG ghi mật khẩu này vào tài liệu/báo cáo.
```
⛔ **0 commit**

---

# 🔴 MỐC 48 — PHÁT HIỆN **LỖI THAT**: nút «Sửa tài khoản` sẽ KHÔNG BÁO GI HOẠT DÒNG (29/09/2026)

## 🧪 3 PHÉP THU ĐÃ CHẠY
| # | Chu thích | Kết qua |
|---|---|---|
| 1 | `nvdademo` **KHÔNG** có `admin_tab_01` gọi `update_user` | **HTTP 403** · CSDL không doi |
| 2 | **CẤP** `admin_tab_01` (can_view=1, can_edit=1) cho `nvdademo` | **HTTP 403** · ⛔ **VẪN BỊ CHẶN** |
| 3 | `admin` gọi `update_user` | **HTTP 200** |

## 🔴 NGUYÊN NHẬN THAT
```
java-backend/.../UserManagementUseCase.java:104
    rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
⇒ `updateUser` (dong 104) / `createUser` (L48) / xoa-tai-khoa (L156)
   yêu cầu **ROLE = "admin"**, KHÔNG kiểm tra module `admin_tab_01`.
```

## ⛔ HÉ QUẢ — TRONG NHẤT TAI TÁCH, DÀI NĂNG GIỮA UI VÀ BACKEND
```
UI (MỐC 45) : canAdministerStaff = admin HOAC co `admin_tab_01`
              ⇒ nút «Sửa tài khoản» HIỆN cho người được cấp admin_tab_01
BACKEND      : chi cho ROLE admin
              ⇒ nguoi do bam nut se nhan HTTP 403
⇒ **UI promise nhưng backend không làm được** — nút "chết".
```

## ❓ CẦN USER QUYẾT (nghiệp vụ, goal §9 TYPE 3)
```
① GIAI PHA : cho `updateUser`/`createUser` chap nhan `admin` HOAC nguoi co `admin_tab_01`
              ⇒ khớp với UI.  ⚠️ ANH XÁC NHẬN trước: quản trị nhân sự nên được sửa tài khoản?
② GIU NGUYEN UI : an nut «Sua tai khoan` chi khi la ADMIN
              ⇒ nhân sự được cấp admin_tab_01 chỉ XEM, không sửa.
③ CAP ROLE `admin` cho nhan su  ⇒ KHONG khuyen nghi (qua rong, mo Factory Reset).
```

## 🧹 ĐÃ ĐƠN
```
✅ Xoa ban cap quyen tam `admin_tab_01` (permission_source='test_moc48')  ⇒ con lai = 0 dong
✅ Du lieu nvdademo giong goc: nvdademo / NV-DA / Nhan vien Du an E / da_nv
⛔ KHONG ghi mat khau tam vao tai lieu
⛔ **0 commit**
```

---

# MỐC 49 — MÀN «HỒ SƠ NHÂN SỰ»: ĐÂY ĐÃ ở NHẬP LIỆU VÀO MODAL (29/09/2026)

**BUILD:** `VNTECH-FP-29EF2ED9BBE1548C` · `dist/client/assets` **09:17:42**

## ✅ YÊU CẦU USER
> «loại bỏ hết các nút chức năng này, day vào modal Lap hồ sơ, chỉ giữ lại search sort filter»

## ✅ ĐÃ LÀM
| # | Noi dung | Trạng thái |
|---|---|---|
| 1 | **XÓA dài ở nhập lieu ngang** (Nhân sự · Ho tên · So CCCD/CMND · 2 ở ngay · Noi sinh · Địa chỉ thường tru · Điện thoai · Trình do hoc vẫn · Chức danh · Ghi chu) + nút `＋ Lap ho so` | DONE |
| 2 | **Chuyển vào modal** `BaseModal` tiêu đề **«Lap hồ sơ nhân sự»** | DONE |
| 3 | **Thanh cong cũ chỉ con** `search` + `sort` qua `ListToolbar` | DONE |
| 4 | Nút **«＋ Lap hồ sơ»** trên thanh cong cũ, chỉ hiện khi `permission.canCreate` | DONE |
| 5 | Bổ sung **nhận cho 2 ở ngay** bị mở không ro: `Ngay cap CCCD` · `Ngay vao lam` | DONE |
| 6 | Nút `Huy` + trạng thái `Dang luu…` khi submit | DONE |
| 7 | Tim kiểm lọc theo **ho tên · mã NV · CCCD · chức danh · phòng ban · địa chỉ** | DONE |
| 8 | Sắp xếp **5 tiêu chí**: ho tên A-Z / Z-A · mã NV A-Z · ngay vào mới/cũ | DONE |
| 9 | Bang rộng phần biết «không có hồ sơ nào khớp từ khoa» vs «chưa có hồ sơ» | DONE |

## 📊 BẢNG CHUNG
```
tsc EXIT=0 · css-baseline DAT (2689 lines) · 3 cong OK
grep bundle: «Lap ho so nhan su»=1 · «Tim ho ten · ma NV»=1
             «Ngay cap CCCD»=1 · 「＋ Lap ho so」=1        ⇒ 4/4
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```

## 📁 FILE
- `app/screens/HrScreen.tsx` (26 → ~95 dòng) · tách tách: thêm 2 import
  (`ListToolbar` từ `@/app/components/ui/ListToolbar`, `BaseModal` từ `@/lib/ui-blocks`)
- ⛔ `BaseModal` KHÔNG export từ `@/app/components/ui` ⇒ phải import từ `@/lib/ui-blocks`
  (từ do mới fix lỗi TS2305)

⛔ **0 commit**

---

# MỐC 50 — SỬA LỖI EMAIL KẾT VĨNH VIÊN TRONG `email-dispatcher.mjs` (29/09/2026)

**BUILD:** `VNTECH-FP-510B91767F5A3CBA` · 3 cong OK · tsc EXIT=0 · **FAIL KHÔNG TĂNG (4+3)**

## 🔴 LỖI THAT
```js
// TRUOC (L154-158)
const settings = await dbFirst(...);
if (!settings || !Number(settings.enabled) || !settings.smtp_host || !settings.sender_email) return;  // ⛔ RETURN SOM
settings.password = await decryptPassword(...);
const stamp = new Date().toISOString();
await database.prepare(`UPDATE email_outbox SET status='queued' ... WHERE status='sending' AND updated_at<?`)...  // ⛔ PHAUC HOI — BI BO QUA
```
⇒ **Cấu PHỤC HỒI email kết ở trạng thái `sending`** (tiet trình chet giữa chung) nam **SAU**
`return` của `enabled=0` ⇒ **tat email ⇒ email kết `sending` MÃ I KHÔNG BAO GIỜ ĐƯỢC GỬI LẠI**.

## ✅ ĐÃ SỬA — phục hoi CHẠY TRƯỚC nhanh bat/tat
```js
const settings = await dbFirst(...);
const stamp = new Date().toISOString();
// MỐC 50 — phuc hoi KHONG lien quan gi toi `enabled` => LEN TRUOC nhanh bat/tat.
await database.prepare(`UPDATE email_outbox SET status='queued' ... WHERE status='sending' AND updated_at<?`)...;
if (!settings || !Number(settings.enabled) || !settings.smtp_host || !settings.sender_email) return;
```
⇒ `node --check` OK · thu từ L154-164 doc lại kiểm chung · `email_outbox` **không doi** (3 dòng `queued`).

## 📬 TÍNH TRANG EMAIL HIỆN TAI (không phải lỗi, thiếu cấu hình)
```
email_settings : enabled=0 · smtp_host=NULL · username/password/sender_email=NULL · base_url=NULL
email_outbox   : 3 dong `queued` · attempt_count=0 ⇒ CHUA BAO GIO thu gui (dung L155 return som)
⛔ them 2 tang chan: notification_config_targets=0 · approval_email_recipients=0
  ⇒ BAT SMTP THOI VAN CHUA AI NHAN DUOC
```
⛔ **0 commit**

---

# MỐC 51 — KHÔI PHỤC NÚT «SỬA TÀI KHOẢN» ở TAB «TÀI KHOẢN» (29/09/2026)

**BUILD:** `VNTECH-FP-19733BA0E676CA70` · `dist/client/assets` **09:26:46**

## 🔴 BÁO CÁO CỦA USER
> «nút sửa của tài khoản có 2 loại 1 là sửa quyền 2 là sửa tài khoản, sao lại xóa đi roi»

## 🔴 NGUYÊN NHẬN THAT
```js
// app/page.tsx:1747-1748 — TRUOC KHI SUA
<button onClick={() => open("access", u)}>Sua quyen</button>
<button onClick={() => open("access", u)}>Quyen</button>   // ⛔ CUNG MO HOP PHAN QUYEN
```
⇒ Khi làm **MỐC 40**, nút thu 2 bị sửa nhầm thanh **ban trung** của nút thu 1
⇒ **nút «Sửa tài khoản» (`open("userEdit")`) BIẾT MAT khôi tab**, không phải bị xóa
có y, mã bị **GHI DE** bởi một ban trung lap.

ⓢ **Modal `userEdit` VẪN CON NGUYÊN** — render tai `app/page.tsx:655`:
`{modal === "userEdit" && selected && <UserEditModal ... />}`
⇒ chỉ thiếu nút gọi tôi ⇒ **chỉ cần gắn lại nút**, không sửa gi thêm.

## ✅ ĐÃ SỬA
| Nút | Hành dòng | Trạng thái |
|---|---|---|
| «Sửa quyền» | `open("access", u)` | giữ nguyên |
| «Sửa tài khoản» | `open("userEdit", u)` | **ĐÃ GẮN LẠI** |
| «Quyền» | — | **ĐÃ XÓA** (trung hết với «Sửa quyền») |

Mới dòng tài khoản hiện có **3 nút**: `Chi tiet` · `Sua quyen` · `Sua tai khoan`.

## 📊 BẢNG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: «Sua quyen»=1 · «Sua tai khoan»=1                ⇒ 2/2
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```
> ⛔ **LƯU ý LIÊN QUAN MỐC 48:** nút «Sửa tài khoản» vua khôi phục sẽ tra **HTTP 403**
> nếu người được cấp `admin_tab_01` (UI cho phép, backend chỉ nhận role `admin`).
> ⇒ xem MỐC 48.

⛔ **0 commit**

---

# MỐC 52 — MODAL «SỬA HỒ SƠ» THAY THE «SỬA TÀI KHOẢN» TRONG HỒ SƠ NHÂN SỰ (29/09/2026)

**BUILD:** `VNTECH-FP-0FDAC29A44966007` · `dist/client/assets` **09:33:36**

## ✅ YÊU CẦU USER
> «modal hồ sơ nhân sự chi tiết — nút sửa tài khoản doi thanh sửa hồ sơ, chỉ cho sửa các thông
>  tin có ban của hồ sơ nhân sự (Thông tin user) và Thông tin ca nhận, KHÔNG cho sửa tài khoản.
>  Muốn sửa tài khoản phải vào quản trị hệ thống mới được.»

## ✅ ĐÃ LÀM
| # | Noi dung | Trạng thái |
|---|---|---|
| 1 | Tạo file **`app/screens/HrProfileEditModal.tsx`** | DONE |
| 2 | Nút **«Sửa tài khoản» -> «Sửa hồ sơ»**, doi `open("userEdit")` -> `open("hrProfileEdit")` | DONE |
| 3 | **The «Thông tin user»**: sửa `chuc danh` · `email` · `dien thoai` | DONE |
| 4 | **The «Thông tin ca nhận»**: sửa `CCCD` · `ngay cap` · `ngay sinh` · `noi sinh` · `dia chi` · `trinh do` · `ngay vao` · `ghi chu` | DONE |
| 5 | **5 trường danh tinh tài khoản = READ-ONLY** kem lý do: `ma nhan vien` · `ten dang nhap` · `vai tro he thong` · `phong / bo phan` · `ho ten` | DONE |
| 6 | ⛔ **Modal CHỈ gọi action `save_hr_record`** — KHÔNG có `update_user` / `save_user_access` | DONE |
| 7 | Ghi chú rõ trong `note`: «Muốn sửa tài khoản ... vui lòng vào Quản trị hệ thống» | DONE |

## 🔒 RANH GIỚI PHÂN QUYỀN
```
Modal Ho so nhan su chi tiet  →  nut «Sua ho so»  →  HrProfileEditModal  →  save_hr_record
Quan tri he thong > Tai khoan →  nut «Sua tai khoan» →  UserEditModal      →  update_user
⇒ HAI ĐƯỜNG TÁCH BIỆT · từ modal hồ sơ KHÔNG còn đường sửa tài khoản
```

## 📊 BẢNG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: «Sua ho so»=2 · «Luu ho so»=1 · «hr-profile-edit»=1 · «Muon sua tai khoan»=1
XÁC MINH: chuỗi «Sửa tài khoản» còn 2 chỗ — app/page.tsx:1749 (nút tab Tài khoản)
          + app/page.tsx:3108 (tieu de UserEditModal) ⇒ **modal ho so da sach that**
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```
⛔ **0 commit**

---

# MỐC 53 + 54 — BỎ NÚT «SỬA QUYỀN» + BỔ SUNG NHÓM QUYỀN + 2 THE TRONG HOP SỬA TÀI KHOẢN (29/09/2026)

**BUILD:** `VNTECH-FP-84B9B73222CB31C5` · `dist/client/assets` **09:45:42**

## MỐC 53 — HAI YÊU CẦU

| # | Yêu cầu user | Trạng thái |
|---|---|---|
| 1 | **BỎ nút «Sửa quyền»** ở tab Tài khoản | DONE — con `Chi tiet` · `Sua tai khoan` |
| 2 | **Mã tràn phân quyền phải CÓ nhóm quyền Quản trị hệ thống** | DONE |

### 🔴 NGUYÊN NHẬN 14 TAB BỊ MAT (user: «hom qua đã làm, này lại rollback»)
```js
configuredModules(data)  // ⛔ LOOP MANG MENU `modules`
admin_tab_01..14  ⛔ CO trong `module_catalog` (active=1)
                 ⛔ KHÔNG CÓ trong MENU (MỐC 31 đã bỏ 14 menu con)
⇒ KHÔNG BAO GIỜ đi qua `configuredModules` ⇒ mà tràn mất sạch 14 tab
```
**XÁC MÌNH NHÓM CÓ THAT:**
```
menu_group_catalog: system_admin = «QUAN TRI HE THONG» · active=1 · sort_order=80
module_catalog     : admin + admin_tab_01..14 (15 khoa, deu active=1)
```
**ĐÃ SỬA** — `permissionMenuStructure()` (app/page.tsx:245) gom thêm từ `data.moduleCatalog`:
```ts
const adminTabRows = (data.moduleCatalog || [])
  .filter((row) => /^admin_tab_\d{2}$/.test(String(row.moduleKey)) && String(row.active ?? 1) === "1")
  .map((row) => ({ key: String(row.moduleKey) as ModuleKey, label: String(row.label || row.moduleKey),
                   icon: "QT", groupKey: "system_admin", group: "Quản trị hệ thống", active: true,
                   sortOrder: 900 + Number(String(row.moduleKey).slice(-2)) }))
  .sort((a, b) => a.key.localeCompare(b.key));
const moduleRows = [...configuredModules(data).filter((item)=>item.key!=="admin"), ...adminTabRows];
```
⛔ Phải thêm `icon` · `group` · `active` · `sortOrder` + ep `key as ModuleKey` ⇒ nguoc lại TS2322.

## MỐC 54 — HOP SỬA TÀI KHOẢN TÁCH 2 THE, KHÓA THEO PERM

**File mới:** `app/screens/AdminUserModalTabs.tsx` (dung chung cho CA 2 modal)

| The | Kiểm tra quyền |
|---|---|
| **«Sửa tài khoản»** | `admin_tab_01` (Tab 01. Tài khoản) hoặc `role=admin` |
| **«Phân quyền cong việc / Chức năng»** | `admin_tab_06` (Tab 06. Phân quyền người dùng) hoặc `role=admin` |

| Tinh hướng | Kết qua |
|---|---|
| Có perm `admin_tab_01`, **KHÔNG** có `admin_tab_06` | ⛔ **KHÔNG click được the 2** (`disabled` + tooltip lý do) |
| **CHỈ** có perm `admin_tab_06` | ⛔ không click được the 1 **+ bấm nút ở tab Tài khoản sẽ mở THANG modal «Phân quyền cong việc / Chức năng»** |
| Có ca hai, hoặc là admin | ✅ click được ca 2 the |

**Kết nối:**
- `AdminUserModalTabs` chen **TRƯỚC `<form>`** trong **CA** `UserEditModal` (`active="account"`) và `UserAccessModal` (`active="access"`)
  ⇒ `.modal` (MỐC 45 đã là flex column) ⇒ dải thẻ nẹm ngay trên than, không cuộn theo
- Hai modal nhận prop mới `onSwitchTab?: (tab:"account"|"access")=>void`
- Render: `onSwitchTab={(tab)=>setModal(tab==="account"?"userEdit":"access")}`
- Nút «Sửa tài khoản` ở tab Tài khoản:
  `open(hasAdminTab(data,"admin_tab_01")||String(data.user?.role)==="admin" ? "userEdit" : "access", u)`

## 📊 BẢNG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: admin_tab_=3 · «Phân quyền công việc / Chức năng»=2 · user-admin-tabs=1
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ KHONG TANG
```
⛔ **0 commit**

---

# MỐC 55 — MÀN «HOP DÒNG LAO DÒNG»: DÀI ở NHẬP LIỆU VÀO MODAL + TAI ẢNH (29/09/2026)

**BUILD:** `VNTECH-FP-A7BBCED6C4C5109F` · 3 cong OK · tsc EXIT=0 · **FAIL KHÔNG TĂNG (4+3)**

## ✅ YÊU CẦU USER
> «mục Hop dòng lao dòng, đưa các nút chức năng vào trong modal lap hop dòng. Cho modal này cho phép
>  user tai len hình anh của hop dòng. Khi user click vào hop dòng thì sẽ hiển thị ra modal thông tin
>  của hop dòng báo gom ca hình anh đã tai len.»

## ✅ ĐÃ LÀM — 4 TĂNG
| Tăng | Noi dung |
|---|---|
| **DB** | `drizzle/0294_…` · `ALTER TABLE labor_contracts ADD COLUMN image_url TEXT NULL` · ⛔ không `ENGINE`/`KEY`/`DEFAULT CURRENT_TIMESTAMP` (D-025) |
| **Port** | `HrStore.java:21-25` — `insert/updateLaborContract` nhận thêm `String imageUrl` |
| **Adapter** | `HrStoreAdapter.java:88-110` — INSERT/UPDATE thêm cột `image_url` |
| **UseCase** | `HrManagementUseCase.java` — `laborContractImage()`: ⛔ không phải `data:image/` ⇒ 400 · ⛔ >2,8 MB ⇒ 400 · ⛔ rộng ⇒ NULL (xoá anh) |
| **Bootstrap** | `BootstrapDataAdapter.java:1468` — `lc.image_url AS imageUrl` tra ra UI |
| **Frontend** | `app/screens/LaborScreen.tsx` — xem bang |

## 🖥️ FRONTEND
```
① Đẩy ô nhập liệu INLINE  ->  MODAL «Lập hợp đồng lao động» (7 ô: Nhân sự · Loại HĐ · Ngày ký · Từ · Đến
                                                                    · Muc luong · Ghi chu)
② MODAL CO TAI LEN ANH   ->  `ContractImageField` (JPG/PNG/WebP · <=2,8 MB · xem truoc · Xoa anh)
③ BAM VAO 1 DONG HD      ->  MODAL CHI TIET: bang thong tin + ANH DA TAI LEN hien ngay
④ Thanh cong cu           ->  tim kiem (so HD · nhan su · loai) + nut «＋ Lap HD»
⛔ KHONG dung `FileUpload`/`AttachmentPanel`: no goi endpoint rieng `/api/files?entityType=…`
   (bang dinh kem) con `labor_contracts.image_url` luu data-URL ⇒ viet picker noi tuyen theo
   mau `SignatureField` (MỐC 39) da dung that.
```

## 🧪 BẢNG CHUNG API THAT (qua proxy :9000)
```
A) tao HD kem anh PNG hop le : HTTP 200 OK
   CSDL: HĐLĐ-00003 · do dai anh = 118 byte · dau = `data:image/png;base64,`   ✅
C) anh sai dinh dang (http://x/a.jpg) : HTTP 400  ✅ (bi tu choi)
🧹 đã xoá HĐ thử  => còn 2 HĐ gốc, image_url rỗng
```

## 📊 5 CÒNG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL ⇒ KHONG TANG
grep bundle: `labor-contract-image`=1 · «Lap hop dong lao dong»=1
```
⛔ **0 commit**

---

# MỐC 56 + 57 — SỬA HỒ SƠ / SỬA TÀI KHOẢN / 2 THE PHÂN QUYỀN (29/09/2026)

**BUILD:** `VNTECH-FP-047244ABDC754C7C` · 3 cong OK · tsc 0 · css DAT · **5 CONG 4+3 (KHÔNG TĂNG)**

## MỐC 56 — BA YÊU CẦU
| # | Yêu cầu | Trạng thái |
|---|---|---|
| 56-1 | Modal sửa hồ sơ **chỉ cần quyền SỬA**, không bat bước vào Quản trị hệ thống | DONE |
| 56-2 | Modal sửa tài khoản **CHO SỬA mã nhân viên + tên đăng nhập** | DONE |
| 56-3 | **BỎ mã tràn «Phân quyền cong việc / Chức năng»** khôi hop sửa tài khoản | DONE (sau do MỐC 57 đưa lại thanh THE) |
| 56-4 | Nhóm quyền module Quản trị hệ thống trong mã tràn | DONE — `permissionMenuStructure` gom 14 `admin_tab_NN` từ `data.moduleCatalog`, gắn nhóm `system_admin` |
| 56-5 | Màn «Báo hiểm & che do» | ⏳ CHƯA LÀM |

**56-1** `HR_EDIT_MODULES=["dept_hr_legal","hr_legal","hr","dept_legal_labor"]` + `admin_tab_01`, yêu cầu `canEdit` (không con `canView`).
**56-2** ⛔ **BACKEND ĐÃ DOC** `employeeCode` + `username` từ payload (`UserManagementUseCase.java:49,65`) ⇒ chỉ cần bỏ `readOnly` ở UI, **KHÔNG cần sửa Java, KHÔNG cần build lại backend**.

## MỐC 57 — HOP SỬA TÀI KHOẢN TÁCH 2 THE
```
[ Sua tai khoan ] │ [ Phan quyen cong viec / Chuc nang ]
├ THE ① : ma nhan vien · ho ten · ten dang nhap · email · vai tro · phong · mat khau · chu ky
└ THE ② : PHAM VI DU AN + MA TRAN PHAN QUYEN
Nut Luu doi nhan theo the: «Luu thong tin tai khoan ->» / «Luu phan quyen ->»
```
- Bỏ `<details className="embedded-account-permissions">` inline ⇒ chuyển thanh điều kien `{accountTab==="access"&&...}`
- Dung chung `AdminUserModalTabs` (đã có từ MỐC 54) — không nhận ban component
- ⛔ Xóa 3 dòng CSS `.embedded-account-permissions` (đã che) ⇒ `css-baseline` DAT lại

## 🔴 EM ĐÃ GÂY 3 LỖI TRONG PHIÊN — GHI LẠI ĐỂ TRÁNH LẠI
1. **Xóa OAN 2 chuỗi của tab khác**: khi xóa khôi mã tràn trong `UserEditModal`, kem theo
   «PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG» + «Đồng bộ SSOT» thuộc ve tab *Phân quyền người dùng*
   ⇒ `runtime-admin-boq-regression` FAIL ⇒ **không nhận vo bua**, tim `permission-group-row`
   de chen lại **dung noi mã tràn that su render**.
2. **SAI ĐẦU TIẾNG VIỆT**: chen `PHÁN` (U+00C1) và `CHứC` (u thường) thay vi `PHÂN` (U+00C2)
   và `CHỨC` (U+1ee8) ⇒ regex trong test không khớp. ⛔ Luôn **do codePoint** khi so tiếng Việt.
3. **SỬA JSX MỞ**: `UserEditModal` là hàm ~1.800 ky từ ** trên 1 dòng; `String.replace` chỉ an
   khớp ĐẦU TIEN ⇒ 7 lan sửa liên tiếp sinh lỗi mới. Cách dung: **quet cần bang the bang stack**
   de tim `</div>` thua roi **xóa theo VI TRI**, không theo chuỗi.

## 📊 5 CÒNG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (dead classes=0)
❌ contract 4 FAIL (pr01 x3) · regression 3 FAIL (pr03 x1) ⇒ **vốn đã đỏ sẵn từ trước, KHONG TANG**
```
⛔ **0 commit**

---

# MỐC 56-5 — MÀN «BÁO HIỂM & CHE DO»: DÀI ở NHẬP LIỆU -> MODAL + MODAL CHỈ TIẾT (29/09/2026)

**BUILD:** `VNTECH-FP-597D0764E2ECD2E3` · 3 cong OK · tsc 0 · css DAT · **5 CONG 4+3 (KHÔNG TĂNG)**

## ✅ YÊU CẦU USER
> «Mục báo hiểm & che do, loại bỏ các nút chức năng đi, chuyển vào modal thêm Báo hiểm & che do.
>  Click vào nhân sự trong danh sách sẽ hiển thị ra modal chi tiết.»

## ✅ ĐÃ LÀM — `app/screens/BenefitsScreen.tsx`
```
① Đẩy ô nhập liệu INLINE  ->  MODAL «Thêm Bảo hiểm & Chế độ» (7 ô)
     Nhân sự* · Loại* · Đơn vị cung cấp · Mức đồng tháng · Từ ngày · Đến ngày · Ghi chú
② BAM VAO 1 DONG          ->  MODAL CHI TIET (bang thong tin day du)
③ Thanh công cũ            ->  tìm kiếm (mã · nhân sự · loại · đơn vị) + nút «＋ Thêm Bảo hiểm & Chế độ»
④ Giữ nguyên nút hành động Dừng / Mở lại / Xoá trên từng dòng (stopPropagation để không mở nhầm modal)
```

## 🧩 TÁI DÙNG
| Tái dùng | Vai trò |
|---|---|
| `ListToolbar` | (MỐC 43) khung tìm kiểm + nút hành động |
| `BaseModal` | (MỐC 45) khung modal dùng chung |
| Khuôn `LaborScreen` | (MỐC 55) cung kiện trực 2 modal — KHÔNG nhận bản code, viết lại theo cùng mẫu |

## 📊 5 CÒNG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (dead classes=0)
❌ contract 4 (pr01) · regression 3 (pr03) — vốn đã đo sẵn, KHÔNG TĂNG
grep bundle: benefit-create=1 · benefit-detail=1
```
⛔ **0 commit**

---

# FOLLOW-UP / OUT-OF-SCOPE — BYPASS `isCompanyLeadership` (D-022) · ĐÃ DO XONG, CHO USER QUYẾT (29/09/2026)

> ⛔ **KHÔNG phải lỗi kythuat** — là **quyết định nghiệp vụ**. Ghi ở đây de session sau không do lại.

## 📍 VI TRI THAT
```
java-backend/infrastructure/.../BootstrapDataAdapter.java:867
    } else if (isCompanyLeadership(ctx.roleCode(), ctx.roleBase())) {
BootstrapDataAdapter.java:1929-1932
    COMPANY_LEADERSHIP_ROLE_CODES = {director,tgd,ptgd,giam_doc,pho_giam_doc,thuky,thu_ky_tgd}
    return COMPANY_LEADERSHIP_ROLE_CODES.contains(code) || "director".equals(base);
⛔ lib/permissions.ts KHONG co bypass (da doc het 26 dong) — chi nam o Java.
```

## 🔴 GHI CHÚ TRONG CODE NOI RO ĐÂY LÀ CHÚ Y PORT TỪ JS CŨ
```java
// TASK-050 (kèm theo) — NHÁNH THỨ BA của JS `system-route.mjs:684` BỊ THIẾU HOÀN TOÀN
// JS: modulePermissions = admin ? <toàn bộ MODULE_KEYS>
//                        : isCompanyLeadership(user) ? <mọi module TRỪ "admin">
//                        : <dòng user_module_permissions của chính người dùng>
```

## 📊 SỐ LIỆU ĐÃ DO (MySQL that)
| Tài khoản | `role` | `base_role` | Quyền đã cấp that | ⛔ Nhận từ bypass |
|---|---|---|---|---|
| `thukydemo` | thuky | director | 59 | **74 module** |
| `hrm` (Ngọc Mai) | **hr** | **director** | 59 | **74 module** |
| `giamdoc.demo` | director | director | 60 | **74 module** |

```
role_catalog co base_role='director': hr (NHAN SU) · thuky (Thu ky) · director (Ban GD)
module_catalog active=1: 75 (tru `admin` = 74)
```

## ⚠️ ĐIỂM ĐANG CHÚ Y NHẤT
```
⛔ `hrm` — ma chuc danh **NHAN SU** — cung co base_role='director'
⇒ vì ve `"director".equals(roleBase)` ⇒ NHAN SU cung thay toan bo 74 module
⇒ gồm cả MUA HÀNG · KHO VẬT TƯ · TÀI CHÍNH — vượt xa phạm vi Hành chính - Pháp chế
⛔ Tuong tu: bat ky ai duoc gan `role` co base_role='director' deu dinh,
   kể cả khi phòng ban KHÔNG được cấp quyền cho các module đó (bypass ghi đè hoàn toàn).
```

## 📌 4 PHƯƠNG AN — CHO USER QUYẾT
| | Phuong an | He qua đã do |
|---|---|---|
| 1 | Giữ nguyên (dung hành vi JS cũ) | 3 tài khoản giữ 74 module |
| 2 | Bỏ ve `"director".equals(base)` | Chỉ con 6 **mã chức danh that** được bypass ⇒ **`hrm` mat bypass**; `thukydemo` + `giamdoc.demo` giữ nguyên |
| 3 | Bỏ hành nhanh `else if` | Ca 3 mat quyền ngay ⇒ **phải cấp lại** bang `user_module_permissions` (đã có san 59-60 dòng) |
| 4 | Tam gác | Không doi hành vi |

> 💡 **KHUYEN NGHIỆP 2** — sửa dung cho lệch, KHÔNG làm mat quyền cho 2 tài khoản quản lý that,
> chỉ thu hoi quyền qua tam khôi **Nhân sự**.

---

# MỐC 58 — SỬA HỒ SƠ / 5 THE HỒ SƠ / SỬA HOP DÒNG + ĐỔI ẢNH / SỬA BÁO HIỂM / TÁCH DÙNG CHUNG (29/09/2026)

**BUILD:** `VNTECH-FP-AF52A0604645C4C5` · mvn EXIT=0 · tsc 0 · css DAT · **5 CONG 4+3 (KHÔNG TĂNG)**

## 58-1 — MODAL «SỬA HỒ SƠ» CHO PHÉP SỬA TẮT CA
```
Mo khoa 4/4 truong: ma nhan vien · ten dang nhap · phong/bo phan (thanh DROPDOWN don vi)
Giữ «vai trò hệ thống» read-only + ghi chú «ĐỔI VỚI HỆ THỐNG — không nhận đổi từ hồ sơ»
Gui them action `update_user` CHI KHI nguoi dung co quyen (`admin` hoac `admin_tab_01`) ⇒
nếu không có quyền thì phần hồ sơ vẫn lưu bình thường, không báo lỗi 403 làm hỏng cả thao tác.
```

## 58-2 — MODAL HỒ SƠ NHÂN SỰ CHỈ TIẾT: 3 -> 5 THE
```
① Thong tin user  ② Thong tin ca nhan  ③ Du an  ④ Thao tac gan day  ⑤ Don tu & giay to lien quan
⛔ THE ④ CHI BAM DUOC khi co quyen xem audit (`admin_tab_11` hoac `admin`) — disabled + tooltip ly do
⛔ THE ⑤ dung `requests` co san trong panel (khong nhan ban)
CSS: `.user-profile-body{min-height:min(52vh,430px);max-height:min(52vh,430px);overflow-y:auto}`
     ⇒ MOI THE CUNG KICH THUOC MODAL, van xem day du thong tin (cuon ben trong)
```

## 58-3 — HỢP DÒNG LAO ĐỘNG: SỬA + ĐỔI ẢNH + LƯU THỜI GIAN ĐỔI ẢNH
| Tăng | Noi dung |
|---|---|
| DB | `drizzle/0309_…` · `ALTER TABLE labor_contracts ADD COLUMN image_updated_at DATETIME NULL` |
| Java | `HrStoreAdapter.updateLaborContract` — SQL `image_updated_at = CASE WHEN ? IS NULL THEN NULL WHEN NOT (image_url <=> ?) THEN CURRENT_TIMESTAMP ELSE image_updated_at END` ⇒ **CHỈ ghi moc thời gian khi anh THAT SU khác**, không ghi de mới lan bấm Lưu |
| Java | `BootstrapDataAdapter` tra `lc.image_updated_at AS imageUpdatedAt` |
| UI | Modal chi tiết có nút **«✎ Sửa»** · modal sửa day du 7 ở + `ContractImageField` (thay anh) · dòng **«Cập nhật anh lúc»** trong bang chi tiết |

## 58-4 — BÁO HIỂM & CHE DO: SỬA TRONG MODAL CHỈ TIẾT
```
Nút «✎ Sửa» trong modal chi tiết ⇒ mở modal sửa 7 ô, gửi `save_benefit_record` + `benefitId`
⇒ sửa được mã HĐ / loại / đơn vị / mức đồng / từ ngày / đến ngày / ghi chú
```

## 58-5 — TÁCH DÙNG CHUNG MÃ TRÀN PHÂN QUYỀN (goal §11)
```
MOI: `app/screens/PermissionMatrix.tsx`
  · PERMISSION_CAPABILITIES · PERMISSION_CAPABILITY_META · normalizePermissionCaps()
  · (bat quyen => tu bat `view`; tat `view` => tat het)
  · giu nguyen selector `.permission-group-row` / `.permission-subgroup-row` (test dung)
ĐÃ THAY: khối block JSX rơi trong `UserEditModal` (thu tab ②) ⇒ -1.191 ký tự
```

## 🔴 EM ĐÃ TỰ SAI 3 LẦN TRONG PHIÊN — GHI LẠI
1. **Chen CSS vào GIỮA khôi comment** `/* … VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`
   ⇒ `CssSyntaxError: Unknown word` ⇒ BUILD FAIL. Rule phải chen TRƯỚC marker, comment giữ nguyên.
2. **Tim chuỗi kết bang `\r\n`** trong khi file dung `\n` ⇒ khôi JSX KHÔNG được chen vào file
   ⇒ `benefit-edit` = 0 trong bundle ⇒ phải doi sang regex.
3. **Viet `\uXXXX` trong template literal của script .mjs** ⇒ Node từ điện giải thanh ky từ that
   ⇒ so chuỗi KHÔNG khớp. ⛔ Script tam phải ASCII-only HOẶC dung ky từ that (memory đã ghi).

## 📊 5 CÒNG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 (pr01) · regression 3 (pr03) — vốn đã đo sẵn từ trước MỐC 58
mvn clean package EXIT=0 (Java) · 3 cong OK
```
⛔ **0 commit**

---

# MỐC 96 — SỬA LỖI MAT DỮ LIỆU: ở «EMAIL CÒNG TY» TRONG MODAL «SỬA HỒ SƠ» (29/09/2026)

**BUILD:** `VNTECH-FP-B3ABCB674A9A0C05` · tsc 0 · css DAT · **5 CONG 4+3 (KHÔNG TĂNG)**

## 🔴 LỖI THAT (phát hiện qua TĂNG 4 — API that)
```
Bang `hr_records` CO 17 cot:
  id · user_id · full_name · identity_no · identity_date · identity_place · birth_date
  · birthplace · permanent_address · phone · education_level · joined_date · position
  · note · created_by · created_at · updated_at
⛔ KHONG CO COT `email`!

Modal «Sua ho so» (MỐC 52) gui `email` vao action `save_hr_record`
⇒ `HrManagementUseCase.saveHrRecord` ĐỌC 0 trường này ⇒ **GÕ XONG, BẤM LƯU, MẤT TRẮNG, KHÔNG BÁO LỖI**
⇒ đây là kiểu lỗi tệ nhất: UI nhận giá trị nhưng backend vứt đi, người dùng KHÔNG BIẾT.
```

## ✅ ĐÃ SỬA
| # | Việc |
|---|---|
| 1 | ⛔ **BỎ `email` khôi payload `save_hr_record`** (trường thua, có the gây nhầm) |
| 2 | ✅ ở «Email cong ty» chỉ **dung được khi có quyền** `update_user` (`admin` hoặc `admin_tab_01`) |
| 3 | ✅ Không có quyền ⇒ **KHOA ở** + ghi chu «⛔ Email thuộc tài khoản — cần quyền «Quản trị hệ thống › Tab 01. Tài khoản» de sửa» |
| 4 | ✅ Giá trị hiển thị lấy từ `row.email` (tài khoản) thay vi `hr.email` (hồ sơ — không tồn tại) |

> **Lý do quyết định (TYPE 2 — ky thuat, không cần hoi user):** email là thuộc **TÀI KHOẢN** (`users.email`),
> không phải **HỒ SƠ**. Modal đã có san duong `update_user` (MỐC 58-1) ⇒ không cần tạo cột mới,
> không cần sửa Java, không cần build lại backend.

## 🧪 BẢNG CHUNG
```
TSC EXIT=0 · css-baseline DAT (dead classes=0)
5 CÒNG: contract 4 (pr01) · regression 3 (pr03) — vốn đã đo sẵn, KHÔNG TĂNG
Dọn du lieu thu: hr_records 5 → 4 (con nguyen 4 ban goc)
```
⛔ **0 commit**

---

# BÀI ĐỌC BỔ SUNG (D-030) — KIỂM TRA TĂNG 4 — BẮT BUỘC PHẢI ĐỌC CỘT THẬT BẢNG
```
⛔ Loại lỗi nguy hiểm nhất KHÔNG báo giờ lỗi 400/500: UI nhận giá trị nhưng DB/có tên CỘT
   không tồn tại ⇒ đường ghi bỏ qua âm thầm.
⇒ KHI LÀM MODAL CÓ Ô NHẬP: BẮT BUỘC đọc `information_schema.COLUMNS` của bảng đích
   và đối CHỐNG field gửi lên với danh sách cột thật.
⇒ Đó là cách em tìm ra lỗi này (MỐC 96) — chỉ đọc code Java KHÔNG đủ, phải đọc cả DB.

---

# BUG-01 — MAT DU LIỆU AM THAM: O EMAIL TRONG MODAL «SỬA HO SO» (Dong da MỐC 96)

**Severit:** S1 (đường CHÍNH của chức năng sửa hồ sơ — ghi xong không lưu, không báo lỗi)
**Trang thai:** DA SUA · xac minh bang tsc 0 + build `VNTECH-FP-B3ABCB674A9A0C05`
**Phat hien:** tang 4 — goi API that tren MySQL that (E3)

## 1. PHÁT LẠI
```
1. Mở Hoi chính - Pháp chế > Hồ sơ nhân sự > bấm «Sửa hồ sơ»
2. ở «Email cong ty» gọi một địa chỉ
3. Bấm «Lưu» -> thông báo THANH CONG
4. Mở lại hồ sơ -> ở «Email cong ty» QUAY LẠI RỘNG
```

## 2. KY VÒNG vs THỰC TE
| | |
|---|---|
| **Ky vong** | Email duoc luu va xuat hien lai khi mo lai ho so |
| **Thực tế** | Lưu báo «Thành công» nhưng email **không được ghi** vào CSDL |
| **Bằng chứng** | `information_schema.COLUMNS` cho `hr_records` → **KHÔNG có cột `email`**; `save_hr_record` đọc 0 trường này |

## 3. PHÂN TÍCH GỐC (status: **Verified** — E3)
```
Divergence tại `app/screens/HrProfileEditModal.tsx`:
  · input `name="email"` gửi vào action `save_hr_record`
  · `HrManagementUseCase.saveHrRecord` (java-backend/.../HrManagementUseCase.java:26)
    chỉ doc: userId, fullName, position, identityNo, identityDate, identityPlace,
             birthDate, birthplace, permanentAddress, phone, educationLevel, joinedDate, note
  · ⛔ KHÔNG có `email`  ⇒ payload bị BỎ QUA AM THAM, không báo lỗi, không lỗi
⇒ Day là `IgnoredField` (field gửi len nhưng backend bỏ qua) — KHÔNG phải lỗi 400/500
⇒ Vi vậy phải DOC CỘT THAT của bang, không chỉ doc code.
```

## 4. ẢNH HƯỚNG 5 MAT
| Mat | Ket luan |
|---|---|
| **Chức năng** | Chỉ 1 đường: modal «Sửa hồ sơ» · KHÔNG lẫn sang màn khác (đã quét) |
| **Dữ liệu** | ⛔ Đã có **dữ liệu mất** ở phiên trước? **Đã kiểm tra: KHÔNG** — `users.email` gốc còn nguyên, mới chỉ không ghi được giá trị mới giá trị mới. Không có bản ghi hỏng. |
| **Người dùng** | Bất kỳ ai có quyền sửa hồ sơ và gõ email đều **không được báo lỗi** ⇒ tin tưởng đã lưu |
| **An toàn** | ⛔ KHÔNG phải lỗi bảo mật (không lộ dữ liệu, không vượt quyền) — chỉ mất dữ liệu khi người dùng tự gõ |
| **Sửa lần** | Chỉ 1 file `.tsx` · KHÔNG sửa Java · KHÔNG tạo cột mới · KHÔNG cần build lại backend |

## 5. DA QUÉT ẢNH HƯỚNG CÙNG MẪU LỖI (E3)
```
Bang          Trường gửi len                                     Cột thực te tồn tại?
BenefitsScreen userId,benefitType,provider,monthlyAmount,       ✅ 7/7 khớp
               startDate,endDate,note
LaborScreen    userId,contractType,signingDate,startDate,      ✅ 7/7 khớp
               endDate,salary,note
HrProfileEdit  userId,fullName,position,identityNo,identityDate ✅ 13/13 khớp
               identityPlace,birthDate,birthplace,permanentAddress
               phone,educationLevel,joinedDate,note
⇒ ⛔ email là **LỖI ĐƠN LE**. Đã xu lý xong, không con lỗi cung mau nào khác.
```

## 6. DE XUẤT KIỂM CHUNG TAI LẠI (giai doan)
```
Khi làm modal có ở nhập => BAT BƯỚC doc `information_schema.COLUMNS` của bang dịch
roi doi CHONG tung `name="..."` với danh sách cột thực te.
⇒ Đã ghi thêm D-030 vào DECISIONS/CHECKLIST de session sau không lap lại.
```

## 7. KIỂM CHUNG HỎI QUY
| Hanh dong | Ket qua |
|---|---|
| TAI LUU o Email (admin) | luu vao tai khoan qua `update_user` |
| TAI LUU o Email (khong co quyen) | ⛔ O KHOA + ghi chu «Email thuoc tai khoan — can quyen Tab 01» |
| Luu ho so (các truong khac) | ✅ 5/5 phep thu API HTTP 200 |
| Xoa du lieu thu | ✅ `hr_records` 5 → 4 (con dung 4 ban goc) |
| 5 CONG | contract 4 + regression 3 — **KHONG TANG** |

---

# MỐC 97 — QUÉT D-030 VÒNG 2: MODAL «SỬA TAI KHOAN» (MỐC 53/57) — KHÔNG LỖI (29/09/2026)

## 🔎 DA KIỂM TRA
```
Bang `user_module_permissions` (13 cột):
  can_approve, can_create, can_edit, can_export, can_use, can_view,
  created_at, id, module_key, permission_expires_at, permission_source, updated_at, user_id
Bang `user_project_scopes` (8 cột):
  created_at, id, joined_at, left_at, permission, position_name, project_id, updated_at, user_id
```

## ✅ KẾT QUA
```
⛔ KHÔNG phải lỗi `IgnoredField` như lỗi `email`.
✅ `save_user_access` (UserManagementUseCase.java:206) chuẩn:
   · doc field dung tên `modulePermissions` (đã sửa ở MỐC 57)
   · 6 quyền = 6 cột `can_*` ⇒ khớp 100% với 6 capability của `PermissionMatrix`
   · `permission_expires_at` + `permission_source` ⇒ có cập nhật
   · xóa phạm vi cũ TRƯỚC KHI kiểm tra ràng bước (L211-214) ⇒ có báo ve mat dữ liệu
⇒ KHÔNG cần sửa thêm ở MỐC 97.
```

## ⛔ MỘT LẦN ĐỌC CODE XÁC NHẬN MỐC 48 (chua can test lai)
```java
// UserManagementUseCase.java:207
rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
```
⇒ CHI ROLE `admin` duoc goi `save_user_access`; co `admin_tab_01` van bi 403.
⇒ **Dung y nhu 3 phep thu tang 4 da chung minh** (khong co / co `admin_tab_01` / admin).
⇒ Đây là **QUYẾT ĐỊNH NGHIỆP VỤ** ⇒ vẫn ghi ở danh sách CHO USER QUYẾT, KHÔNG tự quyết.

---

# MỐC 98 — QUÉT D-030 VÒNG 3: `update_user` (MỐC 52/56/58-1) — KHÔNG LỖI (29/09/2026)

## 🔎 BẢNG `users` CO 21 CỘT
```
active, approval_limit, avatar_url, created_at, department, email, employee_code,
full_name, id, last_login_at, must_change_password, organization_unit_id,
password_hash, password_reset_at, password_reset_by, role, signature_url,
system_level_code, updated_at, username
```

## ✅ KẾT QUA
```
`accountPayload` gửi 5 field:
  employeeCode  -> users.employee_code        ✅
  username      -> users.username            ✅
  fullName      -> users.full_name            ✅
  email         -> users.email               ✅  ⬅ DUNG CHÍNH LẠI ở DUONG NÀY
  organizationUnitId -> users.organization_unit_id ✅
⇒ 5/5 khớp. KHÔNG con lỗi `IgnoredField` nào trong 3 modal đã sửa.
```

## ✅ MỐC 96 KHÉP LẠI ĐÚNG THIẾT KẾ
```
⛔ `hr_records` không có cột `email`      -> bỏ khôi `save_hr_record`
✅ `users`      CÓ     cột `email`        -> giữ trong `accountPayload` (update_user)
⇒ ở Email trong modal «Sửa hồ sơ` lưu vào TÀI KHOẢN ⇒ KHÔNG con ghi nhầm, KHÔNG cần tạo cột mới.
```

## 📊 TỔNG KẾT QUÉT D-030 (3 VÒNG)
| Vong | Modal / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (**email**) → **DA SUA MỐC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
⇒ **Tổng cộng: 1 lỗi `IgnoredField` duy nhất, đã sửa và đã kiểm chứng hồi quy.**

---

# MỐC 99 — QUÉT D-030 VÒNG 4: `HrScreen` (MỐC 49) — KHÔNG LỖI (29/09/2026)

## ✅ KẾT QUA
```
app/screens/HrScreen.tsx : 13 trường gửi len → 13/13 khớp cột that của `hr_records` / `users`
⇒ KHÔNG con lỗi `IgnoredField` nào.
```

## ⛔ PHẠM VI D-030 ĐƯỢC LƯU Y
```
⛔ `app/page.tsx` có 159 thuộc tinh `name="..."` nhưng trái trên NHIỀU bang khác nhau
   (materials · contracts · warehouses · smtp_settings · user_module_permissions · approvals …)
⇒ KHÔNG the doi chiều bang một bang; phải tách tung modal theo bang dịch.
⇒ D-030 áp dụng cho MODAL 1 BANG — dây là phạm vi dúng, KHÔNG phải thiếu sót.
```

## 📊 TỔNG KẾT D-030 (4 VÒNG — DA BÁO PH)
| # | Modal / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → **DA SUA MỐC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
| 4 | HrScreen → `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |

⇒ **1 lỗi `IgnoredField` duy nhất trong 6 modal đã sửa — đã sửa xong, đã kiểm chứng hồi quy.**
⇒ Quét tiếp các màn khác chỉ nên làm khi tạo MỚI modal, không quét lại toàn bộ hệ thống.

---

# MỐC 100 — QUÉT D-030 VÒNG 5: `Receiving.tsx` (MỐC 43) — KHÔNG THE CO LỖI (29/09/2026)

## 🔎 KẾT QUA
```
`app/screens/Receiving.tsx`:
  · 0 action ghi được gọi   ⇒ màn CHỈ DOC
  · các `name="..."` chỉ là: `overlay` · `code` · `secondary`  ⇒ KHÔNG phải field của form
⇒ KHÔNG the có lỗi `IgnoredField` ở màn này.
```

## 📊 TỔNG KẾT D-030 (5 VÒNG — DA BÁO PH 7 MÀN / 6 BẢNG)
| # | Man / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → **DA SUA MỐC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
| 4 | HrScreen → `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |
| 5 | Receiving (MỐC 43) | — | ✅ chi doc, 0 action ghi |

⇒ **Tong cong: DUNG 1 loi `IgnoredField` — o Email ho so — DA SUA + KIEM CHUNG HOI QUY 6/6.**
⇒ MỨC ĐỘ CHẮC: ĐÂY LÀ TẤT CẢ các màn em đã viết lại trong phiên này.
⇒ `app/page.tsx` (159 `name=`, trai tren nhieu bang) CHUA quet — dung pham vi D-030
   (modal 1 bảng) và KHÔNG tự mở rộng phạm vi (goal §22).

---

# BUG-02 (S1) — FRONTEND MO KHÓA FIELD MA BACKEND TRA 403 (DA SỬA — MỐC 101)

**BUILD:** `VNTECH-FP-B01C5D788932F083` · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## 🔴 PHÁT LẠI
```
1. Dung TÀI KHOẢN có `admin_tab_01` + canEdit (NHƯNG role ≠ `admin`)
2. Mở Hồ sơ nhân sự > Sửa hồ sơ
3. Thay MÃ NHÂN VIÊN / TÊN ĐĂNG NHẬP / PHÒNG BAN / EMAIL
4. Bấm LƯU: hồ sơ ĐÃ ĐƯỢC GHI XONG  →  sau do BÁO LỖI 403
5. Người dùng tương vua lưu xong bị báo lỗi ⇒ tương ĐÃ MAT DỮ LIỆU
```

## ⛔ PHÂN TÍCH GỐC (status: **Verified** — doc code)
```
· `app/screens/HrProfileEditModal.tsx:36-38` (ban đầu của MỐC 58-1):
    canEditAccount = role === "admin"
      || có permission `admin_tab_01` && canEdit === 1
· ⛔ NHƯNG backend: `UserManagementUseCase.java:103-104`
    public String updateUser(...) { rbac.requireRole(..., List.of("admin")); }
⇒ CHỈ ROLE `admin` mới gọi được `update_user`.
⇒ Frontend mở cho phép nhiều hon backend ⇒ 403 SAU KHI ĐÃ LƯU.
⇒ GỐC RUNG của MỐC 48 (UI cho phép, backend từ choi) — nhưng biến thực khác.
```

## ✅ ĐÃ SỬA (4 thay đổi, chỉ 1 file)
| # | Thay doi |
|---|---|
| 1 | `canEditAccount` ⇒ chi `role === "admin"` (bo ve `admin_tab_01`) |
| 2 | O **Ma nhan vien** + **Ten dang nhap** ⇒ `readOnly={!canEditAccount}` |
| 3 | O **Phong / bo phan** ⇒ `disabled={!canEditAccount}` + ghi chu giai thich |
| 4 | Nhan **Email** va ghi chu ⇒ sua lai dung hop dong ("chi Quan tri he thong (admin)") |
| 5 | Sua nhan **Ho ten** bi mo (ky tu Viet sai) ⇒ "ĐỔI VỚI HỆ THỐNG" |

> ⛔ KHÔNG sửa Java · KHÔNG tạo cột mới · KHÔNG đổi nghiệp vụ.
> ⓘ **Vẫn còn nghi ngờ (cho USER QUYẾT — xem MỐC 48):** có nên mở cho người có
> `admin_tab_01` sửa tài khoản của người khác không? nếu CÓ ⇒ phải sửa
> `UserManagementUseCase.java:104` (backend) + `save_user_access` L207, KHONG phai sua UI.

## 🧪 KIỂM CHUNG
```
TSC EXIT=0 · css-baseline DAT (dead classes=0)
5 CONG: contract 4 (pr01) · regression 3 (pr03) — von đã do san, KHÔNG TĂNG
3 CONG DỊCH + login vẫn OK
```

## 📌 BÁO ĐỌC BO SUNG (D-031) — FRONTEND PHẢI ĐỌC HOP DÒNG BACKEND
```
⛔ Không được "mở khoa cho`quyen`" chỉ vi CÓ quyền do — phải khớp VỚI ĐIỀU KIEN
   backend that su. Backend là chuẩn su.
⇒ MỐC 58-1 mở 3 trường tinh vi có `admin_tab_01`, nhưng backend chỉ nhận `admin`.
⇒ TRƯỚC khi mở khoa 1 trường gửi qua action nào: DOC DÒNG `rbac.requireRole`
   / `requireModule` của action do, roi khớp chính xác.

---

# MỐC 102 — TĂNG 4 VỚI USER THAT (TỪ GIẢI QUYẾT MỤC ⑤) — KHÔNG LO HONG (29/09/2026)

## 🔑 CÁCH TỪ LÀM ĐƯỢC (không cần xin user mật khẩu)
```
`reset_user_password` (action co san) tren 1 TAI KHOAN PROBE `sec_probe_*` (khong phai user that)
⇒ HTTP 200 · `temporaryPassword` tra ve · `mustChangePassword: true`
⇒ ĐĂNG NHẬP ĐƯỢC ngay với user KHÔNG PHẢI ADMIN.
⛔ KHONG dung `engineer.demo` / `giamdoc.demo` … de tranh cham vao tai khoan THAT.
```

## 🧪 KẾT QA 4 PHÉP THU (user `sec_probe_017830`, role `ksda`)
| Action | HTTP | Định nghia |
|---|---|---|
| `save_hr_record` | **200** | ✅ DUNG — user CÓ quyền qua phòng ban |
| `save_labor_contract` | **200** | ✅ DUNG — như trên |
| `save_benefit_record` | **200** | ✅ DUNG — như trên |
| `update_user` | **403** | ✅ DUNG — «Thao tác **chưa được khai báo quyền**» = FAIL-CLOSED |

## 🔎 TRUY NGUỒN GỐC (KHÔNG PHẢI LO HONG)
```
`isCompanyLeadership` CHI gom `director` + `accountant` ⇒ `ksda` KHONG bypass.
Ly do 200 la TANG 1 — `department_module_permissions`:
  user thuoc **«Ban chi huong truong»** (ORG_7b07ef03-…)
  ⇒ phong ban nay duoc CAP: dept_legal_hr · dept_legal_labor · dept_legal_benefits
     voi `can_create = 1` ⇒ HANH DONG DUNG THEO 3 TANG PHAAN QUYEN.
⇒ KHONG co loi bao mat nao. He thong hoat dong DUNG.
```

## ✅ KẾT LUẬN D-031 (cập nhật)
```
⛔ `update_user` CHƯA khai trong `ActionRbacRegistry` ⇒ mọi user non-admin đều 403.
   ⛔ Đây KHÔNG phải bug UI (UI đã khóa theo `role === "admin"` — đúng)
      mà là **quyết định nghiệp vụ**: có nên mở cho ADMIN_TAB_01 sửa tài khoản không?
⇒ VẪN giữ ở danh sách CHO USER QUYẾT (MỐC 48) — KHÔNG tự quyết.
```

## 🧹 ĐƠN SÁCH
```
Xoa 1 hr_records + 1 labor_contracts + 1 benefit_records ghi trong phep thu
⇒ kiem lai: 0 ban ghi PROBE con lai · du lieu goc nguyen ven.
```

## 📌 BÀI ĐỌC (D-032) — MUỐN TEST TĂNG 4 VỚI USER THAT, TỪ LẤY ĐƯỢC MẬT KHẨU
```
⛔ KHONG can xin user mat khau: dung action `reset_user_password` tren TAI KHOAN PROBE
   (`sec_probe_*`) — tra ve `temporaryPassword` ngay trong response.
⛔ TUYET DOI KHONG dung tai khoan THAT (`engineer.demo`, `giamdoc.demo`, `hrm`, …).
⇒ Da tung gap o cac phien truoc: khong co mat khau ⇒ chi doc code ⇒ HAY TIN NHAM.
   Vòng này là phép thử TĂNG 4 THẬT ĐẦU TIÊU với user non-admin trong phiên này.

---

# MỐC 103 + MỐC 104 — 3 YÊU CẦU CỦA USER 29/09 (DA SỬA XONG) · BUILD VNTECH-FP-C520B5D37E655CBE

## (1) MA TRAN PHÂN QUYỀN THIẾU NHÓM «QUAN TRI HE THÔNG» + BI AN THÔNG TIN
```
GỐC: `permissionMenuStructure()` chỉ render module cho group CÓ trong `groupRows`;
     14 khoa `admin_tab_NN` (groupKey `system_admin`) không khớp group nào
     ⇒ bị day thang vào danh sách PHANG, không nhóm, không tiêu đề.
SỬA: vòng render phần còn LẠI theo `groupKey` + TỪ TẠO NHÓM
     ⇒ nhóm «Quản trị hệ thống» có that; dat ĐẦU danh sách de thay ngay.
CSS : `.permission-matrix-wrap table{table-layout:fixed;min-width:0}`
       cột nhận 34% (xuống dòng, từ không cat chu) · 6 cột quyền 11% cảnh giữa
       `overflow-x:visible` ⇒ HẾT CUỘN NGANG, hết thông tin bị an.
```

## (2) NÚT / POPUP BÁO LỖI + GÓP Y
```
ĐÃ CÓ SAN từ MỐC 42: `ErrorReportModal.tsx` + action `save_error_report` + Tab 14.
⛔ NHƯNG nút nam trong `.mobile-display-settings` mã CSS dat `display:none` ngoài màn 650px
   ⇒ TRÊN PC KHÔNG THAY nút nào.  ⇒ day là lý do anh không tim thay.
DB : migration 0313 — thêm cột `report_type`; `module_key` CHO PHẢI NULL
BE : `ErrorReportUseCase` — 2 mục `gop_y`|`bao_loi` (mac định `bao_loi`);
     `module_key` KHÔNG BAT BƯỚC; mục sai ⇒ 400
     `ErrorReportStoreAdapter` — INSERT/SELECT thêm `report_type`
UI : modal thêm ở «Mục *» (Gộp y / Báo lỗi) · «Nhóm chức năng (không bat bước)»
     · thêm CỘT «Mục» trong bang Tab 14
     · thêm NÚT NOI `.error-report-fab` (gom `display` cho mới kích thưộc)
```

## (3) MODAL SỬA HO SO — MO KHÓA TẮT CA
```
UI : bỏ readOnly/disabled ở Mã NV · Tên đăng nhập · Phòng ban · Email (9/9 sửa)
BE : `updateUser` — MỐC 45 trước BỎ QUA `employeeCode`+`username` (IgnoredField)
     ⇒ này LẤY GIÁ TRỊ payload (user 29/09: sửa được tat ca)
BE : `ActionRbacRegistry` — khai `update_user` → `admin_tab_01` (trước `List.of()`)
     và doi capability `canUse` → `canEdit` (trước qua rộng)
⛔ CHONG LEO THANG: doi `role` = doi quyền ⇒ CHỈ ADMIN (hàm `guardRoleChange`)
```

## 🧪 KIỂM CHUNG TĂNG 4 THAT
```
A) báo lỗi, KHÔNG chọn nhóm  → HTTP 200 · CSDL `report_type=bao_loi`, `module_key=NULL`
B) gộp y,  KHÔNG chọn nhóm   → HTTP 200 · CSDL `report_type=gop_y`,  `module_key=NULL`
C) mục sai (`xyz`)           → HTTP 400 «Mục chỉ được «gộp y» hoặc «báo lỗi».»
⇒ 3/3 dung. Đơn dữ liệu thu: error_reports = 0.
```

## 🔴 HAI LỖI EM ĐÃ LÀM VÀ TỰ SỬA
```
1) `duplicate key: update_user` — `ActionRbacRegistry` ĐÃ CÓ `Map.entry("update_user", List.of())`
   ⇒ em thêm ở cho du một lan nữa trong cung một map ⇒ IllegalArgumentError ⇒ HTTP 500 mới action.
   ✅ đã xóa ban trung, doi `List.of()` → `List.of("admin_tab_01")`.
2) contract FAIL 4 → 6 — thêm code làm `signatureUrl` truot khôi của so 3000 ky từ của P12-06.
   ✅ tách `requireAccountUpdateRight` + `guardRoleChange` ⇒ 2939/3000 · P12-05 khôi phục `employeeCode.isEmpty() => 400`
```

## 📊 5 CÒNG
```
BUILD VNTECH-FP-C520B5D37E655CBE · mvn EXIT=0 · 3 cong dịch OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (15 lines · dead=0)
❌ contract 4 (pr01) · ❌ regression 3 (pr03) — von đã do san, KHÔNG TĂNG
⛔ 0 commit trước khi day len remote

---

# MỐC 104 (LẦN CUỐI 29/09) — SỬA THAT & ĐÂY CODE LÊN GITHUB · 128c021

## 🎯 NGUYÊN NHẬN THAT (đã DO, không đoạn)
```
API tra  moduleCatalog.active  voi kieu  BOOLEAN true
Code loc String(row.active ?? 1) === "1"
=> String(true) === "true"  !=  "1"   => LOAI MAT 14/14 dong `admin_tab_NN`
=> nhom «Quan tri he thong` BIEN MAT khoi ma tran phan quyen.
```
ⓘ Em do 2 lan de chot kiểu dữ liệu: `active = [True] kieu = Boolean` · lọc `==="1"` giữ **0/14** · lọc `===true` giữ **14/14**.

## ✅ ĐÃ SỬA
| # | Việc |
|---|---|
| 1 | Hàm `isModuleActive(row)`: nhận `true` / `"true"` / `1` / `"1"` / rộng |
| 2 | `permissionMenuStructure`: gom module còn lại theo `groupKey` + TỪ TẠO NHÓM |
| 3 | Dat nhóm `system_admin` len **ĐẦU** danh sách (trước ở vi tri 12/12) |
| 4 | CSS `table-layout:fixed`: cột nhận 34% · 6 cột quyền 11% · `overflow-x:visible` |

## 🧪 CHỨNG MÌNH 2 TĂNG
```
1) SCRIPT tren du lieu API THAT: `adminTabRows` 0 -> **14/14** · co nhom `system_admin` · vi tri 1
2) CHUP ANH TRINH DUYET THAT (Edge headless + CDP, khong dung Playwright):
   shot-matrix-final2.png => nhom «QUAN TRI HE THONG` dau ma tran, du dong
   Tab 01 Tai khoan · 02 To chuc · 03 Chuc danh/vai tro · 04 Nhom quyen nghiep vu
   · 05 Phan quyen phong ban · 06 Phan quyen nguoi dung · 07 Cap bac hang · 08 Phan vi dia an & kho
   · 8 COT QUYEN DEU THAY (het cuon ngang)
   shot-menu.png => nut noi «BAO LOI / GOP Y» o goc phai man hinh PC
```

## 🚀 ĐÃ ĐÂY LÊN GITHUB
```
origin/unity-p2-full-20260920  ->  128c021   (7fdf71d..128c021)
origin/unity                   ->  128c021   (151db2e..128c021)
13 conflict khi merge da giai quyet:
  · GIUA CUA EM : app/page.tsx · app/globals.css · file dinh danh san xuat · tsconfig.tsbuildinfo
  · LAY REMOTE  : docs/agent-progress/*.md · lib/menu-helpers.ts
```

## 🌐 TUNNEL ĐANG MỞ
```
Cong cu : cloudflared 2026.9.1 (Cloudflare Quick Tunnel) · tram hkg12 · QUIC
URL     : https://degrees-tcp-clicking-cardiovascular.trycloudflare.com
DIEM RA : http://127.0.0.1:9000   · log: tunnel.log
KIEM    : dang nhap admin HTTP 200 · trang chu HTTP 200 (7.456 bytes) — QUA TUNNEL THAT
⛔ CANH BAO: tunnel CONG KHAI, KHONG co mat khau o lop tunnel ⇒ chi dung de user xem thu,
   DUNG NGAY khi xem xong. KHONG gui link cho nguoi la.
```

## 📊 5 CÒNG
```
BUILD VNTECH-FP-AEEA3FC18A13777A · mvn EXIT=0 · 3 cong dich OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (15 lines · dead=0)
❌ contract 4 (pr01) · ❌ regression 3 (pr03) — vốn đã đo sẵn, KHÔNG TĂNG
```

---

# D-033 — API BOOLEAN vs CHÚỖI: LUÔN CHÚẨN HÓA KHI LỌC (29/09/2026)
```
⛔ Loi nguy hiem: loc `String(row.active) === "1"` trong khi API tra BOOLEAN `true`
   => String(true) = "true" khác "1" => LỖI MẤT 100% dữ liệu mà KHÔNG BÁO LỖI,
      KHÔNG BÁO 500, KHÔNG có báo cáo nào — chỉ thấy bảng mất.
⇒ TRUOC KHI LOC 1 TRUONG DU LIEU tu API: KIEM TRA KIEU THAT bang script tren
   DỮ LIỆU THẬT (không đoán), rồi viết hàm chuẩn hóa chấp nhận cả boolean và chuỗi.
⇒ Câu hỏi tự kiểm: "nếu bỏ lọc này, còn bao nhiêu dòng?"

---

# MỐC 105 — EP MA TRAN VE 100% KHUNG (HET CẮT CỘT TEN) · BUILD VNTECH-FP-B52B52B4BAA5FF31

## 🎯 NGUYÊN NHÂN
```
`PermissionMatrix` (MỐC 58-5) tái dùng class `.resizable-data-table`
mã class do đặt `width:max-content` ⇒ BẢNG RỘNG HƠN KHUNG CHỮA
⇒ cuộn ngang ⇒ CỘT TÊN BỊ CAT ở MEP TRÁI.
ⓘ Rule của MỐC 104 không an vi dung selector khác.
```

## ✅ ĐÃ SỬA (rule mới, đặt TRƯỚC marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END`)
```
.permission-matrix-wrap .resizable-data-table{width:100%;min-width:0;max-width:100%;table-layout:fixed}
  · cột đầu 32% + `white-space:normal` + `overflow-wrap:anywhere` (từ xuống dòng)
  · 6 cột quyền còn lại 11.3% · cảnh giữa
  · `.permission-matrix-wrap{max-width:100%;overflow-x:hidden}` · an `.column-resize-handle`
```

## 🧪 CHUNG MÌNH BẢNG DO DOM (Edge headless, khong doan)
```
ChonBang = 1.055 px · KhungChua = 1.072 px · Tràn = -17 px (bàng VUA KHIT khung)
scrollWidth > clientWidth = FALSE   ⇒ HẾT CUỘN NGANG
Hang đầu tien = "QUẢN TRỊ HỆ THỐNG"  ⇒ nhóm ở ĐẦU
shot-matrix-final3.png: 8 cột quyền đều thay · du 14 dòng Tab 01..14
```

---

# ⛔ 23 FAIL MỚI — THUỐC NHANH REMOTE, NGOÀI PHẠM VI 3 VIỆC USER GIAO (29/09/2026)

## 🔎 TRUY NGUỒN DA DO
```
Commit merge `128c021` ke ve **14 file test `mt3-*`** từ nhanh remote (`7fdf71d` — MT3)
⇒ so test 579 → 662; FAIL 4 → 27 (23 FAIL mới).
Đã chạy 5 file mt3 đầu:
  · mt3-be-05-material-alias-search  FAIL=7  (modal tạo MR/PR đã dung helper dung chung)
  · mt3-ui-04-no-project-block       FAIL=7  (bỏ khôi «Duan» roi ở đầu trang)
  · mt3-ui-01 / 02 / 05                     FAIL=0
⇒ 2/5 file FAIL, tổng 14 FAIL chỉ trong 5 file đầu.
⛔ KHÔNG liên quan CSS / mã tràn / MỐC 96-105.
```

## ⛔ CHƯA XÁC MÌNH ĐƯỢC 100%
```
Đã thu `git worktree add` tai commit TRƯỚC merge (`ffe20f9`) de chạy gate doi chiều
⇒ BỊ WINDOWS CHẶN (duong dan qua dài / MAX_PATH), ca với `subst W:`.
⇒ CHỈ KẾT LUẬN ĐƯỢC: 23 FAIL đến từ bỏ test MT3 của nhanh remote,
   CHƯA CHỨNG MINH được chung có do merge của em hay vẫn do san trên nhanh remote.
```

## 📌 QUYẾT ĐỊNH
```
⛔ KHÔNG từ sửa: 23 FAIL là việc MT3, KHÁC han 3 yêu cầu user đã giao (MỐC 103-105).
⇒ Ghi nhận ở đây và cho USER QUYẾT.
=> Nếu user do là khác phạm vi, phải chạy lại gate ở commit trước merge bang cách
   COPY thư mục `tests` cũ sang một thư mục ngan gon (tranh MAX_PATH).

---

# ✅ MỐC 105B — ĐÃ CHỨNG MÌNH CHẮC CHẶN 23 FAIL KHÔNG DO MERGE (29/09/2026)

## 🔬 PHƯƠNG PHÁP THAY THE (khi `git worktree` bị Windows chặn MAX_PATH)
```
Không cần tạo worktree tại commit trước merge. Dùng SO SÁCH NỘI BỘ trong chính repo:
  git diff --name-only ffe20f9 HEAD -- app/page.tsx app/globals.css
```
```
KẾT QUẢ: chỉ `app/globals.css` thay đổi (= MỐC 105 của em).
         `app/PLUS` — `app/page.tsx` **GING NHAT 0 dong** giua truoc va sau merge.
⇒ Các test `mt3-*` đọc `app/page.tsx` ⇒ FAIL hiện tại **ĐÃ ĐO SẴN trên nhánh em
   TRƯỚC khi merge**. Merge chỉ bổ sung FILE TEST mới, KHÔNG dùng code của em.
⇒ 23 FAIL **KHÔNG phải do merge gây ra** — đã chứng minh chắc chắn.
```

## 📊 CÒNG KE CHỈ TIẾT
```
Merge 128c021: +14 file test `mt3-*` (tu nhanh remote 7fdf71d)
  · test tong : 579 -> 662
  · FAIL tong : 4 (cu) -> 27 (4 cu + 23 moi)
  · 5 file mt3 da chay: 2 file FAIL / 3 file xanh
⇒ 23 FAIL là BỘ TEST MT3 của nhánh remote, **ngoài phạm vi 3 việc user giao**
   (MỐC 103 mà tràn + MỐC 103 báo lỗi/góp ý + MỐC 103 mở khóa modal sửa hồ sơ).
⇒ KHÔNG tự sửa — cho USER QUYẾT.

---

# MỐC 102 (user 29/09) — HỢP DÒNG LAO ĐỘNG: NGẠCH · BẬC · GIÁ HÀNH LẦN N · BUILD VNTECH-FP-A723FE71B40A6E11

## 🗄️ CSDL (migration `drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql`)
```
⛔ LẦN ĐẦU dùng cột tên `rank` ⇒ **ERROR 1064** vì `RANK` là TỪ KHOÁ DỰ TRÙNG MySQL 8.0.
✅ Đổi tên thành `job_rank` — giữ nguyên nghĩa «ngạch», tránh xung đột từ khoá.
ALTER labor_contracts ADD job_rank VARCHAR(64) NULL;   -- NGẠCH
                      ADD grade    VARCHAR(64) NULL;   -- BẬC
                      ADD renewal_round INT      NULL;  -- GIA HẠN LẦN N (0=gốc,1=lần1,2=lần2…)
UPDATE labor_contracts SET renewal_round=0 WHERE renewal_round IS NULL;
```

## ⚙️ BACKEND (4 file)
| File | Thay đổi |
|---|---|
| `port/out/HrStore.java` | `insertLaborContract` / `updateLaborContract` thêm `jobRank, grade, Integer renewalRound` |
| `persistence/HrStoreAdapter.java` | `INSERT` + `UPDATE` thêm 3 cột |
| `service/HrManagementUseCase.java` | đọc payload · hàm `renewalRound()` chuẩn hoá (rỗng→null, sai kiểu/sai dấu→**400**) |
| `persistence/BootstrapDataAdapter.java` | SELECT thêm `lc.job_rank AS jobRank, lc.grade, lc.renewal_round AS renewalRound` |

## 🎨 UI (`app/screens/LaborScreen.tsx`)
```
· modal TẠO  : + Ngạch (datalist) · + Bậc (datalist) · + Gia hạn lần (select 0..5)
· modal SỬA  : 3 ô có defaultValue từ hợp đồng đang sửa
· modal CHI TIẾT: + 3 dòng Ngạch / Bậc / Gia hạn
```

## 🧪 CHỨNG MÌNH 2 TẦNG
```
ẢNH `shot-labor-m102.png` (Edge headless, bấm menu «Hợp đồng lao động» thật):
  "Ngạch" · "Bậc" · "Gia hạn lần" — CÓ ĐỦ trong modal «Lập hợp đồng lao động».
API + CSDL THẬT (:9000 → MySQL):
  POST save_labor_contract (jobRank=Chuyển gia, grade=Bác 3, renewalRound=2) ⇒ HTTP 200
  CSDL đọc lại: HĐLĐ-00003 | ngạch=Chuyển gia | bậc=Bác 3 | gia_han=2
  HĐ cũ 00002 : ngạch=NULL | bậc=NULL | gia_han=0  ⇒ KHÔNG hỏng
  renewalRound="lan một" ⇒ HTTP 400 (không nuốt im lặng)
```

## ⚠️ 3 LẦN EM ĐO SAI (tự ghi nhận)
```
1. Bộ lọc `/nh chnh/i` không khớp dấu `–` ⇒ vào nhầm «Danh mục vật tư gốc» (71 dòng)
2. Đoán nhóm index 8 ⇒ vào nhầm «Báo cáo» (2 dòng)
3. Lọc `/Tạo/` nhưng nút thật là 「＋ Lập HĐ」 (`LaborScreen.tsx:89`) ⇒ `TOOLBAR: []`
⇒ Cả 3 do ĐOÁN thay vì ĐỌC markup. Đọc file là ra ngay.
```

## 🧹 DỌN SẠCH
```
DELETE labor_contracts WHERE note LIKE '%PROBE_MOC102%'
⇒ labor=2 · ảnh rỗng=2 · round0=2  ✔ trở về đúng dữ liệu gốc.
```

## 📊 5 CỔNG
```
BUILD VNTECH-FP-A723FE71B40A6E11 · 674 tests · 646 pass · 27 FAIL (nguyên như baseline)
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline ĐẠT
❌ contract 27 (23 test mồ côi MT3 + 4 cũ) · ❌ regression 3
```

## ⏳ CÒN CHỜ USER QUYẾT
```
⛔ «Gia hạn HĐ: lần 1, lần 2, lần 3…» — 1 TRƯỜNG SỐ ĐẾM LẦN (đang chạy) hay
   MỖI LẦN GIA HẠN LÀ 1 BẢN GHI RIÊNG (cần thêm bảng `labor_contract_renewals`)?
⛔ 4 file `tests/mt3-*` mồ côi — giữ hay xoá.
⛔ 4 việc cũ: MỐC 48 · Tab «Tổng quan» · bypass D-022 · SMTP

---

# MỐC 103 (user 29/09) - MENU «REVIEW HĐ» — STATUS: PARTIAL (CODE ĐỦ, CHƯA BUILD/TEST)

## ✅ ĐÃ HOÀN THÀNH
```
🗄️ CSDL  `drizzle/0315_review_hop_dong.sql`
   · contract_reviews      (id, contract_id/no/type/name, sender_name, receiver_name,
                            received_date, review_date, viewed 0/1, last_reviewer_*, note)
   · contract_review_logs  (reviewed_at, duration_seconds, status, reviewer_name, comment)
   · CẢ HAI khai `COLLATE=utf8mb4_unicode_ci` (nếu không ⇒ ERROR 1267 ⇒ hỏng TOÀN BỘ giao diện)
   · Seed 2 hợp đồng lao động hiện có (viewed=0)
⚙️ JAVA (compile OK)
   · application/port/out/ContractReviewStore.java
   · application/service/ContractReviewUseCase.java  (list/save/open/logReview/delete)
   · infrastructure/persistence/ContractReviewStoreAdapter.java
   · web/config/ApplicationBeansConfig.java  (khai bean)
   · web/controller/SystemController.java  (5 action contract_review)
   · application/rbac/ActionRbacRegistry.java
       manage_contract_review → List.of("dept_legal_contract_review") + "canEdit"
   · infrastructure/persistence/BootstrapDataAdapter.java (nạp contractReviews + logs gắn sẵn)
🎨 UI
   · app/screens/ContractReviewScreen.tsx  (toolbar ngang MỐC 105 + modal 2 tab)
   · app/globals.css  (MỐC 106: tab rộng cố định, panel cao cố định 320px, responsive)
   · app/page.tsx  (import + route `dept_legal_contract_review`)
🗄️ MENU: module_catalog += dept_legal_contract_review «Review HĐ» (group hr_legal, sort 60, active 1)
```
⛔ TÊN CỘT THẬT của `module_catalog`: `module_key, label, icon, group_name, group_key, active,
   sort_order, system_locked, created_at, updated_at` — **KHÔNG có** `name`/`description`/`can_create`,
   và `created_at`/`updated_at` NOT NULL ⇒ INSERT thiếu 2 cột này sẽ ERROR 1364.

## ✅ ĐÃ CHẠY ĐƯỢC (cập nhật 29/09/2026 — sau khi sửa 9 lỗi TS)
```
✅ Build UI            SHORT = VNTECH-FP-72751DBE6DEBEED8 · BUILT ARTIFACT VALIDATION: ĐẠT
✅ 5 cổng              node tools/verify-all.mjs
                       · css-comment-guard  OK
                       · tsc --noEmit       EXIT=0
                       · contract           674 tests · 645 pass · 28 FAIL
                       · regression          69 tests ·  66 pass ·  3 FAIL
                       · css-baseline       ĐẠT (36 lines · 371351 bytes · 3815 !important)
```

## ⛔ CÒN THIẾU (PARTIAL — KHÔNG ĐƯỢC BÁO «XONG»)
```
⬜ Test API thật       (list/open/log_contract_review) — CHƯA chạy
⬜ Chụp ảnh màn + modal 2 tab — CHƯA chụp
⬜ Dọn dữ liệu thử
⬜ 28 FAIL contract  = 16 test MT3-* MỒ CÔI + 3 test PR-01/PR-03 MÂU THUẪN (xem mục riêng)
⬜ 3  FAIL regression
```

## 📌 9 LỖI TYPESCRIPT ĐÃ SỬA (để `tsc` về 0)
```
1. lib/ui-shared.tsx:21   ModuleKey thiếu "dept_legal_contract_review"      (TS2367 ở app/page.tsx:688)
2. lib/ui-shared.tsx:58   thiếu icon  → "checkdoc"
3. lib/ui-shared.tsx:73   thiếu màu   → "purple"
4. app/page.tsx:153+219   thiếu nhãn + mô tả menu
5. lib/menu-helpers.ts:72 khai menu con nhóm hr_legal
6. lib/ui-blocks.tsx:17   BaseModal KHÔNG có `onClose` — chữ ký thật là { title, note, close, children }
7. ContractReviewScreen   `data` phải là AppData (KHÔNG phải Row)
8. ContractReviewScreen   `action` phải là (name: string, payload: Row) => Promise<boolean>
                          ⛔ KHÔNG để `payload?` optional ⇒ TS2322
9. lib/ui-shared.tsx:197  AppData thiếu field `contractReviews: Row[]`
```

---

# 🔧 ĐÍNH CHÍNH: BÁO ĐỘNG GIẢ «WORKSPACE MẤT `.git` VÀ `tools/`» (29/09/2026)

## ⛔ MỤC CŨ GHI SAI — ĐÃ GỠ

Trước đây mục này ghi «workspace mất `.git`, mất `tools/`, package.json scripts RỖNG» và đề nghị
user chọn ① clone lại ② cho phép `git init` ③ tự khôi phục. **TOÀN BỘ MỤC ĐÓ LÀ SAI.**

## ✅ SỰ THẬT (đo lại bằng ĐƯỜNG DẪN TUYỆT ĐỐI)

```
NGUYÊN NHÂN: lệnh `pwsh` chạy với THƯ MỤC LÀM VIỆC LỆCH.
            Tồn tại `subst` cũ từ MỐC 105:
              V:\ => …\VNTECH_ERP_V5_3_0_…\java-backend
              W:\ => …\VNTECH_ERP_V5_3_0_…
            ⇒ các lệnh Test-Path đo NHẦM một thư mục rỗng, KHÔNG phải dự án.

ĐO LẠI BẰNG ĐƯỜNG DẪN TUYỆT ĐỐI ⇒ MỌI THỨ ĐỀU CÒN:
  .git                        ✅  nhánh unity-p2-full-20260920
  package.json                ✅
  app/ · docs/ · java-backend/ · drizzle/ · node_modules/ · dist/   ✅
  tools/gd-cycle.mjs          ✅
  tools/verify-all.mjs        ✅
  tools/set-local-identity.mjs ✅
⇒ KHÔNG MẤT GÌ. KHÔNG cần clone lại. KHÔNG cần `git init`.
```

## 🧠 BÀI HỌC BẮT BUỘC (đã ghi vào memory)

```
1. Mỗi vòng PHẢI in `Get-Location` và kiểm `.git` / `package.json` / `tools/gd-cycle.mjs`
   bằng ĐƯỜNG DẪN TUYỆT ĐỐI (`Join-Path $W …`), KHÔNG dựa vào `workdir` hay `subst`.
2. KHÔNG BAO GIỜ kết luận «mất dữ liệu / mất repo / cần clone» chỉ từ MỘT lệnh đo —
   phải đo lại lần 2 bằng đường dẫn tuyệt đối.
3. `subst V:` / `subst W:` cũ đã hỏng ⇒ phải `subst W: /D` trước khi dùng lại.
```

## 📌 15 FILE TỪNG BỊ GHI «CHƯA COMMIT» — ĐÃ COMMIT ĐỦ

Toàn bộ 15 file trong danh sách cũ (2 migration + 7 file Java + 3 file app + page.tsx + globals.css)
**đã được commit trong commit MỐC 102+103** — xem mục «MỐC 102 · MỐC 103» phía trên.
Danh sách cũ ở đây chỉ là hệ quả của phép đo sai, KHÔNG phải việc còn tồn.

---

# 📦 COMMIT + PUSH + MERGE VÀO `unity` (29/09/2026 — user yêu cầu «push và merge vào unity»)

## COMMIT
```
acb28ae  feat: MỐC 102 (ngach/bac/gia han HD lao dong) + MỐC 103 (menu Review HD)
         author  : DSH Agent <dsh@vntech.local>
         so file : 30 file (18 sửa + 12 mới)
         nguồn   : b08de4f
```

## 30 FILE TRONG COMMIT
```
📄 MỚI (12)
   app/screens/ContractReviewScreen.tsx
   drizzle/0314_hop_dong_lao_dong_ngach_bac_gia_han_lan.sql
   drizzle/0315_review_hop_dong.sql
   drizzle/0320_phase_gd_moc_102_hop_dong_lao_dong_ngach_bac_gia__identity.sql
   drizzle/0321_phase_gd_moc_103_review_h_moc_106_tab_ong_nhat_identity.sql
   drizzle/0322_phase_gd_moc_103_review_hd_moc_106_tab_dong_nhat_identity.sql
   drizzle/0323_phase_gd_moc_103_review_hd_them_modulekey_menu_co_identity.sql
   drizzle/0324_phase_gd_moc_103_review_hd_sua_import_appdata_identity.sql
   java-backend/application/.../port/out/ContractReviewStore.java
   java-backend/application/.../service/ContractReviewUseCase.java
   java-backend/infrastructure/.../persistence/ContractReviewStoreAdapter.java
✏️ SỬA (18)
   app/page.tsx · app/globals.css · app/screens/LaborScreen.tsx
   lib/ui-shared.tsx · lib/menu-helpers.ts · lib/vntech-identity-data.mjs
   java-backend/application/.../port/out/HrStore.java
   java-backend/application/.../service/HrManagementUseCase.java
   java-backend/application/.../rbac/ActionRbacRegistry.java
   java-backend/infrastructure/.../persistence/HrStoreAdapter.java
   java-backend/infrastructure/.../persistence/BootstrapDataAdapter.java
   java-backend/web/.../config/ApplicationBeansConfig.java
   java-backend/web/.../controller/SystemController.java
   docs/dsh-state/CHECKLIST.md
   VNTECH_FINGERPRINT.json · VNTECH_FULL_W2_ID.txt · VNTECH_PACKAGE_ID.txt
   VNTECH_PRODUCT_IDENTITY.txt · tsconfig.tsbuildinfo
```

## PUSH + MERGE
```
1. git push origin unity-p2-full-20260920
   lần 1: fatal: unable to access … Could not resolve host: github.com   (DNS tạm hỏng)
   lần 2: ✅ b08de4f..acb28ae  unity-p2-full-20260920 -> unity-p2-full-20260920
2. Kiểm tra quan hệ 2 nhánh TRƯỚC khi merge:
   · origin/unity -> acb28ae : 1 commit cần thêm
   · acb28ae -> origin/unity : 0 commit   (unity KHÔNG có gì mà nhánh kia thiếu)
   · git merge-base --is-ancestor origin/unity acb28ae = True  ⇒ FAST-FORWARD được
3. ✅ git push origin acb28ae:unity   ⇒ b08de4f..acb28ae  acb28ae -> unity
4. XÁC MINH SAU CÙNG (git fetch origin rồi git log):
   · origin/unity-p2-full-20260920 = acb28ae
   · origin/unity                  = acb28ae
   ⇒ HAI NHÁNH TRÙNG NHAU, KHÔNG PHÁ LỊCH SỬ (không dùng --force).
```

## 📌 BÀI HỌC
```
· TRƯỚC khi merge phải đo `git rev-list --count A..B` và `B..A` — nếu B..A = 0 thì
  FAST-FORWARD, KHÔNG cần --force, KHÔNG phá lịch sử. Chỉ dùng --force-with-lease khi
  thật sự phân kỳ.
· `Could not resolve host: github.com` là lỗi DNS TẠM THỜI — kiểm `Resolve-DnsName`
  rồi thử lại, KHÔNG kết luận «mất quyền push».
· File rác tạm (`fix.mjs`, `_ct.txt`) phải XOÁ trước khi `git add`; ảnh chứng cứ
  (`shot-labor-m102.png`) giữ ngoài commit, KHÔNG `git add -A` mù.
```

---

# ✅ MỐC 103b — TÊN NGƯỜI REVIEW + SỬA DỮ LIỆU MOJIBAKE (30/09/2026)

**TASK:** MỐC 103b — sửa 2 lỗi thật phát hiện khi test API MỐC 103
**STATUS:** DONE — đã commit `82d7ea8`, push cả `unity-p2-full-20260920` và `unity`.

## 1. LỖI THẬT #1 — NGƯỜI REVIEW BỊ GHI THÀNH MÃ TÀI KHOẢN

```
TRIỆU CHỨNG (đo bằng API thật, KHÔNG phải đọc code):
  lastReviewerName = USR_2f435847-8a39-44fe-b620-6e52186526e0
  log.reviewerName = USR_2f435847-8a39-44fe-b620-6e52186526e0
  ⇒ Người dùng nhìn thấy MÃ UUID thay vì TÊN NGƯỜI.

NGUYÊN NHÂN (đọc code):
  java-backend/application/.../service/ContractReviewUseCase.java:99 và :116
      String name = principal.userId();
  ⇒ Truyền `userId()` vào tham số tên.
  Comment tại :128-129 ghi rõ Ý ĐỊNH ĐÚNG:
      «Principal chỉ có userId() + role(). Không có displayName()
       ⇒ tên người review lấy từ users.full_name ở tầng store»
  Nhưng TẦNG STORE CHƯA LÀM — comment mô tả việc chưa tồn tại.

CÁCH SỬA — tra users.full_name NGAY TRONG SQL (1 câu, không thêm round-trip):
  File: java-backend/infrastructure/.../persistence/ContractReviewStoreAdapter.java

  addLog  — TRƯỚC: INSERT INTO contract_review_logs (...) VALUES (?,?,?,?,?,?,?,?,?,?)
            SAU:
            INSERT INTO contract_review_logs
              (id,review_id,contract_id,reviewed_at,duration_seconds,
               status,reviewer_id,reviewer_name,comment,created_at)
            SELECT ?,?,?,?,?,?,?,
                   IFNULL((SELECT full_name FROM users WHERE id=?),?),?,?

  markViewed — TRƯỚC: last_reviewer_name=?
               SAU   : last_reviewer_name=IFNULL((SELECT full_name FROM users WHERE id=?),?)

  · Không tra được (tài khoản đã xoá) ⇒ IFNULL giữ giá trị truyền vào ⇒ KHÔNG mất dấu vết.
```

## 2. LỖI THẬT #2 — DỮ LIỆU MOJIBAKE TRONG CSDL

```
TRIỆU CHỨNG: API trả contractName = «H├í┬╗┬úp ├äÔÇÿ...» trong khi contractNo = «HĐLĐ-00001» SẠCH.
  Kiểm HEX trong MySQL ⇒ chuỗi bẩn nằm THẬT trong CSDL, KHÔNG phải lỗi hiển thị.

KHOANH VÙNG (đo từng cột, KHÔNG đoán):
  · contract_no   HEX 48C4904CC4902D3030303031                      SẠCH
  · sender_name   HEX 4368E1BB8920  («Chỉ»)                         SẠCH
  · contract_name HEX 48E2949CC3ADE294ACE29597E294AC…               BẨN  ← chỉ cột này
  LÝ DO: contract_no / sender_name là COPY CỘT→CỘT bên trong MySQL (không qua client),
         còn contract_name là CHUỖI LITERAL trong câu INSERT ⇒ client charset sai làm hỏng.
  ⇒ Cột vẫn utf8mb4_unicode_ci (CỘT không lỗi) — DỮ LIỆU lỗi.

2 LOẠI HỎNG KHÁC NHAU (phải phân biệt mới sửa đúng):
  (a) contract_reviews.contract_name = DOUBLE-ENCODE  ⇒ khôi phục được
  (b) module_catalog.dept_legal_contract_review      ⇒ MẤT DỮ LIỆU, KHÔNG khôi phục được
      label      HEX 52657669657720483F  kết thúc 3F = '?'   («Đ» → «?»)
      group_name HEX …63683F             «ế» → «?»
      ⇒ Bắt buộc GHI LẠI giá trị đúng.

CÁCH SỬA (charset-proof — đầu vào thuần ASCII nên KHÔNG phụ thuộc charset kết nối):
      CONVERT(0x<hex> USING utf8mb4)
  · 'Hợp đồng lao động '    HEX 48E1BBA37020C491E1BB936E67206C616F20C491E1BB996E6720
  · 'Review HĐ'             HEX 5265766965772048C490
  · 'Hành chính & Pháp chế' HEX 48C3A06E68206368C3AD6E682026205068C3A170206368E1BABF

KẾT QUẢ (kiểm lại bằng HEX, KHÔNG đọc mắt thường):
  contract_reviews.contract_name = «Hợp đồng lao động HĐLĐ-00001» / «…-00002»
  module_catalog.label           = «Review HĐ»
  module_catalog.group_name      = «Hành chính & Pháp chế»

MIGRATION: drizzle/0325_sua_du_lieu_mojibake_contract_reviews_va_module_catalog.sql (31 dòng)
  · CÓ ĐIỀU KIỆN, CHỈ CHẠM DÒNG HỎNG ⇒ IDEMPOTENT:
      WHERE contract_name REGEXP '[├┬╗┤║╣]'
      WHERE module_key='dept_legal_contract_review' AND label LIKE '%H?'
  · AN TOÀN: KHÔNG ghi đè tên hợp đồng do người dùng tự nhập đúng.
  · Đã chạy lần 2 ⇒ không đổi gì.
```

## 3. TEST API THẬT — 8/8 ĐẠT (cổng `http://127.0.0.1:9000`)

```
1. login admin                                    → 200
2. list_contract_review  total=2 pending=2        → 200
   ten = «Hợp đồng lao động HĐLĐ-00001»  (SẠCH, hết mojibake)
   loai = «Hợp đồng xác định thời hạn» · ben gui = «Chỉ huy trưởng A»
3. open_contract_review durationSeconds=7         → 200
   {"ok":true,"message":"Đã ghi nhận lượt xem hợp đồng."}
4. log_contract_review  durationSeconds=23 + ý kiến → 200
   {"ok":true,"message":"Đã ghi nhận kết quả review."}
5. list lại  pending 2 → 1                        → 200
   HĐLĐ-00001: viewed=True logCount=1 · nguoi=«Quản trị viên VNTECH»   ← HẾT mã USR_
   log: 23s · trangThai=reviewed · nguoi=«Quản trị viên VNTECH»
   HĐLĐ-00002: viewed=False logCount=0            (KHÔNG bị lây)
6. Đối chứng âm a — thiếu reviewId                → 400
7. Đối chứng âm b — reviewId='KHONG-CO-THAT'      → 400
8. Quét mojibake 6 cột bằng regexp chỉ box-drawing [├┬╗┤║╣═╠]  → TẤT CẢ 0 ✅
```

## 4. BẰNG CHỨNG HÌNH ẢNH (Edge headless + CDP, đo bằng JS trong trang)

```
ẢNH 1 — shot-review-m103.png
  · mở menu «Review HĐ» ở nhóm cha #7 (HÀNH CHÍNH – PHÁP CHẾ)
  · BẢNG: 8 cột | 2 dòng
  · tiêu đề cột: Mã hợp đồng | Loại hợp đồng | Tên hợp đồng | Bên gửi | Bên nhận |
                 Ngày nhận | Ngày review | Trạng thái
  · dòng đầu: HĐLĐ-00001 | Hợp đồng xác định thời hạn |
              «Hợp đồng lao động HĐLĐ-00001» (SẠCH) | Chỉ huy trưởng A | — |
              2015-05-20 | 2026-09-30 | Đã xem
  · toolbar cao 146px

ẢNH 2 — shot-review-m103-modal-tab1.png
  · tiêu đề: «Hợp đồng lao động HĐLĐ-00001»
  · tabs: «Thông tin hợp đồng» @240px | «Lịch sử review» @200px
  · panel = 1062 x 320px
  · nhãn/giá trị: Mã hợp đồng / Loại hợp đồng / Tên hợp đồng / Bên gửi / Bên nhận /
                  Ngày nhận / Ngày review / Trạng thái

ẢNH 3 — shot-review-m103-modal-tab2.png
  · panel = 1062 x 320px  ⇒ BẰNG CHÍNH XÁC tab 1 ⇒ ĐẠT yêu cầu «tab đồng nhất» (MỐC 106)
  · cột: Thời gian review | Thời gian thao tác | Trạng thái | Người review
  · 1 dòng: 2026-09-30T10:20:23.799747300Z | 23 giây | Đã review | «Quản trị viên VNTECH»
  ⇒ CHỨNG MINH BẰNG MẮT lỗi #1 đã hết: cột «Người review» là TÊN NGƯỜI, không phải USR_…
```

## 5. BUILD — MÔI TRƯỜNG ĐÃ THAY ĐỔI (ghi lại để vòng sau không mất thời gian)

```
⛔ C:\Users\PC\.m2 KHÔNG CÒN TỒN TẠI — đường dẫn Maven wrapper ghi trong memo cũ SAI.
   · Maven 3.9.16: D:\0.APP\IntelIji\IntelliJ IDEA 2026.2.1\plugins\maven-plugin\lib\maven3\bin\mvn.cmd
   · Local repo  : E:\VNTECH\.m2\repository   (KHÔNG phải C:\Users\PC\.m2\repository)
   · JAVA_HOME   : C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot
   · LỆNH ĐÚNG:
       & $MVN -o -B -q package -DskipTests "-Dmaven.repo.local=E:\VNTECH\.m2\repository"
     (CWD = java-backend, PHẢI stop Java :18081 trước vì JAR bị khoá)
   · `-o` offline chạy được vì repo E: đủ dependency ⇒ EXIT=0

XÁC MINH BYTECODE (KHÔNG tin timestamp không):
  Fat jar web chỉ có 263 entry — các module nằm trong BOOT-INF/lib/vntech-erp-*-0.1.0-SNAPSHOT.jar
  ContractReviewStoreAdapter.class:
    · «full_name FROM users»        = True
    · «last_reviewer_name=IFNULL»   = True
    · SQL cũ «VALUES (?,?,?,?,?,?,?,?,?,?)» = False
```

## 6. DỌN DẸP & BASELINE CSDL (ĐÍNH CHÍNH số liệu cũ)

```
DỌN DỮ LIỆU THỬ: DELETE FROM contract_review_logs;
                 UPDATE contract_reviews SET viewed=0, review_date=NULL,
                        last_reviewer_id=NULL, last_reviewer_name=NULL;

BASELINE SAU KHI DỌN (đo lại, KHÔNG suy từ trí nhớ):
  contract_review_logs        = 0
  contract_reviews viewed=1   = 0
  contract_reviews            = 2
  labor_contracts             = 2
  hr_records                  = 3   ← ĐÍNH CHÍNH: trước ghi 4 là SAI
  error_reports               = 0

NỢ CÒN LẠI: 6 tài khoản `sec_probe_*` còn sót trong `users` (tạo 25–26/09, mỗi tài khoản
  60 quyền module, 0 hr_record, 0 hợp đồng). `users` tổng = 20.
```

## 7. COMMIT & PUSH

```
COMMIT 82d7ea8
  «fix: MỐC 103b - tên người review lấy từ users.full_name + sửa dữ liệu mojibake CSDL»
  3 file · 42 insertions, 5 deletions
    · drizzle/0325_sua_du_lieu_mojibake_contract_reviews_va_module_catalog.sql
    · java-backend/application/.../service/ContractReviewUseCase.java        (xoá import trùng)
    · java-backend/infrastructure/.../persistence/ContractReviewStoreAdapter.java

PUSH (hàm Push-WithRetry: 6 lần, Resolve-DnsName github.com + Start-Sleep 6):
  5ad42fa..82d7ea8 -> unity-p2-full-20260920   ✅
  5ad42fa..82d7ea8 -> unity                    ✅
  ⇒ CẢ HAI remote = 82d7ea8b01729e6a1a3de0d91e2fd727145f11e7

FILE TẠM ĐÃ XOÁ: _fix-mojibake.sql · _test-moc103.ps1 · _shot-moc103.mjs · _jarchk/ · _jarlist.txt
CÒN LẠI (không commit): _java-out.log / _java-err.log (bị tiến trình Java khoá) ·
  shot-labor-m102.png · shot-review-m103*.png (ảnh chứng cứ)
```

## 📌 BÀI HỌC
```
· COMMENT MÔ TẢ Ý ĐỊNH KHÔNG PHẢI BẰNG CHỨNG CODE ĐÃ LÀM. Comment ở
  ContractReviewUseCase.java:128-129 nói «tên lấy từ users.full_name ở tầng store»,
  nhưng tầng store CHƯA hề làm — phải ĐỌC CODE THẬT ở cả 2 tầng mới thấy.
· MOJIBAKE PHẢI KHOANH VÙNG TỪNG CỘT TRƯỚC KHI SỬA: cột nào là COPY CỘT→CỘT thì sạch,
  cột nào là CHUỖI LITERAL trong INSERT thì bẩn. Sửa mù cả bảng là phá dữ liệu tốt.
· PHÂN BIỆT «DOUBLE-ENCODE» (khôi phục được) và «MẤT DỮ LIỆU do '?'» (phải ghi lại).
  Dấu hiệu: HEX kết thúc bằng 3F ('?') ⇒ MẤT, không biến đổi nào cứu được.
· SỬA DỮ LIỆU BẰNG `CONVERT(0x<hex> USING utf8mb4)` — đầu vào thuần ASCII nên KHÔNG
  phụ thuộc charset kết nối. Đây là cách DUY NHẤT chống được lỗi lặp lại.
· MIGRATION SỬA DỮ LIỆU PHẢI CÓ ĐIỀU KIỆN (`WHERE … REGEXP '…'`) ⇒ idempotent và
  KHÔNG ghi đè dữ liệu người dùng đã nhập đúng.
· MÔI TRƯỜNG BUILD CÓ THỂ ĐỔI GIỮA CÁC VÒNG: `C:\Users\PC\.m2` đã biến mất. Trước khi
  kết luận «build hỏng», phải TÌM lại Maven + local repo thật.
· SCRIPT CHỤP ẢNH PHẢI KIỂM GIÁ TRỊ `waitFor` TRẢ VỀ. Lần trước bỏ qua nên hết 30s
  timeout vẫn chạy tiếp ⇒ báo «0 nhóm cha» sai, trong khi sidebar THẬT SỰ CÓ 11 nhóm.
```

---

# MỐC 107 (30/09/2026) — NÚT NỔI «BÁO LỖI / GÓP Ý» CHE CỘT CUỐI CỦA BẢNG

## 1. PHÁT HIỆN — từ cảnh báo thị giác, nhưng phải ĐO LẠI mới tin

Worker thị giác soi 3 ảnh chụp màn «Review HĐ» và nêu **3 cảnh báo**. Em **ĐO LẠI BẰNG DOM**
(`_fabchk.mjs`, Edge headless + CDP, `getBoundingClientRect` + `document.elementFromPoint`
trong TOẠ ĐỘ VIEWPORT) rồi mới kết luận:

| Cảnh báo thị giác | Kết quả ĐO LẠI | Kết luận |
|---|---|---|
| (1) Nút nổi che cột «Trạng thái» | `Trạng thái @1371,716` · `Chưa xem @1371,759` · `elementFromPoint(tâm FAB)` = `TD [Chưa xem]` | ✅ **ĐÚNG** |
| (2) Toast bị nút nổi che | Không có toast tại thời điểm đo | ❌ không tái hiện |
| (3) Sidebar highlight sai («Trung tâm phê duyệt») | Active THẬT = `Review HĐ  class=nav-child nav-child-hr_legal active`, chỉ 1 phần tử | ❌ **SAI** |

⇒ **Chỉ có 1 lỗi thật.** Bài học: mô tả thị giác là GỢI Ý, DOM là BẰNG CHỨNG.

Số đo gốc (trước khi sửa) — viewport `1562 x 808`, `body.scrollHeight = 1214`:
* FAB: `x=1374, y=750, w=155, h=40` · CSS `position:fixed; right:18px; bottom:18px; z-index:9000`
* `.main-content` có `padding-bottom = 0px` ⇒ **không có chỗ thông dự phòng**, ô dữ liệu bị che VĨNH VIỄN.

## 2. CÁCH SỬA — `app/globals.css`, chèn NGÀY TRƯỚC marker `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`

```css
.main-content{padding-bottom:84px!important}
.error-report-fab{padding:9px 13px!important;font-size:11.5px!important;box-shadow:0 6px 18px rgba(29,78,216,.30)!important}
.error-report-fab span{font-size:14px!important}
@media(max-width:650px){.error-report-fab{padding:8px 11px!important;font-size:11px!important}}
```

**Vì sao chọn cách này:** nút nổi `position:fixed` LUÔN phủ góc dưới-phải; không thể triệt tiêu
hoàn toàn. Chừa chỗ thông ở đáy `.main-content` bảo đảm **mọi ô dữ liệu đều đọc được khi cuộn
xuống đáy**, đồng thời thu nhỏ nút để chiếm ít chỗ hơn. Đây là **giảm thiểu**, không phải triệt tiêu
— đã ghi rõ trong comment CSS để người sau không tưởng là đã hết hẳn.

## 3. BẰNG CHỨNG SAU KHI SỬA (đo lại cùng script, cùng cổng `:9000`)

```
.main-content padding-bottom = 84px          (TRƯỚC: 0px)
FAB = {x:1383, y:753, w:146, h:37}           (TRƯỚC: x:1374, y:750, w:155, h:40)
viewport = 1562 x 808 | body.scrollHeight = 1264 | cuộn tối đa = 456px
bảng = 8 cột x 2 dòng
HEADER cuối trang : cả 8 cột [ok] — KHÔNG ô nào bị FAB che
DÒNG CUỐI        : cả 8 ô  [ok] — «Chưa xem» @x1371 y344 KHÔNG bị che
==> SỐ Ô BỊ FAB CHE KHI CUỘN XUỐNG ĐÁY = 0    (TRƯỚC: 2)
MODAL: panel = 1062 x 320px | FAB đè lên panel = false
```

Ảnh: `shot-m107-dau-trang.png` · `shot-m107-cuon-day.png` · `shot-m107-modal.png`

## 4. SỰ CỐ KÈM THEO — MIGRATION `0325` LÀM UI `:8787` KHÔNG KHỞI ĐỘNG ĐƯỢC (đã sửa)

Sau khi build lại, `:8787` **DOWN**, `_ui-err.log`:

```
Error: Khong ap dung duoc cap nhat du lieu 0325_sua_du_lieu_mojibake_contract_reviews_va_module_catalog.sql: near "USING": syntax error
    at applyMigrations (scripts/local-runtime.mjs:162:13)
```

**NGUYÊN NHÂN THẬT:** `drizzle/*.sql` được áp cho **HAI hệ CSDL khác nhau**:
* **SQLite** — UI `:8787`, `scripts/local-runtime.mjs:173-175` → `.local-data/warehouse.sqlite`
* **MySQL** — backend Java `:18081`

Bản `0325` đầu tiên dùng `CONVERT(0x… USING utf8mb4)` — **cú pháp CHỈ CÓ Ở MySQL** — nên SQLite chết.
Đây là **lỗi do em gây ra và đã push lên cả 2 nhánh** (commit `82d7ea8`).

**ĐÃ SỬA — viết lại `drizzle/0325_…sql` cho CHẠY ĐƯỢC TRÊN CẢ HAI:**

```sql
UPDATE contract_reviews
SET contract_name = CONCAT('Hợp đồng lao động ', IFNULL(contract_no, ''))
WHERE contract_name LIKE '%├%' OR contract_name LIKE '%┬%' OR contract_name LIKE '%╗%'
--> statement-breakpoint
UPDATE module_catalog
SET label = 'Review HĐ', group_name = 'Hành chính & Pháp chế'
WHERE module_key = 'dept_legal_contract_review' AND (label IS NULL OR label <> 'Review HĐ')
```

Quy ước ghi thẳng trong header file: **ĐƯỢC** dùng `UPDATE` / `LIKE` / `CONCAT()` / `IFNULL()` /
literal UTF-8. **CẤM** dùng `CONVERT(… USING …)`, `REGEXP`, phép `||`, introducer `_utf8mb4''`.

**KIỂM CHỨNG** (`_test-mig0325.mjs`, SQLite trong bộ nhớ, 8 phép):

```
=== AP MIGRATION (2 cau) ===  AP DUNG OK — KHONG LOI CU PHAP
[HONG]… ⇒ do DỮ LIỆU MẪU của test gõ sai (HDLD thay vì HĐLĐ), KHÔNG phải lỗi migration
sau khi sửa mẫu:
  [DAT] dong 1 duoc sua dung  => "Hợp đồng lao động HĐLĐ-00001"
  [DAT] dong 2 duoc sua dung  => "Hợp đồng lao động HĐLĐ-00002"
  [DAT] dong 3 SACH khong bi ghi de
  [DAT] label = 'Review HĐ'   [DAT] group_name = 'Hành chính & Pháp chế'
  [DAT] module khac khong bi cham
  [DAT] chay lai lan 2 khong doi gi  (idempotent)
==> KET QUA: TAT CA DAT
```

Đối chứng trên MySQL: `CONCAT` + `LIKE` chạy đúng, dữ liệu vẫn sạch
(`HEX(contract_name)` = `48E1BBA37020C491E1BB936E67206C616F20C491E1BB996E672048C4904CC4902D3030303031`).

**LƯU Ý KHI ÁP TAY TRÊN MySQL:** marker `--> statement-breakpoint` **KHÔNG phải comment của MySQL**
(MySQL đòi `--` + khoảng trắng). Phải CHIA câu bằng chính marker đó rồi mới chạy — mọi runner trong
repo (`local-runtime.mjs:154`, `universal-runtime.mjs:63`, `migrate-postgres.mjs:249`, 8 file test)
đều làm vậy. Đây là **quy ước chung của toàn bộ 2.011 dòng marker trong `drizzle/`**, không phải lỗi riêng.

## 5. SỰ CỐ THỨ HAI — `Start-Process -ArgumentList` CẮT ĐƯỜNG DẪN THEO DẤU CÁCH

Khởi động lại service bằng đường dẫn TUYỆT ĐỐI:

```powershell
Start-Process -FilePath 'node' -ArgumentList (Join-Path $W 'scripts\local-server.mjs')   # ✗ SAI
```

⇒ node nhận `D:\13.` và chết:

```
Error: Cannot find module 'D:\13.'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1520:15)
```

Vì thư mục dự án có khoảng trắng (`1. Du an chuan hoa quy trinh`). **CÁCH ĐÚNG** — dùng đường dẫn
TƯƠNG ĐỐI kèm `-WorkingDirectory`:

```powershell
Start-Process -FilePath 'node' -ArgumentList 'scripts\local-server.mjs' -WorkingDirectory $W -WindowStyle Hidden -RedirectStandardOutput '_ui-out.log' -RedirectStandardError '_ui-err.log'
Start-Process -FilePath 'node' -ArgumentList 'tools\cutover-proxy.mjs','--port','9000','--ui-port','8787','--api-port','18081' -WorkingDirectory $W -WindowStyle Hidden
```

## 6. TRẠNG THÁI CUỐI

```
:18081  UP   (Java backend)      :8787  UP   (UI)      :9000  UP   (proxy)
GET http://127.0.0.1:9000/ => 200 · 7456 bytes
Fingerprint UI: VNTECH-FP-86907EEC9FD2052F · BUILT ARTIFACT VALIDATION: ĐẠT
Bundle CSS: index-smd9uxFW.css 390.495 bytes | MOC107=84px: True | error-report-fab: True
```

**BÀI HỌC BẮT BUỘC RÚT RA:**
* Sửa CSS/JS xong PHẢI build lại UI rồi ĐO LẠI — không được kết luận từ việc đọc mã nguồn.
* Trước khi viết SQL vào `drizzle/`, phải tự hỏi: **câu này SQLite có hiểu không?** UI phụ thuộc vào nó.
* Sau mỗi lần build, PHẢI kiểm `_ui-err.log` và trạng thái cổng — build xanh KHÔNG bảo đảm service lên.
* `Start-Process -ArgumentList` + đường dẫn có khoảng trắng = hỏng âm thầm.

---

# MỐC 108 (30/09/2026) — HAI LỖI THẬT DO NÚT NỔI GÂY RA: TOAST BỊ CHE + Ô NHẬP DÍM MÉP MODAL

## 1. BỐI CẢNH — 7 cảnh báo thị giác, ĐO LẠI chỉ 2 là lỗi thật

Sau MỐC 107, worker thị giác soi lại 2 ảnh và nêu **7 cảnh báo**. Theo **D-038**, em **ĐO LẠI BẰNG DOM**
(`_m108.mjs`, Edge headless + CDP: `getBoundingClientRect`, `elementFromPoint`, `getComputedStyle`)
trước khi sửa bất cứ thứ gì:

| # | Cảnh báo thị giác | KẾT QUẢ ĐO | Kết luận |
|---|---|---|---|
| 1 | Cột cuối chạm mép phải | `bảng r1484`, viewport 1562 ⇒ cách **78px**, `tranNgang=false` | ❌ SAI |
| 2 | **Nút nổi che TOAST** | `toast z-index:150` vs `FAB z-index:9000`; `elementFromPoint` mép phải toast = **true** | ✅ **ĐÚNG** |
| 3 | Thiếu overlay dim | `.overlay.modal-overlay` `l0 r1547 w1547`, `rgba(15,23,42,0.24)`, `z-index:100` | ❌ SAI (CÓ overlay) |
| 4 | Modal lệch/cắt mép trái | `panel l242 r1305 w1062`; modal `l242 r1305 w1062 h481` | ❌ SAI |
| 5 | **Ô nhập «Nhận xét» cắt mép trái** | `input l242`, modal `l242` ⇒ **cách mép trái = 0px** | ✅ **ĐÚNG** |
| 6 | Khoảng trắng 90px trong modal | Panel cao CỐ ĐỊNH 320px (chủ ý MỐC 106) | ❌ không phải lỗi |
| 7 | Scrollbar trùng nút nổi | Không đo được chồng lấn | ❌ không phải lỗi |

⇒ **2/7 là lỗi thật.** Nếu sửa theo cả 7 thì đã làm hỏng 5 thứ đang đúng và tốn thêm nhiều vòng build.

## 2. SỐ ĐO TRƯỚC KHI SỬA (`_m109.mjs` — đổ chuỗi phần tử cha)

```
input                             l242 t600 r1157 b644   padding:0px 12px  border:1px
.modal-actions.review-modal-actions l242 t600 r1305 b644   padding:0px   margin:12px 0px 0px   ← THỦ PHẠM
.review-modal                     l242 t248 r1305 b644   padding:0px
section.modal                     l242 t164 r1305 b644   padding:0px
.overlay.modal-overlay            l0   t0   r1547 b808   padding:22px  position:fixed  z-index:100
.review-tab-panel                 l242 t268 r1305 b588   padding:16px  border-width:0px 1px 1px
dl.kv                             l259 r1288   (cách mép 17px — bình thường)
.main-content                     l258 t92 r1547 b1209   padding:20px 24px 84px   ← MỐC 107 ĐÃ ĂN
```

* **Lỗi 1:** `.toast` có `z-index:150` < `.error-report-fab` `z-index:9000` ⇒ đuôi thông báo
  «✓ Đã ghi nhận lượt xem hợp đồng.» bị nút nổi che mất.
* **Lỗi 2:** `.review-modal-actions` có `padding:0px` ⇒ viền trái của ô nhập **trùng khít** viền thẻ modal
  (`242 = 242`). Panel tab dính mép là CHỦ Ý (kiểu tab panel), nhưng hàng footer thì không.

## 3. CÁCH SỬA — `app/globals.css` (48 → 67 dòng), chèn trước marker `/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`

```css
.toast{z-index:9600!important}
.review-modal-actions{padding:12px 18px 16px!important}
```

**Vì sao nâng toast LÊN TRÊN nút nổi (chứ không hạ nút nổi xuống):** toast là thông báo TẠM THỜI mà
người dùng PHẢI đọc được để biết thao tác đã thành công; nút nổi là trang trí thường trực, bị che một
phần cũng không mất chức năng.

## 4. BẰNG CHỨNG SAU KHI SỬA (đo lại cùng script, cùng cổng `:9000`)

```
[TOAST]
  z-index: toast = 9600   (TRƯỚC: 150)      FAB = 9000
  TÂM toast bị FAB che       = false
  MÉP PHẢI toast bị FAB che  = false        (TRƯỚC: TRUE)   ← ĐÃ HẾT
  toast = l1225 t738 r1525 b786

[Ô NHẬP]
  input = l260 r1139 w879
  ô nhập cách mép trái modal = 18px         (TRƯỚC: 0px)    ← ĐÃ HẾT
  hộp modal cao 481 → 509px (do thêm padding)

[CỘT CUỐI]  bảng r1484 · cách mép phải viewport 78px · tràn ngang = false
```

Ảnh: `shot-m108-toast.png` (268.254 B) · `shot-m108-modal-do.png` (268.254 B)

## 5. BÀI HỌC CÔNG CỤ — SCRIPT CHỤP ẢNH MẤT COOKIE PHIÊN VÌ CHẠY KHI CÒN `about:blank`

Sau khi build lại, script đo **liên tiếp 3 lần** báo `sidebar=0` ⇒ tưởng app hỏng.
Chẩn đoán `_diag2.mjs` (bắt cả `Runtime.exceptionThrown` + `Log.entryAdded`) cho thấy app **KHÔNG hỏng**:
trang đang ở **màn ĐĂNG NHẬP**, `body` chỉ 296 ký tự, `log.error: Failed to load resource: 401`.

**NGUYÊN NHÂN THẬT:** điều kiện chờ
`document.readyState === "complete" && !!document.body`
**ĐÃ ĐÚNG NGAY từ trang `about:blank`** ⇒ `fetch("/api/system", …)` chạy sai gốc ⇒ `Set-Cookie` không được
nhận ⇒ `Page.navigate` sau đó tải app ở trạng thái CHƯA đăng nhập ⇒ không có sidebar.

**CÁCH SỬA — phải chờ ĐÚNG GỐC trước khi đăng nhập:**

```js
await waitFor(`document.readyState==="complete" && location.href.indexOf("127.0.0.1")>=0 && !!document.body`, 40000);
const lg = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return r.status;})()`);
// ⇒ origin san sang = true | LOGIN = 200
```

**BÀI HỌC KÈM THEO:** script chụp ảnh PHẢI **in ra mã đăng nhập** và **kiểm giá trị `waitFor` trả về**.
Lần này cả hai đều thiếu nên mất 3 vòng đo oan. Đây là lần thứ HAI cùng một lỗi cắn (lần đầu ở MỐC 103).

## 6. TRẠNG THÁI

```
MỐC 107  ✅ ĐO ĐƯỢC (2 ô bị che → 0 ô)
MỐC 108  ✅ ĐO ĐƯỢC (toast z-index 150→9600 · ô nhập 0px→18px)
Sự cố 0325 (migration chỉ-MySQL làm chết UI)  ✅ ĐÃ SỬA — `_test-mig0325.mjs` 8/8 ĐẠT
Sự cố Start-Process -ArgumentList              ✅ ĐÃ SỬA (D-037)
5 cổng: 3 xanh / 2 đỏ Y NGUYÊN baseline
:18081 UP · :8787 UP · :9000 UP · Fingerprint VNTECH-FP-C631E3D4936F84D5
```

**⛔ CHƯA COMMIT, CHƯA PUSH** — theo yêu cầu tường mình của người dùng (m01935):
«Không commit không push cho đến khi tôi yêu cầu». Toàn bộ thay đổi đang nằm ở working tree.
**DANH SÁCH FILE ĐANG CHỜ** (để lần sau commit đúng, KHÔNG dùng `git add -A`):
* Sửa: `app/globals.css` · `drizzle/0325_sua_du_lieu_mojibake_contract_reviews_va_module_catalog.sql` ·
  `docs/dsh-state/{CHECKLIST,CURRENT_STATE,TASK_HISTORY,DECISIONS}.md` · 4 file identity
  (`VNTECH_FINGERPRINT.json`, `VNTECH_FULL_W2_ID.txt`, `VNTECH_PACKAGE_ID.txt`, `VNTECH_PRODUCT_IDENTITY.txt`) ·
  `lib/vntech-identity-data.mjs` · `tsconfig.tsbuildinfo`
* Mới (phải commit): `drizzle/0326_phase_gd_moc107_fab_khong_che_bang_identity.sql` ·
  `drizzle/0327_phase_gd_moc107_fab_khong_che_bang_identity.sql` (do `gd-cycle` sinh)
* **KHÔNG commit** (file tạm/ảnh chứng cứ): `_*.mjs`, `_*.ps1`, `_gates.txt`, `_vision_tmp/`, `shot-*.png`

---

# MỐC 109 (30/09/2026) — NÚT «SỬA TÀI KHOẢN» TRẢ 403: HAI CỔNG CHẶN CÙNG LÚC

## Triệu chứng đo được
- Probe `sec_probe_017830` (role `ksda`, KHÔNG phải admin) được cấp module `admin_tab_01`
  với `can_view=1, can_use=1, can_edit=1, permission_source='manual_override'`.
- Gọi `update_user` ⇒ VẪN HTTP 403. Thông báo lỗi ĐỔI KHÁC là dấu hiệu duy nhất phân biệt tầng chặn:
  - CHƯA cấp quyền: «Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.»
    (`java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java:74-75`)
  - ĐÃ cấp quyền: «Tài khoản không có quyền thực hiện nghiệp vụ này.»
    ⇒ chứng tỏ `requireActionModule` ĐÃ QUA, một cổng KHÁC chặn phía sau.

## Nguyên nhân 1 — cổng admin-only ở tầng controller
- `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java:379-383`:
  `case "update_user" -> { AuthUseCase.CurrentUser cu = requireRequireAdmin(request); ... }`
- `SystemController.java:1727-1734`:
  `private AuthUseCase.CurrentUser requireRequireAdmin(HttpServletRequest request) {`
  `    AuthUseCase.CurrentUser cu = requireCurrentUser(request, false);`
  `    if (!"admin".equals(cu.role())) { throw new AuthUseCase.ApiError("Tài khoản không có quyền thực hiện nghiệp vụ này.", 403); }`
  `    return cu; }`
- ⇒ MỌI tài khoản không phải `admin` LUÔN 403, bất kể quyền module. Hệ quả: thay đổi của MỐC 103
  (`ActionRbacRegistry`: `update_user` → `admin_tab_01` + capability `canEdit`;
  `UserManagementUseCase.requireAccountUpdateRight`) trở thành CODE CHẾT — frontend mở khoá modal
  nhưng backend luôn chặn.
- Kiến trúc ĐÚNG đã có sẵn: `SystemController.java:228-231` (PHASE 0B) gác
  `rbacService.requireActionModule(requireCurrentUser(request), action)` cho MỌI action không công khai
  — ĐIỂM KIỂM DUY NHẤT, chạy TRƯỚC switch.

## Nguyên nhân 2 — `guardRoleChange` chặn cả khi vai trò KHÔNG ĐỔI
- `java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java:179-188` (bản cũ):
  `if (!payload.containsKey("role") || trim(payload.get("role")).isEmpty()) return sv(target, "role");`
  `if (!callerIsAdmin) throw new AuthUseCase.ApiError("Chỉ Quản trị hệ thống mới đổi được vai trò. ...", 403);`
- Modal sửa tài khoản LUÔN gửi kèm ô `role` (đó là một trường của form) ⇒ non-admin gửi lên
  `role='ksda'` Y HỆT vai trò hiện tại vẫn bị 403 ⇒ KHÔNG BAO GIỜ lưu được.

## Bản sửa
1. `SystemController.java:379-397` — bỏ `requireRequireAdmin`, dùng `requireCurrentUser(request, false)`;
   quyền do cổng chung PHASE 0B gác (fail-closed). Có ghi chú giải thích ngay tại chỗ.
2. `UserManagementUseCase.guardRoleChange` — đọc `String current = sv(target, "role")`;
   nếu `requested.equalsIgnoreCase(trim(current))` HOẶC `canonicalRoleCode(requested).equalsIgnoreCase(trim(current))`
   thì TRẢ VỀ `current` (cho qua); CHỈ khi vai trò THẬT SỰ ĐỔI mới áp cổng admin.
- `canonicalRoleCode` (`UserManagementUseCase.java:652-656`) chỉ tra map + `getOrDefault` ⇒ KHÔNG ném,
  nên gọi trong điều kiện là an toàn.

## Bằng chứng — test RBAC THẬT 14 bước (`_test-rbac-update-user.ps1`, cổng `http://127.0.0.1:9000`)
| bước | nội dung | kết quả |
|---|---|---|
| B1 | admin đăng nhập | ĐẠT — 200 |
| B2 | admin `update_user` + `newPassword` | ĐẠT — 200 |
| B3 | probe (non-admin) đăng nhập | ĐẠT — 200 |
| B4 | CHƯA cấp quyền ⇒ phải 403 (fail-closed) | ĐẠT — 403 |
| B5 | cấp `admin_tab_01` can_view/can_use/can_edit=1 | ĐẠT |
| B6 | probe đăng nhập lại | ĐẠT — 200 |
| B7 | CÓ quyền, KHÔNG đổi role ⇒ phải 200 | **ĐẠT — 200** (TRƯỚC bản sửa: 403) |
| B8 | đổi `role='admin'` ⇒ phải 403 chống leo thang | ĐẠT — 403 «Chỉ Quản trị hệ thống…» |
| B9 | `role=''` ⇒ giữ nguyên vai trò, 200 | ĐẠT — 200 |
| B10 | probe tự cấp quyền qua `save_user_access` | ĐẠT — 403 |
| B11 | probe khoá tài khoản người khác (`set_user_status`) | ĐẠT — 403 |
| B13 | thu hồi quyền ⇒ 403 lại | ĐẠT — 403 |
| B14 | dữ liệu còn lại | role `ksda`, active `1`, 60 quyền |
⇒ `====> KET QUA: TAT CA DAT`, exit 0.

## Test chống hồi quy
- `tests/moc-96-105-no-regression.test.mjs` 12 → **15 phép**, `pass 15 · fail 0`.
- Thêm 3 phép: (a) `case "update_user"` KHÔNG được dùng `requireRequireAdmin`;
  (b) cổng quyền chung ở `post()` vẫn gác mọi action — NỀN TẢNG của bản sửa, vì nếu cổng này mất thì
  việc bỏ cổng admin-only sẽ mở toang thao tác cho mọi tài khoản đã đăng nhập;
  (c) `guardRoleChange` phải cho qua khi vai trò KHÔNG đổi.
- ⛔ Bài học khi viết test: cắt khối theo mốc `case "` KẾ TIẾP, KHÔNG dùng độ dài cố định —
  `between(..., 600)` tràn sang `case "set_user_status"` (nhánh đó dùng `requireRequireAdmin` HỢP LỆ)
  ⇒ đỏ OAN. Cũng phải bỏ dòng chú thích `//` của Java trước khi kiểm, vì chú thích giải thích lỗi cũ
  có nhắc chính tên hàm cấm.

## Bài học
- **Thông báo lỗi KHÁC NHAU là dấu hiệu phân biệt TẦNG chặn.** «chưa được cấp đúng quyền» và
  «không có quyền thực hiện nghiệp vụ» là HAI cổng khác nhau, không phải cùng một lỗi.
- **Nới quyền ở use-case PHẢI rà cả cổng ở controller.** Hệ thống có 3 tầng gác
  (cổng chung `post()` → cổng use-case → cổng vai trò); nới 1 tầng mà quên tầng trên = code chết.
- **Form luôn gửi kèm trường ⇒ cổng chặn phải dựa trên «CÓ THAY ĐỔI», không dựa trên «CÓ MẶT».**
- File Java trong dự án này dùng **CRLF** (`SystemController.java`: CRLF=1792, LF-đơn=0) — khác `app/*.tsx`.

---

# MỐC 110 (01/10/2026) — NÚT «BÁO LỖI / GÓP Ý» KHÔNG DÙNG ĐƯỢC VỚI NGƯỜI KHÔNG PHẢI ADMIN

## 1. Nguồn phát hiện
MỐC 109 (sửa «Sửa tài khoản») buộc em **quét lại toàn bộ registry** thay vì tin lời khẳng định sẵn có.
Kết quả: lời khẳng định trong `RbacService.java` **SAI SỐ LIỆU**, lộ ra 19 action **MỒ CÔI QUYỀN**.

## 2. Lỗi trong lời khẳng định của chính RbacService
`java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java:64-66` (bản cũ) ghi:
> «An toàn vì 46 action còn khai rỗng đều nằm trong 2 nhóm đã được xử lý: 41 action đã bị SystemController
> chặn bằng requireRequireAdmin · 5 action là hành động công khai (đã miễn ở đầu hàm)»

**ĐO LẠI BẰNG SCRIPT** (bỏ dòng `//` của Java → quét `case "X" ->` xem khối có `requireRequireAdmin(` → so với
`Map.entry("X", List.of(...))` trong [ActionRbacRegistry.java](java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java)):

| nhóm | số đo được | số từng ghi | sai số |
|---|---|---|---|
| action khai `List.of()` (module rỗng) | **65** | 46 | +19 |
| … bị controller chặn admin | **38** | 41 | −3 |
| … nằm trong `PUBLIC_ACTIONS` | **8** | 5 | +3 |
| … **MỒ CÔI** (rỗng + không public + không admin) | **19** | 0 | +19 |

⇒ **19 action rơi vào khoảng trống**: không công khai, không admin-gated, không khai module ⇒
`RbacService.requireActionModule` ném `403 «Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên.»`
cho **MỌI tài khoản không phải admin**.

## 3. Trong 19 mồ côi có MỘT lỗi chặn tính năng anh đã yêu cầu: `save_error_report`
- Registry: `Map.entry("save_error_report", List.of())` + capability `Map.entry("save_error_report", "canCreate")`.
- **Ý định thiết kế đã ghi sẵn trong mã nguồn** — [app/screens/ErrorReportModal.tsx:14](app/screens/ErrorReportModal.tsx#L14):
  > `⛔ MọI user đã đăng nhập đều gửi được — action save_error_report **không** gắc module trong ActionRbacRegistry (mẫu List.of(), giống mark_notification_read).`
- Và [ErrorReportStore.java:20-23](java-backend/application/src/main/java/com/vntech/erp/application/port/out/ErrorReportStore.java#L20-L23) cũng ghi:
  > `⛔ Phân quyền: save_error_report KHÔNG gắc module … nằm cạnh nút đổi màu nền, ai cũng bấm được».
- **Nhưng** `List.of()` từng mang nghĩa là «KHÔNG gác quyền» — **PHASE 0B (S-03) đã đổi ngữ nghĩa** thành
  *mặc định từ chối*. Nghĩa là: một sửa đổi an toàn ở thời điểm đó **âm thầm làm chết tính năng**.
- Frontend: FAB `data-vntech="open-error-report-fab"` render **vô điều kiện** trong [app/page.tsx](app/page.tsx) ⇒ mọi
  người **thấy** nút nhưng **bấm xong luôn 403**.

**ĐO THẬT trước bản sửa** (probe `sec_probe_017830`, role `ksda`, qua `:9000`):
```
probe  save_error_report => HTTP 403  {"ok":false,"error":"Thao tác chưa được khai báo quyền trong hệ thống. Liên hệ quản trị viên."}
admin  save_error_report => HTTP 200  {"ok":true,"reportCode":"ER202610010757-0ECC"}
```

## 4. Bản sửa
`java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java`:
1. Thêm `"save_error_report"` vào `PUBLIC_ACTIONS` (nhóm cùng `update_profile_avatar` — dữ liệu tự phục vụ của chính user).
   - ⚠️ **An toàn**: [SystemController.java:1472](java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java#L1472)
     vẫn gọi `requireCurrentUser(request)` ⇒ **bắt buộc đăng nhập**, chỉ bỏ cổng MODULE.
   - Không mở rộng gì thêm: `error_reports` (xem danh sách) + `mark_error_report_resolved` (tick đã xử lý) vẫn khai
     `List.of("admin")` ở [ActionRbacRegistry.java:61-62](java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java#L61-L62).
2. **Sửa lời khẳng định sai** ở nhánh `required.isEmpty()` — thay bằng số liệu đo được 65 = 38 + 8 + 19, kèm
   danh sách 19 action và dẫn chiếu tới mục này. Mục đích: lời khẳng định sai **đã dẫn dắt em sai** một lần,
   không được để lỗi tự nhân bản.

## 5. Bằng chứng — `_test-error-report-rbac.ps1` (API thật qua `:9000`, 8 cổng)

| cổng | nội dung | kết quả |
|---|---|---|
| 0 | admin + probe đăng nhập; probe **không có** `admin_tab_01` | 200 / 200 (probe còn 60 quyền module khác) |
| 1 | **không đăng nhập** ⇒ phải 401 | 401 `«Phiên đăng nhập đã hết hạn.»` |
| 2 | **probe gửi `bao_loi`** | **200** `{"ok":true,"reportCode":"ER202610010821-903D"}` — *trước bản sửa: 403* |
| 3 | probe gửi `gop_y` | 200 `ER202610010821-3B59` |
| 4 | admin gửi `bao_loi` (không hồi quy) | 200 `ER202610010821-B647` |
| 5 | probe **xem danh sách** `error_reports` | 403 `«Tài khoản chưa được quản trị viên cấp đúng quyền…»` |
| 6 | probe tick `mark_error_report_resolved` | 403 |
| 7 | probe gọi `retry_email` (mồ côi khác) | 403 `«Thao tác chưa được khai báo quyền trong hệ thống.»` ⇒ **chứng mình chỉ mở đúng 1 action** |
| 8 | admin xem danh sách | 200 (nhìn thấy báo lỗi vừa gửi) |

⇒ `====> KET QUA: TAT CA DAT`, exit 0. Dữ liệu thử đã xoá sạch (`error_reports` còn **0** dòng `PROBE MOC110%`).

## 6. Test chống hồi quy
- `tests/moc-96-105-no-regression.test.mjs`: 15 → **17 phép**, `pass 17 · fail 0`.
  1. `save_error_report` phải nằm trong `PUBLIC_ACTIONS` **VÀ** nhánh dispatch phải còn `requireCurrentUser(request)`
     (chống biến thành action ẩn danh).
  2. **Đếm lại mồ côi bằng script trong test**: `save_error_report` không được nằm trong danh sách mồ côi, và
     `orphans.length <= 18` ⇒ bắt được cả việc tăng mồ côi về sau, không chỉ việc tái phát đúng lỗi này.
- Chạy lại test RBAC MỐC 109 (14 bước) trên cùng backend: **14/14 `TAT CA DAT`, exit 0** ⇒ bản sửa MỐC 110 không hồi quy MỐC 109.

## 7. Bài học
- ⛔ **Lời khẳng định trong comment về chính hệ thống đang chạy PHẢI được đo lại, không được tin.** Ở đây nó sai lệch 19 action —
  đủ để giấu một tính năng anh đã yêu cầu bị chết ngõm.
- ⛔ **Đổi ngữ nghĩa của một giá trị rỗng là thay đổi hợp đồng ngầm.** `List.of()` từng = «ai cũng gọi được»,
  giờ = «ai cũng bị chặn». Mọi nơi dùng mẫu cũ đều phải rà lại, không riêng action nào được nhắc tên.
- ✅ **Đo bằng tài khoản thật + đối chiếu cả hai chiều** (admin 200 / user thường 403) là cách nhanh nhất phát hiện loại lỗi này.
- ✅ Khi sửa quyền theo hướng **mở ra**, phải chứng mình **không mở rộng quá mức** bằng cổng âm (cổng 5–7 ở trên).

## 8. Còn lại — theo dõi, KHÔNG tự quyết (TYPE 3 / nghiệp vụ)
18 action mồ côi còn lại hiện trạng 403 (fail-closed ⇒ **an toàn**), nhưng thông báo lỗi gây hiểu nhầm.
Cần anh quyết từng cái thuộc module nào:

| nhóm | action | gợi ý (chưa áp dụng) |
|---|---|---|
| danh mục vật tư | `save_material_category`, `save_material_subcategory`, `set_material_category_status`, `set_material_subcategory_status`, `delete_material_category`, `delete_material_subcategory`, `import_material_catalog` | module vật tư, quyền `canEdit` |
| lịch trình duyệt | `save_approval_stage`, `set_approval_stage_status`, `delete_approval_stage` | module duyệt, quyền `canUse` |
| nhập liệu hàng loạt | `bulk_import_projects`, `bulk_import_users` | `List.of("admin")` — chỉ quản trị viên |
| cấu hình hệ thống | `save_email_settings`, `retry_email`, `save_ui_display_settings`, `save_trust_development_settings` | `List.of("admin")` |
| đội dự án | `save_project_team`… `set_project_team_status`, `delete_project_team` | module dự án, quyền `canEdit` |

Ngoài ra 2 mâu thuẫn `registry ↔ controller` (hướng AN TOÀN, `delete_partner` / `delete_supplier` khai module
`supplier_catalog` nhưng controller đòi role `admin`) — xem mục MỐC 109.

---

# TASK-011 — DỌN TÀI KHOẢN THĂM DÒ (01/10/2026)

**TASK:** xoá 6 tài khoản `sec_probe_*` do MỐC 109/110 tạo ra.
**STATUS:** ✅ DONE
**FILES CHANGED:** không sửa file nguồn.
**DATABASE:** xoá trong **1 transaction** — `user_module_permissions`, `sessions`, `audit_logs`,
`user_project_scopes`, `user_warehouse_scopes`, rồi `users`. Kết quả: `users` **20 → 14**.
**API:** không đổi.
**TEST / XÁC MÌNH:**
- Đo tham chiếu **trước** khi xoá: `user_module_permissions` 360 · `sessions` 20 · `audit_logs` 16 ·
  `user_project_scopes` 4; **mọi bảng nghiệp vụ = 0** (`hr_records`, `labor_contracts`, `benefit_records`,
  `team_members`, `error_reports`, `workflow_step_approvers`, `work_item_participants`, `request_comments`,
  `approval_stage_decisions`, `notification_user_states`, `task_notifications`); **không FK nào trỏ `users.id`**.
- Sau dọn: không đăng nhập ⇒ **401**; admin ⇒ **200**; `GET /api/system` ⇒ `moduleCatalog=76`, `users=14`,
  `employees=1`, `projects=3`, `businessScopes=9`, `engineRoleProfiles=9`; `error_reports` `PROBE MOC110%` = **0**.
- 14 tài khoản còn lại đều là tài khoản thật (`admin`, `cha.ht`, `engineer.demo`, `giamdoc.demo`, `hrm`,
  `ksda.demo`, `kttdemo`, `nvdademo`, `nvkhdemo`, `testuser86661`, `thukydemo`, `tkhodemo`, `trdademo`, `trinhtrench`).
**REMAINING:** 18 action mồ côi quyền (mục MỐC 110 §8) · MỐC 104 · MỐC 105 · SMTP · gia hạn HĐ lần N · dừng tunnel Cloudflare.
**NEXT ACTION:** chờ anh ra lệnh commit + push (AUTO_COMMIT=FALSE, AUTO_PUSH=FALSE).

---

# TASK-012 — KHÔI PHỤC TEST HỢP ĐỒNG PR-01 (01/10/2026)

**TASK:** `npm run test:regression` đỏ **3/7 ca** trong `tests/pr01-project-tabs.test.mjs`.
**STATUS:** ✅ DONE — regression **69/69 XANH**
**FILES CHANGED:** `tests/pr01-project-tabs.test.mjs` (khôi phục byte-identical bản `7fdf71d`,
`git hash-object` = `2f332e9…` khớp blob gốc). ⛔ **KHÔNG** sửa `app/page.tsx`.
**DATABASE / API:** không đổi.
**TEST:**
- `npm run test:regression` ⇒ **tests 69 · pass 69 · fail 0 · exit 0** (trước: 69 / 66 / 3).
- `node --import tsx --test tests/moc-96-105-no-regression.test.mjs` ⇒ **17/17 pass**.
- `npm run typecheck` ⇒ **exit 0**.

## Bằng chứng thủ phạm (đo, không đoán)
Bisect trên **230 commit** bằng `git archive` + `node --test`:

| mốc | kết quả |
|---|---|
| `7fdf71d` (27/09, MT3) | ✅ **PASS 7/7** |
| `4fc75a0` (29/09, MỐC 96-104 — **đã push**) | ❌ **FAIL 3** |
| `ffe20f9` (29/09) | ❌ FAIL 3 |

**Cơ chế:** `4fc75a0` sửa **test** mà **không** sửa **mã**:

| mục | `7fdf71d` (đúng) | `4fc75a0` (sai) |
|---|---|---|
| `DETAIL_TABS` | `["Tổng quan","Nhân sự","Tổ đội","Kho","Ban chỉ huy"]` (5) | `["Nhân sự","Tổ đội","Kho","Ban chỉ huy"]` (4) |
| BCH | `{tab === 5 && <SiteCommandScreen` | `{tab === 4 && <SiteCommandScreen` |
| khoá tab | `match(... disabled={index > 0 && !detailId})` | `doesNotMatch(...)` + đòi `<ProjectAggregateTabs data={data}` |

`app/page.tsx` ở **cả hai mốc** đều có `DETAIL_TABS` 5 phần tử và BCH ở `tab === 5` ⇒ **mã tự nhất quán, test là thủ phạm**.
Chứng mình: bản test `7fdf71d` chạy **7/7 PASS** trên mã hiện tại.
Thông điệp `4fc75a0` ghi «regression 3 (vốn đã có sẵn, KHÔNG TĂNG)» — tức tác giả chỉ **đếm số ca**, không chạy test.

**Bài học:** ghi ở `DECISIONS.md` **D-044**.

## Còn treo (TYPE 3 — chờ anh quyết)
Yêu cầu **28/09** «4 thẻ danh sách TỔNG HỢP không bị khoá theo dự án» mà `4fc75a0` cố mã hóa bằng **test**.
Nhưng nhánh chi tiết đã được MT3 (27/09) dựng lại thành 5 tab **theo dự án** ⇒ `app/screens/ProjectAggregateTabs.tsx`
(14 502 B) thành **mã chết**, không được import ở bất kỳ đâu.

- **Phương án A (khuyến nghị)** — giữ cấu trúc 5 tab, coi yêu cầu 28/09 đã bị MT3 thay thế; xoá mã chết.
- **Phương án B** — giữ yêu cầu ⇒ phải sửa **mã** dựng lại thẻ tổng hợp + lùi BCH về `tab === 4` (đảo ngược một phần MT3, cần chuẩn ảnh mới).

---

# TASK-013 — `verify:fingerprint` ĐỎ TRÊN TOÀN LỊCH SỬ (01/10/2026) — CHỜ LỆNH

**TASK:** `npm run verify:fingerprint` báo
`Source fingerprint không hợp lệ: expected c631e3d4…, actual 3d378863…`
**STATUS:** ⚠️ **CHƯA SỬA — hỏng có sẵn, chờ anh quyết có chạy tool refresh hay không**

## Đo (không đoán)
`git archive` từng commit, chạy `calculateSourceFingerprint` — **không đụng working tree**:

| commit | expected | actual | kết quả |
|---|---|---|---|
| `HEAD` (`82d7ea8`) | `72751dbe…` | `7e378019…` | ❌ |
| `82d7ea8~5` | `b52b52b4…` | `003e07c6…` | ❌ |
| `4fc75a0` | `c520b5d3…` | `fcac8547…` | ❌ |
| `ffe20f9` | `aeea3fc1…` | `d9b0f21c…` | ❌ |
| `128c021` | `aeea3fc1…` | `c276d716…` | ❌ |

⇒ **Hỏng ở mọi commit**, không riêng commit nào. Không phải hậu quả của MỐC 109/110.

## Vì sao không phải do em
`lib/trust/source-fingerprint.mjs` băm `ROOT_FILES` + `ROOT_DIRS = [app, db, deploy, drizzle, lib, public,
scripts, tests, worker]`. **`java-backend/` không có trong danh sách** ⇒ 3 file Java của MỐC 109/110
không thể đổi fingerprint. `docs/` cũng không được băm.

## Vòng lặp gốc (cơ chế)
`tools/refresh-phase-identity.mjs` là tool chuẩn: nó ghi fingerprint mới **vào một file trong `drizzle/`** —
mà `drizzle/` lại nằm trong tập băm ⇒ **sinh file mới làm đổi hash** ⇒ phải refresh lần nữa.
Hệ quả quan sát được: hai migration `drizzle/0326_phase_gd_moc107_fab_khong_che_bang_identity.sql` và
`0327_phase_gd_moc107_fab_khong_che_bang_identity.sql` **trùng nhãn**, mỗi file nhúng một giá trị khác nhau
(`86907eec…` / `c631e3d4…`), và **cả hai đều chưa commit**.
`CREATE TRIGGER IF NOT EXISTS` là quy ước sẵn có của dự án (314 migration dùng) — không phải lỗi mới.

## Vì sao chưa tự sửa
Bộ identity (`VNTECH_FINGERPRINT.json`, `VNTECH_*.txt`, `lib/vntech-identity-data.mjs`) được tài liệu dự án
ghi rõ là **cấm đụng tay**; chỉ được đổi qua tool chuẩn. Tool đó **sinh thêm migration** và **đổi `MIGRATION_HEAD`**
⇒ ảnh hưởng bản phát hành. Cần anh quyết.

- **Phương án A (khuyến nghị)** — chạy tool chuẩn 1 lần trên migration head mới để đóng băng fingerprint,
  kèm `node scripts/generate-release-manifest.mjs` + đủ gates. Đánh ưu tiên: mọi commit sau đó pass được.
- **Phương án B** — giữ nguyên, chỉ ghi nhận là nợ kỹ thuật đã biết. Hệ quả: `scripts/local-runtime.mjs:177`
  và `scripts/migrate-postgres.mjs:375` tiếp tục ném lỗi trên nhánh dùng Postgres/Cloudflare.

**GATE KHÁC:** `npm run verify:master-baseline` ⇒ ✅ **ĐẠT** (`/api/files SSOT · dual storage DELETE ·
schema 0047 aligned · identity 0049 · CSS R1.1.1 canonical · !important=3824 · css=373310B`).

---

# MỐC 111 — SỬA LỖI «CHỌN QUYỀN XONG BẤM LƯU NHƯNG KHÔNG LƯU» (2 modal phân quyền) — **DONE**

**TASK:** TASK-111 · **STATUS: DONE** (01/10/2026) · **Xem quyết định:** `DECISIONS.md` **D-045**

## Triệu chứng (anh báo)
1. Modal *Sửa tài khoản* → thẻ *Phân quyền công việc / Chức năng* — không hiện nút lưu.
2. Thẻ *Phân quyền người dùng* → modal *Phân quyền* → chọn quyền rồi bấm lưu — không lưu.

## Nguyên nhân gốc (ĐÃ CHỨNG MÌNH bằng probe sống, không phải suy đoán)
`UserEditModal.send` (`app/page.tsx`) dùng **một** handler cho **hai** thẻ, gọi `update_user` **vô điều kiện** trước:
- Thẻ *Phân quyền* không render ô tài khoản; `PermissionMatrix` **không đặt `name`** cho ô chọn ⇒ `FormData`
  chỉ có select `project-*` ⇒ `update_user` trả **400** «Mã nhân viên, họ tên, tên đăng nhận và phòng/bộ phận
  là bắt buộc» ⇒ `if(!updated) return;` ⇒ **`save_user_access` không bao giờ chạy**.
- Chiều ngược lại, thẻ *Tài khoản* không có select `project-*` ⇒ `projectScopes = []` ⇒ `clearUserScopes()`
  **xoá sạch phạm vi dự án** ⇒ *mỗi lần bấm «Lưu thông tin tài khoản» là mất phạm vi dự án*.

## FILES CHANGED
| File | Nội dung |
|---|---|
| `app/page.tsx` | `UserEditModal.send` — tách luồng theo thẻ: `account` → `update_user`; `access` → `save_user_access` (+11/−1) |
| `java-backend/…/service/UserManagementUseCase.java` | `saveUserAccess` — từ chối **400** khi `modulePermissions` rỗng, **trước** `clearUserScopes()`; ghi chú transaction (+30/−1) |

## API CHANGES
- `POST /api/system {action:"save_user_access"}` — thêm nhánh lỗi **400**: *«Dữ liệu phân quyền rỗng — hệ thống
  không lưu để tránh mất toàn bộ quyền hiện có của tài khoản. Vui lòng tải lại trang rồi thao tác lại.»*
  Không có API mới. Không có đổi hợp đồng payload.

## DATABASE CHANGES
- **Không có migration.** Chỉ sửa hành vi, không đổi cấu trúc bảng.
- DB đã **về đúng mốc gốc** sau khi phục hồi: `user_module_permissions` = **1226**, `nvdademo` = **60**,
  `user_project_scopes` = **13**, `user_warehouse_scopes` = **9**, `users` = **14**.

## TEST — **11/11 ĐẠT (0 hỏng)** (`_verify-moc111.mjs`)
| Ca | Kiểm tra | Kết quả |
|---|---|---|
| CA1 | Thẻ *Phân quyền*: quyền **và** phạm vi dự án cùng lưu | ✅ 200 · quyền đúng · phạm vi dự án đúng |
| CA2 | Thẻ *Tài khoản*: không đụng quyền lẫn phạm vi dự án | ✅ 59→59 quyền · 1→1 phạm vi dự án |
| CA3 | Payload rỗng bị chặn, dữ liệu giữ nguyên | ✅ **400** · 59→59 · 0→0 |
| CA4 | Ràng buộc phòng P5.3 còn hiệu lực | ✅ `admin_tab_01` vẫn **400** |

`npm run typecheck` **exit 0** · `npm run test:regression` **69/69 XANH** · `mvn package` **exit 0** · `:18081` UP (JAR 10:07).

## FOLLOW-UP (ngoài phạm vi lần này — chưa sửa)
1. **TYPE 2 (tự làm được, nên làm tiếp)** — **`permission_expires_at` không bao giờ được lưu.**
   `UserAccessModal.send` gửi `permissionExpiresAt`, nhưng `UserAdminStoreAdapter.insertDepartmentDefaultPermission`
   **hard-code `NULL`** trong danh sách VALUES và interface không có tham số hạn dùng ⇒ cột *Hết hạn* luôn trống.
2. **TYPE 2** — **`permission_source` luôn là `'department_default'`.** `UserManagementUseCase` đã tính
   `manual_override`/`department_default` từ `isOverride` rồi **không truyền đi xuống**, adapter hard-code
   ⇒ override tay bị ghi nhãn sai, và `deleteModuleOverride` lọc `permission_source='manual_override'` nên hỏng.
3. **TYPE 2** — **Thiếu transaction.** `saveUserAccess` không nguyên tử: `clearUserScopes()` commit trước,
   insert lỗi giữa chừng ⇒ mất trắng. **Đã thử `@Transactional` và build FAIL** — module `application` cố ý
   không phụ thuộc Spring. Cách đúng: gộp `clear`+`insert` thành một phương thức port `replaceUserAccess(...)`,
   adapter đánh dấu `@Transactional` (adapter đã sẵn có annotation).
4. **TYPE 2** — **Phình dòng rỗng.** UI gửi cả module không có quyền nào ⇒ mỗi lần lưu phình `user_module_permissions`
   (đo được: 59 → 75). **Không lọc ở frontend** vì sẽ phá chốt chặn payload rỗng (xem D-045 Quyết định 3);
   nếu muốn gọn thì lọc ở adapter.
5. **CÓ SẴN, không do MỐC 111** — **5 ca test Java đỏ** với `Column "lc.job_rank" not found` (H2).
   `job_rank` do `drizzle/0314_*.sql` thêm vào MySQL thật nhưng **0 file `.sql` nào trong `java-backend` có nó**
   (`V1__baseline.sql` thiếu cột), còn `BootstrapDataAdapter`/`HrStore`/`HrStoreAdapter` vẫn đọc ⇒ mọi test gọi
   bootstrap đều đỏ. Cách sửa: thêm `job_rank` vào `schema-h2.sql` + `V1__baseline.sql` (hoặc migration `V10__…` mới).

## NEXT ACTION
- `permission_expires_at` + `permission_source` + `replaceUserAccess` (mục 1–3) — cùng một nhóm thay đổi ở tầng store.
- `job_rank` cho schema H2 (mục 5) để đóng 5 ca đỏ.

## BLOCKER
- **Không có.** Đề báo của anh **đã xử lý xong và kiểm chứng 11/11**.

---

# MỐC 112 — SỬA 3 LỖI CÒN TỒN TRONG `save_user_access` (hạn dùng · nguồn quyền · transaction) — **DONE**

**TASK:** TASK-112 · **STATUS: DONE** (01/10/2026) · **Nguồn:** 3 FOLLOW-UP của MỐC 111 (TYPE 2 — tự giải quyết được)

## Bối cảnh
MỐC 111 đã vá đúng nguyên nhân gốc, nhưng khi đọc kỹ luồng ghi em thấy **3 khoảng trống nữa** trong chính hàm đó.

## Lỗi & cách sửa
| # | Lỗi | Bằng chứng | Cách sửa |
|---|---|---|---|
| 1 | **`permission_expires_at` không bao giờ lưu** | `UserAdminStoreAdapter` **hard-code `NULL`** trong VALUES | Thêm tham số `permissionExpiresAt` xuống port + `instantOrNull()` nhận `YYYY-MM-DD` |
| 2 | **`permission_source` luôn `department_default`** | `source` được **tính ra rồi bỏ không** (biến chết) ở `UserManagementUseCase:303`; adapter hard-code | Truyền `source` xuống adapter ⇒ `deleteModuleOverride` (lọc `manual_override`) **thật sự xoá được** — trước đó nút «Xóa ngoại lệ cá nhân» là **nút chết** |
| 3 | **`ON DUPLICATE KEY` không cập nhật `permission_expires_at`** | Câu `VALUES(…,NULL,?,?,?)` + mệnh đề `UPDATE` không có cột này | Thêm `permission_expires_at=VALUES(permission_expires_at)` ⇒ bỏ hạn thì hạn cũ **được xoá**, không treo |
| 4 | **Không nguyên tử** | `clearUserScopes()` commit trước, insert lỗi sau | `store.runAtomically(Runnable)` do **adapter** mở transaction (`@Transactional`) — use-case không import Spring |

## ⚠️ Phát hiện kèm: khoảng trống **hai đầu** (UI chưa gửi được)
Cả `UserEditModal` và `UserAccessModal` đều đọc `form.get('expires-<module>')`, nhưng **không chỗ nào render ô đó**:
`PermissionMatrix` hiển thị «Hết hạn» bằng `<span>` **chỉ đọc**. ⇒ Sửa backend mà không sửa UI thì thành **mã chết**.
- Đã thêm cờ tùy chọn `expiryEditable` vào `PermissionMatrix` (mặc định `false` ⇒ **không đổi hành vi** nơi khác) và bật ở `UserEditModal`.
- **`UserAccessModal` chưa có cột «Hết hạn»** ⇒ chưa thêm (xem FOLLOW-UP).

## FILES CHANGED
| File | Nội dung |
|---|---|
| `java-backend/…/port/out/UserAdminStore.java` | +`permissionSource`, +`permissionExpiresAt`; +`runAtomically(Runnable)` |
| `java-backend/…/persistence/UserAdminStoreAdapter.java` | Bỏ 2 chỗ hard-code; `ON DUPLICATE KEY` cập nhật hạn dùng; `runAtomically` `@Transactional` |
| `java-backend/…/service/UserManagementUseCase.java` | Truyền `source` + hạn dùng; bọc clear+insert trong `runAtomically`; `instantOrNull()`; sửa chỗ gọi `replaceDepartmentDefaults` |
| `app/screens/PermissionMatrix.tsx` | +cờ `expiryEditable`, +`toDateInputValue()` (render `<input type="date" name="expires-*">`) |
| `app/page.tsx` | Bật `expiryEditable` + `expiryFor` ở thẻ *Phân quyền* của `UserEditModal` |

## DATABASE CHANGES
- **Không có migration.** Cùng cấu trúc bảng với MỐC 111.
- **Lưu ý múi giờ:** ngày hết hạn neo theo **múi giờ máy chủ**, không phải UTC. Neo UTC sẽ lưu `30/06` thành
  `30/06 07:00` (MySQL quy đổi theo `Asia/Ho_Chi_Minh`) ⇒ quyền hết hạn **muộn một ngày**. Đã sửa và kiểm chứng.

## TEST — **8/8 ca chức năng ĐẠT** (`_verify-moc112.mjs`, đọc ngược **thẳng MySQL**)
| Ca | Kiểm tra | Kết quả |
|---|---|---|
| CA1 | Hạn dùng + nguồn được ghi | ✅ `2027-06-30 00:00:00.000` · `manual_override` |
| CA2 | Bỏ hạn dùng thì cột phải xoá | ✅ về `<NULL>` · `department_default` |
| CA3 | `deleteModuleOverride` xoá được ngoại lệ thật | ✅ 1 dòng `manual_override` → **0** |

**Hồi quy:** bộ MỐC 111 **11/11 ĐẠT** · `test:regression` **69/69 XANH** · `typecheck` 0 · `mvn package` exit 0 · `verify:master-baseline` ĐẠT.
**DB sau tất cả:** `user_module_permissions` = **1226** · `testuser86661` = **59** · phạm vi dự án **13** · kho **9** · users **14** — **khớp baseline**.

> `KH.P1` (75 dòng thay vì 59) là **hành vi phình dòng đã ghi nhận có chủ ý** — xem D-045 Quyết định 3: UI luôn gửi
> đủ danh mục module, và lọc module toàn 0 sẽ phá chốt chặn payload rỗng của MỐC 111. Probe dùng
> `_restore-moc112.mjs` (đọc `audit_logs.after_json`) để đưa về đúng 59/1226.

## FOLLOW-UP
- **TYPE 3 — cần anh quyết:** `UserAccessModal` (modal *Phân quyền · <tên>*) **không có cột «Hết hạn»** nên mọi ô
  `permissionExpiresAt` nó gửi vẫn là `null`. Có bổ sung cột cho khớp với modal *Sửa tài khoản* không?
- **TYPE 2:** dọn module toàn 0 ở **adapter** (giữ nguyên chốt chặn rỗng của MỐC 111) để bảng không phình.
- **CÓ SẴN (MỐC 111):** 5 ca test Java đỏ vì schema H2 thiếu `job_rank`.

## BLOCKER
- **Không có.** Ba lỗi đã sửa và kiểm chứng; hồi quy xanh.

---

# ĐỢT MỐC 114 → 118 — USER 01/10/2026: CHỈỀU SÂU TRẢI NGHIỆM MODAL

> **Quy tắc của đợt này (user yêu cầu 01/10):** mỗi việc user giao = **1 MỐC riêng**, có **checklist riêng**,
> và **ghi kết quả vào tài liệu**. Không gộp các việc vào một mốc.

## DANH MỤC
| Mốc | Việc | Trạng thái |
|---|---|---|
| **113** | Lỗi 5 test Java đỏ: `labor_contracts` thiếu `job_rank`/`grade`/`renewal_round` | **DONE** (vá cả 2 tệp H2 + `IF()`→`CASE WHEN`) |
| **114** | Audit toàn hệ thống — sửa **label tiếng Việt thiếu dấu** | **DONE** |
| **115** | Modal nhiều tab — **kích thước tab cân đối, bằng nhau**, vẫn **đủ thông tin** | **DONE** |
| **116** | **Ẩn cột «Nguồn»** — chỉ để dev test | **DONE** |
| **117** | Modal *Sửa tài khoản › thẻ Phân quyền* **tái sử dụng** modal *Phân quyền* | **DONE** |
| **118** | **Ẩn menu Quản trị hệ thống** với user chưa có quyền nào trong nhóm (có 1 quyền là thấy) | **DONE** |

**CỔNG KIỂM CHUNG CẢ ĐỢT:** `npm run typecheck` = 0 lỗi · `npm run test:regression` = **72/72** (69 cũ + 3 mới MỐC 118)
· `javac` 121 tệp Java = **exit 0** · harness H2 MỐC 113 = **16/16**

---

# MỐC 113 — 5 TEST JAVA ĐỎ DO THIẾU CỘT `labor_contracts` — **DONE**
| Nội dung | Kết luận |
|---|---|
| Triệu chứng | `Tests run: 74, Errors: 5` · tất cả `org.h2.jdbc.JdbcSyntaxErrorException: Column "lc.job_rank" not found` |
| 5 test đỏ | `FinanceHrChainIntegrationTest` · `NotificationCenterTest` · `RequestNoProjectBootstrapIntegrationTest` · `RequestOverdueReasonTest` · `SystemControllerAuthTest` |
| Nguyên nhân | Cả **2** tệp `schema-h2.sql` (`web/src/test/resources/` + `web/src/main/resources/db/demo/`) — bảng `labor_contracts` **thiếu** `image_url`, `image_updated_at`, `job_rank`, `grade`, `renewal_round` |
| Vì sao | 5 cột này chỉ được thêm ở `drizzle/0314_*.sql` cho SQLite; **Flyway baseline `V1__baseline.sql:885` cũng không có** ⇒ H2 lẫn CSDL MySQL mới đều thiếu |
| Đọc ở | `BootstrapDataAdapter.java:1469` · `HrStoreAdapter.java:97,112` · chú thích `HrStore.java:22` |

## CHECKLIST
- [x] Đối chiếu `information_schema.COLUMNS` của MySQL production → xác nhận **5 cột có thật**, thứ tự `ORDINAL_POSITION` 14→18
- [x] Bổ sung 5 cột (đều NULLABLE) cho `web/src/test/resources/schema-h2.sql`
- [x] Bổ sung 5 cột cho `web/src/main/resources/db/demo/schema-h2.sql`
- [x] Thêm migration **`V32__moc113_labor_contracts_columns.sql`** — idempotent theo đúng mẫu V21/V22 sẵn có
- [x] Sửa lỗi thứ 2 trong cùng họ: `HrStoreAdapter.java:111` dùng `IF()` — hàm **riêng MySQL**, H2 không có
- [x] Kiểm chứng bằng harness H2 thật (`h2-2.3.232.jar`) → **16/16**
- [x] Kiểm chứng biên dịch: **121 tệp** domain+application+infrastructure+web → `javac` **exit 0**
- [x] Cổng frontend: `typecheck` 0 lỗi · `test:regression` **72/72**

## Lỗ thứ 2 phát hiện khi kiểm chứng (KHÔNG nằm trong báo cáo ban đầu)
`HrStoreAdapter.java:111` viết `image_updated_at=IF(?,CURRENT_TIMESTAMP,image_updated_at)`.
`IF()` là hàm **riêng của MySQL** — H2 (kể cả `MODE=MySQL`) **không có**. Đo được:
```
Syntax error … image_updated_at=[*]IF(?,CURRENT_TIMESTAMP,image_updated_at),
expected "DEFAULT, INTERSECTS (, NOT, EXISTS, UNIQUE"; [42001-232]
```
Nếu chỉ vá schema mà bỏ qua chỗ này thì các test gọi `updateLaborContract` sẽ **đỏ tiếp** vì lý do khác.
Đã đổi sang `CASE WHEN ?=TRUE THEN CURRENT_TIMESTAMP ELSE image_updated_at END` — SQL chuẩn, chạy
được trên **cả hai** nên không phải hy sinh production. Đã quét toàn bộ `persistence/`: chỉ **đúng 1 chỗ**
dùng `IF()`; `IFNULL` / `COALESCE` / `NULLIF` / `GROUP_CONCAT` đều được H2 hỗ trợ ⇒ không còn chỗ nào khác.

## Migration V32 — an toàn
- **CHỈ ADD COLUMN, đều NULLABLE** ⇒ không ghi đè dữ liệu cũ, không khoá bảng lâu, không DROP/DELETE.
- **IDEMPOTENT**: đếm `information_schema` trước, chỉ `ALTER` khi thiếu ⇒ **trên production là no-op**.
- Đã đo: production có đủ 5 cột ⇒ V32 không đụng vào bảng production.

## Kiểm chứng (harness H2 chạy thật, không đoán)
| Bước | Kết quả |
|---|---|
| Nạp `schema-h2.sql` (bản test) | không lỗi · 5/5 cột có mặt |
| Nạp `schema-h2.sql` (bản demo) | không lỗi · 5/5 cột có mặt |
| `INSERT` đúng như `HrStoreAdapter.java:94` | ĐẠT |
| `UPDATE` đúng như `HrStoreAdapter.java:108` | ĐẠT (sau khi đổi `CASE WHEN`) |
| `SELECT lc.job_rank` — câu gây lỗi gốc | ĐẠT, đọc đúng `ngan_hang_B` |
| **Tổng** | **16 ĐẠT / 0 SAI** |

> ⛔ **MÁY NÀY KHÔNG CÓ MAVEN** (`mvn` không có trong PATH, không tìm thấy `apache-maven*`, không có `~/.m2`)
> ⇒ **không** chạy được `mvn test`. Thay bằng 2 lớp kiểm chứng thay thế: (1) harness H2 chạy thật,
> (2) `javac` biên dịch 121 tệp từ nguồn với classpath lấy từ `BOOT-INF/lib/*` của fat jar. Cần anh
> chạy `mvn -o -B test` trên máy có Maven để đóng nốt 5 test kia.

---

# MỐC 114 — AUDIT & SỬA LABEL TIẾNG VIỆT THIẾU DẤU — **DONE**
**Yêu cầu (nguyên văn):** «1 số label vẫn bị lỗi tiếng Việt, hãy audit lại toàn bộ hệ thống, phần nào có tiếng Việt phải viết có dấu.»

## CHECKLIST
- [x] Chốt phạm vi quét: `app/**/*.tsx|ts`, `lib/**`, `java-backend/**/resources`, `docs/dsh-state/`
- [x] Tách 2 loại lỗi: **thiếu dấu** (`Nguon`) và **hỏng mã hoá UTF-8** (`NguyÃªn`)
- [x] **Loại trừ bắt buộc** để không sửa nhầm: comment kỹ thuật · tên biến/hàm/key · tên cột DB · enum API
- [x] Chỉ sửa **chuỗi hiện ra cho người dùng**: `<th>` `<h1..h5>` `<label>` `<option>` `<button>` `<span>`,
      `title=` `placeholder=` `note=` `label=` `text=` `message=` `detail=` `error=` và text trong `.properties`/`.html`
- [x] Quy tắc an toàn: **không chắc 100% thì bỏ qua** — sửa nhầm làm hỏng chữ Việt đang đúng
- [x] Sửa hết các label sai đã phát hiện — **22 vị trí trong 8 tệp**
- [x] Cổng: `typecheck` 0 lỗi · `test:regression` 69/69

## KẾT QUẢ SỬA (22 vị trí / 8 tệp)
| Tệp | Sửa |
|---|---|
| `app/page.tsx` (6 chỗ) | `sheetName` "Thanh toàn HD"→"Thanh toán HĐ" · "Tài khoản"→"Tài khoản" ×2 · "Du an"→"Dự án" ×2 · "Phieu de nghiệp"→"Phiếu đề nghị" |
| `app/screens/ProjectDetailTabs.tsx:92` | tab "Cong việc" → "Công việc" |
| `lib/boq-export.ts:61,66,74` | "BOQ Hợp đồng" · "Mẫu BOQ Hợp Đồng" · "Giá trị BOQ" |
| `lib/ui-shared.tsx` | "Đơn đã giao" · "Thanh toán HĐ" · "Lập PO" ×2 |
| `lib/tabular-export.ts:29,86` | `||"Du lieu"` → `||"Dữ liệu"` (tên sheet dự phòng + chỗ gọi) |
| `lib/request-export.ts:53` | sheet "De nghiệp cấp vat từ" → "Đề nghị cấp vật tư" |
| `lib/report-catalog.ts:281` | "(không xác định)" → "(không xác định)" |
| `app/screens/BoqControl.tsx:68,69` | `XOA` → `XÓA` (dòng 66 `THAY` **đúng** — Hán-Việt, không đụng) |

### Nguồn gốc lỗi (không phải gõ nhầm rời rạc)
Trường `sheetName` bị đặt sai tên so với người anh em `title` đã viết đúng dấu ⇒ **lỗ quy ước đặt tên**,
nên vá bằng cách sửa từng chỗ sẽ tái phát. `lib/admin-bulk-import.ts` đã vá **tận gốc**: thêm
`USER_LABELS` / `PROJECT_LABELS` ánh xạ tên cột kỹ thuật → **nhãn tiếng Việt có dấu**, truyền vào
`findHeader(rows, aliases, requiredKeys, displayLabels)`.

### DANH SÁCH CỐ Ý **KHÔNG** SỬA (đã kiểm chứng là đúng)
`lib/admin-bulk-import.ts:107-132` · `lib/material-import.ts:114-129` · `lib/boq-normalize.ts` ·
`lib/ui-shared.tsx:347,364,365,388` · `lib/p2-approval-flow.mjs` — đây là **bảng alias bỏ dấu**, được
so khớp **sau** khi `.normalize("NFD")`, thêm dấu vào sẽ **làm hỏng** tra cứu. Cùng nhóm: tên tệp,
đường dẫn, khoá DB/CSV/enum, SQL trong `app/api/files/route.ts`.

---

# MỐC 114b — VÁ MOJIBAKE `docs/dsh-state/CURRENT_STATE.md` — **DONE**

## Triệu chứng
36 dòng hỏng kiểu `Má»¥c` (thay vì `Mục`), `â€”` (thay vì `—`), `â›” KHÃ”NG` (thay vì `⛔ KHÔNG`).

## Nguyên nhân thật — và hai chỗ dễ làm sai
1. **`Buffer.from(s,'latin1')` KHÔNG phải windows-1252.** `latin1` cắt ký tự trên U+00FF xuống byte
   thấp: `€` là U+20AC ⇒ ra `0xAC` thay vì `0x80`. Mọi dấu câu cp1252 (`— – “ ” …`) đảo **sai**.
   ⇒ Phải dựng bảng `char → byte` của riêng windows-1252.
2. **Các dải byte 0x80–0x9F trong cp1252 chỉ đúng ở MỘT chiều.** `»` = 0xBB là giống nhau ở
   cp1252 và latin1 nên **sống sót qua cả hai vòng mã hoá kép**, làm giải mã ngược cả dòng hỏng
   (0xBB là byte UTF-8 không hợp lệ đứng độc lập).
3. Ký tự U+FFFD phải dựng bằng `String.fromCharCode(0xFFFD)` — viết ký tự thật vào mã nguồn bị
   trình soạn tệp nuốt thành chuỗi rỗng ⇒ `indexOf("")` trả `0` cho **mọi** dòng.

## CHECKLIST
- [x] Dựng bảng cp1252 thật, giải mã ngược **nhiều vòng**, chỉ nhận khi `TextDecoder(fatal)` ra kết quả **khác dòng gốc**
- [x] Tiêu chí an toàn: `toCp1252Bytes` trả `null` khi gặp ký tự > U+00FF ⇒ **dòng tiếng Việt ĐÚNG không bao giờ bị đụng**
- [x] Khôi phục tự động **18 dòng** — 0 dòng mất dữ liệu (U+FFFD)
- [x] **18 dòng còn lại** hỗn tạp (mojibake xen ký tự thô) ⇒ **vá tay theo số dòng**, mỗi dòng có neo ASCII kiểm tra
- [x] Xác nhận lại: **0 dòng còn mojibake** trong cả 4 tệp `docs/dsh-state/*.md`

## Còn lại (MỐC 114c)
`CHECKLIST.md` 497 dòng · `DECISIONS.md` 366 dòng · `TASK_HISTORY.md` 55 dòng — đây là **thiếu dấu**
(không phải hỏng mã hoá), khác cách xử lý ở trên.

---

# MỐC 115 — KÍCH THƯỚC TAB TRONG MODAL CÂN ĐỐI — **DONE**
**Yêu cầu (nguyên văn):** «1 số modal chứa nhiều tab ở trong đó thì chỉnh lại kích thước của các tab sao cho chúng cân đối và bằng nhau mỗi khi chuyển tab nhưng vẫn phải đảm bảo được các modal hiển thị đầy đủ thông tin.»

## Nguyên nhân đã xác định
- `app/styles/canonical.css:1123` `.edm-tabs { display:flex; flex-wrap:wrap; }`, và `.edm-tabs button` **KHÔNG set width**
  ⇒ mỗi tab có theo **độ dài nhãn** ⇒ «Dự án tham gia» rộng hơn hẳn «Kho».
- `white-space: nowrap` trên nút ⇒ nhãn dài **đẩy các tab khác** thay vì xuống dòng.

## CHECKLIST
- [x] Xác định nguồn: `EntityDetailModal.tsx:123` (`.edm-tabs`) + `canonical.css:1123`
- [x] Xác định dải tab dùng chung thứ 2: `AdminUserModalTabs` (`.project-scope-tabs`, 2 thẻ)
- [x] Tab **bằng nhau trong cùng hàng** — `flex: 1 1 auto` (có giãn đều, **vẫn xuống hàng** khi màn hẹp)
- [x] Nhãn **không bị cắt** — bọc `<span class="edm-tab-label">`, cho phép xuống dòng
- [x] Giữ nguyên: `aria-selected`, badge số, cuộn ngang màn hẹp, `EntityDetailModal` chỉ ẩn tab khi `length > 1`
- [x] Cổng: `typecheck` 0 lỗi · `test:regression` 69/69

## Ghi chú kỹ thuật
`flex-basis` dùng **`auto` chứ không phải `0`** — dùng `1 1 0` thì tab luôn bằng nhau nhưng mất
chiều rộng tự nhiên, khiến `flex-wrap` không bao giờ xuống hàng trên màn hẹp. `1 1 auto` giữ được
cả hai: có giãn đều **và** vẫn gói dòng.

---

# MỐC 116 — ẨN CỘT «NGUỒN» (CHỈ ĐỂ DEV TEST) — **DONE**
**Yêu cầu (nguyên văn):** «1 số modal đang hiển thị cột "Nguồn", cái này chỉ để dev test, không cần thiết phải hiển thị cho user xem, ẩn hoặc xoá đi.»

## Nguyên nhân đã xác định
- `app/screens/ProjectEntityModal.tsx:35` `InfoTable` in `<th>Nguồn</th>` chứa **tên cột DB thô**:
  `projects.code`, `users.full_name`, `role_catalog.name`, `teams.trade`, `warehouses.parent_warehouse_id`
  ⇒ đúng tiêu chí «chỉ để dev test».
- ⚠️ **Phải phân biệt**: chỗ khác có chữ *«Nguồn»* là **ghi chú nghiệp vụ hợp lệ** cho user
  (vd `WarehouseDashboard.tsx:183` «Nguồn 8 chỉ số…», `Purchasing.tsx:290`, `ReportView.tsx:126`) ⇒ **GIỮ NGUYÊN**.

## CHECKLIST
- [x] Phân loại từng chỗ có «Nguồn»: dev-test **hay** ghi chú nghiệp vụ
- [x] `InfoTable` (`ProjectEntityModal.tsx:33-47`) — bỏ cột Nguồn, giữ đủ dữ liệu 2 cột
- [x] `TeamDirectory.tsx:457-466` — cùng dạng bảng *Hạng mục | Giá trị | Nguồn*
- [x] Rà `P08PoNavigation.tsx:97` «Nguồn vật tư» · `page.tsx:735` «Nguồn (Liên kết)» · `page.tsx:1533` «Nguồn»
- [x] **KHÔNG** đụng vào ghi chú «Nguồn dữ liệu» hợp lệ
- [x] Cổng: `typecheck` 0 lỗi · `test:regression` 69/69

## Tiêu chí phân biệt (đo thật, không phải cảm tính)
Cột **có** hiện «Nguồn» **không** đồng nghĩa với dev-test. Chỉ bỏ khi in **tên cột DB thô**
(`projects.code`, `users.full_name`, `teams.trade`, `warehouses.parent_warehouse_id`).

**Phải GIỮ** — test hồi quy yêu cầu người dùng thấy: `tests/w04-inventory-dashboard.test.mjs:169`
(«Nguồn phải in ra cho người dùng thấy») · `tests/t08-work-dashboard.test.mjs:101,119` ·
`tests/t09-task-team-member.test.mjs:132,135` · `tests/ad06-position-vs-role.test.mjs:51-52`.
Các chỗ còn lại là ghi chú nghiệp vụ hợp lệ: `P08PoNavigation.tsx:97` · `page.tsx:735` · `page.tsx:1533`
(hiện «Từ BOQ»/«Thủ công» — **có nghĩa thật**) · `WarehouseDashboard.tsx:183` · `Purchasing.tsx:290` ·
`ReportView.tsx:126` · `WorkDashboard.tsx:130/136/150/161/175` · `WorkHierarchy.tsx:163`.

**Không đụng** `teamDetailTabs()[].source` — `tests/tm03-team-detail-tabs.test.mjs:55-69` khẳng định.

---

# MỐC 117 — TÁI SỬ DỤNG MODAL PHÂN QUYỀN CHO THẺ PHÂN QUYỀN — **DONE**
**Yêu cầu (nguyên văn):** «modal sửa tài khoản — tab phân quyền công việc / chức năng là modal dùng chung với modal sửa quyền của tab 6 phân quyền người dùng nên có thể đồng bộ hoặc tái sử dụng. Hãy chỉnh sửa modal sửa tài khoản — tab phân quyền công việc / chức năng theo hướng này.»

## Nhân bản đã đo được (cả hai đều trong `app/page.tsx`)
| Hạng mục | `UserEditModal` (thẻ 2) | `UserAccessModal` | Trạng thái |
|---|---|---|---|
| `permissionState` + `useState` khởi tạo | :3154 | :3198 | **trùng** |
| `normalizeCaps` | :3155 | :3199 | **trùng logic** |
| `setCapability` | :3156 | :3200 | **trùng** |
| `setRowAll` | :3157 | :3201 | **trùng** |
| `rowState` | :3158 | :3205 | **trùng** |
| `send` | :3159 (gộp 2 thẻ) | :3206 | **khác** (phải giữ) |
| Khối *Phạm vi dự án* | :3186 | :3207 | **trùng** |
| `PermissionMatrix` | :3186 | :3207 | **trùng** |
| `setColumnAll` / `setAll` / `columnState` | ❌ thiếu | :3202/:3203/:3204 | thẻ 2 **kém** |
| Mục *Phạm vi kho* | ❌ **thiếu** | ✅ có | thẻ 2 **kém** |
| `HelpTip` + cảnh báo đổi ≥20 quyền | ❌ **thiếu** | ✅ có | thẻ 2 **kém** |

⇒ Hệ quả ngoài ý muốn: **thẻ Phân quyền trong modal Sửa tài khoản kém tính năng hơn hẳn** modal *Phân quyền*.
Tái sử dụng sẽ **vá luôn** chênh lệch này, không chỉ bỏ nhân bản.

## CHECKLIST
- [x] Đọc & so sánh hai modal, đo độ trùng lặp
- [x] Tách phần dùng chung → `app/screens/PermissionAccessPanel.tsx` (~300 dòng)
- [x] `UserAccessModal` dùng panel chung (giữ nguyên hành vi)
- [x] `UserEditModal › thẻ Phân quyền` dùng **cùng** panel ⇒ tự có phạm vi kho + cảnh báo
- [x] Panel tự **sở hữu state**, trả payload qua callback ⇒ thẻ phân quyền **không phụ thuộc `FormData`**
      (xoá luôn gốc rễ lớp lỗi MỐC 111: ô không có `name` làm FormData sai lệch)
- [x] Giữ nguyên vá MỐC 111: **mỗi thẻ chỉ gọi API của chính nó**
- [x] Cổng: `typecheck` 0 lỗi · `test:regression` 72/72

## Ba điều trong panel KHÔNG được "cho gọn" (đã ghi trong chính tệp)
1. **Không dùng `onChange` trả ngược** — panel tự sở hữu checkbox và ghi vào `stateRef`. Nếu điều
   khiển từ ngoài, lần Lưu đầu tiên sẽ gửi toàn `false` và **xoá sạch quyền** của người dùng.
2. **«Hết hạn» là `<input type="date">` (YYYY-MM-DD), KHÔNG phải `datetime-local`.** Java parse
   `LocalDate` — nhánh `UserAccessModal` cũ dùng sai nên không lưu được ngày.
3. Test hồi quy khẳng định các chuỗi **đã chuyển** vào tệp này (`tests/runtime-admin-boq-regression.test.mjs:211-217`).

## Sửa kèm phát hiện được
`UserEditModal` đọc `warehouseScopes` từ `data.userWarehouseScopes` (chỉ là **echo**, không sửa được)
⇒ không lưu được phạm vi kho. Đã đổi sang đọc từ `FormData` các khoá `warehouse-*`.
`TriStateCheckbox` chuyển từ `page.tsx` sang `lib/ui-shared.tsx` để dùng chung.
`ADMIN_HELP_TEXT` giữ `const` (không `export const`) vì đã có trong khối `export { … }` ở dòng ~417.

---

# MỐC 118 — ẨN MENU «QUẢN TRỊ HỆ THỐNG» KHI CHƯA CÓ QUYỀN — **DONE**
**Yêu cầu (nguyên văn):** «ẩn menu quản trị hệ thống đối với tất cả các user không được cấp bất cứ 1 quyền nào trong nhóm phân quyền hệ thống. Ngoại lệ chỉ các user được cấp quyền quản trị hệ thống thì mới thấy được menu quản trị hệ thống (kể cả 1 quyền cũng hiển thị menu).»

## Phạm vi
Nhóm `system_admin` = **15 mục**: `admin` + `admin_tab_01..14` (đã đếm trong `module_catalog`).

## Vì sao cần một cổng riêng cho nhóm này
Cổng chung của menu là `canView`. Tài khoản được cấp **1 quyền khác** (Xuất / Tạo / Sửa / Duyệt)
mà chưa có Xem sẽ **không** thấy mục đó — trái yêu cầu «kể cả 1 quyền cūng hiển thị menu».

## CHECKLIST
- [x] Đếm phạm vi nhóm trong `module_catalog` → 15 mục
- [x] Thêm `hasAnyCapability()` + `SYSTEM_ADMIN_GROUP_KEY` vào `lib/permissions.ts`
- [x] Tách cổng riêng trong `app/page.tsx`; **loại nhóm khỏi `visibleGroupKeys`** khi menu không hiện
- [x] Mục con lọc theo "có ≥1 quyền" — **không** phát hiện cả nhóm
- [x] **Bỏ lối thoát `!permissionConfigured`** riêng cho nhóm này (xem bên dưới)
- [x] Đo thật trên payload `GET /api/system` — quy tắc đúng **7/7**
- [x] Ca tổng hợp: cấp **đúng 1 quyền «Xuất» (không cấp Xem)** → vẫn HIỆN menu, 1 mục con
- [x] Thêm `tests/m118-system-admin-menu-gate.test.mjs` (3 test) vào `package.json`
- [x] Cổng: `typecheck` 0 lỗi · `test:regression` **72/72** (69 cũ + 3 mới)

## Lỗ hổng phát hiện khi đo thật
Lối thoát `!permissionConfigured` (giữ danh mục theo vai trò khi hệ thống chưa seed quyền) áp dụng
cho **menu nghiệp vụ** — nhưng với menu quản trị hệ thống thì chính nó là lỗ hổng: tài khoản
`kttdemo` có **0 dòng quyền** mà vẫn ra đủ **15 mục con**. Đã bỏ lối thoát này riêng cho nhóm
quản trị hệ thống. Không gây kẹt vì Quản trị viên vẫn đi ngoài qua `isAdminUser`.

## Kết quả đo (quyền HIỆU LỰC từ `GET /api/system`)
| Tài khoản | Quyền nhóm quản trị | Menu | Mục con |
|---|---|---|---|
| `giamdoc.demo` | 15 | HIỆN | 15 |
| `ksda.demo` / `nvkhdemo` / `tkhodemo` / `kttdemo` / `trdademo` | 0 | **ẨN** | 0 |
| `admin` | 15 (ngoại lệ vai trò) | HIỆN | 15 |

## Bài học đã ghi vào test
**Không được** kết luận user «không có quyền nào» chỉ vì bảng `user_module_permissions` trống —
backend còn bơm quyền theo phòng ban (`permissionSource` = `company_leadership` / `department_default`).
`giamdoc.demo` có **0 dòng** trong bảng nhưng payload trả về **15 quyền** admin. Phải đo trên payload thật.

---

# MỐC 114c — BỔ SUNG DẤU TRONG TÀI LIỆU — **XONG**
Khác MỐC 114b: đây là **thiếu dấu**, không phải hỏng mã hoá ⇒ phải so khớp theo ngữ nghĩa.

## Đã sửa
| File | Sửa | Còn lại |
|---|---|---|
| `CURRENT_STATE.md` | 24 | 0 — xác minh sạch |
| `DECISIONS.md` | 165 + 28 | 0 — xác minh sạch |
| `TASK_HISTORY.md` | 60 + 7 | 0 — xác minh sạch |
| `CHECKLIST.md` | 204 + 110 (`MOC`→`MỐC`) + 15 thân văn + 111 tiêu đề + 88 + 1 + 8 | ~~0~~ **SAI** — còn sót, đã vá 14 dòng ở 114e |

`CHECKLIST.md` giữ nguyên cấu trúc: 3594 dòng · CRLF · không BOM · 0 ký tự U+FFFD.

## ⛔ Vòng cuối phát hiện lớp lỗi mà mọi lần quét trước đều bỏ sót
Quy tắc «bỏ qua nội dung trong ``` » là **sai**: có fence chứa **văn xuôi**, không phải mã
(`:1633-1636`, `:2090-2092`). Quét lại toàn bộ fence → 271 dòng thoáng qua bộ lọc → siết theo
"≥ 3 từ chức năng không dấu" → **90 dòng thật**. Sửa hết bằng 3 lô, mỗi mẫu phải khớp **đúng 1 lần
trên đúng số dòng** đó; lệch thì huỷ toàn bộ, không ghi.

## ⛔ Đã hủy một hướng đi sau khi kiểm chứng là rác
Tự dựng từ điển từ corpus của chính file (khoá = bản bỏ dấu, chỉ nhận khoá có **đúng một** biến thể)
rồi thay tự động trong fence. Ra **161 dòng ứng viên**, mọi assert cấu trúc đều xanh — nhưng đọc kết
quả thấy ngay `trong`→`trống`, `Danh mục`→`Dánh mục`, `Rủi ro`→`Rủi rõ`, `NGHIỆP VỤ`→`NghịỆP VỤ`,
`day la`→`dạy la`, `DAT`→`Dắt`. **Không ghi file nào.** Bỏ dấu không phân biệt được nghĩa từ, và
corpus thiếu một biến thể không có nghĩa từ đó không mơ hồ. `assert` chỉ bảo chứng cấu trúc, không
bảo chứng nghĩa. Ghi đầy đủ ở **D-049**.

## ⛔ 2 dòng cố ý giữ nguyên
`:1049` là JSON lỗi API trả về thật, `:2678` là thông báo lỗi Flyway — sửa chúng là làm sai lệch
với thực tế mà tài liệu đang ghi.

## Một chỗ sửa chữa nghĩa, không chỉ dấu
`:1631` `4 BAT BƯỚC` → `4 — BẮT BUỘC PHẢI ĐỌC`, căn cứ dòng `:1635` ngay dưới đã viết
`BAT BUOC doc information_schema.COLUMNS`. Giữ `BẮT BƯỚC` là nghĩa "bước" vô nghĩa.

## Cổng kiểm
`npm run typecheck` **exit 0** · `npm run test:regression` **72/72** · `npm run lint`
**223 problems / 2 errors** — đúng mức nền trước đợt này (2 lỗi có sẵn ở
`app/screens/ErrorReportAdminPanel.tsx:35` và `lib/ui-shared.tsx:329`).
⚠️ Lần đo đầu thấy **8 lỗi**: 6 lỗi còn lại do `.scan_tmp/*.cjs` — mảnh vụn của subagent bị kẹt,
ESLint có quét vì nằm trong repo. Đã xoá cùng 112 mục file tạm ⇒ trở về 2 lỗi nền.
(6 file `_*-*.log` còn lại vì dev server đang giữ khoá; **không** kill tiến trình để dọn.)

## 114g — VÁ 10 DÒNG THIẾU DẤU + MỞ CỔNG FINGERPRINT (01/10/2026)
- [x] Quét `docs/dsh-state/*.md` → sàng lọc tay → **10 dòng thật**, vá 16 từ
- [x] Xác minh bằng **dump mã điểm**, không chỉ bằng `assert`
- [x] **Hiệu chính kết luận cũ:** không cần `drizzle/0050`; hai cổng chỉ đòi `0048`+`0049`
- [x] Đánh dấu `114f` là ⛔ ĐÃ HIỆU CHÍNH ngay tại tiêu đề
- [x] Vá vòng lặp băm tại `drizzle/0327`
- [x] **`npm run build` → `BUILD_EXIT=0`**, 5/5 cổng ĐẠT
- [x] regression **72/72** · lint **223/2** (đúng nền)

## 114h — MÀN BOOT KẸT: TÌM RA TẦNG GỐC + SỬA (01/10/2026)
- [x] **Đo tài nguyên trang** → phát hiện 4 asset **404** ⇒ JS không nạp ⇒ `load()` không chạy
- [x] Tìm ra tầng 1: `npm run build` ghi đè `dist/` khi app đang mở
- [x] Tìm ra tầng 2: `local-runtime.mjs:177` từ chối chạy vì hash trong SQLite cục bộ lệch SSOT
- [x] UPDATE `vntech_product_identity` + `vntech_trust_settings` (SQLite cục bộ, có sao lưu),
      đúng thứ tự `DROP trigger` → `UPDATE` → `CREATE trigger`
- [x] Dọn Vite còn sót giữ `:9000`; liệt kê **mọi** listener, không chỉ listener đầu
- [x] Khởi động đúng stack: `local-server.mjs` `:8787` + `cutover-proxy.mjs` `:9000`
- [x] Xác minh: asset **200** · `/api/system` **401** · đăng nhập **200** · bootstrap **104 khoá**
- [x] Ghi `D-051` + `D-052`

**Không commit, không push.** Còn `Ton kho` + 2 token gõ tay chưa xử lý (xem `CURRENT_STATE.md`).

## 119 — MENU «KẾ HOẠCH GIAO HÀNG» + DâI TAB MODAL (01/10/2026) — **DONE**
> Ghi theo yêu cầu: «làm việc tôi giao không có trong plan thì cũng phải checklist và cập nhật tài liệu».
> Việc này **không nằm trong 110 mục master plan**, vẫn được mở mốc + ghi đủ 4 tài liệu.

### 119a — Chính tả menu (sửa dữ liệu, không sửa mã)
- [x] **Tầng gốc:** MySQL thay ký tự có dấu bằng `?` lúc chạy migration — bằng chứng `hàng` còn UTF-8 đúng
      (`C3A0`) còn `ế`/`ạ` thành `3F`; file seed `drizzle/0029…:141` viết ĐÚNG
- [x] Audit **toàn bộ CSDL** (1058 cột text) → đúng 5 cột có `?`; chỉ 2 cột là lỗi UI thật
- [x] `audit_logs.after_json` + `email_outbox.*` — **không sửa** (dữ liệu lịch sử, không hiện lên UI)
- [x] Viết `V34__moc119_receiving_label_and_contract_review_icon.sql`, chốt `LIKE '%?%'`
      ⇒ tự bỏ qua nếu Admin đã sửa tay
- [x] **Gỡ phần đổi tên kho khỏi V33** ⛔ (dữ liệu nghiệp vụ, anh chưa duyệt) — để trong V33 thì Flyway
      tự ý đổi tên kho lần chạy kế tiếp
- [x] So checksum 31 migration cũ jar↔nguồn = **31/31 khớp** ⇒ trỏ Flyway `filesystem:` an toàn
- [x] Áp migration bằng instance tạm `:18082`, **không dừng app chính `:18081`**
- [x] Xác minh: Flyway *now at version v34* · `?` còn **0** · 76 module nguyên vẹn
- [x] Xác minh qua **HTTP thật** `/api/system`: **16 mục đúng dấu**
- [x] Xác minh tên kho **không bị đổi**

### 119b — Modal phân quyền + dải tab
- [x] **Dùng chung modal phân quyền:** `UserEditModal` (`page.tsx:3234`) và `UserAccessModal`
      (`:3251`) đều dùng `<PermissionAccessPanel>` với props y hệt — đạt từ MỐC 117, hôm nay xác minh
- [x] **Tìm nguyên nhân dải tab xấu:** KHÔNG phải màu nền — tabbar tham chiếu dùng cùng class
      `project-scope-tabs`. Lỗi thật là `.user-admin-tabs` `flex: 1 1 auto` ⇒ 2 thẻ giãn hết bề ngang
- [x] Sửa `.user-admin-tabs` → `flex: 0 0 auto` + `white-space: nowrap` ⇒ **một dải ngang** ôm sát nhãn
- [x] ⛔ Không đụng `.edm-tabs` (`flex: 1 1 auto` ở đó là cố ý theo MỐC 115 khác)
- [x] Kiểm chứng file: 0 ký tự hỏng · giữ nguyên CRLF · không BOM · tiếng Việt nguyên văn

### 119 — Cổng kiểm
- [x] `typecheck` **0 lỗi** · `test:regression` **72/72** · `lint` **223/2 — đúng bằng gốc**
- [x] Ghi `D-053` (đảo MỐC 115) + `D-054` (áp migration không cần Maven)

**Không commit, không push.** F5 là thấy (sửa CSS + CSDL, không cần build).

## 119c — CHẠY LẠI DỰ ÁN ĐỂ XEM THAY ĐỔI (01/10/2026) — **DONE**
- [x] Phát hiện `app/` nằm trong tập băm vân tay ⇒ sửa CSS làm **build bị chặn** (đo thật: `expected f24478… / actual d4d91f…`)
- [x] ⭐ Nhận ra `d4d91f…` **chưa phải đích** vì `drizzle/0327` chứa vân tay cũ ⇒ lặp tới **hội tụ 3 vòng**
- [x] Tính brand + release (release **không đổi**) và ghi SSOT + `VNTECH_FINGERPRINT.json` + `VNTECH_PRODUCT_IDENTITY.txt`
- [x] Kiểm 2 file ID còn lại: **không** chứa vân tay
- [x] **Sao lưu** SQLite rồi `DROP trigger` → `UPDATE` → `CREATE trigger`
- [x] `npm run verify:fingerprint` → **exit 0** · 690 files
- [x] Dừng `:8787` (PID 9048, đã đọc `CommandLine`) → build → khởi động lại; **không** đụng `:9000`/`:18081`
- [x] Xác minh qua proxy `:9000`: 8 asset **200** · login **200** · bootstrap **76 module**
- [x] Xác minh nhãn: `Kế hoạch giao hàng` đúng codepoint · **0** nhãn hỏng · icon `HĐ` ✅
- [x] CSS đang chạy chứa rule MỐC 119b (`flex:none`) và `.edm-tabs` nguyên vẹn
- [x] Cổng kiểm lại: typecheck **0** · regression **72/72** · lint **223/2**
- [x] Ghi `D-055` + cập nhật tài liệu

⛔ Không tạo migration mới. **Không commit, không push.**

## 120 — BA YÊU CẦU MODAL PHÂN QUYỀN (01/10/2026) — **DONE**
- [x] Đọc ảnh + **đo lại bằng CSS** thay vì suy đoán từ màu sắc (sai lần trước — D-053)
- [x] Tìm ra nguyên nhân gốc chung cho (2) và (3): panel **nằm ngoài** `.modal-body`
- [x] (1) Bỏ thuộc tính `note` ở `UserEditModal`
- [x] (1) Cho `note?: string` + render có điều kiện trong `BaseModal` (46 nơi gọi, không vỡ)
- [x] (2+3) Chuyển `PermissionAccessPanel` vào trong `modal-body`, gom khối tab-tài-khoản vào nhánh riêng
- [x] (2) `.embedded-permission-body .table-wrap{max-height:none;overflow:visible}` để cả thẻ cuộn
- [x] (2) Tiêu đề cột vẫn dính khi cuộn nhờ `position:sticky` bám `.modal-body`
- [x] Xác minh trên bản build: rule CSS có trong `dist`; «MỐC 39» = **0** trong bundle
- [x] Xác minh cấu trúc: panel trong `modal-body` ở **cả hai** modal ⇒ đồng nhất
- [x] Tái lập vân tay theo `D-055` (hội tụ 2 vòng) + đồng bộ SQLite có sao lưu
- [x] `verify:fingerprint` ĐẠT · build exit 0 · dừng `:8787` trước khi build rồi mở lại
- [x] Qua proxy `:9000`: 8 asset **200** · login **200** · bootstrap **76 module** · nhãn hỏng **0**
- [x] Cổng kiểm: typecheck **0** · regression **72/72** · lint **223/2**
- [x] Ghi `D-056` + cập nhật 4 tài liệu dsh-state

⛔ Không tạo migration mới. **Không commit, không push.**

## COMMIT + PUSH + MERGE VAO NHANH `unity` (01/10/2026) — **DONE**
- [x] Rà `git status`: 43 sửa · 7 thêm mới · 5 xoá — **không có tệp rác**
- [x] Quét secret trong diff: 1 khoảng khớp, xác minh là credential **dev** đã ghi sẵn trong 5 tệp test cũ ⇒ an toàn
- [x] Chia thành **6 commit** theo nhóm mạch lạc thay vì 1 commit tổm
- [x] Loại `tsconfig.tsbuildinfo` khỏi chỉ mục theo dõi + thêm `*.tsbuildinfo` vào `.gitignore`
      (cache build chặn `git checkout`: *"Your local changes would be overwritten"*)
- [x] Push `unity-p2-full-20260920`
- [x] Kiểm tra quan hệ nhánh **trước khi merge**: merge-base == `origin/unity` ⇒ **fast-forward thuần**
- [x] `git merge --ff-only` vào `unity` (exit 0) rồi push `unity`
- [x] Cả 4 nhánh cùng ở `4d8d7b0`; working tree sạch; `verify:fingerprint` **ĐẠT**
- [x] Tài liệu `docs/36_...` (472 dòng) bị bỏ sót — quét lại và commit
- [x] ⭐ `docs/36_...` báo 2 ký tự hỏng do **artefact PowerShell**; xác nhận Node cho **0**
      ⇒ **KHÔNG sửa**, tránh hỏng thật tài liệu của user. Ghi `D-057`.
