# TASK-160 — GO-LIVE ĐỢT 15: BUG-20261010 (HIGH) — XOÁ QUYỀN PHÒNG BAN CHẠM 27 TÀI KHOẢN

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261010** (HIGH — liên quan **QUYỀN**, ảnh hưởng nhiều user) |
| **Trạng thái** | ✅ **FIXED · VERIFIED** (vệ mới 2 chiều + **đối chứng âm**) · ⛔ **CHƯA TRIỂN KHAI** |
| **Tệp sửa** | `UserManagementUseCase.java` (**1 tệp** — SMALL SAFE FIX §12) |
| **Tệp test mới** | `DepartmentPermissionDeleteGuardTest.java` (3 vệ) |
| **Tệp E2E mới** | `tools/e2e/go-live-kiem-an-toan-delete.mjs` |
| **Vân tay** | ⛔ Không đổi (`java-backend/` + `tools/` ngoài `ROOT_DIRS`) |

---

## ① CÁCH TÌM RA — KIỂM NHÓM `delete_*` **MỘT CÁCH AN TOÀN**

Trong **92 action UI gọi mà chưa hề được kiểm**, nhóm nguy hiểm nhất là **35 action `delete_*`**.

⛔ **VẤN ĐỀ ĐẶT RA**: gọi thử `delete_*` lên dữ liệu thật là **nguy hiểm** — nếu chốt chặn không tồn tại thì bài test **XOÁ DỮ LIỆU THẬT**.

⭐ **CÁCH LÀM AN TOÀN ĐÃ CHỌN** — chỉ 2 phép **không thể mất dữ liệu**:
1. gọi với **id KHÔNG TỒN TẠI** ⇒ chỉ kiểm **cách xử lý lỗi** (⛔ không 500, phải là 400 sạch);
2. gọi `delete_project` lên dự án **ĐANG HOẠT ĐỘNG** ⇒ bị **2 lớp chốt độc lập** giữ.

⛔ **TRƯỚC KHI CHẠY, TÔI ĐỌC MÃ ĐỂ CHẮC CHẮN AN TOÀN** — đọc `deleteProject` (`ProjectManagementUseCase:149-168`) thấy **4 lớp chốt**: quyền `admin` · trạng thái phải `closed/archived` · `confirmCode` phải khớp mã dự án · phải có gói **archive VERIFIED**. ⭐ Chính vì thấy đủ 4 lớp nên thí nghiệm này **an toàn** và tôi mới dám chạy.

### ⛔ TÔI ĐÃ RÚT LẠI MỘT KẾT LUẬN SAI CỦA CHÍNH MÌNH
Quét thô ban đầu cho thấy **24/35** `delete_*` "không thấy dấu hiệu chốt chặn" — tôi **suýt báo 24 lỗi**. Đọc kỹ `delete_project` thì thấy **4 lớp chốt** ⇒ **quét của tôi thô** (chỉ soi 1 tệp/action, bộ dấu hiệu hạn chế). ⛔ **Nếu đã báo thì đó là báo động giả thứ 8.**

---

## ② KẾT QUẢ ĐO — 8 ACTION `delete_*` VỚI ID BỊA

| Action | HTTP | Thông báo |
|---|---|---|
| `delete_project` | **400** | Không tìm thấy dự án. |
| `delete_user` | **400** | Không tìm thấy tài khoản. |
| `delete_supplier` | **400** | Không tìm thấy nhà cung cấp. |
| `delete_partner` | **400** | Không tìm thấy đối tác. |
| `delete_material_subcategory` | **400** | Không tìm thấy nhóm con. |
| **`delete_department_permission`** | ⛔ **200** | «Đã thu hồi quyền của phòng ban; **đồng bộ lại 27 tài khoản**…» |
| `delete_workflow` | **400** | Không tìm thấy quy trình. |
| `delete_notification_config` | **400** | Không tìm thấy cấu hình thông báo … |

⇒ **7/8 trả lỗi SẠCH** (⛔ không có 500 nào) · ⛔ **1 action báo THÀNH CÔNG cho việc không tồn tại**.

**Chốt chặn `delete_project`** (an toàn, đã kiểm): dự án `E2E-DA-01` (`status=active`) ⇒ **400** «Chỉ dự án đã Đóng/Lưu trữ mới được Xóa/Purge…» · **dự án vẫn CÒN NGUYÊN** ✔ · `confirmCode` sai cũng bị chặn ✔

