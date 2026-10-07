# TASK-170 — GO-LIVE ĐỢT 25: ĐÍNH CHÍNH LẦN 2 + VÁ ĐẦU MODAL KHÔNG CÓ CSS

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** — ⛔ **ĐÍNH CHÍNH LẦN 2**: thu hẹp từ «130 ca» → **≥3 ca nghi THẬT** |
| **Đã vá** | `modal-head` — **đầu modal** ⛔ không có CSS nào |
| **Tệp sửa** | `app/styles/canonical.css` (**+21 dòng**) |
| **Kiểm chứng** | Cổng CSS **ĐẠT** · fixpoint **1 vòng** · verify **ĐẠT** · build **ĐẠT** · cổng UI **3/3 ✓** · `npm test` **EXIT=0** |
| **Vân tay** | `VNTECH-FP-AC3AEB863B93A5E6` → **`VNTECH-FP-6CB87F82236D2F5B`** (713 tệp) |

---

## ① ⛔ ĐÍNH CHÍNH LẦN 2 — KẾT LUẬN VÒNG TRƯỚC CỦA TÔI **CŨNG CHƯA ĐÚNG HẾT**

Vòng trước (TASK-169) tôi kết luận «**129/130 giải thích bởi bộ chọn cha**» — ⚠️ **nhưng tôi mới xác minh tay ~2 ca**. Đó là **lỗ hổng trong chính báo cáo của tôi**.

⇒ Vòng này **xác minh tay 10 ca đầu** của nhóm «thẻ chỉ mang **ĐÚNG** lớp đó» (nhóm này ⛔ **không thể** giải thích bằng «lớp khác cùng phần tử»):

| Lớp | Thẻ | Lớp CHA có rule nhắm tới **thẻ** đó? | Kết luận |
|---|---|---|---|
| `kpi-label` | `<span>` | ✅ **CÓ** — `.kpi>span { width:42px; … }` | ✅ được style |
| `kpi-value` | `<strong>` | ✅ **CÓ** — `.kpi strong { … }` | ✅ được style |
| `admin-table` | `<table>` | ✅ **CÓ** — `.table-wrap table { … }` (`canonical.css:1037`) | ✅ được style |
| **`modal-head`** | `<div>` | ⛔ **KHÔNG** — `.overlay` · `.modal` · `.card` đều ⛔ không có rule nào cho `div` | ⚠️ **LỖ HỔNG THẬT** |
| **`mobile-dash-icon`** | `<span>` | ⛔ **KHÔNG** — `.mobile-dash-kpi` · `.tone-blue` · `.mobile-dashboard-kpis` đều không | ⚠️ nghi thật |
| **`receiving-kpi-button`** | `<button>` | ⛔ **KHÔNG** — `.receiving-kpi-row` · `.kpi-grid` · `.stack` … đều không | ⚠️ nghi thật |
| `readonly-field` · `aggregate-toggle-row` | `<span>` · `<p>` | ⚠️ chưa trích được lớp cha | ⚠️ chưa kết luận |
| `stack-form` | `<form>` | ⚠️ selector nhóm mơ hồ | ⚠️ chưa kết luận |

### ✅ KẾT LUẬN ĐÚNG (sau **HAI** lần đính chính)
⛔ **KHÔNG phải «130 lỗ hổng»** (đã bác bỏ) · ⛔ **cũng KHÔNG phải «0 lỗ hổng»** (đã bác bỏ).
⭐ **Sự thật**: **MỘT PHẦN** được style qua bộ chọn cha (xác minh **3** ca) · **MỘT PHẦN ⛔ KHÔNG có rule nào** (xác minh **3** ca) ⇒ **có lỗ hổng THẬT**.

---

## ② 🐞 ĐÃ VÁ: `modal-head` — ĐẦU MODAL ⛔ KHÔNG CÓ CSS

### Bằng chứng
```jsx
// app/screens/ConstructionScreen.tsx:57  ·  app/screens/Inventory.tsx:209
<div className="modal-head"><strong>THÊM HẠNG MỤC THI CÔNG</strong><button type="button" …>✕</button></div>
```
| Phép kiểm | Kết quả |
|---|---|
| `.modal-head` có rule riêng? | ⛔ **KHÔNG** — không tồn tại trong **bất kỳ** stylesheet nào |
| Là **lớp DUY NHẤT** trên phần tử? | ✔ **Đúng** |
| Cha `.modal.card` / `.overlay` có rule cho `div`? | ⛔ **KHÔNG** |
| Khuôn nhà tương đương? | ⭐ **`.card-head`** — mọi header khác đều dùng: `min-height:68px; padding:15px 18px; margin-bottom:var(--vt-gap-3)` |
⇒ ⭐ **Đầu modal không có layout/đệm/typography nào**, lệch hẳn so với mọi header khác ⇒ **trái §11** («modal… đồng nhất»).

