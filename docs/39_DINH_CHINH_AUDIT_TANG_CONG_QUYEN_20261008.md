> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# ĐÍNH CHÍNH & MỞ RỘNG AUDIT — **TẦNG CỔNG QUYỀN** (RBAC 2 tầng)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Vẫn là **read-only** (⛔ 0 dòng mã sản phẩm)
Tài liệu này **đính chính 2 phát hiện** trong `docs/38` và **bổ sung 1 phát hiện mới (P-08)** — sau khi đọc tiếp `SystemController.java`.

---

## 0. VÌ SAO CÓ TÀI LIỆU NÀY (tự phát hiện sai của chính tôi)

Trong `docs/38` tôi kết luận **P-01**: *«`create_project`/`update_project`/`delete_project` khai module RỖNG ⇒ 403»* — hàm ý **nguyên nhân là thiếu khai báo module**.
Khi kiểm tra tiếp `SystemController.java:281-302` tôi thấy **sai tầng nguyên nhân**: 4 action đó bị **`requireRequireAdmin`** chặn cứng ở **controller** (chủ ý, không phải thiếu sót).
⇒ Theo luật của dự án (*«nguồn sự thật = mã đang chạy»*, và văn hoá **tự đính chính** đã có trong `SESSION_C`/`CURRENT_STATE`), tôi sửa lại ngay ở đây thay vì để user quyết trên số liệu sai.

---

## 1. ĐÍNH CHÍNH P-01 & P-02

| | Tôi đã viết (`docs/38`) | **SỰ THẬT ĐỌC ĐƯỢC TỪ MÃ** | Bằng chứng |
|---|---|---|---|
| **P-01** | «4 action dự án khai module **rỗng `List.of()`** ⇒ 403 cho user nghiệp vụ» (ngụ ý: **thiếu khai báo module**) | **Nguyên nhân chính là cổng controller**: `case "create_project"/"update_project"/"delete_project"` đều gọi **`requireRequireAdmin(request)`** — hàm này **chỉ cho `role == "admin"`** và ném 403 *«Tài khoản không có quyền thực hiện nghiệp vụ này.»* ⇒ **đây là chủ ý, không phải thiếu sót**. Khai báo module rỗng chỉ là **tầng thứ hai** (và nó tạo **thông điệp khác**: *«Thao tác chưa được khai báo quyền trong hệ thống»*) | `SystemController.java:281-284`, `:286-289`, `:296-302` · `requireRequireAdmin` tại `:1739-1745` |
| **P-02** | «`set_project_status` khai module `admin` ⇒ ngoại lệ Ban lãnh đạo bị loại (`RbacService:69`)» | **Cũng là cổng controller**: `case "set_project_status"` gọi **`requireRequireAdmin`** ⇒ **chỉ `admin`**, ⛔ **không** có ngoại lệ Giám đốc/Kế toán trưởng. ⇒ Kết luận «**Giám đốc không đóng/mở được dự án**» **VẪN ĐÚNG**, nhưng **lý do là cổng controller**, ⛔ không phải nhánh `RbacService:69` | `SystemController.java:291-294` + `:1739-1745` |
| **P-03** | «`update_project` capability `canUse` không nhất quán» | **Vẫn đúng về khai báo**, nhưng **vô hiệu trên thực tế** vì `requireRequireAdmin` chặn trước ⇒ đây là **nợ nhất quán**, ⛔ không phải nguyên nhân 403 | `ActionRbacRegistry.java:553` · `SystemController.java:286-289` |

**Hệ quả quan trọng cho quyết định của user:** câu hỏi đúng **KHÔNG** phải *«khai module nào cho create_project?»* mà là:
> **«Có muốn quản lý dự án (tạo/sửa/xoá/đóng) CHỈ dành cho tài khoản `admin` hay không?»**
> · **CÓ** ⇒ giữ nguyên, chỉ cần **cải thiện thông điệp/UX (FE)** để người dùng không tưởng hệ thống hỏng.
> · **KHÔNG** ⇒ phải sửa **CẢ 2 TẦNG** (BE): thay `requireRequireAdmin` bằng cổng module trong controller **và** khai module thật trong `ActionRbacRegistry`.

---

## 2. BẢN ĐỒ **2 TẦNG CỔNG QUYỀN** (điều `docs/38` chưa nói rõ)

Thứ tự thực thi thực tế **[ĐỌC MÃ]**:

