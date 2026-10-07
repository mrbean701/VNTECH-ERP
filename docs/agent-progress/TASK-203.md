# TASK-203 — GO-LIVE ĐỢT 58: ĐƯỜNG THÀNH CÔNG `workflow` — **6/6 ĐẠT** · ⭐ **CHỐT BẢO VỆ HỆ THỐNG ĐÃ ĐƯỢC CHỨNG MINH**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Cặp `workflow` — **CẶP CUỐI CÙNG** của danh sách «tạo được mà ⛔ chưa từng xoá được» |
| **Kết quả** | ✅ **6/6 ĐẠT · EXIT=0** · ⭐ **94 mảng bootstrap ⛔ không đổi** · ⭐ **CẢ 4 mảng workflow về đúng gốc** · ⭐ **MySQL `rac_cua_toi = 0`** |
| **Bao phủ đường thành công** | **96 → 98** |
| **⭐⭐ ĐÁNG GIÁ NHẤT** | ⭐⭐ **CHỐT BẢO VỆ HỆ THỐNG ĐÃ ĐƯỢC CHỨNG MINH**: ⛔ **KHÔNG THỂ xoá quy trình mặc định `WF-MUAHANG`** |
| **⛔ LỖI CỦA TÔI** | **1** — ⭐ **đoán 2 tên trường** ⇒ ⭐ **NHƯNG chốt chặn chặn đúng, ⛔ không rác** |
| **⭐⭐ BÀI HỌC MỚI** | ⭐⭐ **ĐỌC DÒNG GÁN, ⛔ KHÔNG CHỈ DÒNG DÙNG** — ⭐ **tinh chỉnh quy tắc TASK-199** |

---

## ① ⭐ HỢP ĐỒNG ĐỌC **TRỌN** TỪ MÃ (`OpsTaskManagementUseCase`)

| Action | Chốt chặn |
|---|---|
| `saveWorkflow` | ⛔ `code`/`name` rỗng ⇒ 400 «Quy trình cần mã và tên.» · ⚠️ `code` phải khớp `[A-Za-z0-9._-]{3,64}` · ⚠️⚠️ **`stages` phải ≥1 bước** ⇒ 400 «Quy trình phải có ít nhất một bước duyệt.» · ⭐ mỗi bước: `stepNo` (⛔ không trùng) · **`name`** (⇒ 400 «Bước N chưa có tên.») · `approvalMode` ∈ {`single`,`any_of`,`all_of`} · ⚠️ **`approverUserIds` BẮT BUỘC** · ⚠️ `single` ⇒ **đúng 1 người** · ⭐ **CHỐT CHỐNG TRÙNG MÃ**: `findWorkflowByCode` ⇒ 400 «Mã quy trình “X” đã tồn tại.» |
| `deleteWorkflow` | **2 CHỐT**: ① ⛔ không tìm thấy ⇒ 400 · ② ⭐⭐ **CHỐT CỨNG BẢO VỆ HỆ THỐNG** — `WF-MUAHANG` (theo **id HOẶC** code `WF-MUAHANG-01`) ⇒ 400 «Đây là quy trình mặc định của hệ thống — **chỉ được ngừng áp dụng, không được xóa**.» · ⭐ `deleteWorkflowSafe` **XOÁ CẢ CÁC BƯỚC** |

⭐ **DỮ LIỆU THẬT**: người duyệt `USR_e66f85ff-…` (`e2e.bgd`) · ⭐ **4 mảng bootstrap** (`BootstrapDataAdapter:1029-1038`): `workflowDefinitions` **5** · `workflowSteps` **14** · `workflowStepApprovers` **14** · `workflowAssignments` **10** ⇒ ⭐ **cả 4 phải về đúng** ✓

---

## ② ⭐⭐ ĐIỀU ĐÁNG GIÁ NHẤT — **CHỐT BẢO VỆ HỆ THỐNG ĐÃ ĐƯỢC CHỨNG MINH**

```text
③ delete «WF-MUAHANG» ⇒ phải 400 «quy trình mặc định của hệ thống…» (CHIỀU ÂM)   ← ⭐ DAT
```
⇒ ⭐⭐ **HỆ THỐNG THỰC SỰ KHÔNG CHO XOÁ QUY TRÌNH MẶC ĐỊNH** — ⛔ **không chỉ «đọc thấy trong mã»** ✓✓✓
⭐⭐ **VÀ PHÉP KIỂM NÀY HOÀN TOÀN VÔ HẠI**: ⭐ **chốt chặn chặn nó** ⇒ ⛔ **không có gì bị xoá** ✓
⭐ **Đây là loại phép kiểm tốt nhất**: ⭐ **kiểm một chốt chặn QUAN TRỌNG** (bảo vệ cấu hình hệ thống) ⭐ **mà ⛔ không có rủi ro** ✓

