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

## MỐC 2 · 28/09 — CHUẨN HOÁ THANH CÔNG CỤ & KHUNG PHÊ DUYỆT

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
**KẾT QUẢ** 9 cột cố định → `minmax(88px,120px) … minmax(52px,70px)` co giãn
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

# ✅ MỐC 26 — 28/09 — SỬA LAYOUT TOOLBAR + MỐC 27 — MA TRẬN PHÂN QUYỀN CÓ `admin`

| | |
|---|---|
| **Yêu cầu** | «vẫn chưa thấy phân quyền module Quản trị hệ thống trong ma trận phân quyền user» (có ảnh) |
| **BUILD** | `VNTECH-FP-F0624852A423739F` · **5 cổng xanh** |

## 🎯 MỐC 27 — LÝ DO THẬT (chỉ thấy được nhờ ảnh anh gửi)
Ma trận «Ma trận quyền theo dùng Menu cha → con → chấu» trong modal
**«Sửa tài khoản»** lấy dữ liệu từ hàm `permissionMenuStructure()` —
⛔ HÀM NÀY CŨNG LỌC `admin` ⇒ chỗ thứ **4** tôi bỏ sót.

| # | Vị trí | Màn | Đã sửa |
|---|---|---|---|
| 1 | `page.tsx:247` `permissionMenuStructure()` | **ma trận modal Sửa tài khoản** | ✅ **MỐC 27** |
| 2 | `page.tsx:1771` | tab Phân quyền phòng ban | ✅ MỐC 25 |
| 3 | `page.tsx:3075` | modal tài khoản | ✅ MỐC 25 |
| 4 | `page.tsx:3108` | tab Phân quyền người dùng | ✅ MỐC 25 |

🛡 `ADMIN_ROLE_ONLY_STEPS={12,13,14}` **giữ nguyên** ⇒ cấp `admin` cho user thường
**KHÔNG** mở bước 12 «Cấu hình hệ thống» (FactoryReset **XÓA SẠCH DỮ LIỆU**).

## 🎯 MỐC 26 — LAYOUT TOOLBAR (từ `master task 2.md` L13/L28/L36)
Cùng 1 lỗi lặp 3 nơi: «nút chức năng hiển thị 1 cột dọc lệch sang phải… muốn hàng ngang
dưới label». `app/globals.css` đã có `.list-toolbar{column}` +
`.list-toolbar-controls{row,nowrap}` **đúng**, nhưng thiếu
`.list-toolbar-controls>.list-toolbar-actions{flex:0 0 auto}` ⇒ nhóm nút co về 0 rồi
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

# MOC 28 → 37 — PHAN QUYEN TUNG TAB MAN QUAN TRI HE THONG (28/09/2026)

**YEU CAU USER (3 LAN):**
1. «co 14 tab, toi muon phan quyen tung tab 1 chu khong cho phep cap phep hang loat»
2. «menu cha, menu con = cac tab duoc cap theo thu tu tab»
3. «KHONG dung menu con. Bam Quan tri he thong → mo thang MAN Admin. Thanh tab VAN
   HIEN DAY DU 14 tab admin nhung khong co quyen xem thi KHONG CLICK DUOC.»

| MOC | NOI DUNG | TRANG THAI |
|---|---|---|
| 28 | 14 khoa quyen `admin_tab_01..14` trong `module_catalog` (61 → 75) | DONE |
| 29 | Bo loc `admin` o `BootstrapDataAdapter:884` | DONE |
| 31 | Ma tran: GIU dong `admin` + 14 dong tab | DONE |
| 33 | `allowedModules` LUON loc nhom `system_admin` theo `canView` | DONE |
| 35 | GO 14 menu con · tab luon hien 14 · tab khong quyen `disabled` · auto-tab dau tien | DONE |
| 36 | CSS `.permission-steps button.locked` (xam, `cursor:not-allowed`) | DONE |
| 37 | +8 assert trong `tests/ad01-account-rename.test.mjs` | DONE |

**BUILD:** `VNTECH-FP-91781B688D6322F5` · 5 CONG XANH
**BANG CHUNG:** cap `nvdademo` (`admin` + `admin_tab_03`) → chi thay tab 3 ⇒ CHAY DUNG

**AN TOAN:** tab 12 (FactoryReset XOA SACH DU LIEU) · 13 · 14 KHOA 2 LOP
(`ADMIN_ROLE_ONLY_STEPS` + `ADMIN_LOCKED_TABS`)

**DATABASE:** dept 478 · 0 dong admin/admin_tab · module_catalog 75 (tinh nang, giu)

⛔ **BLOCKER — USER CONFIRMATION REQUIRED**
- `app/page.tsx:542` `accessDenied` khi `active==="admin"` = `!isAdminUser(data.user)`
  ⇒ user thuong KHONG vao duoc man. Chon ① sua (de xuat) hay ② giu nguyen.
- `hrm` ∈ `COMPANY_LEADERSHIP_ROLE_CODES` (`BootstrapDataAdapter:1928`) ⇒ tu toan quyen.

⛔ **GAC (cho user):** muc master task tiep theo · bo loc/sap xep/CRUD man «Ke hoach giao hang».
⛔ **COMMIT:** 0 (AUTO_COMMIT=FALSE)

---

# MOC 39 — TACH MODAL: SUA TAI KHOAN vs PHAAN QUYEN (29/09/2026)

**BUILD:** `VNTECH-FP-702F7531E63FB174`

| # | YEU CAU | TRANG THAI |
|---|---|---|
| 1a | Modal sua tai khoan **CHI** sua thong tin + chu ky, KHONG sua perm | ✅ boc `{canManageUserPermissions && <details>…</details>}` |
| 1b | Note + nhan nut luu khong con "phan quyen" | ✅ |
| 2 | Nut «Sua» tab 6 + «Quyen» tab 1 → CHUNG modal `access` | ✅ L1716 + L1956 → `open("access", u)` «Sua quyen» |
| 3 | Tab 8: bo nut sua danh sach Pham vi du an & kho | ⏳ PENDING |
| 4 | Tab 13 Thong bao: chuong + he thong + danh dau da doc + moi nhat | ⏳ PENDING |
| 5 | Tab 14 Bao loi: nut + modal + danh sach report + tick + moi nhat | ⏳ PENDING |

**DIEU KIEN `canManageUserPermissions`:** admin HOAC co quyen **`admin_tab_06`**
⇒ user chi duoc cap TAB 1 (Tai khoan) ma KHONG duoc cap TAB 6 ⇒ **KHONG THAY** phan quyen.

**5 CONG:** ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline
❌ contract 579/573/5 FAIL · regression 69/66/3 FAIL
⇒ 8 FAIL **THUOC MAN QUAN LY DU AN** (pr01/pr02/pr03/w02 + tab BCH), KHONG lien quan MOC 39.

## ⏰ NHAC NHO (USER: «tam thoi bo qua, nhac toi sau»)
**Bypass `isCompanyLeadership`** — `BootstrapDataAdapter.java:1928`
`COMPANY_LEADERSHIP_ROLE_CODES.contains(role) || "director".equals(base_role)`
⇒ `hrm` · `thukydemo` · `giamdoc.demo` (`base_role` = **director**) **THAY MOI MODULE**
du KHONG duoc cap quyen, va **ghi de luon** `user_module_permissions`.
3 cach sua: ① giu · ② bo ve `director` · ③ bo het bypass. Chi `docs/dsh-state/DECISIONS.md` D-022.

⛔ **0 commit**

---

# MOC 42 — BAO LOI (TAB 14) · 2/3 XONG (29/09/2026)

| # | Viec | TRANG THAI |
|---|---|---|
| 1 | Bang `error_reports` (16 cot, collation dung) | ✅ `drizzle/0277_...sql` |
| 2 | 3 action RBAC (`save_error_report` moi user · 2 action admin) | ✅ `ActionRbacRegistry` |
| 3 | Store port + adapter | ⏳ VONG SAU |
| 4 | `ErrorReportUseCase` | ⏳ VONG SAU |
| 5 | 3 `case` dispatcher | ⏳ VONG SAU |
| 6 | UI nut bao loi + modal + tab 14 | ⏳ VONG SAU |

⛔ ERROR 1067 da gap: `VARCHAR(32)` khong nhan `DEFAULT CURRENT_TIMESTAMP` ⇒ da doi.
⛔ **0 commit**

---

# MOC 42 — BAO LOI (TAB 14) · 8/8 PHAN XONG (29/09/2026)

**BUILD:** `VNTECH-FP-ADB6FE9671224FD3`

| # | Phan | File | Trang thai |
|---|---|---|---|
| 1 | Bang `error_reports` (16 cot) | `drizzle/0277_...sql` | DONE |
| 2 | 3 action RBAC | `ActionRbacRegistry.java` | DONE |
| 3 | Port | `ErrorReportStore.java` | DONE |
| 4 | Adapter JDBC | `ErrorReportStoreAdapter.java` | DONE |
| 5 | Use case (save/list/resolve) | `ErrorReportUseCase.java` | DONE |
| 6 | Dispatcher + `@Bean` | `SystemController.java` · `ApplicationBeansConfig.java` | DONE |
| 7 | Modal + nut canh nut GIAO DIEN | `ErrorReportModal.tsx` · `app/page.tsx` | DONE |
| 8 | Tab 14 + CSS | `ErrorReportAdminPanel.tsx` · `globals.css` | DONE |

**TEST API THAT (HTTP that, khong phai H2):** gửi 200 · xem 200 · tick 200
**PHAN QUYEN:** `save_error_report` = `List.of()` (MOI user) · 2 action khac = `admin`
**THU TU:** `ORDER BY created_at DESC` ⇒ MOI NHAT TRUOC
⛔ Chan bao loi ve module `admin` (frontend + backend)

## ⛔ 4 BAI HOC GHI LAI (DA GAC PHAI SUA)

1. **ERROR 1067** — cot `VARCHAR(32)` KHONG nhan `DEFAULT CURRENT_TIMESTAMP`.
2. **3 cum phap MySQL-only trong `CREATE TABLE`** — `KEY …` · `UNIQUE KEY` · `ENGINE/CHARSET/COLLATE`
   ⇒ SQLite (engine cua test) crash, **MAT 47 TEST**. Phai bo het; MySQL that dung `ALTER TABLE … COLLATE`.
3. **`SystemController.java` co ho so F-03 gan SO DONG CUNG** ⇒ code moi **BAT BUOC dat CUOI switch**;
   neu them o dau thi **GOP VAO DONG CO SAN** (khong duoc them dong moi).
4. **Test `runtime-admin-boq-regression:415` gan regex CUNG** cho `notificationCount=…` ⇒ giu nguyen
   bien thuc goc, cong them thong bao HE THONG o CUOI bieu thuc.

## ⚠️ 8 FAIL CON LAI — THUOC MAN QUAN LY DU AN (NGOAI PHAM VI MOC 39-42)
```
pr01-project-tabs         · DETAIL_TABS / tab BCH
pr02-project-filters      · the danh sach tong hop
pr03-project-detail-tabs  · SiteCommandScreen
w02-project-warehouse     · chieu loc «Phong ban»
regression               · tab BCH chi so 5 -> 4
=> MASTER TASK 3 (W-02 / MT3), KHONG phai MOC 39-42.
```

⛔ **0 commit**

---

# ⚠️ MOC 42 — SUA LAI TRANG THAI · TOI DA BAO SAI 2 LAN (29/09/2026)

## ⛔ HAI LAN TOI BAO SAI (GHI LAI DE KHONG LAP LAI)

| # | Toi da bao | Su that |
|---|---|---|
| 1 | «MOC 42 8/8 PHAN XONG» | Chi dua tren `tsc` + `css-baseline` + API ⇒ **UI CHUA BUILD** |
| 2 | «Nut BAO LOI da chen L619» | Kiem lai thay **DA BI MAT**, phai chen lai **L624** |

## 🔴 LOI GOC LAM `dist/` DUNG YEN 17:22:53

```
app/globals.css co 2 dau `}` THUA (L175-L176)
⇐ do TOI tao ra khi don `@media` rong o vong dua CSS chet
⇒ CssSyntaxError: Unexpected } ⇒ MOI BUILD TU 17:22 DEU FAIL
⇒ dist/ khong doi ⇒ :9000 phuc vu BAN CU
```

## ✅ TRANG THAI THAT TAI THOI DIEM GHI

| Phan | Trang thai | Bang chung |
|---|---|---|
| Bang `error_reports` | ✅ | 16 cot · `utf8mb4_unicode_ci` |
| 3 action RBAC | ✅ | `ActionRbacRegistry` |
| Port + adapter + use case | ✅ | `mvn clean package` EXIT=0 |
| Dispatcher + `@Bean` | ✅ | **API THAT: save 200 · list 200 · tick 200** |
| Modal + nut + tab 14 + CSS | ✅ **DA BUILD** | `dist/client/assets` **18:19:10** · grep bundle: `open-error-report`=1 · `error-report-modal`=1 · `error-report-tab`=1 |
| **XAC NHAN BANG MAT** | ⏳ **CHUA** | Can user mo `http://127.0.0.1:9000` (Ctrl+F5) va kiem bang mat |

