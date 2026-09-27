# MT3 — MA TRẬN AUDIT GIAO DIỆN & ĐIỀU HƯỚNG (đo trực tiếp trên mã nguồn)

> Ngày đo: **26/09/2026** · Workspace: `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908`
> Nhánh làm việc: `unity-p2-full-20260920` (HEAD `151db2e`) · Working tree: **sạch** (0 tệp chưa commit)
> ⛔ **QUY TẮC MT3: KHÔNG COMMIT · KHÔNG PUSH** (đã chốt với user). Tệp này chỉ ghi ra đĩa.
> Nền tảng: MT2 đã chốt **79/81 = 97,5 %** · 0 lỗi sản phẩm · contract 579 (578 pass) · regression 69/69 · tsc 0 · Java 134 test 0 lỗi.

---

## A. HẠ TẦNG DÙNG CHUNG (đo bằng máy)

| Hạng mục | Số đo | Kết luận |
|---|---|---|
| Thành phần toolbar dùng chung `ListToolbar` | **56** chỗ dùng | ✅ đã có sẵn |
| `row-actions` (nhóm nút rải rác) | **64** chỗ | ⛔ nhiều màn chưa đưa CRUD vào toolbar |
| `export-mini` (nút nhỏ rải rác) | **91** chỗ | ⛌ nhiều nút *không phải* export nhưng dùng chung class |
| `DataTable` | **60** chỗ | ✅ bảng dùng chung |
| Bảng nhãn trạng thái khai **rải rác** | **17** nơi khai `*_STATUS_LABELS` | ⛔ chưa có 1 bảng ánh xạ dùng chung (MT3 §IV.6) |
| Điểm export (xlsx/csv/Blob) | **57** chỗ / 9 tệp | ⚠️ cần lập danh sách đầy đủ + xác minh UTF-8 từng điểm |
| Khối `@media (max-width)` thật trong CSS | **110** khối | ✅ có hạ tầng |
| — mốc **768px** | 12 khối | ✅ phủ |
| — mốc **1024px** | 4 khối | ✅ phủ |
| — mốc **1440px** | 2 khối | ✅ phủ |
| — mốc **320px / 375px** | **0 khối đúng mốc** | ⛔ thiếu breakpoint nhỏ (chỉ được phủ gián tiếp bởi mốc 420/520/650) |
| Màn `.tsx` có xử lý responsive riêng | **0 / 38** | ⚠️ toàn bộ dựa vào CSS (chấp nhận được, nhưng cần probe đo thật) |
| Toggle menu | `.mobile-nav-collapse` chỉ hiện khi panel **đã mở** | ⛔ thiếu logic «tự ẩn khi đủ chỗ hiển thị» (MT3 §IV.3) |

---

## B. MA TRẬN YÊU CẦU → HIỆN TRẠNG

| # | Yêu cầu MT3 | ĐÃ CÓ | CÒN THIẾU | Bằng chứng cụ thể |
|---|---|---|---|---|
| 1 | Menu cha mở màn có tab con | ✅ XONG (27/09) — 8/8 nhóm có tab qua cơ chế dùng chung `hubTabsFor` | `WorkCenter.tsx:84` 5 tab ✅ · `TeamDirectory.tsx:60` 6 tab ✅ · `Purchasing.tsx:51` 2 tab (PR/PO) ✅ · `AllocateReturn.tsx:19` 2 tab ✅ · `ConstructionScreen.tsx` **không có tab** · `Inventory.tsx:25` chỉ `["Tồn kho","Dashboard tồn kho"]` |
| 2 | ✅ XONG (27/09) — các chuỗi còn lại đều là COMMENT ghi «đã bỏ» hoặc bộ chọn phạm vi DỰ ÁN có chủ đích trong toolbar | page.tsx (10 dòng) · TeamDirectory (5) · Requests (1) · Inventory (1) · AllocateReturn (1) | `Requests.tsx:62` còn `global-project-scope-chip`; `WorkCenter` **đã đúng** (đưa vào form/tab) |
| 3 | Toolbar CRUD ngang chuẩn | ⚠️ CẦN RÀ TỪNG TỆP (đo 27/09) — 40 màn: 14 có `ListToolbar`, 18 có `row-actions`; **8 tệp có `row-actions` mà không có `ListToolbar`** — nhưng nhiều tệp là modal/drawer ⛔ KHÔNG sửa mù, cần đọc từng tệp | `MaterialListTable.tsx:89-92` (Sửa·Hợp nhất·Ngừng trong `row-actions` cột Thao tác) · `SupplierManager.tsx:61` · `WorkCenter.tsx:368` |
| 4 | Modal thay side panel | ✅ Kho XONG (27/09) — `<aside>` chuyển vào hộp thoại | `ReceiptDrawer.tsx` (được MT3 §E nêu đích danh) · `Inventory.tsx:86` `<aside class="card inventory-transfer-panel">` |
| 5 | Trạng thái tiếng Việt | ✅ XONG (27/09) — 0 chỗ dùng mã thô; 5 file dùng `statusLabel` | — | `AllocateReturn.tsx:47,59` `StatusBadge value={String(row.status)}` · `TeamDirectory.tsx:492,504,528` · `ProjectDetailTabs.tsx:221` (`"todo"`) · `Inventory.tsx:105` · `Delivered.tsx:24` |
| 6 | Export Excel/CSV UTF-8 | ⚠️ một phần | Tổ đội · Danh mục VT · Công việc · Thi công **không có nút export** | ✅ `lib/tabular-export.ts:99` CSV có BOM `\ufeff` + `charset=utf-8` (đạt yêu cầu UTF-8 cho CSV) |
| 7 | Responsive 5 mức | ⚠️ CSS có, thiếu mốc nhỏ | Khối 320/375px | 110 khối `@media`; thiếu breakpoint ≤375px cụ thể |
| 8 | Toggle menu đúng quy tắc | ✅ XONG (27/09) — `@media (min-width:1024px)` ẩn nút thu gọn | `page.tsx:609` chỉ render nút khi panel đang mở |
| 9 | Phân quyền nút + backend | ✅ KHÔNG PHẢI KHOẢNG TRỐNG (đo 27/09) — `P08PoNavigation` render 0 nút; `Requests.tsx` KHÔNG có prop permission nhưng **⛔ 0/40 màn nào có** ⇒ backend chặn đúng: `ActionRbacRegistry:89/343` `create_request→canCreate` + `RbacService:57,70` | `TeamDirectory.tsx:251` `canEdit: false` cứng (có chú thích lý do) |
| 10 | Dự án: modal 5 tab đúng nhãn | ✅ XONG — `ProjectDetailTabs.tsx:33` = `["Thông tin dự án","Nhân sự","Tổ đội","Kho","Lịch sử"]` phải là **"Thông tin dự án"**; còn cột **"Nguồn dữ liệu"** phải bỏ | `ProjectDetailTabs.tsx:32` `PROJECT_DETAIL_SUB_TABS = ["Chung","Nhân sự","Tổ đội","Kho","Lịch sử"]` |
| 11 | Thi công | ✅ XONG — nút đã bỏ (`ConstructionScreen.tsx:51` ghi nhận); chuỗi còn lại là nghiệp vụ/comment + **"Gửi kiểm tra"** (MT3 yêu cầu BỎ) · "Thêm hạng mục" **không mở modal** · chưa có toolbar CRUD | `ConstructionScreen.tsx:38` |
| 12 | Tổ đội: tab đúng spec + Lịch sử tổng hợp | ⚠️ một phần | Thiếu Lịch sử có Search/Sort/Filter + mặc định mới nhất | `TeamDirectory.tsx:60` có 6 tab nhưng `canEdit:false`, không có nút Sửa |

