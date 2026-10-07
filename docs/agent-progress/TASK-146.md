# TASK-146 — VÒNG GO-LIVE 1 · 10 YÊU CẦU USER + 4 BUG (mục 1→8, 10)

| | |
|---|---|
| **Ngày** | 02/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit** — USER dặn «Chưa commit, để tôi xem trước») |
| **Trạng thái** | ✅ **9/10 yêu cầu XONG** · ⛔ **mục 9 BLOCKED** (chờ USER duyệt chạy Flyway) |
| **Tệp mã sửa** | `app/screens/Purchasing.tsx` · `app/styles/canonical.css` |
| **Tệp cổng sửa** | `scripts/css-baseline-audit.mjs` · `tests/moc121-purchasing-tabs.test.mjs` · `tests/v211-purchasing-mat-tab.test.mjs` |
| **Tệp test mới** | `tests/d105-jsx-comment-textnode.test.mjs` · `tests/d107-bang-pr-khop-so-o.test.mjs` · `tests/v1-muc3-…` · `tests/v1-muc4-…` |
| **Vân tay** | `VNTECH-FP-F5CCE656F23BD18E` · **710 tệp** · brand `76714191eb7f31ea…` · release **không đổi** |

---

## ① ⛔ ĐỌC TRƯỚC: `:8787` LÀ BẢN BUILD TĨNH — **KHÔNG CÓ HMR**

`scripts/local-server.mjs` phục vụ **bundle đã build**. Sửa `.tsx` **không** tự lên màn hình.
Muốn thấy thay đổi phải chạy **đủ chuỗi**:

```text
xoá probe tạm ở repo root
  → node <probe fixpoint>          (thường 2 vòng)
  → node scripts/verify-vntech-fingerprint.mjs      (ĐẠT)
  → copy .local-data/warehouse.sqlite → .bak-…
  → node tools/set-local-identity.mjs               (KHỚP: true)
  → npm run build
  → DỪNG ĐÚNG PID của scripts/local-server.mjs rồi chạy lại
  → node tools/verify-ui-build-applied.mjs --port=8787
  → npm test
```

⛔ **Kết luận cổng UI bằng 3 dấu ✓ + dòng `KET LUAN`, KHÔNG bằng exit code** — exit code **không tất định**
(D-103: 8 lần chạy, 2/5 `EXIT=0`, 3/5 văng `0xC0000409`, cả 8 lần đều in đủ 3 ✓).
⛔ `docs/` và `testlog.md` **không** nằm trong vân tay ⇒ viết tài liệu **không** cần chạy lại chuỗi build.

---

## ② 10 YÊU CẦU GO-LIVE — TRẠNG THÁI

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | NCC & Đối tác vào **cuối** menu Mua hàng | ✅ **không cần sửa mã** | đã nằm sẵn ở cuối nhóm (desktop + mobile) |
| 2 | Tab PR/PO/Lũy kế theo **khuôn tabbar menu Công việc** | ✅ | `moc121` **10/10** · cổng CSS **ĐẠT** · có đối chứng âm |
| 3 | Xoá **thông tin thừa** dưới nhóm nút | ✅ | `tests/v1-muc3-…` **7/7** |
| 4 | Nút sắp xếp → **«Mới nhất»/«Cũ nhất»** | ✅ | `tests/v1-muc4-…` **5/5** |
| 5 | Mỗi tab **chỉ hiện 1 danh sách** | ✅ | `tests/v1-muc5-…` **7/7** |
| 6 | Nút «xem phiếu đề nghị nguồn» trong modal PO | ✅ FIXED | BUG-20261002-001 |
| 7 | Xem **chi tiết PR** trong bảng PR | ✅ | `tests/v1-muc7-…` **6/6** |
| 8 | Tab-modal **phân quyền** lưu không được | ✅ FIXED | BUG-20201002-002 |
| 9 | Đổi tên menu «MUA HÀNG & PO» → **«PR & PO»** | ⛔ **BLOCKED** | mã + `V35__moc121_pr_po_menu_label.sql` **đã xong**; thiếu build JAR + **duyệt chạy Flyway** |
| 10 | Cập nhật tiến độ vào checklist | ✅ | `docs/dsh-state/CHECKLIST.md` nhóm A–E, bảng tiến độ **13/14** |

---

## ③ 4 BUG CỦA ĐỢT NÀY — ĐÃ ĐÓNG CẢ 4

