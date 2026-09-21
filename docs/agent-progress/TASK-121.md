# TASK-121 — `P-07`: tách **Nhà cung cấp** và **Đối tác** thành 2 mục menu

- **Ngày**: 20/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Trạng thái**: KHUNG XONG ở tầng **khai báo menu code** — **CHƯA NỐI VÀO `app/page.tsx`** (xem mục 4 + mục 8)
- **Phạm vi đã sửa**: `lib/menu-helpers.ts` · `tests/p07-supplier-partner-split.test.mjs` (mới) · tệp hồ sơ này
- **Commit**: `8b55cf4`

## 1. Yêu cầu (nguyên văn)

`P-07` — tách mục menu **Nhà cung cấp** và **Đối tác** thành **2 mục riêng** (trước đây là 1 mục gộp).

## 2. Đã sửa gì (`lib/menu-helpers.ts` — CHỈ tệp này)

| # | Trước | Sau |
|---|---|---|
| 1 | dòng 42 (bảng `modules`): `{ key: "dept_plan_suppliers", label: "Nhà cung cấp / Đối tác", … }` | `{ key: "dept_plan_suppliers", label: "Nhà cung cấp", … }` (giữ nguyên khoá cũ ⇒ tương thích ngược) |
| 2 | *(không có)* | khối mới `supplierPartnerMenuItems` — **ĐÚNG 2 mục** (khuôn `workMenuItems` của `T-01` / `warehouseMenuItems` của `W-01`) |
| 3 | *(không có)* | `legacySupplierPartnerMenuKeys = ["dept_plan_suppliers"]` — ẩn dòng `modules` cũ khỏi cây menu (khoá vẫn SỐNG: quyền · tiêu đề màn · tìm kiếm · nhánh render `SupplierManager`) |
| 4 | *(không có)* | `supplierPartnerViewFor(view, active)` — bộ định tuyến `view` cho 2 mục (khuôn `warehouseMenuViewFor`) |
| 5 | *(không có)* | export `supplierPartnerMenuItems` · `legacySupplierPartnerMenuKeys` · `supplierPartnerViewFor` · type `SupplierPartnerMenuView` |

Không đụng bất kỳ khối nào khác (`modules` chỉ đổi ĐÚNG 1 nhãn; `workMenuItems` · `warehouseMenuItems` · `approvalCenter*` giữ nguyên byte-for-byte — có test đối chiếu bản gốc).

## 3. Hai mục menu mới

| key (tầng MENU CODE) | label | nhóm | `view` | `permissionKeys` (cổng quyền) |
|---|---|---|---|---|
| `dept_plan_suppliers` *(khoá CŨ)* | **Nhà cung cấp** | `purchasing` | `supplier` | `["dept_plan_suppliers"]` — khoá **ĐÃ CÓ** |
| `dept_plan_partners` *(khoá MỚI, tầng menu code)* | **Đối tác** | `purchasing` | `partner` | `["dept_plan_suppliers"]` — **dùng lại khoá cũ** |

- `dept_plan_partners` **KHÔNG** được thêm vào `ModuleKey` (`lib/ui-shared.tsx`) và **KHÔNG** được thêm vào bảng `modules` ⇒ **KHÔNG** có khoá module mới.
- Cả 2 mục dùng CHUNG cổng quyền `modulePermission(data, "dept_plan_suppliers").canView` — đúng chỉ dẫn «nếu hệ thống bắt buộc có khoá module để `canView` ⇒ trỏ cùng `permissionKeys` của khoá cũ». KHÔNG hardcode admin.

## 4. CÓ phải sửa `app/page.tsx` không? — **CÓ, và NHIỀU HƠN 1–2 DÒNG** (nên tôi DỪNG, chưa sửa)

Ràng buộc của lượt này chỉ cho phép **1–2 dòng truyền prop** trong `app/page.tsx`, nhưng thực tế cần **nối menu theo đúng khuôn `W-01`** (8 điểm chạm, đều là dòng đã đọc — **KHÔNG đọc cả tệp**):

| Điểm chạm | Việc phải làm |
|---|---|
| `app/page.tsx:73` | thêm `supplierPartnerMenuItems, legacySupplierPartnerMenuKeys, supplierPartnerViewFor` + type `SupplierPartnerMenuView` vào import |
| sau `:406` | thêm `const [supplierPartnerView, setSupplierPartnerView] = useState<SupplierPartnerMenuView \| null>(null);` + `const supplierPartnerMenuChildren = supplierPartnerMenuItems.flatMap((item) => { const viewable = item.permissionKeys.find((key) => modulePermission(data, key).canView); if (permissionConfigured && !viewable) return []; return [{ key: item.key, label: item.label, view: item.view, moduleKey: viewable ?? item.permissionKeys[0], badgeKeys: item.permissionKeys }]; });` (đúng 5 dòng như `warehouseMenuChildren`) |
| `:436`–`:440` | `activateModule(next, view: WorkMenuView \| WarehouseMenuView \| SupplierPartnerMenuView \| null)` + `setSupplierPartnerView(view === "supplier" \|\| view === "partner" ? view : null);` |
| `:471` | `const supplierPartnerView2 = supplierPartnerViewFor(supplierPartnerView, active);` |
| `:477` | lọc thêm `&& !legacySupplierPartnerMenuKeys.includes(item.key)` |
| `:480` | giữ nhóm sống: `\|\| (String(group.groupKey) === "purchasing" && supplierPartnerMenuChildren.length > 0)` |
| `:495` | cộng huy hiệu: `+ (groupKey === "purchasing" ? supplierPartnerMenuChildren.reduce((sum, item) => sum + supplierPartnerMenuBadge(item.badgeKeys), 0) : 0)` |
| `:503` (desktop) + `:518` (mobile) | vẽ 2 mục y hệt cách `warehouseMenuChildren` đang vẽ (kèm `badgeKeys` + `view`) |