---

## C. THỨ TỰ ĐỀ XUẤT (đúng §VI: GĐ1 UI → GĐ2 backend → GĐ3 database)

### GĐ1 — FRONTEND (đề xuất bắt đầu từ B)
| Task | Nội dung | Vì sao chọn | Phụ thuộc |
|---|---|---|---|
| **MT3-F1** | **Trung tâm phê duyệt §B**: tiến trình chỉ 4 trường (trạng thái · người · phòng ban · thời gian), bỏ bình luận khỏi tiến trình · đồng bộ 3 vùng · nút "Yêu cầu bổ sung" (UI, validate rỗng) | vừa sửa xong, có cổng đo DOM sẵn; **không cần DB** | — |
| MT3-F2 | Bỏ "Chọn dự án" ở 5 nơi (chuyển vào toolbar) | yêu cầu rõ, đo được | F1 |
| MT3-F3 | Chuẩn hóa toolbar CRUD (ưu tiên CRUD, search, sort, filter, export) | `ListToolbar` đã có sẵn, chỉ cần gom nút | F1 |
| MT3-F4 | Modal thay side panel (Đơn hàng đã giao · Kho) | MT3 nêu đích danh | F1 |
| MT3-F5 | 1 bảng ánh xạ trạng thái dùng chung (dọn 5 nơi rò mã thô) | MT3 §IV.6 | F1 |
| MT3-F6 | Breakpoint 320/375px + toggle menu tự ẩn | MT3 §IV.2/§IV.3 | F1 |
| MT3-F7 | Dự án: đổi nhãn tab + bỏ cột "Nguồn dữ liệu" | nhỏ, đo được | F1 |
| MT3-F8 | Thi công: bỏ 2 nút, modal hạng mục, toolbar CRUD | MT2 §D đã làm phần lớn | F1 |

### GĐ2 — BACKEND (chỉ sau khi UI chốt hợp đồng)
- Action "Yêu cầu bổ sung" (lưu người yêu cầu · thời gian · nội dung · audit · notification)
- SLA +72h tự động từ chối (idempotent, xử lý xung đột phiếu vừa duyệt)
- Phạm vi tab Phòng ban (kết hợp `department` + `level`, backend kiểm soát)
- Tìm kiếm vật tư theo tên chính/alias (chuẩn hoá dấu · hoa/thường · khoảng trắng)
- Tổng hợp lịch sử tổ đội (⛔ không nhân dòng bằng join)

### GĐ3 — DATABASE (cuối cùng)
- Alias vật tư · notification recipient/scope · approval supplemental request · trường audit SLA
- Yêu cầu bắt buộc: `utf8mb4` + `utf8mb4_unicode_ci`; nếu cột dùng trong test H2 thì khai ở **JPA entity + CẢ HAI** `schema-h2.sql`

---

## D. TIÊU CHÍ ĐO ĐƯỢC CHO TASK ĐẦU TIÊN (MT3-F1)

```text
1) Tiến trình duyệt KHÔNG còn render bình luận (chuyển sang vùng "Chi tiết")
2) Mỗi mốc chỉ hiện: trạng thái · người duyệt/phụ trách · phòng ban · thời gian
3) 3 vùng (danh sách chờ duyệt · phiếu đang xử lý · hồ sơ chi tiết) cao bằng nhau, KHÔNG dùng chiều cao cứng
4) Nút "Yêu cầu bổ sung" mở vùng nhập, ⛔ không window.prompt, validate rỗng
5) tsc 0 · contract không đỏ mới · probe DOM ĐẠT ở 1440px và 768px
```
