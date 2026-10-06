# TASK-173 — GO-LIVE ĐỢT 28: ÁP TIÊU CHÍ (A) THÀNH QUÉT HỆ THỐNG — **2 NGHI LỖ HỔNG MỚI**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** (tiếp) — ⭐ áp **tiêu chí (A)** thành quét hệ thống |
| **Kết quả** | **9 ứng viên** ⇒ **7 giải thích được** · ⚠️ **2 NGHI LỖ HỔNG MỚI** (`page-collapse` · `requests-shortage-card`) |
| **⛔ TỰ PHÊ** | **công cụ quét của tôi SAI LẦN THỨ HAI** (quá lỏng ⇒ «sạch» giả) |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (vòng này ĐO + XÁC MINH; ⛔ chưa vá vì chưa chọn được dáng vá) |

---

## ① ÁP TIÊU CHÍ (A) THÀNH QUÉT

Tiêu chí (TASK-172): **lớp thiếu rule CHỈ GÂY HẠI khi (A)** thẻ có **kiểu mặc định trình duyệt «xâm lấn»** (`button`·`input`·`select`·`textarea`·`table`·`fieldset`) **hoặc (B)** cần **layout**.

| Phép đo | Số |
|---|---|
| Lớp `className` **tĩnh** trong `app/` | **696** |
| Lớp ⛔ **không có rule riêng** | **127** |
| ⭐ Trong đó có **thẻ xâm lấn** (tiêu chí **A**) | **9** ← **DANH SÁCH ỨNG VIÊN** |

⇒ ⭐ **Tiêu chí thu 127 lớp xuống 9 ứng viên** — **đủ nhỏ để XÁC MINH TAY TỪNG CÁI**. Đó là giá trị thật của tiêu chí.

---

## ② ⛔⛔ CÔNG CỤ QUÉT CỦA TÔI **SAI LẦN THỨ HAI** — VÀ SAI CÙNG KIỂU

Công cụ báo **«CÒN LẠI — NGHI LỖ HỔNG THẬT: 0»**. ⛔ **SAI.** Nguyên nhân — **hai lỗi**:

| Lỗi | Chi tiết |
|---|---|
| ⛔ **Bộ kiểm quá LỎNG** | `coRuleTheCha(the)` chỉ hỏi «**có** rule nào nhắm thẻ này dưới **một lớp nào đó**» — ⛔ **KHÔNG kiểm lớp đó có phải TỔ TIÊN THẬT của phần tử không**. Trong ~365 KB CSS thể nào cũng có `.abc button { … }` ⇒ **luôn trả về "có"** |
| ⛔ **THỨ TỰ KIỂM che mất sự thật** | Nhánh ① (cha-the, **sai**) chạy **TRƯỚC** nhánh ② (lớp cùng thẻ, **đúng**) ⇒ ① «có» là **thoát sớm**, ⛔ không bao giờ tới ② |
| ⛔ (lỗi đo phụ) | `String.Contains('.X')` khớp **chuỗi con** ⇒ `.material-subgroup-table` khớp nhầm `.material-subgroup-table-**wrap**` ⇒ báo «có rule riêng» **GIẢ** |

⭐ **Đây là lần thứ HAI công cụ của tôi cho «sạch giả»** (lần đầu: `tools/kiem-lop-thieu-css.mjs` ở TASK-169, đã gỡ).
⭐⭐ **BÀI HỌC: một công cụ đo QUÁ LỎNG sẽ LUÔN nói «không có vấn đề» — và đó là kiểu sai NGUY HIỂM NHẤT vì nó cho CẢM GIÁC AN TOÀN.**

---

## ③ ✅ XÁC MINH TAY **CẢ 9 ỨNG VIÊN** — 7 giải thích được · 2 nghi thật