### Cách vá — ⛔ KHÔNG phát minh số đo
```css
.modal-head { display:flex; align-items:center; justify-content:space-between; gap:var(--vt-gap-2);
              min-height:68px; padding:15px 18px;      /* ⛔ y như `.card-head` */
              margin-bottom:var(--vt-gap-3); }
.modal-head strong { font-size:calc(var(--vt-fs-sm) * var(--user-font-scale,1));
                     font-weight:var(--vt-fw-bold); color:var(--vt-c-ink); }
.modal-head > button { border:0; background:transparent; cursor:pointer; }
```
⭐ `min-height:68px` + `padding:15px 18px` **lấy đúng** từ `.card-head` (`globals.css`) · màu/chữ dùng **token nhà** (`--vt-fs-sm` · `--vt-fw-bold` · `--vt-c-ink`) ⇒ **theo khuôn nhà, ⛔ không phát minh** (D-092).

---

## ③ KIỂM CHỨNG — CHUỖI ĐẦY ĐỦ 7 BƯỚC

| Bước | Kết quả |
|---|---|
| Cổng CSS `css-baseline-audit.mjs` | **ĐẠT** · dead classes **0** · dead vars **0** · MỐC 121 tab contract **PASS** |
| `tools/fixpoint-fingerprint.mjs` | **1 vòng** ⇒ `VNTECH-FP-6CB87F82236D2F5B` · `migrationHead` ⛔ không đổi |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · 713 tệp |
| `set-local-identity.mjs` | **KHỚP: true** |
| `npm run build` | **ĐẠT** |
| Khởi động lại `:8787` | PID 16936 → **mới** · HTTP **200** · 7123 B |
| Cổng UI `verify-ui-build-applied.mjs` | **3/3 ✓** (`van-tay` `6cb87f82236d2f5b` khớp SSOT · `byte` 6/6) |
| `npm test` | **fail 0 · skipped 1 · EXIT=0** |

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Ca xác minh tay | **10** (3 ✅ được style · **3 ⚠️ lỗ hổng thật** · 4 chưa kết luận) |
| Đã vá | **1** (`modal-head` — ảnh hưởng **2 màn**) |
| Còn nghi thật chưa vá | **2** (`mobile-dash-icon` · `receiving-kpi-button`) |
| Vân tay | **`VNTECH-FP-6CB87F82236D2F5B`** · **713 tệp** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⛔⛔ **ĐÍNH CHÍNH CŨNG PHẢI ĐƯỢC KIỂM CHỨNG.** Bản đính chính đầu của tôi nói «129/130» nhưng **chỉ xác minh tay ~2 ca** ⇒ **cũng là một kết luận thiếu bằng chứng**. ⭐ Sửa một kết luận sai **không tự động** làm kết luận mới đúng — **phải kiểm chứng lại chính nó**.
2. ⭐⭐ **XÁC MINH TAY MỘT MẪU ĐỦ LỚN ĐỂ BIẾT MÌNH SAI.** Chỉ cần 10 ca là đủ lộ ra **3 lỗ hổng thật** ⇒ ⛔ «tôi đã kiểm 2 ca và suy ra 130» là **suy diễn quá mức**.
3. ⭐ **BẤT ĐỐI XỨNG VỚI KHUÔN NHÀ LÀ DẤU HIỆU MẠNH.** `modal-head` là **đầu modal** mà ⛔ không có layout, trong khi **mọi header khác** dùng `.card-head` có `min-height`/`padding` ⇒ lệch hẳn ⇒ **trái §11**.
4. ⭐ **VÁ THEO KHUÔN NHÀ, ⛔ KHÔNG PHÁT MINH SỐ ĐO.** Tôi **chép đúng** `min-height:68px` + `padding:15px 18px` từ `.card-head` và dùng **token** `--vt-fs-sm`/`--vt-fw-bold`/`--vt-c-ink` — ⛔ không tự nghĩ ra kích thước/màu.
5. ⭐ **KẾT LUẬN ĐÚNG LÀ «MỘT PHẦN».** ⛔ Không «130», ⛔ không «0» — mà là **hỗn hợp**, và **chỉ MẮT NGƯỜI** mới phân định được phần còn lại. ⭐ Phân tích tĩnh đã **thử và thất bại** (công cụ tự thi trượt).

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **116+ đường**, hỗn hợp 2 phiên (xem `GO-LIVE-phan-nhom-commit.md`).
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011.
2. ⭐ **Vá tiếp 2 ca nghi thật còn lại?** (`mobile-dash-icon` · `receiving-kpi-button`) — hoặc ⭐ **rà bằng mắt theo từng màn** (cách duy nhất để chắc).
3. **`modal-head` vừa vá có đúng ý không?** — ⛔ tôi **không nhìn được giao diện**; vá theo **số đo của khuôn nhà** nên rủi ro thấp, nhưng cần **mắt người** xác nhận.
4. **Commit theo NHÓM hay gộp?**
5. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
6. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
7. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
8. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
9. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
10. Xoá đăng ký thừa `manage_contract_review`? · 11. Mở task «thêm thành viên tổ đội»?
