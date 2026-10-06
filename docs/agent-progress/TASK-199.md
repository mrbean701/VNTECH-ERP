# TASK-199 — GO-LIVE ĐỢT 54: ĐƯỜNG THÀNH CÔNG `approval_stage` — **5/5 ĐẠT** · **5 CHỐT CHẶN** đều đúng

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Mở rộng **đường thành công** sang cặp «tạo được mà ⛔ chưa từng xoá được» |
| **Kết quả** | ✅ **5/5 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **MySQL: 0 rác, bảng về y trạng thái gốc** |
| **Bao phủ đường thành công** | **85 → 88** (`save_approval_stage` · `set_approval_stage_status` · `delete_approval_stage`) |
| **⭐ Phát hiện** | ⭐ **CẶP NÀY CÓ 5 CHỐT CHẶN — và CẢ 5 đều cho phép ĐÚNG thao tác** ⇒ ⭐ **⛔ KHÔNG có lỗi chuyển ngữ ở đây** |
| **⛔ LỖI CỦA TÔI** | **1** — đoán vai trò `admin` ⛔ không đọc hết khối validate ⇒ API trả 400 rõ ràng, ⛔ **không tạo rác** |
| **Sản phẩm** | `tools/e2e/go-live-thanh-cong-buoc-duyet.mjs` |

---

## ① ⭐ HỢP ĐỒNG ĐỌC TỪ MÃ — CẶP NÀY CÓ **5 CHỐT CHẶN**

| Action | Chốt chặn (đọc từ `OpsTaskManagementUseCase`) |
|---|---|
| `saveApprovalStage` | ⛔ **tên rỗng hoặc ⛔ không có vai trò** ⇒ 400 «Bước phê duyệt phải có tên và ít nhất một vai trò được phép duyệt.» · ⛔ **vai trò ⛔ không nằm trong `activeRoleCodes()`** ⇒ 400 «Vai trò … không tồn tại hoặc đang bị ẩn.» |
| `setApprovalStageStatus` | ⛔ không tìm thấy ⇒ 400 · ⚠️ **TẮT mà đang có hồ sơ chờ xử lý** ⇒ 400 «Bước này đang có hồ sơ chờ xử lý…» · ⚠️ **bước hoạt động cuối cùng** ⇒ 400 «Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động.» |
| `deleteApprovalStage` | ⛔ không tìm thấy ⇒ 400 · ⚠️ **đã có lịch sử hồ sơ** ⇒ 400 «Bước đã có lịch sử hồ sơ nên không được xóa. Hãy dùng Ẩn để ngừng áp dụng cho phiếu mới.» · ⚠️ **≤1 bước hoạt động** ⇒ 400 «Không thể xóa bước hoạt động cuối cùng.» |

⭐⭐ **SO SÁNH VỚI BUG-014**: ⭐ **ở đó chốt chặn BỊ MẤT khi chuyển ngữ**; ⭐ **ở đây 5/5 chốt chặn CÒN NGUYÊN và còn CHẶT HƠN JS** (⭐ thêm luật «không xoá bước hoạt động cuối cùng») ✓

---

## ② ⭐ DỮ LIỆU THẬT ĐỌC TỪ CSDL (⛔ không đoán) — chuẩn bị cho phép thử

| Cần gì | ⭐ Đọc được từ đâu | Giá trị |
|---|---|---|
| **Mã vai trò hợp lệ** | ⭐ `store.activeRoleCodes()` ← `role_catalog` (`active=1`) | `hr` · `cht` · `da_nv` · `da_truong` · `kh_nv` · `kh_truong` · `ksda` · `thu_kho` · `thuky` · `accountant` · **`commander`** · `director` |
| **Còn xoá được không** | ⭐ `SUM(active=1)` phải **> 1** | **8** ⇒ ✅ **xoá được** ✓ |
| **`stage_no` chưa dùng** | ⭐ `MAX(stage_no)` | **103** ⇒ dùng **999** ⇒ ⭐ **0 lịch sử hồ sơ** ⇒ qua được chốt xoá ✓ |
| **Tên mảng bootstrap** | ⭐ `BootstrapDataAdapter:937-941` ghi rõ | ⭐ **`approvalStages` = `approvalStageCatalog` — CÙNG dữ liệu, HAI TÊN** ✓ |

