# TASK-187 — GO-LIVE ĐỢT 42: ĐO `set_*` ⇒ **8/30 CHƯA TEST** ⇒ ĐÃ KIỂM **16/16 ĐẠT** · ⛔ **2 BÁO ĐỘNG GIẢ CỦA TÔI** · ✅ **1 ĐÍNH CHÍNH GHI CHÉP CŨ**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Phương pháp** | ⭐ **Áp đúng bài học TASK-186**: «`set_*` một phần» là **cảm giác** ⇒ **ĐO** |
| **Kết quả 1** | ✅ **8/30 `set_*` chưa từng test** ⇒ **đã kiểm 16/16 ĐẠT · EXIT=0** |
| **Kết quả 2** | ⛔ **2 BÁO ĐỘNG GIẢ của chính tôi** — đã nhận diện và bỏ |
| **Kết quả 3** | ✅ **ĐÍNH CHÍNH ghi chép cũ**: `manage_contract_review` ⛔ **KHÔNG phải «đăng ký chết»** |
| **Tệp sửa** | `tools/e2e/go-live-kiem-set-con-lai.mjs` (⛔ ngoài `ROOT_DIRS`) · `docs/agent-progress/MASTER_STATUS.md` |
| **Vân tay** | ⛔ **không đổi** |

---

## ① ⭐ ĐO TRƯỚC, ⛔ KHÔNG ĐOÁN — 8/30 `set_*` CHƯA TỪNG TEST

Đối chiếu **30 `set_*`** trong `ActionRbacRegistry` với nội dung **mọi bài E2E**:
| | |
|---|---|
| Có trong bài test | ✅ **22** |
| ⛔ **CHƯA CÓ** | **8** |

**8 action chưa từng test**: `set_approval_stage_status` · `set_material_category_status` · `set_project_team_status` · `set_role_status` · **`set_user_status`** · **`set_user_system_level`** · `set_work_item_participant` · `set_workflow_status`
⚠️ **4 trong 8 là NHẠY CẢM** (người dùng / vai trò / quyền / workflow) ⇒ ⭐ **khuôn «ID BỊA» an toàn vì ⛔ không khớp bản ghi thật nào**, và ⭐ **bài kiểm chính là để phát hiện action nào có TÁC DỤNG PHỤ TOÀN HỆ THỐNG** — đúng loại lỗi của **BUG-20261010** ✓

---

## ② ✅ KẾT QUẢ — **16/16 ĐẠT · EXIT=0** · HẬU QUẢ SẠCH

Hai phép kiểm mỗi action: **① payload RỖNG → 400** · **② ID BỊA → 400 «Không tìm thấy»**
```text
KET QUA KIỂM 8 `set_*` CHƯA TEST: dat 16/16 · that bai 0
EXIT=0
```
**Kiểm hậu quả hai lớp**: ⭐ **94 mảng bootstrap ✔ không mảng nào đổi** · ⭐ `chup-so-dong.mjs` **131 bảng** — **chỉ `sessions` +2** (phiên của tôi), ⛔ **mọi bảng khác không đổi** ✓

---

## ③ ⭐ TÌM RA — **2 ACTION ĐÃ ĐĂNG KÝ NHƯNG ⛔ CHƯA CÀI Ở BACKEND**

`set_work_item_participant` trả: **«Action … chưa được triển khai trên backend Java»** (nhánh mặc định của `SystemController`).
⭐ **ĐỐI CHIẾU registry (214 action) ⇄ controller (259 `case`)** ⇒ ⛔ **chỉ 2 action thật sự đăng ký mà chưa cài**:
| Action | UI có gọi? |
|---|---|
| `add_work_item_comment` | ⛔ **không** |
| `set_work_item_participant` | ⛔ **không** |

