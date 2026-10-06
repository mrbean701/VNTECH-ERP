# TASK-171 — GO-LIVE ĐỢT 26: ĐÍNH CHÍNH LẦN 3 + VÁ THẺ KPI BẤM ĐƯỢC

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** — ⛔ **ĐÍNH CHÍNH LẦN 3**: phát hiện **cơ chế thứ ba** mà phép kiểm chưa từng xét |
| **Đã vá** | `receiving-kpi-button` (**thẻ KPI bấm được**) |
| **Tệp sửa** | `app/styles/canonical.css` (**+14 dòng**) |
| **Kiểm chứng** | Cổng CSS **ĐẠT** · fixpoint **1 vòng** · verify **ĐẠT** · identity **KHỚP** · build **ĐẠT** · cổng UI **3/3 ✓** · `npm test` **EXIT=0** |
| **Vân tay** | `VNTECH-FP-6CB87F82236D2F5B` → **`VNTECH-FP-D7FB15E8EBA0AC70`** (713 tệp) |

---

## ① 🔴 ĐÍNH CHÍNH LẦN 3 — LỖI THỨ BA CỦA CÁCH KIỂM: **CHƯA TỪNG KIỂM «CÓ RENDER KHÔNG»**

Kiểm tiếp 2 ca còn nghi (đã nêu ở TASK-170) thì lộ ra **cơ chế thứ ba**:

| Lớp | Kiểm chính xác | SỰ THẬT |
|---|---|---|
| `mobile-dash-icon` · `mobile-dash-kpi` · `mobile-dashboard-kpis` · `mobile-kpi-spark` | ⛔ **cả 4 KHÔNG có trong CSS** | ⭐ **KHÔNG PHẢI LỖI** — `globals.css` có **`.mobile-dashboard-reference { display: none !important; }`** ⇒ **CẢ KHỐI BỊ ẨN, ⛔ KHÔNG BAO GIỜ RENDER** ⇒ thiếu CSS là **vô nghĩa** |
| `receiving-kpi-button` | ⛔ **KHÔNG có rule nào** · `.receiving-screen` **CÓ render** | 🐞 **LỖI THẬT** → **ĐÃ VÁ** |

⛔⛔ **CƠ CHẾ THỨ BA: KHỐI BỊ ẨN (`display:none`)** — phần tử trong đó ⛔ **không bao giờ hiển thị** nên «thiếu CSS» ⛔ **không phải vấn đề**.
⭐ **Bài học: trước khi nói «phần tử thiếu style», phải hỏi «phần tử có được RENDER không?»**

### ✅ KẾT LUẬN CUỐI — 10 CA ĐÃ XÁC MINH TAY
| Cơ chế giải thích | Số ca | Ca cụ thể |
|---|---|---|
| **① Bộ chọn CHA theo THẺ** | **3** | `kpi-label` (`.kpi>span`) · `kpi-value` (`.kpi strong`) · `admin-table` (`.table-wrap table`) |
| **② Lớp KHÁC trên CÙNG phần tử** | **1** | `vt-timeline-activity` (được `.vt-timeline`) |
| **③ KHỐI BỊ ẨN `display:none`** | **1** | `mobile-dash-icon` (+ 3 lớp cùng khối) |
| **④ LỖI THẬT** | **2** | `modal-head` (**đã vá** TASK-170) · `receiving-kpi-button` (**đã vá** vòng này) |
| ⚠️ chưa kết luận | 3 | `readonly-field` · `aggregate-toggle-row` · `stack-form` |

⇒ ⭐ **2/10 ca đầu là LỖI THẬT và ĐÃ VÁ.** ⛔ «130 lỗ hổng» sai · ⛔ «0 lỗ hổng» cũng sai.

---

## ② 🐞 ĐÃ VÁ: `receiving-kpi-button` — THẺ KPI BẤM ĐƯỢC

### Bằng chứng
```jsx
// app/screens/Receiving.tsx
<div className="stack module-screen receiving-screen baseline-screen">
  <div className="kpi-grid receiving-kpi-row">
    <button type="button" className="receiving-kpi-button" onClick={()=>setCard("today")} …><Kpi …/></button>
```
| Phép kiểm | Kết quả |
|---|---|
| `.receiving-kpi-button` có rule riêng? | ⛔ **KHÔNG** — không có trong bất kỳ stylesheet nào |
| `.receiving-kpi-row` có rule riêng? | ⛔ **KHÔNG** |
| `.receiving-screen` có bị ẩn không? | ✔ **KHÔNG** — nó **CÓ** rule (`gap:16px!important` + rule cho `tbody tr`) ⇒ **màn NÀY CÓ render** |
| Có reset nút chung không? | ⛔ **KHÔNG** — mọi rule nút đều **theo phạm vi** (`.card-head>button` · `.user-menu>button` · `.switch-tabs button` …) |
⇒ ⚠️ `<button>` giữ **kiểu mặc định trình duyệt** (viền/nền/đệm lạ) và **`display:inline-block`** ⇒ ⛔ **không giãn kín ô lưới** như các thẻ `<div>` KPI anh em ⇒ **lệch căn chỉnh** — đúng thứ **§11** yêu cầu đồng nhất.