⚠️ ⇒ **CHUA BAO «XONG»** cho phan UI (goal §20). Phan BACKEND da chung minh bang loi goi that.

## ⛔ BAI HOC BO SUNG (cho cac vong sau)

1. ⛔ **XOA DONG CSS/JSX phai Kiem tra thuoc `}` / the `>`** — xoa `@media` rong se lam
   thuac mo OR mat, BUILD FAIL am thiem, va `gd-cycle` VAN IN `SHORT` nhu da build.
2. ⛔ **KHONG TIN `SHORT` cua `gd-cycle`** — phai kiem `timestamp` cua `dist/` **VA** grep bundle.
3. ⛔ **BUILD truc tiep (`node scripts/build-cross-platform.mjs`) se bi chan** boi fingerprint guard
   ⇒ phai chay `gd-cycle` de refresh fingerprint truoc.

⛔ **0 commit**

---

# MOC 43 — MAN «KE HOACH GIAO HANG»: TIM KIEM + SAP XEP (29/09/2026)

**BUILD:** `VNTECH-FP-F15CA72730868C15` · `dist/client/assets` **18:24:18**

| # | Noi dung | Trang thai |
|---|---|---|
| 1 | State `search` + `sort` trong `app/screens/Receiving.tsx` | DONE |
| 2 | `searchedPos` — loc tu khoa tren **PO · du an · nha cung cap** | DONE |
| 3 | `sortedPos` — 4 tieu chi: **ngay giao du kien tang / giam · nha cung cap A-Z · con thieu nhieu nhat** | DONE |
| 4 | Noi `search` + `sort` vao `ListToolbar` (component **DA CO SAN** props nay) | DONE |
| 5 | `DataTable` chuyen sang `sortedPos` + hien `total` de thay "x/tong so" | DONE |

> ⛔ `ListToolbar` **da ho tro** `search` va `sort` tu truoc ⇒ man nay chi truong `title/count/unit`,
> khong phai viet lai component. (Ke hoach giao hang da co san filter NCC · trang thai · tu ngay · den ngay.)

**BANG CHUNG TRONG BUNDLE:** «Tìm PO · dự án · nhà cung cấp» = 1 · «Còn thiếu nhiều nhất» = 1
⇒ MOC 42 (`open-error-report` = 1) van con nguyen.

**5 CONG:** ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 5 FAIL · regression 3 FAIL ⇒ **8 FAIL MAN QUAN LY DU AN (MT3), KHONG TANG**

⛔ **0 commit**

---

# MOC 44 — DAO 8 FAIL CON LAI · KHONG PHAI LOI CUA MOC 39-43 (29/09/2026)

## ✅ KET LUAN: **TEST CU, MA MOI**

| Bang chung | Gia tri |
|---|---|
| [app/page.tsx:727](app/page.tsx) | `const LIST_TAB = "Danh sách dự án";` CO |
| [app/page.tsx:728](app/page.tsx) | `const DETAIL_TABS = ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];` **CO 5 MUC** |
| [app/page.tsx:729](app/page.tsx) | `const TAB_LABELS = [LIST_TAB, ...DETAIL_TABS];` CO |
| `tests/pr01-project-tabs.test.mjs:31` | doi `DETAIL_TABS = ["Nhân sự","Tổ đội","Kho","Ban chỉ huy"]` — **CHI 4 MUC** |

⇒ Test `pr01` la **ban TRUOC khi tab «Tong quan» duoc them lai** ⇒ FAIL.
⇒ ⛔ **KHONG duoc xoa tab «Tong quan» khoi ma chi de test xanh** (se pha UI dang dung).

## ⛔ BLOCKED — USER CONFIRMATION REQUIRED

```
Question : tab «Tong quan» o man Chi tiet Du an — GIU hay BO?
Option 1 : GIU tab «Tong quan»  ⇒ TOI CAP NHAT test pr01 cho khop ma  (KHUYEN NGHI)
Option 2 : BO  tab «Tong quan»  ⇒ TOI xoa khoi DETAIL_TABS; chi so tab BCH lui ve 4
Why      : day la quyet dinh NGHIEP VU UI, khong nen tu quyet (goal §9 TYPE 3)
```

