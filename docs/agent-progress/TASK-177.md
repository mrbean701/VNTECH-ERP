# TASK-177 — GO-LIVE ĐỢT 32: ⛔ «BẢN VÁ» CỦA TÔI **VÔ HIỆU** — MÃ NGUỒN CHỨNG MINH, ĐÃ **HOÀN TÁC**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Tiếp nối** | **TASK-176** (tôi «vá» 1 dòng trong công cụ cài đặt E2E) |
| **Kết quả** | ⛔ **Giả thuyết SAI** ⇒ **đã HOÀN TÁC** · ✅ **tìm ra 1 sự thật chắc chắn MỚI** về backend |
| **Tệp sửa** | `tools/e2e/cap-quyen-chuc-nang.mjs` — **hoàn tác** về giá trị gốc + chú thích giải thích |
| **Vân tay** | ⛔ **không đổi** (`tools/` ngoài `ROOT_DIRS`) |

---

## ① ⛔ GIẢ THUYẾT CỦA TÔI **SAI** — VÀ **MÃ NGUỒN** CHỨNG MINH ĐIỀU ĐÓ

TASK-176 tôi kết luận: bước 8.2 khai `permissionSource: "department_default"` ⇒ hệ thống hiểu là «hưởng theo phòng ban» ⇒ **cờ cấp riêng bị bỏ** ⇒ tôi đổi thành `"manual_override"`.

⛔ **ĐỌC `UserManagementUseCase.saveUserAccess` THÌ THẤY GIẢ THUYẾT SAI:**
```java
// dòng ~318-325
Caps defaultCaps = effectiveDepartmentDefault(target, moduleKey);
boolean differsFromDefault = submittedCaps.canView != defaultCaps.canView
        || submittedCaps.canUse != defaultCaps.canUse
        || … ;
String source = differsFromDefault ? "manual_override" : "department_default";   // ⇐ TỰ TÍNH
store.insertDepartmentDefaultPermission(idModifier, targetUserId, moduleKey, …, source, …);
```
⇒ ⭐⭐ **Backend TỰ TÍNH `permissionSource` bằng cách SO với mặc định phòng ban** ⇒ **giá trị trong payload ⛔ BỊ BỎ QUA HOÀN TOÀN** ⇒ ⛔ **đổi trong công cụ KHÔNG CÓ TÁC DỤNG GÌ** ✓

⭐ **ĐÃ HOÀN TÁC** (giữ lại chú thích dài giải thích vì sao — ⭐ để người đọc sau ⛔ không lặp lại sai lầm này).

---

## ② ✅ SỰ THẬT CHẮC CHẮN **MỚI** TÌM ĐƯỢC

### ⭐ `manual_override = 0` là **HỆ QUẢ CỦA `BUG-20261005-003`** — bug tôi đã tìm ra trong phiên này
```java
// ⛔⛔ VÁ 05/10/2026 (GO-LIVE) — `row.get("isOverride")` là trường mà UI **KHÔNG BAO GIỜ gửi**
//    (`Boolean.TRUE.equals(null)` luôn `false`) ⇒ **100% dòng thành `department_default`**.
//    Đo trên MySQL thật: `user_module_permissions` = **2198 dòng, 2198 `department_default`,
//    0 `manual_override`**, và `permission_expires_at` NULL toàn bộ ⇒ nút «Xóa ngoại lệ cá nhân»
//    VẪN là nút chết.
```
⭐ **Mã nguồn đã ghi ĐÚNG con số tôi đo được** ⇒ ⭐ **`0 manual_override` ⛔ KHÔNG phải hậu quả của 23+9 lệnh lúc 00:56** — nó là **trạng thái nền đã có từ trước**, do bug này ✓
⭐ **Và bản vá cho bug đó ĐÃ VIẾT** (dòng 315-325 — khôi phục phép SO như bản JS cũ `scripts/system-route.mjs:3084`) nhưng ⛔ **CHƯA TRIỂN KHAI** (`:18081` vẫn JAR 01/10).

### ⛔ Hàm kiểm ràng buộc **⛔ KHÔNG kẹp cờ**
```java
// assertDepartmentAllowsPermissions, dòng 543-556
int want = canView + canUse + canCreate + canEdit + canApprove + canExport;
if (want == 0) continue;                                   // dòng toàn 0 thì BỎ QUA
boolean allowed = dep.active == 1 && dep.can_view == 1;    // ⇐ CHỈ đọc can_view
if (!allowed) throw new AuthUseCase.ApiError("Phòng ban … chưa được cấp quyền cho chức năng …", 400);
```
⇒ ⭐ Nó **CHẶN (throw 400)** chứ ⛔ **không kẹp** `can_use` ⇒ ⛔ **cũng ⛔ không giải thích được `can_use = 0`** ✓

---

## ③ ⛔ ĐIỀU **VẪN CHƯA** CHỨNG MINH ĐƯỢC — NÓI THẲNG

⛔ **Nguyên nhân `e2e.to` / `e2e.tk` có `can_use = 0` trên mọi module kho vẫn ⛔ CHƯA RÕ.**

