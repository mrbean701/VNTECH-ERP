# TASK-174 — GO-LIVE ĐỢT 29: VÁ NỐT 2 NÚT KHÔNG CÓ CSS — **CHỌN DÁNG VÁ BẰNG BẰNG CHỨNG**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** — ⭐ **vá nốt 2 ca nghi thật** ⇒ tổng **4 bản vá CSS** |
| **Đã vá** | `requests-shortage-card` · `page-collapse` |
| **Tệp sửa** | `app/styles/canonical.css` (**+24 dòng**) |
| **Kiểm chứng** | Cổng CSS **ĐẠT** · fixpoint **1 vòng** · verify **ĐẠT** · identity **KHỚP** · build **ĐẠT** · cổng UI **3/3 ✓** · `npm test` **EXIT=0** |
| **Vân tay** | `VNTECH-FP-D7FB15E8EBA0AC70` → **`VNTECH-FP-C1B45AAAF31BFCF2`** (713 tệp) |

---

## ① ⛔ TÔI LẠI ĐÍNH CHÍNH MỘT PHÉP ĐO CỦA CHÍNH MÌNH

Vòng trước tôi kết luận `.drawer>header>button` **có thể áp** cho `page-collapse` — dựa trên một lệnh in ra «`<aside> tai = 4987`». ⛔ **Phép đo đó SAI**: lệnh có **nhánh dự phòng** `if($j -lt 0){ $j = $r.IndexOf('<div className=') }` ⇒ khi tìm `<aside>` **thất bại**, nó **in chỉ số của `<div className=`** ⇒ trông như đã tìm thấy.

**KIỂM LẠI CHO ĐÚNG:**
| Phép kiểm | Kết quả |
|---|---|
| `RequestDrawer.tsx` có `<aside>`? | ⛔ **KHÔNG** |
| Có lớp `.drawer` trần? | ⛔ **KHÔNG** — chỉ có `drawer-section` · `drawer-body` |
| ⇒ `.drawer>header>button` có áp? | ⛔ **KHÔNG ÁP** |

⇒ ✅ **XÁC NHẬN: cả 2 nút THẬT SỰ không được style.**

⭐ **Bài học: một nhánh dự phòng (fallback) có thể biến «KHÔNG TÌM THẤY» thành «ĐÃ TÌM THẤY» trong mắt người đọc.** ⛔ Đừng để lệnh đo **tự sửa** giá trị của nó mà ⛔ không nói ra.

---

## ② ⭐ CHỌN DÁNG VÁ **BẰNG BẰNG CHỨNG** — ⛔ KHÔNG ĐOÁN

Vòng trước tôi ⛔ không vá vì «không chọn được dáng». Vòng này **đọc kỹ ngữ cảnh** thì **chọn được** — vì mỗi nút **có nguồn số đo sẵn có**:

### ⑨ `requests-shortage-card` — **CA Y HỆT `receiving-kpi-button`**
```jsx
// app/screens/Requests.tsx:133
<button type="button" className="requests-shortage-card" …><Kpi icon="VT" label="VẬT TƯ ĐANG THIẾU" value={…} tone="red"/></button>
```
⭐ Nút **bọc một `<Kpi>`** trong `.kpi-grid` — **đúng y hệt** `receiving-kpi-button` (đã vá + đã kiểm chứng ở TASK-171) ⇒ **dùng ĐÚNG reset đó**, ⛔ không phát minh:
```css
.requests-shortage-card { border:0; background:transparent; padding:0; display:block; width:100%; text-align:left; cursor:pointer; }
```

### ⑧ `page-collapse` — **CÓ ANH EM CÙNG `<header>` ĐÃ ĐƯỢC STYLE**
```jsx
// app/screens/RequestDrawer.tsx:50
<header><div>…</div>
  {isPage && <button type="button" className="page-collapse" …>{collapsed ? "⌄ Mở rộng khối" : "⌃ Thu gọn khối"}</button>}
  <button className={isPage ? "page-back" : undefined} …>
```
⭐ `.page-back` **CÓ rule** (`canonical.css`): `min-height:var(--vt-control-h); padding:0 16px; border-radius:8px; border:1px solid var(--line,#dbe4ee); background:#eef3f8; color:#24507d; font-size:calc(10.5px × --user-font-scale); font-weight:800`
⇒ ⭐ **Hai nút nằm CẠNH NHAU trong cùng một `<header>`** ⇒ **chép ĐÚNG số đo của anh em nó** là hợp lý nhất (§11: đồng nhất), ⛔ không bịa dáng mới:
```css
.page-collapse { min-height:var(--vt-control-h); padding:0 16px; border-radius:8px;
                 border:1px solid var(--line,#dbe4ee); background:#eef3f8; color:#24507d;
                 font-size:calc(10.5px * var(--user-font-scale,1)); font-weight:800;
                 cursor:pointer; white-space:nowrap; }
```

⭐⭐ **CẢ HAI DÁNG VÁ ĐỀU ĐƯỢC CHÉP TỪ NGUỒN ĐÃ KIỂM CHỨNG** — ⛔ không có một con số nào do tôi nghĩ ra.

---

## ③ KIỂM CHỨNG — CHUỖI ĐẦY ĐỦ 7 BƯỚC

