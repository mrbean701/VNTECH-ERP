# TASK-190 — GO-LIVE ĐỢT 45: THỬ QUÉT TĨNH LỖI SQL — ⛔ **PHƯƠNG PHÁP KHÔNG ĐÁNG TIN** (tự bác bỏ, ⛔ không báo lỗi giả)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Giả thuyết** | ⭐ Sau khi tìm ra **BUG-20261005-013** (cột ⛔ chưa bao giờ tồn tại), **hẳn còn lỗi SQL cùng loại** ⇒ **quét TĨNH mọi tham chiếu `bảng.cột`** trong adapter ⇄ lược đồ MySQL thật |
| **Kết quả** | ⛔ **PHƯƠNG PHÁP KHÔNG ĐÁNG TIN**: **39 ứng viên ⇒ 38 BÁO ĐỘNG GIẢ** · ⭐ **1 cái thật thì đã biết** ⇒ ⛔ **⛔ KHÔNG báo lỗi nào** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (chỉ thử nghiệm + tự bác bỏ) |
| **Vân tay** | ⛔ **không đổi** |

---

## ① PHÉP THỬ — QUÉT TĨNH 3445 THAM CHIẾU

| Bước | Số đo |
|---|---|
| Adapter quét | **30** |
| Lược đồ MySQL thật | **131 bảng · 679 cột phân biệt** |
| Tham chiếu `X.Y` trích được | **3445** |
| ⛔ Ứng viên «cột ⛔ không tồn tại ở bất kỳ bảng nào» | **39** |

---

## ② ⛔ KẾT QUẢ — **38/39 LÀ BÁO ĐỘNG GIẢ**

### Nhóm 1 — ⛔ **TÊN GÓI JAVA / TÊN TỆP / LỜI GỌI HÀM** (hiển nhiên, ~20 ca)
`org.springframework` · `com.vntech` · `erp.application` · `erp.domain` · `erp.infrastructure` · `persistence.jpa` · `port.out` · `jdbc.core` · `beans.factory` · `vntech.files` · `route.mjs` · `page.tsx` · `shared.tsx` — ⛔ **không phải SQL** ✓
`contains` · `resolve` · `update` · `run` · `admin` · `data` · `items` · `rows` · `map` — ⛔ **lời gọi hàm / khoá JSON** ✓
`ump.can_` — ⛔ **regex cắt cụt một chuỗi nối động** ✓

### ⭐ Nhóm 2 — **QUAN TRỌNG NHẤT: ALIAS ĐẦU RA CỦA **TRUY VẤN CON** (~9 ca «trông như cột thật»)
Các cột bị gắn cờ đều nằm trong **`COALESCE(alias.cột, 0)`**:
| Cột bị gắn cờ | Ngữ cảnh thật |
|---|---|
| `balance` · `reserved` | `COALESCE(mv.balance,0) AS balance, COALESCE(r.reserved,0) AS reserved` |
| `qty` | `COALESCE(physical.qty,0) AS physicalQty, COALESCE(owned.qty,0) AS contractQty` |
| `item_count` · `total_qty` · `actual_delivered_qty` | `COALESCE(ri.item_count,0)`, `COALESCE(poa.item_count,0)`, `COALESCE(gra.actual_delivered_qty,0)` |

⇒ ⭐⭐ **`mv` · `r` · `ri` · `poa` · `gra` · `physical` · `owned` là ALIAS CỦA TRUY VẤN CON** (`(SELECT …) mv`) ⇒ ⭐ **`balance`/`qty`/`item_count` là **ĐẦU RA** của truy vấn con, ⛔ **KHÔNG phải cột của bảng thật** ✓✓✓
⇒ ⛔ **Công cụ quét TĨNH ⛔ KHÔNG phân biệt được «cột bảng thật» với «alias đầu ra của truy vấn con»** ✓

### ⭐ Nhóm 3 — **1 CÁI THẬT, VÀ ĐÃ BIẾT**
`code_merge_into_id` ⇒ ⭐ **chính là BUG-20261005-013** (đã chứng minh ở TASK-188) ✓

---

## ③ ✅ QUYẾT ĐỊNH: ⛔ **⛔ KHÔNG BÁO LỖI NÀO** — VÀ GHI RÕ VÌ SAO

