> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# XÁC MINH LẠI CÁC PHÁT HIỆN `docs/38` — KẾT QUẢ

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · **read-only** (⛔ 0 dòng mã sản phẩm)
Mục đích: sau khi tự phát hiện **1 kết luận sai** (`docs/39`), **xác minh lại TỪNG phát hiện chưa có bằng chứng mã** trước khi user giao việc — ⛔ để không tái diễn việc nêu sai.

> ⚠️ **Trạng thái shell**: vẫn **HỎNG** (`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope`) ⇒ ⛔ **không chạy được** `tsc`/test/UI. Mọi kết quả dưới đây là **[ĐỌC MÃ]**, ⛔ không phải phép thử runtime.

---

## 1. BẢNG KẾT QUẢ XÁC MINH

| Mã | Phát hiện trong `docs/38` | **Kết quả** | Bằng chứng (đọc mã) |
|---|---|---|---|
| **P-01** | «CRUD dự án 403 vì khai module rỗng» | ❌ **BÁC** (đã đính chính ở `docs/39`: nguyên nhân là `requireRequireAdmin`). ✅ **XÁC MINH THÊM TẦNG FE**: UI CRUD dự án nằm trong **AdminApp step 8**, và module `admin` yêu cầu `isAdminUser` ⇒ **user thường ⛔ không có đường vào** | `page.tsx:2825` (nút «＋ THÊM DỰ ÁN» / «Sửa» / «Đóng» / Excel) · `page.tsx:625` (`accessDenied = active!=="admin" ? (permissionConfigured && !canView) : !isAdminUser(user)`) |
| **P-02** | «director không đóng/mở được dự án» | ✅ **XÁC MINH** (tầng đã sửa ở `docs/39`) | `SystemController.java:291-294` + `:1739-1745` |
| **P-03** | «`update_project` capability `canUse` không nhất quán» | ✅ **XÁC MINH** (đúng khai báo, nhưng **vô hiệu trên thực tế**) | `ActionRbacRegistry.java:553` |
| **P-04** | 4 tệp màn mồ côi | ➖ **Không tự đo lại trong phiên này** (kế thừa `HANDOFF-20261007-C15`, phiên 03 đã đo lại ở vòng 42) ⇒ **giữ nguyên mức**, ⛔ không tự nhận là «đã xác minh» | `SESSION_C/HANDOFF_LOG.md:262-274`, `:300-301` |
| **P-05** | «FE còn in ngày ISO thô của dự án» | ✅ **XÁC MINH CHÍNH XÁC — đúng 2 chỗ**, cùng một bảng: cột «NGÀY BẮT ĐẦU» `{row.startDate||"—"}` và «NGÀY KẾT THÚC» `{row.endDate||"—"}` | `page.tsx:1024` (module `project_progress`, `ProjectProgress`) |
| **P-07** | Cần **đo UI** mục «Quản lý dự án» | ⏳ **Vẫn chờ** (shell hỏng) | `lib/menu-helpers.ts:74` · `page.tsx:740` |
| **J-01** | «2 mục Phòng ban/Giao việc dùng chung `active` key ⇒ có thể highlight đôi» | ⚠️ **CƠ CHẾ ĐÃ RÕ — HIỆU ỨNG CHƯA XÁC MINH**: `activateModule(next, view)` đặt **`workView` = view** rồi **`setActive(next)`**; `work_department` và `work_assign` cùng `moduleKey = "dept_plan_assign"` ⇒ **chung `active`**, khác `view` ⇒ **màn đích vẫn ĐÚNG** (`workCenterViewFor` tách đúng nhánh). Nhưng **highlight menu thế nào thì ⛔ chưa đo được** ⇒ ⛔ **không kết luận là lỗi** | `page.tsx:598-609` · `:653` · `:447-457` · `lib/menu-helpers.ts:130-131` · `:502` (`moduleKey: viewable ?? item.permissionKeys[0]`) |
| **J-02** | «22 màn phòng ban chỉ có **1 form** ⇒ mỏng» | ⚠️ **ĐÍNH CHÍNH NHẸ**: ⛔ **không phải «chỉ 1 form»** — thực tế = **1 form «Giao việc bổ sung»** (chỉ render khi `assignmentMode`) **+ 1 bảng nhiệm vụ có 3 tab lọc** (Tất cả / Tự động từ nghiệp vụ / Giao việc bổ sung). ⇒ **vẫn mỏng** (không phải màn nghiệp vụ đầy đủ) nhưng ⛔ **không phải màn rỗng** | `page.tsx:759-774` |
| **J-03** | Trùng lối vào KPI | ✅ giữ (đã có bằng chứng menu) | `lib/menu-helpers.ts:237-238` · `page.tsx:454` |
| **X-01** | Git local/remote lệch · nhiều tệp chưa commit | ✅ giữ | `docs/dsh-state/SESSION_REGISTRY.md` §699-725 |
| **X-02** | 4 cổng probe đo lệch | ✅ giữ | `SHARED_STATE` §33/§34/§40 |