| Bước | Kết quả |
|---|---|
| Cổng CSS | **ĐẠT** · dead classes **0** · dead vars **0** · MỐC 121 tab contract **PASS** |
| `fixpoint-fingerprint.mjs` | **1 vòng** ⇒ `VNTECH-FP-C1B45AAAF31BFCF2` · `migrationHead` ⛔ không đổi |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · 713 tệp |
| `set-local-identity.mjs` | **KHỚP: true** |
| `npm run build` | **ĐẠT** |
| Cổng UI `verify-ui-build-applied.mjs` | **3/3 ✓** (`van-tay` `c1b45aaaf31bfcf2` khớp SSOT · `byte` 6/6) |
| `npm test` | **fail 0 · skipped 1 · EXIT=0** |

ⓘ Có 1 cảnh báo `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` của Node khi thoát tiến trình — ⛔ **không ảnh hưởng**: đó là cảnh báo **thoát tiến trình**, exit code vẫn **0** ở cả cổng UI lẫn `npm test`.

---

## ④ TỔNG KẾT BUG-20261005-007 — **4 BẢN VÁ CSS**

| # | Lớp | Vì sao là lỗi thật | Nguồn số đo của bản vá |
|---|---|---|---|
| 1 | `modal-head` | `<div>` **cần layout** (tiêu đề + nút ✕) — tiêu chí (B) | khuôn **`.card-head`** (`min-height:68px; padding:15px 18px`) |
| 2 | `receiving-kpi-button` | `<button>` **chrome xâm lấn** + `inline-block` — tiêu chí (A) | khuôn **reset nút nhà** (`.card-head>button` · `.user-menu>button`) |
| 3 | `requests-shortage-card` | **ca y hệt #2** (bọc `<Kpi>`) | **đúng reset của #2** |
| 4 | `page-collapse` | `<button>` — tiêu chí (A) · ⛔ không tổ tiên `.drawer` | **anh em cùng header `.page-back`** |

⭐ **13 ca xác minh tay · 4 LỖI THẬT ĐÃ VÁ · 9 ca vô hại (5 cơ chế) · 0 ca còn nghi.**

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Bản vá CSS của BUG-20261005-007 | **4** — tất cả **đã lên `:8787`** |
| Ca còn nghi | **0** |
| Bug sản phẩm mới | **0** |
| Vân tay | **`VNTECH-FP-C1B45AAAF31BFCF2`** · **713 tệp** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **NHÁNH DỰ PHÒNG CÓ THỂ BIẾN «KHÔNG TÌM THẤY» THÀNH «ĐÃ TÌM THẤY».** Lệnh đo của tôi có `if($j -lt 0){ $j = …IndexOf('<div className=') }` ⇒ khi tìm `<aside>` **thất bại**, nó **in chỉ số của `<div`** ⇒ tôi đọc thành «có `<aside>`». ⭐ **Lệnh đo ⛔ không được tự sửa giá trị của nó mà không nói ra.**
2. ⭐⭐ **«KHÔNG CHỌN ĐƯỢC DÁNG VÁ» THƯỜNG LÀ DO CHƯA ĐỌC ĐỦ NGỮ CẢNH.** Vòng trước tôi định **bịa dáng**; vòng này đọc kỹ thì thấy **mỗi nút đều có nguồn số đo sẵn**: nút KPI ⇒ ca y hệt đã vá; nút header ⇒ **anh em cùng header đã có rule**.
3. ⭐⭐ **TÌM «CA Y HỆT» VÀ «ANH EM CÙNG CHỖ» LÀ CÁCH CHỌN DÁNG VÁ ĐÚNG.** Cả 4 bản vá của BUG-20261005-007 đều **chép từ một nguồn đã có** — ⛔ **không có con số nào do tôi nghĩ ra**. Đó là điều kiện để vá ⛔ không phá vỡ tính đồng nhất (§11).
4. ⭐ **CẢNH BÁO THOÁT TIẾN TRÌNH ≠ LỖI.** `UV_HANDLE_CLOSING` xuất hiện sau cổng UI nhưng **exit code 0** ở cả hai cổng ⇒ ⛔ không được báo là lỗi, mà phải **ghi rõ là cảnh báo thoát**.
5. ⭐ **ĐẾN LÚC DỪNG THÌ DỪNG.** Sau 4 bản vá và **13 ca xác minh**, BUG-20261005-007 **không còn ca nghi nào** ⇒ ⛔ không tiếp tục đào thêm khi ⛔ không còn dấu hiệu.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **121 đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011.
2. ⭐ **XÁC NHẬN BẰNG MẮT 4 bản vá CSS** (đã lên `:8787`): `modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse` — ⛔ tôi **không nhìn được giao diện**, đây là **việc duy nhất còn lại** của BUG-20261005-007.
3. ⭐ **`stack-form`** — cho dùng khuôn `.stack` hay để nguyên? (ca borderline duy nhất còn lại của chuỗi CSS)
4. **Commit theo NHÓM hay gộp?**
5. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
6. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
7. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
8. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
9. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
10. Xoá đăng ký thừa `manage_contract_review`? · 11. Mở task «thêm thành viên tổ đội»?
