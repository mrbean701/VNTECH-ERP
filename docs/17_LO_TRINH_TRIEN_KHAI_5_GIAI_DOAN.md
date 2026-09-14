# 17 — LỘ TRÌNH TRIỂN KHAI 5 GIAI ĐOẠN (TUẦN TỰ)

Ngày lập: 14/09/2026 · Người lập: Agent phát triển · Trạng thái: **SẴN SÀNG THỰC THI**

> Kế hoạch **tuần tự** để chuyển từ "demo chạy được" → "vận hành được".
> Căn cứ: `docs/15` (phân tích chức năng + lỗi nghiêm trọng), `docs/16` (tái cấu trúc menu + lỗi UI), `docs/14` (cutover).
> **Mọi số liệu đều đã kiểm chứng trên hệ thống thật** bằng script tái lập được (mục 8).

---

## 0. VÌ SAO PHẢI TUẦN TỰ

5 giai đoạn có **phụ thuộc kỹ thuật thật**, không thể làm song song:

```
GĐ1 (nền tảng tin cậy)
  ├─ Sửa 4 lỗi nghiêm trọng + bootstrap thiếu 29 trường
  ├─ Sinh V3 reference seed  ← module_catalog phải có dữ liệu
  └─ Sửa phân quyền dự án/module
        ↓ (menu cần module_catalog có dữ liệu)
GĐ2 (tái cấu trúc menu 7→11 mục)
        ↓ (menu mới cần phân quyền đúng)
GĐ3 (phân quyền sâu + bỏ dropdown + UX)
        ↓ (cần nền dữ liệu công việc)
GĐ4 (quản lý công việc + hiệu suất)
        ↓
GĐ5 (module Tài chính & MEP mở rộng)
```

> ⚠️ **Chốt chặn quan trọng**: nếu bỏ qua GĐ1, GĐ2 chỉ là "ẩn/hiện menu" chứ **không chặn được truy cập thật** — vì (a) `requireActionModule()` đang **0 lời gọi**, (b) `module_catalog` **rỗng**.

---

## GIAI ĐOẠN 1 — NỀN TẢNG TIN CẬY 🔴 *(2–3 tuần)*

**Mục tiêu**: hệ thống dùng được **nhiều người** và **không rò rỉ quyền**. Đây là điều kiện tiên quyết cho mọi giai đoạn sau.

| # | Công việc | Kết quả đo được | Ước lượng |
|---|---|---|---|
| **1.1** | **Nối lại phân quyền module** — gọi `requireActionModule(user, action)` trong `SystemController.post()` trước dispatch | 4/5 action rò rỉ → **0** | 1–2 ngày |
| **1.2** | **Test phân quyền**: role `engineer` phải **403** ở `save_material`/`save_supplier`/`save_approval_stage` | Test hồi quy cho lỗ hổng nghiêm trọng nhất | 1 ngày |
| **1.3** | **Lọc dự án theo quyền** — port `visibleProjects` + `projectAccessAll` (JS `system-route.mjs:549`) | User gán 0 dự án → thấy **0** dự án | 1 ngày |
| **1.4** | **Sinh `V3__reference_seed.sql`** từ `drizzle/` (25 bảng: module_catalog 61, menu_group_catalog 12, organization_units 7, business_scope, danh mục vật tư, form_field_config, task_sla_policies…) | `create_user` **thành công**; menu có dữ liệu phân quyền | 3–4 ngày |
| **1.5** | **Bù 29 trường bootstrap thiếu** — trọng tâm `allModulePermissions`, `approvalStages` (+ đổi tên cho khớp UI) | Tab 4 & 6 hết lỗi; hết lỗi trắng trang tiềm ẩn | 2 ngày |
| **1.6** | **Sửa tràn tên dự án dài** (ellipsis + `title`) | Đọc được tên, không chồng chéo | 0,5 ngày |
| **1.7** | **Ghi audit log** cho mọi action ghi (hiện `audit_logs` = 0) | Truy vết được ai đổi gì | 1 ngày |
| **1.8** | **Port email** (`EmailDispatcher` + `@Scheduled` worker) | Email phê duyệt/SLA gửi được | 1–2 ngày |
| **1.9** | **Đồng bộ schema test H2 ↔ MySQL** (FK, index, kiểu) | Test H2 phát hiện được lỗi như MySQL | 1 ngày |
| **1.10** | Smoke **P0**: kho nâng cao (transfer/central return/stocktake/reconcile) + tài chính (~29 action) | Độ phủ 18 → **~47/174 (27%)** | 3–5 ngày |

**Gate nghiệm thu GĐ1**:
- [ ] `probe-rbac-gap.mjs` → 0/5 action rò rỉ
- [ ] `probe-project-visibility.mjs` → user không gán dự án **không** thấy dự án
- [ ] `probe-nonadmin-access.mjs` → `create_user` **thành công** (200)
- [ ] `probe-admintab-bugs.mjs` → **7/7 tab không lỗi**
- [ ] `mvn clean package` → test xanh, có test phân quyền mới
- [ ] smoke-core 18/18 + smoke-supply 28/28 không hồi quy

