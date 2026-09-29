# TASK-MT3-UI-21 — Ma trận #6: nút **XUẤT THẬT** cho 3 màn *(màn 1/3 xong)*

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-21 *(từ ma trận chính thức `docs/dsh/MT3-UI-MATRIX.md` §B hàng **#6**)* |
| **Phase** | **GĐ1 — FRONTEND** |
| **Status** | ✅ **HOÀN TẤT 3/3 MÀN + CHỨNG MINH** — ma trận **#6 ĐÓNG** |

## 🔴 LỖ HỔNG (đã xác minh lại bằng **CHỮ KÝ HÀM**, ⛔ không bằng lớp CSS)
Ma trận #6 nói: *«Tổ đội · Danh mục VT · Công việc · Thi công **không có nút export**»*.
**Đo lại**: chỉ `ConstructionScreen.tsx` **CÓ** import `lib/tabular-export` + gọi hàm thật.
`TeamDirectory` `{data,action,permission}` · `MaterialListTable` `{data,open,permission}` · `WorkCenter` `{data,action,refresh,view}` ⇒ ⛔ **không nhận prop xuất, ⛔ không import, ⛔ không gọi**.

## ✅ MÀN 1/3 — `app/screens/MaterialListTable.tsx` (Danh mục vật tư) — **XONG**
**Thay đổi** *(⛔ không tự viết lại CSV/Blob — dùng thư viện dùng chung)*:
1. ➕ `import { downloadCsv } from "@/lib/tabular-export";`
2. ➕ nút **`⤓ Xuất CSV`** *(mỏ neo `data-vntech="material-export-csv"`)* trong khối `material-list-filters`, có **`onClick` gọi hàm xuất thật**
3. ✅ Xuất **đúng `rows` ĐANG hiển thị** *(sau lọc + sắp xếp)*, ⛔ không xuất dữ liệu thô
4. ✅ Cột khớp bảng: **Mã vật tư · Tên chuẩn · *(Tên phụ nếu đang bật)* · Hệ M&E · Nhóm**
5. ✅ Tên tệp **`danh-sach-vat-tu`** *(thư viện tự xử lý tên an toàn + BOM UTF-8 cho Excel)*

**Bằng chứng phụ phát hiện được**: các nút CRUD ở cột Thao tác **mượn lớp CSS `export-mini`** *(L90–92)* dù ⛔ **không phải** nút xuất ⇒ **xác nhận đúng cảnh báo ma trận §A** *«91 chỗ, nhiều nút KHÔNG PHẢI export nhưng dùng chung class»*.

## 🧪 Testing — ✅ **5/5 test mới ĐẠT** + ⛔ **không hồi quy**
| Cổng | Kết quả |
|---|---|
| test mới `tests/mt3-ui-21-material-export.test.mjs` | ✅ **`tests 5 · pass 5 · fail 0`** |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 636 · pass 635 · fail 0 · skipped 1`** *(631 cũ + **5 mới**) ⇒ ⛔ **không hồi quy** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |

**5 ca test** *(khoá ĐÚNG quy tắc mới — chứng minh **đường đi chức năng**)*: ① `import` thư viện dùng chung · ② **GỌI HÀM thật** `downloadCsv(` · ③ nút có **`onClick`** + nhãn thấy được + mỏ neo đo được · ④ xuất theo **`rows` đã lọc** *(⛔ không dữ liệu thô)* · ⑤ **hành vi thật** của thư viện: `csvText(...)` giữ **ĐÚNG tiếng Việt có dấu** + có xuống dòng.

## ✅ MÀN 2/3 — `app/screens/TeamDirectory.tsx` (Tổ đội) — **XONG**
1. ➕ `import { downloadCsv } from "@/lib/tabular-export";`
2. ➕ nút **`⤓ Xuất CSV`** *(mỏ neo `data-vntech="team-export-csv"`)* trong slot `actions` của `ListToolbar` **danh sách tổ đội** (`:634`)
3. ✅ **Cột lấy ĐÚNG từ `TEAM_LIST_COLUMNS`** *(6 cột: Mã tổ đội · Tên tổ đội · Trạng thái · Thành viên · Dự án · Hoạt động gần nhất)* ⇒ ⛔ **không hard-code lại** tiêu đề *(§14)*
4. ✅ Xuất **đúng `rows` đang hiển thị** *(sau tìm + lọc dự án)*

### ⚠️ 2 LỖI KIỂU TÔI ĐÃ MẮC VÀ TỰ SỬA (ghi để không lặp)
Chạy `tsc` ⇒ **EXIT=2 · 2 lỗi**:
1. `Property 'status' does not exist` — ⚠️ kiểu dòng **đã có sẵn `statusLabel`** *(nhãn tiếng Việt tính sẵn!)*, ⛔ **không có `status`** ⇒ sửa thành **`row.statusLabel`**, ⛔ bỏ `statusLabel(row.status)`.
2. `Element implicitly has an 'any' type` — ⛔ **không index được bằng chuỗi** trên kiểu chặt ⇒ ép về **`Record<string, unknown>`** để tra theo `c.key`.
⇒ **Bài học**: **ĐỌC KIỂU DỮ LIỆU TRƯỚC** khi viết code truy cập trường — ⛔ đừng đoán tên trường. *(Nếu đoán, `tsc` bắt được ngay — nhờ chạy `tsc` sau MỖI lần sửa.)*

### ✅ Kiểm chứng màn 2/3
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 636 · pass 635 · fail 0 · skipped 1`** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** · `dead classes=0 · dead vars=0` |

## ✅ MÀN 3/3 — `app/screens/WorkCenter.tsx` (Công việc) — **XONG**
1. ➕ `import { downloadCsv } from "@/lib/tabular-export"` **+** `import { statusLabel } from "@/lib/status-labels"`
   *(dùng `statusLabel` để ⛔ **không rò mã thô** trạng thái ra tệp xuất — đúng tinh thần ma trận **#5**)*
2. ➕ nút **`⤓ Xuất CSV`** *(mỏ neo `data-vntech="work-export-csv"`)* trong **slot `actions` MỚI** của `ListToolbar` CÔNG VIỆC (`:263`)
3. ✅ **8 cột lấy ĐÚNG theo cột thật của `TaskTable`** *(đo tại `:414`)*:
   `taskNo` · `title` · `assignedToName` · `projectId` · `dueAt` · `priority` *(Khẩn/Cao/Thường)* · `progress` · `status` *(qua `statusLabel`)*
4. ✅ **⛔ KHÔNG đoán tên trường** — áp dụng đúng bài học rút ra ở màn 2 ⇒ **`tsc` sạch NGAY LẦN ĐẦU** *(⛔ không phải sửa lại)*

### 📌 BẰNG CHỨNG THÊM cho ma trận §A (lớp `export-mini` bị lạm dụng)
`WorkCenter.tsx:415-416`: các nút **tiến độ 25/50/75/100%** và nút **«Xong»** — ⛔ **không phải nút xuất** nhưng vẫn mang lớp **`export-mini`**.
⇒ ⛔ **Xác nhận lần nữa**: **sự có mặt của lớp CSS ⛔ KHÔNG phải bằng chứng chức năng** *(đúng điều ma trận §A đã cảnh báo: «91 chỗ, nhiều nút KHÔNG PHẢI export»)*.

### ✅ Kiểm chứng màn 3/3 — **TẤT CẢ ĐẠT**
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **`EXIT=0`** *(sạch ngay lần đầu)* |
| contract **toàn bộ** | ✅ **`tests 636 · pass 635 · fail 0 · skipped 1`** |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** · `dead classes=0 · dead vars=0` |
| `npm run verify:master-baseline` | ✅ **`ĐẠT`** |

## 🎯 KẾT LUẬN MA TRẬN **#6: ĐÓNG HOÀN TOÀN**
| Màn | Trạng thái |
|---|---|
| `ConstructionScreen.tsx` (Thi công) | ✅ **đã có sẵn từ trước** |
| `MaterialListTable.tsx` (Danh mục VT) | ✅ **ĐÃ THÊM + 5 test** |
| `TeamDirectory.tsx` (Tổ đội) | ✅ **ĐÃ THÊM** *(cột lấy từ `TEAM_LIST_COLUMNS`)* |
| `WorkCenter.tsx` (Công việc) | ✅ **ĐÃ THÊM** *(8 cột theo cột thật)* |
⇒ **4/4 màn có nút xuất THẬT** — ⛔ **không còn màn nào thiếu**.

## ⏳ CÒN LẠI (⛔ không che)
- 🔴 **Ma trận #4** — `Inventory.tsx:220` `<aside className="card inventory-transfer-panel">` → **modal** *(chủ ý hoãn: thay đổi **trực quan** mà ⛔ **không xem được ảnh** + cổng build bị chặn ⇒ 2 tầng không kiểm chứng)*.
- 🛑 **Ma trận #8** — ngưỡng «đủ chỗ» *(đề xuất **1024px**) — **chờ user**.
- ⛔ **Cổng `gd-cycle`** — vẫn bị chặn bởi **PID 18808** ⇒ **4 thay đổi `app/**` chưa được cổng build xác minh** *(StatusBadge · MaterialListTable · TeamDirectory · WorkCenter)*; ⚠️ nhưng **5/6 cổng còn lại ĐẠT**.

## 🚧 Blocker
⛔ **Cổng `gd-cycle` vẫn BỊ CHẶN** — `.local-data` bị **PID 18808** *(`node scripts/local-server.mjs`, chạy TRƯỚC phiên này)* giữ khoá ⇒ `EPERM: rename`. Theo **§11** ⛔ **không tự dừng**.
⚠️ **Hai thay đổi `app/**` chưa được cổng build xác minh**: `StatusBadge.tsx` *(#5)* + `MaterialListTable.tsx` *(#6 màn 1)* — **5/6 cổng khác ĐẠT**.

## Next action
1. Áp **ĐÚNG khuôn** trên cho `TeamDirectory.tsx` + `WorkCenter.tsx` ⇒ lại chạy `tsc` + contract + regression.
2. *(sau khi user gỡ blocker)* chạy `gd-cycle` cho **cả 3 thay đổi `app/**`**.
