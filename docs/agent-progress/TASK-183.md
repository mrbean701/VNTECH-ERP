# TASK-183 — GO-LIVE ĐỢT 38: VÁ CA BORDERLINE **CUỐI CÙNG** — `.stack-form`

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-007** — ✅ **KHÉP HOÀN TOÀN**: ca borderline cuối cùng **đã giải và đã vá** |
| **Đã vá** | `.stack-form` — form 15 ô điều khiển ⛔ không có rule nào |
| **Tệp sửa** | `app/styles/canonical.css` (**+17 dòng**) |
| **Kiểm chứng** | Cổng CSS **ĐẠT** · fixpoint **1 vòng** · verify **ĐẠT** · identity **KHỚP** · build **ĐẠT** · cổng UI **3/3 ✓** · `npm test` **EXIT=0** |
| **Vân tay** | `VNTECH-FP-C1B45AAAF31BFCF2` → **`VNTECH-FP-27251D9B7F076176`** (713 tệp) |

---

## ① ⭐ ĐỌC MÃ ĐÃ GIẢI QUYẾT CA BORDERLINE — ⛔ KHÔNG CẦN MẮT NGƯỜI

Vòng trước tôi để `stack-form` ở trạng thái **«borderline — cần mắt người»** vì **không đọc đủ ngữ cảnh**.
⭐ **ĐỌC ĐẦY ĐỦ THÌ RA NGAY** — dòng **28** là **MỘT DÒNG DÀI 2577 KÝ TỰ** chứa cả form:

| Phép đo trên chính phần tử `<form>` | Giá trị |
|---|---|
| `<select>` | **3** |
| `<input>` | **9** |
| `<button>` | **3** |
| ⇒ **Tổng ô điều khiển** | **15** |
| `<label>` | **0** |
| `.stack-form` có rule? | ⛔ **KHÔNG** (regex ranh giới = **False**) |
| Dùng bao nhiêu lần? | **ĐÚNG 1** (`ProjectTeams.tsx:28`) |

⛔ **VÀ kiểm nốt điều kiện «đừng sửa thứ đang ổn»**: ⛔ **không rule nào** cấp `width:100%` cho `select`/`input` con của `.card`/`.two-col` — 2 kết quả dò được đều **⛔ không áp** (`.request-list-card input[type=checkbox]` · `.dashboard-staff-search input`) ✓

⇒ ⭐⭐ **15 ô điều khiển giữ kiểu mặc định `inline-block`** ⇒ **chen lên cùng dòng**, ⛔ không xếp dọc như **tên lớp** `stack-form` nói ⇒ ⭐ **tiêu chí (B) «cần layout» ĐƯỢC THỎA** ⇒ **LỖ HỔNG THẬT** ✓

⭐⭐ **BÀI HỌC LẶP LẠI LẦN THỨ BA**: *«không đủ dữ kiện để kết luận»* ⛔ **hầu như luôn là «chưa đọc đủ mã»** ✓ (lần 1: TASK-179 sai tài khoản · lần 2: TASK-182 tab · lần 3: ca này)

---

## ② 🔧 ĐÃ VÁ — ⛔ KHÔNG PHÁT MINH SỐ ĐO

```css
.stack {
  display: grid;
  gap: var(--vt-gap-3);
}

/* §11 — FORM XẾP DỌC (`.stack-form`) … */
.stack-form {
  display: grid;
  gap: var(--vt-gap-3);      /* ⭐ CHÉP ĐÚNG định nghĩa `.stack` ngay trên */
}
```
⭐ **Vì sao đúng**:
| # | Lý do |
|---|---|
| **a** | ⭐ **Tên lớp đã nói rõ** nó phải hành xử như `.stack` ⇒ **chép đúng định nghĩa `.stack`**, ⛔ không bịa |
| **b** | ⭐ **Đặt ngay sau `.stack`** trong mục **«NHỊP DỌC»** của stylesheet — đúng chỗ ngữ nghĩa |
| **c** | ⭐ **Dùng đúng 1 lần** ⇒ **phạm vi ảnh hưởng hẹp** ✓ |
| **d** | ⭐ **§12 `SMALL SAFE FIX`** — 1 khối 4 dòng, ⛔ không đụng gì khác |

---

## ③ KIỂM CHỨNG — CHUỖI ĐẦY ĐỦ 7 BƯỚC

