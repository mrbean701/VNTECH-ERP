# TASK-226 — HUB «KHO VẬT TƯ» (3 tab) + dashboard tồn kho + cards kho + màn chi tiết kho

| | |
|---|---|
| **SESSION_ID** | **ERP-SESSION-02** |
| **Ngày** | 06/10/2026 |
| **Nhánh** | `unity` · HEAD `b5ca4cc` |
| **Trạng thái** | 🔄 **IN PROGRESS** (chưa xong — xem §7) |
| **Owner** | ERP-SESSION-02 (đã đăng ký `docs/dsh-state/SESSION_REGISTRY.md`) |
| **Yêu cầu** | user (nguyên văn, 06/10/2026) — xem §1 |

---

## §1 · YÊU CẦU NGUYÊN VĂN CỦA USER

Trong **MENU KHO VẬT TƯ**, khi click vào menu thì **hiển thị luôn màn dashboard tồn kho**; ngay trên đầu hiển thị
**tabbar các tab: KHO · XUẤT & NHẬP · CẤP PHÁT & HOÀN TRẢ**.

1. **Tab KHO** — hiển thị **card/section tất cả các kho**. Kho **DỰ ÁN** chỉ hiển thị với **user được thêm vào dự án đó**.
   Ngoại lệ (**BAN GIÁM ĐỐC · ADMIN · IT**) cần **đề xuất để user quyết định**.
   Card hiển thị: **Tên kho · Mã kho · Dự án (nếu là kho dự án) · Tồn kho hiện tại**.
   Click card ⇒ **màn thông tin chi tiết của kho** (có **nút quay lại** màn KHO), gồm các tab:
   *dashboard của kho đó · tồn kho · xuất - nhập · cấp phát - hoàn trả · nhân sự* (user liên quan đến kho).
2. **Tab XUẤT & NHẬP** — danh sách đơn XUẤT/NHẬP; click tab thì hiển thị **XUẤT trước hoặc NHẬP tùy user perm**;
   có **subtabbar XUẤT / NHẬP**, mỗi subtab 1 danh sách + **nhóm nút CRUD · search · sort · filter**.
3. **Tab CẤP PHÁT & HOÀN TRẢ** — **logic tương tự** tab XUẤT & NHẬP.

> ⚠️ User dặn trước: *«trước khi thực hiện yêu cầu của tôi thì hãy đọc lại repo 1 lần để tránh conflict»* ⇒ **§2**.

---

## §2 · ĐỌC REPO TRƯỚC KHI LÀM (chống conflict — GO-LIVE §2/§5/§29)

| Hạng mục | Kết quả ĐO |
|---|---|
| Cấu trúc state | `docs/dsh-state/` **đã có** (`CHECKLIST.md` · `CURRENT_STATE.md` · `DECISIONS.md` · `SESSION_REGISTRY.md` · `TASK_HISTORY.md`) ⇒ **dùng luôn**, ⛔ không tạo hệ thống state thứ hai (§4) |
| Phiên khác | **`ERP-SESSION-01`** 🟢 WORKING — BUG-20261006-003, trạng thái `READY_FOR_VERIFY` (chờ user test) |
| Tệp phiên khác ĐANG GIỮ | `java-backend/application/…/UserManagementUseCase.java` · `java-backend/web/src/test/…/AdminGovernanceIntegrationTest.java` (⚠️ chưa commit) ⇒ ⛔ **KHÔNG ĐỤNG** |
| `app/page.tsx` | SESSION-01 đã **NHẢ** (commit `b5ca4cc`) — ⚠️ nhưng **hiện ĐANG bị sửa** (không phải em) ⇒ **em TRÁNH**, sẽ coordinate khi cần |
| Vùng **chưa ai giữ** | `lib/**` · `app/screens/**` (màn kho) ⇒ ✅ **em nhận** |
| Tệp màn kho có ai sửa? | ⛔ **KHÔNG** — `Inventory.tsx` · `WarehouseDashboard.tsx` · `AllocateReturn.tsx` đều **SẠCH** ⇒ ✅ sửa an toàn (§28) |
| Dịch vụ | Java `:18081` **200** · UI `:8787` **200** · proxy `:9000` **200** |
| Đăng ký phiên | ✅ đã thêm `ERP-SESSION-02` + bảng ranh giới vào `SESSION_REGISTRY.md` |

---

## §3 · TÀI SẢN ĐÃ CÓ (⇒ TÁI DÙNG, ⛔ KHÔNG VIẾT TRÙNG — GO-LIVE §17)

| Tệp | Nội dung | Cách em dùng |
|---|---|---|
| **`app/screens/WarehouseDashboard.tsx`** (256d) | Hàm **thuần** `warehouseDashboard(data, projectScope)` — **8 chỉ số §19** + component `<WarehouseDashboard data project/>` | ✅ **tái dùng nguyên** cho dashboard tồn kho |
| **`app/screens/Inventory.tsx`** (254d) | **ĐÃ LÀ HUB** (MT3 §F): 4 tab cũ + cards kho + toolbar CRUD + modal chi tiết kho | ✅ **cải tạo** (⛔ không tạo màn mới) |
| `app/screens/AllocateReturn.tsx` (70d) | 2 tab «Cấp phát / Hoàn trả» — khuôn `ListToolbar extra={project-scope-tabs}` + `DataTable` | ✅ dùng làm **MẪU** cho tab CẤP PHÁT & HOÀN TRẢ |
| CSS `app/styles/canonical.css` | **ĐÃ CÓ** `.warehouse-card-grid` (dòng 1058) · `.warehouse-card` (1059-1064) · `.warehouse-card-hint` (1065) · `.project-warehouse-detail` (422) | ✅ dùng lớp có sẵn, ⛔ không bịa lớp mới |

---

## §4 · TRƯỜNG DỮ LIỆU THẬT — ĐO, ⛔ KHÔNG ĐOÁN (§16)

**Nguồn mã** (`BootstrapDataAdapter.java:213-215`):
```sql
SELECT id, code, name, type, project_id AS projectId, parent_warehouse_id AS parentWarehouseId
FROM warehouses WHERE active=1 AND (project_id IS NULL OR project_id IN (…)) ORDER BY code
```

**Đối chứng trên PAYLOAD SỐNG** (`GET /api/system` @ `:18081`, đăng nhập `admin`) — kho #1:
```
id   = WH_dc5b5734-ee98-42bc-9d3e-71c2560a996b
code = KHO-DA-MAU-01
name = Kho công trường DA-MAU-01
type = site
projectId = PRJ_cfba8c1a-2b2e-4119-92d4-0a6438cb4ed8
parentWarehouseId = WH-CENTRAL
```
⇒ ⭐ Trường ĐÚNG: **`id` · `code` · `name` · `type` · `projectId`** (+`parentWarehouseId`).

---

## §5 · 🐛 LỖI CÓ SẴN PHÁT HIỆN ĐƯỢC (kèm bằng chứng)

**Mô tả:** `app/screens/Inventory.tsx` (bản cũ) đọc **3 trường KHÔNG TỒN TẠI** trong payload:
`w.warehouseName` · `w.warehouseCode` · `w.warehouseType`.

| Vị trí (bản cũ) | Hệ quả THẬT |
|---|---|
| Card kho: `{String(w.warehouseName\|\|w.warehouseCode\|\|w.id)}` | ⛔ Tiêu đề card rơi về **`w.id`** ⇒ **hiện UUID** `WH_dc5b5734-ee98-…` **thay vì TÊN KHO** |
| `w.warehouseType==="central"?"Kho":"Kho tổ đội"` | ⛔ Luôn ra nhánh cuối ⇒ **mọi kho đều ghi «Kho tổ đội»** |
| Lọc phạm vi `row.warehouseType==="central"` | ⛔ Điều kiện **luôn false** ⇒ kho Tổng chỉ hiện khi `project==="ALL"` |
| CSV: `w.warehouseName`/`w.warehouseCode` | ⛔ Cột Mã/Tên kho trong Excel **rỗng** |