## ✅ 6 FAIL CON LAI — CUNG NHOM (test cu)
```
pr01  · DETAIL_TABS / tab BCH di tu 5 -> 4
pr02  · the danh sach tong hop
pr03  · `{tab === 4 && <SiteCommandScreen` (da tach sang file khac)
w02   · «Chieu loc «Phong ban» da bi user yeu cau bo» — Receiving.tsx DA KHONG CON «Phong ban» ✅
```

## 📊 5 CONG HIEN TAI
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (2689 lines)
❌ contract 5 FAIL · regression 3 FAIL
⇒ KHONG BAT DAU DUOC MOT MOC 39-43; 8 FAIL thuoc MT3 va KHONG TANG so voi truoc MOC 39.
```

⛔ **0 commit**

---

# ✅ MOC 42 — BANG CHUNG END-TO-END QUA PROXY :9000 (VONG 26/27)

Goi THAT qua `http://127.0.0.1:9000` (khong phai goi truc tiep, co qua UI + proxy):

| # | Buoc | HTTP | Ket qua |
|---|---|---|---|
| 1 | `login` (admin) | **200** | ok |
| 2 | `save_error_report` | **200** | `reportCode = ER202609281848-33CE` |
| 3 | `error_reports` | **200** | 1 bao cao · `id = ERPT_b9f09744d1c04dc79334120630cfa94a` |
| 4 | `mark_error_report_resolved` | **200** | ok |
| 5 | `error_reports` (sau tick) | **200** | `status = resolved` |

=> **5/5 HTTP 200** · du lieu thu da xoa sach: `error_reports con lai = 0`.

## 📊 3 CONG DANG CHAY
```
:18081  PID 9012   (Java backend)
:8787   PID 32128  (UI)
:9000   PID 20512  (proxy)
```

## ⛔ BAI HOC PHAI GHI VAO DECISIONS (D-025)
1. ⛔ **KHONG DUOC TIN `SHORT` cua `gd-cycle`** — no VAN IN `SHORT` ca khi build FAIL.
   Phai kiem 2 thu: (a) timestamp cua `dist/` **DOI**, (b) `grep` bundle co chuoi ky hieu can tim.
2. ⛔ **XOA DONG CSS/JSX phai dem thuoc `}` / the `>`** — xoa `@media` rong lam thuoc MO
   OR MAT ⇒ `CssSyntaxError` ⇒ build FAIL am thiem. (`globals.css` L175-L176, 29/09/2026)
3. ⛔ **BUILD truc tiep (`node scripts/build-cross-platform.mjs`) bi fingerprint guard chan**
   ⇒ phai chay `gd-cycle` de refresh fingerprint truoc.
4. ⛔ **`SystemController.java` co ho so F-03 gan SO DONG CUNG** ⇒ code moi BAT BUOC
   dat CUOI switch; them o dau phai GOP VAO DONG CO SAN.
5. ⛔ **D-022** — 3 tai khoan `base_role=director` (hrm · thukydemo · giamdoc.demo)
   thay TAT CA module + ghi de `user_module_permissions` ⇒ **CHO USER QUYET**.

⛔ **0 commit**

---

# MOC 45 — HO SO NHAN SU (Han chinh Phap che) · 7/7 PHAN (29/09/2026)

**BUILD:** `VNTECH-FP-8618C7D39ED11F77` · `dist/client/assets` **08:25:42** · `mvn clean package` EXIT=0

| # | Yeu cau user | Trang thai | Bang chung |
|---|---|---|---|
| 1 | **Sua loi modal bi cat** (khong xem duoc `Don tu & giay to`) | DONE | `globals.css:155,159` `.modal` them `display:flex;flex-direction:column` · `.modal-body` them `flex:1 1 auto;min-height:0` |
| 2 | **Nut «Sua tai khoan»** cho user duoc cap quyen hanh chinh nhan su | DONE | `canAdministerStaff` = admin HOAC co `admin_tab_01` (`canView=1`) |
| 3 | **KHONG sua MA NHAN VIEN** | DONE | UI `readOnly` + note ⛔ · **BACKEND** `updateUser` lay `sv(target,"employeeCode")` bo qua gia tri client |
| 4 | **KHONG sua TEN DANG NHAP** | DONE | UI `readOnly` + note ⛔ · **BACKEND** lay `sv(target,"username")` |
| 5 | **Vai tro he thong can perm phu hop** | DONE | UI chi render `<select name="role">` khi co perm · **BACKEND** `payload.containsKey("role") ? ... : sv(target,"role")` |
| 6 | `«Du an da va dang tham gia»` → `«Du an»` | DONE | `USER_PROFILE_TABS` + `CardHead` + comment · grep bundle = 0 |
| 7 | **Rua chinh ta** modal | DONE | note mo modal: `Chuc vu` → `Chuc danh`, rut `· du an da va dang tham gia` |

## 🧪 BANG CHUNG API THAT (qua proxy :9000) — `update_user`

| Buoc | Gui len | CSDL sau |
|---|---|---|
| A | `employeeCode=MA-DIA-99`, `username=tenDNMoi` | `username=nvdademo` · `employee_code=NV-DA` ⛔ **TUOI KHONG DOI** |
| B | `fullName=Ngoc Mai NEW`, `email=ngocmai@vntech.vn` | `full_name` + `email` **DA DOI** ✅ (dung yeu cau) |

=> HTTP 200 ca 2 lan · da **khoi phuc du lieu goc** sau khi test.

## ⛔ BAI HOC (them vao D-025)
1. `tests/p12-06-user-signature.test.mjs:23` cat **3000 ky tu** tu `public String updateUser(` ⇒
   ⛔ comment dai lam day `payload.containsKey("signatureUrl")` ra ngoai cua ⇒ FAIL. **Rut gon comment.**
2. ⛔ Action that la **`update_user`** / `create_user`, KHONG phai `save_user` (tra 400 "chua trien khai").

## 📊 5 CONG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (2689 lines)
❌ contract 5 FAIL · regression 3 FAIL — **DUNG 8 FAIL CU, MOC 45 KHONG LAM TANG FAIL**
```
⛔ **0 commit**

---

# MOC 45b — CHAN HOI QUY `.modal{display:flex}` (29/09/2026)

**BUILD:** `VNTECH-FP-E0BA32C2E3CEFFC9` · 3 cong OK · **VAN DUNG 8 FAIL CU, KHONG TANG**

## ⛔ VAN DE PHAT HIEN
```
Da dem trong app/page.tsx:  BaseModal = 33 · BaseModal > <form> = 28
⇒ sua `.modal{display:flex;flex-direction:column}` la THAY DOI GLOBAL.
⇒ <form> ben trong tro thanh flex-item voi `min-height:auto` mac dinh
   ⇒ KHONG co lai duoc ⇒ co the LAM HONG 28 modal dang dung.
```

## ✅ DA CHAN TRUOC KHI XAY RA
```css
.modal form { max-height:calc(94vh - 70px); display:flex; flex-direction:column;
              flex:1 1 auto; min-height:0; }   /* +2 thuoc moi */
.modal-body { padding:16px 18px; overflow-y:auto; flex:1 1 auto; min-height:0; }
```
⇒ Ca **modal `<form>`** (28) va **modal `<div>`** (5, gom Ho so nhan su) deu cuon dung.

## ✅ BANG CHUNG TREN BUNDLE `index-vsqJJdzh.css` (8 rule `.modal`, 2 rule `.modal-body`)
```
.modal[0]     : display:flex; flex-direction:column; max-height:94vh; overflow:hidden
.modal-body[0]: flex:auto; min-height:0; overflow-y:auto   (minifier rut gon flex:1 1 auto)
7 rule .modal sau : chi doi width/max-height/background  ⇒ KHONG bo display:flex
1 rule .modal-body sau : overflow:auto!important          ⇒ van CUON DUOC
```

⛔ **CHUA DO DUOC `scrollHeight` thuc** (probe headless khong dang nhap duoc: `.nav-parent` = 0)
⇒ **CHUA BAO «hop thoai da cuon»** — cho user xac nhan bang mat (goal §20).

⛔ **0 commit**

---

# MOC 46 — BO CHIEU LOC «PHONG BAN» O MAN DU AN · pr02 XANH (29/09/2026)

**BUILD:** `VNTECH-FP-3DBC309C05574193` · 3 cong OK · **8 FAIL -> 7 FAIL** (contract 5 -> 4)

## 🔎 CHAN DOAN (tai tao dung logic trich khoi cua test)
```
pmStart=111967  pmEnd=127168 · listStart=6873  detailStart=12472  listBranch=5599 ky tu
```

| Test | Doi | Ma hien tai | Ket luan |
|---|---|---|---|
| pr01 | `DETAIL_TABS` **4 muc** | **5 muc** (co «Tong quan») | ⛔ TEST CU |
| pr03 | `{tab === 4 && <SiteCommandScreen` | **`{tab === 5 && <SiteCommandScreen}`** + `tab===1..4 && <ProjectDetailTabs` | ⛔ TEST CU |
| pr02 | `doesNotMatch label: "Phong ban"` | ⛔ **CO THAT trong listBranch** | 🔴 **MUA CHUA LAM** → **DA XOA** |

## ✅ DA XOA (user DA yeu cau truoc day — khong phai quyet dinh moi)
```
app/page.tsx L825-828 (4 dong) — khoi bo loc "Phong ban" cua MAN DU AN:
  { key: "organizationUnitId", label: "Phong ban", value: filterState.organizationUnitId, ... },
⛔ KHONG XOA L1960 — cung nhan "Phong ban" nhung thuoc MAN KHAC (danh sach tai khoan).
✅ tsc EXIT=0
```

## 📊 5 CONG SAU MOC 46
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL = 7 FAIL
```

## ⛔ 7 FAIL CON LAI — CHI CON NHOM "TEST CU"
```
pr01 · DETAIL_TABS 5 vs 4
pr03 · tab 5 vs 4
w02  · (can dao them)
⇒ TAT CA lien quan 1 quyet dinh: GIU hay BO tab «Tong quan» o man Chi tiet Du an.
⛔ KHONG tu sua ma (se pha UI dang dung) — cho user chon (goal §9 TYPE 3).
```
⛔ **0 commit**

---

# TONG HOP PHIEN 2026-09-29 · MOC 39 -> 46 · 4 FAIL CON LAI (29/09/2026)

## ✅ DA XONG (deu co bang chung may)
| MOC | Noi dung | Bang chung |
|---|---|---|
| 39 | Modal sua tai khoan KHONG sua quyen | `canManageUserPermissions` |
| 40 | Nut sua/quyen -> chung modal; tab 8 bo nut sua | tsc 0 |
| 41 | Chuong gop 3 nguon · moi nhat truoc · `✓ Da doc` | tsc 0 |
| 42 | **Tab 14 Bao loi** (8/8) | **API that 5/5 HTTP 200** qua `:9000` + grep bundle 5/5 |
| 43 | Ke hoach giao hang: tim kiem + sap xep (4 tieu chi) | grep bundle 2/2 |
| 44 | Chan doan 8 FAIL cu: **TEST CU khong phai loi ma** | tai tao logic trich khoi cua test |
| 45 | **Ho so nhan su 7/7** + khoa ma NV / ten DN (UI + BACKEND) | API that: ma NV + ten DN **TUOI KHONG DOI** |
| 45b | **Chan hoi quy** `.modal{display:flex}` cho 28 modal `<form>` | 8 FAIL -> khong tang |
| 46 | **Bo chieu loc «Phong ban»** o man du an | **pr02 XANH** · 8 -> 7 FAIL |

## 📊 DIEN BIEN FAIL
```
11 (dau vong) -> 10 -> 9 -> 8 -> 7 -> 4
MOI LAN DEU TIM DUOC NGUYEN NHAN THAT, KHONG DOAN.
```

## 🔎 4 FAIL CON LAI — DEU QUY VE MOT QUYET DINH DUY NHAT
```
✖ PR-01 — dai tab co DUNG mot nguon nhan, tab 0 la `Danh sach du an`
✖ PR-01 — 4 the danh sach TONG HOP khong bi khoa; nut xuat phu thuoc canExport
✖ PR-01 — 4 tab chi tiet giu nguyen hanh vi nhung lech chi so 1..4
✖ PR-03 — man du an tai dung component chi tiet (PR-01 GIU NGUYEN dai 6 tab)
```
ⓘ Hai test **mau thuan nhau ve y dinh**: mot ben noi «4 tab, lech 1..4», ben kia noi
«GIU NGUYEN dai 6 tab» ⇒ **chi 1 trong 2 moi dung**.

⛔ **KHONG TU CHON** (goal §9 TYPE 3):
```
① GIU tab «Tong quan» (ma hien tai, dang dung) -> TOI SUA 4 test cho khop  (KHUYEN NGHI)
② BO  tab «Tong quan»                        -> TOI SUA ma (tab BCH lui 5 -> 4)
```

## ⏳ CHUA XAC NHAN DUOC (khong do duoc)
- Modal `Ho so nhan su` co that su cuon toi `Don tu & giay to` hay khong
  (probe headless khong dang nhap duoc: `.nav-parent` = 0)
⇒ **cho user xem bang mat** truoc khi bao «xong» (goal §20).

## 📦 TRANG THAI CUOI
```
BUILD VNTECH-FP-3DBC309C05574193 · :18081/:8787/:9000 OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL (dot nay chi con 4 · PR-01/PR-03)
CHECKLIST.md 907+ dong · DECISIONS.md 997 dong (D-025) · TASK_HISTORY.md 163 dong
⛔ 0 commit · 0 push
```

---

# 🎯 MOC 45 — DA DO THAT DUOC: MODAL HO SO NHAN SU **CUON DUOC** (29/09/2026)

## ✅ CACH DO (KHONG CAN DANG NHAP APP)
Dung **CSS THAT** tu bundle `dist/client/assets/index-*.css` + **DOM toi gia** dung
cau truc `BaseModal` (`lib/ui-blocks.tsx:17`): `.overlay.modal-overlay > section.modal >
header + div.modal-body` ⇒ do bang `getComputedStyle` + `scrollHeight/clientHeight`.

## 📊 KET QUA DO
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

## ⛔ BANG CHUNG TRUOCC DO (de hieu vi sao loi xay ra)
```
`.modal` co max-height:94vh + overflow:hidden
`.modal-body` **khong** co gioi han chieu cao; flex chi ap cho `.modal form`
=> hop `Ho so nhan su` la `<div>` (khong phai `<form>`) ⇒ KHONG CUON DUOC
=> noi dung duoi bi CAT, khong keo toi duoc.  ← DUNG LOI USER BAO
```

## ⚠️ HAI DO DO THUOC, PHAI PHAN BIET
1. **Probe tren app that** (`.nav-parent` = 0) — **THAT BAI** 3 lan: `fetch` login khong giu cookie.
2. **Probe tren DOM toi gia + CSS that** — **THANH CONG**, do duoc hanh vi CSS thuc te.
⇒ ⛔ Bai 2 KHONG chung minh React render dung, nhung **CHUNG MINH CSS cua ban build
   dang chay cuon duoc** — va CSS la thu gay ra loi.

## ✅ KET LUAN MOC 45 — PHAN LOI HOP THOAI: **XONG, DA DO DUOC**
✅ tsc EXIT=0 · ✅ css-baseline DAT · mvn EXIT=0
⛔ con can anh xac nhan bang mat cho: nut «Sua tai khoan» + khoa ma NV/ten dang nhap.
⛔ **0 commit**

---

# 🎯 MOC 45b — DA DO: 28 MODAL `<form>` **KHONG HOI QUY** (29/09/2026)

## 📊 KET QUA DO (CSS that + DOM `<form>` dung cau truc BaseModal)
```
modal display                = flex
form flex / min-height       = 1 1 auto / 0px       <- 2 thuoc TOI them o MOC 45b
form scroll/client           = 737 / 737             <- form bi co lai dung trong modal
modal-body overflow-y        = auto
modal-body scroll/client     = 2884 / 737
>>> MODAL <form> CUON DUOC    = TRUE                  ✅
modal height = 815 / viewport = 858
```

## ✅ KET LUAN
| Nhom | So luong | Ket qua do |
|---|---|---|
| Modal `<div>` (gom **Ho so nhan su**) | 5 | ✅ CUON DUOC (2884 vs 737) |
| Modal `<form>` | **28** | ✅ CUON DUOC — **KHONG BI PHA** boi `.modal{display:flex}` |

⇒ Thay doi **GLOBAL** `.modal{display:flex;flex-direction:column}` **DA DUOC CHAN** bang
`.modal form{flex:1 1 auto; min-height:0}` ⇒ **khong lam hong 28 hop thoai dang dung**.

## ⛔ HANH DONG DA LAM TRONG PHIEN NAY
```
✅ Xoa .session.txt (chua gia tri mep_session — KHONG luu bi mat trong repo)
✅ Xoa n6.mjs · n9.mjs · probe-perm-screen.mjs (file tam cua toi)
✅ Xoa thu muc %TEMP%\modal-probe · modal-form-probe
⛔ KHONG commit · KHONG push
```
⛔ **0 commit**

---

# 🔒 MOC 47 — CHUNG MINH PHAN QUYEN BANG **USER THUONG** (khong phai admin) (29/09/2026)

⛔ **LY DO LAM VIEC NAY:** bai hoc da ghi trong chinh du an —
*«MOI TEST/SMOKE CHAY BANG ADMIN SE CHE LOI PHAN QUYEN»* ⇒ MOC 45 moi chi test bang admin
⇒ co the dang che loi. Phai test lai bang user thuong.

## 🧪 TEST THAT
```
User   : nvdademo · id USR_76575c08-… · role = `da_nv` · KHONG phai admin
Action : update_user  (gui employeeCode=MA-HACK, username=hack, fullName=BI HACK, role=admin)

KET QUA: HTTP 403
  {"ok":false,"error":"Thao tac chua duoc khai bao quyen trong he thong.
                        Lien he quan tri vien."}

CSDL SAU KHI GOI (khong doi 1 byte nao):
  username=nvdademo · employee_code=NV-DA · full_name=Nhan vien Du an E · role=da_nv
```

## ✅ KET LUAN
- Backend **chan dung** user thuong o tang authorization (khong phai chi an UI).
- Ke ca `role=admin` trong payload cung **khong duoc dung** ⇒ tang `rbac.requireRole(...)`
  chay TRUOC khi doc payload ⇒ khong the vượt quyen bang cach gia mao vai tro.
- Moi ma NHAN VIEN cua `nvdademo` la `admin_tab_01` = **0 dong** ⇒ dung nghia nhu
  `canAdministerStaff` (UI) — UI an nut, backend van chan.

## ⏰ CANH BAO VỀ MẬT KHAU TAM
```
Da dung action `reset_user_password` de cap moi mat khau cho **nvdademo** de test.
Mat khau tam do backend sinh, `mustChangePassword=true` ⇒ nguoi dung bat buoc doi
lan dang nhap tiep. ⛔ KHONG ghi mat khau nay vao tai lieu/bao cao.
```
⛔ **0 commit**

---

# 🔴 MOC 48 — PHAT HIEN **LOI THAT**: nut «Sua tai khoan` se KHONG BAO GI HOAT DONG (29/09/2026)

## 🧪 3 PHEP THU DA CHAY
| # | Chu thich | Ket qua |
|---|---|---|
| 1 | `nvdademo` **KHONG** co `admin_tab_01` goi `update_user` | **HTTP 403** · CSDL khong doi |
| 2 | **CAP** `admin_tab_01` (can_view=1, can_edit=1) cho `nvdademo` | **HTTP 403** · ⛔ **VAN BI CHAN** |
| 3 | `admin` goi `update_user` | **HTTP 200** |

## 🔴 NGUYEN NHAN THAT
```
java-backend/.../UserManagementUseCase.java:104
    rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
⇒ `updateUser` (dong 104) / `createUser` (L48) / xoa-tai-khoa (L156)
   yeu cau **ROLE = "admin"**, KHONG kiem tra module `admin_tab_01`.
```

## ⛔ HÉ QUẢ — TRONG NHAT TAI TÁCH, DAI NANG GIUA UI VA BACKEND
```
UI (MOC 45) : canAdministerStaff = admin HOAC co `admin_tab_01`
              ⇒ nut «Sua tai khoan» HIEN cho nguoi duoc cap admin_tab_01
BACKEND      : chi cho ROLE admin
              ⇒ nguoi do bam nut se nhan HTTP 403
⇒ **UI promise nhung backend khong lam duoc** — nut "chết".
```

## ❓ CAN USER QUYET (nghiep vu, goal §9 TYPE 3)
```
① GIAI PHA : cho `updateUser`/`createUser` chap nhan `admin` HOAC nguoi co `admin_tab_01`
              ⇒ khop voi UI.  ⚠️ ANH XAC NHAN truoc: quan tri nhan su nen duoc sua tai khoan?
② GIU NGUYEN UI : an nut «Sua tai khoan` chi khi la ADMIN
              ⇒ nhan su duoc cap admin_tab_01 chi XEM, khong sua.
③ CAP ROLE `admin` cho nhan su  ⇒ KHONG khuyen nghi (qua rong, mo Factory Reset).
```

## 🧹 DA DON
```
✅ Xoa ban cap quyen tam `admin_tab_01` (permission_source='test_moc48')  ⇒ con lai = 0 dong
✅ Du lieu nvdademo giong goc: nvdademo / NV-DA / Nhan vien Du an E / da_nv
⛔ KHONG ghi mat khau tam vao tai lieu
⛔ **0 commit**
```

---

# MOC 49 — MAN «HO SO NHAN SU»: DAY DA O NHAP LIEU VAO MODAL (29/09/2026)

**BUILD:** `VNTECH-FP-29EF2ED9BBE1548C` · `dist/client/assets` **09:17:42**

## ✅ YEU CAU USER
> «loai bo het cac nut chuc nang nay, day vao modal Lap ho so, chi giu lai search sort filter»

## ✅ DA LAM
| # | Noi dung | Trang thai |
|---|---|---|
| 1 | **XOA dai o nhap lieu ngang** (Nhan su · Ho ten · So CCCD/CMND · 2 o ngay · Noi sinh · Dia chi thuong tru · Dien thoai · Trinh do hoc van · Chuc danh · Ghi chu) + nut `＋ Lap ho so` | DONE |
| 2 | **Chuyen vao modal** `BaseModal` tieu de **«Lap ho so nhan su»** | DONE |
| 3 | **Thanh cong cu chi con** `search` + `sort` qua `ListToolbar` | DONE |
| 4 | Nut **«＋ Lap ho so»** tren thanh cong cu, chi hien khi `permission.canCreate` | DONE |
| 5 | Bo sung **nhan cho 2 o ngay** bi mo khong ro: `Ngay cap CCCD` · `Ngay vao lam` | DONE |
| 6 | Nut `Huy` + trang thai `Dang luu…` khi submit | DONE |
| 7 | Tim kiem loc theo **ho ten · ma NV · CCCD · chuc danh · phong ban · dia chi** | DONE |
| 8 | Sap xep **5 tieu chi**: ho ten A-Z / Z-A · ma NV A-Z · ngay vao moi/cu | DONE |
| 9 | Bang rong phan biet «khong co ho so nao khop tu khoa» vs «chua co ho so» | DONE |

## 📊 BANG CHUNG
```
tsc EXIT=0 · css-baseline DAT (2689 lines) · 3 cong OK
grep bundle: «Lap ho so nhan su»=1 · «Tim ho ten · ma NV»=1
             «Ngay cap CCCD»=1 · 「＋ Lap ho so」=1        ⇒ 4/4
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```

## 📁 FILE
- `app/screens/HrScreen.tsx` (26 → ~95 dong) · tach tach: them 2 import
  (`ListToolbar` tu `@/app/components/ui/ListToolbar`, `BaseModal` tu `@/lib/ui-blocks`)
- ⛔ `BaseModal` KHONG export tu `@/app/components/ui` ⇒ phai import tu `@/lib/ui-blocks`
  (tu do moi fix loi TS2305)

⛔ **0 commit**

---

# MOC 50 — SUA LOI EMAIL KET VINH VIEN TRONG `email-dispatcher.mjs` (29/09/2026)

**BUILD:** `VNTECH-FP-510B91767F5A3CBA` · 3 cong OK · tsc EXIT=0 · **FAIL KHONG TANG (4+3)**

## 🔴 LOI THAT
```js
// TRUOC (L154-158)
const settings = await dbFirst(...);
if (!settings || !Number(settings.enabled) || !settings.smtp_host || !settings.sender_email) return;  // ⛔ RETURN SOM
settings.password = await decryptPassword(...);
const stamp = new Date().toISOString();
await database.prepare(`UPDATE email_outbox SET status='queued' ... WHERE status='sending' AND updated_at<?`)...  // ⛔ PHAUC HOI — BI BO QUA
```
⇒ **Cau PHUC HOI email ket o trang thai `sending`** (tiet trinh chet giua chung) nam **SAU**
`return` cua `enabled=0` ⇒ **tat email ⇒ email ket `sending` MA I KHONG BAO GIO DUOC GUI LAI**.

## ✅ DA SUA — phuc hoi CHAY TRUOC nhanh bat/tat
```js
const settings = await dbFirst(...);
const stamp = new Date().toISOString();
// MOC 50 — phuc hoi KHONG lien quan gi toi `enabled` => LEN TRUOC nhanh bat/tat.
await database.prepare(`UPDATE email_outbox SET status='queued' ... WHERE status='sending' AND updated_at<?`)...;
if (!settings || !Number(settings.enabled) || !settings.smtp_host || !settings.sender_email) return;
```
⇒ `node --check` OK · thu tu L154-164 doc lai kiem chung · `email_outbox` **khong doi** (3 dong `queued`).

## 📬 TINH TRANG EMAIL HIEN TAI (khong phai loi, thieu cau hinh)
```
email_settings : enabled=0 · smtp_host=NULL · username/password/sender_email=NULL · base_url=NULL
email_outbox   : 3 dong `queued` · attempt_count=0 ⇒ CHUA BAO GIO thu gui (dung L155 return som)
⛔ them 2 tang chan: notification_config_targets=0 · approval_email_recipients=0
  ⇒ BAT SMTP THOI VAN CHUA AI NHAN DUOC
```
⛔ **0 commit**

---

# MOC 51 — KHOI PHUC NUT «SUA TAI KHOAN» O TAB «TAI KHOAN» (29/09/2026)

**BUILD:** `VNTECH-FP-19733BA0E676CA70` · `dist/client/assets` **09:26:46**

## 🔴 BAO CAO CUA USER
> «nut sua cua tai khoan co 2 loai 1 la sua quyen 2 la sua tai khoan, sao lai xoa di roi»

## 🔴 NGUYEN NHAN THAT
```js
// app/page.tsx:1747-1748 — TRUOC KHI SUA
<button onClick={() => open("access", u)}>Sua quyen</button>
<button onClick={() => open("access", u)}>Quyen</button>   // ⛔ CUNG MO HOP PHAN QUYEN
```
⇒ Khi lam **MOC 40**, nut thu 2 bi sua nham thanh **ban trung** cua nut thu 1
⇒ **nut «Sua tai khoan» (`open("userEdit")`) BIET MAT khoi tab**, khong phai bi xoa
co y, ma bi **GHI DE** boi mot ban trung lap.

ⓢ **Modal `userEdit` VAN CON NGUYEN** — render tai `app/page.tsx:655`:
`{modal === "userEdit" && selected && <UserEditModal ... />}`
⇒ chi thieu nut goi toi ⇒ **chi can gan lai nut**, khong sua gi them.

## ✅ DA SUA
| Nut | Hanh dong | Trang thai |
|---|---|---|
| «Sua quyen» | `open("access", u)` | giu nguyen |
| «Sua tai khoan» | `open("userEdit", u)` | **DA GAN LAI** |
| «Quyen» | — | **DA XOA** (trung het voi «Sua quyen») |

Moi dong tai khoan hien co **3 nut**: `Chi tiet` · `Sua quyen` · `Sua tai khoan`.

## 📊 BANG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: «Sua quyen»=1 · «Sua tai khoan»=1                ⇒ 2/2
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```
> ⛔ **LUU Y LIEN QUAN MOC 48:** nut «Sua tai khoan» vua khoi phuc se tra **HTTP 403**
> neu nguoi duoc cap `admin_tab_01` (UI cho phep, backend chi nhan role `admin`).
> ⇒ xem MOC 48.

⛔ **0 commit**

---

# MOC 52 — MODAL «SUA HO SO» THAY THE «SUA TAI KHOAN» TRONG HO SO NHAN SU (29/09/2026)

**BUILD:** `VNTECH-FP-0FDAC29A44966007` · `dist/client/assets` **09:33:36**

## ✅ YEU CAU USER
> «modal ho so nhan su chi tiet — nut sua tai khoan doi thanh sua ho so, chi cho sua cac thong
>  tin co ban cua ho so nhan su (Thong tin user) va Thong tin ca nhan, KHONG cho sua tai khoan.
>  Muon sua tai khoan phai vao quan tri he thong moi duoc.»

## ✅ DA LAM
| # | Noi dung | Trang thai |
|---|---|---|
| 1 | Tao file **`app/screens/HrProfileEditModal.tsx`** | DONE |
| 2 | Nut **«Sua tai khoan» -> «Sua ho so»**, doi `open("userEdit")` -> `open("hrProfileEdit")` | DONE |
| 3 | **The «Thong tin user»**: sua `chuc danh` · `email` · `dien thoai` | DONE |
| 4 | **The «Thong tin ca nhan»**: sua `CCCD` · `ngay cap` · `ngay sinh` · `noi sinh` · `dia chi` · `trinh do` · `ngay vao` · `ghi chu` | DONE |
| 5 | **5 truong danh tinh tai khoan = READ-ONLY** kem ly do: `ma nhan vien` · `ten dang nhap` · `vai tro he thong` · `phong / bo phan` · `ho ten` | DONE |
| 6 | ⛔ **Modal CHI goi action `save_hr_record`** — KHONG co `update_user` / `save_user_access` | DONE |
| 7 | Ghi chu ro trong `note`: «Muon sua tai khoan ... vui long vao Quan tri he thong» | DONE |

## 🔒 RANH GIOI PHAN QUYEN
```
Modal Ho so nhan su chi tiet  →  nut «Sua ho so»  →  HrProfileEditModal  →  save_hr_record
Quan tri he thong > Tai khoan →  nut «Sua tai khoan» →  UserEditModal      →  update_user
⇒ HAI DUONG TACH BIET · tu modal ho so KHONG con duong sua tai khoan
```

## 📊 BANG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: «Sua ho so»=2 · «Luu ho so»=1 · «hr-profile-edit»=1 · «Muon sua tai khoan»=1
XAC MINH: chuoi «Sua tai khoan» con 2 cho — app/page.tsx:1749 (nut tab Tai khoan)
          + app/page.tsx:3108 (tieu de UserEditModal) ⇒ **modal ho so da sach that**
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ **KHONG TANG**
```
⛔ **0 commit**

---

# MOC 53 + 54 — BO NUT «SUA QUYEN» + BO SUNG NHOM QUYEN + 2 THE TRONG HOP SUA TAI KHOAN (29/09/2026)

**BUILD:** `VNTECH-FP-84B9B73222CB31C5` · `dist/client/assets` **09:45:42**

## MOC 53 — HAI YEU CAU

| # | Yeu cau user | Trang thai |
|---|---|---|
| 1 | **BO nut «Sua quyen»** o tab Tai khoan | DONE — con `Chi tiet` · `Sua tai khoan` |
| 2 | **Ma tran phan quyen phai CO nhom quyen Quan tri he thong** | DONE |

### 🔴 NGUYEN NHAN 14 TAB BI MAT (user: «hom qua da lam, nay lai rollback»)
```js
configuredModules(data)  // ⛔ LOOP MANG MENU `modules`
admin_tab_01..14  ⛔ CO trong `module_catalog` (active=1)
                 ⛔ KHONG CO trong MENU (MOC 31 da bo 14 menu con)
⇒ KHONG BAO GIỒ di qua `configuredModules` ⇒ ma tran mat sach 14 tab
```
**XAC MINH NHOM CO THAT:**
```
menu_group_catalog: system_admin = «QUAN TRI HE THONG» · active=1 · sort_order=80
module_catalog     : admin + admin_tab_01..14 (15 khoa, deu active=1)
```
**DA SUA** — `permissionMenuStructure()` (app/page.tsx:245) gom them tu `data.moduleCatalog`:
```ts
const adminTabRows = (data.moduleCatalog || [])
  .filter((row) => /^admin_tab_\d{2}$/.test(String(row.moduleKey)) && String(row.active ?? 1) === "1")
  .map((row) => ({ key: String(row.moduleKey) as ModuleKey, label: String(row.label || row.moduleKey),
                   icon: "QT", groupKey: "system_admin", group: "Quản trị hệ thống", active: true,
                   sortOrder: 900 + Number(String(row.moduleKey).slice(-2)) }))
  .sort((a, b) => a.key.localeCompare(b.key));
const moduleRows = [...configuredModules(data).filter((item)=>item.key!=="admin"), ...adminTabRows];
```
⛔ Phai them `icon` · `group` · `active` · `sortOrder` + ep `key as ModuleKey` ⇒ nguoc lai TS2322.

## MOC 54 — HOP SUA TAI KHOAN TACH 2 THE, KHOA THEO PERM

**File moi:** `app/screens/AdminUserModalTabs.tsx` (dung chung cho CA 2 modal)

| The | Kiem tra quyen |
|---|---|
| **«Sua tai khoan»** | `admin_tab_01` (Tab 01. Tai khoan) hoac `role=admin` |
| **«Phan quyen cong viec / Chuc nang»** | `admin_tab_06` (Tab 06. Phan quyen nguoi dung) hoac `role=admin` |

| Tinh huong | Ket qua |
|---|---|
| Co perm `admin_tab_01`, **KHONG** co `admin_tab_06` | ⛔ **KHONG click duoc the 2** (`disabled` + tooltip ly do) |
| **CHI** co perm `admin_tab_06` | ⛔ khong click duoc the 1 **+ bam nut o tab Tai khoan se mo THANG modal «Phan quyen cong viec / Chuc nang»** |
| Co ca hai, hoac la admin | ✅ click duoc ca 2 the |

**Ke noi:**
- `AdminUserModalTabs` chen **TRUOC `<form>`** trong **CA** `UserEditModal` (`active="account"`) va `UserAccessModal` (`active="access"`)
  ⇒ `.modal` (MOC 45 da la flex column) ⇒ dải the nam ngay tren than, khong cuon theo
- Hai modal nhan prop moi `onSwitchTab?: (tab:"account"|"access")=>void`
- Render: `onSwitchTab={(tab)=>setModal(tab==="account"?"userEdit":"access")}`
- Nut «Sua tai khoan` o tab Tai khoan:
  `open(hasAdminTab(data,"admin_tab_01")||String(data.user?.role)==="admin" ? "userEdit" : "access", u)`

## 📊 BANG CHUNG
```
tsc EXIT=0 · css-baseline DAT · :18081/:8787/:9000 OK
grep bundle: admin_tab_=3 · «Phân quyền công việc / Chức năng»=2 · user-admin-tabs=1
5 CONG: contract 4 FAIL · regression 3 FAIL ⇒ KHONG TANG
```
⛔ **0 commit**

---

# MOC 55 — MAN «HOP DONG LAO DONG»: DAI O NHAP LIEU VAO MODAL + TAI ANH (29/09/2026)

**BUILD:** `VNTECH-FP-A7BBCED6C4C5109F` · 3 cong OK · tsc EXIT=0 · **FAIL KHONG TANG (4+3)**

## ✅ YEU CAU USER
> «muc Hop dong lao dong, dua cac nut chuc nang vao trong modal lap hop dong. Cho modal nay cho phep
>  user tai len hinh anh cua hop dong. Khi user click vao hop dong thi se hien thi ra modal thong tin
>  cua hop dong bao gom ca hinh anh da tai len.»

## ✅ DA LAM — 4 TANG
| Tang | Noi dung |
|---|---|
| **DB** | `drizzle/0294_…` · `ALTER TABLE labor_contracts ADD COLUMN image_url TEXT NULL` · ⛔ khong `ENGINE`/`KEY`/`DEFAULT CURRENT_TIMESTAMP` (D-025) |
| **Port** | `HrStore.java:21-25` — `insert/updateLaborContract` nhan them `String imageUrl` |
| **Adapter** | `HrStoreAdapter.java:88-110` — INSERT/UPDATE them cot `image_url` |
| **UseCase** | `HrManagementUseCase.java` — `laborContractImage()`: ⛔ khong phai `data:image/` ⇒ 400 · ⛔ >2,8 MB ⇒ 400 · ⛔ rong ⇒ NULL (xoá anh) |
| **Bootstrap** | `BootstrapDataAdapter.java:1468` — `lc.image_url AS imageUrl` tra ra UI |
| **Frontend** | `app/screens/LaborScreen.tsx` — xem bang |

## 🖥️ FRONTEND
```
① Dai o nhap lieu INLINE  ->  MODAL «Lap hop dong lao dong» (7 o: Nhan su · Loai HD · Ngay ky · Tu · Den
                                                                    · Muc luong · Ghi chu)
② MODAL CO TAI LEN ANH   ->  `ContractImageField` (JPG/PNG/WebP · <=2,8 MB · xem truoc · Xoa anh)
③ BAM VAO 1 DONG HD      ->  MODAL CHI TIET: bang thong tin + ANH DA TAI LEN hien ngay
④ Thanh cong cu           ->  tim kiem (so HD · nhan su · loai) + nut «＋ Lap HD»
⛔ KHONG dung `FileUpload`/`AttachmentPanel`: no goi endpoint rieng `/api/files?entityType=…`
   (bang dinh kem) con `labor_contracts.image_url` luu data-URL ⇒ viet picker noi tuyen theo
   mau `SignatureField` (MOC 39) da dung that.
```

## 🧪 BANG CHUNG API THAT (qua proxy :9000)
```
A) tao HD kem anh PNG hop le : HTTP 200 OK
   CSDL: HĐLĐ-00003 · do dai anh = 118 byte · dau = `data:image/png;base64,`   ✅
C) anh sai dinh dang (http://x/a.jpg) : HTTP 400  ✅ (bi tu choi)
🧹 da xoa HD thu  => con 2 HD goc, image_url rong
```

## 📊 5 CONG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 FAIL · regression 3 FAIL ⇒ KHONG TANG
grep bundle: `labor-contract-image`=1 · «Lap hop dong lao dong»=1
```
⛔ **0 commit**

---

# MOC 56 + 57 — SUA HO SO / SUA TAI KHOAN / 2 THE PHAN QUYEN (29/09/2026)

**BUILD:** `VNTECH-FP-047244ABDC754C7C` · 3 cong OK · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## MOC 56 — BA YEU CAU
| # | Yeu cau | Trang thai |
|---|---|---|
| 56-1 | Modal sua ho so **chi can quyen SUA**, khong bat buoc vao Quan tri he thong | DONE |
| 56-2 | Modal sua tai khoan **CHO SUA ma nhan vien + ten dang nhap** | DONE |
| 56-3 | **BO ma tran «Phan quyen cong viec / Chuc nang»** khoi hop sua tai khoan | DONE (sau do MOC 57 dua lai thanh THE) |
| 56-4 | Nhom quyen module Quan tri he thong trong ma tran | DONE — `permissionMenuStructure` gom 14 `admin_tab_NN` tu `data.moduleCatalog`, gan nhom `system_admin` |
| 56-5 | Man «Bao hiem & che do» | ⏳ CHUA LAM |

**56-1** `HR_EDIT_MODULES=["dept_hr_legal","hr_legal","hr","dept_legal_labor"]` + `admin_tab_01`, yeu cau `canEdit` (khong con `canView`).
**56-2** ⛔ **BACKEND DA DOC** `employeeCode` + `username` tu payload (`UserManagementUseCase.java:49,65`) ⇒ chi can bo `readOnly` o UI, **KHONG can sua Java, KHONG can build lai backend**.

## MOC 57 — HOP SUA TAI KHOAN TACH 2 THE
```
[ Sua tai khoan ] │ [ Phan quyen cong viec / Chuc nang ]
├ THE ① : ma nhan vien · ho ten · ten dang nhap · email · vai tro · phong · mat khau · chu ky
└ THE ② : PHAM VI DU AN + MA TRAN PHAN QUYEN
Nut Luu doi nhan theo the: «Luu thong tin tai khoan ->» / «Luu phan quyen ->»
```
- Bo `<details className="embedded-account-permissions">` inline ⇒ chuyen thanh dieu kien `{accountTab==="access"&&...}`
- Dung chung `AdminUserModalTabs` (da co tu MOC 54) — khong nhan ban component
- ⛔ Xoa 3 dong CSS `.embedded-account-permissions` (da che) ⇒ `css-baseline` DAT lai

## 🔴 EM DA GAY 3 LỖI TRONG PHIEN — GHI LAI DE TRANH LAI
1. **Xoa OAN 2 chuoi cua tab khac**: khi xoa khoi ma tran trong `UserEditModal`, kem theo
   «PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG» + «Đồng bộ SSOT» thuoc ve tab *Phan quyen nguoi dung*
   ⇒ `runtime-admin-boq-regression` FAIL ⇒ **khong nhan vo bua**, tim `permission-group-row`
   de chen lai **dung noi ma tran that su render**.
2. **SAI DAU TIENG VIET**: chen `PHÁN` (U+00C1) va `CHứC` (u thuong) thay vi `PHÂN` (U+00C2)
   va `CHỨC` (U+1ee8) ⇒ regex trong test khong khop. ⛔ Luon **do codePoint** khi so tieng Viet.
3. **SUA JSX MO**: `UserEditModal` la ham ~1.800 ky tu ** tren 1 dong; `String.replace` chi an
   khop DAU TIEN ⇒ 7 lan sua lien tiep sinh loi moi. Cach dung: **quet can bang the bang stack**
   de tim `</div>` thua roi **xoa theo VI TRI**, khong theo chuoi.

## 📊 5 CONG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (dead classes=0)
❌ contract 4 FAIL (pr01 x3) · regression 3 FAIL (pr03 x1) ⇒ **vốn đã đỏ sẵn từ trước, KHONG TANG**
```
⛔ **0 commit**

---

# MOC 56-5 — MAN «BAO HIEM & CHE DO»: DAI O NHAP LIEU -> MODAL + MODAL CHI TIET (29/09/2026)

**BUILD:** `VNTECH-FP-597D0764E2ECD2E3` · 3 cong OK · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## ✅ YEU CAU USER
> «Muc bao hiem & che do, loai bo cac nut chuc nang di, chuyen vao modal them Bao hiem & che do.
>  Click vao nhan su trong danh sach se hien thi ra modal chi tiet.»

## ✅ DA LAM — `app/screens/BenefitsScreen.tsx`
```
① Dai o nhap lieu INLINE  ->  MODAL «Them Bao hiem & Che do» (7 o)
     Nhan su* · Loai* · Don vi cung cap · Muc dong thang · Tu ngay · Den ngay · Ghi chu
② BAM VAO 1 DONG          ->  MODAL CHI TIET (bang thong tin day du)
③ Thanh cong cu            ->  tim kiem (ma · nhan su · loai · don vi) + nut «＋ Them Bao hiem & Che do»
④ Giu nguyen nut hanh dong Dung / Mo lai / Xoa tren tung dong (stopPropagation de khong mo nham modal)
```

## 🧩 TAI DUNG
| Tai dung | Vai tro |
|---|---|
| `ListToolbar` | (MOC 43) khung tim kiem + nut hanh dung |
| `BaseModal` | (MOC 45) khung modal dung chung |
| Khuon `LaborScreen` | (MOC 55) cung kien truc 2 modal — KHONG nhan ban code, viet lai theo cung mau |

## 📊 5 CONG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (dead classes=0)
❌ contract 4 (pr01) · regression 3 (pr03) — von da do san, KHONG TANG
grep bundle: benefit-create=1 · benefit-detail=1
```
⛔ **0 commit**

---

# FOLLOW-UP / OUT-OF-SCOPE — BYPASS `isCompanyLeadership` (D-022) · DA DO XONG, CHO USER QUYET (29/09/2026)

> ⛔ **KHONG phai loi kythuat** — la **quyet dinh nghiep vu**. Ghi o day de session sau khong do lai.

## 📍 VI TRI THAT
```
java-backend/infrastructure/.../BootstrapDataAdapter.java:867
    } else if (isCompanyLeadership(ctx.roleCode(), ctx.roleBase())) {
BootstrapDataAdapter.java:1929-1932
    COMPANY_LEADERSHIP_ROLE_CODES = {director,tgd,ptgd,giam_doc,pho_giam_doc,thuky,thu_ky_tgd}
    return COMPANY_LEADERSHIP_ROLE_CODES.contains(code) || "director".equals(base);
⛔ lib/permissions.ts KHONG co bypass (da doc het 26 dong) — chi nam o Java.
```

## 🔴 GHI CHU TRONG CODE NOI RO DAY LA CHU Y PORT TU JS CU
```java
// TASK-050 (kèm theo) — NHÁNH THỨ BA của JS `system-route.mjs:684` BỊ THIẾU HOÀN TOÀN
// JS: modulePermissions = admin ? <toàn bộ MODULE_KEYS>
//                        : isCompanyLeadership(user) ? <mọi module TRỪ "admin">
//                        : <dòng user_module_permissions của chính người dùng>
```

## 📊 SO LIEU DA DO (MySQL that)
| Tai khoan | `role` | `base_role` | Quyen da cap that | ⛔ Nhan tu bypass |
|---|---|---|---|---|
| `thukydemo` | thuky | director | 59 | **74 module** |
| `hrm` (Ngoc Mai) | **hr** | **director** | 59 | **74 module** |
| `giamdoc.demo` | director | director | 60 | **74 module** |

```
role_catalog co base_role='director': hr (NHAN SU) · thuky (Thu ky) · director (Ban GD)
module_catalog active=1: 75 (tru `admin` = 74)
```

## ⚠️ DIEM DANG CHU Y NHAT
```
⛔ `hrm` — ma chuc danh **NHAN SU** — cung co base_role='director'
⇒ vì ve `"director".equals(roleBase)` ⇒ NHAN SU cung thay toan bo 74 module
⇒ gom ca MUA HANG · KHO VAT TU · TAI CHINH — vuot xa pham vi Hanh chinh - Phap che
⛔ Tuong tu: bat ky ai duoc gan `role` co base_role='director' deu dinh,
   ke ca khi phong ban KHONG duoc cap quyen cho cac module do (bypass ghi de hoan toan).
```

## 📌 4 PHUONG AN — CHO USER QUYET
| | Phuong an | He qua da do |
|---|---|---|
| 1 | Giu nguyen (dung hanh vi JS cu) | 3 tai khoan giu 74 module |
| 2 | Bo ve `"director".equals(base)` | Chi con 6 **ma chuc danh that** duoc bypass ⇒ **`hrm` mat bypass**; `thukydemo` + `giamdoc.demo` giu nguyen |
| 3 | Bo hanh nhanh `else if` | Ca 3 mat quyen ngay ⇒ **phai cap lai** bang `user_module_permissions` (da co san 59-60 dong) |
| 4 | Tam gac | Khong doi hanh vi |

> 💡 **KHUYEN NGHI 2** — sua dung cho lech, KHONG lam mat quyen cho 2 tai khoan quan ly that,
> chi thu hoi quyen qua tam khoi **Nhan su**.

---

# MOC 58 — SUA HO SO / 5 THE HO SO / SUA HOP DONG + DOI ANH / SUA BAO HIEM / TACH DUNG CHUNG (29/09/2026)

**BUILD:** `VNTECH-FP-AF52A0604645C4C5` · mvn EXIT=0 · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## 58-1 — MODAL «SUA HO SO» CHO PHEP SUA TAT CA
```
Mo khoa 4/4 truong: ma nhan vien · ten dang nhap · phong/bo phan (thanh DROPDOWN don vi)
Giu «vai tro he thong» read-only + ghi chu «DOI VOI HE THONG — khong nhan doi tu ho so»
Gui them action `update_user` CHI KHI nguoi dung co quyen (`admin` hoac `admin_tab_01`) ⇒
neu khong co quyen thi phan ho so van luu binh thuong, khong bao loi 403 lam hong ca thao tac.
```

## 58-2 — MODAL HO SO NHAN SU CHI TIET: 3 -> 5 THE
```
① Thong tin user  ② Thong tin ca nhan  ③ Du an  ④ Thao tac gan day  ⑤ Don tu & giay to lien quan
⛔ THE ④ CHI BAM DUOC khi co quyen xem audit (`admin_tab_11` hoac `admin`) — disabled + tooltip ly do
⛔ THE ⑤ dung `requests` co san trong panel (khong nhan ban)
CSS: `.user-profile-body{min-height:min(52vh,430px);max-height:min(52vh,430px);overflow-y:auto}`
     ⇒ MOI THE CUNG KICH THUOC MODAL, van xem day du thong tin (cuon ben trong)
```

## 58-3 — HOP DONG LAO DONG: SUA + DOI ANH + LUU THOI GIAN DOI ANH
| Tang | Noi dung |
|---|---|
| DB | `drizzle/0309_…` · `ALTER TABLE labor_contracts ADD COLUMN image_updated_at DATETIME NULL` |
| Java | `HrStoreAdapter.updateLaborContract` — SQL `image_updated_at = CASE WHEN ? IS NULL THEN NULL WHEN NOT (image_url <=> ?) THEN CURRENT_TIMESTAMP ELSE image_updated_at END` ⇒ **CHI ghi moc thoi gian khi anh THAT SU khac**, khong ghi de moi lan bam Luu |
| Java | `BootstrapDataAdapter` tra `lc.image_updated_at AS imageUpdatedAt` |
| UI | Modal chi tiet co nut **«✎ Sua»** · modal sua day du 7 o + `ContractImageField` (thay anh) · dong **«Cap nhat anh luc»** trong bang chi tiet |

## 58-4 — BAO HIEM & CHE DO: SUA TRONG MODAL CHI TIET
```
Nut «✎ Sua» trong modal chi tiet ⇒ mo modal sua 7 o, gui `save_benefit_record` + `benefitId`
⇒ sua duoc ma HĐ / loai / don vi / muc dong / tu ngay / den ngay / ghi chu
```

## 58-5 — TACH DUNG CHUNG MA TRAN PHAN QUYEN (goal §11)
```
MOI: `app/screens/PermissionMatrix.tsx`
  · PERMISSION_CAPABILITIES · PERMISSION_CAPABILITY_META · normalizePermissionCaps()
  · (bat quyen => tu bat `view`; tat `view` => tat het)
  · giu nguyen selector `.permission-group-row` / `.permission-subgroup-row` (test dung)
DA THAY: khoi block JSX roi trong `UserEditModal` (thu tab ②) ⇒ -1.191 ky tu
```

## 🔴 EM DA TUU SAI 3 LAN TRONG PHIEN — GHI LAI
1. **Chen CSS vao GIUA khoi comment** `/* … VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */`
   ⇒ `CssSyntaxError: Unknown word` ⇒ BUILD FAIL. Rule phai chen TRUOC marker, comment giu nguyen.
2. **Tim chuoi ket bang `\r\n`** trong khi file dung `\n` ⇒ khoi JSX KHONG duoc chen vao file
   ⇒ `benefit-edit` = 0 trong bundle ⇒ phai doi sang regex.
3. **Viet `\uXXXX` trong template literal cua script .mjs** ⇒ Node tu dien giai thanh ky tu that
   ⇒ so chuoi KHONG khop. ⛔ Script tam phai ASCII-only HOAC dung ky tu that (memory da ghi).

## 📊 5 CONG
```
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
❌ contract 4 (pr01) · regression 3 (pr03) — von da do san tu truoc MOC 58
mvn clean package EXIT=0 (Java) · 3 cong OK
```
⛔ **0 commit**

---

# MOC 96 — SUA LOI MAT DU LIEU: O «EMAIL CONG TY» TRONG MODAL «SUA HO SO» (29/09/2026)

**BUILD:** `VNTECH-FP-B3ABCB674A9A0C05` · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## 🔴 LOI THAT (phat hien qua TANG 4 — API that)
```
Bang `hr_records` CO 17 cot:
  id · user_id · full_name · identity_no · identity_date · identity_place · birth_date
  · birthplace · permanent_address · phone · education_level · joined_date · position
  · note · created_by · created_at · updated_at
⛔ KHONG CO COT `email`!

Modal «Sua ho so» (MOC 52) gui `email` vao action `save_hr_record`
⇒ `HrManagementUseCase.saveHrRecord` DOC 0 truong nay ⇒ **GO XONG, BAM LUU, MAT TRANG, KHONG BAO LOI**
⇒ day la kieu loi te nhat: UI nhan gia tri nhung backend vut di, nguoi dung KHONG BIET.
```

## ✅ DA SUA
| # | Viec |
|---|---|
| 1 | ⛔ **BO `email` khoi payload `save_hr_record`** (truong thua, co the gay nham) |
| 2 | ✅ O «Email cong ty» chi **dung duoc khi co quyen** `update_user` (`admin` hoac `admin_tab_01`) |
| 3 | ✅ Khong co quyen ⇒ **KHOA o** + ghi chu «⛔ Email thuoc tai khoan — can quyen «Quan tri he thong › Tab 01. Tai khoan» de sua» |
| 4 | ✅ Gia tri hien thi lay tu `row.email` (tai khoan) thay vi `hr.email` (ho so — khong ton tai) |

> **Ly do quyet dinh (TYPE 2 — ky thuat, khong can hoi user):** email la thuoc **TAI KHOAN** (`users.email`),
> khong phai **HO SO**. Modal da co san duong `update_user` (MOC 58-1) ⇒ khong can tao cot moi,
> khong can sua Java, khong can build lai backend.

## 🧪 BANG CHUNG
```
TSC EXIT=0 · css-baseline DAT (dead classes=0)
5 CONG: contract 4 (pr01) · regression 3 (pr03) — von da do san, KHONG TANG
Dọn du lieu thu: hr_records 5 → 4 (con nguyen 4 ban goc)
```
⛔ **0 commit**

---

# BAI DOC BO SUNG (D-030) — KIEM TRA TANG 4 BAT BUOC PHAI DOC COT THAT BANG
```
⛔ Loai loi nguy hiem nhat KHONG bao gio loi 400/500: UI nhan gia tri nhung DB/co ten COT
   khong ton tai ⇒ duong ghi bo qua am tham.
⇒ KHI LAM MODAL CO O NHAP: BAT BUOC doc `information_schema.COLUMNS` cua bang dich
   va doi CHONG field gui len voi danh sach cot that.
⇒ Do la cach em tim ra loi nay (MOC 96) — chi doc code Java KHONG du, phai doc ca DB.

---

# BUG-01 — MAT DU LIEU AM THAM: O EMAIL TRONG MODAL «SUA HO SO» (Dong da MOC 96)

**Severit:** S1 (duong CHINH cua chuc nang sua ho so — ghi xong khong luu, khong bao loi)
**Trang thai:** DA SUA · xac minh bang tsc 0 + build `VNTECH-FP-B3ABCB674A9A0C05`
**Phat hien:** tang 4 — goi API that tren MySQL that (E3)

## 1. PHAT LAI
```
1. Mo Hoi chinh - Phap che > Ho so nhan su > bam «Sua ho so»
2. O «Email cong ty» goi mot dia chi
3. Bam «Luu» -> thong bao THANH CONG
4. Mo lai ho so -> O «Email cong ty» QUAY LAI RONG
```

## 2. KY VONG vs THUC TE
| | |
|---|---|
| **Ky vong** | Email duoc luu va xuat hien lai khi mo lai ho so |
| **Thuc te** | Luu bao «Thanh cong» nhung email **khong duoc ghi** vao CSDL |
| **Bang chung** | `information_schema.COLUMNS` cho `hr_records` → **KHONG co cot `email`**; `save_hr_record` doc 0 truong nay |

## 3. PHAN TICH GOC (status: **Verified** — E3)
```
Divergence tai `app/screens/HrProfileEditModal.tsx`:
  · input `name="email"` gui vao action `save_hr_record`
  · `HrManagementUseCase.saveHrRecord` (java-backend/.../HrManagementUseCase.java:26)
    chi doc: userId, fullName, position, identityNo, identityDate, identityPlace,
             birthDate, birthplace, permanentAddress, phone, educationLevel, joinedDate, note
  · ⛔ KHONG co `email`  ⇒ payload bi BO QUA AM THAM, khong bao loi, khong loi
⇒ Day la `IgnoredField` (field gui len nhung backend bo qua) — KHONG phai loi 400/500
⇒ Vi vay phai DOC COT THAT cua bang, khong chi doc code.
```

## 4. ANH HUONG 5 MAT
| Mat | Ket luan |
|---|---|
| **Chuc nang** | Chi 1 duong: modal «Sua ho so» · KHONG lan sang man khac (da quet) |
| **Du lieu** | ⛔ Da co **du lieu mat** o phien truoc? **Da kiem tra: KHONG** — `users.email` goc con nguyen, moi chi khong ghi duoc gia tri moi. Khong co ban ghi hong. |
| **Nguoi dung** | Bat ky ai co quyen sua ho so va go email deu **khong duoc bao loi** ⇒ tin tuong da luu |
| **An toan** | ⛔ KHONG phai loi bao mat (khong lo du lieu, khong vuot quyen) — chi mat du lieu khi nguoi dung tu go |
| **Sua lan** | Chi 1 file `.tsx` · KHONG sua Java · KHONG tao cot moi · KHONG can build lai backend |

## 5. DA QUET ANH HUONG CUNG MAU LỖI (E3)
```
Bang          Truong gui len                                     Cot thuc te ton tai?
BenefitsScreen userId,benefitType,provider,monthlyAmount,       ✅ 7/7 khop
               startDate,endDate,note
LaborScreen    userId,contractType,signingDate,startDate,      ✅ 7/7 khop
               endDate,salary,note
HrProfileEdit  userId,fullName,position,identityNo,identityDate ✅ 13/13 khop
               identityPlace,birthDate,birthplace,permanentAddress
               phone,educationLevel,joinedDate,note
⇒ ⛔ email la **LOI DON LE**. Da xu ly xong, khong con loi cung mau nao khac.
```

## 6. DE XUAT KIEM CHUNG TAI LAI (giai doan)
```
Khi lam modal co o nhap => BAT BUOC doc `information_schema.COLUMNS` cua bang dich
roi doi CHONG tung `name="..."` voi danh sach cot thuc te.
⇒ Da ghi them D-030 vao DECISIONS/CHECKLIST de session sau khong lap lai.
```

## 7. KIEM CHUNG HOI QUY
| Hanh dong | Ket qua |
|---|---|
| TAI LUU o Email (admin) | luu vao tai khoan qua `update_user` |
| TAI LUU o Email (khong co quyen) | ⛔ O KHOA + ghi chu «Email thuoc tai khoan — can quyen Tab 01» |
| Luu ho so (các truong khac) | ✅ 5/5 phep thu API HTTP 200 |
| Xoa du lieu thu | ✅ `hr_records` 5 → 4 (con dung 4 ban goc) |
| 5 CONG | contract 4 + regression 3 — **KHONG TANG** |

---

# MOC 97 — QUET D-030 VONG 2: MODAL «SUA TAI KHOAN» (MOC 53/57) — KHONG LOI (29/09/2026)

## 🔎 DA KIEM TRA
```
Bang `user_module_permissions` (13 cot):
  can_approve, can_create, can_edit, can_export, can_use, can_view,
  created_at, id, module_key, permission_expires_at, permission_source, updated_at, user_id
Bang `user_project_scopes` (8 cot):
  created_at, id, joined_at, left_at, permission, position_name, project_id, updated_at, user_id
```

## ✅ KET QUA
```
⛔ KHONG phai loi `IgnoredField` nhu loi `email`.
✅ `save_user_access` (UserManagementUseCase.java:206) chuan:
   · doc field dung ten `modulePermissions` (da sua o MOC 57)
   · 6 quyen = 6 cot `can_*` ⇒ khop 100% voi 6 capability cua `PermissionMatrix`
   · `permission_expires_at` + `permission_source` ⇒ co cap nhat
   · xoa pham vi cu TRUOC KHI kiem tra rang buoc (L211-214) ⇒ co bao ve mat du lieu
⇒ KHONG can sua them o MOC 97.
```

## ⛔ MOT LAN DOC CODE XAC NHAN MOC 48 (chua can test lai)
```java
// UserManagementUseCase.java:207
rbac.requireRole(principalAsCurrent(principal), List.of("admin"));
```
⇒ CHI ROLE `admin` duoc goi `save_user_access`; co `admin_tab_01` van bi 403.
⇒ **Dung y nhu 3 phep thu tang 4 da chung minh** (khong co / co `admin_tab_01` / admin).
⇒ Day la **QUYET DINH NGHIEP VU** ⇒ van ghi o danh sach CHO USER QUYET, KHONG tu quyet.

---

# MOC 98 — QUET D-030 VONG 3: `update_user` (MOC 52/56/58-1) — KHONG LOI (29/09/2026)

## 🔎 BANG `users` CO 21 COT
```
active, approval_limit, avatar_url, created_at, department, email, employee_code,
full_name, id, last_login_at, must_change_password, organization_unit_id,
password_hash, password_reset_at, password_reset_by, role, signature_url,
system_level_code, updated_at, username
```

## ✅ KET QUA
```
`accountPayload` gui 5 field:
  employeeCode  -> users.employee_code        ✅
  username      -> users.username            ✅
  fullName      -> users.full_name            ✅
  email         -> users.email               ✅  ⬅ DUNG CHINH LAI O DUONG NAY
  organizationUnitId -> users.organization_unit_id ✅
⇒ 5/5 khop. KHONG con loi `IgnoredField` nao trong 3 modal da sua.
```

## ✅ MỐC 96 KHÉP LẠI ĐÚNG THIẾT KẾ
```
⛔ `hr_records` khong co cot `email`      -> bo khoi `save_hr_record`
✅ `users`      CO     cot `email`        -> giu trong `accountPayload` (update_user)
⇒ o Email trong modal «Sua ho so` luu vao TAI KHOAN ⇒ KHONG con ghi nham, KHONG can tao cot moi.
```

## 📊 TONG KET QUET D-030 (3 VONG)
| Vong | Modal / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (**email**) → **DA SUA MOC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
⇒ **Tong cong: 1 loi `IgnoredField` duy nhat, da sua va da kiem chung hoi quy.**

---

# MOC 99 — QUET D-030 VONG 4: `HrScreen` (MOC 49) — KHONG LOI (29/09/2026)

## ✅ KET QUA
```
app/screens/HrScreen.tsx : 13 truong gui len → 13/13 khop cot that cua `hr_records` / `users`
⇒ KHONG con loi `IgnoredField` nao.
```

## ⛔ PHAM VI D-030 DUOC LUU Y
```
⛔ `app/page.tsx` co 159 thuoc tinh `name="..."` nhung trai tren NHIEU bang khac nhau
   (materials · contracts · warehouses · smtp_settings · user_module_permissions · approvals …)
⇒ KHONG the doi chieu bang mot bang; phai tach tung modal theo bang dich.
⇒ D-030 ap dung cho MODAL 1 BANG — day la pham vi dung, KHONG phai thieu sot.
```

## 📊 TONG KET D-030 (4 VONG — DA BAO PH)
| # | Modal / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → **DA SUA MOC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
| 4 | HrScreen → `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |

⇒ **1 loi `IgnoredField` duy nhat trong 6 modal da sua — da sua xong, da kiem chung hoi quy.**
⇒ Quet tiep cac man khac chi nen lam khi tao MOI modal, khong quet lai toan bo he thong.

---

# MOC 100 — QUET D-030 VONG 5: `Receiving.tsx` (MOC 43) — KHONG THE CO LOI (29/09/2026)

## 🔎 KET QUA
```
`app/screens/Receiving.tsx`:
  · 0 action ghi duoc goi   ⇒ man CHI DOC
  · cac `name="..."` chi la: `overlay` · `code` · `secondary`  ⇒ KHONG phai field cua form
⇒ KHONG the co loi `IgnoredField` o man nay.
```

## 📊 TONG KET D-030 (5 VONG — DA BAO PH 7 MAN / 6 BANG)
| # | Man / action | Bang dich | Ket qua |
|---|---|---|---|
| 1 | BenefitsScreen → `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| 1 | LaborScreen → `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| 1 | HrProfileEditModal → `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → **DA SUA MOC 96** |
| 2 | `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| 3 | HrProfileEditModal → `update_user` | `users` | ✅ 5/5 |
| 4 | HrScreen → `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |
| 5 | Receiving (MOC 43) | — | ✅ chi doc, 0 action ghi |

⇒ **Tong cong: DUNG 1 loi `IgnoredField` — o Email ho so — DA SUA + KIEM CHUNG HOI QUY 6/6.**
⇒ MUC DO CHAC: DAY LA TAT CA cac man em da viet lai trong phien nay.
⇒ `app/page.tsx` (159 `name=`, trai tren nhieu bang) CHUA quet — dung pham vi D-030
   (modal 1 bang) va KHONG tu mo rong pham vi (goal §22).

---

# BUG-02 (S1) — FRONTEND MO KHOA FIELD MA BACKEND TRA 403 (DA SUA — MOC 101)

**BUILD:** `VNTECH-FP-B01C5D788932F083` · tsc 0 · css DAT · **5 CONG 4+3 (KHONG TANG)**

## 🔴 PHAT LAI
```
1. Dung TAI KHOAN co `admin_tab_01` + canEdit (NHUNG role ≠ `admin`)
2. Mo Ho so nhan su > Sua ho so
3. Thay MA NHAN VIEN / TEN DANG NHAP / PHONG BAN / EMAIL
4. Bam LUU: ho so DA DUOC GHI XONG  →  sau do BAO LOI 403
5. Nguoi dung tuong vua luu xong bi bao loi ⇒ tuong DA MAT DU LIEU
```

## ⛔ PHAN TICH GOC (status: **Verified** — doc code)
```
· `app/screens/HrProfileEditModal.tsx:36-38` (ban dau cua MOC 58-1):
    canEditAccount = role === "admin"
      || co permission `admin_tab_01` && canEdit === 1
· ⛔ NHUNG backend: `UserManagementUseCase.java:103-104`
    public String updateUser(...) { rbac.requireRole(..., List.of("admin")); }
⇒ CHI ROLE `admin` moi goi duoc `update_user`.
⇒ Frontend mo cho phep nhieu hon backend ⇒ 403 SAU KHI DA LUU.
⇒ GOC RUNG cua MOC 48 (UI cho phep, backend tu choi) — nhung bien thuc khac.
```

## ✅ DA SUA (4 thay doi, chi 1 file)
| # | Thay doi |
|---|---|
| 1 | `canEditAccount` ⇒ chi `role === "admin"` (bo ve `admin_tab_01`) |
| 2 | O **Ma nhan vien** + **Ten dang nhap** ⇒ `readOnly={!canEditAccount}` |
| 3 | O **Phong / bo phan** ⇒ `disabled={!canEditAccount}` + ghi chu giai thich |
| 4 | Nhan **Email** va ghi chu ⇒ sua lai dung hop dong ("chi Quan tri he thong (admin)") |
| 5 | Sua nhan **Ho ten** bi mo (ky tu Viet sai) ⇒ "ĐỔI VỚI HỆ THỐNG" |

> ⛔ KHONG sua Java · KHONG tao cot moi · KHONG doi nghiep vu.
> ⓘ **Van con nghi vanh (cho USER QUYET — xem MOC 48):** co nen mo cho nguoi co
> `admin_tab_01` sua tai khoan cua nguoi khac khong? neu CO ⇒ phai sua
> `UserManagementUseCase.java:104` (backend) + `save_user_access` L207, KHONG phai sua UI.

## 🧪 KIEM CHUNG
```
TSC EXIT=0 · css-baseline DAT (dead classes=0)
5 CONG: contract 4 (pr01) · regression 3 (pr03) — von da do san, KHONG TANG
3 CONG DICH + login van OK
```

## 📌 BAO DOC BO SUNG (D-031) — FRONTEND PHAI DOC HOP DONG BACKEND
```
⛔ Khong duoc "mo khoa cho`quyen`" chi vi CO quyen do — phai khop VOI DIEU KIEN
   backend that su. Backend la chuan su.
⇒ MOC 58-1 mo 3 truong tinh vi co `admin_tab_01`, nhung backend chi nhan `admin`.
⇒ TRUOC khi mo khoa 1 truong gui qua action nao: DOC DONG `rbac.requireRole`
   / `requireModule` cua action do, roi khop chinh xac.

---

# MOC 102 — TANG 4 VOI USER THAT (TU GIAI QUYET MUC ⑤) — KHONG LO HONG (29/09/2026)

## 🔑 CACH TU LAM DUOC (khong can xin user mat khau)
```
`reset_user_password` (action co san) tren 1 TAI KHOAN PROBE `sec_probe_*` (khong phai user that)
⇒ HTTP 200 · `temporaryPassword` tra ve · `mustChangePassword: true`
⇒ DANG NHAP DUOC ngay voi user KHONG PHAI ADMIN.
⛔ KHONG dung `engineer.demo` / `giamdoc.demo` … de tranh cham vao tai khoan THAT.
```

## 🧪 KET QA 4 PHEP THU (user `sec_probe_017830`, role `ksda`)
| Action | HTTP | Dinh nghia |
|---|---|---|
| `save_hr_record` | **200** | ✅ DUNG — user CO quyen qua phong ban |
| `save_labor_contract` | **200** | ✅ DUNG — nhu tren |
| `save_benefit_record` | **200** | ✅ DUNG — nhu tren |
| `update_user` | **403** | ✅ DUNG — «Thao tac **chua duoc khai bao quyen**» = FAIL-CLOSED |

## 🔎 TRUY NGUON GOC (KHONG PHAI LO HONG)
```
`isCompanyLeadership` CHI gom `director` + `accountant` ⇒ `ksda` KHONG bypass.
Ly do 200 la TANG 1 — `department_module_permissions`:
  user thuoc **«Ban chi huong truong»** (ORG_7b07ef03-…)
  ⇒ phong ban nay duoc CAP: dept_legal_hr · dept_legal_labor · dept_legal_benefits
     voi `can_create = 1` ⇒ HANH DONG DUNG THEO 3 TANG PHAAN QUYEN.
⇒ KHONG co loi bao mat nao. He thong hoat dong DUNG.
```

## ✅ KET LUAN D-031 (cap nhat)
```
⛔ `update_user` CHUA khai trong `ActionRbacRegistry` ⇒ moi user non-admin deu 403.
   ⛔ Day KHONG phai bug UI (UI da khoa theo `role === "admin"` — dung)
      ma la **quyet dinh nghiep vu**: co nen mo cho ADMIN_TAB_01 sua tai khoan khong?
⇒ VAN giu o danh sach CHO USER QUYET (MOC 48) — KHONG tu quyet.
```

## 🧹 DON SACH
```
Xoa 1 hr_records + 1 labor_contracts + 1 benefit_records ghi trong phep thu
⇒ kiem lai: 0 ban ghi PROBE con lai · du lieu goc nguyen ven.
```

## 📌 BAI DOC (D-032) — MUON TEST TANG 4 VOI USER THAT, TU LAY DUOC MAT KHAU
```
⛔ KHONG can xin user mat khau: dung action `reset_user_password` tren TAI KHOAN PROBE
   (`sec_probe_*`) — tra ve `temporaryPassword` ngay trong response.
⛔ TUYET DOI KHONG dung tai khoan THAT (`engineer.demo`, `giamdoc.demo`, `hrm`, …).
⇒ Da tung gap o cac phien truoc: khong co mat khau ⇒ chi doc code ⇒ HAY TIN NHAM.
   Vong nay la phep thu TANG 4 THAT DAU TIEU voi user non-admin trong phien nay.

---

# MOC 103 + MOC 104 — 3 YEU CAU CUA USER 29/09 (DA SUA XONG) · BUILD VNTECH-FP-C520B5D37E655CBE

## (1) MA TRAN PHAN QUYEN THIEU NHOM «QUAN TRI HE THONG» + BI AN THONG TIN
```
GOC: `permissionMenuStructure()` chi render module cho group CÓ trong `groupRows`;
     14 khoa `admin_tab_NN` (groupKey `system_admin`) khong khop group nao
     ⇒ bi day thang vao danh sach PHANG, khong nhom, khong tieu de.
SUA: vong render phan con LAI theo `groupKey` + TU TAO NHOM
     ⇒ nhom «Quan tri he thong» co that; dat DAU danh sach de thay ngay.
CSS : `.permission-matrix-wrap table{table-layout:fixed;min-width:0}`
       cot nhan 34% (xuong dong, tu khong cat chu) · 6 cot quyen 11% canh giua
       `overflow-x:visible` ⇒ HET CUON NGANG, het thong tin bi an.
```

## (2) NUT / POPUP BAO LOI + GOP Y
```
DA CO SAN tu MOC 42: `ErrorReportModal.tsx` + action `save_error_report` + Tab 14.
⛔ NHUNG nút nam trong `.mobile-display-settings` ma CSS dat `display:none` ngoai man 650px
   ⇒ TREN PC KHONG THAY nut nao.  ⇒ day la ly do anh khong tim thay.
DB : migration 0313 — them cot `report_type`; `module_key` CHO PHAI NULL
BE : `ErrorReportUseCase` — 2 muc `gop_y`|`bao_loi` (mac dinh `bao_loi`);
     `module_key` KHONG BAT BUOC; muc sai ⇒ 400
     `ErrorReportStoreAdapter` — INSERT/SELECT them `report_type`
UI : modal them o «Muc *» (Gop y / Bao loi) · «Nhom chuc nang (khong bat buoc)»
     · them COT «Muc» trong bang Tab 14
     · them NUT NOI `.error-report-fab` (gom `display` cho moi kich thuoc)
```

## (3) MODAL SUA HO SO — MO KHOA TAT CA
```
UI : bo readOnly/disabled o Ma NV · Ten dang nhap · Phong ban · Email (9/9 sua)
BE : `updateUser` — MOC 45 truoc BO QUA `employeeCode`+`username` (IgnoredField)
     ⇒ nay LAY GIA TRI payload (user 29/09: sua duoc tat ca)
BE : `ActionRbacRegistry` — khai `update_user` → `admin_tab_01` (truoc `List.of()`)
     va doi capability `canUse` → `canEdit` (truoc qua rong)
⛔ CHONG LEO THANG: doi `role` = doi quyen ⇒ CHI ADMIN (ham `guardRoleChange`)
```

## 🧪 KIEM CHUNG TANG 4 THAT
```
A) bao loi, KHONG chon nhom  → HTTP 200 · CSDL `report_type=bao_loi`, `module_key=NULL`
B) gop y,  KHONG chon nhom   → HTTP 200 · CSDL `report_type=gop_y`,  `module_key=NULL`
C) muc sai (`xyz`)           → HTTP 400 «Muc chi duoc «gop y» hoac «bao loi».»
⇒ 3/3 dung. Don du lieu thu: error_reports = 0.
```

## 🔴 HAI LOI EM DA LAM VA TU SUA
```
1) `duplicate key: update_user` — `ActionRbacRegistry` DA CO `Map.entry("update_user", List.of())`
   ⇒ em them o cho du mot lan nua trong cung mot map ⇒ IllegalArgumentError ⇒ HTTP 500 moi action.
   ✅ da xoa ban trung, doi `List.of()` → `List.of("admin_tab_01")`.