---

## 2. HỆ QUẢ: SỬA LẠI **DANH SÁCH VIỆC SẴN SÀNG GIAO** (`docs/38` §5)

| # | Trạng thái mới | Việc | Ghi chú |
|---|---|---|---|
| ~~**T-03**~~ | ⛔ **RÚT LẠI (WITHDRAWN)** | «disable + tooltip nút CRUD dự án» | ✅ **Không cần**: user thường **⛔ không vào được** màn Admin (menu `system_admin` ẩn theo MỐC 118 + cổng `accessDenied` `page.tsx:625`) ⇒ **không có đường nào để họ bấm ra 403**. ⇒ Phần còn lại của **P-01 là QUYẾT ĐỊNH NGHIỆP VỤ**, ⛔ không phải việc FE |
| **T-02** | ✅ **GIỮ — đã có toạ độ chính xác** | Vá 2 chỗ ngày ISO thô | `page.tsx:1024`: `{row.startDate||"—"}` → `{row.startDate?date(row.startDate):"—"}` · tương tự `row.endDate`. ⚠️ tệp **LOCK S01** |
| **T-04** | ⚠️ **HẠ MỨC → chỉ đo trước** | «cấp `active` key riêng cho 2 mục Công việc» | J-01 **hiệu ứng chưa xác minh** ⇒ **đo UI trước**; ⛔ nếu không tái hiện được thì **không sửa** (luật: ⛔ không sửa thứ đang đúng) |
| **T-05** | ✅ **GIỮ** | BE: quyết định + khai module cho CRUD dự án / `set_project_status` | Chỉ sau khi user trả lời **câu 1–2 (bản chất mới)**; phải sửa **cả cổng controller** nếu muốn mở cho Phòng Dự án |
| **T-09** | 🆕 **MỚI — ưu tiên cao nhất còn lại** | **P-08**: xác minh bằng 4 phép thử rồi vá **danh mục vật tư (7 action)** + tổ đội (2) + lịch trình duyệt (3) | Ảnh hưởng trực tiếp go-live (bảo trì vật tư + cấu hình 5 bậc duyệt). Tệp `ActionRbacRegistry.java` — **LOCK S01** |
| **T-01, T-02, T-06, T-07, T-08** | giữ nguyên | đo UI · ngày ISO · 4 tệp mồ côi · ẩn màn mỏng · hợp nhất commit | |

---

## 3. VIỆC KẾ TIẾP **KHÔNG BỊ CHẶN** (đang làm được ngay)

1. ✅ **Rà tiếp các tầng cổng quyền** cho **vùng mua hàng lõi** (`requests` → `decide_approval` → `create_po` → `receive_goods`): xác minh **action nào chỉ admin**, action nào theo module — vì đây là **chuỗi go-live chính** và hiện **chưa được soi ở tầng controller** (mới soi tầng registry).
2. ✅ **Đối chiếu `docs/37` §2** (12 chức năng «sẵn sàng go-live») với tầng cổng quyền — vì một chức năng có thể **đủ mã nhưng bị chặn quyền**, đúng loại lỗi vừa phát hiện.
3. ⏳ Chờ user: sửa profile DSH ⇒ chạy 4 phép thử `docs/39` §5 ⇒ chuyển P-08 từ «nghi vấn» sang «đo được».

---

## 4. BÀI HỌC BỔ SUNG