---

## ③ ✅ KẾT QUẢ — **6/6 ĐẠT · EXIT=0**

```text
[DAT] ① save_workflow (TẠO THẬT — 1 bước, mode=single)
[DAT] ② TẠO LẦN 2 CÙNG MÃ ⇒ phải 400 «Mã quy trình … đã tồn tại.»
[DAT] ③ delete «WF-MUAHANG» ⇒ phải 400 «quy trình mặc định của hệ thống…» (CHIỀU ÂM)
[DAT] ④ ĐỌC LẠI — tìm id MỚI bằng SO TẬP ID
[DAT] ⑤ delete_workflow (XOÁ THẬT — ⭐ xoá cả các bước)
[DAT] ⑥ XOÁ LẦN 2 ⇒ phải 400 «Không tìm thấy quy trình.»
HẬU QUẢ — 94 mảng bootstrap: ✔ KHÔNG mảng nào đổi
ⓘ workflowDefinitions: 5 → 5 · workflowSteps: 14 → 14 · workflowStepApprovers: 14 → 14 · workflowAssignments: 10 → 10
dat 6/6 · that bai 0 · EXIT=0
```

### ✅ KIỂM HẬU QUẢ **HAI LỚP**
| Lớp | Kết quả |
|---|---|
| **Bootstrap** | ✅ **94 mảng ⛔ KHÔNG mảng nào đổi** · ⭐ **cả 4 mảng workflow về ĐÚNG gốc** ✓ |
| ⭐ **MySQL** | ✅ **`rac_cua_toi = 0`** (lọc theo `code LIKE 'E2F-WF-%'`) · ✅ **`tong_wf = 5`** · ✅ **`tong_buoc = 14`** ✓ |
| ⭐ **Bằng chứng `deleteWorkflowSafe` xoá ĐÚNG** | ⭐ **`workflowSteps` 14 → 14** ⇒ **bước của tôi ⛔ không còn** ✓ |

---

## ④ ⛔ LỖI CỦA TÔI — ĐOÁN **2 TÊN TRƯỜNG** · ⭐ VÀ **BÀI HỌC MỚI, CHÍNH XÁC HƠN**

**Lần chạy đầu**: ① ⇒ ⛔ **400 «Bước 1 chưa có tên.»** ✓

**Nguyên nhân — đọc từ DÒNG GÁN** (`OpsTaskManagementUseCase:689-693`):
```java
int stepNo = (int) Math.round(numberValue(raw.get("stepNo")));   // ✅ tôi ĐÚNG
String stepName = trim(raw.get("name"));                          // ⛔ KHÔNG phải "stepName" — là "name"
String mode = trim(raw.get("approvalMode"));                      // ⛔ KHÔNG phải "mode" — là "approvalMode"
```

### ⭐⭐ BÀI HỌC MỚI — TINH CHỈNH QUY TẮC TASK-199
⭐⭐ **TÔI ĐÃ ĐỌC TRỌN KHỐI VALIDATE** ⚠️ — ⭐ **nhưng bộ lọc grep của tôi CHỈ GIỮ các dòng `if (`/`throw`** ⇒ ⛔ **NÓ BỎ MẤT CÁC DÒNG GÁN** ✓
⇒ ⭐⭐⭐ **QUY TẮC CHÍNH XÁC HƠN**:
> ⭐ **ĐỌC DÒNG GÁN (`String x = trim(raw.get("KEY"))`), ⛔ KHÔNG CHỈ DÒNG DÙNG (`x.isEmpty()`).**
> ⭐ **Dòng DÙNG cho biết CÓ kiểm tra; dòng GÁN cho biết TÊN TRƯỜNG.**

⭐ **VÀ điều tốt**: ⭐ **chốt chặn đã kiểm tra và trả 400 rõ ràng** ⇒ ⛔ **không có rác nào được tạo** ✓ (⭐ MySQL xác nhận: **5 / 14** nguyên vẹn) ✓

---

## ⑤ ⭐⭐⭐ ĐÓNG SỔ WORKSTREAM «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC»