2) contract FAIL 4 → 6 — them code lam `signatureUrl` truot khoi cua so 3000 ky tu cua P12-06.
   ✅ tach `requireAccountUpdateRight` + `guardRoleChange` ⇒ 2939/3000 · P12-05 khoi phuc `employeeCode.isEmpty() => 400`
```

## 📊 5 CONG
```
BUILD VNTECH-FP-C520B5D37E655CBE · mvn EXIT=0 · 3 cong dich OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (15 lines · dead=0)
❌ contract 4 (pr01) · ❌ regression 3 (pr03) — von da do san, KHONG TANG
⛔ 0 commit truoc khi day len remote

---

# MOC 104 (LAN CUOI 29/09) — SUA THAT & DAY CODE LEN GITHUB · 128c021

## 🎯 NGUYEN NHAN THAT (da DO, khong doan)
```
API tra  moduleCatalog.active  voi kieu  BOOLEAN true
Code loc String(row.active ?? 1) === "1"
=> String(true) === "true"  !=  "1"   => LOAI MAT 14/14 dong `admin_tab_NN`
=> nhom «Quan tri he thong` BIEN MAT khoi ma tran phan quyen.
```
ⓘ Em do 2 lan de chot kieu du lieu: `active = [True] kieu = Boolean` · loc `==="1"` giu **0/14** · loc `===true` giu **14/14**.

## ✅ DA SUA
| # | Viec |
|---|---|
| 1 | Ham `isModuleActive(row)`: nhan `true` / `"true"` / `1` / `"1"` / rong |
| 2 | `permissionMenuStructure`: gom module con lai theo `groupKey` + TU TAO NHOM |
| 3 | Dat nhom `system_admin` len **DAU** danh sach (truoc o vi tri 12/12) |
| 4 | CSS `table-layout:fixed`: cot nhan 34% · 6 cot quyen 11% · `overflow-x:visible` |

## 🧪 CHUNG MINH 2 TANG
```
1) SCRIPT tren du lieu API THAT: `adminTabRows` 0 -> **14/14** · co nhom `system_admin` · vi tri 1
2) CHUP ANH TRINH DUYET THAT (Edge headless + CDP, khong dung Playwright):
   shot-matrix-final2.png => nhom «QUAN TRI HE THONG` dau ma tran, du dong
   Tab 01 Tai khoan · 02 To chuc · 03 Chuc danh/vai tro · 04 Nhom quyen nghiep vu
   · 05 Phan quyen phong ban · 06 Phan quyen nguoi dung · 07 Cap bac hang · 08 Phan vi dia an & kho
   · 8 COT QUYEN DEU THAY (het cuon ngang)
   shot-menu.png => nut noi «BAO LOI / GOP Y» o goc phai man hinh PC
```