---

## GIAI ĐOẠN 2 — TÁI CẤU TRÚC MENU 🟠 *(1–2 tuần)*

**Mục tiêu**: từ 7 mục → **11 mục** theo đúng yêu cầu; tách "Quản lý phòng ban" đang gom **28/37 màn hình**.

| # | Công việc | Kết quả |
|---|---|---|
| **2.1** | Tạo nhóm menu mới: **Công việc**, **MEP**, **Tài chính – Kế toán**, **Hành chính – Pháp chế**, **Báo cáo** | 11 nhóm menu |
| **2.2** | Di chuyển 37 màn hình vào đúng nhóm (**giữ nguyên `screen key`**) | Không phá phân quyền |
| **2.3** | Đưa nhóm mới vào `menu_group_catalog` + `module_catalog` (V3 seed từ 1.4) | Menu phân quyền được |
| **2.4** | Ẩn/hiện menu theo `modulePermissions` của user | Mỗi vai trò thấy đúng menu |
| **2.5** | **MEP**: tách `boq` → **BOQ & Bóc tách**; tạo khung **Showdrawing & trình duyệt** | 2 mục MEP |
| **2.6** | **Hành chính – Pháp chế**: đơn từ/giấy tờ tách theo nghiệp vụ (nhân sự/HĐLĐ/công văn/văn bản/con dấu/bảo hiểm) | 6 mục riêng |

**Cấu trúc đích**:
```
1. TỔNG QUAN ĐIỀU HÀNH
2. CÔNG VIỆC CỦA TÔI        ★ MỚI
3. QUẢN LÝ DỰ ÁN           ★ SỬA
4. MEP                     ★ MỚI  (Showdrawing | BOQ & Bóc tách)
5. MUA HÀNG
6. KHO VẬT TƯ
7. DANH MỤC VẬT TƯ GỐC
8. TÀI CHÍNH – KẾ TOÁN     ★ MỚI
9. HÀNH CHÍNH – PHÁP CHẾ    ★ MỚI
10. BÁO CÁO                ★ MỚI
11. QUẢN TRỊ HỆ THỐNG
```

**Gate nghiệm thu GĐ2**: UI hiển thị 11 nhóm; mỗi vai trò chỉ thấy nhóm được cấp; 37 màn hình truy cập được; `ActionRbacRegistry` không hồi quy.

---

## GIAI ĐOẠN 3 — PHÂN QUYỀN SÂU & UX 🟠 *(3–5 ngày)*

| # | Công việc | Kết quả |
|---|---|---|
| **3.1** | **Bỏ dropdown dự án** ở menu Quản lý dự án — chỉ hiển thị trong bảng | Đúng yêu cầu |
| **3.2** | **Phân quyền menu theo level** hoàn chỉnh: admin xem tất cả · user chỉ dự án được giao | Đã có nền ở 1.3 |
| **3.3** | Cảnh báo khi user không có dự án nào (UX rõ ràng thay vì trang trống) | Giảm nhầm lẫn |
| **3.4** | Sửa các chỗ còn dùng tên trường sai (`approvalStages` vs `approvalStageCatalog`) | Nhất quán dữ liệu |
| **3.5** | Kiểm tra 37 màn hình không còn lỗi `undefined` (rà theo 29 trường đã bù) | Không lỗi trắng trang |

---

## GIAI ĐOẠN 4 — QUẢN LÝ CÔNG VIỆC & HIỆU SUẤT 🟡 *(2–3 tuần)*

**Mục tiêu**: "Nhiệm vụ nhân viên đang làm" thành **task/to-do list** thật.

| # | Công việc | Ghi chú |
|---|---|---|
| **4.1** | Tạo màn **"Công việc của tôi"** — việc tôi nhận / việc tôi giao | Dùng `work_items` đã có |
| **4.2** | **Kanban + danh sách** theo trạng thái, tiến độ | `progress` đã có |
| **4.3** | **Giao việc**: nhiều người, hạn, mức ưu tiên, mô tả | Mở rộng `create_work_item` |
| **4.4** | **Theo dõi tiến độ** + lịch sử thay đổi | Dùng `work_item_events` |
| **4.5** | **Bảng hiệu suất** ⚠️ **CHƯA CÓ** — việc xong/trễ/tồn theo người & kỳ | Cần làm mới |
| **4.6** | Thông báo trong ứng dụng + email | Phụ thuộc 1.8 |

---

## GIAI ĐOẠN 5 — MODULE TÀI CHÍNH & MEP MỞ RỘNG 🟡 *(3–4 tuần)*

