# TASK-123 — `P-08`: MENU / ĐIỀU HƯỚNG **Nhà cung cấp ↔ PO ↔ Vật tư**

- **Ngày**: 22/09/2026 · **Nhánh**: `unity-p2-full-20260920`
- **Trạng thái**: **DONE** — phần MENU/ĐIỀU HƯỚNG đã hiện thực (trước đó ô TT đã ghi `**DONE**` nhưng **CHƯA có mã** nào hiện thực liên kết ⇒ lượt này bù đúng phần mã còn thiếu)
- **Phạm vi đã sửa** (`git diff --name-only`):
  - `lib/p08-nav-trace.ts` (MỚI — hàm thuần)
  - `app/screens/P08SupplierNavigation.tsx` (MỚI — khối điều hướng trên màn NCC)
  - `app/screens/P08PoNavigation.tsx` (MỚI — khối điều hướng trong màn chi tiết PO)
  - `app/screens/SupplierManager.tsx` (thêm prop `open` + 1 dòng gọi khối điều hướng)
  - `app/screens/PurchaseOrderDrawer.tsx` (1 import + 1 dòng gọi khối điều hướng)
  - `app/page.tsx` (**ĐÚNG 1 dòng** — truyền `open` cho màn NCC)
  - `tests/p08-supplier-po-material.test.mjs` (MỚI)
  - tệp hồ sơ này
- **Commit**: `fda82a3` (test) · `277265a` (thư viện hàm thuần) · `8613982` (nối UI) — commit từng bước nhỏ, ngay sau mỗi bước

## 1. Yêu cầu (NGUYÊN VĂN)

`docs/25_TODO_ROADMAP.md` dòng `P-08`, cột mô tả — **nguyên văn**:

> `P-08` | NCC | Liên kết Supplier ↔ MR/PR/PO ↔ Material — **CHƯA LÀM (22/09/2026)**, phụ thuộc `P-07` đang TODO; nay có thêm dữ liệu thật để kiểm: `purchase_orders.supplier_id` + 2 NCC (`TASK-108` đã INSERT 1 NCC thứ hai để dựng ca 1 PR → 2 PO)

**Phần còn thiếu xác định chính xác**: câu «Liên kết Supplier ↔ MR/PR/PO ↔ Material» có 2 nửa —

1. **Nửa DỮ LIỆU** (khoá ngoài có thật, không mồ côi) — **ĐÃ XONG 15/15 cặp · 0 mồ côi**, đo bằng
   `node tools/p2-reference-integrity.mjs` (dán ở mục 5). Gồm `purchase_orders.supplier_id`,
   `purchase_order_items.request_item_id`, `material_request_items.material_id`…
2. **Nửa MENU / ĐIỀU HƯỚNG** (đi từ NCC sang PO của NCC đó, PO sang vật tư) — **CHƯA CÓ MÃ NÀO**.
   Grep toàn kho cho thấy `purchase_orders.supplier_id` **KHÔNG được dùng ở đâu trong `lib/**`** để
   điều hướng (`lib/**` không có `supplierId` nào), và màn chi tiết PO (`PurchaseOrderDrawer.tsx`)
   chỉ hiện chuỗi NCC dạng văn bản, không có lối đi.

⇒ Lượt này hiện thực **đúng nửa còn thiếu (2)**. KHÔNG sửa dữ liệu, KHÔNG thêm khoá/migration.

## 2. Đã làm gì

### 2.1 Hàm THUẦN — `lib/p08-nav-trace.ts` (MỚI, **0 `import`**)

Đúng tiền lệ `lib/p2-po-trace.ts` · `lib/boq-line-display.ts` · `lib/p2-approval-timeline.ts`: 0 import,
test được offline bằng `node --import tsx`, không tạo import vòng vào `app/page.tsx`.

