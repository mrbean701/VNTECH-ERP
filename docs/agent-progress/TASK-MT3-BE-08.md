# TASK-MT3-BE-08 — Buộc BACKEND cưỡng chế quyền CRUD Thi công + phạm vi kho/dự án

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-08 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | ✅ **HOÀN TẤT** — backend đã cưỡng chế sẵn **VÀ đã CHỨNG MINH bằng test** · `mvn test` **66/66 ĐẠT** |
| **Requirement** | Backend phải **thực sự từ chối** thao tác Thi công khi thiếu quyền (kiểm bằng **tài khoản thường ⇒ 403**) + tôn trọng **phạm vi dự án/kho** |

## ✅ BẰNG CHỨNG: backend ĐÃ cưỡng chế (⛔ không phải việc cần viết mới)

### 1) TẤT CẢ action Thi công ĐÃ được đăng ký RBAC (`ActionRbacRegistry`)
| Action | Module | Quyền | Vị trí |
|---|---|---|---|
| `save_construction_daily_log` | `construction` | `canCreate` | `:189` · `:439` |
| `delete_construction_daily_log` | `construction` | `canEdit` | `:107` · `:360` |
| `approve_construction_daily_log` | `construction` | `canApprove` | `:18` · `:296` |
| `save_production_report` | `production` | `canCreate` | `:210` · `:460` |
| `approve_production_report` | `production` | `canApprove` | `:27` · `:303` |
| `save_site_expense_claim` | `dept_finance_site_cost` | `canCreate` | `:214` · `:464` |
| `delete_site_expense_claim` | `dept_finance_site_cost` | `canEdit` | `:139` · `:381` |
| `approve_site_expense_claim` | `dept_finance_site_cost` | `canApprove` | `:28` · `:304` |

### 2) Cổng RBAC là **FAIL-CLOSED (default-DENY)** — ⛔ không thể «lọt» vì thiếu khai báo
`ActionRbacRegistry:538` → `return ACTION_MODULES.getOrDefault(action, List.of());`
⇒ action **không khai báo** trả về **danh sách RỖNG** ⇒ theo ghi chú trong chính tệp (`:112`, `:224-228`): `required.isEmpty()` = **MẶC ĐỊNH TỪ CHỐI**. ⇒ Hành vi **an toàn** kể cả khi quên khai.

### 3) **PHẠM VI DỰ ÁN được cưỡng chế ở tầng nghiệp vụ**
`ProductionManagementUseCase.java` — **có** `accessScope.requireProjectAccess(...)` tại **4 chỗ**: `:47` (tạo) · `:83` (sửa) · `:96` · `:140` ⇒ ⛔ **không** chỉ dựa vào quyền module.

### 4) ⚠️ `delete_warehouse`: **XÁC MINH ĐƯỢC LÀ ⛔ KHÔNG TỒN TẠI**
Grep toàn `java-backend/` cho `delete_warehouse` → **0 kết quả** ⇒ ⛔ **không có action xoá kho ở backend**. (Trước đây tôi ghi «chưa xác minh» — nay **đã xác minh**.) ⛔ Theo DATABASE SAFETY: ⛔ **KHÔNG tự thêm** action xoá kho — xoá kho là thao tác phá dữ liệu, cần **quyết định của user**.

## ⇒ KẾT LUẬN TRUNG THỰC: đây **KHÔNG** phải «việc cần cài cưỡng chế» mà là **«việc cần CHỨNG MINH»**
⚠️ Giống P3-BE-02: bản phân rã ban đầu của tôi giả định có **khoảng trống**, nhưng **đọc mã cho thấy khoảng trống đó KHÔNG tồn tại**. Việc còn lại **duy nhất** là **test chứng minh** điều được yêu cầu: *«kiểm bằng user thường ⇒ 403»*.

