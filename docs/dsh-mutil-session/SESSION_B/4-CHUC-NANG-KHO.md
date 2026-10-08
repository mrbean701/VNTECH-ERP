# 4 CHỨC NĂNG KHO ĐANG TẠM KHOÁ — GIẢI THÍCH & ĐỀ XUẤT

> **Phiên**: `ERP-SESSION-02` · **Ngày**: 2026-10-08 · **Trạng thái**: ⏳ **CHỜ ANH DUYỆT**
> **Vì sao tài liệu này**: anh hỏi *«4 chức năng kho là những chức năng gì»* — đây là giải thích đầy đủ, ⛔ **không dùng thuật ngữ kỹ thuật**.

---

## 📍 4 chức năng này nằm ở đâu trên màn hình?

Vào menu **KHO VẬT TƯ** → tab **KHO**. Có **2 nhóm nút**:

```
┌─ Khối «DANH SÁCH KHO» ──────────────────────┐
│  [＋ Tạo kho]  [✎ Sửa]  [🗑 Xóa]            │  ← ① ② ③
│  [Tìm] [Sắp xếp] [⇩ Xuất Excel]             │
│  ┌────┐ ┌────┐ ┌────┐                        │
│  │kho │ │kho │ │kho │  (bấm thẻ ⇒ mở chi tiết)│
│  └────┘ └────┘ └────┘                        │
└─────────────────────────────────────────────┘
┌─ Tab «CẤP PHÁT & HOÀN TRẢ» ─────────────────┐
│  [＋ Tạo phiếu cấp phát]  [＋ Tạo phiếu hoàn trả] │  ← ④ (cái hoàn trả CHẠY được)
└─────────────────────────────────────────────┘
```

**Cả 4 nút đang bị làm mờ (⛔ bấm không được)** — nhưng em **giữ nguyên mã bên trong** để khi anh duyệt là bật lên dùng ngay.

---

## ① «＋ Tạo kho»

| | |
|---|---|
| **Dùng để làm gì** | Thêm một kho mới vào hệ thống (kho tổng · kho công trường · kho tổ đội · kho trung chuyển) |
| **Hiện trạng** | ⛔ **Bấm không mở gì** — nút gọi một cửa sổ tên `warehouse` mà **app chưa có** |
| **Thiếu gì** | Cần **cửa sổ nhập liệu** + **API lưu kho** (backend chưa có) |
| **Em đề xuất kho gồm 8 ô** *(lấy từ đúng cấu trúc bảng kho trong CSDL, ⛔ không bịa)* | 1. **Mã kho** — bắt buộc, không được trùng<br>2. **Tên kho** — bắt buộc<br>3. **Loại kho** — ⚠️ **cần anh chốt có những loại nào** (dữ liệu hiện có: `central`=Kho Tổng ×1 · `site`=Kho dự án ×5 · nhóm khác ×6)<br>4. **Dự án** — chỉ bật khi là kho dự án<br>5. **Kho cha** — để trống = kho gốc<br>6. **Thủ kho** — chọn từ danh sách người dùng<br>7. **Đang hoạt động** — công tắc<br>8. *(hệ thống tự sinh: mã định danh, ngày tạo, ngày sửa)* |
| **❓ Anh cần quyết** | **Loại kho có mấy loại, tên tiếng Việt là gì?** · **Mã kho có cho nhập tay không hay tự sinh?** |

## ② «✎ Sửa» kho

| | |
|---|---|
| **Dùng để làm gì** | Sửa thông tin một kho đã có (đổi tên, đổi thủ kho, đổi loại…) |
| **Hiện trạng** | ⛔ **Bấm không mở gì** — dùng **cùng cửa sổ `warehouse`** như nút ① (nên khi ① có thì ② có luôn) |
| **Thiếu gì** | Giống ① |
| **❓ Anh cần quyết** | **Sửa được ô nào?** — thường **Mã kho ⛔ không cho sửa** (vì chứng từ cũ đang tham chiếu nó) · **Loại kho** có cho đổi không? |

## ③ «🗑 Xóa» kho

