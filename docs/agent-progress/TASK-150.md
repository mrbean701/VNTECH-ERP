# TASK-150 — GO-LIVE ĐỢT 5: VÁ «NGOẠI LỆ CÁ NHÂN» + PHÁT HIỆN D-044 SAI

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Trạng thái** | ✅ **FIXED · VERIFIED** (biên dịch + test tích hợp + đối chứng âm) · ⛔ **CHƯA TRIỂN KHAI** |
| **BUG** | **BUG-20261005-003** (HIGH — quyền) |
| **Tệp sửa** | `java-backend/application/…/service/UserManagementUseCase.java` |
| **Tệp test mới** | `java-backend/web/src/test/java/…/controller/UserOverrideSourceIntegrationTest.java` |
| **Vân tay** | Không đổi — `java-backend/` **ngoài** `ROOT_DIRS` |

---

## ① ⭐⭐ PHÁT HIỆN LỚN: **D-044 «KHÔNG CÓ MAVEN» LÀ SAI — BACKEND BUILD ĐƯỢC TRÊN MÁY NÀY**

Từ trước tới nay mọi tài liệu đều ghi «máy này **không có Maven** ⇒ Java không bao giờ biên dịch được».
**Đo lại ngày 05/10/2026 — SAI.** Sự thật:

| Thứ | Trạng thái đo được |
|---|---|
| JDK | **`javac 21.0.12.1`** (Eclipse Adoptium JDK 21) |
| Maven | **3.9.16** tại `C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\…\bin\mvn.cmd` |
| Repo Maven của dự án | `_m2-repo` (**807 jar**) — khai trong `java-backend/.mvn/maven.config` |
| `mvnw.cmd` trong `java-backend` | ⛔ **KHÔNG có** (nên `Get-Command mvnw` báo không thấy ⇒ tưởng là không có Maven) |
| Build thử | **`mvn -o -DskipTests compile` ⇒ BUILD SUCCESS**, cả 5 module, ~35 giây |
| Test thử | **`mvn -o -am -pl web -Dtest=… test` ⇒ BUILD SUCCESS**, harness H2 chạy tốt |

⭐ **Vì sao phát hiện được:** tôi đi tìm classpath để kiểm chứng bản vá Java, thì thấy tiến trình
`java … plexus-classworlds … apache-maven-3.9.16` đang chạy ⇒ truy ra Maven nằm trong `.m2\wrapper\dists`.
⛔ `Get-Command mvnw` **không** tìm thấy vì thiếu script wrapper — **kết luận cũ dựa trên một phép đo hụt**.

**Hệ quả:** các việc từng bị coi là «bất khả thi» (build JAR, chạy test Java, ghi `flyway_schema_history`)
**đều làm được**. Các quyết định đang chờ user nên được xem lại theo sự thật này.

---

## ② BUG-20261005-003 (HIGH) — NÚT «XÓA NGOẠI LỆ CÁ NHÂN» LÀ NÚT CHẾT

| | |
|---|---|
| **MODULE** | Quản trị hệ thống › Tab 06 «Phân quyền người dùng» |
| **DESCRIPTION** | Không thể tạo **ngoại lệ cá nhân** nào; `permission_expires_at` luôn trống; nút «Xóa ngoại lệ cá nhân» bấm không có tác dụng |
| **SEVERITY** | **HIGH** (quyền — tính năng phân quyền không hoạt động đúng) |
| **ROOT CAUSE** | `UserManagementUseCase.java:305` tính `source = Boolean.TRUE.equals(row.get("isOverride")) ? "manual_override" : "department_default"` — nhưng **UI KHÔNG BAO GIỜ gửi `isOverride`** ⇒ `Boolean.TRUE.equals(null)` luôn `false` ⇒ **100% dòng thành `department_default`**. `deleteModuleOverride` lọc `permission_source='manual_override'` (`UserAdminStoreAdapter.java:181`) ⇒ **không bao giờ khớp** ⇒ nút chết. |
| **ĐO ĐƯỢC (MySQL thật)** | `user_module_permissions` = **2198 dòng · 2198 `department_default` · 0 `manual_override`** · `permission_expires_at` **NULL toàn bộ** |
| **GHI CHÚ QUAN TRỌNG** | Lỗi này **đã được ghi trong chính mã** (MỐC 112, `UserManagementUseCase.java:301-304` và `UserAdminStore.java:56-59`) — nhưng MỐC 112 mới **NỐI tham số** xuống adapter, **GIÁ TRỊ vẫn sai**. |
| **FIX** | Khôi phục đúng ngữ nghĩa bản JS cũ (`scripts/system-route.mjs:3084`): **SO** các cờ người dùng gửi với **mặc định hiệu lực của phòng** — khác ⇒ `manual_override`, bằng ⇒ `department_default`. Thêm helper `effectiveDepartmentDefault(target, moduleKey)` dùng **cùng quy tắc** với `replaceDepartmentDefaults`. |
| **FILES CHANGED** | `UserManagementUseCase.java` (thêm 2 khối, ~30 dòng) · **mới** `UserOverrideSourceIntegrationTest.java` |
| **TEST** | Xem ③ |
| **STATUS** | **FIXED · VERIFIED** · ⛔ **CHƯA TRIỂN KHAI** |
| **NEXT ACTION** | Build lại JAR + khởi động lại Java `:18081` — **cần user đồng ý** (đang phục vụ test) |

⛔ Tôi **không** dùng workaround frontend (thêm `isOverride` vào payload UI) để che lỗi backend — GOAL §3.

---

## ③ KIỂM CHỨNG THẬT — 3 TẦNG, CÓ ĐỐI CHỨNG ÂM

