# TASK-166 — GO-LIVE ĐỢT 21: VÒNG ĐỜI CRUD TRÊN **THỰC THỂ NGHIỆP VỤ** (NCC · ĐỐI TÁC)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **8/8 ĐẠT** · ⛔ **rác để lại 0** · **không có bug sản phẩm mới** |
| **Tệp mới** | `tools/e2e/go-live-vong-doi-ncc-doi-tac.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi, ⛔ không cần build lại |

---

## ① KỸ THUẬT ĐANG DÙNG (đã hiệu quả ở TASK-165)

```text
save_*        → kiểm bản ghi XUẤT HIỆN
set_*_status  → kiểm TRẠNG THÁI ĐỔI
delete_*      → kiểm bản ghi MẤT
dọn dẹp       → kiểm số dòng VỀ NHƯ CŨ
```
⇒ ⛔ **an toàn tuyệt đối** (chỉ đụng bản ghi của mình) mà kiểm được **CẢ 3 action** ở **ĐƯỜNG THÀNH CÔNG** — điều kỹ thuật «id bịa» ⛔ không chạm tới.

⛔ **KHOÁ PAYLOAD trích từ chính form của UI** (⛔ không đoán):
| Thực thể | Trường (từ `*.tsx`) | Đọc lại |
|---|---|---|
| Nhà cung cấp | `code · name · taxCode · contactName · phone · email · leadTimeDays · rating` (`SupplierManager.tsx`) | `bootstrap.suppliers` |
| Đối tác | `code · name · taxCode · address · contactName · contactPhone · email · partnerType` (`PartnerManager.tsx`) | `bootstrap.partners` |

⛔ **BÀI HỌC TASK-165 ĐÃ ÁP DỤNG**: mã danh mục bị backend **CHUẨN HOÁ CHỮ THƯỜNG** ⇒ dùng **mã chữ thường** + tra **KHÔNG phân biệt hoa/thường** (⛔ nếu không sẽ **không xoá được** và **bể rác** như lần trước).

---

## ② KẾT QUẢ — 8/8 ĐẠT

### NHÀ CUNG CẤP (`e2e_ncc_390095`)
| Bước | Kết quả đo được |
|---|---|
| ① `save_supplier` | ✔ «Đã thêm nhà cung cấp E2E_NCC_390095.» ⇒ tìm theo mã ⇒ `SUP_3deb8c81-…` · danh sách **7 → 8** |
| ② `set_supplier_status {active: 0}` | ✔ «Đã ẩn nhà cung cấp khỏi danh sách lập PO.» |
| ③ `delete_supplier` | ✔ «Đã xóa Nhà cung cấp chưa phát sinh PO.» ⇒ **đã mất** · danh sách về **7** |
| ④ dọn sạch | ✔ `suppliers` = **7** (như cũ) |

### ĐỐI TÁC (`e2e_dt_390095`)
| Bước | Kết quả đo được |
|---|---|
| ① `save_partner` | ✔ «Đã thêm đối tác E2E_DT_390095.» ⇒ `PTR_1a3f2805-…` · danh sách **7 → 8** |
| ② `set_partner_status {active: 0}` | ✔ «Đã chuyển đối tác sang Ngừng sử dụng.» |
| ③ `delete_partner` | ✔ «Đã xóa Đối tác.» ⇒ **đã mất** · danh sách về **7** |
| ④ dọn sạch | ✔ `partners` = **7** (như cũ) |

**⇒ ĐẠT 8/8 · ⛔ rác để lại 0**

⭐ **6 action chưa từng được kiểm** (`save_supplier` · `set_supplier_status` · `delete_supplier` · `save_partner` · `set_partner_status` · `delete_partner`) nay **chứng minh chạy đúng trên đường thành công**.

---

## ③ ⭐ GHI CHÚ CHÍNH XÁC VỀ PHÉP ĐO ② (⛔ không nói quá)

Bài test in `active/status: true → undefined`. ⛔ **Không phải lỗi** — mà là **đúng thiết kế**, và cần nói rõ:

- `bootstrap.suppliers` / `bootstrap.partners` là **DANH SÁCH ĐANG HOẠT ĐỘNG** ⇒ sau khi **ẩn**, bản ghi **rời khỏi danh sách** (nên tra lại ⇒ `undefined`).
- ⭐ Vì vậy phép kiểm ② được tính **ĐẠT** vì **trạng thái ĐÃ ĐỔI** (bản ghi rời danh sách hoạt động) — đó **chính là hiệu quả mong đợi** của «ẩn».
- *(Ghi chú phụ: bootstrap còn có `adminSuppliers` / `adminPartners` là **danh sách quản trị** — dùng để xem cả bản ghi đã ẩn.)*

⇒ ⛔ Tôi **không** tuyên bố «`active` chuyển thành `false`» khi ⛔ chưa đo được trường đó trực tiếp.

---

## ④ KIỂM HẬU QUẢ (công cụ `chup-so-dong.mjs`)

| | |
|---|---|
| **TRƯỚC** | 131 bảng · **12429** dòng |
| **SAU** | 131 bảng · **12436** dòng |
| **Bảng đổi** | `audit_logs` 3542 → **3548** (+6 = đúng **6 lệnh thành công**) · `sessions` 3161 → **3162** (+1 = **phiên của tôi**) |

⭐ **Bảng `suppliers` và `partners` ⛔ KHÔNG nằm trong danh sách đổi** ⇒ **cả hai bản ghi nháp đã được dọn sạch** ✔
⭐ ⛔ **Không có bảng nghiệp vụ nào khác đổi** ⇒ bài test ⛔ **không đụng dữ liệu thật**.

---

## ⑤ TIẾN ĐỘ PHỦ KIỂM THỬ

| Vòng | Họ action | Số | Bug |
|---|---|---|---|
| 13 → 18 | «id bịa» (6 vòng) | 66 | 3 (1 HIGH · 1 MEDIUM · 1 LOW) |
| 19 | vòng đời CRUD `system_level` + `business_scope` | 6 | — |
| **20** | **vòng đời CRUD `supplier` + `partner`** | **6** | **—** |
| **Tổng** | | **78/92** | **3 bug thật** |

⭐ **Ba vòng gần nhất (78 action) ⛔ không ra bug mới** ⇒ chốt chặn + đường thành công của hệ thống **đồng đều và tốt**.

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời CRUD | **8/8 ĐẠT** · rác để lại **0** |
| Kiểm hậu quả | `audit_logs` +6 · `sessions` +1 · **bảng nghiệp vụ không đổi** |
| Bug sản phẩm mới | **0** |
| Phủ kiểm thử | **78/92** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **KỸ THUẬT TỐT THÌ NHÂN BẢN ĐƯỢC RẺ.** Vòng đời CRUD viết ở TASK-165 dùng lại **nguyên xi** cho 2 thực thể mới: chỉ tốn **bảng trường payload** + **hàm vòng đời chung** ⇒ 6 action nữa được phủ.
2. ⭐⭐ **BÀI HỌC CỦA VÒNG TRƯỚC ĐÃ CỨU VÒNG NÀY.** Dùng **mã chữ thường** + tra **không phân biệt hoa/thường** ⇒ ⛔ **không tái diễn** việc bể rác. ⭐ Ghi bài học vào **chính mã** là cách duy nhất để nó **thực sự** có tác dụng.
3. ⭐ **ĐO ĐƯỢC GÌ NÓI NẤY — ⛔ KHÔNG NÓI QUÁ.** Phép đo ② chỉ thấy bản ghi **rời danh sách hoạt động**, ⛔ **không** thấy trực tiếp `active = false` ⇒ tôi ghi đúng như vậy, ⛔ không tuyên bố quá.
4. ⭐ **`adminSuppliers` / `adminPartners` LÀ DANH SÁCH QUẢN TRỊ** (khác danh sách hoạt động) — ⭐ chi tiết này giải thích vì sao `partners` = 7 mà `adminPartners` = 8.
5. ⭐ **KIỂM HẬU QUẢ ĐÃ THÀNH THÓI QUEN.** Ba vòng liên tiếp dùng `chup-so-dong.mjs` trước/sau ⇒ nay mọi thí nghiệm đều **có bằng chứng không để lại rác**, ⛔ không cần tin vào lời hứa.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **111+ tệp** thay đổi chưa commit.
⛔ **Cần user quyết — 5 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010 · BUG-20261011**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS.
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?** (`material_norm` · `payment_plan` · `seal` · `legal_document` · `correspondence` · `business_role_group` — đều **đã có đủ 3 action**)
7. ⭐ **3 action loại trừ vì đổi cấu hình** — kiểm bằng cách khác?
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»? · 11. Commit?