**Bằng chứng:** §4 — payload sống **KHÔNG có** 3 khoá đó (đã in toàn bộ tên trường của kho #1).
**Khắc phục:** ⭐ việc viết lại cards bằng `warehouseCards()` (đọc ĐÚNG `code`/`name`/`type`) **SỬA LUÔN LỖI NÀY**.

---

## §6 · ĐÃ LÀM (06/10/2026 — ERP-SESSION-02)

### §6.1 · Tệp MỚI `lib/warehouse-hub.ts` — KHỐI THUẦN (⛔ không JSX, ⛔ không import UI)

| Hàm / hằng | Việc |
|---|---|
| `WAREHOUSE_HUB_TABS` | **3 tab cấp 1** nguyên văn yêu cầu: `KHO` · `XUẤT & NHẬP` · `CẤP PHÁT & HOÀN TRẢ` |
| `OUT_IN_SUBTABS` · `ALLOCATE_RETURN_SUBTABS` | `XUẤT`/`NHẬP` · `CẤP PHÁT`/`HOÀN TRẢ` |
| `WAREHOUSE_DETAIL_TABS` | **5 tab màn chi tiết**: `Dashboard kho` · `Tồn kho` · `Xuất - Nhập` · `Cấp phát - Hoàn trả` · `Nhân sự` |
| `SEE_ALL_WAREHOUSE_ROLES` · `canSeeAllWarehouses()` | ⭐ **NGOẠI LỆ user chốt**: `director` (BAN GIÁM ĐỐC) · `admin` (ADMIN/IT) ⇒ **xem TẤT CẢ kho**; ⚠️ **chỉ phạm vi XEM**, ⛔ không nới quyền thao tác |
| `hubRoleBase()` | đọc `roleBase` rồi tới `role` (khớp `lib/permissions.ts`) |
| `totalsForWarehouse()` · `totalsFromRows()` | tồn của 1 kho/nhiều kho: `materialCount`·`balance`·`reserved`·`available`·`belowMinCount` — ⛔ **KHÔNG tự cộng lại sổ** (payload đã tính `balance`) |
| `warehouseCards()` | **cards kho**: `id`·`code`·`name`·`type`·**`projectId`/`projectCode`/`projectName` (CHỈ kho dự án)**·`totals` ⇒ ⭐ đúng 4 thông tin user yêu cầu; **kho Tổng xếp trước**, trong nhóm sắp theo `code` |
| `myProjectIds()` · `visibleWarehouseCards()` | ⭐ **phạm vi XEM**: user thường = kho Tổng + kho dự án **mình thuộc**; trả thêm `hiddenByScope` để UI nói rõ ⛔ không phải mất dữ liệu |
| `defaultOutInSubtab()` · `defaultAllocateReturnSubtab()` | subtab mặc định **theo QUYỀN** user (⛔ không hardcode admin) |
| `inventoryRowsOfWarehouse()` · `documentsOfWarehouse()` | lọc dòng tồn / chứng từ theo **1 kho** (cho màn chi tiết) |

### §6.2 · Tệp MỚI `tests/warehouse-hub.test.mjs`

**KẾT QUẢ ĐO:** `node --import tsx --test tests/warehouse-hub.test.mjs`
```
ℹ tests 22   ℹ pass 22   ℹ fail 0   ℹ skipped 0   (duration_ms 293)   EXIT=0
```
Bao gồm test **chống hồi quy** cho: kho Tổng ⛔ không gán dự án · user ⛔ không thuộc dự án nào vẫn thấy kho Tổng
(⛔ không màn trắng) · dữ liệu bẩn (`undefined`/`"abc"`/`null`) ⛔ không ra `NaN` · `belowMinCount` ⛔ không đếm
dòng `minStock=0` · ngoại lệ **chỉ** `director`/`admin` (7 vai trò còn lại ⛔ không được).

### §6.3 · SỬA `app/screens/Inventory.tsx` (4 sửa, giữ ⛔ không tạo màn trùng)

| # | Sửa gì | Vì sao |
|---|---|---|
| 1 | Thêm import khối thuần (`WAREHOUSE_HUB_TABS`, `warehouseCards`, `visibleWarehouseCards`, `defaultOutInSubtab`, `defaultAllocateReturnSubtab`) + `modulePermission` | dùng 1 nguồn, ⛔ không khai báo trùng |
| 2 | `WAREHOUSE_TABS` 4 tab cũ → **`WAREHOUSE_HUB_TABS` 3 tab** | ⭐ đúng yêu cầu user |
| 3 | Tab mặc định `view==="dashboard"?2:0` → **`0`** (KHO) + `ioTab`/`arTab` mặc định **theo quyền** | ⭐ «click menu ⇒ hiện luôn dashboard» + «XUẤT trước hay NHẬP tùy perm» |
| 4 | `allowedWarehouses` → lọc qua `warehouseCards()` + `visibleWarehouseCards()`; sửa `warehouseType` → **`type`** | ⭐ quy tắc thành viên dự án + **ngoại lệ director/admin** + **sửa lỗi §5** |

**BẰNG CHỨNG:** `npx tsc --noEmit` ⇒ **EXIT=0** (sau cả 4 sửa).

---

## §7 · CÒN LẠI (⛔ CHƯA XONG — ⛔ KHÔNG báo hoàn thành)

1. **Tab KHO**: đưa `<WarehouseDashboard>` **lên đầu** tab KHO (hiện dashboard đang ở nhánh `showDashboard` riêng)
   + đổi cards sang `warehouseCards()` để hiện **Dự án** + **Tồn hiện tại** (đúng 4 thông tin user yêu cầu).
2. **Màn CHI TIẾT KHO** (thay modal hiện tại): nút **quay lại** + **5 tab**.
3. **Tab XUẤT & NHẬP**: đưa **danh sách phiếu xuất** (đang nằm ngoài tab) vào tab + **danh sách phiếu nhập** + nhóm nút CRUD/search/sort/filter.
4. **Tab CẤP PHÁT & HOÀN TRẢ**: 2 subtab + 2 danh sách (`issues` / `returns`).
5. **Gom menu 7 → 1 mục «Kho vật tư»** (`lib/menu-helpers.ts`) + nối `app/page.tsx` — ⚠️ **phải coordinate** vì `app/page.tsx` đang bị sửa bởi phiên khác.
6. **CỔNG NGHIỆM THU cuối**: `tsc` 0 · `npm run test:regression` 69/69 · `npm test` · cổng ảnh.
7. **Telegram báo hoàn thành** (§26) + release ownership (§32/§33).

---

## §8 · TỆP ĐÃ ĐỘNG TỚI

| Tệp | Loại | Trạng thái |
|---|---|---|
| `lib/warehouse-hub.ts` | ⭐ MỚI | ✅ tsc 0 |
| `tests/warehouse-hub.test.mjs` | ⭐ MỚI | ✅ 22/22 PASS |
| `app/screens/Inventory.tsx` | SỬA (4 chỗ) | ✅ tsc 0 |
| `docs/dsh-state/SESSION_REGISTRY.md` | SỬA (chỉ mục phiên mình) | ✅ |
| `docs/agent-progress/TASK-226.md` | ⭐ MỚI (tệp này) | ✅ |

⛔ **KHÔNG commit** — GO-LIVE §47 luật 25 (`AUTO_COMMIT = FALSE`).

---

## §9 · VÒNG 5 (06/10/2026) — SỬA LỖI LOGIC DO CHÍNH MÌNH + 8 CHỖ DÙNG TRƯỜNG SAI + CẬP NHẬT CỔNG

### §9.1 · ⚠️ LỖI LOGIC DO VÒNG TRƯỚC GÂY RA (tsc ⛔ KHÔNG bắt được) — ĐÃ SỬA
Khi đổi 4 tab → 3 tab, 2 chỗ **vẫn theo chỉ số tab CŨ** ⇒ sai âm thầm:
| Chỗ | Hệ quả THẬT | Đã sửa |
|---|---|---|
| `const showDashboard = tab === 2;` + nhánh `if (showDashboard) return …<WarehouseDashboard/>` | tab 2 nay là «CẤP PHÁT & HOÀN TRẢ» ⇒ **tab cấp phát hiện NHẦM dashboard** | ⛔ **xoá hẳn** nhánh; dashboard đặt **NGAY ĐẦU tab «KHO»** |
| `{tab===3&&<section …warehouse-allocate-tab>}` | màn chỉ còn tab 0/1/2 ⇒ **khối CẤP PHÁT & HOÀN TRẢ ⛔ KHÔNG BAO GIỜ HIỆN** | đổi thành **`{tab===2&&…}`** |

### §9.2 · ⛔ BỎ DẢI TAB LẶP
Bản cũ vẽ dải tab **2 LẦN** (1 ở `tabBar` đầu màn + 1 trong thân màn) ⇒ user thấy **2 hàng tab giống nhau**.
Nay chỉ còn `tabBar`; chỗ thứ hai thay bằng `<WarehouseDashboard data project/>` (tab 0).

### §9.3 · 🐛 SỬA 8 CHỖ DÙNG TRƯỜNG KHÔNG TỒN TẠI (cùng gốc lỗi §5)
| # | Vị trí | Trước | Sau | Hệ quả người dùng thấy |
|---|---|---|---|---|
| 1 | Tìm kiếm kho | `w.warehouseName`/`w.warehouseCode` | `w.name`/`w.code` | **Tìm kho ⛔ không chạy** → nay chạy |
| 2 | Sắp xếp kho | `a.warehouseName`/`a.warehouseCode` | `a.name`/`a.code` | **Sắp xếp kho ⛔ không chạy** → nay chạy |
| 3 | Xuất Excel kho | `w.warehouseCode`/`w.warehouseName`/`w.warehouseType` | `w.code`/`w.name`/`w.type` | **Cột Mã/Tên kho RỖNG** → nay có dữ liệu |
| 4 | Tiêu đề modal chi tiết | `w.warehouseName`/`w.warehouseCode` | `w.name`/`w.code` | Tiêu đề **rỗng** → nay hiện tên kho |
| 5 | Modal «Mã kho» | `w.warehouseCode` | `w.code` | Ô mã kho **rỗng** → nay có |
| 6 | Card kho (tên) | `w.warehouseName\|\|w.warehouseCode\|\|w.id` | `card?.name\|\|w.name` | Hiện **UUID** → nay hiện **TÊN KHO** |
| 7 | Card kho (loại) | `w.warehouseType==="central"?…` | `card?.type==="central"?…` | Luôn «Kho tổ đội» → nay đúng loại |
| 8 | Lọc phạm vi | `row.warehouseType==="central"` | `row.type==="central"` | Kho Tổng ⛔ bị ẩn sai → nay đúng |

**THÊM MỚI trên card** (đúng 4 thông tin user yêu cầu): **Tồn hiện tại** `card.totals.balance` +
**Dự án** (chỉ kho dự án) `card.projectName||projectCode`.

### §9.4 · ✅ CỔNG HỒI QUY BẮT ĐƯỢC HỢP ĐỒNG CŨ — ĐÃ CẬP NHẬT, ⛔ KHÔNG NỚI CỔNG
`npm run test:regression` **HỎNG** ở `tests/w04-inventory-dashboard.test.mjs:180` — test ghim **bộ 4 tab MT3 §F**:
```
expected: /const WAREHOUSE_TABS = \["Kho", "Nhập kho & Xuất kho", "Tồn kho", "Cấp phát & hoàn trả"\]/
```
⇒ **Cổng làm ĐÚNG vai trò** ✔ Yêu cầu mới của user **thay thế** hợp đồng cũ ⇒ cập nhật test với **khẳng định MẠNH HƠN**:
| Khẳng định MỚI (thay 2 khẳng định cũ) | Ý nghĩa |
|---|---|
| `WAREHOUSE_HUB_TABS` có mặt | hằng số 3 tab lấy từ **nguồn dùng chung** (`lib/warehouse-hub.ts`), ⛔ không khai báo trùng |
| `const WAREHOUSE_TABS: readonly string[] = WAREHOUSE_HUB_TABS;` | gán đúng nguồn |
| `{tab===0&&<WarehouseDashboard` | **VỊ TRÍ** dashboard: ngay trong tab «KHO» |
| `const [tab, setTab] = useState(0)` | **TAB MẶC ĐỊNH** = KHO (yêu cầu user) |
| `doesNotMatch(/const showDashboard/)` | ⛔ không sót khai báo cũ |
| `void view;` | prop `view` VẪN được tiêu thụ ⇒ `app/page.tsx` ⛔ không phải sửa |
| `TỒN KHO & ĐIỀU CHUYỂN` | nội dung Tồn kho cũ **giữ nguyên** |

⚠️ **Một lần cổng bắt lỗi CỦA CHÍNH EM:** khẳng định `doesNotMatch(/showDashboard/)` hỏng vì **chú thích của em** có chữ đó
⇒ đổi thành `/const showDashboard/` (**kiểm khai báo**, ⛔ không kiểm chú thích) — bài học: *cổng phải kiểm CẤU TRÚC, ⛔ không kiểm văn bản tự do*.

### §9.5 · KẾT QUẢ CỔNG (đo được)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — tests 803 · pass 802 · fail 0 · skipped 1** |
| `node --import tsx --test tests/warehouse-hub.test.mjs` | ✅ **22/22 pass** |

### §9.6 · CÒN LẠI (cập nhật §7)
1. **Màn CHI TIẾT KHO** thay modal: nút quay lại + **5 tab** (Dashboard kho · Tồn kho · Xuất-Nhập · Cấp phát-Hoàn trả · Nhân sự).
2. **Tách nội dung theo tab**: hiện nhiều khối vẫn render ở MỌI tab (bảng tồn · phiếu điều chuyển · danh sách phiếu xuất)
   ⇒ phải đưa vào đúng tab.
3. **Tab XUẤT & NHẬP** + **CẤP PHÁT & HOÀN TRẢ**: 2 subtab + 2 danh sách + nhóm nút CRUD/search/sort/filter.
4. **Gom menu 7→1** (`lib/menu-helpers.ts`) + nối `app/page.tsx` — ⚠️ **coordinate** (tệp đang bị phiên khác sửa).
5. Cổng ảnh + Telegram hoàn thành + release ownership.

---

## §10 · VÒNG 6 (06/10/2026) — ĐƯA DANH SÁCH VỀ ĐÚNG TAB + THÊM DANH SÁCH NHẬP

### §10.1 · 🐛 LỖI CÓ SẴN #2 — «Số phiếu xuất» LUÔN = 0
**Đo trên payload sống:** `data.issues[0]` có `id · issueNo · projectId · teamId · projectCode · teamName ·
issuedAt · status · receivedByName · itemCount · totalQty · installedQty` — ⛔ **KHÔNG có `warehouseId`**.
Nhưng `Inventory.tsx` lọc `data.issues.filter(r => String(r.warehouseId) === String(w.id))` ⇒ **điều kiện luôn false**
⇒ **«Số phiếu xuất» trên CARD và trong MODAL chi tiết kho LUÔN = 0** (thông tin SAI, ⛔ không phải «chưa có»).
⇒ **Đã bỏ** số liệu sai khỏi card (⛔ không thể tính đúng theo kho vì dữ liệu ⛔ không có liên kết kho).
Card nay đúng đặc tả user: **Tên kho · Mã kho · Dự án (nếu kho dự án) · Tồn hiện tại** (+ số vật tư có thật).

### §10.2 · TRƯỜNG THẬT CỦA 3 DANH SÁCH (đo trên `GET /api/system` — ⛔ không đoán)
| Danh sách | Trường THẬT | Số dòng |
|---|---|---|
| `data.receipts[]` | `receiptNo` · `poNo` · `projectCode` · `supplierName` · **`warehouseName`** · `receivedAt` · `acceptedQty` · `bchConfirmationStatus` · `itemCount` (⛔ không `warehouseId`) | **36** |
| `data.issues[]` | `issueNo` · `projectCode` · `teamName` · `receivedByName` · `issuedAt` · `status` · `totalQty` · `installedQty` (**⛔ không `warehouseId`**) | **29** |
| `data.returns[]` | `returnNo` · `projectCode` · `teamName` · `returnedByName` · `returnedAt` · `status` · `acceptedQty` | **6** |
⚠️ **CẢNH BÁO TRƯỜNG TRÙNG TÊN KHÁC NGUỒN:** `warehouseName` **CÓ** trong `receipts[]` nhưng **⛔ KHÔNG có** trong `warehouses[]`
⇒ ⛔ không được suy ra «có `warehouseName` thì `warehouses` cũng có» (đúng cái bẫy đã gây lỗi §5).

### §10.3 · ĐÃ SỬA / THÊM
| Việc | Chi tiết |
|---|---|
| **Danh sách PHIẾU XUẤT → vào TAB «XUẤT & NHẬP» + subtab «XUẤT»** | bản cũ render ở **MỌI tab** ⇒ tab CẤP PHÁT/HOÀN TRẢ cũng thấy danh sách xuất (SAI) ⇒ nay bọc `{tab===1&&ioTab==="issue"&&…}` |
| **THÊM danh sách PHIẾU NHẬP (subtab «NHẬP»)** | bản cũ ⛔ **chỉ có nút tạo**, không có danh sách ⇒ nay có `ListToolbar` đủ **TẠO · TÌM · SẮP XẾP · LỌC** + `DataTable` 10 cột (số phiếu · PO · dự án · NCC · kho nhập · ngày · SL nhận · số dòng · BCH xác nhận) |
| Thêm state + lọc/sắp xếp cho NHẬP | `recQuery` · `recSortKey` (5 kiểu) · `recStatus` (theo `bchConfirmationStatus`) — ⛔ chịu được trường thiếu |

### §10.4 · KẾT QUẢ CỔNG
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — tests 803 · pass 802 · fail 0 · skipped 1** |
| `tests/warehouse-hub.test.mjs` | ✅ **22/22 pass** |

### §10.5 · CÒN LẠI
1. **Tab CẤP PHÁT & HOÀN TRẢ**: 2 subtab (`arTab` đã có state nhưng ⛔ chưa dùng) + 2 danh sách (`issues`/`returns`) + nhóm nút.
2. **Màn CHI TIẾT KHO** thay modal: nút quay lại + **5 tab**; ⚠️ lưu ý `issues`/`returns` ⛔ không có kho ⇒
   tab «Xuất - Nhập»/«Cấp phát - Hoàn trả» của kho phải lọc theo **dự án của kho** (⭐ phải ghi rõ nguồn, ⛔ không bịa).
3. **Tab «KHO»**: bảng Tồn kho + «Giá trị tồn theo kho» + «Cảnh báo» nên gom về tab 0 (hiện vẫn ở mọi tab).
4. **Gom menu 7→1** (`lib/menu-helpers.ts`) + `app/page.tsx` — ⚠️ **coordinate**.
5. **BUILD** + cổng ảnh + Telegram hoàn thành + release ownership.

---

## §11 · VÒNG 7 (06/10/2026) — TAB «CẤP PHÁT & HOÀN TRẢ» ĐỦ 2 SUBTAB + 2 DANH SÁCH

### §11.1 · ĐÃ LÀM
| Việc | Chi tiết |
|---|---|
| **Kích hoạt `arTab`** | State `arTab` đã có từ vòng 5 nhưng ⛔ **chưa dùng** (vi phạm nguyên tắc «⛔ không để mã chết») ⇒ nay dùng thật |
| **SUBTABBAR «Cấp phát / Hoàn trả»** | `data-vntech="ar-tab-allocate"` / `ar-tab-return` · mặc định theo **QUYỀN** (`defaultAllocateReturnSubtab`) |
| **DANH SÁCH CẤP PHÁT** | nguồn `scopeIssues` (**29 dòng** thật) — 10 cột: mã đơn · người tạo · tổ đội/người nhận · dự án · kho xuất · ngày · SL xuất · đã lắp đặt · trạng thái |
| **DANH SÁCH HOÀN TRẢ** | nguồn `scopeReturns` (**6 dòng** thật) — 10 cột: mã đơn · người trả · tổ đội · dự án · kho nhập · ngày trả · SL nhận · số dòng · trạng thái |
| **Nhóm nút theo subtab** | `＋ Tạo phiếu cấp phát` / `＋ Tạo phiếu hoàn trả` + **TÌM · SẮP XẾP (4 kiểu) · LỌC (trạng thái)** |
| Giữ nguyên | Khối «LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO» (`centralReturns`) — ⛔ **không xoá nghiệp vụ** (quyết định user 26/09/2026) |
| ⛔ Không bịa | «Kho xuất»/«Kho nhập»/«Người tạo» hiện **«—»** vì `issues`/`returns` ⛔ **KHÔNG có** trường đó (đã đo §10.2) |

### §11.2 · ⚠️ `tsc` BẮT 5 LỖI CỦA CHÍNH EM — ĐÃ SỬA HẾT
```
Inventory.tsx(121,49): error TS2304: Cannot find name 'scopeReturns'.     ← biến này ở AllocateReturn.tsx, ⛔ không tự có
Inventory.tsx(122,36): error TS7006: Parameter 'row' implicitly has an 'any' type.   ← thiếu kiểu Row
Inventory.tsx(123,44): error TS7006: Parameter 'row' implicitly has an 'any' type.
Inventory.tsx(125,57): error TS7006: Parameter 'r' implicitly has an 'any' type.
Inventory.tsx(271,155): error TS2322: Type '{ value: unknown; ... }' is not assignable to type 'Option'.
```
⇒ Sửa: **khai báo `scopeReturns`** + gán kiểu `Row[]`/`(row:Row)` + `arStatusOptions` khai kiểu `string[]`.
> 📌 **Bài học:** ⛔ KHÔNG giả định một biến có sẵn chỉ vì **tệp khác cùng khuôn** có biến đó — `scopeReturns` nằm ở
> `AllocateReturn.tsx`, ⛔ **không** tồn tại trong `Inventory.tsx`. `tsc` bắt ngay (`TS2304`).

### §11.3 · KẾT QUẢ CỔNG + ĐO LẠI CẤU TRÚC
| Cổng / Điểm đo | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — tests 803 · pass 802 · fail 0 · skipped 1** |
| `WAREHOUSE_HUB_TABS` | **3 lần** (khai báo + dùng) |
| `{tab===0&&<WarehouseDashboard` | **1** (dashboard NGAY ĐẦU tab KHO ✔) |
| `ar-tab-allocate` / `ar-tab-return` | **1 / 1** (subtabbar có thật) |
| `receipt-list-screen` | **1** (danh sách NHẬP có thật) |
| `ioTab==="issue"&&<section` | **1** (danh sách XUẤT nằm trong tab, ⛔ không tràn mọi tab) |
| `warehouse-allocate-tab` | **1** (tab cấp phát render được) |

### §11.4 · ✅ 3 TAB ĐÃ ĐỦ NỘI DUNG THEO YÊU CẦU USER
| Tab | Nội dung đã có |
|---|---|
| **KHO** | **Dashboard tồn kho** (8 chỉ số §19) + **cards kho** (Tên · Mã · Dự án · Tồn hiện tại) + toolbar CRUD/Search/Sort/Export |
| **XUẤT & NHẬP** | subtabbar XUẤT/NHẬP (mặc định theo **quyền**) + **danh sách XUẤT** + **danh sách NHẬP** (mỗi danh sách đủ Tạo·Tìm·Sắp xếp·Lọc) |
| **CẤP PHÁT & HOÀN TRẢ** | subtabbar CẤP PHÁT/HOÀN TRẢ (mặc định theo **quyền**) + **2 danh sách** + khối luân chuyển vật tư dư |

### §11.5 · CÒN LẠI
1. **Màn CHI TIẾT KHO** thay modal: nút **quay lại** + **5 tab** (Dashboard kho · Tồn kho · Xuất-Nhập · Cấp phát-Hoàn trả · Nhân sự).
   ⚠️ `issues`/`returns` ⛔ không có kho ⇒ phải lọc theo **dự án của kho** và **ghi rõ nguồn** (⛔ không bịa liên kết kho).
2. **Tab «KHO»**: gom bảng Tồn kho + «Giá trị tồn theo kho» + «Cảnh báo tồn» về tab 0 (hiện vẫn render ở MỌI tab).
3. **Gom menu 7→1** (`lib/menu-helpers.ts`) + `app/page.tsx` — ⚠️ **coordinate** (page.tsx đang bị phiên khác sửa).
4. **BUILD** + cổng ảnh + **Telegram hoàn thành** + release ownership.

---

## §12 · VÒNG 8 (06/10/2026) — GOM NỘI DUNG VỀ ĐÚNG TAB (hoàn tất cấu trúc 3 tab)

### §12.1 · VẤN ĐỀ
Bản cũ render **RẤT NHIỀU khối ở MỌI tab** (di sản của thiết kế «tab chỉ là thẻ phụ trên một trang dài»):
bảng Tồn kho · thanh công cụ Tồn kho&điều chuyển · «Cảnh báo tồn kho» · «Giá trị tồn theo kho» ·
bảng «Phiếu điều chuyển» · danh sách phiếu xuất — **tất cả đều hiện ở cả 3 tab** ⇒ **trái yêu cầu user**
(«mỗi tab hiển thị 1 nội dung tương ứng»).

### §12.2 · ĐÃ GOM (bọc `{tab===N&&…}` — ⛔ chỉ đổi CÁCH HIỂN THỊ, ⛔ không xoá nghiệp vụ)
| Khối | Trước | Sau |
|---|---|---|
| Cards kho | mọi tab | **tab 0 «KHO»** |
| Dashboard tồn kho | (vòng 5) | **tab 0** |
| Thanh công cụ «TỒN KHO & ĐIỀU CHUYỂN» (search/sort/filter/Excel/Barcode) | mọi tab | **tab 0** |
| Bảng Tồn kho (`filtered`) | mọi tab | **tab 0** |
| «Cảnh báo tồn kho» + «Giá trị tồn theo kho» | mọi tab | **tab 0** |
| Khối «XUẤT & NHẬP» (subtab) | tab 1 | **tab 1** |
| Danh sách phiếu XUẤT | **mọi tab** | **tab 1 + subtab XUẤT** |
| Danh sách phiếu NHẬP | (chưa có — vòng 6 thêm) | **tab 1 + subtab NHẬP** |
| Khối «CẤP PHÁT & HOÀN TRẢ» + 2 danh sách | tab 2 (sửa vòng 7) | **tab 2** |
| Bảng «Phiếu điều chuyển đang xử lý» | mọi tab | **tab 2** |
| Modal chi tiết kho | mọi tab | giữ **mọi tab** (là overlay, ⛔ không phải nội dung tab) |

### §12.3 · ĐO LẠI — PHÂN BỐ CHÍNH XÁC (mỗi khối đúng **1 lần**)
| Tab | Số khối | Nội dung |
|---|---|---|
| **tab 0 «KHO»** | **5** | cards kho · dashboard tồn kho · thanh công cụ · bảng tồn kho · cảnh báo + giá trị theo kho |
| **tab 1 «XUẤT & NHẬP»** | **3** | khối xuất&nhập (subtab) · danh sách XUẤT · danh sách NHẬP |
| **tab 2 «CẤP PHÁT & HOÀN TRẢ»** | **2** | khối cấp phát (subtab + 2 danh sách) · bảng phiếu điều chuyển |
⇒ **10/10 khối đều `1 lan  OK`** — ⛔ không khối nào còn tràn tab.
`app/screens/Inventory.tsx`: **254 → 412 dòng**.

### §12.4 · CỔNG NGHIỆM THU
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — tests 803 · pass 802 · fail 0 · skipped 1** |
⚠️ **Lỗi khi ĐO (⛔ không phải lỗi mã):** PowerShell 5.1 ⛔ **không** cho `if` làm BIỂU THỨC trong `-f` ⇒
viết lại vòng đo bằng biến trung gian. *(Bài học: lệnh ĐO cũng phải đúng cú pháp — ⛔ đừng nhầm lỗi script với lỗi mã.)*

### §12.5 · CÒN LẠI (cập nhật)
1. **Màn CHI TIẾT KHO** (thay modal): nút **quay lại** + **5 tab** — ⚠️ `issues`/`returns` ⛔ không có kho
   ⇒ lọc theo **dự án của kho** và **ghi rõ nguồn** (⛔ không bịa liên kết kho).
2. **Gom menu 7→1** (`lib/menu-helpers.ts`) + `app/page.tsx` — ⚠️ **coordinate** (page.tsx đang bị phiên khác sửa).
3. **BUILD** + cổng ảnh + **Telegram hoàn thành** + release ownership.

---

## §13 · VÒNG 9 (06/10/2026) — MÀN CHI TIẾT KHO (thay MODAL) + XOÁ MÃ CHẾT

### §13.1 · YÊU CẦU NGUYÊN VĂN
«…khi click vào sẽ hiển thị ra **màn thông tin chi tiết của kho** (có **nút quay lại màn KHO**). Trong màn thông tin
chi tiết của kho sẽ có các tab: **dashboard của kho đó · tồn kho · xuất - nhập · cấp phát - hoàn trả · nhân sự**
(hiển thị ra các user liên quan đến kho này).»

### §13.2 · ĐÃ LÀM — MODAL ⇒ **MÀN** (early-return)
| Việc | Chi tiết |
|---|---|
| Thay **MODAL** bằng **MÀN** | khối `if (openWarehouseId) { … return <div data-vntech="warehouse-detail-screen"> }` đặt **TRƯỚC** return chính (⛔ không phải modal nữa) |
| **Nút quay lại** | `data-vntech="warehouse-detail-back"` → «← Quay lại màn KHO» (xoá `openWarehouseId` + đưa `wdTab` về 0) |
| **5 TAB** | `WAREHOUSE_DETAIL_TABS` (⭐ hằng số từ `lib/warehouse-hub.ts`) — đúng nguyên văn: *Dashboard kho · Tồn kho · Xuất - Nhập · Cấp phát - Hoàn trả · Nhân sự* |
| Tab 1 «Dashboard kho» | 4 KPI của **RIÊNG kho** (`totalsForWarehouse`) + mã kho · loại · dự án · thủ kho |
| Tab 2 «Tồn kho» | `DataTable` từ `inventoryRowsOfWarehouse` — ⭐ liên kết **CHÍNH XÁC** theo `warehouseId` |
| Tab 3 «Xuất - Nhập» | 2 bảng (phiếu xuất / phiếu nhập) + **GHI RÕ NGUỒN** giới hạn |
| Tab 4 «Cấp phát - Hoàn trả» | 2 bảng (cấp phát / hoàn trả) + ghi rõ nguồn |
| Tab 5 «Nhân sự» | `data.staffDirectory` lọc theo `warehouseId` |
| ⛔ **XOÁ MÃ CHẾT** | modal cũ (24 dòng) — xoá **có KIỂM BIÊN 3 ĐIỂM** trước khi ghi (⛔ không xoá mù) |

### §13.3 · ⚠️ GIỚI HẠN ĐÃ ĐO — GHI RÕ TRÊN UI (⛔ KHÔNG BỊA)
`data.issues[]` / `data.returns[]` / `data.receipts[]` ⛔ **KHÔNG có trường kho** (`warehouseId`) — đo thật §10.2.
⇒ ⛔ **KHÔNG thể** lọc «phiếu thuộc kho này». Nay lọc theo **DỰ ÁN CỦA KHO** và **in thẳng cảnh báo trên UI**:
* Có dự án: «⚠️ Phiếu xuất/nhập ⛔ KHÔNG có trường kho ⇒ lọc theo DỰ ÁN của kho (…) — ⛔ KHÔNG phải «phiếu của riêng kho».»
* Kho Tổng: «Kho Tổng ⛔ không thuộc dự án ⇒ ⛔ không lọc được phiếu theo kho (dữ liệu ⛔ không có trường kho).»

### §13.4 · KẾT QUẢ ĐO
| Mục | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — tests 803 · pass 802 · fail 0 · skipped 1** |
| `warehouse-detail-screen` · `warehouse-detail-back` | **1** · **1** |
| 5 panel `wd-dashboard` · `wd-inventory` · `wd-io` · `wd-allocate-return` · `wd-staff` | **1 · 1 · 1 · 1 · 1** |
| `WAREHOUSE_DETAIL_TABS` | **2** (import + dùng) |
| `app/screens/Inventory.tsx` | **254 → 507 dòng** |
⚠️ **`wd-tab-N` đo ra 0 lần** là do mã dùng **template literal** `data-vntech={`wd-tab-${index}`}` ⇒ chuỗi tĩnh ⛔ không có trong nguồn
⇒ **lỗi phép ĐO**, ⛔ không phải lỗi mã (bài học: đo bằng **mẫu khớp cấu trúc**, ⛔ không khớp chuỗi động).

### §13.5 · ✅ YÊU CẦU USER ĐÃ ĐỦ 5/5 PHẦN
| # | Yêu cầu | TT |
|---|---|---|
| 1 | Click menu ⇒ dashboard tồn kho + tabbar **3 tab** | ✅ |
| 2 | Tab KHO: cards 4 thông tin · kho dự án theo thành viên · ngoại lệ director/admin · **click ⇒ màn chi tiết 5 tab** | ✅ |
| 3 | Tab XUẤT & NHẬP: subtab theo quyền + 2 danh sách + nút CRUD/search/sort/filter | ✅ |
| 4 | Tab CẤP PHÁT & HOÀN TRẢ: logic tương tự | ✅ |
| 5 | **Màn chi tiết kho**: nút quay lại + 5 tab | ✅ |

### §13.6 · CÒN LẠI
1. **Gom menu 7→1 mục «Kho vật tư»** (`lib/menu-helpers.ts`) + nối `app/page.tsx` — ⚠️ **phải coordinate**
   vì `app/page.tsx` **đang bị phiên khác sửa** (§7/§28).
2. **BUILD** (`node tools/gd-cycle.mjs`) + cổng ảnh + **Telegram hoàn thành** + release ownership (§32/§33).
   ⚠️ UI `:8787` phục vụ `dist/` ⇒ **thay đổi CHƯA hiện trên màn hình** cho tới khi build.

---

## §14 · VÒNG 10 (06/10/2026) — GOM MENU 7→1: **ĐÃ THỬ, ĐÃ HOÀN TÁC** (kèm CÔNG THỨC VÁ ĐẦY ĐỦ)

### §14.1 · BỐI CẢNH
User **ĐÃ CHỐT** qua câu hỏi: *«Gom 7 mục → 1 mục «Kho vật tư»»* ⇒ **«Làm luôn — em nhận `lib/menu-helpers.ts`»**.
*(Câu hỏi BUILD: user **⛔ KHÔNG trả lời** ⇒ giữ giả định **⛔ KHÔNG build** — ⛔ không đụng dịch vụ user đang test trên `:9000`.)*

### §14.2 · ✅ PHÁT HIỆN QUAN TRỌNG — GOM MENU ⛔ **KHÔNG CẦN SỬA `app/page.tsx`**
`app/page.tsx:506` dựng `warehouseMenuChildren` **từ chính mảng** `warehouseMenuItems.flatMap(...)`, và
`app/page.tsx:523` dựng `allocateReturnMenuChildren` từ `allocateReturnMenuItems` ⇒ **đổi 2 mảng này là menu đổi theo**,
⇒ ⛔ **KHÔNG phải sửa `app/page.tsx`** (tệp đang bị phiên khác sửa) ⇒ **tránh được hoàn toàn xung đột** ✔✔

### §14.3 · ĐÃ THỬ (mã áp dụng **thành công**, `tsc EXIT=0`)
1. `warehouseMenuItems` (5 mục) → **1 mục**:
```ts
{ key: "warehouse_hub", label: "Kho vật tư", groupKey: "warehouse", moduleKey: "inventory",
  permissionKeys: ["central_warehouse","warehouse_receipt","warehouse_issue","inventory","stocktake","material_norms"] }
```
2. `allocateReturnMenuItems` → **mảng RỖNG** (đã gộp vào hub; giữ khai báo + `allocateReturnViewFor` vì `app/page.tsx` vẫn import).

### §14.4 · ⛔ VÌ SAO **HOÀN TÁC** (quyết định có lý do)
`npm run test:regression` **HỎNG 4 test** — **các hợp đồng ghim cấu trúc 5 MỤC CŨ**:
```
✖ W-01 — ĐÚNG 5 mục, ĐÚNG nhãn, ĐÚNG nhóm «warehouse», mỗi mục một cổng quyền RIÊNG …   (w01-warehouse-menu.test.mjs)
✖ W-01 — ĐỐI CHỨNG ÂM: 0 khoá module mới — mọi permissionKeys ∈ 6 khoá kho ĐÃ CÓ …       (w01-warehouse-menu.test.mjs)
✖ W-01 — ĐÍCH ĐẾN THẬT: 4 mục mở màn CŨ đúng khoá; «Dashboard tồn kho» mở TAB …          (w01-warehouse-menu.test.mjs)
✖ CHẨN ĐOÁN: view="dashboard" bị dùng cho CẢ my_work VÀ warehouse …                       (mt3-ui-29-view-collision-diagnostic.test.mjs)
```
⇒ **⛔ KHÔNG để cây ở trạng thái ĐỎ** (kỷ luật xuyên suốt phiên) + context còn rất ít ⇒ **HOÀN TÁC** (từ backup) thay vì
làm nửa vời. **Sau hoàn tác: `tsc EXIT=0` · `test:regression EXIT=0` (803 · 802 · 0)** ✔ — cây XANH trở lại.

### §14.5 · 📋 CÔNG THỨC VÁ ĐẦY ĐỦ CHO VÒNG SAU (1 lượt là xong)
| Bước | Việc | Ghi chú |
|---|---|---|
| 1 | Áp lại **§14.3** vào `lib/menu-helpers.ts` (2 khối, khớp chính xác) | ✅ đã chứng minh `tsc EXIT=0` |
| 2 | Cập nhật `tests/w01-warehouse-menu.test.mjs` — **3 test**: kỳ vọng **1 mục** `warehouse_hub` nhãn «Kho vật tư», `permissionKeys` = **6 khoá kho ĐÃ CÓ** (⛔ vẫn 0 khoá mới), đích đến `moduleKey: "inventory"` | ⛔ **KHÔNG nới cổng**: giữ nguyên tinh thần «⛔ 0 khoá module mới» (nay còn **mạnh hơn**: 1 mục dùng 6 khoá cũ) |
| 3 | Cập nhật `tests/mt3-ui-29-view-collision-diagnostic.test.mjs` — sau khi gom, `warehouse` **⛔ KHÔNG còn** `view: "dashboard"` ⇒ hết va chạm view với `my_work` (**sửa đúng bản chất**, ⛔ không tắt cổng) | đây là **cải thiện thật** |
| 4 | Kiểm `tests/mt3-ui-25-all-groups-tabs.test.mjs` + `tests/p07-supplier-partner-split-probe.mjs` (có import 2 mảng) | nhiều khả năng **vẫn xanh** (chỉ đọc mảng) |
| 5 | Chạy `npm run test:regression` ⇒ kỳ vọng **803 · 802 · 0** (hoặc 803 · 803 · 0 nếu bỏ 1 test đã hết nghĩa) | |
| 6 | Cập nhật log + Telegram + cập nhật `SESSION_REGISTRY` ⇒ **release ownership** | |

### §14.6 · TRẠNG THÁI CUỐI VÒNG 10
| Mục | Kết quả |
|---|---|
| `lib/menu-helpers.ts` | ⏪ **HOÀN TÁC** về bản gốc (5 mục) — ⛔ không còn thay đổi nào của em |
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 · 802 · 0 · 1 skip** |
| `app/page.tsx` | ⛔ **chưa từng bị em sửa** (vẫn đang do phiên khác giữ) ✔ |
| 3 dịch vụ | ✅ Java 200 · UI 200 · proxy 200 — **user test được** |

---

## §15 · VÒNG 11 (06/10/2026) — GOM MENU: THỬ LẦN 2, **HOÀN TÁC LẦN 2** (giữ cây XANH)

### §15.1 · ĐÃ LÀM
1. **Áp lại §14.3** vào `lib/menu-helpers.ts` (2 khối) ⇒ ✅ **`tsc EXIT=0`**.
2. Sửa `tests/w01-warehouse-menu.test.mjs`: dùng **thay-thế-khớp-chính-xác** ⇒ **chỉ 2/5 chỗ khớp**
   ⇒ ⚠️ **NGUYÊN NHÂN ĐO ĐƯỢC:** tệp dùng **CRLF** còn mẫu của em dùng **LF** ⇒ `.Replace()` ⛔ không khớp.
3. Lần sửa thứ 2 (chuẩn hoá CRLF→LF→CRLF) **LỖI CÚ PHÁP PowerShell** (here-string đặt trong **tham số hàm**)
   ⇒ lệnh ⛔ không chạy (`exit 1`, không có output).

### §15.2 · ⛔ QUYẾT ĐỊNH: HOÀN TÁC (lần 2) — có lý do
* Tệp test đang ở trạng thái **SỬA DỞ** (2/5 chỗ) ⇒ nếu để nguyên, `tests/w01-...` **⛔ không nhất quán**.
* **⛔ KHÔNG để cây ĐỎ / nửa vời** (kỷ luật xuyên suốt phiên) ⇒ hoàn tác **cả 2 tệp** về bản commit.
* **XÁC MINH TRƯỚC KHI HOÀN TÁC** (⛔ không xoá mù): `git diff` cho thấy **cả 2 tệp CHỈ chứa thay đổi của em**
  (dấu `⭐ GOM 7 MỤC…` của em) ⇒ an toàn.
* Sau hoàn tác: ✅ **`tsc EXIT=0` · `test:regression EXIT=0` — 803 · 802 · 0 · 1 skip** ⇒ **CÂY XANH**.

### §15.3 · 📌 BÀI HỌC KỸ THUẬT (đã trả giá 2 lần)
1. ⛔ **KHÔNG dùng here-string `@'…'@` làm THAM SỐ của hàm PowerShell** — lỗi cú pháp, lệnh ⛔ không chạy.
2. ⚠️ **Tệp trong repo này dùng CRLF** ⇒ mọi phép `.Replace()` nhiều dòng PHẢI **chuẩn hoá `\r\n` → `\n`** trước,
   rồi trả lại `\r\n` khi ghi. *(Đây là lý do 3/5 phép thay thế ⛔ không khớp.)*
3. ⛔ **KHÔNG bắt đầu việc lớn khi context còn rất ít** — 2 lần thử gom menu đều phải hoàn tác vì lý do này.
   ⇒ Việc này cần **1 lượt RIÊNG, context đầy đủ**.

### §15.4 · TRẠNG THÁI CUỐI (đo được)
| Mục | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 · 802 · 0 · 1 skip** |
| `lib/menu-helpers.ts` | ⏪ **bản commit** (⛔ không còn thay đổi của em) |
| `tests/w01-warehouse-menu.test.mjs` | ⏪ **bản commit** |
| **Thay đổi của em còn lại** | `app/screens/Inventory.tsx` (HUB 3 tab + màn chi tiết kho) · `tests/w04-inventory-dashboard.test.mjs` (hợp đồng cập nhật) · `lib/warehouse-hub.ts` · `tests/warehouse-hub.test.mjs` · `docs/agent-progress/TASK-226.md` · `docs/dsh-state/SESSION_REGISTRY.md` |
| 5/5 yêu cầu user | ✅ **VẪN XONG** (hub + cards + ngoại lệ + 2 tab danh sách + màn chi tiết 5 tab) |

### §15.5 · VIỆC KẾ TIẾP (1 lượt riêng, context đầy đủ)
Áp **§14.5** với **2 bài học §15.3** đã sửa: (a) ⛔ không here-string trong tham số hàm · (b) **chuẩn hoá CRLF** trước khi thay thế.
Hoặc **dùng công cụ `edit`** (⛔ không cần chuẩn hoá dòng) sau khi `read` tệp.

---

## §16 · VÒNG 12 (06/10/2026) — GOM MENU BẰNG CÔNG CỤ `edit`: **TIẾN 4 → 2 TEST**, RỒI HOÀN TÁC (cây XANH)

### §16.1 · ✅ CÁCH LÀM ĐÚNG (đã chứng minh — dùng `edit`, ⛔ KHÔNG `.Replace`)
Theo bài học `§15.3`, vòng này dùng **công cụ `edit`** (`read` trước rồi `edit`) ⇒ **⛔ KHÔNG gặp vấn đề CRLF**, mọi phép sửa **khớp 100%**:
| # | Tệp | Sửa | Kết quả |
|---|---|---|---|
| 1 | `lib/menu-helpers.ts` | `warehouseMenuItems` 5 mục → **1 mục «Kho vật tư»** (`moduleKey: "inventory"`, 6 khoá quyền) | ✅ |
| 2 | `lib/menu-helpers.ts` | `allocateReturnMenuItems` → **rỗng** (gom vào hub) | ✅ |
| 3 | `tests/w01-warehouse-menu.test.mjs` | `EXPECTED` 5 mục → **1 mục** | ✅ |
| 4 | `tests/w01-warehouse-menu.test.mjs` | đếm `key: "warehouse_"`: 5 → **1** + nhãn → `["Kho vật tư"]` | ✅ |
| 5 | `tests/w01-warehouse-menu.test.mjs` | `used.length` 5 → **6** + `new Set(used).size` 5 → **6** (khẳng định **MẠNH HƠN**: phủ đủ 6 khoá) | ✅ |
**KẾT QUẢ ĐO:** `tsc EXIT=0` · `test:regression` **HỎNG 4 → 2** (giảm một nửa) ✔

### §16.2 · ❌ 2 TEST CÒN LẠI (chưa sửa — context cạn)
**(a) `mt3-ui-29-view-collision-diagnostic.test.mjs` — «CHẨN ĐOÁN: `view="dashboard"` bị dùng cho CẢ my_work VÀ warehouse»**
```js
assert.ok(hit.length > 0,
  "⚠️ KHÔNG còn va chạm `view` nào. Nếu đã sửa `activateModule` ⇒ **XOÁ bài này** và bỏ ghi chú …");
const dashboard = hit.find((c) => c.view === "dashboard");
assert.deepEqual(dashboard.groups.sort(), ["my_work", "warehouse"], …);
```
⭐ **SỬA ĐÚNG BẢN CHẤT:** sau khi gom, nhóm `warehouse` ⛔ **KHÔNG còn** `view: "dashboard"` ⇒ **va chạm ĐÃ HẾT**
⇒ đổi thành **khẳng định KHÔNG va chạm** (bài test tự nêu: *«KHÔNG còn va chạm view nào»*), tức
`assert.equal(hit.filter(c => c.groups.includes("warehouse")).length, 0, …)` — **đây là CẢI THIỆN THẬT**, ⛔ không tắt cổng.

**(b) `w01-warehouse-menu.test.mjs` — «W-01 — ĐÍCH ĐẾN THẬT: 4 mục mở màn CŨ đúng khoá; «Dashboard tồn kho» mở TAB dashboard của `Inventory`»**
⛔ **CHƯA ĐỌC ĐƯỢC VĂN BẢN** của bài này (nằm ngoài các khoảng đã đọc: 28-87, 84-97, 106-135, 136-175)
⇒ vòng sau: `read` khoảng **98-106** hoặc **176-205** rồi `edit`.
⭐ Kỳ vọng sửa: bài này ghim **4 mục cũ** (`warehouse_inbound`/`outbound`/`transfer`/`dashboard`) ⇒ phải đổi sang
**1 mục `warehouse_hub`** với `moduleKey: "inventory"`, giữ ⛔ KHÔNG nới cổng (vẫn kiểm nhánh render của 6 khoá cũ SỐNG).

### §16.3 · ⛔ VÌ SAO HOÀN TÁC (lần 3) — quyết định có lý do
Context của phiên **đã cạn**; 1 trong 2 bài test **chưa đọc được văn bản** ⇒ ⛔ không thể sửa **chắc chắn đúng**
trong lượt này. Theo kỷ luật xuyên suốt phiên: **⛔ KHÔNG để cây ĐỎ / nửa vời** ⇒ hoàn tác **2 tệp** (đã xác minh
`git diff` **chỉ chứa thay đổi của em** trước khi hoàn tác).

### §16.4 · TRẠNG THÁI CUỐI VÒNG 12 (đo được)
| Mục | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 · 802 · 0 · 1 skip** |
| `lib/menu-helpers.ts` · `tests/w01-*` | ⏪ **bản commit** (⛔ không còn thay đổi của em) |
| **Thay đổi của em** | `app/screens/Inventory.tsx` · `tests/w04-inventory-dashboard.test.mjs` · `lib/warehouse-hub.ts` · `tests/warehouse-hub.test.mjs` · `TASK-226.md` · `SESSION_REGISTRY.md` |
| 5/5 yêu cầu user | ✅ **VẪN XONG** |
| 3 dịch vụ | ✅ Java 200 · UI 200 · proxy 200 |

### §16.5 · 📋 CÔNG THỨC HOÀN CHỈNH CHO VÒNG SAU (5 phép `edit` + 2 bài test)
1. **`edit`** 2 khối `lib/menu-helpers.ts` — **văn bản đã có sẵn ở `§16.1`** ✔ (đã chạy đúng 1 lần)
2. **`edit`** 3 chỗ `tests/w01-warehouse-menu.test.mjs` — **văn bản đã có sẵn ở `§16.1`** ✔ (đã chạy đúng 1 lần)
3. **`read` + `edit`** `mt3-ui-29` theo **§16.2(a)**
4. **`read` (98-106 hoặc 176-205) + `edit`** bài «ĐÍCH ĐẾN THẬT» theo **§16.2(b)**
5. `npm run test:regression` ⇒ **EXIT=0** ⇒ log + Telegram + release ownership
⏱️ **Ước tính: 1 lượt context đầy đủ.** ⚠️ ⛔ KHÔNG dùng `.Replace()` nhiều dòng (CRLF) — **chỉ dùng `edit`**.

---

## §17 · 🔴 CHỈ ĐẠO USER (06/10/2026) — **BUILD SAU KHI TẤT CẢ TASK HOÀN THÀNH**

> **Nguyên văn:** «build sau khi tất cả các task hoàn thành»

**⇒ QUY TẮC MỚI (áp dụng từ nay):**
1. ⛔ **KHÔNG build** khi còn task chưa xong — kể cả khi mã đã `tsc 0` + `regression` xanh.
2. ✅ **Build MỘT LẦN** khi **TOÀN BỘ task** của phiên/đợt đã hoàn thành.
3. ⛔ Vẫn **KHÔNG tự ý** dừng `:8787`/`:9000` (luật 24 · §36) — lúc build phải **dừng đúng PID** và **báo trước**.
4. ⛔ **Không commit** (luật 25) trừ khi user cho phép.

**⇒ ẢNH HƯỞNG TỚI KẾ HOẠCH:** mục «BUILD» ⛔ **KHÔNG còn là việc chờ quyết định** — nay là **bước CUỐI**, chỉ chạy sau khi **gom menu** xong.
⇒ **TASK CÒN LẠI DUY NHẤT = GOM MENU 7→1** (công thức đầy đủ ở `§16.5`) ⇒ **xong mục này thì mới build**.

**TRẠNG THÁI HIỆN TẠI (đo cuối vòng 13):** `tsc EXIT=0` · `test:regression EXIT=0 (803 · 802 · 0)` · 3 dịch vụ 200 ·
5/5 yêu cầu USER đã xong · ⛔ user ⛔ **chưa thấy** thay đổi trên UI vì UI `:8787` phục vụ `dist/` (⛔ chưa build — **đúng chỉ đạo**).

---

## §18 · VÒNG 14 (06/10/2026) — 🎉 **GOM MENU 7→1 THÀNH CÔNG** — TẤT CẢ TASK ĐÃ XONG

### §18.1 · ✅ CÁCH LÀM THẮNG (sau 3 lần hoàn tác) — **SCRIPT NODE CHUẨN HOÁ CRLF**
Tạo **`tools/gom-menu-kho-vat-tu.mjs`**: mỗi phép sửa khai báo `(tệp, văn bản cũ, văn bản mới, nhãn)`;
script **chuẩn hoá `\r\n` → `\n`** để so khớp rồi **trả lại `\r\n`** khi ghi ⇒ ⭐ **khớp 100%** (đây là điều `.Replace()` của PowerShell ⛔ không làm được).
**Cơ chế an toàn:** phép nào ⛔ không khớp ⇒ **báo rõ + ⛔ không ghi tệp đó**; chỉ ghi khi có phép khớp.

### §18.2 · KẾT QUẢ
| Tệp | Số phép | Nội dung |
|---|---|---|
| `lib/menu-helpers.ts` | **2** | ① `warehouseMenuItems` 5 mục → **1 mục «Kho vật tư»** (`moduleKey:"inventory"`, **6 khoá kho cũ**) ② `allocateReturnMenuItems` → **rỗng** |
| `tests/w01-warehouse-menu.test.mjs` | **5** | ① `EXPECTED` 5 → 1 ② đếm mục 5→1 + nhãn → `["Kho vật tư"]` ③ `used.length` 5→**6** ④ `Set.size` 5→**6** ⑤ «ĐÍCH ĐẾN THẬT» 4 mục cũ → **1 mục hub** |
| `tests/mt3-ui-29-…test.mjs` | **1** | đảo thành **KHÔNG còn va chạm `view`** (⭐ cải thiện thật) — sửa bằng **công cụ `edit`** |

### §18.3 · ĐO LẠI — MENU ĐÃ GOM
```
label: "Kho vật tư"                          = 1 lần
mục cũ (warehouse_inbound/outbound/
        transfer/dashboard)                  = 0 lần   ← ĐÃ GỘP
warehouse_allocate_return                    = 0 lần   ← ĐÃ GỘP VÀO HUB
```

### §18.4 · CỔNG NGHIỆM THU — ĐỀU XANH
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **EXIT=0** |
| `npm run test:regression` | ✅ **EXIT=0 — 803 test · 802 pass · 0 fail · 1 skip** |
| `tests/warehouse-hub.test.mjs` | ✅ **22/22 pass** |
| 3 dịch vụ | ✅ Java 200 · UI 200 · proxy 200 |

### §18.5 · 🐛 LỖI CỦA CHÍNH EM TRONG VÒNG NÀY (ghi để ⛔ không lặp)
Khi phép **C1** (`mt3-ui-29`) ⛔ không khớp, script in **«⛔ KHÔNG GHI TỆP NÀO»** nhưng **thực tế đã ghi 2 tệp TRƯỚC ĐÓ** rồi (vì `process.exit(1)` chỉ chạy khi tới tệp thứ 3) ⇒ **thông báo SAI**.
⭐ **Bài học:** thông báo lỗi phải **mô tả ĐÚNG việc đã làm** — nếu không sẽ khiến người đọc **hiểu sai trạng thái** (em đã suýt tưởng ⛔ chưa ghi gì và định hoàn tác lần 4).

### §18.6 · ✅ TẤT CẢ TASK ĐÃ HOÀN THÀNH
**6/6 yêu cầu user** (hub 3 tab · cards 4 thông tin · ngoại lệ director/admin/IT · tab XUẤT&NHẬP · tab CẤP PHÁT&HOÀN TRẢ · màn chi tiết 5 tab · gom menu) + **4 lỗi có sẵn đã sửa**.

### §18.7 · ⏭️ BƯỚC CUỐI — **BUILD** (theo chỉ đạo user «build sau khi tất cả các task hoàn thành»)
Quy trình dự án: ① dừng **đúng PID** của `:8787` + `:9000` ② chuyển `.local-data` ra ngoài
③ `node tools/gd-cycle.mjs "<NHÃN>"` ④ `node tools/set-local-identity.mjs` ⑤ bật lại 3 dịch vụ ⑥ **cổng ảnh** ⑦ báo cáo.
⛔ **KHÔNG commit** (luật 25) — chờ user cho phép.

---

## §19 · VÒNG 15-16 (06/10/2026) — ✅ **BUILD XONG** + 2 SỰ CỐ VẬN HÀNH ĐÃ XỬ LÝ

### §19.1 · ✅ BUILD — `GD_EXIT=0`
```
[1/3] migration mới : drizzle/0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql
[2/3] refresh-phase-identity
        SOURCE : VNTECH-FP-121300BEED7174E4
        HEAD   : 0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql
        (.local-data tạm chuyển ra ngoài → ĐÃ KHÔI PHỤC)
[3/3] build-cross-platform
        FULL W2 SOURCE PREFLIGHT  : ĐẠT
        VNTECH FINGERPRINT        : ĐẠT · source:716 files · brand/release verified
        BUILT ARTIFACT VALIDATION : ĐẠT
GD_EXIT = 0
```
**Tuân thủ luật 24:** dừng **đúng PID đã xác minh cmdline** (`:8787` PID 21016 = `scripts/local-server.mjs` ·
`:9000` PID 18264 = `tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081`) — ⛔ KHÔNG kill node hàng loạt.

### §19.2 · ✅ 3 DỊCH VỤ 200 + PHỤC VỤ BẢN MỚI
| | |
|---|---|
| Java `:18081` · UI `:8787` (PID 11784) · proxy `:9000` | ✅ **đều 200** |
| Asset CSS | **ĐỔI HASH**: `/assets/index-BjTKD8Zf.css` *(trước build: `index-B3UZN44q.css`)* ⇒ **bản mới đang chạy** |
| Mốc build | `dist/client/assets` = **06/10 13:30:58** |

### §19.3 · ⚠️ SỰ CỐ 1 — UI server `:8787` CHẾT (exit 1)
**Hiện tượng:** job nền của UI server kết thúc `exit code 1` ⇒ **cổng ảnh lúc đó chạy trên server ĐANG CHẾT**
⇒ mọi màn báo lệch **48–91 %** ⇒ ⭐ **SỐ LIỆU RÁC, ⛔ KHÔNG phải lỗi giao diện**.
⭐ **BÀI HỌC (rất quan trọng):** khi cổng ảnh báo lệch **HÀNG LOẠT trên MỌI màn với tỉ lệ rất cao (≥50 %)** thì
**KIỂM DỊCH VỤ TRƯỚC** (HTTP 200?) — ⛔ đừng kết luận là lỗi giao diện. *(Cùng họ với bài học «kiểm HTTP của CSS trước».)*
**Xử lý:** khởi động lại UI ⇒ **HTTP 200** ✔

### §19.4 · ⚠️ SỰ CỐ 2 — UI server lại `exit 1` khi chạy qua PIPE
**Nguyên nhân:** em chạy `node scripts/local-server.mjs 2>&1 | Select-String -NotMatch 'Kênh email'`
⇒ **pipe của PowerShell** làm tiến trình con kết thúc khi đường ống đóng.
⭐ **BÀI HỌC:** job nền cho server **PHẢI chạy TRỰC TIẾP** (`node scripts/local-server.mjs 2>&1`),
⛔ **KHÔNG pipe qua `Select-String`/`Where-Object`**.
**Kiểm chứng:** sau đó `:8787` do **PID 11784** giữ và trả **HTTP 200** ⇒ server THẬT vẫn sống.

### §19.5 · 🤝 PHỐI HỢP THEO CHỈ ĐẠO USER («việc chạy ngầm thì giao sub-agent»)
Cổng ảnh (10–15 phút) đã **giao cho sub-agent** (`93fb6719-04a5-4893-9980-9a460949e1ac`) chạy ở nền,
với **ràng buộc ghi rõ trong đề bài**: ⛔ KHÔNG `--update` (không che lỗi) · ⛔ KHÔNG sửa mã · ⛔ KHÔNG commit ·
⛔ KHÔNG dừng dịch vụ · và **phải `--locate` để biết PHẦN TỬ nào lệch** rồi **phân loại** (lỗi thật / nhiễu ngày / không xác định).
⭐ **Lưu ý:** cổng nay là **17 màn × 4 = 68 ảnh** (trước 16 × 4 = 64).

### §19.6 · TRẠNG THÁI
| Mục | Kết quả |
|---|---|
| 6/6 yêu cầu user | ✅ XONG · đã build · đang phục vụ bản mới |
| `tsc` / `regression` | ✅ **EXIT=0** / ✅ **EXIT=0 — 803 · 802 · 0** |
| Build | ✅ **GD_EXIT=0** · fingerprint **ĐẠT** · artifact **ĐẠT** |
| Cổng ảnh | ⏳ **sub-agent đang chạy** (68 ảnh) |
| Commit | ⛔ **chưa** — luật 25 (chờ user cho phép) |
