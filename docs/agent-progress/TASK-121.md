# TASK-121 — `P-07`: tách **Nhà cung cấp** và **Đối tác** thành 2 mục menu (ĐÃ NỐI XONG)

- **Ngày**: 20/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Trạng thái**: **DONE** — 2 mục menu «Nhà cung cấp» + «Đối tác» đã được khai báo, **nối vào cây menu thật** (desktop + mobile), bấm vào mở **`SupplierManager`** kèm `view`; nhãn `module_catalog` đã cập nhật trong MySQL.
- **Tệp đã sửa**: `lib/menu-helpers.ts` · `app/page.tsx` · `app/screens/SupplierManager.tsx` · `tests/p07-supplier-partner-split.test.mjs` (mới) · `tests/p07-supplier-partner-split-probe.mjs` (mới) · `docs/25_TODO_ROADMAP.md` (ô `P-07`) · tệp hồ sơ này.
- **Commit**: `8b55cf4` (menu code + test) · `7ac5dc2` (nối `app/page.tsx` + prop `view`) · `886452b` (hồ sơ lượt trước).

## 1. Kết quả cuối (cái người dùng thấy)

| # | Mục menu (nhóm «MUA HÀNG & CUNG ỨNG») | Khoá tầng menu code | Nhãn | Cổng quyền | Mở màn |
|---|---|---|---|---|---|
| 1 | **Nhà cung cấp** | `dept_plan_suppliers` *(khoá CŨ)* | `Nhà cung cấp` | `modulePermission(data,"dept_plan_suppliers").canView` | `SupplierManager` + `view="supplier"` |
| 2 | **Đối tác** | `dept_plan_partners` *(khoá MỚI — tầng menu code)* | `Đối tác` | *(dùng chung khoá cũ)* | `SupplierManager` + `view="partner"` |

- `dept_plan_partners` **KHÔNG** là khoá module: không thêm `ModuleKey`, không thêm bảng `modules`, **không thêm dòng `module_catalog`**, không migration.
- Mục gộp cũ (`modules` dòng 42, nhãn «Nhà cung cấp / Đối tác») bị **ẩn khỏi cây menu** bằng `legacySupplierPartnerMenuKeys` (đúng khuôn `T-01`/`W-01`); khoá vẫn SỐNG cho quyền · tiêu đề · tìm kiếm · nhánh render.

## 2. Phát hiện quan trọng #1 — mục gộp cũ **KHÔNG** mở `SupplierManager`

Đo trên nguồn (không suy đoán): trước `P-07`, `dept_plan_suppliers` rơi vào nhánh CHUNG
`{workCenterView === null && active.startsWith("dept_plan_") && active !== "dept_plan_tasks" && <DepartmentTaskWorkspace … department="KH" …/>}`
⇒ nó mở **bảng nhiệm vụ phòng Kế hoạch**, còn `SupplierManager` chỉ được render bởi `active === "supplier_catalog"`.

⇒ `P-07` đã thêm **nhánh render riêng** `active === "dept_plan_suppliers" && <SupplierManager … view={supplierPartnerScreenView} />` và **loại `dept_plan_suppliers` khỏi nhánh chung `dept_plan_*`** (nếu không sẽ render 2 màn cùng lúc).

**Vì sao KHÔNG trỏ 2 mục sang khoá `supplier_catalog`:** màn được tính `accessDenied` theo `active`
(`app/page.tsx`: `permissionConfigured && !activePermission.canView`) ⇒ trỏ sang khoá KHÁC sẽ khiến người có quyền
`dept_plan_suppliers` nhưng không có quyền `supplier_catalog` **bị chặn quyền oan**. Nay **đích đến = cổng quyền = khoá cũ** ⇒ nhất quán.

## 3. Phát hiện quan trọng #2 — nhãn DB ĐÈ nhãn code (đã xử lý)

`drizzle/0031_department_task_engine.sql:110` seed nhãn DB `'dept_plan_suppliers','Nhà cung cấp / Đối tác'` và
`configuredModules()` dùng `config?.label || item.label` ⇒ nhãn DB đè nhãn code cho dòng `modules`.
Vì vậy 2 mục mới lấy nhãn từ **khai báo code** (`supplierPartnerMenuItems` — không đi qua DB), và **nhãn DB đã được cập nhật** (mục 4).