## ⏳ Việc THẬT còn lại: viết test chứng minh (⛔ chưa làm)
**Tệp test mới** (noi khuôn `RequestSupplementIntegrationTest`): `ConstructionRbacEnforcementTest`
| # | Ca cần chứng minh | Cách kiểm |
|---|---|---|
| ① | user **THIẾU quyền** gọi `save_construction_daily_log` ⇒ **bị từ chối** | `status().is4xxClientError()` + DB ⛔ **không** thêm bản ghi |
| ② | user **THIẾU quyền** gọi `delete_construction_daily_log` ⇒ **bị từ chối** | `is4xxClientError()` + bản ghi **vẫn còn** |
| ③ | user **CÓ quyền module nhưng ⛔ KHÔNG có phạm vi dự án** ⇒ **bị từ chối** | chứng minh tầng `requireProjectAccess` chạy thật |
| ④ | user **CÓ cả quyền + phạm vi** ⇒ **thành công** | `isOk()` (đối chứng dương — ⛔ không chỉ kiểm ca âm) |

⚠️ **Vì sao ⛔ chưa viết trong vòng này**: context đã cạn; viết 1 tệp test tích hợp mới cần **đọc thêm** cách seed quyền module cho user thường (khuôn `TestActors` + `module_permissions`). Ép viết rồi ⛔ **không chạy/không sửa được lỗi** sẽ **rủi ro hơn** là để vòng sau làm có kiểm chứng (bài học đã mắc: từng làm hỏng 3 tệp test vì thao tác vội).

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **65/65 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Không blocker cứng.** ⚠️ **1 quyết định của user** (⛔ không tự quyết): có cần **thêm action `delete_warehouse`** không? — hiện ⛔ **không tồn tại**, và xoá kho là thao tác **phá dữ liệu** ⇒ cần user cho phép mới làm.

## Next action
1. Viết `ConstructionRbacEnforcementTest` phủ **4 ca** ở trên ⇒ chạy `mvn test` (kỳ vọng `65 + N` ĐẠT).
2. Hỏi user về `delete_warehouse` (có cần thêm không) — gộp vào **nhóm câu hỏi đang chờ** cùng P3-BE-02/03/05.

---

## ✅ ĐÃ CHỨNG MINH BẰNG TEST (hoàn tất)

### Tệp test mới
`java-backend/web/src/test/java/com/vntech/erp/web/controller/ConstructionRbacEnforcementTest.java`
(noi khuôn `RequestSupplementIntegrationTest` · dùng `TestActors.seedRequester` + `TestActors.login` + `JdbcTemplate`)

### 3 hành vi được CHỨNG MINH
| # | Hành vi | Cách chứng minh |
|---|---|---|
| ① | **Thiếu quyền `construction` ⇒ LƯU NHẬT KÝ THI CÔNG bị TỪ CHỐI** | tài khoản thường (⛔ chỉ có module `requests`) gọi `save_construction_daily_log` ⇒ `is4xxClientError()` |
| ② | **Thiếu quyền ⇒ XOÁ NHẬT KÝ cũng bị TỪ CHỐI** | cùng tài khoản gọi `delete_construction_daily_log` ⇒ `is4xxClientError()` |
| ③ | **⛔ KHÔNG «chặn trắng»** — đối chứng dương | **CẤP** module `construction` cho đúng tài khoản đó rồi gọi lại với **payload RỖNG** ⇒ lỗi chuyển thành **400 (đầu vào)**, ⛔ **không còn là lỗi quyền** ⇒ chứng minh ①② bị chặn **do QUYỀN** |

⚠️ **Vì sao ⛔ chưa làm ca ④ (phạm vi dự án)** — ~~để chạm tới tầng `requireProjectAccess`, payload phải **hợp lệ về nghiệp vụ**~~ ⇒ ✅ **ĐÃ LÀM ĐƯỢC sau khi đọc kỹ mã** (xem mục dưới): cổng phạm vi là **kiểm tra ĐẦU TIÊN** trong `saveConstructionDailyLog` ⇒ ⛔ **không cần payload nghiệp vụ đầy đủ**, chỉ cần `logId`+`projectId`.

