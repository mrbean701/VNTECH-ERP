# TASK-MT3-BE-04 — Phạm vi tab PHÒNG BAN (`department` + `level`) + duyệt trong modal PR/PO

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-04 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | ✅ **KHẢO SÁT XONG — PHẦN PHẠM VI PHÒNG BAN ĐÃ CÓ SẴN** · ⏳ phần «duyệt trong modal» là **UI**, cần đo riêng |
| **Requirement** | Phạm vi tab Phòng ban phải theo **`department` + `level`** (cấp bậc) |

## ✅ BẰNG CHỨNG: hạ tầng phạm vi `department + level` **ĐÃ CÓ SẴN**
`application/src/main/java/com/vntech/erp/application/rbac/WorkScopeService.java` (**7.5 KB**):

| Thành phần | Vị trí | Ý nghĩa |
|---|---|---|
| **`record Scope(Kind kind, Integer levelRank, String department)`** | `:45` | ✅ **đã có CẢ `levelRank` LẪN `department`** — ⛔ không phải việc cần viết mới |
| `enum Kind` có **`DEPARTMENT`** | `:39` | ✅ có loại phạm vi phòng ban |
| **Ngưỡng cấp bậc ĐO TỪ CSDL `system_level_catalog`** | `:20-27` | ✅ ghi rõ *«⛔ không đoán»*; ví dụ `pho_giam_doc=35` (thêm ở `V30__mt2_p4_01_add_pho_giam_doc_level.sql`) |
| **Ghi chú AN TOÀN** | `:27` | ✅ *«AN TOÀN (⛔ không mở rộng quyền): tài khoản KHÔNG có cấp bậc (`level_rank`…)»* |
| Đã dùng cho luồng công việc | `:16-17` | `createWorkItem` gọi `userIsDepartmentManager(userId, department)` |

⇒ **KẾT LUẬN**: yêu cầu «phạm vi tab Phòng ban theo `department` + `level`» **ĐÃ ĐƯỢC ĐÁP ỨNG SẴN** trong hạ tầng phạm vi dùng chung.
⚠️ **Cần kiểm thêm** (⏳ chưa làm): tab Phòng ban ở **`WorkCenter`** khi gọi dữ liệu có **thực sự đi qua `WorkScopeService`** không — nếu có thì ⛔ **không có việc backend**; nếu tab đó lọc ở **giao diện** thì đó là **việc UI** (⛔ không phải GĐ2).

## ✅ ĐÃ XÁC NHẬN (BE-04b): backend **THỰC SỰ** áp phạm vi `department + level` cho danh sách công việc
| Bằng chứng | Vị trí |
|---|---|
| `OpsTaskManagementUseCase` **CÓ** `private final WorkScopeService workScope` | `:33` · tham số constructor `:38` |
| **Gọi THẬT**: `WorkScopeService.Scope scope = workScope.scopeOf(cu.id(), cu.role());` | **`:57-58`** |
| Chú thích khẳng định nguồn sự thật: *«nguồn duy nhất là WorkScopeService (ngưỡng **30/35 ĐO từ `system_level_catalog`**)»* | `:53` |
| **ĐÃ CÓ TEST** cho ca biên: `WorkScopeServiceTest.truongPhong_nhungKhongRoPhongBan_roiVeSELF` — *trưởng phòng nhưng KHÔNG rõ phòng ban ⇒ rơi về SELF* | `WorkScopeService.java:103` |

⇒ **KẾT LUẬN `BE-04`: ✅ ĐÃ ĐƯỢC ĐÁP ỨNG SẴN Ở BACKEND** — phạm vi tab Phòng ban do **`WorkScopeService.scopeOf()`** quyết định, dựa trên **`department` + `level_rank`** (ngưỡng đo từ CSDL), và **đã có test riêng**. ⛔ **KHÔNG có việc backend** cho phần này.

⚠️ Phần «**duyệt trong modal PR/PO**» của §E vẫn là **việc GIAO DIỆN** (⛔ không thuộc GĐ2) — ghi nhận để xử lý khi rà §E.

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **67/67 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Không blocker cứng.**

## Next action
1. Kiểm **tab Phòng ban** trong `WorkCenter` có đi qua `WorkScopeService` không (⛔ quyết định task này có việc backend hay không).
2. Nếu là việc UI ⇒ chuyển về **GĐ1** (hoặc ghi vào §E).

---

## 📊 CHỐT ĐO LẠI TOÀN BỘ 9 TASK GĐ2 (kết quả cuối)
| Task | Phân loại | Trạng thái |
|---|---|---|
| **BE-01** `request_supplement` | 🔴 **lỗ hổng thật** | ✅ **ĐÃ SỬA + CHỨNG MINH 4/4** |
| **BE-08** cưỡng chế quyền Thi công | 🟢 đã cưỡng chế sẵn | ✅ **ĐÃ CHỨNG MINH 4/4** |
| **BE-09** quyền gửi thông báo | 🔴 **lỗ hổng thật** | ✅ **ĐÃ BỊT + CHỨNG MINH (phần dự án)** · ⛔ `department`/`all` chờ luật |
| BE-02 sắp xếp + giữ 72h | 🟢 đã sắp xếp sẵn · ⛔ không lọc mất sớm | 🛑 chờ luật 72h |
| BE-03 tự từ chối sau 72h | ⛔ **luật MỚI** | 🛑 chờ luật |
| **BE-04** phạm vi Phòng ban | 🟢 **`WorkScopeService` đã có `department` + `levelRank`** | ✅ đã sẵn (⏳ kiểm tab có đi qua service không) |
| BE-05 tìm theo alias | 🟢 hạ tầng có sẵn | 🛑 chờ chốt phạm vi |
| BE-06 lịch sử tổ đội | 🟡 cốt lõi xong ở UI (có test) | 🛑 phân trang = API mới |
| BE-07 export UTF-8 | 🟢 đã đúng sẵn | 🛑 chờ nghĩa «audit & idempotency» |

### ⇒ KẾT LUẬN CUỐI VỀ GĐ2 (đo được, ⛔ không phóng đại)
- **3 task có việc mã thật** ⇒ **CẢ 3 ĐÃ XONG VÀ ĐƯỢC CHỨNG MINH BẰNG TEST**.
- **4 task phần lớn đã đáp ứng sẵn** trong hạ tầng dùng chung (BE-02 · BE-04 · BE-05 · BE-07).
- **2 task chờ LUẬT NGHIỆP VỤ của user** (BE-03 + phần còn lại của BE-02/BE-09) · **1 task chờ quyết định kiến trúc** (BE-06 phân trang = API mới).
- ⚠️ **Bản phân rã 9 task của tôi đã ĐÁNH GIÁ CAO khối lượng thật** ⇒ GĐ2 gần như **hoàn tất phần mã**, phần còn lại **phụ thuộc quyết định của user**, ⛔ không phải do thiếu nỗ lực.