### Tầng 1 — BIÊN DỊCH
`mvn -o -DskipTests compile` ⇒ **BUILD SUCCESS**, cả 5 module (Domain · Application · Infrastructure · Web).

### Tầng 2 — TEST TÍCH HỢP (H2, đường API thật `/api/system`)
`mvn -o -am -pl web -Dtest=UserOverrideSourceIntegrationTest test` ⇒ **`Tests run: 3, Failures: 0, Errors: 0`** · BUILD SUCCESS

| Vệ | Kiểm điều gì |
|---|---|
| `coCheCH_KHAC_macDinhPhong_thiPhaiLa_manualOverride` | cờ **KHÁC** mặc định phòng ⇒ `permission_source` **PHẢI** là `manual_override` |
| `coCheBANG_macDinhPhong_thiPhaiLa_departmentDefault` | cờ **BẰNG** mặc định phòng ⇒ **PHẢI** là `department_default` (**chiều còn lại — chống vá quá tay**) |
| `ngoaiLeLuuDuocHanDung_vaNutXoaNgoaiLeKhongConChet` | lưu được **hạn dùng** + nút **«Xóa ngoại lệ» xoá được thật** |

### Tầng 3 — ĐỐI CHỨNG ÂM (bắt buộc, nếu không test chỉ là «xanh vô nghĩa»)
| Bước | Kết quả đo được |
|---|---|
| **Cài lại LỖI GỐC** (`Boolean.TRUE.equals(row.get("isOverride"))`) | **ĐỎ**: `Tests run: 3, Failures: 2` · `AssertionFailedError: … expected: <manual_override> but was: <department_default>` |
| **Khôi phục bản vá** (tệp giống bản gốc **100%**) | **XANH**: `Tests run: 3, Failures: 0` · BUILD SUCCESS |

⭐ **Chi tiết đáng nhớ:** khi cài lại lỗi gốc, vệ **#2 vẫn XANH** (vì mã lỗi luôn trả `department_default`).
Nếu tôi chỉ viết MỘT chiều như vệ #2 thì test sẽ **xanh cả khi sản phẩm sai** — viết **cả hai chiều** mới phát hiện được.
⇒ Đây là lý do phải test **cả chiều khác và chiều bằng**, không chỉ chiều "tạo được ngoại lệ".

---

## ④ VÌ SAO CHƯA TRIỂN KHAI — VÀ ĐIỀU KIỆN ĐỂ TRIỂN KHAI

`:18081` (**PID 3784**, khởi động **10/02 08:14**) đang chạy `web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar`
**build 01/10 10:24** ⇒ **mã cũ**, chưa có bản vá.

Triển khai cần: `mvn -o -DskipTests package` (ghi đè JAR đang bị tiến trình giữ) → **khởi động lại Java**.
⛔ Khởi động lại `:18081` **nằm trong danh sách CẤM** của phiên ⇒ **phải hỏi user**.
⭐ Tin tốt: **việc build đã chứng minh là làm được** (mục ①), nên chỉ còn chờ user cho phép restart.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `mvn -o -DskipTests compile` | **BUILD SUCCESS** (5/5 module) |
| `UserOverrideSourceIntegrationTest` | **3/3 XANH** |
| Đối chứng âm | **ĐỎ khi có lỗi · XANH khi có bản vá** ⇒ test thật |
| Vân tay | **không đổi** (`VNTECH-FP-614484381419C595`) — `java-backend/` ngoài `ROOT_DIRS` |
| Tệp tạm | **0** |
| `:18081` | vẫn chạy **JAR cũ** (chưa triển khai) |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **MỘT PHÉP ĐO HỤT KHÔNG PHẢI LÀ SỰ THẬT.** Suốt nhiều phiên, «không có Maven» được lặp lại như định đề
   chỉ vì `Get-Command mvnw` không thấy — trong khi Maven **vẫn ở đó**, chỉ thiếu script wrapper.
   Tôi tìm ra khi **đi tìm classpath cho một việc khác** và thấy tiến trình Maven đang chạy.
2. ⭐ **Đọc chú thích MỐC cũ rất có giá trị** — lỗi này đã được ghi từ MỐC 112; việc của tôi là **vá nốt phần còn thiếu**
   (MỐC 112 nối tham số nhưng chưa sửa nguồn giá trị), không phải phân tích lại từ đầu.
3. ⛔ **Test một chiều có thể xanh cả khi sản phẩm sai.** Vệ «cờ BẰNG ⇒ department_default» xanh trong khi lỗi
   vẫn còn — chỉ có **đối chứng âm** mới lộ ra.
4. ⭐ **Có năng lực biên dịch thì phải dùng để TỰ KIỂM** — trước đây tôi chỉ dám «verify tĩnh» cho Java; nay
   biên dịch + chạy test tích hợp + đối chứng âm đều làm được, nên tiêu chuẩn nghiệm thu cho Java **phải nâng lên**.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE`).
⛔ **Cần user quyết 4 việc:**
1. **Triển khai bản vá này**: cho phép build lại JAR + khởi động lại Java `:18081`?
2. **Ghi `flyway_schema_history`**: V35 + V37 đã áp tay ⇒ cho Flyway tự ghi khi khởi động lại app?
   (Nếu đồng ý restart Java ở mục 1 thì **giải quyết luôn cả mục này**.)
3. **D-044 đã sai** — có muốn tôi cập nhật `DECISIONS.md` + `AGENTS.md` để các phiên sau không lặp lại định đề sai?
4. Lỗ hổng «không thêm được thành viên tổ đội» (TASK-149) — có mở task xây tính năng không?