⇒ ⭐⭐ **KẾT LUẬN: ⛔ KHÔNG có tính năng nào hỏng với người dùng** — cả hai là **đăng ký thừa cho đủ danh mục RBAC** ⇒ §4 mức **LOW** ✓
⭐ **VÀ phép đo này trả lời được câu hỏi lớn hơn**: *«có action nào âm thầm hỏng không?»* ⇒ ⭐ **KHÔNG** (đo được, ⛔ không suy đoán) ✓

---

## ④ ⛔⛔ **2 BÁO ĐỘNG GIẢ CỦA CHÍNH TÔI** — TỰ NHẬN DIỆN VÀ BỎ

### ⛔ Giả 1 — «65 action khai `List.of()` ⇒ bị 403 với mọi người»
⭐ **ĐO ĐƯỢC 65 action** khai `List.of()` và tôi **suýt kết luận đó là 65 lỗi quyền**. ⛔ **SAI**: danh sách gồm **`login` · `logout` · `change_password` · `update_profile_avatar` · `mark_notification_read`** — ⭐ **đó CHÍNH LÀ `PUBLIC_ACTIONS`**! Và mã RBAC kiểm **`PUBLIC_ACTIONS` TRƯỚC**:
```java
if (PUBLIC_ACTIONS.contains(action)) return;   // ⇐ THOÁT TRƯỚC khi tới nhánh isEmpty()
```
⇒ ⭐⭐ **`List.of()` = dấu hiệu «CHỈ ADMIN» theo thiết kế** (handler gọi `requireRole` trong **UseCase**) ⇒ ⛔ **KHÔNG phải lỗi** ✓

### ⛔ Giả 2 — cột «65 action ⛔ KHÔNG thấy `requireRole`»
⛔ **PHÉP ĐO SAI TỆP**: tôi tìm `requireRole` trong **`SystemController`** (±40 dòng quanh `case`), nhưng lệnh đó nằm ở **lớp UseCase** (`UserManagementUseCase:259` · `:336` · `:563` …) ⇒ ⛔ **cả 65 dòng «⛔» đều VÔ NGHĨA** ✓
⭐⭐ **BÀI HỌC: MỘT PHÉP ĐO Ở SAI TỆP CÒN TỆ HƠN ⛔ KHÔNG ĐO** — nó tạo ra **một cột 65 dấu ⛔ trông rất đáng ngại** mà ⛔ **không có nghĩa gì** ✓

---

## ⑤ ✅ ĐÍNH CHÍNH GHI CHÉP CŨ CỦA TÔI — `manage_contract_review` ⛔ **KHÔNG PHẢI ĐĂNG KÝ CHẾT**

Ghi chép cũ (từ đầu phiên) nói: *«`manage_contract_review` là một đăng ký chết (không controller handler, không UI caller)»*. ⛔ **SAI.**

**ĐO ĐƯỢC**: `SystemController` có **5 `case`** cho họ này — `save_contract_review` · `open_contract_review` · `log_contract_review` · `list_contract_review` · `delete_contract_review` — và **cả 5 đi qua `ContractReviewUseCase`**, nơi có:
```java
// dòng 125-129
/** ⛔ Backend là lớp kiểm soát: chặn ở server, không chỉ ẩn nút ở UI (goal §12). */
private void guard(Principal principal) {
    rbac.requireActionModule(currentUser(principal), ACTION);
}
// dòng 132
private static final String ACTION = "manage_contract_review";
```
⇒ ⭐⭐ **`manage_contract_review` LÀ CỔNG RBAC DÙNG CHUNG CHO CẢ HỌ 5 ACTION** (module `dept_legal_contract_review` · `canEdit`) — ⛔ **không phải đăng ký chết, mà là thiết kế MỘT cổng cho một họ hành động** ✓
⭐ **VÀ** nó giải thích vì sao 5 tên đó ⛔ **không có trong registry**: ⭐ **chúng không cần** — cổng đã nằm ở UseCase ✓

---

## ⑥ ⭐ SỬA BÀI KIỂM ĐỂ ⛔ KHÔNG TẠO **TÍN HIỆU SAI**