| # | Công việc |
|---|---|
| **5.1** | **Tài chính – Kế toán**: báo cáo công nợ, dòng tiền, đối chiếu ngân hàng |
| **5.2** | **MEP – Showdrawing**: quản lý bản vẽ, phiên bản, trình duyệt (⚠️ cần thiết kế entity mới) |
| **5.3** | **BOQ & Bóc tách** nâng cao: bóc tách tự động, so khớp, lịch sử thay đổi |
| **5.4** | **Báo cáo** tổng hợp: tồn kho theo thời điểm, tiến độ, chi phí |
| **5.5** | Xuất Excel/PDF **phía server** (thay vì client) |

---

## 5. TỔNG THỜI GIAN

| Giai đoạn | Thời gian | Lũy kế |
|---|---|---|
| GĐ1 Nền tảng tin cậy | 2–3 tuần | 3 tuần |
| GĐ2 Tái cấu trúc menu | 1–2 tuần | 5 tuần |
| GĐ3 Phân quyền sâu & UX | 3–5 ngày | 5,5 tuần |
| GĐ4 Quản lý công việc | 2–3 tuần | 8 tuần |
| GĐ5 Tài chính & MEP | 3–4 tuần | **~12 tuần** |

---

## 6. RỦI RO & GIẢM THIỂU

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| 1 | Bù 29 trường bootstrap có thể lộ lỗi khác | Cao | Làm từng nhóm, test bootstrap sau mỗi nhóm |
| 2 | Đổi menu phá phân quyền đã cấp | Cao | **Giữ nguyên `screen key`**; chỉ đổi nhóm hiển thị |
| 3 | V3 seed sai thứ tự migration | Cao | Tôn trọng thứ tự `drizzle/`; `ON DUPLICATE KEY UPDATE` cho bản ghi sau ghi đè |
| 4 | Nối `requireActionModule` chặn nhầm user hợp lệ | Cao | Test trên **cả** admin và non-admin trước khi bật |
| 5 | Không có dữ liệu thật để kiểm chứng | Trung bình | Nhập 1 dự án mẫu đầy đủ ở GĐ3 |
| 6 | Sửa UI phá fingerprint | Trung bình | Mọi thay đổi UI phải qua `refresh-phase-identity` + regenerate manifest |

---

## 7. ĐỊNH NGHĨA "XONG" (Definition of Done)

Một giai đoạn chỉ được coi là **XONG** khi:
1. ✅ Build xanh: `mvn -s settings-dev.xml clean package` — tất cả test pass
2. ✅ Smoke không hồi quy: core **18/18** + supply **28/28**
3. ✅ Gate toàn vẹn: `verify-vntech-fingerprint` **ĐẠT** + `master-baseline-gate` **ĐẠT**
4. ✅ Probe tương ứng của giai đoạn pass (xem gate từng giai đoạn)
5. ✅ Tài liệu cập nhật (`docs/15`, `docs/16` hoặc doc mới)
6. ✅ Commit theo số thứ tự, tóm tắt ngắn gọn

---

## 8. LỆNH TÁI LẬP & GATE

```powershell
# --- Chuẩn bị ---
node tools/fix-login.mjs admin "Vntech@2026"          # đảm bảo đăng nhập

# --- Gate GĐ1 ---
node tools/probe-rbac-gap.mjs                          # 0/5 rò rỉ
node tools/probe-project-visibility.mjs                # user 0 dự án → 0 dự án
node tools/probe-nonadmin-access.mjs                   # create_user 200
node tools/probe-admintab-bugs.mjs http://127.0.0.1:9000   # 7/7 tab OK
node tools/measure-seed-gap.mjs                        # 25 bảng = 25 bảng

# --- Gate chung mọi giai đoạn ---
cd java-backend; mvn -s settings-dev.xml -o clean package
cd ..; node java-backend/contract-tests/smoke-core-chain.mjs
node java-backend/contract-tests/smoke-supply-chain.mjs
node scripts/verify-vntech-fingerprint.mjs
node scripts/master-baseline-gate.mjs
```

---

## 9. TRẠNG THÁI CÔNG VIỆC HIỆN TẠI

| Hạng mục | Trạng thái |
|---|---|
| GĐ1 (1.1–1.10) | ⏳ **CHƯA BẮT ĐẦU** |
| GĐ2 (2.1–2.6) | ⏳ CHƯA BẮT ĐẦU |
| GĐ3 (3.1–3.5) | ⏳ CHƯA BẮT ĐẦU |
| GĐ4 (4.1–4.6) | ⏳ CHƯA BẮT ĐẦU |
| GĐ5 (5.1–5.5) | ⏳ CHƯA BẮT ĐẦU |
| Lỗi đã **chẩn đoán** (đủ căn cứ sửa) | ✅ 15 bug (docs/13 §1.4, docs/15 §2, docs/16 §2) |
| Lỗi đã **sửa** | ✅ 13 bug (xem `docs/13` §1.4) |
| Lỗi **còn tồn** (GĐ1 sẽ sửa) | 🔴 4: phân quyền module vô hiệu · thiếu seed 23 bảng · thiếu 29 trường bootstrap · lộ dự án |

**Người quyết định**: cần bạn xác nhận bắt đầu GĐ1.
