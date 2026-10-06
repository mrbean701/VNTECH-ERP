# TASK-163 — GO-LIVE ĐỢT 18: PHỦ **TOÀN BỘ** `delete_*` + BUG-20261011 (LOW)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **32/34 chốt chặn vững** · ⛔ 0 × 500 · 🐞 **BUG-20261011 (LOW) FIXED · VERIFIED** |
| **Tệp sửa** | `UserAdminStore.java` (port) · `UserAdminStoreAdapter.java` · `UserManagementUseCase.java` |
| **Tệp test mới** | `UserModuleOverrideDeleteGuardTest.java` (3 vệ) + `tools/e2e/go-live-phu-toan-bo-delete.mjs` |
| **Vân tay** | ⛔ Không đổi (`java-backend/` + `tools/` ngoài `ROOT_DIRS`) |

---

## ① VÌ SAO PHỦ TOÀN BỘ

Vòng 14 tôi mới lấy **mẫu 8/35** action `delete_*` — **và mẫu đó đã ra 1 lỗi HIGH (BUG-20261010)**. Tỉ lệ đó buộc phải phủ nốt **27 action còn lại** bằng cùng kỹ thuật an toàn (id bịa).

⛔ **KHOÁ PAYLOAD: đọc từ chính mã UI cho CẢ 35 action** (⛔ không đoán) — bài học từ chính vòng 14 (`delete_department_permission` dùng `organizationUnitId`+`moduleKey`).

⛔⛔ **MỘT ACTION BỊ LOẠI TRỪ VÌ NGUY HIỂM THẬT** (⛔ không phải bỏ sót):
**`delete_unused_materials`** — UI gọi với `{confirmText}` ⛔ **KHÔNG có id** ⇒ nó xoá **MỌI vật tư không dùng trên TOÀN HỆ THỐNG**. Gọi thử = **XOÁ DỮ LIỆU THẬT** ⇒ ⛔ **KHÔNG CHẠY** (§12). **Đã ghi nhận là LỖ HỔNG PHỦ** trong chính mã bài test.

---

## ② KẾT QUẢ — 32/34 ĐẠT, ⛔ 0 × 500

**31 action trả 400 SẠCH** với thông báo đọc được: «Không tìm thấy chứng từ / phiếu tạm ứng / bước phê duyệt / bản ghi / dòng BOQ / nhóm nghiệp vụ / phạm vi nghiệp vụ / hồ sơ thu hồi vốn / bút toán / nhật ký thi công / dòng thanh toán / công văn / trường cấu hình / hợp đồng / văn bản / vật tư / định mức / nhóm con / nhóm menu / cấu hình thông báo / đối tác / kế hoạch thanh toán / dự án / phiếu đề nghị / con dấu / chi phí / nhà cung cấp / cấp bậc / tài khoản / quy trình.»

**1 no-op trung thực**: `delete_selected_materials` ⇒ 200 «Đã ẩn **0** vật tư chưa phát sinh nghiệp vụ…» ⇒ **nói rõ 0** ⇒ **CHẤP NHẬN** (⭐ hành vi tốt).

**2 action trả 200 mà ⛔ KHÔNG nói rõ đã làm gì:**
| Action | Thông báo | Trạng thái |
|---|---|---|
| `delete_department_permission` | «Đã thu hồi quyền của phòng ban; đồng bộ lại 27 tài khoản…» | ✅ **đã vá ở TASK-160** (BUG-20261010) — ⛔ **chưa triển khai** nên bản đang chạy vẫn sai ⇒ **đúng như dự kiến** |
| **`delete_user_module_override`** | «Đã xóa ngoại lệ cá nhân; quyền hiệu lực quay về mặc định…» | 🐞 **PHÁT HIỆN MỚI** ⇒ BUG-20261011 |

---

## ③ ⭐ KIỂM HẬU QUẢ (dùng công cụ mới `chup-so-dong.mjs`)

| | |
|---|---|
| **TRƯỚC** | 131 bảng · **12404** dòng |
| **SAU** | 131 bảng · **12408** dòng |
| **Bảng đổi** | `audit_logs` 3525 → **3528** (+3) · `sessions` 3153 → **3154** (+1) |