### 4. SQL đã chạy trên MySQL (`vntech_erp`) — chỉ cột `label`

```sql
-- TRƯỚC
SELECT module_key, label, HEX(label) FROM module_catalog WHERE module_key='dept_plan_suppliers';
-- dept_plan_suppliers | Nhà cung cấp / Đối tác | 4E68C3A02063756E672063E1BAA570202F20C490E1BB91692074C3A163

-- CÂU ĐÃ CHẠY (giá trị gõ bằng HEX UTF-8 ⇒ không lệ thuộc mã hoá console)
UPDATE module_catalog SET label=_utf8mb4 X'4E68C3A02063756E672063E1BAA570'
WHERE module_key='dept_plan_suppliers';
-- ROW_COUNT() = 1

-- SAU
SELECT module_key, label, HEX(label), group_key, sort_order, active FROM module_catalog WHERE module_key='dept_plan_suppliers';
-- dept_plan_suppliers | Nhà cung cấp | 4E68C3A02063756E672063E1BAA570 | purchasing | 110 | 1
```

- Nhãn **TRƯỚC** `Nhà cung cấp / Đối tác` → **SAU** `Nhà cung cấp` (HEX `4E68C3A02063756E672063E1BAA570`).
- **KHÔNG** xoá dòng nào · **KHÔNG** đổi khoá · **KHÔNG** đổi cột khác (`group_key`/`sort_order`/`active` giữ nguyên).
- Tổng số dòng `module_catalog` **61 → 61** (không thêm/xoá); số dòng cho khoá mới `dept_plan_partners` = **0** ✔ (nhãn «Đối tác» lấy từ CODE).
- **KHÔNG** sửa tệp `drizzle/**` (đúng ràng buộc) — có test tự kiểm.

## 5. Bằng chứng **2 mục menu XUẤT HIỆN** (probe dựng lại ĐÚNG cây menu bằng hàm thật)

`node --import tsx tests/p07-supplier-partner-split-probe.mjs` → **15 ĐẠT · 0 HỎNG**, in ra nguyên văn:

```
1) CÂY MENU RENDER — nhóm «MUA HÀNG» (khoá `purchasing`):
   MUA HÀNG & CUNG ỨNG → mục vẽ ra: "Nhà cung cấp" · "Đối tác"
  ✔ nhóm «MUA HÀNG» TỒN TẠI trong cây menu
  ✔ dòng `modules` cũ của khoá `dept_plan_suppliers` đã bị ẨN khỏi `children`
  ✔ vẽ ra ĐÚNG 2 MỤC, đúng thứ tự: ["Nhà cung cấp","Đối tác"]
  ✔ mỗi nhãn xuất hiện ĐÚNG 1 LẦN trong cây menu (không nhân đôi)
2) … ✔ 2 mục vẫn ĐÚNG nhãn dù DB CŨ ⇒ nhãn lấy từ CODE
3) "Nhà cung cấp" → active=dept_plan_suppliers · view=supplier · nhánh render có thật: true
   "Đối tác"      → active=dept_plan_suppliers · view=partner  · nhánh render có thật: true
4) ĐỐI CHỨNG ÂM — tài khoản KHÔNG có quyền `dept_plan_suppliers` ⇒ 0 mục vẽ ra
═══ KẾT QUẢ: 15 ĐẠT · 0 HỎNG ═══
```

⚠️ **GIỚI HẠN ĐÃ ĐO (không che)**: bundle ĐANG phục vụ ở `127.0.0.1:9000` là bản build **TRƯỚC** `P-07`
(lượt này **BỊ CẤM build**) ⇒ **DOM sidebar của bundle đang chạy vẫn là menu CŨ**. Bằng chứng trên là ở tầng
NGUỒN + mô phỏng bằng chính hàm thật; muốn thấy trên DOM phải build lại (chờ lệnh captain).

## 6. `view` làm gì ở màn đích (`app/screens/SupplierManager.tsx`)