| Hàm | Việc | Chiều |
|---|---|---|
| `supplierPurchaseOrders(data, supplier)` | PO của MỘT NCC theo `supplier_id`; payload cũ thiếu `supplierId` thì LÙI về tên NCC và GHI RÕ `matchedBy` | NCC → PO |
| `purchaseOrderMaterialItems(po)` | Dòng vật tư của PO: `materialId`/`materialCode`/`materialName`/`unit` **lấy thẳng từ payload** | PO → Vật tư |
| `supplierToPurchaseOrderChain(data, supplier)` | Dựng TRỌN chuỗi NCC → PO → Vật tư + đếm dòng **CÓ nguồn** | NCC → PO → Vật tư |
| `requestItemsForMaterial(data, materialId)` | Dòng PR của một vật tư (namespace `data.requests[].items[].materialId`) | Vật tư → PR |
| `materialPurchaseOrders(data, materialId)` | PO chứa vật tư: khớp `poItem.materialId`; nếu dòng PO thiếu `materialId` thì nối qua `requestItemId` → dòng PR (**đúng cầu nối `BootstrapDataAdapter.java:289`**) | Vật tư → PO |
| `purchaseOrderSupplier(data, po)` | NCC của một PO (khớp `supplierId`, lùi về tên NCC) | PO → NCC |
| `buildP08NavGraph(data)` | Bản đồ 3 tầng + 2 loại cạnh (`supplierPoEdges`, `poMaterialEdges`) + đếm + `notes` «chưa có nguồn» | cả 2 chiều |
| `supplierNavLabel` · `poNavLabel` · `materialNavLabel` | Nhãn nút điều hướng bằng số THẬT | UI |

**Tên trường là tên ĐÃ ĐO trên payload bootstrap** (không đoán):

- `purchase_orders.supplier_id → supplierId`, `po_no → poNo`: `BootstrapDataAdapter.java:242-253`
- Dòng PO có `materialId`/`materialCode`/`materialName`/`unit` nhờ JOIN `material_request_items` + `materials`:
  `BootstrapDataAdapter.java:287-290` (cùng câu SQL)
- Dòng PO có `requestItemId`: `BootstrapDataAdapter.java:278`
- Dòng PR có `materialId`: `lib/request-context.ts:14`
- ⚠️ `purchase_order_items` **KHÔNG có cột `material_id`** (`PurchaseStoreAdapter.java:144-151`) ⇒ cầu nối vật tư
  **BẮT BUỘC** đi qua `request_item_id` → `material_request_items`; hàm đã cài đúng như vậy.

### 2.2 Khối MENU / ĐIỀU HƯỚNG trên UI

| Tệp | Khối | Việc |
|---|---|---|
| `app/screens/P08SupplierNavigation.tsx` (MỚI) | `data-vntech="p08-supplier-nav"` | Bảng NCC: mã · tên · **số PO của NCC đó** · số dòng vật tư nối được · đối chiếu theo `supplier_id`/`supplier_name` · nút **«Xem PO của NCC (n PO)»** mở đúng PO đầu tiên của NCC qua `open("poDetail", po)` (màn ĐÃ CÓ, không route mới) |
| `app/screens/P08PoNavigation.tsx` (MỚI) | `data-vntech="p08-po-nav-trace"` | Trong màn chi tiết PO: **PO → Vật tư** (bảng dòng PO: mã/tên vật tư THẬT · ĐVT · dòng PR nối sang · SL đặt · trạng thái nguồn) và **chiều ngược PO → NCC** (tên NCC + `supplier_id`/`supplier_name` + **các PO khác của cùng NCC**) |
| `app/screens/SupplierManager.tsx` | — | thêm prop **optional** `open?` + 1 dòng `{!partnerView && open && <P08SupplierNavigation data={data} open={open}/>}`; chế độ «Đối tác» (`P-07`) KHÔNG đổi hành vi |
| `app/screens/PurchaseOrderDrawer.tsx` | — | 1 dòng import + 1 dòng `<P08PoNavigation data={data} purchaseOrder={purchaseOrder} />` |
| `app/page.tsx` | — | **ĐÚNG 1 dòng**: `open={open}` cho `<SupplierManager …>`. KHÔNG đọc/vá gì khác của tệp |

- ⛔ **0 khoá `module_catalog` mới** · ⛔ **0 khoá module mới** (`MODULE_KEYS`/`ModuleKey` không đổi) ·
  ⛔ **0 migration** · ⛔ **0 INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE** · ⛔ **0 API/action mới**.
- Tương thích ngược: mọi prop mới đều optional; không có prop `open` ⇒ khối điều hướng không render (hành vi cũ y nguyên).
- Thiếu nguồn ⇒ hiện ĐÚNG chuỗi **«chưa có nguồn»** + LÝ DO (không nội suy số 0, không bịa tên vật tư).

## 3. Test ĐỎ → XANH