⭐ **Giải thích được cả hai**: `sessions` +1 là **phiên đăng nhập của tôi**; `audit_logs` +3 là **nhật ký của chính 3 lệnh gọi API** trong bài test. ⛔ **KHÔNG bảng NGHIỆP VỤ nào đổi** ⇒ bài test ⛔ **không xoá/sửa dữ liệu thật** ✔
⭐ **Công cụ `chup-so-dong.mjs` hoạt động đúng ngay lần dùng thật đầu tiên.**

---

## ④ 🐞 BUG-20261011 (LOW) — `delete_user_module_override` BÁO THÀNH CÔNG SAI

| | |
|---|---|
| **MODULE** | Quản trị › Phân quyền › «Xóa ngoại lệ cá nhân» |
| **SEVERITY** | **LOW** — xem ⑤ vì sao ⛔ **KHÔNG** phải HIGH |
| **TRIỆU CHỨNG** | Gọi với `userId`+`moduleKey` **bịa** ⇒ **HTTP 200** «Đã xóa ngoại lệ cá nhân; quyền hiệu lực quay về mặc định của phòng/bộ phận.» |
| **ROOT CAUSE** | `UserManagementUseCase.deleteUserModuleOverride` (dòng 335) gọi thẳng `store.deleteModuleOverride(...)` rồi **trả về thông báo thành công** — ⛔ không kiểm có dòng nào bị xoá |
| **FIX (§12 — 3 tệp, 1 nơi gọi)** | Port + adapter: `void deleteModuleOverride(...)` → **`int`** (trả **số dòng đã xoá**); use-case: **`== 0` ⇒ 400** «Không tìm thấy ngoại lệ cá nhân cho chức năng này.» ⇒ nay **đúng khuôn 31 action kia** |
| **STATUS** | ✅ **FIXED · VERIFIED** · ⛔ chưa triển khai |

### ⭐ ⑤ VÌ SAO CHỈ **LOW** — CÙNG TRIỆU CHỨNG NHƯNG KHÁC TÁC ĐỘNG
Đọc mã cho thấy **khác biệt quyết định** so với BUG-20261010:
| | `delete_department_permission` (BUG-20261010) | `delete_user_module_override` (BUG-20261011) |
|---|---|---|
| Tác dụng phụ | ⛔ **`syncDepartmentUsers` chạy VÔ ĐIỀU KIỆN** ⇒ **ghi đè quyền của 27 tài khoản** | ✅ **KHÔNG có** — chỉ xoá 0 dòng |
| Mức | **HIGH** | **LOW** |
⭐ **Bài học: đánh giá theo TÁC ĐỘNG, ⛔ không theo triệu chứng.** Cùng «200 cho khoá bịa» mà mức lệch **hai bậc**.

### ⭐ NGỮ CẢNH HẠ NGUỒN ĐÁNG CHÚ Ý
Đo được: `user_module_permissions` = **100% `department_default` (2198 dòng) · 0 dòng `manual_override`** ⇒ truy vấn `DELETE … AND permission_source='manual_override'` **⛔ không bao giờ khớp**. Đây là **hệ quả hạ nguồn của BUG-20261005-003** (nút «Xóa ngoại lệ cá nhân» từng là **nút chết** — **đã vá nhưng chưa triển khai**) ⇒ sau khi triển khai, ngoại lệ **sẽ** được tạo và action này **sẽ** có việc để làm.

---

## ⑥ KIỂM CHỨNG — VỆ MỚI 2 CHIỀU + ĐỐI CHỨNG ÂM

`UserModuleOverrideDeleteGuardTest` (3 vệ):
| Vệ | Kiểm |
|---|---|
| `khoaBiaaPhaiBiChan400_vaKhongDuocDungToiNgoaiLeThat` | ① khoá **BỊA** ⇒ **400** · ② ngoại lệ **THẬT** vẫn còn nguyên |
| `khoaThatVanXoaDuoc200_banVaKhongChanNham` | khoá **THẬT** ⇒ **200** + dòng bị xoá |
| `doiChungAm_thieuThamSoVanBiChan` | thiếu `userId` ⇒ chặn như trước |