| BUG ID | Module | Severity | Root cause (ĐO ĐƯỢC, không đoán) | Fix |
|---|---|---|---|---|
| **BUG-20261002-001** | Trung tâm phê duyệt / PO | HIGH | `window.alert` là **MÃ CHẾT** + `title` hứa hư | theo mẫu `ReceiptDrawer.tsx:31` |
| **BUG-20201002-002** | Quản trị › Phân quyền | **CRITICAL** | `UserManagementUseCase.java:480-511` chặn **HTTP 400 trước** `runAtomically`; thông báo bị `.overlay` z-index 100 **che** ⇒ user thấy «không lưu được» mà **không có lý do** | `.toast` z-index 9600 + `.toast.error span{background:#d93b49}` |
| **BUG-20261002-003** | Mua hàng (mọi tab) | **CRITICAL** | comment `/* … */` **TRẦN** trong JSX là **TEXT NODE** ⇒ **vẽ nguyên khối chữ ra màn hình**. Chỉ `{/* … */}` mới là comment | bọc `{/* … */}` tại `Purchasing.tsx:339-345` |
| **BUG-20261002-004** | Bảng PR (**thead**) | HIGH | dòng dữ liệu phát **12 ô `<td>`** nhưng tiêu đề chỉ **11 ô `<th>`**; ô thứ 3 **SAO CHÉP** ô thứ 2 (chỉ đảo ưu tiên `a\|\|b` ↔ `b\|\|a`) ⇒ **mọi cột từ «Người đề nghị» lệch sang phải** | gỡ ô sao chép tại `Purchasing.tsx:348` |

⭐ `BUG-20261002-004` **có TRƯỚC** thay đổi của vòng này: `git diff` xác nhận bản `HEAD` **cũng** 11 ô / 10 tiêu đề.
⭐ `BUG-20261002-003` do **chính bản sửa mục 3** của vòng này gây ra — ghi nhận thẳng, không giấu.

---

## ④ VÌ SAO CÁC LỖI NÀY LỌT QUA **MỌI** CỔNG

| Cổng | BUG-003 (chữ comment) | BUG-004 (lệch cột) |
|---|---|---|
| `npx tsc --noEmit` | ✅ EXIT=0 | ✅ EXIT=0 |
| `npm run build` | ✅ ĐẠT | ✅ ĐẠT |
| `tools/verify-ui-build-applied.mjs` | ✅ 3/3 ✓ | ✅ 3/3 ✓ |
| 80 vệ hợp đồng | ✅ XANH | ✅ XANH |
| **ESLint** | ⛔ **BẮT ĐƯỢC** (`react/jsx-no-comment-textnodes`) | — |
| Vệ **đếm cấu trúc** `<th>` ↔ `<td>` | — | ⛔ **KHÔNG TỒN TẠI** trước vòng này |

⇒ **Kết luận:** mọi phép đo cũ đều đọc **CHUỖI**. Hai lỗi này chỉ lộ khi **đếm cấu trúc** hoặc khi
**bộ phân tích cú pháp** (ESLint) lên tiếng. Đã bù bằng 2 tệp vệ mới (mục ⑤).
⭐ Riêng BUG-003: **ESLint đã báo ĐÚNG và tôi đã đọc, nhưng lại đi tìm chỗ khác** — đây là lỗi quy trình,
đã ghi thành D-105.

---

## ⑤ VỆ MỚI — VÀ **ĐỐI CHỨNG ÂM** CỦA TỪNG VỆ

| Tệp | Số vệ | Đối chứng âm (chạy thật) |
|---|---|---|
| `tests/d105-jsx-comment-textnode.test.mjs` | 3 | gỡ `{` của comment ⇒ **V1+V3 ĐỎ**; khôi phục ⇒ 3/3 XANH |
| `tests/d107-bang-pr-khop-so-o.test.mjs` | 4 | cài lại ô sao chép ⇒ **V1+V2 ĐỎ**; khôi phục ⇒ 4/4 XANH |
| `tests/moc121-purchasing-tabs.test.mjs` (cập nhật) | 10 | gỡ `gap` ⇒ **vệ ĐỎ** *và* **cổng CSS KHÔNG ĐẠT** |
| `scripts/css-baseline-audit.mjs` (cập nhật) | — | như trên |