```text
POST /api/system {action, …}
   ↓
① SystemController:224-225  →  rbacService.requireActionModule(user, action)     ← TẦNG 1 (registry)
   │     • PUBLIC_ACTIONS (10 action)      ⇒ cho qua
   │     • role == "admin"                 ⇒ cho qua
   │     • director/accountant VÀ registry KHÔNG chứa "admin" ⇒ cho qua
   │     • registry RỖNG (List.of())       ⇒ 403 «Thao tác chưa được khai báo quyền trong hệ thống.»
   │     • còn lại                          ⇒ kiểm module×capability ⇒ 403 «Tài khoản chưa được … cấp đúng quyền…»
   ↓
② switch(action) trong SystemController
   │     • requireRequireAdmin(request)     ← TẦNG 2a: CHỈ role=="admin"  ⇒ 403 «Tài khoản không có quyền thực hiện nghiệp vụ này.»
   │     • requireCurrentUser(request)      ← TẦNG 2b: chỉ cần đã đăng nhập (dùng cho khối nghiệp vụ)
   ↓
③ Use case (RequestManagementUseCase / PurchaseManagementUseCase / …) — có guard riêng ở một số luồng
```

**⇒ Bài học (đã trả giá bằng chính báo cáo của tôi):** ⛔ **KHÔNG kết luận nguyên nhân 403 chỉ từ `ActionRbacRegistry`** — phải kiểm **đồng thời**: ① `ActionRbacRegistry` · ② `requireRequireAdmin`/`requireCurrentUser` tại `case` tương ứng · ③ `PUBLIC_ACTIONS` · ④ guard trong use case.
(Hai tầng có **thông điệp lỗi KHÁC NHAU** — dùng chính thông điệp để **phân biệt tầng nào đã chặn**, rất hữu ích khi điều tra.)

---

## 3. SỐ LIỆU KIỂM CHỨNG ĐƯỢC BẰNG MÃ (chính xác, có thể tái lập)

| Chỉ số | Giá trị | Cách đo |
|---|---|---|
| Action khai module **rỗng** `List.of()` | **65** | grep `Map\.entry\("[a-z_0-9]+", List\.of\(\)\)` trên `ActionRbacRegistry.java` → 65 dòng (`:58`…`:302`) — **khớp** con số `CHECKLIST` từng đo ở MỐC 110 |
| Action **công khai** (PUBLIC_ACTIONS) | **10** | `RbacService.java:43-58`: `login` · `setup` · `logout` · `change_password` · `update_profile_avatar` · `update_profile_signature` · `mark_notification_read` · `mark_notification_snooze` · `mark_notification_all_read` · `save_error_report` |
| Call site **`requireRequireAdmin`** (chỉ `admin`) | **45** | grep `SystemController.java` → 43 trong khối `:267-525` + `:1445` + `:1464` (+ định nghĩa `:1739`) |
| ⇒ Số **mồ côi thật** | ⚠️ **CHƯA ĐO ĐƯỢC** | cần script đối chiếu 3 tập (65 rỗng − 10 public − N admin-gate). `CHECKLIST` **từng** ghi **19** (18 + `save_error_report`) ở 30/09/2026 — **mã đã đổi nhiều từ đó ⇒ PHẢI đo lại**, ⛔ không dùng lại số cũ |

---

## 4. 🆕 **P-08 — NHÓM MỒ CÔI THẬT (nghi vấn CAO, cần phép thử)**: DANH MỤC VẬT TƯ · TỔ ĐỘI · LỊCH TRÌNH DUYỆT

Khối `SystemController:893-1040` dùng **`requireCurrentUser`** (⛔ **KHÔNG** `requireRequireAdmin`) — xác minh tại `:896`, `:901`, `:911`, `:916`, `:921`, `:931`… Mà registry của nhiều action trong khối này khai **`List.of()`**:

| Nhóm | Action khai rỗng | Registry | Hệ quả suy ra từ mã |
|---|---|---|---|
| **Danh mục vật tư** (nghiệp vụ, ⛔ không phải cấu hình) | `save_material_category` (`:216`) · `save_material_subcategory` (`:219`) · `set_material_category_status` (`:271`) · `set_material_subcategory_status` (`:274`) · `delete_material_category` (`:129`) · `delete_material_subcategory` (`:131`) · `import_material_catalog` (`:157`) | `ActionRbacRegistry` | **403 «Thao tác chưa được khai báo quyền trong hệ thống»** cho **mọi tài khoản không phải admin** ⇒ nếu Phòng Kế hoạch phải bảo trì danh mục vật tư ⇒ **không làm được** |
| **Tổ đội dự án** | `set_project_team_status` (`:283`) · `delete_project_team` (`:137`) | nt | nt |
| **Lịch trình duyệt (workflow)** | `save_approval_stage` (`:189`) · `set_approval_stage_status` (`:263`) · `delete_approval_stage` (`:109`) | nt | nt — ⚠️ **liên quan trực tiếp GĐ A2** của `docs/37` (cấu hình 5 bậc duyệt) |

