# TASK-227 — DANH MỤC VẬT TƯ: bỏ trồng tréo tab 0 · đổi tên tab nhóm · THÊM tab «Danh mục hệ vật tư» · BỎ tab «Mã vật tư gốc»

| | |
|---|---|
| **SESSION_ID** | **ERP-SESSION-02** |
| **Ngày** | 06/10/2026 |
| **Nhánh** | `unity` |
| **Trạng thái** | ✅ **DONE — VERIFIED** |
| **Owner** | ERP-SESSION-02 |
| **Ánh xạ 110 mục** | ⛔ **NGOÀI 110 mục** — đây là **yêu cầu trực tiếp của user**, ⛔ không thuộc MASTER TASK 1/2/3 |
| **Tiền nhiệm** | TASK-226 (hub «Kho vật tư») — cùng phiên |

---

## §1 · YÊU CẦU NGUYÊN VĂN CỦA USER (06/10/2026)

> «Danh mục vật tư, trong hub này có 3 tab là danh sách vật tư, danh mục nhóm con vật tư gốc, mã vật tư gốc.
> Hiện tại tab danh sách vật tư đang bị trồng tréo nhiều thông tin quá, hãy loại bỏ bớt đi, trong tab này
> chỉ có danh sách vật tư và nhóm nút crud search sort fillter thôi. Tab Danh mục nhóm con mã vật tư gốc
> đổi tên thành Danh mục nhóm vật tư, trong tab này sẽ hiển thị ra danh sách nhóm vật tư và nhóm nút crud
> search sort fillter. bỏ tab Mã vật tư gốc đi. Thêm 1 tab là Danh mục hệ vật tư, trong tab này sẽ hiển thị
> ra danh sách hệ vật tư và nhóm nút crud search sort fillter.»

**Kèm ảnh chụp màn hình** chỉ rõ phần trồng tréo = khối **«CÔNG CỤ CHẨN LOẠN — §12.3»** gồm 2 khối con
*SO SÁNH / ĐỐI CHIẾU BOQ* + *SOÁT TRÙNG ALIAS & CHẤT LƯỢNG DANH MỤC* hiện đè lên tab «Danh sách vật tư».

## §2 · 4 VIỆC PHẢI LÀM

| # | Việc | Trạng thái |
|---|---|---|
| ① | Tab «Danh sách vật tư» — **bỏ thông tin trồng tréo**, chỉ còn danh sách + nút CRUD/Search/Sort/Filter | ✅ |
| ② | Đổi tên «Danh mục nhóm con mã vật tư gốc» → **«Danh mục nhóm vật tư»** | ✅ |
| ③ | **THÊM tab «Danh mục hệ vật tư»** (danh sách hệ + CRUD/S/S/F) | ✅ |
| ④ | **BỎ tab «Mã vật tư gốc»** | ✅ |

## §3 · ĐÃ LÀM (mã nguồn)

- **`app/screens/MaterialCategoryList.tsx`** (**MỚI**, 116 dòng) — màn «Danh mục hệ vật tư», tái dùng **đúng khuôn**
  `MaterialListTable` (Phase 1 `U-11`): `DataTable` + `PermissionGuard` + `StatusBadge` + `CardHead` + `downloadCsv`.
- **`app/page.tsx`** — `MATERIAL_TABS` còn **3 phần tử mới**; **xoá 8 dòng** khối «CÔNG CỤ CHẨN LOẠN»;
  đổi `<summary>` tab 1; thay tab 2 bằng `<MaterialCategoryList …>`; dọn 3 dòng biến thừa
  (`materials` · `aliasReport` · `runAliasCheck`).
- **`app/styles/canonical.css`** — ⛔ **HOÀN NGUYÊN** (đã thử `!important` để mở `<details>` ⇒ **không hiệu quả** trong Blink).

### Nguồn dữ liệu — ĐO THẬT, ⛔ không bịa
`scripts/system-route.mjs:674` + `:784`:
```
SELECT id, code, name, description, sort_order AS sortOrder, active FROM material_categories
```
Nhánh `canEditCentral` quyết định `adminMaterialCategories` (bản đầy đủ) vs `materialCategories` (chỉ `active=1`).

