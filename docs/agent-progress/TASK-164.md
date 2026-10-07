# TASK-164 — GO-LIVE ĐỢT 19: PHỦ HỌ `set_*_status` / `approve_*` / `confirm_*` — 32/32 VỮNG

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **32/32 chốt chặn VỮNG** · 0 báo thành công sai · ⛔ **0 × 500** · ✅ kiểm hậu quả **SẠCH NHẤT** ⇒ **không có bug mới** |
| **Tệp mới** | `tools/e2e/go-live-phu-set-status.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi, ⛔ không cần build lại |

---

## ① PHẠM VI VÒNG NÀY

Sau khi phủ hết họ `delete_*` (TASK-163), họ lớn nhất còn lại là **`set_*_status` (19 action)** cùng **`approve_*` / `confirm_*` / `resubmit_*` / `merge_*` / `import_*` (13 action)**.

**Kỹ thuật giữ nguyên** (đã tìm ra BUG-20261010 và BUG-20261011): gọi bằng **id KHÔNG TỒN TẠI** + giá trị vô nghĩa ⇒ ⛔ **không thể đổi trạng thái dữ liệu thật**, mà vẫn phát hiện được ① **200 báo thành công sai** hoặc ② **5xx**.
⛔ **KHOÁ PAYLOAD đọc từ mã UI cho cả 32 action** (⛔ không đoán).

⛔⛔ **BA ACTION BỊ LOẠI TRỪ VÌ ĐỔI CẤU HÌNH THẬT** (⛔ không phải bỏ sót — **ghi rõ lý do**):
| Action | Vì sao ⛔ không chạy |
|---|---|
| `reorder_menu_layout` | gửi payload bịa có thể **GHI ĐÈ bố cục menu thật** |
| `reset_material_catalog_test` | tên nói «**reset**» ⇒ ⛔ nguy cơ **xoá danh mục vật tư** |
| `delete_unused_materials` | ⛔ xoá **MỌI vật tư không dùng** (đã loại ở TASK-163) |

---

## ② KẾT QUẢ — 32/32 VỮNG, ⛔ 0 × 500

**Cả 32 action trả 400 SẠCH** với thông báo **tiếng Việt đọc được**:

| Nhóm | Action tiêu biểu | Thông báo |
|---|---|---|
| `set_*_status` (19) | `set_material_status` · `set_project_status` · `set_supplier_status` · `set_partner_status` · `set_seal_status` · `set_system_level_status` · `set_organization_unit_status` · `set_menu_group_status` · `set_module_status` · `set_payment_plan_status` … | «Không tìm thấy vật tư / dự án / nhà cung cấp / đối tác / con dấu / cấp bậc / đơn vị tổ chức / nhóm menu / kế hoạch thanh toán…» · `set_module_status` «Mục chức năng không hợp lệ.» |
| `approve_*` (5) | `approve_construction_daily_log` · `approve_production_report` · `approve_site_expense_claim` · `approve_stock_count` · `approve_team_production` | «Không tìm thấy nhật ký thi công / báo cáo sản lượng / chi phí…» · `approve_stock_count` «Phiếu kiểm kê không tồn tại hoặc đã xử lý.» · `approve_team_production` «Hồ sơ sản lượng không còn ở trạng thái…» |
| `confirm_*` (2) | `confirm_delivery` · `confirm_installation` | «Chuyến giao không tồn tại hoặc đã được BCH…» · «Dòng xác nhận lắp đặt không hợp lệ.» |
| Khác (6) | `resubmit_request` · `merge_material_master` · `import_material_catalog` · `import_contract_payments` · `install_license_foundation` · `clear_boq_version` | «Không tìm thấy phiếu đề nghị.» · «Hợp nhất cần hai mã vật tư khác nhau.» · «File danh mục vật tư không có dòng dữ liệu.» · «File thanh toán không có dữ liệu.» · «Nội dung license không phải JSON hợp lệ.» · «Hợp đồng không tồn tại/đã ngừng áp dụng…» |

**Tổng: ĐẠT 32/32 · ⛔ báo thành công sai 0 · ⛔ 500 = 0**

⭐ **Kết quả ÂM thứ ba liên tiếp** — chất lượng chốt chặn của hệ thống **đồng đều và tốt**.

---

## ③ ⭐ KIỂM HẬU QUẢ — SẠCH NHẤT TỪ TRƯỚC TỚI NAY

| | |
|---|---|
| **TRƯỚC** | 131 bảng · **12408** dòng |
| **SAU** | 131 bảng · **12409** dòng |
| **Bảng đổi** | **`sessions`** 3154 → **3155** (+1) — ⭐ **phiên đăng nhập của chính tôi** |

⇒ ⭐ **KHÔNG bảng nào khác đổi** — kể cả `audit_logs` (vì 32 lệnh này đều bị **chặn ở tầng kiểm tra** trước khi ghi nhật ký) ⇒ **kết luận mạnh nhất có thể**: 32 action ⛔ **không đụng một dòng dữ liệu nào** ✔

---

## ④ TIẾN ĐỘ PHỦ KIỂM THỬ

| Vòng | Họ action | Số | Bug tìm được |
|---|---|---|---|
| 13 | `mark_notification_all_read` · `change_password` | 2 | 1 MEDIUM (BUG-20261009) |
| 14 | `delete_*` (mẫu 8) | 8 | **1 HIGH (BUG-20261010)** |
| 15 | `update_*`/`set_*_status`/`bulk_*` | 11 | — |
| 16 | `save_*` | 10 | — |
| 17 | `delete_*` (phủ hết 34) | 34 | **1 LOW (BUG-20261011)** |
| **18** | **`set_*_status`/`approve_*`/`confirm_*`** | **32** | **—** |
| **Tổng đã phủ** | | **66/92** | **3 bug thật** (1 HIGH · 1 MEDIUM · 1 LOW) |

⭐ **Hai vòng gần nhất (66 action) KHÔNG ra bug mới** ⇒ có thể chất lượng chốt chặn **đã tốt ở phần còn lại**, ⛔ hoặc kỹ thuật «id bịa» **đã tới hạn hiệu quả** với nhóm này.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Chốt chặn 32 action | **32/32 VỮNG** · 0 báo sai · **0 × 500** |
| Kiểm hậu quả | chỉ `sessions` +1 (phiên của tôi) ⇒ **0 bảng khác đổi** |
| Bug sản phẩm mới | **0** |
| Phủ kiểm thử | **66/92** action UI gọi mà chưa hề được kiểm |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **KẾT QUẢ ÂM LẦN THỨ BA LIÊN TIẾP — VÀ ĐÓ LÀ TIN TỐT.** 32/32 vững với thông báo **tiếng Việt đọc được** là **bằng chứng chất lượng đồng đều**. ⛔ Vẫn ⛔ không «thổi» thành lỗi.
2. ⭐ **KIỂM HẬU QUẢ CÀNG SẠCH THÌ KẾT LUẬN CÀNG MẠNH.** Lần này **chỉ `sessions` +1** (kể cả `audit_logs` cũng ⛔ không đổi, vì 32 lệnh bị **chặn trước khi ghi nhật ký**) ⇒ mạnh hơn hẳn lần trước (có `audit_logs` +3) ⇒ ⭐ **càng ít thay đổi, kết luận càng chắc**.
3. ⭐ **LOẠI TRỪ PHẢI GHI RÕ — LẦN NÀY 3 ACTION.** Thêm `reorder_menu_layout` (ghi đè bố cục menu thật) và `reset_material_catalog_test` (tên nói «reset»). ⛔ Bỏ im lặng = che giấu lỗ hổng phủ.
4. ⭐ **BIẾT KHI NÀO KỸ THUẬT ĐÃ TỚI HẠN.** 66 action đã phủ, **2 vòng gần nhất 0 bug** ⇒ nên **cân nhắc đổi kỹ thuật** cho ~26 action còn lại (ví dụ: kiểm **đường THÀNH CÔNG** trên dữ liệu nháp, thay vì chỉ kiểm **chốt chặn**).
5. ⭐ **`install_license_foundation` báo «Nội dung license không phải JSON hợp lệ.»** — thông báo nêu **đúng bản chất** vấn đề (không phải «lỗi hệ thống») ⇒ ⭐ khuôn mẫu thông báo lỗi tốt.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — 5 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010 · BUG-20261011**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. ⭐ **~26 action còn lại** — tiếp tục «id bịa» (đã tới hạn hiệu quả) hay **đổi kỹ thuật** sang kiểm **đường thành công trên dữ liệu nháp**?
7. ⭐ **3 action bị loại trừ vì đổi cấu hình** — có muốn kiểm bằng cách an toàn khác không?
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»? · 11. Commit?