| Bước | Kết quả |
|---|---|
| Cổng CSS | **ĐẠT** · dead classes **0** · dead vars **0** · MỐC 121 tab contract **PASS** |
| `fixpoint-fingerprint.mjs` | **1 vòng** ⇒ `VNTECH-FP-27251D9B7F076176` · `migrationHead` ⛔ không đổi |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · 713 tệp |
| `set-local-identity.mjs` | **KHỚP: true** |
| `npm run build` | **ĐẠT** |
| Cổng UI `verify-ui-build-applied.mjs` | **3/3 ✓** (`van-tay` `27251d9b7f076176` khớp SSOT · `byte` 6/6) |
| `npm test` | **fail 0 · skipped 1 · EXIT=0** |

---

## ④ ✅ BUG-20261005-007 **KHÉP HOÀN TOÀN** — **5 BẢN VÁ**, ⛔ 0 CA CÒN LẠI

| # | Lớp đã vá | Tiêu chí | Nguồn số đo (⛔ không phát minh) |
|---|---|---|---|
| 1 | `modal-head` | **(B)** cần layout (tiêu đề + nút ✕) | khuôn **`.card-head`** |
| 2 | `receiving-kpi-button` | **(A)** `<button>` chrome | khuôn **reset nút nhà** |
| 3 | `requests-shortage-card` | **(A)** — **ca y hệt #2** | **đúng reset của #2** |
| 4 | `page-collapse` | **(A)** — ⛔ không tổ tiên `.drawer` | **anh em `.page-back`** |
| **5** | **`stack-form`** | **(B)** — **15 ô điều khiển** cần layout | ⭐ **đúng định nghĩa `.stack`** |

⭐ **Tất cả 5 đều CHÉP từ nguồn đã có trong nhà** ⇒ ⛔ **không có con số nào do tôi nghĩ ra** ✓
⭐ **Và cũng vòng này**: **§11 «tab trong modal»** đã đóng — **20/20 tablist** mang lớp **có rule** (TASK-182) ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| BUG-20261005-007 | ✅ **KHÉP HOÀN TOÀN** — **5 bản vá**, ⛔ **0 ca còn lại**, ⛔ **0 borderline** |
| Ca borderline cũ | ✅ **đã giải bằng ĐỌC MÃ** (đo: 15 ô điều khiển, `.stack-form` ⛔ không rule) |
| Bug sản phẩm mới | **0** |
| Vân tay | **`VNTECH-FP-27251D9B7F076176`** · **713 tệp** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **«KHÔNG ĐỦ DỮ KIỆN ĐỂ KẾT LUẬN» ⛔ HẦU NHƯ LUÔN LÀ «CHƯA ĐỌC ĐỦ MÃ».** ⭐ **LẦN THỨ BA** trong phiên (TASK-179 sai tài khoản · TASK-182 tab · ca này) ⇒ ⭐ **trước khi nói «cần mắt người», phải hỏi «tôi đã đọc HẾT phần tử đó chưa?»** ✓
2. ⭐⭐ **MỘT DÒNG JSX CÓ THỂ DÀI 2577 KÝ TỰ.** Đoạn cắt 190 ký tự **⛔ không đủ** để thấy 15 ô điều khiển ⇒ ⭐ **đếm phần tử trên CHÍNH phần tử đó**, ⛔ không đọc đoạn cắt ✓
3. ⭐⛔ **TRƯỚC KHI SỬA, PHẢI KIỂM «CÓ GÌ ĐANG CHE KHÔNG».** Tôi kiểm **`.card`/`.two-col` có rule `width:100%` cho `select`/`input` không** ⇒ ⛔ **không có** ⇒ ⭐ **mới dám kết luận là lỗ hổng** ✓ (nếu có, tôi đã **sửa một thứ đang ổn**)
4. ⭐ **TÊN LỚP LÀ MỘT NGUỒN SỐ ĐO.** `stack-form` nói nó phải «xếp dọc như `.stack`» ⇒ ⭐ **chép đúng định nghĩa `.stack`**, ⛔ không bịa dáng mới ✓
5. ⭐⭐ **KHÉP ĐƯỢC CHUỖI DÀI BẰNG CÁCH QUAY LẠI ĐỌC MÃ.** Chuỗi BUG-20261005-007 mất **8 vòng** (TASK-157 → 183) — ⭐ **nguyên nhân chính của 8 vòng đó là ĐO TRƯỚC, ĐỌC SAU** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **130 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 5 bản vá CSS bằng mắt** (`modal-head` · `receiving-kpi-button` · `requests-shortage-card` · `page-collapse` · **`stack-form`**) — ⛔ cả 5 đều chép số đo từ khuôn nhà.
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền (câu hỏi **duy nhất** còn lại của chuỗi đó).
4. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
5. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