`tests/p08-supplier-po-material.test.mjs` (MỚI, **CỐ Ý không** nằm trong `package.json` ⇒ `test:regression` giữ nguyên 69 ca).

```
# ĐỎ — chạy khi CHƯA có `lib/p08-nav-trace.ts`
$ node --import tsx --test tests/p08-supplier-po-material.test.mjs
ℹ tests 17
ℹ pass 1
ℹ fail 16
EXIT=1

# XANH — sau khi có `lib/p08-nav-trace.ts`
$ node --import tsx --test tests/p08-supplier-po-material.test.mjs
ℹ tests 17
ℹ pass 17
ℹ fail 0
EXIT=0
```

17 ca: ① NCC→PO lọc đúng (KHÔNG lẫn PO của NCC khác) · ①b NCC chưa có PO · ② PO→Vật tư lấy mã/tên THẬT ·
②b dòng PO thiếu nguồn ⇒ «chưa có nguồn» + lý do · ②c PO không kèm `items` · ③ chuỗi đầy đủ NCC→PO→Vật tư ·
④ Vật tư→PO · ④b cầu nối `requestItemId` · ④c vật tư chưa từng đặt · ④d PO→NCC (kể cả payload cũ thiếu `supplierId`) ·
④e `supplierId` không có trong danh mục · ⑤ bản đồ DAG đếm đúng · ⑤b payload thiếu khoá · ⑤c `null`/`undefined` ·
⑥ nhãn nút · ⑦ **kỷ luật**: module 0 import / 0 DB / 0 DDL-DML / 0 `module_catalog` / 0 `ModuleKey` ·
⑦b không tệp `drizzle/**` nào nhắc `p08-nav-trace`.

*Ghi chú trung thực:* ca ⑦b lần chạy đầu hỏng vì **lỗi phía test** (`git grep … || echo ""` trả chuỗi `""`),
không phải lỗi mã sản phẩm; đã sửa phép so sánh rồi chạy lại — bảng trên là **lần chạy SẠCH**.

## 4. Cổng phải xanh (đã chạy, dán nguyên kết quả)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Kiểu | `npx tsc --noEmit` | **EXIT=0** (0 lỗi) |
| Lint | `npm run lint` | **EXIT=0 · 0 error** (187 warning có sẵn của repo) |
| Hồi quy | `npm run test:regression` | **ℹ tests 69 · pass 69 · fail 0** |
| Workflow | `npm run test:workflow` | **`Workflow VNTECH ERP V5.3.0 FULL W2 passed…`** · EXIT=0 |
| Test mới | `node --import tsx --test tests/p08-supplier-po-material.test.mjs` | **tests 17 · pass 17 · fail 0** |
| Menu `T-01` | `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** · EXIT=0 |
| Màn dự án | `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT ✅** |
| UI cũ (DOM) | `node tools/probe-p2-ui-dom.mjs` | **5/5 dấu có thật trên DOM** · **ĐẠT ✅** |
| Truy vết `p2` | `node tools/p2-reference-integrity.mjs` | **15/15 cặp — 0 dòng mồ côi** · ĐẠT |
| Truy vết `p2` | `node tools/p2-trace-audit.mjs` | **5/5 chặng đầy đủ (0 mồ côi)** · ĐẠT |
| Tách PO `p2` | `node tools/p2-split-po-audit.mjs` | **ĐẠT — không dòng nào đặt vượt số lượng, không lệch rollup** |

⚠️ **Giới hạn đo được (nói thẳng, không tô hồng):** `probe-p2-ui-dom.mjs` đọc **bundle JS ĐANG ĐƯỢC PHỤC VỤ**
(`http://127.0.0.1:9000/assets/page-*.js`). Lượt này **KHÔNG build** (bị cấm) ⇒ bundle đang phục vụ **CHƯA chứa**
mã `P-08`; cổng `5/5` đó chứng minh **UI cũ KHÔNG vỡ**, **KHÔNG** chứng minh khối `p08-*` đã lên DOM thật.
Bằng chứng cho mã mới là `tsc` + 17 ca test hợp đồng + `lint`, KHÔNG phải ảnh chụp bundle.

## 5. Tiến độ (`probe-roadmap-progress`)

