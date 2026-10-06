# TASK-161 — GO-LIVE ĐỢT 16: TỔNG QUÁT HOÁ «KIỂM CHỐT CHẶN BẰNG ID BỊA»

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **11/11 chốt chặn VỮNG** · 0 báo thành công sai · **0 × 500** ⇒ **KHÔNG có bug sản phẩm mới** |
| **Tệp mới** | `tools/e2e/go-live-kiem-chot-chan-update-set-bulk.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi, ⛔ không cần build lại |

---

## ① TỔNG QUÁT HOÁ KỸ THUẬT ĐÃ TÌM RA BUG-20261010

Vòng 14 tìm ra **BUG-20261010** (HIGH, quyền) bằng cách gọi `delete_*` với **id KHÔNG TỒN TẠI** — **1 lỗi / 8 action**. Vòng này áp dụng **cùng kỷ luật** cho họ `update_*` / `set_*_status` / `bulk_*`.

**Vì sao an toàn:** chỉ dùng **id bịa** + payload **rỗng/vô nghĩa** ⇒ ⛔ **không thể sửa/xoá dữ liệu thật**, mà vẫn phát hiện được:
1. trả **200 «thành công»** cho việc không tồn tại (báo sai — đúng loại BUG-20261010);
2. trả **5xx** (lỗi hệ thống thay vì lỗi đầu vào đọc được).

⛔ **KHOÁ PAYLOAD ĐỌC TỪ MÃ UI, ⛔ KHÔNG ĐOÁN** — bài học từ vòng 14 (`delete_department_permission` dùng `organizationUnitId`+`moduleKey`, ⛔ không phải `permissionId`).

---

## ② KẾT QUẢ — 11/11 VỮNG, ⛔ KHÔNG CÓ BUG MỚI

| Action | HTTP | Kết quả | Thông báo |
|---|---|---|---|
| `update_work_item_status` | 400 | ✔ chặn sạch | Trạng thái nhiệm vụ không hợp lệ. |
| `set_business_role_group_status` | 400 | ✔ chặn sạch | Không tìm thấy nhóm nghiệp vụ. |
| `set_legal_document_status` | 400 | ✔ chặn sạch | Không tìm thấy văn bản. |
| `set_correspondence_status` | 400 | ✔ chặn sạch | Không tìm thấy công văn. |
| `bulk_material_subcategory_action` | 400 | ✔ chặn sạch | Chưa chọn vật tư/nhóm con. |
| `reorder_form_fields` | 400 | ✔ chặn sạch | Biểu mẫu cấu hình không hợp lệ. |
| `bulk_import_projects` | 400 | ✔ chặn sạch | File không có dự án để nhập. |
| `bulk_import_users` | 400 | ✔ chặn sạch | File không có tài khoản để nhập. |
| `update_project` | 400 | ✔ chặn sạch | Không tìm thấy dự án. |
| `update_user` | 400 | ✔ chặn sạch | Không tìm thấy tài khoản. |
| `bulk_boq_item_action` | 200 | ✔ no-op nói rõ **0** | Đã xóa/ẩn **0 dòng** BOQ; có thể khôi phục khi cần. |

**Tổng: ĐẠT 11/11 · ⛔ báo thành công sai 0 · ⛔ 500 lỗi hệ thống 0**

⭐ **Đây là KẾT QUẢ ÂM có giá trị**: cả họ chốt chặn `update_*` / `set_*_status` / `bulk_*` **vững vàng**, và ⛔ **không có 500 nào**. Báo cáo trung thực kết quả âm quan trọng ngang việc tìm ra lỗi — ⛔ không được «thổi» nó thành lỗi cho có chuyện.

---

## ③ ⭐ PHÂN LOẠI TINH HƠN: «NO-OP TRUNG THỰC» ≠ «BÁO THÀNH CÔNG SAI»

Phép đo đầu gộp cả hai vào «200 = LỖI» ⇒ **2 cảnh báo**, thực tế **cả hai đều không phải lỗi**:

| Action | Phép đo đầu nói | SỰ THẬT |
|---|---|---|
| `bulk_boq_item_action` | ⛔ «BÁO THÀNH CÔNG SAI» | ✅ **KHÔNG phải lỗi** — thông báo **NÓI RÕ «Đã xóa/ẩn 0 dòng BOQ»** ⇒ **TRUNG THỰC** về việc không làm gì (no-op báo minh bạch). ⭐ Đây là hành vi **TỐT**, khác hẳn BUG-20261010 (báo 200 mà ⛔ **không nói rõ** đã làm gì). |
| `update_profile_avatar` | ⛔ «BÁO THÀNH CÔNG SAI» | ⛔ **BÀI TEST CỦA TÔI SAI THIẾT KẾ** — xem ④ |

⇒ **Đã sửa cách phân loại**: `4xx sạch` = TỐT · `200 nhưng nói rõ «0 …»` = **CHẤP NHẬN** · `200 mà không nói gì` = **LỖI** · `5xx` = **LỖI**.

---

## ④ ⛔⛔ LỖI THIẾT KẾ TRONG CHÍNH BÀI TEST CỦA TÔI — VÀ ĐÃ KIỂM HẬU QUẢ

Tôi đưa `update_profile_avatar` vào danh sách «kiểm bằng id bịa» — **SAI**: action đó **KHÔNG nhận tham số id nào** (`app/page.tsx:3388`: `saveAvatar()` gửi `{avatarDataUrl: avatar}`) ⇒ «id bịa» ⛔ không áp dụng được, và nó tác động lên **CHÍNH tài khoản đang đăng nhập** — tức tài khoản **admin của tôi**. Kết quả nó báo «Đã xóa ảnh đại diện».

**ĐÃ KIỂM HẬU QUẢ NGAY:**
```
SELECT COUNT(*) FROM users WHERE avatar_url IS NOT NULL AND avatar_url<>''   -->  0
admin: avatar_null=1 · độ dài 0
```
⇒ **KHÔNG tài khoản nào trong hệ thống có ảnh đại diện** ⇒ ⛔ **không xoá gì**. Vô hại trong lần này, ⛔ **nhưng là lỗi thiết kế của tôi** và có thể đã gây hại nếu admin có ảnh.

**QUY TẮC RÚT RA:** ⛔ chỉ dùng «id bịa» cho action **CÓ** tham số id. Action **tự-phục-vụ** (không id) phải xếp **loại riêng** và ⛔ không chạy lung tung vì nó sửa **chính dữ liệu của người chạy**. Nhóm này: `update_profile_avatar` · `change_password` · `mark_notification_all_read` — đã ghi thẳng trong mã bài test.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Chốt chặn `update_*`/`set_*_status`/`bulk_*` | **11/11 VỮNG** · 0 báo sai · **0 × 500** |
| Bug sản phẩm mới | **0** |
| Hậu quả từ lỗi thiết kế của bài test | **0** (đã đo: 0 tài khoản có ảnh đại diện) |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **4 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **KỸ THUẬT TỐT THÌ TỔNG QUÁT HOÁ ĐƯỢC.** «Gọi bằng id bịa» sinh ra từ nhu cầu kiểm `delete_*` an toàn; áp sang `update_*`/`set_*`/`bulk_*` chỉ tốn một bài test mà phủ thêm **11 action**.
2. ⭐⭐ **KẾT QUẢ ÂM CŨNG LÀ KẾT QUẢ.** 11/11 vững là **bằng chứng chất lượng** đáng báo cáo. ⛔ Không được «thổi» nó thành lỗi cho có chuyện — **báo động giả cũng là sai**.
3. ⭐ **PHÂN LOẠI PHẢI TINH: «no-op trung thực» ≠ «báo thành công sai».** `bulk_boq_item_action` nói rõ «**0 dòng**» ⇒ hành vi **TỐT**. Gộp chung là **báo sai 2 chỗ**.
4. ⛔⛔ **PHẢI PHÂN LOẠI ACTION TRƯỚC KHI CHỌN CÁCH KIỂM.** Action **không có tham số id** thì «id bịa» ⛔ vô nghĩa — và nguy hiểm hơn: nó sửa **dữ liệu của chính người chạy**. Tôi đã mắc và **đã kiểm hậu quả** (may là vô hại: `0` tài khoản có ảnh đại diện).
5. ⭐ **MỖI THÍ NGHIỆM PHẢI CÓ BƯỚC «KIỂM HẬU QUẢ».** Chạy xong ⛔ không được coi là xong — phải **đo lại trạng thái** để chắc mình không gây hại (đã làm ở cả vòng 14 và vòng này).

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — 4 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. **~79 action UI gọi còn lại chưa được kiểm** — lấp tiếp? (đã lấp **13**: 2 vòng 13 + 8 vòng 14 + 3 loại trừ)
7. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**) — việc lớn, cần quyết riêng.
8. Xoá đăng ký thừa `manage_contract_review`? · 9. Mở task «thêm thành viên tổ đội»? · 10. Commit?