⚠️⚠️ **BẪY HAI MẢNG — LẦN THỨ HAI GẶP** (⭐ lần đầu là `materialCategories`/`adminMaterialCategories`): ⭐ adapter **ghi rõ trong mã**: *«`approvalStages` → tab "Workflow phê duyệt" (UI dùng tên này…) … JS: `approvalStages: approvalStageCatalog` — **CÙNG một dữ liệu, hai tên**»* ✓
⇒ ⭐ **bài kiểm đọc id từ CẢ HAI và ĐỐI CHIẾU CHÉO**, ⛔ **không quét mọi mảng** (⭐ bài học TASK-195: quét mọi mảng sẽ khớp `audits` ⇒ **lấy NHẦM id**) ✓

---

## ③ ⛔ LỖI CỦA TÔI — ĐOÁN VAI TRÒ `admin` ⛔ KHÔNG ĐỌC HẾT KHỐI VALIDATE

**Lần chạy đầu**: `① save_approval_stage` ⇒ ⛔ **400 «Vai trò admin không tồn tại hoặc đang bị ẩn.»** ✓
**Nguyên nhân**: ⭐ tôi **đọc các dòng `payload.get(...)`** rồi ⛔ **dừng**, ⛔ **không đọc tiếp** phần:
```java
List<String> validRoles = store.activeRoleCodes();
for (String roleCode : allowedRoles)
    if (!validRoles.contains(roleCode))
        throw Api("Vai trò " + roleCode + " không tồn tại hoặc đang bị ẩn.");
```
⭐⭐ **BÀI HỌC (lặp lại lần thứ N): ĐỌC TRỌN KHỐI VALIDATE, ⛔ KHÔNG CHỈ CÁC DÒNG ĐỌC THAM SỐ.** ⭐ **Chốt chặn thường nằm SAU các dòng đọc tham số** ✓

### ✅ HAI ĐIỀU TỐT RÚT RA TỪ LỖI NÀY
1. ⭐ **CHỐT CHẶN ĐÃ KIỂM TRA VÀ TRẢ 400 RÕ RÀNG** ⇒ ⛔ **không có bản rác nào được tạo** ✓ (⭐ khác hẳn BUG-014 nơi chốt chặn ⛔ không tồn tại)
2. ⭐⭐ **LOGIC «BỎ QUA» CỦA BÀI KIỂM HOẠT ĐỘNG ĐÚNG** — ⛔ **không báo động giả dây chuyền** (⭐ bản sửa từ TASK-193 đứng vững) ✓ và bài kiểm **in rõ** «⛔ KHÔNG có bản rác nào được tạo ⇒ ⛔ không cần dọn» ✓

---

## ④ ✅ KẾT QUẢ — **5/5 ĐẠT · EXIT=0**

```text
[DAT] ① save_approval_stage (TẠO THẬT)
[DAT] ② ĐỌC LẠI — tìm id trong ĐÚNG hai mảng (đối chiếu chéo)
[DAT] ③ set_approval_stage_status(active=false) — SỬA THẬT
[DAT] ④ delete_approval_stage (XOÁ THẬT — DỌN SẠCH)
[DAT] ⑤ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy bước phê duyệt.»
dat 5/5 · that bai 0 · EXIT=0
```
⭐⭐ **VÀ CẢ 5 CHỐT CHẶN ĐỀU CHO PHÉP ĐÚNG THAO TÁC**: tạo với **vai trò hợp lệ** ✓ · tắt khi **0 hồ sơ chờ** ở stage 999 ✓ · xoá khi **0 lịch sử** + còn **8 bước hoạt động** ✓ ⇒ ⭐ **thiết kế chốt chặn HOẠT ĐỘNG ĐÚNG** ✓