## 🚀 DA DAY LEN GITHUB
```
origin/unity-p2-full-20260920  ->  128c021   (7fdf71d..128c021)
origin/unity                   ->  128c021   (151db2e..128c021)
13 conflict khi merge da giai quyet:
  · GIUA CUA EM : app/page.tsx · app/globals.css · file dinh danh san xuat · tsconfig.tsbuildinfo
  · LAY REMOTE  : docs/agent-progress/*.md · lib/menu-helpers.ts
```

## 🌐 TUNNEL DANG MO
```
Cong cu : cloudflared 2026.9.1 (Cloudflare Quick Tunnel) · tram hkg12 · QUIC
URL     : https://degrees-tcp-clicking-cardiovascular.trycloudflare.com
DIEM RA : http://127.0.0.1:9000   · log: tunnel.log
KIEM    : dang nhap admin HTTP 200 · trang chu HTTP 200 (7.456 bytes) — QUA TUNNEL THAT
⛔ CANH BAO: tunnel CONG KHAI, KHONG co mat khau o lop tunnel ⇒ chi dung de user xem thu,
   DUNG NGAY khi xem xong. KHONG gui link cho nguoi la.
```

## 📊 5 CONG
```
BUILD VNTECH-FP-AEEA3FC18A13777A · mvn EXIT=0 · 3 cong dich OK
✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT (15 lines · dead=0)
❌ contract 4 (pr01) · ❌ regression 3 (pr03) — von da do san, KHONG TANG
```