| # | Cặp | Vòng | Kết quả |
|---|---|---|---|
| 1 | `business_role_group` | TASK-193 | ✅ **5/5** |
| 2 | `material_norm` | TASK-194 | ✅ **5/5** |
| 3-6 | `payment_plan` · `seal` · `legal_document` · `correspondence` | TASK-195 | ✅ **16/16** |
| 7 | `approval_stage` | TASK-199 | ✅ **5/5** (5 chốt chặn) |
| 8 | `project_contract` | TASK-200 | ✅ **5/5** (+ chốt chống xoá nhầm) |
| 9 | `labor_contract` | TASK-201 | ✅ **5/5** (+ so tập ID) |
| 10 | `benefit_record` | TASK-202 | ✅ **5/5** (+ 4 kỹ thuật cùng lúc) |
| 11 | **`workflow`** | **TASK-203** | ✅ **6/6** (+ chốt bảo vệ hệ thống) |
| ⛔ | **`boq_item`** | TASK-203 | ⛔ **KHÔNG PHÙ HỢP** — **xoá MỀM + ghi lịch sử THEO THIẾT KẾ** ⇒ ⭐ **nó LUÔN để lại dấu vết** ⇒ ⛔ **không kiểm được theo khuôn «về như cũ»** — ⭐ **và «giữ lịch sử» là hành vi ĐÚNG** ✓ |

⇒ ⭐⭐⭐ **WORKSTREAM ĐÃ ĐÓNG: 11 cặp kiểm được (52 lượt ĐẠT) + 1 cặp ⛔ không phù hợp (có lý do đo được)** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Vòng đời `workflow` | ✅ **6/6 ĐẠT · EXIT=0** |
| Bao phủ **đường thành công** | **96 → 98** |
| ⭐⭐ **Chốt bảo vệ hệ thống** | ✅ **CHỨNG MINH: ⛔ không xoá được `WF-MUAHANG`** |
| ⭐ Chốt chống trùng mã | ✅ **400 «Mã quy trình … đã tồn tại.»** |
| Kiểm hậu quả | ✅ **2 lớp SẠCH** (94 mảng · **cả 4 mảng workflow về đúng gốc** · MySQL **0 rác**) |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **1** — đoán 2 tên trường ⇒ ⭐ **chốt chặn chặn đúng, ⛔ không rác** |
| ⭐⭐ Bài học mới | ⭐⭐ **ĐỌC DÒNG GÁN, ⛔ không chỉ dòng DÙNG** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **ĐỌC DÒNG GÁN, ⛔ KHÔNG CHỈ DÒNG DÙNG.** ⭐ Tôi **đã đọc trọn khối validate** nhưng **bộ lọc grep chỉ giữ dòng `if`/`throw`** ⇒ ⛔ **bỏ mất dòng gán** ⇒ **đoán sai 2 tên trường** ✓ ⭐ **tinh chỉnh quy tắc TASK-199** ✓
2. ⭐⭐⭐ **PHÉP KIỂM CHỐT CHẶN TỐT NHẤT LÀ PHÉP KIỂM VÔ HẠI MÀ QUAN TRỌNG.** ⭐ `delete WF-MUAHANG` ⇒ **chốt chặn chặn nó** ⇒ ⭐ **kiểm được một bảo vệ CỐT LÕI của hệ thống mà ⛔ không có rủi ro** ✓
3. ⭐⭐ **CHỐT CHẶN TỐT BIẾN LỖI CỦA TÔI THÀNH VÔ HẠI** (⭐ lần thứ hai trong phiên) — ⭐ payload sai ⇒ **400 rõ ràng, ⛔ không rác** ✓
4. ⭐⭐ **KIỂM NHIỀU MẢNG LIÊN QUAN, ⛔ KHÔNG CHỈ MẢNG CHÍNH.** ⭐ `workflow` có **4 mảng** ⇒ ⭐ **cả 4 về gốc** mới chứng minh **`deleteWorkflowSafe` xoá ĐÚNG cả các bước** ✓
5. ⭐⭐ **MỘT CẶP ⛔ KHÔNG PHÙ HỢP CŨNG LÀ KẾT QUẢ.** ⭐ `boq_item` **xoá mềm + ghi lịch sử THEO THIẾT KẾ** ⇒ ⭐ **ghi lại lý do, ⛔ không cố ép cho vừa khuôn** ✓
6. ⭐ **WORKSTREAM ĐÓNG SỔ VỚI 11/12 CẶP KIỂM ĐƯỢC** — ⭐ **và ⛔ không cặp nào để lại rác** ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **161 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **7 bản vá** + **16 bài nghiệm thu** — ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 và BUG-014** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Workstream «tạo-xoá» nay ĐÃ ĐÓNG** — ⭐ **đề xuất tiếp theo**: ⭐ **mở rộng sang ĐƯỜNG THÀNH CÔNG của các action NGHIỆP VỤ** (tạo phiếu → duyệt → nhập/xuất kho → thanh toán) ⚠️ **cần bạn xác nhận vì chúng GHI dữ liệu nghiệp vụ THẬT** ✓
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