### ✅ KIỂM HẬU QUẢ **HAI LỚP** (⭐ bài học TASK-196: bootstrap có điểm mù ⇒ **phải kiểm MySQL**)
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** — ⭐ **tạo rồi xoá ⇒ về đúng trạng thái cũ** ✓ |
| ⭐ **MySQL** (có thẩm quyền) | ✅ **`rac_e2e_con_lai = 0`** · ✅ **bảng về đúng `8` dòng · `8` hoạt động · `max stage_no = 103`** ⇒ ⭐ **y hệt trạng thái gốc** ✓ |
| `chup-so-dong` | ✅ chỉ `audit_logs` +3 (nhật ký lệnh gọi) + `sessions` +1 (phiên của tôi) ✓ |

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `approval_stage` | ✅ **5/5 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **85 → 88** (39% → **40%**) |
| ⭐ **5 chốt chặn** | ✅ **CẢ 5 cho phép ĐÚNG thao tác** ⇒ ⛔ **không có lỗi chuyển ngữ ở cặp này** |
| Kiểm hậu quả | ✅ **2 lớp SẠCH** (94 mảng ⛔ không đổi + MySQL **0 rác**, bảng về **y trạng thái gốc**) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **1** — đoán vai trò `admin` ⇒ ⭐ **chốt chặn chặn đúng, ⛔ không sinh rác** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **ĐỌC TRỌN KHỐI VALIDATE, ⛔ KHÔNG CHỈ CÁC DÒNG ĐỌC THAM SỐ.** ⭐ Chốt chặn **thường nằm SAU** các dòng `payload.get(...)` ⇒ ⭐ dừng đọc sớm là **đoán** ✓ (⭐ lỗi này lặp lại nhiều lần trong phiên ⇒ ⭐ **quy tắc: đọc hết hàm, ⛔ đừng dừng ở phần đọc tham số**) ✓
2. ⭐⭐ **MỘT CHỐT CHẶN TỐT BIẾN LỖI CỦA TÔI THÀNH VÔ HẠI.** ⭐ Vì `save_approval_stage` **kiểm vai trò**, payload sai của tôi ⇒ **400 rõ ràng** và ⛔ **không có rác** ✓ — ⭐ **ngược hẳn BUG-014** (chốt ⛔ không tồn tại ⇒ **rác mồ côi**) ✓
3. ⭐⭐ **BÀI KIỂM PHẢI PHÂN BIỆT «BƯỚC ĐẦU HỎNG» VỚI «CÁC BƯỚC SAU HỎNG».** ⭐ Logic «BỎ QUA» (TASK-193) **đã đứng vững ở đây**: ⛔ không có báo động giả dây chuyền, và bài kiểm **in rõ** «⛔ không cần dọn» ✓
4. ⭐⭐ **KIỂM MySQL LÀ BẮT BUỘC, ⛔ KHÔNG CHỈ BOOTSTRAP.** ⭐ Lần này cả hai lớp đều sạch ⇒ ⭐ **kết luận vững** ✓ (⭐ nếu chỉ tin bootstrap thì TASK-196 đã bỏ sót rác **và** một lỗi thật) ✓
5. ⭐⭐ **BẪY HAI MẢNG GẶP LẦN THỨ HAI — VÀ LẦN NÀY TÔI ĐỌC ĐƯỢC NGUỒN GỐC.** ⭐ `BootstrapDataAdapter:937-941` **ghi rõ** «CÙNG một dữ liệu, HAI TÊN» ⇒ ⭐ **đọc id từ cả hai + đối chiếu chéo** ✓ — ⭐ thay vì **quét mọi mảng** (⛔ cách sai ở TASK-195) ✓
6. ⭐ **MỘT CẶP ĐƯỢC BẢO VỆ TỐT LÀ TIN ĐÁNG MỪNG** — ⭐ nó ⛔ **không phải lỗi**, ⭐ và **việc kiểm nó vẫn đáng làm** vì **chốt chặn phải được CHỨNG MINH là hoạt động**, ⛔ không chỉ đọc thấy trong mã ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **150 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **11 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Còn 5 cặp «tạo được mà chưa từng xoá được»**: `labor_contract` · `benefit_record` · `boq_item` · `project_contract` · `workflow` ⚠️ (**đều cần dữ liệu nghiệp vụ**) ⇒ ⭐ **tôi có thể tiếp tục nếu bạn cho phép** ✓
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