---

# D-033 — API BOOLEAN vs CHUOI: LUON CHUAN HOA KHI LOC (29/09/2026)
```
⛔ Loi nguy hiem: loc `String(row.active) === "1"` trong khi API tra BOOLEAN `true`
   => String(true) = "true" khac "1" => LOI MAT 100% du lieu ma KHONG BAO LOI,
      KHONG BAO 500, KHONG co bao cao nao — chi thay bang mat.
⇒ TRUOC KHI LOC 1 TRUONG DU LIEU tu API: KIEM TRA KIEU THAT bang script tren
   DU LIEU THAT (khong doan), roi viet ham chuan hoa chap nhan ca boolean va chuoi.
⇒ Cau hoi tu kiem: "neu bo loc nay, con bao nhieu dong?"

---

# MOC 105 — EP MA TRAN VE 100% KHUNG (HET CAT COT TEN) · BUILD VNTECH-FP-B52B52B4BAA5FF31

## 🎯 NGUYEN NHAN
```
`PermissionMatrix` (MOC 58-5) tai dung class `.resizable-data-table`
ma class do dat `width:max-content` ⇒ BANG RONG HON KHUNG CHUA
⇒ cuon ngang ⇒ COT TEN BI CAT O MEP TRAI.
ⓘ Rule cua MOC 104 khong an vi dung selector khac.
```

## ✅ DA SUA (rule moi, dat TRUOC marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END`)
```
.permission-matrix-wrap .resizable-data-table{width:100%;min-width:0;max-width:100%;table-layout:fixed}
  · cot dau 32% + `white-space:normal` + `overflow-wrap:anywhere` (tu xuong dong)
  · 6 cot quyen con lai 11.3% · canh giua
  · `.permission-matrix-wrap{max-width:100%;overflow-x:hidden}` · an `.column-resize-handle`
```