**Đã LOẠI TRỪ được (có bằng chứng):**
| Giả thuyết | Phép đo bác bỏ |
|---|---|
| Backend ⛔ không lưu cờ | ⛔ **SAI** — **1989/2198 dòng `can_use=1`**, **1866 dòng `can_create=1`** |
| `assertDepartmentAllowsPermissions` kẹp cờ | ⛔ **SAI** — nó **chỉ đọc `can_view`** và **throw 400**, không kẹp |
| Payload khai `department_default` nên cờ bị bỏ | ⛔ **SAI** — backend **tự tính**, ⛔ bỏ qua giá trị payload |
| Quyền bị «xoá trắng» toàn hệ thống | ⛔ **SAI** — E2E có **726 dòng `can_use=1`**, ngang tài khoản thật (**725**) |

⭐ **Muốn biết chắc PHẢI CHẠY THỬ THẬT**: cấp **1 module cho 1 tài khoản** rồi **đọc lại dòng DB**.
⛔ **Tôi ⛔ KHÔNG tự chạy** — vì đó là `save_user_access` (**replace-all**), mà tôi **đã cam kết ⛔ không chạy khi chưa có mắt người** ✓

---

## ④ ⛔ BỐN LẦN TÔI SAI TRONG CHUỖI ĐIỀU TRA NÀY

| # | Kết luận của tôi | Sự thật | Bị bác bỏ bởi |
|---|---|---|---|
| 1 | «BUG-20261010 do `delete_department_permission`» ⇒ **gửi cảnh báo khẩn** | ⛔ không có bản ghi nào | `audit_logs` |
| 2 | «Bị gán mẫu của mọi phòng ban ⇒ hỏng» | mẫu **dùng chung 8×60** | Đo `department_module_permissions` |
| 3 | «Tài khoản bị xoá trắng quyền» | **726 dòng `can_use=1`** | Đo **toàn nhóm** |
| **4** | «Khai `department_default` ⇒ cờ bị bỏ» ⇒ **đã sửa công cụ** | backend **tự tính**, ⛔ bỏ qua payload | **Đọc mã nguồn** |

⭐⭐ **CẢ BỐN LẦN ĐỀU CÙNG MỘT THÓI: KẾT LUẬN TRƯỚC, KIỂM SAU.** ⭐ Lần 4 chỉ được phát hiện nhờ **ĐỌC MÃ NGUỒN** — thứ **rẻ nhất** trong bốn cách (nhật ký, đo toàn nhóm, đo mẫu, đọc mã) mà tôi lại làm **sau cùng**.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| «Bản vá» của tôi ở TASK-176 | ⛔ **VÔ HIỆU** ⇒ **đã HOÀN TÁC** |
| Sự thật mới | ✅ `manual_override = 0` là hệ quả **`BUG-20261005-003`** (bản vá **đã viết, ⛔ chưa triển khai**) |
| Sự thật mới | ✅ `assertDepartmentAllowsPermissions` **chỉ đọc `can_view`** và **throw 400**, ⛔ **không kẹp cờ** |
| Nguyên nhân `can_use=0` | ⛔ **CHƯA RÕ** — đã loại trừ **4** giả thuyết |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **ĐỌC MÃ NGUỒN LÀ CÁCH KIỂM RẺ NHẤT — MÀ TÔI LẠI LÀM SAU CÙNG.** Bốn cách kiểm: **đọc mã** < **đo toàn nhóm** < **đọc nhật ký** < **đo mẫu nhỏ**. ⭐ Tôi đã đi **ngược** thứ tự: đo mẫu nhỏ → đọc nhật ký → đo toàn nhóm → **cuối cùng mới đọc mã** — và **chính đọc mã** mới bác bỏ được giả thuyết cuối.
2. ⛔⛔ **MỘT «BẢN VÁ» DỰA TRÊN GIẢ THUYẾT CHƯA KIỂM LÀ NỢ KỸ THUẬT.** Tôi đã sửa 1 dòng trong công cụ và **báo cáo là «đã vá»** — ⛔ **sai**. ⭐ **Nếu không tự đọc mã để kiểm, «bản vá» đó sẽ nằm lại trong mã nguồn và gây hiểu nhầm cho người sau.**
3. ⭐ **HOÀN TÁC LÀ HÀNH ĐỘNG ĐÚNG KHI GIẢ THUYẾT SAI** — ⛔ không giữ lại thay đổi vô hiệu chỉ vì «đã viết rồi».
4. ⭐ **NHƯNG GIỮ LẠI CHÚ THÍCH GIẢI THÍCH.** Tôi hoàn tác **giá trị**, nhưng **giữ chú thích** nói rõ vì sao đổi rồi hoàn tác + **4 giả thuyết đã bị loại trừ** ⇒ ⭐ người sau ⛔ **không lặp lại**.
5. ⭐ **LOẠI TRỪ CŨNG LÀ TIẾN BỘ.** Sau 4 lần sai, tôi ⛔ chưa biết **nguyên nhân**, nhưng **đã loại trừ được 4 khả năng bằng bằng chứng** ⇒ ⭐ **phạm vi tìm kiếm hẹp hơn nhiều** so với đầu chuỗi.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **124 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép CHẠY THỬ 1 LẦN** để tìm nguyên nhân `can_use=0`: cấp **1 module cho 1 tài khoản `e2e.*`** rồi **đọc lại dòng DB** — ⭐ đây là cách **duy nhất** còn lại để biết chắc.
2. ⭐⭐ **Cho chạy lại `tools/e2e/cap-quyen-chuc-nang.mjs`** để khôi phục quyền 14 tài khoản `e2e.*`?
3. ⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
4. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
5. `stack-form` · **commit theo nhóm** · BUG-20261009 · «ai nhận hàng ở kho đích» · dọn Transit · CRUD 6 thực thể · khoá ngoại.