**ĐỐI CHỨNG ÂM CHẠY THẬT:** gỡ chốt ⇒ **ĐỎ** `AssertionError: Response status expected:<400> but was:<200>` · khôi phục (giống **100%**) ⇒ **XANH**

**HỒI QUY TOÀN BỘ (§10):** `mvn -o test` ⇒ Domain **19** · Application **38** · Infrastructure **13** · Web **86** = **156 test · 0 failure · 0 error · BUILD SUCCESS · EXIT=0**
⭐ Test cũ `UserOverrideSourceIntegrationTest` (dùng **id THẬT**) vẫn **3/3 XANH** ⇒ bản vá ⛔ **không chặn nhầm** đường thật.

---

## ⑦ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Phủ `delete_*` | **34/34 chạy được** (1 loại trừ có lý do) · **32 ĐẠT** · ⛔ 0 × 500 |
| `mvn -o test` | **156 test · 0 failure · 0 error · EXIT=0** |
| Đối chứng âm | **ĐỎ ↔ XANH đúng** (cả BUG-20261010 và BUG-20261011) |
| Kiểm hậu quả | Chỉ `audit_logs` +3 (lệnh của tôi) + `sessions` +1 (phiên của tôi) ⇒ ⛔ **0 bảng nghiệp vụ đổi** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ nay **5 bản vá chưa lên sóng** |

---

## ⑧ BÀI HỌC

1. ⭐⭐ **MẪU NHỎ CÓ THỂ BỎ SÓT — PHẢI PHỦ HẾT.** Vòng 14 lấy **8/35** và ra 1 lỗi HIGH; vòng này phủ nốt **27** và ra thêm 1 lỗi ⇒ ⛔ **dừng ở mẫu là bỏ sót thật**.
2. ⭐⭐ **ĐÁNH GIÁ THEO TÁC ĐỘNG, ⛔ KHÔNG THEO TRIỆU CHỨNG.** Cùng «200 cho khoá bịa»: `delete_department_permission` = **HIGH** (ghi đè quyền **27 tài khoản**) · `delete_user_module_override` = **LOW** (chỉ xoá 0 dòng). ⛔ Gộp chung là **đánh giá sai hai bậc**.
3. ⭐⭐ **LOẠI TRỪ VÌ NGUY HIỂM LÀ QUYẾT ĐỊNH ĐÚNG, ⛔ KHÔNG PHẢI BỎ SÓT.** `delete_unused_materials` ⛔ **không có id** ⇒ gọi thử là **xoá vật tư thật toàn hệ thống**. Đã **ghi rõ trong mã** thành **lỗ hổng phủ** — ⛔ bỏ im lặng mới là che giấu.
4. ⭐ **CÔNG CỤ «KIỂM HẬU QUẢ» ĐÃ CHỨNG MINH GIÁ TRỊ NGAY LẦN DÙNG THẬT ĐẦU.** Nó chỉ ra **đúng 2 bảng đổi** và cả hai đều **giải thích được** (`audit_logs` = lệnh của tôi · `sessions` = phiên của tôi) ⇒ kết luận «⛔ không mất dữ liệu» có **bằng chứng**, ⛔ không phải lời hứa.
5. ⭐ **TEST CŨ DÙNG ID THẬT LÀ LƯỚI AN TOÀN MIỄN PHÍ.** `UserOverrideSourceIntegrationTest` chạy với `staffId` **THẬT** ⇒ chứng minh bản vá ⛔ **không chặn nhầm** — ⛔ không cần tự nghĩ thêm ca.

---

## ⑨ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — nay 5 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010 · BUG-20261011**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. ⭐ **`delete_unused_materials`** — có muốn tôi kiểm bằng cách nào an toàn không (vd trên dữ liệu nháp)?
7. **~58 action UI gọi còn lại chưa được kiểm** (đã lấp **34**) — lấp tiếp?
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»? · 11. Commit?