`SupplierManager({data, action, view})` — `view="partner"` chỉ **đổi tiêu đề** (`Đối tác`) và hiện cảnh báo
**«CHƯA CÓ NGUỒN DỮ LIỆU ĐỐI TÁC RIÊNG: hệ thống hiện chỉ có danh mục nhà cung cấp (bảng `suppliers`). Danh sách
dưới đây là NHÀ CUNG CẤP — không phải đối tác.»** ⇒ **KHÔNG bịa dữ liệu**, **KHÔNG** thêm cột/bảng «đối tác».
(Việc «đối tác có phải loại dữ liệu riêng không» là **quyết định nghiệp vụ của người dùng** — captain hỏi.)

## 7. Test ĐỎ → XANH · 9/9

`tests/p07-supplier-partner-split.test.mjs` (mới, **cố ý KHÔNG** vào `package.json` ⇒ `test:regression` giữ 69 ca):
① đúng 2 mục · nhãn gộp biến mất · khoá mới không phải khoá module · cổng quyền dùng khoá cũ ·
ẩn mục cũ + định tuyến `view` · **nối đủ 8 điểm chạm ở `app/page.tsx`** · màn đích + `SupplierManager` nhận `view` ·
② mọi khai báo menu KHÁC không đổi (đối chiếu bản gốc `a11fe9e`) · ③ `drizzle/**` không nhắc khoá mới.

```
ĐỎ (trước khi sửa nguồn):      ℹ tests 7 · pass 1 · fail 6
XANH (sau khi nối xong):       ℹ tests 9 · pass 9 · fail 0
```

*Ghi chú trung thực:* lần chạy giữa có 2 ca hỏng do **LỖI PHÍA TEST** (cắt khối dừng ở `];` đầu tiên, trúng
`permissionKeys: ModuleKey[];`) và 1 ca hỏng do **LỖI PHÍA PROBE** (so `modules` cho cả 2 mục — mà mục #1 CỐ Ý
giữ khoá cũ) — đã sửa test/probe; các con số trên là **lần chạy SẠCH**.

## 8. Cổng (đã chạy trên trạng thái hiện tại)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **EXIT=0** |
| `npm run lint` | **0 error** (187 warning có sẵn trong `tools/**`) |
| `npm run test:regression` | **ℹ tests 69 · pass 69 · fail 0** |
| `npm run test:workflow` | **passed** (W2 full) |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** |
| `node --test tests/p07-supplier-partner-split.test.mjs` | **pass 9 · fail 0** |
| `node --import tsx tests/p07-supplier-partner-split-probe.mjs` | **15 ĐẠT · 0 HỎNG** |
| `node tools/probe-project-screen.mjs` | **ĐẠT ✅** |
| `node tools/probe-p2-ui-dom.mjs` | **ĐẠT ✅ 5/5 dấu DOM** (bundle đang phục vụ = bản CŨ, UI không vỡ) |
| `node tools/probe-roadmap-progress.mjs` | **TRƯỚC = SAU**: DONE **107/110 (97,3 %)** · BLOCKED 2 · TODO 1 — ô `P-07` đã là `**DONE**`, **giữ nguyên** |

## 9. UNKNOWN còn lại (không tự quyết)

1. **«Đối tác» có phải loại dữ liệu riêng?** Hiện chỉ là **mục menu thứ 2** mở cùng màn NCC + cảnh báo «chưa có nguồn».
   Nếu người dùng muốn dữ liệu đối tác thật (bảng/cột `partner_type`, form riêng) ⇒ task mới, cần schema + migration (ngoài phạm vi `P-07`).
2. **Nhãn màn `supplier_catalog` vẫn là «Danh mục Nhà cung cấp»** ⇒ nhóm MUA HÀNG nay có 3 lối vào liên quan NCC
   («Nhà cung cấp» · «Đối tác» · «Danh mục Nhà cung cấp»). Có gộp/bỏ mục nào không ⇒ quyết định của người dùng.
3. **`docs/25` ô `P-07`** giữ `**DONE**` (đúng chỉ đạo) — chỉ bổ sung ghi chú bằng chứng ở cột «Việc».
