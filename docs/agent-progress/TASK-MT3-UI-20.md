# TASK-MT3-UI-20 — Ma trận #5: **BỊT LỖ HỔNG «RÒ MÃ THÔ TRẠNG THÁI»** bằng **1 bảng ánh xạ dùng chung**

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-20 (từ **đối chiếu MA TRẬN CHÍNH THỨC** `docs/dsh/MT3-UI-MATRIX.md` §B hàng #5) |
| **Phase** | **GĐ1 — FRONTEND** |
| **Status** | ✅ **HOÀN TẤT + CHỨNG MINH BẰNG 5 TEST** · contract **630 pass / 0 fail** |

## 🔎 NGUỒN PHÁT HIỆN — ⛔ không phải tôi tự nghĩ ra
Theo **§23 điều 1** («đọc lại toàn bộ Master Task»), tôi mở `MASTER_STATUS.md` ⇒ tìm được **MA TRẬN AUDIT CHÍNH THỨC**: **`docs/dsh/MT3-UI-MATRIX.md`** (84 dòng, 12 yêu cầu §B). Đối chiếu từng hàng thì phát hiện **hàng #5 vẫn CÒN**:
> *«#5 Trạng thái tiếng Việt — ❌ rò mã thô ≥5 nơi»* (§IV.6: *«1 bảng ánh xạ trạng thái dùng chung»*)

## 🔴 LỖ HỔNG THẬT (đo bằng máy, ⛔ không suy đoán)
| Bước đo | Kết quả |
|---|---|
| Đếm `StatusBadge value={String(` | **10 chỗ** |
| `app/components/ui/StatusBadge.tsx:63` | `{label ?? String(value ?? "")}` ⇒ **thiếu `label` là IN THẲNG mã thô** |
| `StatusBadge` có tự ánh xạ? | ⛔ **KHÔNG** — không import `status-labels`, không gọi hàm tra nhãn |
| 10 chỗ đó có truyền `label`? | ⛔ **CẢ 10 đều KHÔNG** ⇒ **rò mã thô** |

**10 chỗ rò** (đo được): `AllocateReturn.tsx:49` · `BenefitsScreen.tsx:22` · `CashbankScreen.tsx:29` · `CorrespondenceScreen.tsx:52` · `Inventory.tsx:239` · `LegalDocsScreen.tsx:26` · `ProjectDetailTabs.tsx:226` · `SealScreen.tsx:20` · `TeamManagement.tsx:122` · `page.tsx:3061`

## ✅ CÁCH BỊT — theo **§14 (1 component giải quyết nhiều màn)**, ⛔ KHÔNG sửa 10 màn riêng lẻ
`app/components/ui/StatusBadge.tsx` — khi thiếu `label` thì **tự tra `lib/status-labels.ts`** (bảng dùng chung).
⚠️ **Kèm CHỐT AN TOÀN** (⛔ chống hồi quy giao diện): **CHỈ tra khi giá trị TRÔNG NHƯ MÃ THÔ**
(`/^[a-z0-9_.-]+$/` — chữ thường + số + `_ . -`, ⛔ **KHÔNG dấu cách**).
**Vì sao cần chốt**: `statusLabel` có `humanize()` cho giá trị lạ ⇒ nếu `value` **đã là tiếng Việt** («Đang hoạt động») thì việc đổi hoa/thường là **hồi quy cosmetic**. Nhờ chốt này, **nhãn đã đúng được giữ NGUYÊN**, ⛔ chỉ mã thô mới được dịch.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/components/ui/StatusBadge.tsx` | ➕ `import { statusLabel } from "@/lib/status-labels"` · 🔁 fallback `label ?? (looksLikeRawCode ? statusLabel(value) : rawText)` + chú thích giải thích chốt an toàn |
| `tests/mt3-ui-20-status-badge-shared-labels.test.mjs` | ➕ **mới** — 5 ca |

## Testing — ✅ **5/5 test mới ĐẠT** + ⛔ **không hồi quy**
| Cổng | Kết quả |
|---|---|
| test mới (5 ca) | ✅ **`tests 5 · pass 5 · fail 0`** · `EXIT=0` |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 631 · pass 630 · fail 0 · skipped 1`** (= 626 cũ + **5 mới**) · **⛔ 0 hồi quy** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** · `dead classes=0 · dead vars=0` |
| `npm run verify:master-baseline` | ✅ **`ĐẠT`** |

## 5 ca test đã khoá hành vi
① `StatusBadge` **nạp bảng nhãn DÙNG CHUNG** (⛔ không giữ bảng riêng) · ② ⛔ **không còn** `label ?? String(value…)` (đường rò mã thô) · ③ **có chốt an toàn** (`looksLikeRawCode` + regex) · ④ `statusLabel` **dịch được mã thô**, trả **tiếng Việt có dấu**, và ⛔ **không lộ mã thô** cho giá trị lạ · ⑤ **nhãn đã đúng tiếng Việt có dấu cách ⇒ ⛔ KHÔNG bị tra bảng** (chống hồi quy cosmetic)

## ⚠️ LỖI CON TÔI ĐÃ MẮC VÀ TỰ SỬA (ghi để không lặp)
Tôi viết **cú pháp TypeScript** (`const isRaw = (v: string) => …`) **trong tệp `.mjs`** (JavaScript thuần) ⇒ `SyntaxError: Unexpected token ':'` ⇒ test hỏng.
📌 **QUY TẮC**: tệp `tests/*.test.mjs` là **JavaScript thuần** ⇒ ⛔ **KHÔNG** viết chú thích kiểu (`: string`). (Vẫn **được** `import` từ tệp `.ts` — khuôn đúng như `mt3-ui-12d-purchasing-hub-tabs.test.mjs`.)

## 📋 ĐỐI CHIẾU **TOÀN BỘ 12 HÀNG** MA TRẬN `docs/dsh/MT3-UI-MATRIX.md` §B (đo lại trên mã HIỆN TẠI)
> ⚠️ Ma trận đo ngày **26/09/2026** — **TRƯỚC** khi tôi làm GĐ1 ⇒ nhiều hàng **nay đã khác**. Đây là **đo lại**, ⛔ không chép lại kết luận cũ.

| # | Yêu cầu ma trận | KẾT QUẢ ĐO LẠI | Trạng thái |
|---|---|---|---|
| 1 | Menu cha mở màn có tab con (Thi công 0 tab · Kho 2→4 tab) | `purchasingHubTabs` **10 tab** + `Inventory` 4 tab | ✅ **ĐÃ ĐÓNG** |
| 2 | Bỏ «Chọn dự án» đầu trang (5 nơi) | `global-project-scope-chip` = **0** | ✅ **ĐÃ ĐÓNG** |
| 3 | Toolbar CRUD ngang chuẩn | `ListToolbar` **56 chỗ** dùng *(theo ma trận §A)* | ✅ **ĐÃ CÓ** |
| **4** | **Modal thay side panel** (Đơn hàng đã giao · Kho) | **`Inventory.tsx:220` VẪN là `<aside className="card inventory-transfer-panel">`** | 🔴 **CÒN THẬT** |
| **5** | Trạng thái tiếng Việt (⛔ rò mã thô) | **10 chỗ rò** ⇒ **ĐÃ BỊT** bằng 1 tệp + **5 test** | ✅ **ĐÃ ĐÓNG (phiên này)** |
| **6** | Export Excel/CSV cho Tổ đội · Danh mục VT · Công việc · Thi công | 🔴 **LỖ HỔNG THẬT — 3/4 màn THIẾU** *(xem đính chính bên dưới)* | 🔴 **CÒN THẬT** |
| 7 | Responsive 5 mức (thiếu mốc 320/375) | **thanh tra 5 mức rộng `320/375/768/1024/1440` = ✅ ĐẠT (EXIT=0)** | ✅ **ĐÃ ĐÓNG** |
| **8** | Toggle menu «tự ẩn khi đủ chỗ» | `mobile-nav-collapse` **chỉ ở `page.tsx:632`** | ⏳ **cần đọc logic** để chốt |
| **9** | Phân quyền nút (`Requests.tsx` · `P08PoNavigation.tsx`) | **`P08PoNavigation.tsx` (135 dòng) render ⛔ 0 `<button>`, 0 `onClick`, 0 `action`** ⇒ là thành phần **thuần ĐIỀU HƯỚNG**, ⛔ **không có hành động nào để gác quyền** ⇒ **yêu cầu KHÔNG ÁP DỤNG**. `Requests.tsx` **CÓ** `ReadOnly` | ✅ **⛔ không phải lỗ hổng** |
| 10 | Tab đầu dự án = «Thông tin dự án» · bỏ cột «Nguồn dữ liệu» | `ProjectDetailTabs.tsx:33` = `["Thông tin dự án", …]` | ✅ **ĐÃ ĐÓNG** |
| 11 | Bỏ «Lưu nháp» + «Gửi kiểm tra» | `ConstructionScreen.tsx:51` là **CHÚ THÍCH** *«ĐÃ BỎ 2 nút»* — 5 kết quả grep là **văn bản chú thích**, ⛔ không phải nút thật | ✅ **ĐÃ ĐÓNG** |
| 12 | Lịch sử tổ đội có Search/Sort/Filter | `TeamDirectory.tsx` **CÓ** `ListToolbar` + `teamHistoryRows` | ✅ **ĐÃ ĐÓNG** |

### ⇒ KẾT LUẬN ĐỐI CHIẾU
- ✅ **9/12 hàng ĐÃ ĐÓNG** *(#1 · #2 · #3 · #5 phiên này · #7 · #9 (không áp dụng) · #10 · #11 · #12)*
- 🔴 **2 hàng CÒN THẬT**: **#4** `Inventory.tsx:220` — `<aside>` → **modal** · **#6** — **3/4 màn ⛔ THIẾU nút xuất THẬT**
- ⏳ **1 hàng cần chốt ngưỡng**: **#8** toggle menu tự ẩn *(đề xuất **1024px** — mốc dự án đã dùng, ⛔ chờ user)*

## 🔴 ĐÍNH CHÍNH QUAN TRỌNG — TÔI ĐÃ BÁO **SAI** Ở HÀNG #6 (vòng trước)
**Điều tôi báo sai**: *«#6 — cả 4 màn ĐỀU CÓ dấu hiệu export»*.
**Sự thật (đo lại bằng CHỮ KÝ HÀM + import)**:
| Màn | Props | Gọi `lib/tabular-export`? |
|---|---|---|
| `TeamDirectory.tsx:360` | `{ data, action, permission }` | ⛔ **KHÔNG** |
| `MaterialListTable.tsx:24` | `{ data, open, permission }` | ⛔ **KHÔNG** |
| `WorkCenter.tsx:193` | `{ data, action, refresh, view }` | ⛔ **KHÔNG** |
| `ConstructionScreen.tsx` | — | ✅ **CÓ import + gọi hàm xuất** |
⇒ **3/4 màn THIẾU nút xuất THẬT** ⇒ **#6 là LỖ HỔNG THẬT**, đúng như ma trận gốc.

**VÌ SAO TÔI SAI**: tôi lấy **lớp CSS `export-`** làm bằng chứng có nút xuất — nhưng **chính ma trận `§A` đã cảnh báo**:
> *«`export-mini` (nút nhỏ rải rác) | **91** chỗ | ⚠️ nhiều nút **KHÔNG PHẢI** export nhưng dùng chung class»*

📌 **BÀI HỌC BỔ SUNG (lần thứ 4)**: ⛔ **KHÔNG lấy SỰ CÓ MẶT CỦA MỘT LỚP CSS / CHUỖI VĂN BẢN làm bằng chứng chức năng**.
Muốn kết luận một chức năng **CÓ**, phải chứng minh **ĐƯỜNG ĐI CHỨC NĂNG**: (1) `import` đúng thư viện, (2) **gọi hàm thật**, (3) hoặc **nhận qua props** từ cha.
*(Ma trận đã **cảnh báo trước** về đúng cái bẫy này mà tôi vẫn mắc.)*

## ⚠️⚠️ BÀI HỌC LẦN THỨ **BA** — CÙNG MỘT LOẠI LỖI (⛔ đáng ghi nhất)
Ở hàng **#6** và **#9** tôi **suýt kết luận SAI** vì tìm **một token duy nhất**:
- `#6`: grep `exportRows` ⇒ **⛔ 0 kết quả** ở cả 4 màn ⇒ tôi **gần như viết «4 màn CHƯA có nút export»**.
  **Kiểm RỘNG lại** (`export-` · `Xuất` · `csv` · `download` · `xlsx` …) ⇒ **cả 4 màn ĐỀU CÓ**.
- `#9`: grep `PermissionGuard` ⇒ 0 kết quả ⇒ **gần như kết luận «không kiểm quyền»**.
  **Đọc mã thật** ⇒ thành phần **⛔ không render hành động nào** ⇒ yêu cầu **không áp dụng**.

📌 **QUY TẮC (lần thứ 3 trong phiên — BẮT BUỘC tuân)**:
> ⛔ **KHÔNG BAO GIỜ** kết luận «thiếu/không có» từ **một token duy nhất**.
> Phải (1) thử **nhiều từ khoá đồng nghĩa**, (2) tìm trên **cả `.ts` lẫn `.tsx`** và **cả `app/` lẫn `lib/`**, (3) **đọc mã thật** ở chỗ nghi vấn trước khi kết luận.
> *(Ba lần suýt sai trong phiên: chuông thông báo — do đọc 1 dòng `<header>` khổng lồ · «duyệt trong modal» — do chỉ tìm `.tsx`/`app/` · và lần này #6/#9 — do 1 token.)*

## Next action
1. **Hàng #4**: chuyển `<aside className="card inventory-transfer-panel">` (`Inventory.tsx:220`) → **modal dùng chung** (`AppModal`).
2. Đo lại **#8 · #6 · #9 · #12** theo đúng ma trận để chốt.
3. ⛔ **`gd-cycle` CHƯA chạy được — BỊ CHẶN BỞI MÔI TRƯỜNG** (xem dưới).

## ⛔ CỔNG `gd-cycle` **CHƯA ĐẠT** — ⛔ **không phải lỗi mã**, là `.local-data` bị KHOÁ
Vì đã đổi `app/**`, tôi **bắt buộc** phải chạy `gd-cycle` (⛔ **không** dùng `npm run build` trần: báo `Source fingerprint không hợp lệ`). Kết quả chạy:
```
Error: EPERM: operation not permitted, rename '…\.local-data' -> '…\_vntech-buildstash'
  at renameSync (node:fs:1074:11)  at file:///…/tools/gd-cycle.mjs:74:3   EXIT=1
```
**Nguyên nhân**: `gd-cycle` cần **tạm chuyển `.local-data` đi** (dòng 74), nhưng **`.local-data` đang bị KHOÁ** — vì **Node UI ở cổng `:8787` ĐANG CHẠY** và đang mở chính thư mục đó.
📌 Khớp đúng ghi chú vận hành đã có: *«build cần DỪNG Node UI (8787) + proxy (9000)»*.

### ✅ VÌ SAO ⛔ TÔI **KHÔNG** TỰ DỪNG CỔNG 8787
**§11 của đề bài quy định rõ**: *«⛔ Không được tùy tiện `Stop-Process node` … Phải xác định đúng process/PID cần thao tác»*.
Cổng `:8787` **đã chạy TRƯỚC khi tôi bắt đầu** (là môi trường của user) ⇒ ⛔ **tôi không tự ý dừng** để tránh ngắt việc của anh.

### ✅ VÌ SAO TÔI ⛔ KHÔNG coi cổng này là «lỗi mã»
**5/6 cổng còn lại đều ĐẠT** trên đúng trạng thái đã sửa ⇒ lỗi **thuần tuý ở thao tác tệp của môi trường**, ⛔ không phải mã:
`tsc` **EXIT=0** · contract **630 pass / 0 fail** (gồm **5 test mới**) · regression **69/0** · `verify:css-baseline` **ĐẠT** · `verify:master-baseline` **ĐẠT**.

### ⚠️ HỆ QUẢ CẦN NÓI RÕ (⛔ không che)
Thay đổi ở `app/components/ui/StatusBadge.tsx` **CHƯA được xác minh bởi cổng build/fingerprint**.
✅ **CÁCH GỠ (cần anh cho phép, hoặc anh tự làm)**: dừng **đúng** tiến trình Node đang giữ cổng `:8787` → chạy `node tools/gd-cycle.mjs "MT3 UI-20 StatusBadge shared labels"` → **khởi động lại** UI `:8787` để trả môi trường về nguyên trạng.