> **Đ-04-04** — **«UI có nút» ≠ «user bấm được»**: phải kiểm **cả 2 tầng FE** (menu có hiện không · màn có bị `accessDenied` không) **và BE**. Ở đây FE **và** BE **cùng chặn** ⇒ kết luận «user thường bị 403 khi tạo dự án» là **SAI một cách vô hại** (không có đường bấm).
> **Đ-04-05** — **Đừng kế thừa mô tả từ tài liệu cũ** (J-02 «chỉ 1 form» đến từ `docs/09`); phải đếm trong mã (`page.tsx:759-774` = 1 form + 1 bảng 3 tab).
> **Đ-04-06** — **Xác minh lại phát hiện của chính mình là một bước bắt buộc**, không phải việc thừa: 2 vòng vừa qua đã **bác 1 phát hiện, đính chính 2, rút 1 việc** — nếu user đã giao việc trước thì cả 3 đều là **việc giả**.

---

## 5. 🆕 SOI **TẦNG CỔNG QUYỀN CỦA CHUỖI MUA HÀNG LÕI** (`TASK-20261008-D05`) — ✅ **SẠCH, KHÔNG CÓ VẤN ĐỀ QUYỀN**

> Đây là vùng **chưa từng được kiểm ở tầng controller** (các vòng trước mới soi tầng registry). Đã đọc trực tiếp `SystemController.java:1120-1199`.

| Action chuỗi lõi | Tầng ① (registry) | Tầng ② (controller) | Kết luận |
|---|---|---|---|
| `create_request` (`:1122`) | `requests` · `canCreate` | `requireCurrentUser` | ✅ nghiệp vụ |
| `decide_approval` (`:1130`) | `approvals` · `canApprove` | `requireCurrentUser` | ✅ nghiệp vụ |
| `request_supplement` (`:1141`) | (theo registry) | `requireCurrentUser` | ✅ ⭐ **có ghi chú thiết kế ngay trong mã**: *«⛔ KHÔNG hard-code quyền ở đây: cổng quyền nằm ở `ActionRbacRegistry` + `canApproveRequestStage`»* (`:1138-1140`) |
| `create_po` (`:1149`) | `purchasing` · `canCreate` | `requireCurrentUser` | ✅ nghiệp vụ |
| `update_po_price` (`:1156`) · `approve_po` (`:1161`) · `reject_po` (`:1166`) · `close_po_line` (`:1170`) | `purchasing` · `canApprove` | `requireCurrentUser` | ✅ nghiệp vụ |
| `receive_goods` (`:1175`) · `confirm_delivery` (`:1182`) | `receiving` + `warehouse_receipt` | `requireCurrentUser` | ✅ nghiệp vụ |
| `return_stock` (`:1187`) · `create_transfer_order` (`:1192`) · `approve_transfer_order` (`:1197`) | `teams`/`warehouse_issue`/`inventory` | `requireCurrentUser` | ✅ nghiệp vụ |
| `issue_stock` (`:1257`) | `teams` + `warehouse_issue` | `requireCurrentUser` | ✅ nghiệp vụ |

### 5.1 Kết luận & giá trị cho go-live
1. ✅ **Chuỗi go-live chính (đề nghị → duyệt → PO → giao nhận → kho) KHÔNG bị chặn quyền sai**: cổng nằm **duy nhất ở tầng ①** với **module + capability thật** ⇒ người dùng nghiệp vụ có quyền **chạy được**.
2. ⭐ **Đây là tầng bằng chứng mới** bổ sung cho `docs/37` §2 (12 chức năng «sẵn sàng go-live») — trước đó **chưa ai soi tầng controller** cho chuỗi này.
3. ⚠️ **PHÁT HIỆN VỀ TÍNH NHẤT QUÁN**: **PROJECT CRUD là NGOẠI LỆ** — 4 action dự án bị **hard-code `requireRequireAdmin`** (`:281-302`) trong khi **toàn bộ** chuỗi mua hàng/kho dùng **module-gated**. ⇒ Hai cơ chế phân quyền **khác nhau** đang cùng tồn tại.
   → **Câu hỏi cho user**: *đây là chủ ý (dự án = tài sản cấp công ty, chỉ admin tạo) hay là sót lại?* Nếu là chủ ý ⇒ ⛔ **không cần sửa gì** và `docs/37` §2 nên ghi rõ *«quản lý dự án: admin-only (có chủ đích)»*; nếu là sót ⇒ đồng bộ về module-gated (BE).
4. ✅ **Không phát sinh việc mới trong chuỗi mua hàng** ⇒ `T-05` **chỉ còn** phạm vi: 4 action dự án (theo quyết định) + **P-08** (danh mục vật tư/tổ đội/lịch trình duyệt = `T-09`, ưu tiên cao nhất còn lại).
