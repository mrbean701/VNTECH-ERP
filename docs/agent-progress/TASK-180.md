# TASK-180 — GO-LIVE ĐỢT 35: ⛔ RÚT LẠI «KHIẾM KHUYẾT A» + ✅ XÁC NHẬN & VÁ «KHIẾM KHUYẾT B»

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Tiếp nối** | **TASK-179** (tôi công bố «nguyên nhân» gồm 2 khiếm khuyết A + B) |
| **Kết quả** | ⛔ **A SAI — ĐÃ RÚT LẠI** · ✅ **B ĐÚNG — đã xác nhận bằng `ActionRbacRegistry` VÀ ĐÃ VÁ** |
| **Tệp sửa** | `tools/e2e/cap-quyen-chuc-nang.mjs` (**+14 dòng**, chỉ mã nguồn — ⛔ **không chạy**) |
| **Vân tay** | ⛔ **không đổi** (`tools/` ngoài `ROOT_DIRS`) |

---

## ① ⛔ RÚT LẠI «KHIẾM KHUYẾT A» — TÔI ĐÃ KẾT LUẬN TỪ **GREP**, ⛔ KHÔNG ĐỌC KHỐI MÃ

**Tôi đã tuyên bố (TASK-179)**: *«`go-live-chuoi-kho.mjs` gọi `issue_stock_confirm` bằng `e2e.to` — SAI TÀI KHOẢN»*.

⛔ **ĐỌC KHỐI MÃ THÌ SAI:**
```js
// tools/e2e/go-live-chuoi-kho.mjs
127:  await login("e2e.cht", MK);          // CHT duyệt
128:  const r2 = await buoc("② approve_stock_issue (CHT duyệt)", () => coThat("approve_stock_issue", { issueId, … }), BC);
134:  await login("e2e.tk", MK);           // ⭐ THỦ KHO
135:  const r3 = await buoc("③ issue_stock_confirm …", () => coThat("issue_stock_confirm", { issueId }), BC);
```
⇒ ⭐⭐ **SCRIPT ĐÃ DÙNG ĐÚNG `e2e.tk`** cho `issue_stock_confirm` (đăng nhập ở dòng **134**, gọi ở dòng **135**) ✓

⛔ **VÌ SAO TÔI SAI**: tôi suy ra từ một **dòng log cũ** (`«phiếu hoàn trả (cùng tài khoản e2e.to)»` — dòng đó thuộc **bước `return_stock`**, ⛔ không phải `issue_stock_confirm`) + **grep** thấy `e2e.to` trong tệp ⇒ ⛔ **kết luận từ hai mảnh rời, ⛔ không đọc khối mã liền mạch**.
⭐ **`e2e.to` ở dòng 162 là dùng ĐÚNG** — `e2e.to` (tổ đội) **có** `teams.canCreate` theo ma trận nên **được `return_stock`** ✓

⇒ ⛔ **«Khiếm khuyết A» ⛔ KHÔNG TỒN TẠI** — **ĐÃ RÚT LẠI** ✓

---

## ② ✅ «KHIẾM KHUYẾT B» — **XÁC NHẬN BẰNG MÃ NGUỒN** (⛔ không đoán)

**Tôi đã tuyên bố**: *«⛔ không vai trò nào có `requests` + `canCreate` ⇒ `create_request` bất khả thi»*.
✅ **KIỂM CHỨNG BẰNG `ActionRbacRegistry.java`:**
```java
dòng  98:  Map.entry("create_request", List.of("requests"));   // module  = requests
dòng 365:  Map.entry("create_request", "canCreate");            // quyền   = canCreate
```
⭐ Và `requests` còn gác **6 action**: `cancel_request` · `create_request` · `delete_request` · `preview_request_import` · `resubmit_request` · `update_returned_request` ⇒ ⭐ **cả một NHÓM CHỨC NĂNG ⛔ không cấp được cho ai** ✓

⭐ **Đối chiếu ma trận `VAI_TRO`**: chỉ **`e2e.thukysa`** có `requests: XEM` = `{canView:1, canUse:1}` ⇒ ⛔ **KHÔNG có `canCreate`** ⇒ ✅ **B ĐÚNG** ✓

---

## ③ 🔧 ĐÃ VÁ «B» — CHỈ MÃ NGUỒN, ⛔ KHÔNG CHẠY

```diff
  "e2e.project": { ten: "Nhân viên Dự án", quyen: {
    teams: { ...XEM, canCreate: 1 }, warehouse_issue: XEM, stocktake: XEM, receiving: XEM, inventory: XEM,
+   requests: { ...XEM, canCreate: 1 },
  } },
```

⭐ **VÌ SAO CHỌN `e2e.project`** (3 lý do, ⛔ không đoán):
| # | Lý do |
|---|---|
| **a** | ⭐ `giai-doan-09` **gọi `create_request` bằng chính `e2e.project`** (đo: tài khoản quanh mọi lần gọi `create_request` là `e2e.project`) |
| **b** | ⭐ **Hợp nghiệp vụ** — **nhân viên dự án lập phiếu đề nghị mua hàng** là luồng đúng của ERP (và đúng chỉ đạo của user: «các user thuộc phạm vi workflow sẽ thực hiện thao tác lập phiếu đề nghị mua hàng») |
| **c** | ⭐ **Theo KHUÔN CÓ SẴN trong cùng tệp** — `teams: { ...XEM, canCreate: 1 }` ⇒ ⛔ **không phát minh dạng mới** |