**Thêm nữa — màn đích KHÔNG nhận tham số lọc:**

`app/screens/SupplierManager.tsx:16` hiện chỉ có:

```ts
function SupplierManager({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
```

⇒ màn **chỉ có nghiệp vụ NHÀ CUNG CẤP** (form + danh sách NCC), **không có** khái niệm «Đối tác» và **không nhận** `view`. Muốn `view="partner"` có tác dụng thì phải sửa `app/screens/SupplierManager.tsx` (thêm prop `view` + nhánh lọc/tiêu đề) — **`app/screens/**` nằm NGOÀI phạm vi được phép** ⇒ tôi DỪNG và báo cáo, không mở rộng.

## 5. Phát hiện quan trọng (UNKNOWN cần captain quyết)

`drizzle/0031_department_task_engine.sql:110` đã seed **nhãn DB** cho khoá cũ:

```sql
('dept_plan_suppliers','Nhà cung cấp / Đối tác','NC','QUẢN LÝ PHÒNG BAN','department_management',1,29,…)
```

`configuredModules()` lấy `config?.label || item.label` ⇒ **nhãn DB ĐÈ nhãn code** cho dòng `modules`. Hệ quả:

1. Đổi nhãn ở `modules` (mục 2, dòng 1 của bảng) **KHÔNG đủ** để thấy chữ «Nhà cung cấp» trên menu hiện tại — phải vẽ 2 mục từ **khai báo code** (`supplierPartnerMenuItems`, nhãn KHÔNG đi qua DB) như `T-01`/`W-01` đã làm. Đây chính là lý do thiết kế ở mục 3 là ĐÚNG hướng.
2. Tiêu đề màn `dept_plan_suppliers` (`moduleMeta.label`) vẫn đọc nhãn DB «Nhà cung cấp / Đối tác» cho tới khi cập nhật `module_catalog` — việc đó cần `UPDATE`/`drizzle` = **BỊ CẤM** ở lượt này.

## 6. Test ĐỎ → XANH

`tests/p07-supplier-partner-split.test.mjs` (mới, **CỐ Ý không** nằm trong `package.json` ⇒ `test:regression` giữ nguyên 69 ca). 7 ca: ① đúng 2 mục · nhãn gộp biến mất · ② mọi khai báo menu KHÁC không đổi (đối chiếu bản gốc `a11fe9e:lib/menu-helpers.ts`) · ③ không khoá module mới, cổng quyền dùng khoá cũ · ẩn mục cũ + định tuyến `view` · `drizzle/**` không nhắc khoá mới.

```
# ĐỎ (trước khi sửa lib/menu-helpers.ts)
ℹ tests 7 · ℹ pass 1 · ℹ fail 6      (6 ca menu hỏng: "Không tìm thấy khối khai báo `supplierPartnerMenuItems`"…)

# XANH (sau khi sửa)
✔ 7 ca ĐẠT · ℹ tests 7 · ℹ pass 7 · ℹ fail 0
```

*Ghi chú trung thực:* lần chạy GIỮA có **2 ca hỏng do LỖI PHÍA TEST** — hàm cắt khối dừng ở `];` ĐẦU TIÊN, mà kiểu khai báo có `permissionKeys: ModuleKey[];` ⇒ cắt cụt khối. Đã sửa test (cắt theo `\n];`) rồi chạy lại; bảng trên là **lần chạy SẠCH** (không còn hỏng vì test).

## 7. Bốn cổng (đã chạy, dán nguyên kết quả)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx tsc --noEmit` | **EXIT=0** (0 lỗi) |
| Hồi quy | `npm run test:regression` | **ℹ tests 69 · ℹ pass 69 · ℹ fail 0** |
| Test mới | `node --test tests/p07-supplier-partner-split.test.mjs` | **pass 7 · fail 0** |
| Probe `T-01` | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** (`EXIT=0`) |

## 8. BLOCKED / UNKNOWN + câu hỏi cho captain

- **BLOCKED (một phần)**: `P-07` chỉ HIỆN ra 2 mục menu sau khi nối 8 điểm chạm ở `app/page.tsx` (mục 4) — nằm ngoài ràng buộc «1–2 dòng» của lượt này.
- **UNKNOWN 1**: cho phép mở rộng sang `app/page.tsx` (~8 dòng, khuôn `W-01`) ở lượt kế không?
- **UNKNOWN 2**: «Đối tác» là loại dữ liệu riêng (cần trường `type`/bảng đối tác + form riêng, phải sửa `app/screens/SupplierManager.tsx`) hay **chỉ là mục menu thứ 2 mở cùng màn** NCC như hiện tại?
- **UNKNOWN 3**: có cập nhật nhãn `module_catalog` của `dept_plan_suppliers` («Nhà cung cấp / Đối tác» → «Nhà cung cấp») không? Việc này cần `UPDATE`/`drizzle` — **tôi bị cấm**, phải do captain hoặc lượt được cấp phép riêng thực hiện.

## 9. Kiểm chứng «không phá gì»

- `git diff --name-only` không có `drizzle/` · `app/` · `scripts/` (test tự kiểm).
- `tests/p2-25-*.test.mjs` + `tests/q1-*.mjs` giữ nguyên **untracked** (không `git add -A`).
- Không `INSERT/UPDATE/DELETE/ALTER/DROP` · không build · không start/stop dịch vụ.