### ✅ CA ④ ĐÃ HOÀN THÀNH (cập nhật)
Đọc thân `ProductionManagementUseCase.saveConstructionDailyLog` (**L344+**) thấy **ngay sau khi đọc `logId`/`projectId`** là:
```java
accessScope.requireProjectAccess(principal.userId(), principal.role(), projectId, true,
        "Không có quyền cập nhật nhật ký thi công tại dự án này.");
```
⇒ Cổng **PHẠM VI** chạy **TRƯỚC mọi kiểm tra nghiệp vụ khác** ⇒ test được bằng **payload tối thiểu**, ⛔ **không phải bịa dữ liệu thi công**.
**Ca ④ đã thêm vào test**: cấp quyền module `construction` **+** có phạm vi `p_1`, nhưng gọi vào **`p_2`** (dự án ⛔ không có dòng `user_project_scopes`) ⇒ **`is4xxClientError()`** ⇒ chứng minh tầng **phạm vi dự án** cưỡng chế THẬT, ⛔ không chỉ dựa quyền module.

### ✅ KẾT QUẢ CUỐI (đủ 4/4 hành vi)
| # | Hành vi | Kết quả |
|---|---|---|
| ① | Thiếu quyền `construction` ⇒ LƯU bị từ chối | ✅ |
| ② | Thiếu quyền ⇒ XOÁ bị từ chối | ✅ |
| ③ | Cấp quyền ⇒ cổng mở (lỗi chuyển thành **400 đầu vào**) — ⛔ không «chặn trắng» | ✅ |
| ④ | **Thiếu PHẠM VI dự án** (dù có quyền module) ⇒ **bị từ chối** | ✅ |
| **`mvn test` toàn bộ** | | ✅ **`Tests run: 66, Failures: 0, Errors: 0, Skipped: 0`** · **`BUILD SUCCESS`** |

### KẾT QUẢ CHẠY
| Cổng | Kết quả |
|---|---|
| `ConstructionRbacEnforcementTest` (chạy riêng) | ✅ **Tests run: 1, Failures: 0, Errors: 0** · `BUILD SUCCESS` |
| `mvn -f java-backend/pom.xml test` (toàn bộ) | ✅ **`Tests run: 66, Failures: 0, Errors: 0, Skipped: 0`** · **`BUILD SUCCESS`** |
| (65 bài cũ + **1 bài mới**) | ✅ khớp chính xác kỳ vọng ⇒ **⛔ không hồi quy** |

### ⚠️ MỘT CÁI BẪY SỐ LIỆU TÔI ĐÃ GẶP VÀ TỰ GỠ (ghi để không lặp)
Khi cộng dồn `target/surefire-reports/*.txt` tôi thấy **67 bài · 1 THẤT BẠI** — mâu thuẫn với `BUILD SUCCESS`.
**Nguyên nhân**: có **1 báo cáo CŨ 5 NGÀY** (`RbacApprovalCardTest`, ghi lúc **03:32 ngày 22/09**, trong khi lượt chạy thật là **02:37–02:39 ngày 27/09**) của một test **đã bị xoá** (⛔ không còn `.java` lẫn `.class`) — báo cáo cũ **nằm lại** trong thư mục `target/`.
**Cách kiểm đúng**: cộng **chỉ các báo cáo thuộc lượt chạy hiện tại** (lọc theo thời gian) ⇒ **66/66 ĐẠT** ✅ khớp `65 + 1`.
⇒ **Bài học**: ⛔ **không cộng dồn `surefire-reports` mà bỏ qua THỜI GIAN** — `target/` giữ lại báo cáo của các test đã xoá, gây kết luận sai là «có hồi quy».

## Blockers
⛔ **Không blocker cứng** với phần cưỡng chế quyền (đã chứng minh).
⚠️ **1 quyết định của user**: có cần **thêm action `delete_warehouse`** không? — hiện ⛔ **không tồn tại**; xoá kho là thao tác **phá dữ liệu** ⇒ ⛔ không tự thêm.