**KIỂM CHỨNG**: `node --check tools/e2e/cap-quyen-chuc-nang.mjs` ⇒ **EXIT=0** (cú pháp đúng) ✓ · vân tay nguồn **không đổi** ✓
⛔ **KHÔNG chạy công cụ** — vì nó gọi `save_user_access` (replace-all) **trên hệ thật**, tôi **đã cam kết ⛔ không chạy khi chưa có mắt người** ✓

---

## ④ ⛔ SỰ THẬT CỐT LÕI **VẪN CHƯA GIẢI** — VÀ NAY NÓ RÕ HƠN BAO GIỜ

⭐ **PHÉP ĐO QUAN TRỌNG NHẤT CỦA CẢ CHUỖI:**
> **`e2e.tk` theo ma trận CÓ `warehouse_issue: GHI` — nhưng trong DB `can_use = 0`.**

⇒ ⭐⭐ **ĐÓ CHÍNH LÀ BẰNG CHỨNG rằng bước 8.2 (`save_user_access`) **CHƯA BAO GIỜ GHI ĐƯỢC CỜ**.** ⛔ **Không có cách giải thích nào khác**: nếu cờ được ghi, `e2e.tk` phải có `can_use=1` trên `warehouse_issue` ✓
⭐ **VÀ ĐÓ LÀ LÝ DO THẬT KHIẾN `giai-doan-09` + `go-live-chuoi-kho` TỤT ĐIỂM** — ⛔ **không phải «sai tài khoản»** như tôi tuyên bố sai ở TASK-179 ✓

**Giả thuyết thứ 6 — ĐÃ BÁC BỎ TRƯỚC KHI THỬ**: «đơn vị có 59 module (Kế hoạch · BGD) làm hàm kiểm throw 400» ⇒ ⛔ **không giải thích được `e2e.to`/`e2e.tk`** vì **Phòng Dự án có ĐỦ 60 module** mà vẫn `can_use=0` ✓

⛔ **KẾT LUẬN TRUNG THỰC**: **cơ chế khiến cờ không vào DB vẫn ⛔ CHƯA RÕ** sau **6 giả thuyết bị bác bỏ**. ⭐ **Cách duy nhất còn lại**: **1 phép thử GHI** (cấp 1 module cho 1 tài khoản rồi đọc lại DB) — ⛔ **cần user cho phép**.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| «Khiếm khuyết A» | ⛔ **SAI — ĐÃ RÚT LẠI** (đọc khối mã: script dùng **đúng `e2e.tk`**) |
| «Khiếm khuyết B» | ✅ **ĐÚNG — xác nhận bằng `ActionRbacRegistry` dòng 98 + 365** |
| Đã vá B | ✅ **+14 dòng** trong `tools/e2e/cap-quyen-chuc-nang.mjs` · `node --check` **EXIT=0** |
| ⛔ Chưa giải | **cơ chế khiến cờ không vào DB** — sau **6 giả thuyết bị bác bỏ** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **GREP LÀ ĐỂ TÌM, ⛔ KHÔNG PHẢI ĐỂ KẾT LUẬN.** Tôi thấy `e2e.to` trong tệp + một dòng log cũ ⇒ **tuyên bố «sai tài khoản»**. ⭐ **Đọc khối mã liền mạch 40 dòng** cho thấy **script dùng đúng `e2e.tk`**. ⭐ **Sau khi grep ra một dòng, PHẢI đọc ngữ cảnh xung quanh trước khi nói «nguyên nhân là…».**
2. ⛔ **6 GIẢ THUYẾT BỊ BÁC BỎ TRONG MỘT CHUỖI ĐIỀU TRA** — ① backend không lưu cờ · ② hàm kiểm kẹp cờ · ③ payload khai `department_default` · ④ xoá trắng quyền · ⑤ hàm kiểm throw 400 (thiếu `can_view`) · ⑥ đơn vị 59 module ⇒ throw. ⭐ **Đây là dấu hiệu tôi đang ĐOÁN thay vì ĐỌC.**
3. ⭐⭐ **PHÉP ĐO MẠNH NHẤT LÀ PHÉP ĐO ĐỐI CHIẾU THIẾT KẾ ⇄ DỮ LIỆU.** `e2e.tk` **đáng lẽ** có `warehouse_issue: GHI` (ma trận) **nhưng** DB ghi `can_use=0` ⇒ ⭐ **một phép so sánh duy nhất định vị được toàn bộ vấn đề** — ⛔ không cần 6 giả thuyết.
4. ⭐ **RÚT LẠI MỘT TUYÊN BỐ SAI LÀ VIỆC PHẢI LÀM, ⛔ KHÔNG PHẢI VIỆC ĐÁNG XẤU HỔ.** Tôi đã công bố A như một «nguyên nhân» — nay rút lại và **ghi rõ vì sao sai** ⇒ ⭐ phiên sau ⛔ không lặp lại.
5. ⭐ **VÁ «B» NHƯNG ⛔ KHÔNG CHẠY** — vì cấp quyền là **hành động GHI trên hệ thật**, và tôi đã cam kết ⛔ không chạy `save_user_access` khi chưa có mắt người ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **127 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt **cơ chế khiến cờ không vào DB** — ⭐ **đây là câu hỏi DUY NHẤT còn lại của cả chuỗi**, và nó **chặn việc khôi phục quyền 14 tài khoản test**.
2. ⭐⭐ **Cho phép chạy lại `tools/e2e/cap-quyen-chuc-nang.mjs`** (đã vá B) để khôi phục quyền — ⭐ lệnh này **đồng thời chính là phép thử GHI ở (1)**.
3. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
4. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
5. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?** (bản vá B dựa trên giả định này)
6. **Commit theo NHÓM hay gộp?** · `stack-form` · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **CRUD 6 thực thể** · **khoá ngoại**.