```
# TRƯỚC (đầu lượt, đo lại đúng lúc bắt đầu)
DONE        106 / 110  (96.4%)
TODO          2 / 110  (1.8%)
PHASE 2 — MUA HÀNG      8/9

# SAU
$ node tools/probe-roadmap-progress.mjs
DONE        107 / 110  (97.3%)
TODO          1 / 110  (0.9%)
PHASE 2 — MUA HÀNG      9/9
```

⚠️ **ĐÍNH CHÍNH so với dự kiến của đề bài** (báo cáo trung thực): mốc «106 → 107» **KHÔNG do lượt này**.
Khi tôi bắt đầu, trên **cùng nhánh** `unity-p2-full-20260920` đã có commit `fa9577e`
(«[P-08] Dong muc: o TT = **DONE** … MASTER_STATUS 106->107 DONE») — tức một lượt trước **đã đóng ô TT của `P-08`**
trong roadmap + MASTER_STATUS. Vì vậy:

- `docs/25_TODO_ROADMAP.md`: ô TT (index 10) dòng `P-08` **đã là `**DONE**`** sẵn ⇒ **tôi KHÔNG sửa** (sửa nữa là dư
  và có thể phá định dạng 12 ô). Cột «Việc» (index 8) **đã** có dòng dẫn chứng.
- `docs/agent-progress/MASTER_STATUS.md`: **đã** DONE **107** · TODO **1** · PHASE 2 **9/9** ⇒
  **DONE+BLOCKED+TODO = 107+2+1 = 110** ⇒ **tôi KHÔNG sửa ô số nào**.
- ⇒ **0 dòng** thay đổi ở 2 tệp tiến độ trong lượt này (đúng thực tế).

Điểm cần captain biết: ô TT của `P-08` **được đóng TRƯỚC khi có mã** — lượt này mới bổ sung mã điều hướng.
Nếu `docs/28_*` / kế hoạch nào cần ánh xạ «mục DONE ⇒ có mã», `P-08` nay đã khớp.

## 6. BLOCKED / UNKNOWN + câu hỏi cho captain

1. **Đã hết chặn** cho phạm vi `P-08` (menu/điều hướng). Không còn UNKNOWN chặn.
2. **UNKNOWN (chỉ để biết, KHÔNG chặn)**: khối `P08PoNavigation` cố ý **không** thêm `data-vntech` vào asset bundle
   mới ⇒ muốn cổng DOM đo được `p08-*`, cần một lượt **được phép build** (`npm run build:web` + `dsh web`) do captain
   chạy — lượt này bị cấm build. Đề nghị captain xác nhận có muốn bổ sung cổng DOM cho `p08-*` không.
3. **UNKNOWN 2**: màn NCC đã có lối «Xem PO của NCC (n PO)» **chỉ mở PO ĐẦU TIÊN** (màn chi tiết PO là màn DUY NHẤT
   hiện có; bảng xổ nhiều PO trong cùng màn chi tiết cần `EntityDetailModal` mở rộng — ngoài phạm vi). Đủ để «đi NCC → PO»
   nhưng nếu captain muốn **danh sách N PO xổ tại chỗ**, xin cho biết để mở một lượt riêng.

## 7. Kiểm chứng «không phá gì» / «không vượt ràng buộc»

- `git diff --name-only` của 3 commit P-08 **CHỈ** gồm: `lib/p08-nav-trace.ts` · `app/screens/P08SupplierNavigation.tsx` ·
  `app/screens/P08PoNavigation.tsx` · `app/screens/SupplierManager.tsx` · `app/screens/PurchaseOrderDrawer.tsx` ·
  `app/page.tsx` · `tests/p08-supplier-po-material.test.mjs`.
- ⛔ **KHÔNG** stage/sửa `AGENTS.md` · `docs/28_*` · `.docx` · `.xlsx` · `tsconfig.tsbuildinfo` · `scripts/**` ·
  `java-backend/**` · `drizzle/**` · `tools/baseline/**` · `docs/agent-progress/TASK-094…122.md`.
  (`scripts/system-route.mjs` đang **M** trong worktree — **thay đổi có SẴN của lượt `W-03` khác**, KHÔNG phải của tôi,
  tôi **không stage**, tôi **không sửa**.)
- `tests/p2-25-*.test.mjs` + `tests/q1-*.mjs` giữ nguyên **untracked**.
- ⛔ Không `git add -A` · không push · không build · không start/stop dịch vụ (`8787`·`9000`·`18081`).