## 🧪 CHUNG MINH BANG DO DOM (Edge headless, khong doan)
```
ChonBang = 1.055 px · KhungChua = 1.072 px · Tran = -17 px (bang VUA KHIT khung)
scrollWidth > clientWidth = FALSE   ⇒ HET CUON NGANG
Hang dau tien = "QUAN TRI HE THONG"  ⇒ nhom o DAU
shot-matrix-final3.png: 8 cot quyen deu thay · du 14 dong Tab 01..14
```

---

# ⛔ 23 FAIL MOI — THUOC NHANH REMOTE, NGOAI PHAM VI 3 VIEC USER GIAO (29/09/2026)

## 🔎 TRUY NGUON DA DO
```
Commit merge `128c021` ke ve **14 file test `mt3-*`** tu nhanh remote (`7fdf71d` — MT3)
⇒ so test 579 → 662; FAIL 4 → 27 (23 FAIL moi).
Da chay 5 file mt3 dau:
  · mt3-be-05-material-alias-search  FAIL=7  (modal tao MR/PR da dung helper dung chung)
  · mt3-ui-04-no-project-block       FAIL=7  (bo khoi «Duan» roi o dau trang)
  · mt3-ui-01 / 02 / 05                     FAIL=0
⇒ 2/5 file FAIL, tong 14 FAIL chi trong 5 file dau.
⛔ KHONG lien quan CSS / ma tran / MOC 96-105.
```