⛔ **Bài học đắt nhất của vòng này:** vệ D-105 phải viết lại **4 lần** vì **VỆ RỖNG** — chỉ lộ ra nhờ
**đối chứng âm**:
1. quét trên `maCode(src)` — hàm **xoá sạch** comment ⇒ đi tìm thứ mình vừa xoá (D-106);
2. `new URL(...).pathname` giữ `%20` ⇒ `ENOENT` với đường dẫn có **khoảng trắng** (phải dùng `fileURLToPath`);
3. dò `return (` **bỏ sót `return <div …>` không ngoặc** — đúng dạng dùng ở `Purchasing.tsx:307`;
4. cờ `sauReturn` chỉ bật **một lần** ⇒ các `return` ở component sau bị bỏ qua.

---

## ⑥ ĐO CUỐI VÒNG (số thật, đo trên máy này)

| Phép đo | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **EXIT=0** |
| `npm test` | **751 tests · 750 pass · 0 fail · EXIT=0** · lint **0 error** (250 warning có sẵn) |
| `npm run audit:tests` | **128/135 tệp xanh** · 7 tệp đỏ **nằm NGOÀI cổng** (51 test case — **nợ đã biết**) |
| `node scripts/css-baseline-audit.mjs` | **ĐẠT** · dead classes=0 · dead vars=0 · **MỐC 121 tab contract=PASS** |
| `node scripts/verify-vntech-fingerprint.mjs` | **ĐẠT** · `VNTECH-FP-F5CCE656F23BD18E` · source **710 files** |
| `tools/set-local-identity.mjs` | «KHỚP: true» · trigger bảo vệ đã tạo lại |
| `node tools/verify-ui-build-applied.mjs --port=8787` | **3/3 ✓** (`do-moi` 74s · `van-tay` `f5cce656f23bd18e` · `byte` 6/6) |
| `:8787` | HTTP **200** · 7123 bytes |

---

## ⑦ QUYẾT ĐỊNH MỚI

| Mã | Nội dung |
|---|---|
| **D-103** | `verify-ui-build-applied.mjs` exit code **không tất định** ⇒ kết luận bằng **NỘI DUNG**, không bằng exit code |
| **D-105** | Trong JSX, `/* … */` **trần là CHỮ**, không phải comment; ⛔ không viết `{` `}` `*/` trong chú thích JSX |
| **D-106** | Vệ rỗng lần 2: **bóc chú thích rồi mới đi tìm chú thích**; bắt buộc có **đối chứng âm** |
| **D-107** | Lỗi hiển thị bảng phải có vệ **ĐẾM CẤU TRÚC** `<th>` ↔ `<td>`, không chỉ khớp chuỗi |
| **D-108** | Cổng test là `scripts/regression-suite.mjs` — **KHÔNG** phải mọi tệp trong `tests/` (glob rồi đếm đỏ ⇒ **báo động giả**) |
| **D-109** | Đổi thiết kế ⇒ phải cập nhật **MỌI** cổng đang khoá thiết kế cũ, **giữ nguyên phép kiểm**, chỉ trỏ lại selector + THÊM điều kiện |

---

## ⑧ BÀI HỌC

1. ⛔ **ESLint báo lỗi ở ĐÚNG vùng mình vừa sửa ⇒ đó là lỗi THẬT** — sửa trước, không chạy tiếp.
2. ⛔ **Đối chứng âm là thứ duy nhất phân biệt «đã có bảo vệ» với «tưởng là có bảo vệ».**
3. ⛔ **Đo sai tập ⇒ kết luận sai.** Tự glob `tests/**` rồi đếm đỏ = tính cả **nợ đã biết** (D-108).
4. ⭐ Trước khi chế lớp CSS mới: **đo khuôn nhà** (D-092). Mục 2 giải quyết bằng cách **bắt chước** `.work-center`.
5. ⭐ Khi nhiều cổng chặn một thay đổi UI: **cổng đang làm đúng việc** — nó ghi lại thiết kế cũ. Việc phải làm là
   **chuyển hợp đồng**, không phải xoá cổng.
6. ⭐ **User nhìn thấy thứ mình không thấy là BẰNG CHỨNG** — 2 bug của vòng này đều do user chụp màn hình/chỉ chỗ.

---

## ⑨ BLOCKER

⛔ **mục 9** — cần USER quyết: **build JAR backend** + **duyệt chạy Flyway** `V35`.
⛔ Các việc TYPE 3 đã ghi từ vòng trước (RBAC bypass `RbacService.java:69`, L-03, GRN-STO, duyệt `V32`–`V37`,
de-dup `project_boq_items`, commit…) — **không tự quyết, không hỏi lại lần thứ ba**.
⛔ **Chưa commit gì** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE`).