---

## ③ ⭐ BỐI CẢNH CẤU TRÚC: **TOÀN BỘ SCHEMA KHÔNG CÓ KHOÁ NGOẠI**

```
SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA='vntech_erp' AND REFERENCED_TABLE_NAME IS NOT NULL   -->  0
SELECT COUNT(*) FROM information_schema.TABLES
 WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_TYPE='BASE TABLE'             -->  131
```

⇒ **131 bảng · 0 khoá ngoại.** ⛔ **Không có lưới an toàn ở tầng CSDL**: toàn bộ tính toàn vẹn tham chiếu phụ thuộc **duy nhất** vào chốt chặn ở tầng ứng dụng. Một chốt thiếu = **dữ liệu mồ côi im lặng**, ⛔ không có gì báo.
⭐ Đây là **đặc điểm kiến trúc cần biết** khi rà soát (⛔ không phải bug, nhưng làm mọi bug thiếu chốt trở nên nặng hơn).

---

## ④ BUG-20261010 — LỖI ĐƯỢC VÁ

| | |
|---|---|
| **MODULE** | Quản trị › Phân quyền phòng ban (`delete_department_permission`) |
| **SEVERITY** | **HIGH** — §4: «**quyền**» + «**nhiều user**» |
| **TRIỆU CHỨNG** | Gọi với `organizationUnitId` **bịa** ⇒ **HTTP 200** + «Đã thu hồi quyền của phòng ban; **đồng bộ lại 27 tài khoản** (ngoại lệ cá nhân giữ nguyên)» |
| **ROOT CAUSE** | `UserManagementUseCase.deleteDepartmentPermission` (dòng 573-582): ⛔ **không kiểm phòng ban có tồn tại** · ⛔ **không kiểm có dòng quyền nào bị xoá** · ⛔ **`syncDepartmentUsers(now)` chạy VÔ ĐIỀU KIỆN** — hàm đó duyệt **MỌI tài khoản đang hoạt động** (trừ admin; đo được **27**) và gọi `replaceDepartmentDefaults` cho **từng người** ⇒ **GHI ĐÈ quyền mặc định phòng ban của toàn bộ tài khoản**, rồi vẫn báo **THÀNH CÔNG** |
| **HỆ QUẢ** | ① Bấm nhầm / **bấm đúp** cũng kích hoạt **đồng bộ quyền TOÀN HỆ THỐNG**; ② người dùng **tưởng đã thu hồi quyền** trong khi ⛔ không có gì để thu hồi |
| **FIX (§12 — 1 TỆP)** | Dùng **port có sẵn** `store.findDepartmentPermission(...)`: nếu **rỗng** ⇒ **400** «Không tìm thấy quyền của phòng ban cho chức năng này.» (đúng khuôn **7** action kia) ⇒ ⛔ **KHÔNG** chạy đồng bộ gì |
| **VÌ SAO CHỌN CÁCH NÀY** | ⛔ không đổi chữ ký port, ⛔ không sửa adapter, ⛔ không thêm bảng/migration ⇒ **thay đổi nhỏ nhất giải quyết đúng nguyên nhân** |

### ⚠️ TÔI ĐÃ CHẠY THÍ NGHIỆM NÀY — ĐÃ KIỂM NGAY SAU ĐÓ
| Phép đo | Kết quả |
|---|---|
| `user_module_permissions` | **2198 dòng — KHÔNG ĐỔI** so với đo trước |
| Cờ quyền | `can_view=2198 · can_use=1989 · can_approve=291` |
| Phòng ban hoạt động | **11** |
| `e2e.khnv` | giữ nguyên `approvals` (1/1/1) · `inventory` · `purchasing` |

⇒ **chưa thấy hư hại**. ⚠️ **Nói thẳng giới hạn bằng chứng**: tôi **chưa chứng minh được KHÔNG dòng nào bị đổi** — chỉ chứng minh được **số dòng** và **cờ tổng** không đổi.

---

## ⑤ KIỂM CHỨNG — VỆ MỚI 2 CHIỀU + ĐỐI CHỨNG ÂM

`DepartmentPermissionDeleteGuardTest` (3 vệ) — ⛔ **cố ý kiểm CẢ HAI CHIỀU**, vì chỉ kiểm một chiều thì bản vá có thể **chặn nhầm**:

| Vệ | Kiểm |
|---|---|
| `khoaBiaaPhaiBiChan400_vaKhongDuocDungToiDuLieuThat` | ① khoá **BỊA** ⇒ **400** «Không tìm thấy quyền của phòng ban…» **VÀ** ② dòng quyền **THẬT** vẫn còn nguyên (⇒ phép gọi sai ⛔ không đụng gì) |
| `khoaThatVanXoaDuoc200_banVaKhongChanNham` | khoá **THẬT** ⇒ **200** và dòng quyền **bị xoá** (⇒ bản vá ⛔ không chặn nhầm) |
| `doiChungAm_thieuThamSoVanBiChan` | thiếu phòng ban vẫn bị chặn như trước |

### ĐỐI CHỨNG ÂM CHẠY THẬT
| Bước | Kết quả đo được |
|---|---|
| **Gỡ chốt chặn** (về mã cũ) | **ĐỎ** — `AssertionError: Response status expected:<400> but was:<200>` ⇒ ⭐ **thông báo lỗi CHÍNH LÀ lỗi tôi báo** |
| **Khôi phục bản vá** (tệp giống **100%**) | **XANH** — `Tests run: 3, Failures: 0` · BUILD SUCCESS |

### HỒI QUY TOÀN BỘ (§10)
`mvn -o test` ⇒ Domain **19** · Application **38** · Infrastructure **13** · Web **83** = **153 test · 0 failure · 0 error · BUILD SUCCESS · EXIT=0**

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `mvn -o test` | **153 test · 0 failure · 0 error · EXIT=0** |
| Đối chứng âm | **ĐỎ ↔ XANH đúng** |
| 8 action `delete_*` với id bịa | **7/8 trả 400 SẠCH** (⛔ không 500) · 1 đã vá |
| Khoá ngoại trong schema | ⭐ **0** trên **131 bảng** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ nay **4 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **KIỂM THỬ ĐƯỢC NHỮNG THỨ NGUY HIỂM — NẾU THIẾT KẾ ĐÚNG.** Gọi thử `delete_*` là nguy hiểm, nhưng **id bịa** + **đọc mã để chắc có chốt** biến nó thành phép thử **không thể mất dữ liệu** — mà vẫn **lộ ra lỗi thật**. ⛔ Không cần chọn giữa «an toàn» và «kiểm được».
2. ⛔⛔ **QUÉT THÔ SUÝT LÀM TÔI BÁO SAI 24 LỖI.** «Không thấy dấu hiệu chốt chặn» ≠ «không có chốt chặn» — `delete_project` có **4 lớp**. ⇒ **Đọc mã một trường hợp trước khi tin vào thống kê** (lần thứ **8** suýt báo động giả).
3. ⭐ **BẤT ĐỐI XỨNG GIỮA CÁC ACTION CÙNG HỌ LÀ DẤU HIỆU MẠNH.** 7/8 `delete_*` trả «Không tìm thấy …», **1** trả 200 ⇒ chính sự lệch đó chỉ ra chỗ hỏng. (Cùng nguyên lý đã dùng ở TASK-152: so hai đường cùng loại.)
4. ⭐⭐ **THAO TÁC QUYỀN LỰC PHẢI KIỂM KẾT QUẢ, KHÔNG CHỈ KIỂM ĐẦU VÀO.** Lỗi thật không phải «thiếu validate» mà là **tác dụng phụ toàn hệ thống** (`synced` 27 tài khoản) **chạy vô điều kiện**.
5. ⛔ **NÓI THẲNG GIỚI HẠN BẰNG CHỨNG.** Tôi chứng minh được **số dòng** và **cờ tổng** không đổi, ⛔ **không** chứng minh được «không dòng nào bị đổi». ⛔ Đừng biến «chưa thấy hư hại» thành «không có hư hại».

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — nay 4 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010** đều chưa tới tay người dùng; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. **90 action UI gọi còn lại chưa được kiểm** (`update_*` 5 · `bulk_*` 4 · `set_*_status` 22 · `save_*` 12 …) — lấp tiếp?
7. ⭐ **Có nên bổ sung KHOÁ NGOẠI cho schema?** (131 bảng hiện **0 FK**) — ⛔ đây là việc lớn, cần quyết riêng.
8. Xoá đăng ký thừa `manage_contract_review`? · 9. Mở task «thêm thành viên tổ đội»? · 10. Commit?