| | |
|---|---|
| **Dùng để làm gì** | Bỏ một kho khỏi hệ thống (kho lập nhầm, kho giải thể) |
| **Hiện trạng** | ⛔ **Bấm không làm gì** — nút gọi lệnh `delete_warehouse` mà **⛔ không tồn tại ở CẢ giao diện lẫn máy chủ** |
| **Thiếu gì** | Cần **API xoá kho** ở backend |
| **Em đề xuất** | ⛔ **Chặn xoá** khi: ① **còn tồn kho** ② **có chứng từ** (phiếu nhập/xuất/cấp phát/hoàn trả/điều chuyển trỏ tới kho) ③ **có kho con**<br>⇒ nếu ⛔ không vướng gì: **⛔ KHÔNG xoá cứng — chuyển sang «ngừng hoạt động»** ⭐ *(bảng kho đã có sẵn cột này ⇒ giữ được lịch sử)* |
| **❓ Anh cần quyết** | **Đồng ý 3 điều kiện chặn trên không?** · **Xoá mềm (ngừng hoạt động) hay xoá hẳn?** |

## ④ «＋ Tạo phiếu cấp phát»

| | |
|---|---|
| **Dùng để làm gì** | Lập phiếu **cấp vật tư cho tổ đội** (xuất kho đưa ra công trường) |
| **Hiện trạng** | ⛔ **Bấm không mở gì** — nút gọi cửa sổ tên `allocate` mà **app chưa có** |
| **Thiếu gì** | Cần **cửa sổ lập phiếu** + **API tạo phiếu cấp phát** |
| ⚠️ **Khó nhất — em ⛔ CHƯA đủ dữ liệu để đề xuất** | **Đo thật**: danh sách phiếu hiện có (`issues[]`, **29 phiếu**) **⛔ KHÔNG có trường «kho»** ⇒ ⛔ **không biết phiếu cấp phát sẽ TRỪ TỒN KHO NÀO** ⚠️ |
| **❓ Anh cần quyết (3 câu)** | ① **Phiếu cấp phát gồm những thông tin gì?** (người nhận? tổ đội? dự án? hạng mục? ngày? ghi chú?)<br>② **Trừ tồn kho nào?** — kho của dự án, hay kho do người lập chọn?<br>③ **Có cần duyệt không?** — nếu có thì **ai duyệt, mấy bước?** |

> ⭐ **Vì sao em ⛔ không tự làm**: **§14 của Goal cấm tự suy diễn nghiệp vụ** — và **chính mã nguồn anh ghi rõ**: «**⛔ Không tự suy diễn nghiệp vụ**» (`AllocateReturn.tsx:5-6`).
> Nếu em tự đoán rồi viết, **rất dễ sai nghiệp vụ thật** ⇒ anh sửa còn tốn thời gian hơn.

---

## ✅ 2 chức năng **ĐANG CHẠY ĐƯỢC** (để anh đối chiếu)

| Chức năng | Ở đâu |
|---|---|
| **«＋ Tạo phiếu hoàn trả»** | Tab «CẤP PHÁT & HOÀN TRẢ» — ✅ chạy được |
| **«Tạo phiếu nhập» / «Tạo phiếu xuất»** | Tab «XUẤT & NHẬP» + trong màn chi tiết kho — ✅ chạy được |
| **Sửa/xoá phiếu xuất · phiếu nhập** | ⛔ **chưa có** — backend chưa khai báo (⛔ cố ý, ⛔ không phải lỗi) |

---

## 📝 PHẦN ANH ĐIỀN (chỉ cần trả lời ngắn)

```
① TẠO KHO    — Loại kho gồm: ..............................................
                Mã kho: [ ] tự sinh   [ ] nhập tay

② SỬA KHO    — Cho sửa: ...................................................
                Mã kho: [ ] cho sửa   [ ] không cho sửa

③ XOÁ KHO    — Chặn xoá khi: [ ] còn tồn  [ ] có chứng từ  [ ] có kho con
                Cách xoá: [ ] ngừng hoạt động (giữ lịch sử)   [ ] xoá hẳn

④ CẤP PHÁT   — Phiếu gồm: .................................................
                Trừ tồn kho: ..............................................
                Duyệt: [ ] không cần   [ ] cần — ai duyệt: ................
```

**Anh trả lời xong ⇒ em viết mã ngay** (⛔ không hỏi lại gì thêm).

---

*Tài liệu này ⛔ không phải log kỹ thuật. Chi tiết kỹ thuật ở `DECISION_LOG.md` (`DEC-20261007-011`) · `BUG_HOTFIX_LOG.md` (`BUG-20261007-013/014/015`).*