### Cách vá — ⛔ KHÔNG phát minh số đo
```css
.receiving-kpi-button {
  border: 0; background: transparent; padding: 0;   /* ⛔ y như khuôn reset nút của nhà */
  display: block; width: 100%;                       /* giãn kín ô lưới như <div> anh em */
  text-align: left; cursor: pointer;
}
```
⭐ `border:0; background:transparent` **chép đúng** từ khuôn nhà (`.card-head>button`, `.user-menu>button`) · `display:block; width:100%` để **giãn kín ô lưới như anh em** ⇒ thẻ `.kpi` bên trong hiển thị **y hệt** các thẻ KPI không bấm được.

---

## ③ KIỂM CHỨNG — CHUỖI ĐẦY ĐỦ 7 BƯỚC

| Bước | Kết quả |
|---|---|
| Cổng CSS | **ĐẠT** · dead classes **0** · dead vars **0** · MỐC 121 tab contract **PASS** |
| `fixpoint-fingerprint.mjs` | **1 vòng** ⇒ `VNTECH-FP-D7FB15E8EBA0AC70` · `migrationHead` ⛔ không đổi |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · 713 tệp |
| `set-local-identity.mjs` | **KHỚP: true** |
| `npm run build` | **ĐẠT** |
| Cổng UI `verify-ui-build-applied.mjs` | **3/3 ✓** (`van-tay` `d7fb15e8eba0ac70` khớp SSOT · `byte` 6/6) |
| `npm test` | **fail 0 · skipped 1 · EXIT=0** |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Xác minh tay | **10** ca = 3 ✅ bộ chọn cha · 1 ✅ lớp cùng thẻ · 1 ✅ khối bị ẩn · **2 ⛔ lỗi thật (ĐÃ VÁ)** · 3 chưa kết luận |
| Tổng đã vá từ BUG-20261005-007 | **2** (`modal-head` · `receiving-kpi-button`) |
| Vân tay | **`VNTECH-FP-D7FB15E8EBA0AC70`** · **713 tệp** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⛔⛔ **CƠ CHẾ THỨ BA: KHỐI BỊ ẨN.** Tôi đã kiểm «có rule riêng không» → «có bộ chọn cha không» → «có lớp khác cùng phần tử không», nhưng **chưa bao giờ hỏi «phần tử có được RENDER không»**. ⭐ **Trước khi nói «thiếu style», phải hỏi «có hiển thị không».**
2. ⭐⭐ **MỖI LẦN ĐÍNH CHÍNH LẠI LỘ RA MỘT CƠ CHẾ MỚI.** Ba lần liên tiếp: (1) bỏ sót bộ chọn cha → (2) kết luận «129/130» thiếu bằng chứng → (3) bỏ sót khối bị ẩn. ⭐ **Sửa sai không tự động cho ra đúng — mỗi vòng phải kiểm chứng lại.**
3. ⭐ **XÁC MINH TAY 10 CA LÀ MẪU ĐỦ LỚN.** Nó vừa **bác bỏ** «130 lỗ hổng» vừa **bác bỏ** «0 lỗ hổng», và cho ra **đúng 2 lỗi thật** ⇒ ⛔ không có đường tắt thay cho việc **đọc từng ca**.
4. ⭐ **HỢP ĐỒNG THIẾT KẾ PHẢI ĐƯỢC TÔN TRỌNG.** `mobile-dash-icon` nằm trong khối có **`data-contract="VNTECH_MOBILE_DASHBOARD_R5_V1"`** ⇒ tôi ⛔ **dừng lại tra hợp đồng trước khi vá** — và nhờ vậy phát hiện khối đó **bị ẩn có chủ ý** (⛔ không phải chỗ để «sửa»).
5. ⭐ **VÁ THEO KHUÔN NHÀ, ⛔ KHÔNG PHÁT MINH SỐ ĐO.** Cả 2 bản vá đều **chép đúng** giá trị đã có trong khuôn nhà.

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **118 đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011.
2. ⭐ **2 bản vá CSS (`modal-head` · `receiving-kpi-button`) đã lên `:8787`** — ⛔ tôi **không nhìn được giao diện**; vá theo **số đo khuôn nhà** nên rủi ro thấp, nhưng cần **mắt người** xác nhận.
3. ⭐ **3 ca chưa kết luận** (`readonly-field` · `aggregate-toggle-row` · `stack-form`) — rà tiếp hay dừng?
4. **Commit theo NHÓM hay gộp?**
5. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
6. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
7. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
8. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
9. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
10. Xoá đăng ký thừa `manage_contract_review`? · 11. Mở task «thêm thành viên tổ đội»?