> ⚠️ **Cách ghi trung thực**: đây là **suy luận từ mã** (đúng đường dẫn + đúng thứ tự cổng), **chưa có phép thử runtime** vì shell hỏng. ⛔ **Không** ghi `FIXED`/`CONFIRMED`.
> ⛔ **Cũng chưa loại trừ** khả năng **use case tự guard** (ví dụ `asMaterialCatalogPrincipal(cu)` + guard trong `MaterialCatalogManagementUseCase`) ⇒ **phép thử ở §5 là bắt buộc** trước khi sửa.

---

## 5. PHÉP THỬ BẮT BUỘC (chạy ngay khi shell hồi phục — ⛔ chưa chạy được)

```text
A. Nền:  npx tsc --noEmit  ·  npm run test:regression   (mốc kỳ vọng 865 · 864 · 0 · 1)
B. Nhóm mồ côi (P-08) — dùng tài khoản KHÔNG phải admin (vd `nvkhdemo`), qua proxy :9000:
   ① save_material_category        → kỳ vọng hiện tại 403 «chưa được khai báo quyền»
   ② import_material_catalog       → nt
   ③ save_approval_stage           → nt
   ④ set_project_team_status       → nt
   + ĐỐI CHỨNG ÂM: cùng action với `admin` ⇒ 200 · và 1 action module đã khai đúng (vd `create_request` với user đủ quyền) ⇒ 200
C. Dự án (P-01/P-02 đã đính chính) — xác định THÔNG ĐIỆP để biết tầng nào chặn:
   ⑤ create_project   (user thường) → nếu là «Tài khoản không có quyền thực hiện nghiệp vụ này.» ⇒ **tầng 2a (requireRequireAdmin)**; nếu là «chưa được khai báo quyền» ⇒ **tầng 1 (registry)**
   ⑥ set_project_status (director)  → kỳ vọng 403 tầng 2a (đính chính P-02)
D. UI: mở `app/page.tsx` tìm nút «＋ THÊM DỰ ÁN» (`:2825`) ⇒ xác nhận nút hiện cho user thường hay đã bị chặn ở FE
```

---

## 6. ẢNH HƯỞNG TỚI **5 CÂU HỎI** Ở `docs/38 §7` (phải hỏi lại cho đúng bản chất)

| Câu | Bản cũ (chưa chính xác) | **Bản ĐÍNH CHÍNH** |
|---|---|---|
| 1 | «Ai được tạo/sửa/xoá dự án? đề xuất: tạo/sửa → module `site_command`…» | **«Dự án có tiếp tục CHỈ `admin` được tạo/sửa/xoá không?»** · CÓ ⇒ chỉ cần cải thiện UX/thông điệp (FE) · KHÔNG ⇒ sửa **2 tầng** (BE) |
| 2 | «Ai được đóng/mở dự án? đề xuất `site_command canEdit`» | **«Ai được đóng/mở dự án?»** — hiện **chỉ `admin`** vì `requireRequireAdmin` (`:291-294`) ⇒ muốn Giám đốc làm được thì **phải sửa controller**, ⛔ không chỉ sửa registry |
| 3–5 | (không đổi) | giữ nguyên |

---

## 7. BÀI HỌC GHI VÀO SỔ (để phiên sau không lặp)

> **Đ-04-01** — **Một quyền bị chặn có thể do 2–3 tầng; thông điệp lỗi là dấu vân tay của tầng.** Trước khi kết luận "thiếu khai báo quyền", phải đọc **`case` tương ứng trong `SystemController`** xem có `requireRequireAdmin` không.
> **Đ-04-02** — **`List.of()` ở registry không phải nguyên nhân duy nhất**; nó chỉ là tầng 1. Action có thể chết ở tầng 2 dù registry đã khai đúng, hoặc ngược lại.
> **Đ-04-03** — **Số liệu trong tài liệu cũ (19 action mồ côi @30/09) không được tái sử dụng** khi mã đã đổi; phải **đo lại** (65 rỗng hôm nay ≠ 65 rỗng hôm 30/09).