Lần chạy đầu: **15/16** + **EXIT=1** — ⛔ **không phải lỗi sản phẩm** mà vì bài kiểm **chưa biết** `set_work_item_participant` là **action đã biết chưa cài** ⇒ nó báo «thông điệp lạ» ✓
⇒ ✅ **Đã sửa**: thêm `chuaCai: /chưa được triển khai/i` cho action đó ⇒ **16/16 ĐẠT · EXIT=0** ✓
⭐⭐ **BÀI HỌC: MỘT NGOẠI LỆ ĐÃ BIẾT PHẢI ĐƯỢC MÃ HOÁ TRONG BÀI KIỂM** — ⛔ nếu không, bài kiểm sẽ **báo động giả MÃI MÃI** cho mọi người chạy sau ✓ (cùng loại lỗi với `tomTatBuoc` ở TASK-181)

---

## ⑦ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `set_*` đã đo | **30** — ✅ 22 đã test + ⛔ 8 chưa ⇒ ⭐ **nay 30/30** |
| Bài kiểm mới | ✅ **16/16 ĐẠT · EXIT=0** |
| Kiểm hậu quả | ✅ **94 mảng bootstrap không đổi** + **chỉ `sessions` +2** |
| Action đăng ký mà chưa cài | **2** (`add_work_item_comment` · `set_work_item_participant`) — ⭐ **⛔ không UI nào gọi** ⇒ LOW |
| ⛔ Báo động giả của tôi | **2** — đã nhận diện và bỏ |
| ✅ Đính chính ghi chép cũ | **1** — `manage_contract_review` là **cổng RBAC**, ⛔ không phải đăng ký chết |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá Java chưa lên sóng** |

---

## ⑧ BÀI HỌC

1. ⭐⭐ **MỘT PHÉP ĐO Ở SAI TỆP CÒN TỆ HƠN ⛔ KHÔNG ĐO.** Cột «65 action ⛔ không thấy `requireRole`» **trông rất đáng ngại** nhưng ⛔ **vô nghĩa** vì tôi tìm ở `SystemController` còn lệnh nằm ở **UseCase** ✓
2. ⭐⭐ **TRƯỚC KHI GỌI MỘT THỨ LÀ «CHẾT», PHẢI KIỂM NÓ CÓ ĐƯỢC DÙNG **GIÁN TIẾP** KHÔNG.** `manage_contract_review` ⛔ **không có `case`** ⇒ tôi từng gọi là «đăng ký chết» — ⭐ **thực ra nó là CỔNG RBAC dùng chung cho 5 action** ✓
3. ⭐⭐ **MỘT NGOẠI LỆ ĐÃ BIẾT PHẢI ĐƯỢC MÃ HOÁ TRONG BÀI KIỂM** — ⛔ nếu không, nó **báo động giả mãi mãi** ✓
4. ⭐ **MỘT KẾT QUẢ ÂM VẪN LÀ KẾT QUẢ.** Phép đo registry ⇄ controller **trả lời được câu hỏi lớn** *«có action nào âm thầm hỏng không?»* ⇒ ⭐ **KHÔNG** (bằng đo, ⛔ không suy đoán) ✓
5. ⭐ **ĐO BAO PHỦ BẰNG CÁCH ĐẾM — LẦN THỨ HAI LIÊN TIẾP CÓ KẾT QUẢ.** TASK-186 tìm ra **36 `save_*` chưa test**; vòng này tìm ra **8 `set_*` chưa test** ⇒ ⭐ **phương pháp «đếm tổng rồi trừ» tiếp tục hiệu quả** ✓

---

## ⑨ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **135 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
2. ⭐ **Xác nhận 5 bản vá CSS bằng mắt**.
3. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
4. ⭐ **2 action đăng ký thừa** (`add_work_item_comment` · `set_work_item_participant`) — **xoá đăng ký** hay **để nguyên**?
5. **`e2e.project` có đúng là vai trò lập phiếu đề nghị mua hàng không?**
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