| # | Lớp | Thẻ | Cơ chế giải thích (đã xác minh) | Kết luận |
|---|---|---|---|---|
| 1 | `vt-timeline-activity` | `ol` | ⭐ **lớp khác cùng phần tử**: `.vt-timeline { list-style:none; display:flex; … }` | ✅ |
| 2 | `admin-table` | `table` | **bộ chọn cha**: `.table-wrap table { … }` | ✅ |
| 3 | `archive-project` | `button` | ⭐ **lớp khác cùng phần tử**: `className="export-mini archive-project"` — `.export-mini { height:28px; border:1px solid #bfd4df; border-radius:6px; background:#f7fbfd; … }` | ✅ |
| 4 | `material-subgroup-table` | `table` | ⭐ **lớp khác cùng phần tử**: `className="baseline-table material-subgroup-table"` — `.baseline-table { width:100%; border-collapse:separate; … }` | ✅ |
| 5 | `mobile-nav-expand-only` | `button` | ⭐ **lớp khác cùng phần tử**: `className="mobile-nav-parent mobile-nav-expand-only"` — `.mobile-nav-parent { display:grid!important; … min-height:54px; border:0!important; … }` | ✅ |
| 6 | `notify-item-main` | `button` | **bộ chọn cha THẬT**: nằm trong `.task-notify-popover` — `.task-notify-popover>button { display:grid; width:100%; text-align:left; border:0; background:#eef6ff; … }` | ✅ |
| 7 | `notify-mark-read` | `button` | ⭐ **cùng cha** `.task-notify-popover` ⇒ cùng rule trên | ✅ |
| **8** | **`page-collapse`** | `button` | ⛔ **KHÔNG rule nào nhắc tới nó** · ⛔ **không lớp khác trên phần tử** · rule cha gần nhất là `.drawer>header>button` / `.request-action-row > button` ⇒ ⛔ **không áp** (`RequestDrawer.tsx:50`) | ⚠️ **NGHI THẬT** |
| **9** | **`requests-shortage-card`** | `button` | ⛔ **KHÔNG rule nào** · ⛔ **không lớp khác** · **chuỗi tổ tiên có lớp TRỐNG** (`Requests.tsx:133`) | ⚠️ **NGHI THẬT** |

⭐ **5/9 được giải thích bởi «LỚP KHÁC TRÊN CÙNG PHẦN TỬ»** — cơ chế mà **công cụ của tôi che mất** vì nhánh ① chạy trước.
⭐ **2/9 giải thích bởi bộ chọn cha — và cả hai đều ĐÚNG là cha thật** (`.table-wrap table` · `.task-notify-popover>button`).

---

## ④ ⚠️ 2 NGHI LỖNG MỚI — ĐÃ XÁC MINH, ⛔ **CHƯA VÁ** (có lý do)

### 8 · `page-collapse` — `app/screens/RequestDrawer.tsx:50`
```jsx
{isPage && <button type="button" className="page-collapse" onClick={() => setCollapsed(…)} title={collapsed ? "Mở rộng các khối" : …}>…</button>}
```
⛔ **Không có rule nào** · là **lớp DUY NHẤT** trên phần tử · `<button>` ⇒ **kiểu mặc định trình duyệt** ⇒ theo tiêu chí **(A) GÂY HẠI**.

### 9 · `requests-shortage-card` — `app/screens/Requests.tsx:133`
```jsx
{lowStockHints.length>0 && <button type="button" className="requests-shortage-card" onClick={()=>setShortageOpen(true)} title="Xem danh sách vật tư đang thiếu…">…</button>}
```
⛔ **Không có rule nào** · **lớp DUY NHẤT** · `<button>` ⇒ theo tiêu chí **(A) GÂY HẠI**.

### ⛔ VÌ SAO ⛔ KHÔNG VÁ NGAY
| Lý do | |
|---|---|
| ⛔ **Không chọn được DÁNG VÁ** | Với `receiving-kpi-button` tôi dùng **reset** vì **nội dung (`.kpi`) tự có style**. Hai nút này **chỉ có chữ** ⇒ reset sẽ cho ra **nút chữ trần** — ⛔ **không biết có đúng ý đồ không** |
| ⛔ **không nhìn được giao diện** | Không xác nhận được hiện trạng xấu tới mức nào |
| **§12** | ⛔ không đánh cược dáng giao diện |
| **§4** | mức **LOW/MEDIUM** ⇒ ghi vào hàng đợi |