### API — DÙNG LẠI, ⛔ không tạo mới
| Action | Dòng | Quyền |
|---|---|---|
| `save_material_category` | `system-route.mjs:2693` | `requireRole(user,["admin"])` |
| `set_material_category_status` | `:2718` | `requireRole(user,["admin"])` |
| `delete_material_category` | `:2725` | `requireRole(user,["admin"])` |

Modal biểu mẫu: **`CategoryModal`** (đã có sẵn, `modal === "categoryMaster"`).

## §4 · ⭐ BUG CÓ SẴN PHÁT HIỆN THÊM — `BUG-20261006-012`

**Tab 1 và tab 2 TRƯỚC ĐÂY CHƯA BAO GIỜ HIỆN NỘI DUNG** — chỉ thấy khung trắng.

**Nguyên nhân gốc**: `<details>` **thiếu thuộc tính `open`** ⇒ trạng thái `closed`. CSS `canonical.css:557-559`
chỉ đặt `display:block` cho **chính thẻ `<details>`**, ⛔ **không** mở được nội dung bên trong.

**Bằng chứng đo thật trên `:9000`** (`getBoundingClientRect`):
```
TRƯỚC:  tab 0 (CÓ open)   → details h = 947px  ✅ hiện (tbody 237 dòng)
        tab 1 (THIẾU open) → details h =   0px  ⛔ TRẮNG
        tab 2 (THIẾU open) → details h =   0px  ⛔ TRẮNG (dù tbody có 17 dòng!)
SAU  :  cả 3 tab → 947px ✅
```
**Sửa**: thêm ` open` vào **thẻ mở** `<details>` của tab 1 và tab 2 (tab 0 đã có sẵn = bằng chứng cách sửa đúng).

⚠️ **BẪY ĐÃ GẶP**: regex `/\bopen\b/` khớp **NHẦM** prop `open={open}` truyền cho component con ⇒ lần sửa đầu
**báo sai là «đã có open»**. Cách đúng: chỉ xét phần **THẺ MỞ** `line.slice(0, line.indexOf(">")+1)`.

## §5 · RBAC / NGHIỆP VỤ

- Màn hệ vật tư: **Thêm/Sửa** theo `permission.canEdit`; **Ẩn/Hiện + Xóa** chỉ `isAdminUser`.
- ⭐ **UI phản ánh ĐÚNG chặn nghiệp vụ của server** (`system-route.mjs:2728-2730`): hệ **còn vật tư ⇒ nút Xóa DISABLE**
  + `title` giải thích lý do. Đo thật: `Điện 9 · HVAC 4 · Thép 30` → **disabled**; `E2E-MALFORM-CODE 0` → **enabled**.

## §6 · KIỂM THỬ

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **EXIT 0** |
| `npm run test:regression` | **803 test · 802 pass · 0 fail · 1 skip** |
| E2E thật `:9000` | `TEST-20261006-017/018/019` — **PASS** |
| Build | **EXIT 0** · **BUILT ARTIFACT VALIDATION ĐẠT** · vân tay `VNTECH-FP-B7D4A52E0EFD921C` (718 tệp) |

**Bằng chứng ảnh**: `docs/dsh-mutil-session/SESSION_B/anh-chung-task-227/` (3 ảnh tab 0/1/2).
Xác minh sau sửa: `conCongCuChanLoan=false` · `conDoiChieuBOQ=false` · `conSoatTrungAlias=false` · tabbar đúng 3 tên.

## §7 · CÒN LẠI

- ⛔ **Không còn phần mã.** ✅ task đã **VERIFIED**.
- ⚠️ 2 công cụ «So sánh BOQ» + «Soát trùng alias» được **giữ mã** ở bước này — **user đã quyết bỏ hẳn** ở **TASK-229**.

## §8 · TRUY VẾT

`CHG-20261006-001` · `DEV-20261006-004` · `TEST-20261006-017/018/019` · `EVT-20261006-023/024/025` ·
`BUG-20261006-012` (HIGH, FIXED) · `BUG-20261006-011` (HIGH, FIXED — server cache HTML ⇒ 404 bundle)