⛔ **Tôi ⛔ KHÔNG đưa 38 ca kia vào hàng đợi bug** — vì **chúng ⛔ không phải lỗi** ✓
⭐⭐ **Nếu tôi báo 38 «lỗi SQL» thì đó là một loạt BÁO ĐỘNG GIẢ** — ⭐ **đúng loại sai lầm tôi đã mắc và đã sửa nhiều lần trong phiên này** (công cụ `kiem-lop-thieu-css` tự thi trượt · «65 action `List.of()`» · «đo sai tệp») ✓

---

## ④ ✅ XÁC MINH LẦN 4 (ĐỘC LẬP) CHO BUG-20261005-013

Sau khi tự bác bỏ phương pháp, ⭐ **kiểm lại ca THẬT bằng phép đo thứ 4**:
```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema='vntech_erp' AND column_name='code_merge_into_id';
-- ⇒ 0
```
⇒ ⭐⭐ **`code_merge_into_id` xuất hiện 0 lần trong TOÀN BỘ lược đồ** ⇒ **BUG-20261005-013 khẳng định chắc chắn** ✓
⭐ **4 phép đo độc lập** đã cho cùng kết luận: `SHOW COLUMNS` · không migration nào tạo · `schema-h2.sql` không có · `information_schema` đếm = 0 ✓

---

## ⑤ ⭐⭐ BÀI HỌC — VÀ ĐIỀU NÀY **ĐỊNH HÌNH CÁCH KIỂM TIẾP**

1. ⭐⭐ **QUÉT TĨNH ⛔ KHÔNG THAY ĐƯỢC CHẠY THẬT.** ⛔ Không thể phân biệt «cột bảng thật» với «alias đầu ra truy vấn con» nếu ⛔ không **phân tích cú pháp SQL đầy đủ** (biết mọi `FROM`/`JOIN`/truy vấn con) ⇒ ⭐ **một công cụ nửa vời sẽ cho 38 báo động giả** ✓
2. ⭐⭐ **CÁCH DUY NHẤT ĐÁNG TIN VẪN LÀ: GỌI ACTION ⇒ 500 ⇒ ĐỌC + CHẠY CÂU SQL.** ⭐ **Cả 2 lỗi thật của phiên này đều tìm ra bằng cách đó** (E2E → 500 → chạy SQL → mã lỗi kèm tên cột) ✓
3. ⭐⭐ **⇒ NGHĨA LÀ: PHỦ E2E LÀ LƯỚI AN TOÀN THẬT.** ⭐ Hiện **171/220 = 78%**; ⛔ **~19 action còn lại chưa test** (trong đó **16 bị loại trừ có lý do** vì phá hoại/cấu hình) ⇒ ⭐ **rủi ro còn lại tập trung ở 3 action chưa test + 16 action không test được** ✓
4. ⭐ **TỰ BÁC BỎ MỘT PHƯƠNG PHÁP LÀ KẾT QUẢ CÓ GIÁ TRỊ.** ⭐ Biết «quét tĩnh ⛔ không dùng được» giúp phiên sau ⛔ **không tốn công xây nó lại** ✓
5. ⭐ **GHI LẠI PHƯƠNG PHÁP ĐÃ THẤT BẠI QUAN TRỌNG NHƯ GHI LẠI CÁI ĐÃ THÀNH CÔNG.** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Phương pháp quét tĩnh | ⛔ **KHÔNG ĐÁNG TIN** — **39 ứng viên ⇒ 38 báo động giả** |
| Lỗi THẬT tìm thêm được | **0** (ca thật duy nhất = `code_merge_into_id` = **đã biết**) |
| ⛔ Lỗi giả đã **KHÔNG** báo | **38** ✓ |
| BUG-20261005-013 | ✅ **xác minh lần 4 độc lập** (`information_schema` đếm = **0**) |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm | **0** (đã dọn cả `tmp-quet-cot.mjs` + 2 JSON lược đồ) |

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **138 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá** — ⭐ sau đó tôi chạy lại E2E để **`VERIFY` end-to-end** (BUG-20261005-012 hiện là `FIXED`, ⛔ chưa `VERIFIED` trọn vẹn).
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt**.
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **16 action bị loại trừ** (phá hoại/cấu hình) — có cách nào test an toàn không? (VD **trên môi trường riêng**)
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