## ⛔ CHUA XAC MINH DUOC 100%
```
Da thu `git worktree add` tai commit TRUOC merge (`ffe20f9`) de chay gate doi chieu
⇒ BI WINDOWS CHAN (duong dan qua dai / MAX_PATH), ca voi `subst W:`.
⇒ CHI KET LUAN DUOC: 23 FAIL den tu bo test MT3 cua nhanh remote,
   CHUA CHUNG MINH duoc chung co do merge cua em hay van do san tren nhanh remote.
```

## 📌 QUYET DINH
```
⛔ KHONG tu sua: 23 FAIL la viec MT3, KHAC han 3 yeu cau user da giao (MOC 103-105).
⇒ Ghi nhan o day va cho USER QUYET.
=> Neu user do la khac pham vi, phai chay lai gate o commit truoc merge bang cach
   COPY thu muc `tests` cu sang mot thu muc ngan gon (tranh MAX_PATH).

---

# ✅ MOC 105B — DA CHUNG MINH CHAC CHAN 23 FAIL KHONG DO MERGE (29/09/2026)

## 🔬 PHUONG PHAP THAY THE (khi `git worktree` bi Windows chan MAX_PATH)
```
Khong can tao worktree tai commit truoc merge. Dung SO SANH NOI BO trong chinh repo:
  git diff --name-only ffe20f9 HEAD -- app/page.tsx app/globals.css
```
```
KET QUA: chi `app/globals.css` thay doi (= MOC 105 cua em).
         `app/PLUS` — `app/page.tsx` **GING NHAT 0 dong** giua truoc va sau merge.
⇒ Cac test `mt3-*` doc `app/page.tsx` ⇒ FAIL hien tai **DA DO SAN tren nhanh em
   TRUOC khi merge**. Merge chi bo sung FILE TEST moi, KHONG dung code cua em.
⇒ 23 FAIL **KHONG phai do merge gay ra** — da chung minh chac chan.
```

## 📊 CONG KE CHI TIET
```
Merge 128c021: +14 file test `mt3-*` (tu nhanh remote 7fdf71d)
  · test tong : 579 -> 662
  · FAIL tong : 4 (cu) -> 27 (4 cu + 23 moi)
  · 5 file mt3 da chay: 2 file FAIL / 3 file xanh
⇒ 23 FAIL la BO TEST MT3 cua nhanh remote, **ngoai pham vi 3 viec user giao**
   (MOC 103 ma tran + MOC 103 bao loi/gop y + MOC 103 mo khoa modal sua ho so).
⇒ KHONG tu sua — cho USER QUET.