⭐ **ĐỀ XUẤT khi có mắt người** — chọn **khuôn nhà có sẵn**, ⛔ không phát minh:
- `page-collapse` ⇒ giống **`.export-mini` / `.icon-mini`** (nút nhỏ cạnh tiêu đề — cùng ngữ cảnh với `archive-project` đang dùng `.export-mini`) hoặc **`.card-head>button`** (`border:0; background:transparent; color:var(--blue)`).
- `requests-shortage-card` ⇒ giống **`.approved-order-stats button`** (`min-height:104px; border:1px solid…; border-radius:10px; background:#fbfdff; text-align:left; padding:14px; display:grid; …`) nếu nó là **thẻ cảnh báo bấm được**.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Ứng viên (tiêu chí A) | **9** / 127 lớp thiếu rule |
| Xác minh tay | **9/9** |
| Giải thích được | **7** (5 bởi **lớp cùng phần tử** · 2 bởi **bộ chọn cha**) |
| ⚠️ Nghi lỗ hổng thật | **2** (`page-collapse` · `requests-shortage-card`) — ⛔ chưa vá |
| Công cụ quét | ⛔ **SAI lần thứ hai** (đã bỏ, ⛔ không lưu lại) |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-D7FB15E8EBA0AC70` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **CÔNG CỤ ĐO QUÁ LỎNG LUÔN NÓI «SẠCH» — ĐÓ LÀ KIỂU SAI NGUY HIỂM NHẤT.** Lần thứ **hai** tôi viết công cụ cho «sạch giả». ⭐ Cả hai lần đều vì **cùng một nguyên nhân: bộ kiểm không xác nhận QUAN HỆ THẬT** (lớp này có phải tổ tiên không · thẻ này có phải mặc định không).
2. ⛔⛔ **THỨ TỰ KIỂM CÓ THỂ CHE MẤT SỰ THẬT.** Nhánh ① (sai) chạy trước nhánh ② (đúng) ⇒ **thoát sớm** ⇒ **5/9 ca bị dán nhãn sai**. ⭐ **Một bộ kiểm sai chạy trước một bộ kiểm đúng sẽ luôn thắng.**
3. ⭐⭐ **TIÊU CHÍ ĐÚNG + XÁC MINH TAY TỪNG CA LÀ CÁCH DUY NHẤT ĐÁNG TIN.** Tiêu chí thu **127 → 9**; 9 ca thì **xác minh tay được hết** ⇒ ⭐ **dùng công cụ để THU HẸP, ⛔ không dùng để KẾT LUẬN**.
4. ⛔ **`String.Contains('.X')` khớp CHUỖI CON** — `.material-subgroup-table` khớp nhầm `.material-subgroup-table-wrap` ⇒ dùng **regex có ranh giới** `\.X(?![\w-])`.
5. ⭐ **BIẾT MÌNH KHÔNG CHỌN ĐƯỢC DÁNG VÁ THÌ ĐỪNG VÁ.** Hai nút mới ⛔ **chỉ có chữ** nên **reset** sẽ cho ra **nút chữ trần** — ⛔ không biết có đúng ý đồ không ⇒ **ghi nhận + đề xuất khuôn nhà**, ⛔ không đoán (§12).

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **120 đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**.
2. ⭐ **`page-collapse` + `requests-shortage-card`** — 2 nút ⛔ **hoàn toàn không có CSS** (đã xác minh tay). ⭐ Chọn khuôn nhà nào cho từng nút? (đề xuất ở §④)
3. ⭐ **Xác nhận 2 bản vá CSS trước bằng mắt** (`modal-head` · `receiving-kpi-button` — đã lên `:8787`).
4. ⭐ **`stack-form`** — cho dùng khuôn `.stack` hay để nguyên?
5. **Commit theo NHÓM hay gộp?**
6. **BUG-20261009** · 7. **«ai được nhận hàng ở kho đích»** · 8. **4 phiếu + 9 đơn vị kẹt ở `WH-TRANSIT`**.
9. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể?** · 10. ⭐ **Bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
11. Xoá đăng ký thừa `manage_contract_review`? · 12. Mở task «thêm thành viên tổ đội»?
