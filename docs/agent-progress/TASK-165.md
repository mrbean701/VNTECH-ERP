# TASK-165 — GO-LIVE ĐỢT 20: ĐỔI KỸ THUẬT — KIỂM **ĐƯỜNG THÀNH CÔNG** TRÊN DỮ LIỆU NHÁP

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **6/6 vòng đời CRUD ĐẠT** trên **dữ liệu nháp** · ⛔ **rác để lại: 0** · **không có bug sản phẩm mới** |
| **Tệp mới** | `tools/e2e/go-live-vong-doi-cap-bac.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi, ⛔ không cần build lại |

---

## ① ⭐ VÌ SAO ĐỔI KỸ THUẬT — GIỚI HẠN CỐ HỮU CỦA «ID BỊA»

Kỹ thuật «id bịa» (TASK-159 → TASK-164) đã phủ **66/92** action UI gọi mà chưa hề được kiểm, và tìm ra **3 bug thật**. Nhưng nó có **GIỚI HẠN CỐ HỮU**:

> Nó chỉ chứng minh **«đầu vào SAI bị chặn»**, ⛔ **KHÔNG** chứng minh **«đầu vào ĐÚNG thì chạy đúng»**.

⭐ **Và dấu hiệu đổi kỹ thuật đã rõ**: **2 vòng gần nhất (66 action) ⛔ không ra bug mới** ⇒ tới hạn hiệu quả.

⇒ **KỸ THUẬT MỚI: VÒNG ĐỜI CRUD TRỌN VẸN TRÊN BẢN GHI NHÁP DO CHÍNH BÀI TEST TẠO**
```text
save_*  → kiểm bản ghi XUẤT HIỆN
set_*_status → kiểm TRẠNG THÁI ĐỔI
delete_* → kiểm bản ghi MẤT
```
⇒ ⛔ **an toàn tuyệt đối** (chỉ đụng bản ghi của mình) mà kiểm được **CẢ 3 action** ở **ĐƯỜNG THÀNH CÔNG**.

---

## ② KẾT QUẢ — 6/6 ĐẠT

### Vòng đời 1 — `system_level`
| Bước | Kết quả đo được |
|---|---|
| ① `save_system_level` (mã `E2E_TMP_267350`) | ✔ «Đã lưu cấp bậc "Cấp bậc nháp E2E_TMP_267350".» ⇒ danh mục **7 → 8** · tìm theo mã ⇒ `LVL_8d709c39-…` |
| ② `set_system_level_status {active: 0}` | ✔ «Đã ngừng dùng cấp bậc (tài khoản đang giữ vẫn giữ nguyên).» ⇒ `active: true → false` |
| ③ `delete_system_level` | ✔ «Đã xóa cấp bậc.» ⇒ danh mục **8 → 7** · tìm theo mã ⇒ **đã mất** |

### Vòng đời 2 — `business_scope`
| Bước | Kết quả đo được |
|---|---|
| ④ `save_business_scope` (mã `e2e_scope_269042`) | ✔ «Đã thêm phạm vi nghiệp vụ Phạm vi nháp e2e_scope_269042.» ⇒ tìm theo mã ⇒ `BSCOPE_bb599aaa-…` |
| ⑤ `set_business_scope_status {active: 0}` | ✔ «Đã ẩn phạm vi nghiệp vụ.» ⇒ `active: true → false` |
| ⑥ `delete_business_scope` | ✔ «Đã xóa phạm vi nghiệp vụ chưa phát sinh liên kết.» ⇒ **đã mất** |

**⇒ ĐẠT 6/6 · ⛔ rác để lại 0**

⭐ **6 action chưa từng được kiểm nay đã được chứng minh CHẠY ĐÚNG trên đường thành công** — mạnh hơn hẳn «bị chặn khi đầu vào sai».

---

## ③ ⭐⭐ KIỂM HẬU QUẢ ĐÃ BẮT ĐƯỢC **RÁC CỦA CHÍNH TÔI**

**Lần chạy ĐẦU**, bảng `business_scope_catalog` **9 → 10** ⇒ ⭐ **công cụ `chup-so-dong.mjs` báo ngay** đúng như thiết kế: *«⛔ mọi bảng KHÁC mà tăng ⇒ phải tìm bản ghi đó và DỌN SẠCH trước khi kết luận»*.

### ROOT CAUSE — ⛔ **LỖI CỦA TÔI**, ⛔ KHÔNG PHẢI LỖI SẢN PHẨM
| | |
|---|---|
| Hiện tượng | `save_business_scope` trả ✔ «Đã thêm phạm vi nghiệp vụ…» nhưng tra theo mã ⛔ **không thấy** ⇒ bài test ⛔ không xoá được ⇒ **bỏ lại 1 dòng** |
| Đo trong DB | Dòng **CÓ THẬT**, nhưng mã đã thành **`e2e_scope_217876`** — **CHỮ THƯỜNG** |
| Nguyên nhân | Backend **chuẩn hoá mã thành chữ thường** — đúng như kiểm tra của sản phẩm ghi rõ: «Mã phạm vi gồm 2–40 ký tự **a-z**, số, gạch dưới». Tôi gửi **CHỮ HOA** ⇒ tra theo mã ⛔ không khớp |
| ⭐ Kết luận | **Sản phẩm ĐÚNG** — lỗi ở **bài test của tôi** |
| Đã sửa | Dùng **mã chữ thường** + tra **KHÔNG phân biệt hoa/thường**; **ghi thẳng bài học vào mã** |
| Đã dọn | `delete_business_scope` ⇒ «Đã xóa phạm vi nghiệp vụ chưa phát sinh liên kết.» ⇒ `business_scope_catalog` **về 9** ✔ |

⭐ **CHẠY LẠI SAU KHI SỬA — KIỂM HẬU QUẢ SẠCH:** `audit_logs` +6 (đúng 6 lệnh thành công) · `sessions` +1 (phiên của tôi) · **cả hai bảng danh mục ⛔ KHÔNG đổi** ⇒ **⛔ không để lại rác** ✔

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời CRUD | **6/6 ĐẠT** · rác để lại **0** |
| Kiểm hậu quả | `audit_logs` +6 (lệnh của tôi) · `sessions` +1 (phiên của tôi) · **bảng danh mục không đổi** |
| Bug sản phẩm mới | **0** |
| Phủ kiểm thử | **72/92** action UI gọi mà chưa hề được kiểm |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **BIẾT GIỚI HẠN CỦA KỸ THUẬT ĐANG DÙNG — VÀ ĐỔI ĐÚNG LÚC.** «Id bịa» chỉ chứng minh **đầu vào sai bị chặn**; nó ⛔ **không** nói gì về **đường thành công**. Hai vòng 0 bug là **tín hiệu** phải đổi, ⛔ không phải tín hiệu «hết việc».
2. ⭐⭐⭐ **KIỂM HẬU QUẢ ĐÃ CHỨNG MINH GIÁ TRỊ Ở CẢ HAI CHIỀU.** Vòng trước nó xác nhận «không đụng gì»; **vòng này nó BẮT ĐƯỢC RÁC CỦA CHÍNH TÔI** ⇒ ⭐ công cụ không chỉ để **trấn an**, mà để **phát hiện**. Nếu ⛔ không có bước này, tôi đã **để lại rác vĩnh viễn** trong danh mục thật.
3. ⭐⭐ **PHÂN BIỆT «SẢN PHẨM SAI» VỚI «BÀI TEST SAI» TRƯỚC KHI BÁO BUG.** Triệu chứng «tạo xong ⛔ không thấy» **thoạt nhìn như bug sản phẩm**; đọc kiểm tra của sản phẩm («mã **a-z**…») thì ra **tôi** gửi chữ HOA. ⛔ Nếu vội báo thì đã là **báo động giả**.
4. ⭐ **VÒNG ĐỜI CRUD KIỂM ĐƯỢC 3 ACTION MỘT LƯỢT.** Thay vì 3 bài riêng cho `save_*`/`set_*_status`/`delete_*`, **một chuỗi** vừa chứng minh cả 3 chạy đúng, vừa **tự dọn**.
5. ⭐ **GẮN BÀI HỌC VÀO CHÍNH MÃ.** Nguyên nhân chữ HOA/thường nay **ghi thẳng trong bài test** ⇒ ⛔ phiên sau không tái diễn.

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit** — nay **110+ tệp** thay đổi chưa commit.
⛔ **Cần user quyết — 5 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010 · BUG-20261011**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS.
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. ⭐ **Tiếp tục vòng đời CRUD cho các thực thể khác?** (kỹ thuật mới đang hiệu quả — vd `material_norm` · `role_group` · `payment_plan` · `seal` · `legal_document` · `correspondence`)
7. ⭐ **3 action loại trừ vì đổi cấu hình** — có muốn kiểm bằng cách an toàn khác?
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»? · 11. Commit?
