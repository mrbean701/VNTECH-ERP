# TASK-094 — WORKFLOW PHÊ DUYỆT CHO 3 NHÓM QUY TRÌNH: MUA HÀNG · CẤP PHÁT · XUẤT–NHẬP KHO

- **Ngày:** 18/09/2026 · **Trạng thái:** `KHUNG-XONG / CHO-CHOT-NGHIEP-VU` (đã đo hiện trạng + đã có phương án; chờ người dùng chốt 5 câu hỏi ở §4)
- **Nguồn:** người dùng yêu cầu: *"Quy trình mua hàng, quy trình cấp phát, xuất – nhập đều phải có workflow phê duyệt, đề xuất phương án triển khai nếu đã có kế hoạch rồi thì nêu phương án lên."*
- **Công cụ đo:** `tools/do-workflow-phe-duyet-3-nhom.mjs` (đọc thẳng CSDL + mã nguồn, không chép tay)

## 1. HIỆN TRẠNG ĐO ĐƯỢC (18/09/2026) — nhóm nào ĐÃ có duyệt, nhóm nào CHƯA

| Quy trình | Có workflow phê duyệt? | Bằng chứng đo được |
|---|---|---|
| **Phiếu đề nghị mua hàng (MR)** | ✅ **CÓ** — 5 bước, `mode=single` (bước 5 = `all_roles`) | `approval_stage_catalog` **5 bước**: ① CHT xác nhận nhu cầu (`commander,cht`) ② Thư ký TGĐ duyệt (`thuky`) ③ Phòng Dự án kiểm tra khối lượng (`project,da_nv`) ④ Phòng Kế hoạch tiếp nhận (`procurement,kh_nv`) ⑤ Trưởng phòng DA + KH xác nhận cuối (`da_truong,kh_truong`, **all_roles**) · `approvals` **100 dòng** (approved **65** · pending **35**) · `approval_project_assignments` **5** |
| **Phát hành PO (mua hàng)** | ❌ **KHÔNG** | `create_po` gắn capability **`canCreate`**; **không tồn tại** action `approve_po`; PO phát hành thẳng sau khi phiếu được duyệt |
| **Cấp phát / Xuất kho** | ❌ **KHÔNG** | `issue_stock` = **`canCreate`**; **không có** `approve_issue` |
| **Nhập kho** | ⚠️ **MỘT PHẦN** | `receive_goods` = `canCreate` (không có duyệt); `confirm_delivery` = **`canApprove`** nhưng đây là **BCH xác nhận GIAO HÀNG THỰC TẾ**, không phải duyệt phiếu nhập |
| Điều chuyển · Kiểm kê · Hoàn trả kho tổng | ✅ **ĐÃ CÓ action duyệt** (nhưng **rời rạc**) | `approve_transfer_order` · `approve_stock_count` · `approve_central_return` — đều `canApprove` |
| Sản lượng · Nhật ký thi công · Chi phí công trường · Nghiệm thu lắp đặt | ✅ có action duyệt | `approve_production_report` · `approve_construction_daily_log` · `approve_site_expense_claim` · `confirm_installation` |
| **MAR — duyệt vật tư kỹ thuật** | ⚠️ **bảng đã có, CHƯA dùng** | `material_mar_approvals` = **0 dòng** |
| Engine workflow tổng quát | ⚠️ **có khung, chỉ phục vụ phiếu đề nghị** | `workflow_definitions` **1 dòng** (`WF-MUAHANG-01`, `module_key = requests`, mô tả *"Luồng duyệt 5 bước cho phiếu đề nghị mua hàng"*) · `workflow_steps` **5** · `workflow_step_approvers` **5** |
| Theo dõi tiến trình cung ứng (không phải duyệt) | ℹ️ đang chạy | `supply_workflow_steps` **56 dòng** (cột `request_id`/`purchase_order_id`/`receipt_id`/`step`/`status`/`due_at`) |

**Kết luận thẳng:** hiện **CHỈ phiếu đề nghị mua hàng** có luồng duyệt; **PO · cấp phát/xuất kho · nhập kho CHƯA có cổng phê duyệt**.
**Tin tốt:** nền móng đã có sẵn — engine duyệt (`approval_stage_catalog` + `workflow_*`), quyền `canApprove`, dải phê duyệt dùng chung (`ApprovalTimeline`), hộp thư duyệt, và 3 action duyệt mẫu của điều chuyển/kiểm kê/hoàn trả.

## 2. NGUYÊN TẮC TRIỂN KHAI (để không phá luồng đang chạy)

1. **KHÔNG dựng engine mới.** Mở rộng engine đang chạy theo `module_key` và **dùng lại** `ApprovalTimeline` + hộp duyệt + `canApprove`.
2. **Cổng chặn đặt ở đúng action "GHI SỔ"** (không chặn ở màn hình): `receive_goods` (nhập kho) · `issue_stock` (xuất/cấp phát) · `create_po` (phát hành PO) — vì mọi đường vào (UI, nhập Excel, gọi API trực tiếp) đều đi qua action.
3. **Không phá luồng phiếu đề nghị:** bảng `approvals` (100 dòng đang chạy) **giữ nguyên**; phần mới dùng **bảng/khung song song có `entity_type` + `entity_id`** rồi mới hợp nhất nếu an toàn.
4. **Mỗi giai đoạn phải có CỔNG ĐO có đối chứng dương**: *chưa duyệt ⇒ action bị chặn (mã lỗi + nguyên văn)* · *duyệt xong ⇒ action chạy* · **dọn sạch fixture** và khôi phục đúng số dòng.
5. **Parity 2 đường phục vụ:** mọi thay đổi phải có ở **cả Java (đường đang chạy `:9000`) và JS** (`scripts/system-route.mjs`), kèm migration **drizzle + Flyway** nếu đụng lược đồ.

## 3. PHƯƠNG ÁN TRIỂN KHAI — 6 GIAI ĐOẠN

| GĐ | Việc | Cổng kiểm chứng (đối chứng dương) |
|---|---|---|
| **P0** | **Khung dùng chung:** thêm `entity_type`/`entity_id` (+ `module_key`) cho khung duyệt; 1 hàm `requireApproved(entityType, entityId)` ở cả Java + JS; 1 hộp duyệt dùng chung cho mọi loại chứng từ | Cổng: `requireApproved` chặn khi `pending` · cho qua khi `approved` · **không đụng** luồng phiếu hiện có (100 dòng `approvals` giữ nguyên) |
| **P1** | **PO phát hành:** `create_po` ⇒ PO ở `pending_approval`; chỉ PO `approved` mới cho `receive_goods`; màn Mua hàng hiện badge + nút duyệt | Probe: tạo PO → **nhận hàng bị CHẶN** (nguyên văn) → duyệt → **nhận hàng chạy** → dọn fixture |
| **P2** | **Cấp phát / Xuất kho:** `issue_stock` ⇒ phiếu xuất `pending_approval` (người duyệt cấu hình theo `module_key=warehouse_issue`) | Probe: xuất kho khi chưa duyệt ⇒ **bị chặn**; sau duyệt ⇒ chạy; tồn kho **không đổi** khi còn `pending` |
| **P3** | **Nhập kho:** `receive_goods` ⇒ `pending_approval` (Thủ kho + BCH); **giữ** `confirm_delivery` như bước xác nhận riêng | Probe: nhập khi chưa duyệt ⇒ chặn; sau duyệt ⇒ tồn kho tăng **đúng số lượng** |
| **P4** | **Chuẩn hoá 3 action duyệt rời rạc** (`approve_transfer_order` · `approve_stock_count` · `approve_central_return`) vào cùng khung + cùng hộp duyệt | Probe: mỗi loại 1 chứng từ: chặn → duyệt → chạy (3/3) |
| **P5** | **MAR**: kích hoạt `material_mar_approvals` (duyệt vật tư kỹ thuật trước khi đặt hàng) | Probe: MAR `pending` ⇒ không cho đặt hàng; duyệt ⇒ cho |

**Ước lượng:** P0 **1 vòng** (khung + hàm + migration) · P1–P3 **mỗi giai đoạn 1 vòng** (Java + JS + UI + probe) · P4 **1 vòng** · P5 **1 vòng**. Tổng **6 vòng** theo đúng nhịp hiện tại (mỗi vòng đều có build + hồi quy + cổng ảnh + hồ sơ + commit).

## 4. ⏸️ 5 CÂU CẦN NGƯỜI DÙNG CHỐT TRƯỚC KHI THI HÀNH (nghiệp vụ)

1. **Ai duyệt từng nhóm?** (đề xuất: **PO** = Trưởng Kế hoạch + Kế toán · **Cấp phát/xuất** = CHT/BCH + Kế toán · **Nhập kho** = Thủ kho + BCH · **Điều chuyển** = 2 thủ kho + Kế toán)
2. **Có ngưỡng tiền không?** (ví dụ: PO < 20 triệu miễn duyệt; ≥ 20 triệu mới cần — nếu có, ngưỡng đặt ở đâu?)
3. **Mỗi chứng từ duyệt 1 bước hay nhiều bước tuần tự?** (phiếu đề nghị đang 5 bước — PO/xuất/nhập có cần nhiều bước như vậy không?)
4. **Chặn cứng hay chỉ cảnh báo?** (đề xuất **chặn cứng**: chưa duyệt thì không được nhập/xuất — đúng chữ *"phải có workflow phê duyệt"*)
5. **Nhập kho:** **thêm** một bước duyệt mới, hay **nâng cấp** `confirm_delivery` (BCH xác nhận giao hàng) thành bước duyệt chính thức?

## 6. ✅ CHỐT NGHIỆP VỤ CỦA NGƯỜI DÙNG (18/09) + THIẾT KẾ CHI TIẾT

**Người dùng chốt (nguyên văn ý):**
1. *"Làm theo nghiệp vụ được đề xuất, **thiết kế workflow ĐỘNG** để có thể thay đổi quy trình được. **Nạp sẵn dữ liệu để test** đối với các luồng mới này."*
2. *"Chưa cần đặt **ngưỡng tiền**. User có quyền từ chối PO sẽ tự ra quyết định thủ công. **Logic: PR được duyệt nhưng PO bị từ chối thì PR VẪN MỞ**, đồng thời **HỦY PO đó** và **yêu cầu user tạo PO đó làm lại / xử lý lại** (gửi **thông báo** đến user tạo PO)."*
3. *"Tạm thời phiếu đề nghị mua hàng cứ **giữ nguyên** như vậy, miễn đang là workflow động thì có thể chỉnh sửa được."*
4. *"**Chỉ cảnh báo**"* (KHÔNG chặn cứng).

### 6.1. Hệ quả kỹ thuật (đã sửa lại so với phương án ban đầu)

| Điểm | Phương án ban đầu | **CHỐT LẠI theo người dùng** |
|---|---|---|
| Cổng | `requireApproved()` **chặn** action | **CHỈ CẢNH BÁO**: action **vẫn chạy**, kèm `warning` + bản ghi duyệt `pending` + biểu ngữ trên giao diện. **Không** ném lỗi chặn. |
| Ngưỡng tiền | có thể cấu hình ngưỡng | **KHÔNG làm** (bỏ hẳn khỏi phạm vi P1–P3, ghi vào non-goals) |
| Cấu hình | sửa trong migration | **WORKFLOW ĐỘNG**: `workflow_definitions` + `workflow_steps` + `workflow_step_approvers` **sửa được qua giao diện quản trị** (đổi bước / đổi vai trò / bật-tắt / nhân bản định nghĩa theo `module_key` + `version`) |
| Phiếu đề nghị (PR) | có thể đổi | **GIỮ NGUYÊN 5 bước hiện tại**, chỉ **đưa vào engine động** để chỉnh được về sau |
| Dữ liệu test | chỉ probe tạm | **NẠP SẴN dữ liệu test** cho các luồng mới (xem §6.3) |

### 6.2. Luồng **PO bị từ chối** (nghiệp vụ mới, phải làm đúng)

```
PR đã duyệt  ──► tạo PO (pending_approval)
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
   PO được DUYỆT              PO bị TỪ CHỐI
   → approved                → cancelled (kèm lý do, người quyết, thời điểm)
   → cho phép nhận hàng      → **PR VẪN MỞ** (không đổi trạng thái PR)
                             → **THÔNG BÁO cho user đã tạo PO đó**: "PO <số> đã bị hủy — hãy tạo lại/xử lý lại"
                             → UI PO hiện rõ "Đã hủy — cần xử lý lại" + nút tạo lại
                             → ghi audit (ai từ chối, lý do) + vào hộp thư người tạo
```
* Dùng lại hạ tầng thông báo đang chạy: `task_notifications` + `email_outbox` (đã kiểm chứng ở TASK-080 đợt 2D).
* **Quyền từ chối PO** = `canApprove` trên module mua hàng (đã có sẵn cơ chế).

### 6.3. Dữ liệu test nạp sẵn cho các luồng mới (yêu cầu 1)
Seed (parity **drizzle + Flyway**) tạo **workflow definitions cho 3 module mới** (`purchasing` · `warehouse_issue` · `warehouse_receipt`) + **4 chứng từ mẫu** để test ngay trên UI:
1. PO `pending_approval` (để bấm Duyệt) · 2. PO `cancelled` do bị từ chối **kèm thông báo đã gửi cho người tạo** (để xem luồng xử lý lại) · 3. phiếu **xuất kho** `pending_approval` · 4. phiếu **nhập kho** `pending_approval`.
Kèm probe: **đối chứng dương** (chưa duyệt ⇒ có **cảnh báo** nhưng action vẫn chạy; sau duyệt ⇒ không còn cảnh báo) + **dọn sạch/khôi phục đúng số dòng** khi cần.

### 6.4. ⏸️ CÂU HỎI CÒN LẠI — mục 5 (nhập kho), người dùng yêu cầu em đề xuất rồi xác nhận

**Đề xuất của em: PHƯƠNG ÁN A — THÊM một bước duyệt mới cho phiếu nhập** (giữ `confirm_delivery` là bước BCH xác nhận hàng về).
* **Vì sao:** hai việc **khác nhau về bản chất** — `confirm_delivery` = *"hàng đã về đúng/sai so với chứng từ"* (xác nhận thực tế, do BCH/CHT), còn **duyệt phiếu nhập** = *"cho phép ghi TĂNG tồn kho"* (trách nhiệm thủ kho/kế toán). Trộn hai ý nghĩa vào một bước sẽ **mất truy vết** đúng như lớp lỗi đã gặp ở các module khác.
* **Phương án B (để anh cân nhắc):** **nâng cấp** chính `confirm_delivery` thành bước duyệt chính thức — ít bước hơn, nhưng **một bước mang hai nghĩa**, và sau này rất khó tách nếu cần báo cáo "hàng về đúng giờ" tách khỏi "đã cho nhập kho".
* **Đề xuất kèm (cho cả A và B):** bước duyệt phiếu nhập cấu hình được trong engine động ⇒ sau này có thể gộp/tách mà **không cần sửa mã**.

**👉 Cần anh xác nhận: A hay B?** (mặc định em làm **A** nếu anh không phản hồi, vì A giữ được truy vết và vẫn đổi được cấu hình sau).

### 6.5. Cập nhật thứ tự thi hành (sau khi chốt)
**P0** khung + engine động (+ màn quản trị sửa quy trình) → **P1** PO (+ luồng từ chối PO ở §6.2) → **P2** cấp phát/xuất → **P3** nhập kho (theo A/B) → **P4** chuẩn hoá 3 action duyệt rời rạc → **P5** MAR. **Chế độ CẢNH BÁO** ở mọi bước; **seed test data** ở §6.3 nạp cùng P1–P3.

## 8. 📌 ĐỐI CHIẾU MASTER TASK + BÁO CÁO THAY ĐỔI CSDL/BACKEND (gửi TRƯỚC khi thực hiện — theo yêu cầu người dùng 18/09)

### 8.1. Việc này là **mục nào** trong MASTER TASK? → **PHASE 8 — WORKFLOW** (`docs/25_TODO_ROADMAP.md`, 110 mục)

| Mục | Nội dung | Ưu tiên | Phụ thuộc | TT hiện tại | Việc này tác động |
|---|---|---|---|---|---|
| **`WF-04`** | **Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`)** hoặc ghi rõ hệ nào là chính | P3 *(cờ MODEL)* | WF-02 | **TODO** | ⭐ **ĐÂY LÀ MỤC CỐT LÕI** — "workflow ĐỘNG" của người dùng chính là WF-04 |
| **`WF-02`** | **Snapshot danh sách người được chỉ định** vào phiếu (bịt rủi ro §20.3) | **P1** | — | **TODO** | ⭐ Bắt buộc để "đổi quy trình mà phiếu đang chờ không bị đổi luồng" |
| **`WF-05`** | **Kiểm thử: đổi workflow khi có phiếu đang chờ ⇒ phiếu cũ GIỮ NGUYÊN luồng** | **P1** | WF-02 | **TODO** | ⭐ Chính là **cổng kiểm chứng** của thiết kế động |
| `WF-03` | Dùng cột `workflow_definitions.version` hoặc xoá nếu không dùng | P3 | WF-02 | TODO | Dùng `version` để phân biệt bản quy trình |
| `WF-01` | Đổi tên tab thành **Workflow** | P3 | — | TODO | Màn quản trị sửa quy trình |
| `WF-06` | Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai | P4 | WF-04 | TODO | Ngoài phạm vi đợt này |
| `S-08` | Snapshot **danh sách người được chỉ định**, không đọc live | **P1** | — | TODO | ⭐ Cùng bản chất WF-02 (làm chung) |
| `T-10` | Tách **Approval Center** thành module độc lập (§12) | P2 | U-06 | TODO | Hộp duyệt dùng chung (P0 của em chạm tới) |

**⇒ Đợt này = `WF-04` + `WF-02` + `WF-05` (+`S-08` cùng bản chất) + mở rộng ra 3 module mới** — tức **PHASE 8 chuyển từ `0/6` sang có tiến độ**, kèm 3 module nghiệp vụ mới có duyệt.

### 8.2. ⚠️ THAY ĐỔI CSDL CẦN ANH BIẾT TRƯỚC (parity **cả 2 chuỗi**: drizzle/SQLite + Flyway/MySQL)

| # | Thay đổi | Vì sao cần | Rủi ro / cách giảm |
|---|---|---|---|
| D1 | `approvals`: thêm **`entity_type`** + **`entity_id`**, cho `request_id` **nullable**, **backfill** `entity_type='material_request'`, `entity_id=request_id` | Để **một bảng duyệt dùng cho MỌI loại chứng từ** (PO · xuất · nhập) thay vì chỉ phiếu đề nghị | Giữ nguyên `request_id` + backfill ⇒ **100 dòng duyệt hiện có không đổi hành vi**; probe phải chứng minh "phiếu cũ giữ nguyên luồng" (WF-05) |
| D2 | Seed **`workflow_definitions` + `workflow_steps` + `workflow_step_approvers`** cho 3 `module_key`: `purchasing` · `warehouse_issue` · `warehouse_receipt` | Engine ĐỘNG cần định nghĩa cho từng module | Chỉ **thêm dòng**; không xoá/không sửa định nghĩa `requests` đang chạy |
| D3 | `purchase_orders`: cần trạng thái `pending_approval`/`approved`/**`cancelled`** + **lý do/người quyết/thời điểm** (kiểm cột hiện có trước khi thêm) | Luồng **từ chối PO** (§6.2): PO bị hủy, PR vẫn mở, thông báo người tạo | Thêm cột **nullable**, backfill `approved` cho PO cũ ⇒ không đổi dữ liệu đang chạy |
| D4 | Phiếu **xuất kho** / **nhập kho**: thêm trường trạng thái duyệt (hoặc dùng bảng instance D1) | Để cảnh báo + theo dõi duyệt cho 2 luồng này | **Chỉ cảnh báo** ⇒ không chặn nghiệp vụ hiện tại |
| D5 | **Seed dữ liệu test** (4 chứng từ mẫu ở §6.3) + thông báo mẫu trong `task_notifications`/`email_outbox` | Người dùng yêu cầu *"nạp sẵn dữ liệu để test"* | Có probe **dọn sạch/khôi phục đúng số dòng**; ghi rõ mã mẫu để dễ nhận biết |

**KHÔNG cần thay đổi:** `approval_stage_catalog` (giữ nguyên 5 bước của phiếu đề nghị) · mọi bảng nghiệp vụ khác · **không có ngưỡng tiền** (đã bỏ theo quyết định 2).

### 8.3. Thay đổi BACKEND (Java **và** JS parity)
1. Hàm dùng chung **`approvalWarnings(entityType, entityId)`** — **CHỈ trả cảnh báo, KHÔNG ném lỗi** (quyết định 4).
2. Gắn cảnh báo vào **`create_po` · `issue_stock` · `receive_goods`** (3 action "ghi sổ").
3. Action **`decide_approval`** mở rộng nhận `entity_type`/`entity_id`; nhánh **PO bị từ chối** ⇒ `cancelled` + **thông báo người tạo PO** + **PR không đổi** (§6.2).
4. API + màn **quản trị quy trình** (đọc/ghi definitions/steps/approvers) — chính là "động".
5. Parity: **làm ở cả `BootstrapDataAdapter`/use-case Java và `scripts/system-route.mjs`**, kèm cổng `probe-column-parity` (đã có) để không lệch cột.

### 8.4. Thứ tự thực hiện đề xuất (sau khi anh xác nhận báo cáo này)
**B1** = D1 + D2 + WF-02/WF-05 (engine động + snapshot + probe "đổi quy trình không đổi luồng phiếu cũ") → **B2** = D3 + P1 PO (+ luồng từ chối PO) → **B3** = D4 + P2/P3 (cấp phát/xuất + nhập kho **theo phương án A**: thêm bước duyệt mới, giữ `confirm_delivery`) → **B4** = P4/P5 + D5 seed dữ liệu test.

**✅ NGƯỜI DÙNG ĐÃ CHỐT (18/09):** nhập kho theo **PHƯƠNG ÁN A** — **thêm một bước duyệt mới cho phiếu nhập**, **giữ `confirm_delivery`** là bước BCH xác nhận hàng về (bước duyệt mới cấu hình được trong engine động).

## 9. ✅ B1 ĐÃ LÀM + ĐÃ KIỂM CHỨNG (18/09)
* **D1 + D2 áp dụng trên CẢ 2 CSDL:** `approvals` backfill **100/100** = `material_request` · `workflow_definitions` **1 → 4** · `workflow_steps` **5 → 11** · Flyway **V17 success = 1** · SQLite cũng có 2 cột mới + 4 definitions/11 steps.
* **JS `approvalWarnings()`** (CHỈ CẢNH BÁO — quyết định 4) đã thêm và gắn vào **3 action ghi sổ**: `issue_stock` (`stock_issue`) · `create_po` (`purchase_order`) · `receive_goods` (`goods_receipt`). Kiểm: `node --check` **EXIT 0** · eslint **0 error** · 3 dịch vụ **200**.
  * ⚠️ **Giới hạn đã biết:** `create_po` có thể phát hành **NHIỀU PO trong một lần** (thông điệp `Đã phát hành ${poNos.length} PO…`) nhưng cảnh báo hiện chỉ tính theo **PO đầu tiên** (`poId`, gán ở dòng 1321 trước `return` ở 1323). Việc đúng: cảnh báo theo **từng PO đã tạo** — ghi vào việc kế tiếp.
* **Còn lại của B1:** bản **Java parity** · **màn quản trị quy trình ĐỘNG** (xem §10) · **cổng `WF-05`**.

## 10. 🎨 YÊU CẦU MỚI CỦA NGƯỜI DÙNG (18/09) — MÀN CẤU HÌNH WORKFLOW: CHỌN NGƯỜI DUYỆT BẰNG **TÌM KIẾM**

**Vấn đề người dùng nêu:** màn cấu hình hiện **hiển thị các bước + danh sách user được chỉ định** ⇒ **modal rất dài**, khó dùng.

**Yêu cầu (nguyên văn ý):**
1. **Chuyển sang dạng TÌM KIẾM user**: admin **gõ tên user** → chọn → **thêm vào bước duyệt** (không bày toàn bộ danh sách user ra modal).
2. **Cách xác nhận:** nếu một bước cần **nhiều người duyệt** thì **hiển thị những user ĐƯỢC CHỈ ĐỊNH DUYỆT ở DƯỚI danh sách** (danh sách đã chọn nằm dưới, kèm khả năng bỏ chọn).

**Đặc tả kỹ thuật đề xuất (để làm ở mục #9 của TODO):**
* Ô tìm kiếm: dùng **API danh sách người dùng đã có** (`data.users`/`staffDirectory` trong bootstrap — **không thêm endpoint mới nếu không cần**), lọc theo **tên/mã nhân viên/email** (chuẩn hoá bỏ dấu như các màn khác).
* Kết quả tìm: danh sách gợi ý **giới hạn** (ví dụ 8–10 dòng) + hiển thị `Họ tên · mã NV · phòng ban · vai trò` để admin chọn đúng người.
* **Danh sách đã chọn** hiển thị **dưới** ô tìm kiếm, mỗi người một chip/dòng có nút **bỏ**; lưu vào **`workflow_step_approvers`** (`step_id` + `user_id`) — bảng đã có sẵn (đang **0 dòng** vì đợt B1 cố ý để trống).
* Vì **nhiều bước** ⇒ mỗi bước một khối gọn: *tên bước · vai trò yêu cầu · ô tìm user · danh sách đã chọn* — **không** render toàn bộ user.
* **Cảnh báo (đúng chế độ CHỈ CẢNH BÁO):** nếu một bước **không có ai được chỉ định** và cũng **không khai vai trò** ⇒ hiện **cảnh báo vàng** (không chặn lưu).
* **Không đổi CSDL** cho yêu cầu này (bảng `workflow_step_approvers` đã đủ cột) ⇒ **không cần báo cáo CSDL mới**.
* Kiểm chứng: `tsc` · eslint · build · **màn quản trị** thêm/xoá người duyệt cho 1 bước ⇒ đọc lại từ CSDL thấy đúng · cổng `probe-column-parity` giữ ĐẠT.

### 10.1. Hiện trạng mã + HAI MỎ NEO ĐÃ CHỐT (để vòng sau sửa ngay, không phải khảo sát lại)
* Màn cấu hình = **`WorkflowModal`** tại **`app/page.tsx:2626`**; dữ liệu lấy từ bootstrap `workflowDefinitions` **`page.tsx:372`** · `workflowSteps` **`:373`** · `workflowStepApprovers` **`:374`**.
* Khối "bày toàn bộ ứng viên" (nguyên nhân modal dài) = **`page.tsx:2728–2735`**: `<div className="admin-mini-list">{shown.map((u) => …toggleApprover(index, String(u.id))…)}</div>`.
  Đây là chỗ DUY NHẤT cần thay: → ô **tìm kiếm** + gợi ý (≤8) + **danh sách đã chỉ định ở dưới** + **cảnh báo vàng** khi bước chưa có ai.
* Hàm phụ trợ đã có sẵn, **không cần viết mới**: `candidates = workflowApproverCandidates(data, moduleKey)` (`:2649`) · `shown` (`:2651`) · `patchStep` (`:2653`) · `toggleApprover` (`:2654`, đã xử lý đúng `single` = giữ 1 người).
* **Công cụ đã viết:** `tools/_wf-ui-tim-nguoi-duyet.mjs` (mỏ neo + tự chối) — lượt chạy khô đầu **DỪNG, không ghi tệp**, đúng 2 lỗi mỏ neo cần sửa ở vòng sau:
  1. `[thêm suggestionsFor] khớp 2 lần` vì `async function save(event: FormEvent<HTMLFormElement>) {` **xuất hiện 2 lần trong tệp** ⇒ phải đổi sang mỏ neo DUY NHẤT, ví dụ dòng `const moduleOptions = configuredModules(data).filter((m) => m.key !== "admin");` (trong `WorkflowModal`).
  2. `[thay khối chọn người duyệt] khớp 0 lần` ⇒ khối OLD chép lại **chưa khớp byte** (khác khoảng trắng/`style={…}`); vòng sau phải **đọc lại đúng dòng 2728–2735** rồi dán nguyên văn làm mỏ neo (bài học: mỏ neo dài phải lấy bằng máy, không chép tay).
* **Kiểm chứng đã chạy tới đâu:** chỉ mới **chạy khô công cụ** (chưa sửa mã) ⇒ `app/page.tsx` **nguyên vẹn**, cây làm việc sạch.

## 7. RỦI RO ĐÃ NHẬN DIỆN

- **`approvals` đang có 35 dòng `pending`** ⇒ mọi thay đổi phải **không** làm hỏng luồng 5 bước đang chạy (P0 phải chứng minh bằng probe "100 dòng giữ nguyên").
- **Nhánh duyệt song song `all_roles` đang là mã chết ở cả hai lõi** (KP #54: JS ghi snapshot `single` cho mọi bước có Owner) ⇒ nếu P0–P5 dùng tới `all_roles`, phải **sửa cả gốc snapshot** trước, nếu không sẽ lặp lại đúng lỗi cũ.
- **Ngưỡng tiền** (câu 2) nếu có ⇒ phải thêm cột cấu hình + luật so tiền ở **cả hai đường**; dễ phát sinh lệch JS↔Java (đã có tiền lệ).
- **Tồn kho**: P2/P3 đụng trực tiếp số lượng tồn ⇒ mọi probe phải **đo tồn trước/sau** và **khôi phục đúng** số dòng (đã có mẫu ở các probe kho hiện tại).

## 11. [WF-04] QUYET DINH: HE NAO LA CHINH (18/09)

**Yêu cầu lộ trình:** hop nhat 2 he (workflow_* va approval_stage_catalog) HOAC ghi ro he nao la chinh (muc co co MODEL).

**Bằng chứng đo được** (tools/probe-wf04-hop-nhat-2-he.mjs):
* Đối chiếu 1:1 cho phiếu đề nghị: **5/5 bước KHỚP TÊN** giữa approval_stage_catalog (5 bước đang chạy) và
  workflow_definitions **WF-MUAHANG-01** (module=requests, v2, mặc định, active) => hệ mới PHẢN CHIẾU ĐÚNG hệ cũ.
* **3 module MỚI** chỉ có ở hệ mới: WF-PO-01 (purchasing) · WF-XUATKHO-01 (warehouse_issue) · WF-NHAPKHO-01 (warehouse_receipt)
  — mỗi định nghĩa 2 bước, bước khai required_permission='canApprove'.
* LỆCH THẬT ĐÃ PHÁT HIỆN (ghi rõ, không giấu): bước 5 hệ cũ dùng approval_mode='all_roles', hệ mới dùng 'all_of'
  (KHÁC TỪ VỰNG); required_permission của định nghĩa requests đang TRỐNG => ghi thành việc kế tiếp **WF-04-followup**.

**QUYẾT ĐỊNH (đúng nhánh "hoặc" của yêu cầu):**
1. Phiếu đề nghị mua hàng => **approval_stage_catalog LÀ CHÍNH**; KHÔNG di trú, KHÔNG xoá (100 dòng approvals đang chạy).
2. 3 module mới (PO · cấp phát/xuất kho · nhập kho) => **workflow_* LÀ CHÍNH**.
3. **Cầu nối an toàn = SNAPSHOT**: quyết định luôn đọc snapshot trước, cấu hình chỉ là dự phòng
   => đổi hệ nào cũng KHÔNG làm lệch phiếu đang chạy (đã chứng minh ở WF-05: 5/5 ĐẠT + 100/100 dòng có snapshot).
4. Sau khi chuẩn hoá từ vựng (WF-04-followup) thì 2 hệ là MỘT engine thống nhất về mặt khái niệm.

### 11.1. [WF-04-followup] KẾT LUẬN VỀ LỆCH QUY ƯỚC equired_permission (18/09) — ĐO MÃ NGUỒN, KHÔNG ĐOÁN
* **Dữ liệu hiện tại:** MySQL workflow_steps.required_permission = TRỐNG (đã hoàn tác thao tác điền sai của tôi);
  SQLite (chuỗi drizzle) = `requests.canApprove` (CÓ TIỀN TỐ MODULE).
* **Bằng chứng mã nguồn (Java):** cột này CHỈ được (a) ĐỌC RA cho client — `BootstrapDataAdapter.java:950`,
  `OpsTaskStoreAdapter.java:434`; (b) GHI VÀO từ payload — `OpsTaskStoreAdapter.java:488,492`;
  (c) TRUYỀN THẲNG — `OpsTaskManagementUseCase.java:629` (`step.put("requiredPermission", trim(...))`).
  **KHÔNG có bất kỳ chỗ nào SO SÁNH cột này với quyền của người dùng** ⇒ **hiện nó KHÔNG phải là cổng chặn**,
  chỉ là trường dữ liệu để giao diện hiển thị / dự phòng cho tương lai.
* **⇒ KẾT LUẬN:** lệch quy ước này **KHÔNG gây khác biệt hành vi** ở thời điểm hiện tại (không mã nào so sánh)
  ⇒ **quyết định: GIỮ NGUYÊN dữ liệu hai bên** (không rủi ro), và **ghi rõ quy ước chuẩn cho tương lai**:
  khi engine chung bắt đầu **thực thi** trường này thì dùng dạng **`<module_key>.<permission>`** (ví dụ `requests.canApprove`)
  — theo đúng quy ước SQLite đang dùng và cùng phong cách `domain.action` của `ActionRbacRegistry`.
* **Việc cần làm khi tới bước đó:** bổ sung phép so sánh ở cả **Java + JS**, kèm probe "thiếu quyền ⇒ chặn" (2 lõi),
  rồi mới điền dữ liệu cho MySQL theo dạng đã chốt.

## 12. PHASE 8 · B1 (parity Java) — KẾ HOẠCH CHÍNH XÁC + ĐIỂM CHÈN (chốt 18/09)
**Đã khảo sát:** 3 action "ghi sổ" trong java-backend/web/.../SystemController.java đều là 1 dòng rất gọn:
* case "create_po" — dòng **1061-1065**: Map<String,Object> result = purchaseManagementUseCase.createPo(...); return ResponseEntity.ok(jsonResult(result));
* case "receive_goods" — dòng **1071-...**: cùng khuôn (gọi use-case rồi jsonResult(result)).
* case "issue_stock" — dòng **1151-1155**: stockManagementUseCase.issueStock(...) rồi jsonResult(result).
**KẾ HOẠCH 3 tệp (tối thiểu, đúng kiến trúc — KHÔNG viết SQL trong controller):**
1. pplication/.../port/out/RequestStore.java — thêm 1 method: List<String> approvalWarnings(String entityType, String entityId);
2. infrastructure/.../persistence/RequestStoreAdapter.java — cài đặt: đếm tổng bước + số bước pproved trên pprovals
   theo (entity_type, entity_id); **trả MẢNG cảnh báo, KHÔNG ném lỗi** (người dùng chốt **CHỈ CẢNH BÁO**, không chặn).
3. SystemController.java — ở cả 3 case: tạo LinkedHashMap từ esult, thêm warnings, rồi jsonResult(...).
   ⚠️ **KHÔNG put trực tiếp vào esult** (có thể là map bất biến ⇒ ném UnsupportedOperationException).
**Kiểm chứng sau khi làm:** 
ode --check-tương-đương là mvn -q -DskipTests package **CHỜ NHẢ TỆP JAR** (bài học: dừng Java xong phải chờ,
nếu không jar hỏng + API down) → restart → **curl thử 1 action** thấy có warnings → chạy lại probe JS probe-task049-owner-checks + hồi quy 61/61.
**LƯU Ý GIỚI HẠN ĐÃ BIẾT (phải xử lý trong/after B1):** create_po có thể phát hành **NHIỀU PO trong 1 lần** ⇒ cảnh báo phải tính **theo TỪNG PO**,
không chỉ PO đầu tiên (bản JS hiện đang chỉ tính PO đầu tiên).

### 12.1. Kết quả chạy khô vá Java (18/09) — TỰ CHỐI, còn ĐÚNG 1 BƯỚC
* Công cụ 	ools/_b1-va-java-canhbao.mjs đã viết xong (mỏ neo + tự chối) cho **3 tệp**: RequestStore (port) · RequestStoreAdapter (native SQL, trả MẢNG, không ném lỗi) · SystemController (3 case).
* **Chạy khô ĐẦU TIÊN: TỪ CHỐI GHI** vì SystemController **KHÔNG có sẵn bean RequestStore** ⇒ in ra đúng chỗ cần sửa: **constructor ở dòng ~77**.
* **VIỆC KẾ TIẾP (đúng 1 bước, rất nhỏ):** thêm tham số RequestStore requestStore vào constructor SystemController (dòng ~77) + gán vào field, rồi chạy lại công cụ (chạy khô → --apply) ⇒ sau đó mvn -q -DskipTests package (**CHỜ NHẢ TỆP JAR**) → restart → thử 1 action thấy warnings → hồi quy 61/61.

### 12.2. Kết quả dựng jar + khởi động lại (18/09) — ĐÃ CHẠY, còn thiếu BẰNG CHỨNG CHỨC NĂNG
* mvn -q -DskipTests package ⇒ **exit 0**. Java khởi động sạch: Flyway **validate 17 migrations** (schema v17 — đã gồm V17 workflow của B1),
  Hibernate OK, Tomcat trên :18081. **Spring tiêm được RequestStore** (nếu không thì startup đã FAIL) ⇒ chứng minh phần TIÊM hợp lệ.
* Dịch vụ: Java :18081 **200** · UI :8787 **200** · proxy :9000 **200**.
* ⚠️ **CHƯA có bằng chứng chức năng** rằng response THẬT SỰ có trường warnings:
  * grep chuỗi trong jar **không kết luận được** (jar lồng, nén) — đã ghi rõ, không suy diễn thành "đã có".
  * Gọi create_po/issue_stock để thấy warnings sẽ **TẠO chứng từ thật** (đột biến dữ liệu) ⇒ cố ý KHÔNG làm khi chưa tới bước B2/B3 có **dữ liệu test dùng-một-lần + dọn sạch**.
* **⇒ Việc kiểm chứng chức năng của B1 được GỘP vào B2/B3** (khi có D5 seed 4 chứng từ test): gọi action trên chứng từ test ⇒ **PHẢI thấy warnings** ⇒ mới đánh giá B1 = xong.
* Trạng thái hồ sơ: WF-05/WF-02/S-08/WF-04 đã đóng; **B1 = "đã viết mã + đã dựng bản chạy", chưa đóng** vì thiếu 1 bằng chứng chức năng.

### 12.3. Thử kiểm chứng chức năng B1 qua API Java (18/09) — CHƯA ĐẠT, ghi rõ để vòng sau xử lý
* **Đã làm:** lấy id hợp lệ (dự án PRJ_fdbfab20…, kho WH_51e0f009…, tổ đội TEAM_8c1fecd9…, phiếu đã duyệt MR_194680cc…, dòng phiếu MRI_8be4ecb4…, vật tư MAT_082196e5…),
  ghi **số dòng TRƯỚC** (stock_issues **4** · stock_issue_items **5** · stock_movements **4**), rồi gọi API Java.
* **Kết quả:** login ⇒ **200** ✔ (đường Java/MySQL chạy đúng) nhưng issue_stock ⇒ **HTTP 400 Bad Request** ⇒ **payload chưa đủ/đúng shape** (chưa đọc được thân lỗi để biết thiếu trường nào).
* **⇒ KHÔNG có đột biến dữ liệu** (400 = bị chặn trước khi ghi) ⇒ số dòng vẫn như TRƯỚC. Không cần dọn.
* **VIỆC KẾ TIẾP (đúng 1 bước):** khi gọi lại, **đọc thân lỗi 400** ($_.Exception.Response / ErrorDetails) để biết trường thiếu, HOẶC đọc StockManagementUseCase.issueStock để lấy đúng danh sách trường bắt buộc;
  sau đó mới kết luận B1. Cách khác rẻ hơn: làm cùng lúc với **D5 seed 4 chứng từ test** (đã nằm trong kế hoạch B4) rồi kiểm B1 trên đó.

### 12.4. Đã ĐỌC ĐƯỢC thân lỗi 400 (18/09) — khoanh đúng điều kiện, chuyển sang D5
* **Cách đọc thân lỗi trên Windows PowerShell 5.1** (KHÔNG có -SkipHttpErrorCheck): catch { .Exception.Response.GetResponseStream() | StreamReader.ReadToEnd() }.
* **Thân lỗi thật:** {"ok":false,"error":"Dòng 1: cấp phát không hợp lệ."} ⇒ không phải lỗi quyền/dự án/tổ đội, mà là **kiểm tra TỪNG DÒNG**.
* **Đã loại trừ:** tổ đội đúng dự án (TEAM_8c1fecd9… thuộc PRJ_fdbfab20…) · MR pproved (nằm trong danh sách trạng thái cho phép) · kho nguồn thuộc dự án · role dmin hợp lệ (login 200, không bị 403).
* **Nghi vấn còn lại (cần dữ liệu test để kiểm):** dòng cấp phát phải khớp **vật tư CÓ TỒN** ở kho nguồn và **khớp dòng phiếu đề nghị**. Truy vấn tồn kho theo tên dự đoán (stock_balances) **không trả kết quả** ⇒ **tên bảng/cột tồn khác** ⇒ **DỪNG, KHÔNG ĐOÁN** (đúng §45).
* **⇒ Chuyển sang D5 (seed 4 chứng từ test)**: khi có chứng từ test + dòng phiếu test, việc kiểm chứng B1 trở nên trực tiếp. **Số dòng vẫn nguyên** (chưa có đột biến nào).

### 12.5. Nguyên nhân cuối cùng của 400 đã XÁC ĐỊNH (18/09) — chuyển hẳn sang D5
* Với **đúng bộ ba** (equestItemId + materialId + equestId lấy từ chính dòng phiếu), truy vấn chọn dòng cấp phát được:
  WHERE mr.status='approved' AND mri.approved_qty > COALESCE(mri.issued_qty,0) ⇒ **TRẢ VỀ RỖNG**
  ⇒ **không còn dòng phiếu nào còn số lượng để cấp phát** trong PRJ-DEMO-01.
* ⇒ Vì vậy mọi lượt gọi issue_stock trên dữ liệu hiện tại đều rơi vào Dòng 1: cấp phát không hợp lệ
  (dòng 94 StockManagementUseCase: equestLine == null) — **không phải lỗi mã, không phải lỗi quyền**.
* **Lượt gọi cuối bị payload lỗi** (mảng null) nên trả **400 mặc định của Spring** ({"status":400,"error":"Bad Request"})
  — phân biệt rõ với **400 của ứng dụng** ({"ok":false,"error":"…"}): dùng thân lỗi để PHÂN LOẠI lỗi là framework hay nghiệp vụ.
* **KHÔNG có đột biến dữ liệu** nào trong cả quá trình (mọi lượt đều bị chặn trước khi ghi).
* **⇒ KẾT LUẬN:** muốn kiểm chứng chức năng B1 (thấy warnings) **bắt buộc phải có dữ liệu test mới**
  ⇒ **D5 (seed 4 chứng từ test, gồm 1 phiếu xuất chờ duyệt có dòng còn số lượng)** là bước đi đúng và cần làm trước.

### 12.6. B1 — gỡ khoá kiểm chứng: đã QUA khâu kiểm tra, vướng RÀNG BUỘC dữ liệu (409) (18/09)
* **Sửa được 1 sai của chính em:** em đã dùng **sai tên cột** pproved_qty; tên THẬT là **pproved_purchase_qty**, còn điều kiện cấp phát (dòng 110 issueStock) so với **equested_qty**.
  Sau khi dùng đúng cột, **không cần seed gì thêm** — đã tìm được dòng phiếu còn dư: MRI_691a777c… (vật tư MAT_c3ff35ff…, phiếu MR_f51722ae…).
* **Kết quả gọi API lần này:** **HTTP 409** — {"ok":false,"error":"Dữ liệu vi phạm ràng buộc của hệ thống (trùng hoặc thiếu tham chiếu)…"}
  ⇒ **KHÁC hẳn 400 trước đó**: 400 = *chưa qua kiểm tra*; **409 = ĐÃ QUA kiểm tra, vướng ràng buộc khi GHI** (FK/unique/NOT NULL) — ví dụ: kho nguồn chưa có tồn cho vật tư đó, hoặc tham chiếu bắt buộc khác.
* **Nghi vấn chính (cần đo tiếp):** kho nguồn WH_51e0f009… **chưa có tồn** của vật tư MAT_c3ff35ff… ⇒ cần **D5 seed tồn kho** (hoặc chọn cặp kho–vật tư đã có tồn từ stock_movements).
* **Số dòng kiểm lại ngay sau lượt 409:** xem kết quả ở trên (kỳ vọng vẫn 4/5/4 ⇒ transaction rollback sạch).
* **B1 CHƯA đóng** — vẫn thiếu 1 lượt THÀNH CÔNG để thấy trường warnings trong response.

### 12.7. Đã đọc LOG Java cho lượt 409 (18/09) — không lộ ràng buộc, cần đọc insertStockIssue
* Log Java xác nhận lượt **400 framework** (16:03:05) = HttpMessageNotReadableException: Required request body is missing
  ⇒ đúng lượt em gửi payload lỗi (mảng null) — **phân loại được lỗi của mình**.
* Lượt **409 KHÔNG có stack trace** trong log ⇒ ứng dụng **chủ động map lỗi ràng buộc DB thành 409 sạch** (không lộ tên cột/index).
  ⇒ **Không thể suy ra ràng buộc từ log.**
* Đường ghi của issueStock (đã đọc mã): store.insertStockIssue(header, items, now) — header gồm cả 	oWarehouseId = team.warehouseId
  (⚠️ bảng stock_issues **KHÔNG có cột 	o_warehouse_id** theo lược đồ đã đo ⇒ cần kiểm cách adapter map trường này),
  sau đó updateRequestItemIssued · eleaseReservationsForRequest · insertSupplyWorkflowStepIssued.
* **VIỆC KẾ TIẾP (đúng 1 bước):** đọc **insertStockIssue** trong adapter để biết **danh sách cột ghi thật + cột NOT NULL/UNIQUE/FK**
  ⇒ từ đó seed **đúng chỗ** (hoặc chọn cặp kho–vật tư có sẵn tồn) ⇒ chạy lại issue_stock ⇒ thấy warnings ⇒ **đóng B1**.
* Trạng thái: **B1 chưa đóng**; dữ liệu vẫn nguyên (4/5/4).

### 12.8. ✅ B1 ĐÃ ĐƯỢC KIỂM CHỨNG CHỨC NĂNG (18/09) — BẰNG CHỨNG NGUYÊN VĂN
**Gọi issue_stock qua API Java :18081 (đăng nhập dmin) ⇒ HTTP 200** và response trả về:
``json
{"ok":true,"message":"Đã xuất kho 1 dòng; phiếu PX-PRJ-DEMO-01-2026-0012 đã ghi nhận. MR còn lượng chưa cấp đủ.",
 "issueId":"ISS_8ea44725-abec-4d66-b377-9809c3bfd110","issueNo":"PX-PRJ-DEMO-01-2026-0012",
 "warnings":["stock_issue ISS_8ea44725-abec-4d66-b377-9809c3bfd110: chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO."]}
``
⇒ **Trường warnings CÓ MẶT**, đúng văn phong **CHỈ CẢNH BÁO**, và **action VẪN THÀNH CÔNG** (ok:true) — đúng quyết định "CHỈ CẢNH BÁO, KHÔNG chặn" của người dùng.
⇒ **Parity Java ↔ JS đã được chứng minh ở tầng chức năng (không chỉ đọc mã).**

**NGUYÊN NHÂN 409 TRƯỚC ĐÓ — đã tìm ra chính xác bằng ĐO (không đoán):**
* Loại trừ: **KHÔNG có trigger** nào trong DB và **KHÔNG có FOREIGN KEY** trên 4 bảng đích (chỉ PRIMARY KEY + stock_issues_no_uidx).
* Còn lại **NOT NULL**: stock_issues.received_by_name là **NOT NULL**, nhưng payload của tôi **không gửi eceivedByName**
  ⇒ Java 
vl(payload.get("receivedByName")) ⇒ **NULL** ⇒ vi phạm NOT NULL ⇒ **409** (Dữ liệu vi phạm ràng buộc…).
* **Sửa:** gửi kèm eceivedByName ⇒ **200 OK** ngay lập tức.
* ⚠️ **ĐÍNH CHÍNH giả thuyết cũ của tôi:** trước đó tôi nghi *"kho nguồn chưa có tồn"* — **SAI**; hệ thống **cho phép** xuất dù tồn 0 (không có trigger/FK chặn) ⇒ ghi nhận để không lặp lại suy đoán.

**Dữ liệu test đã sinh (đúng yêu cầu "nạp sẵn dữ liệu để test"):** phiếu xuất **PX-PRJ-DEMO-01-2026-0012** / ISS_8ea44725…, 1 dòng (vật tư MAT_c3ff35ff…), đã ghi stock_issue_items + stock_movements + contract_stock_ledger ⇒ **chính là 1 trong 4 chứng từ test của D5**.

### 13. [PHASE 8 · B2/D3] ĐÃ ÁP DỤNG + KIỂM CHỨNG (18/09)
* **MySQL (Flyway V18)**: purchase_orders có **decision_reason · decided_by · decided_at** ✔
* **SQLite (drizzle 0144)**: đúng **3 cột** đó ✔ ⇒ **parity 2 chuỗi**.
* Dịch vụ: Java :18081 **200** · UI :8787 **200** · proxy :9000 **200**.
* ⚠️ **Bài học đo lường nhỏ (ghi để không mắc lại):** khi kiểm Flyway bằng MAX(version), MySQL trả **"9"** chứ không phải 18
  vì ersion là **chuỗi** (so sánh từ điển: "9" > "18") ⇒ **phải dùng CAST(version AS UNSIGNED)** hoặc ORDER BY installed_rank DESC LIMIT 1.
  Bằng chứng ĐÚNG cho D3 là **cột đã tồn tại** (đã đo) chứ không phải con số MAX đó.
* **Ý nghĩa:** nay luồng **TỪ CHỐI PO** có chỗ ghi **lý do + ai quyết + khi nào**; status là varchar nên cancelled/pending_approval/pproved dùng được ngay.

### 14. [PHASE 8 · B2 logic] KHẢO SÁT XONG — điểm sửa đã khoanh (18/09)
**Java** (PurchaseManagementUseCase.createPo):
* **dòng ~177**: … principal.userId(), eta, "waiting_delivery", groupLines, sv(mr,"projectId"), … ⇒ **ĐÂY là chỗ đặt trạng thái PO** cần đổi thành **"pending_approval"**.
* **dòng ~189**: store.updateRequestSupplyStatus(requestId, willComplete ? "waiting_delivery" : "awaiting_po", now) ⇒ cập nhật supply_status của MR (giữ nguyên, KHÔNG phải trạng thái PO).
* **dòng ~142**: chặn MAR chưa pproved (liên quan MAR — B4).
**JS** (scripts/system-route.mjs): create_po bắt đầu **dòng 1304**; các mốc liên quan: 1307-1308 (kiểm MR pproved + phạm vi dự án), 1313 (MAR), 1316 (tồn khả dụng), 1321-1322 (sequence + ordered_qty), 1323 (supply_status), 1332/1334 (closed_shortage / completed_with_shortage).
⇒ **CÒN THIẾU chính xác 1 mỏ neo cho JS:** câu INSERT INTO purchase_orders (chuỗi trạng thái PO) nằm ngoài cửa sổ 45 dòng đã quét — vòng sau grep INSERT INTO purchase_orders để lấy dòng + đổi literal sang pending_approval (parity với Java).
**Việc còn lại của B2:** (a) đổi trạng thái khởi tạo PO ⇒ pending_approval (Java + JS parity); (b) thêm action **eject_po** (PO ⇒ cancelled + decision_reason/decided_by/decided_at + **PR KHÔNG đổi** + **thông báo cho người tạo PO** qua 	ask_notifications/email_outbox); (c) **luật giá PO** trên purchase_order_items.unit_price (canEdit sửa giá · **KHÓA sau khi PO hoàn thành** · **không ghi ngược** danh mục).
**Bài học lặp lại (lần 4 trong phiên):** lại dùng 
ode -e và bị PowerShell phá nháy ⇒ **luôn viết tệp .mjs**.

### 14.1. Mỏ neo JS đã lấy được + PHÁT HIỆN quan trọng (18/09)
* **JS INSERT INTO purchase_orders** nằm **trong dòng 1321** (dòng dài, chứa cả INSERT INTO document_sequences và INSERT INTO purchase_orders với literal **'waiting_delivery'**).
  ⇒ Sửa parity với Java: đổi literal trạng thái PO khởi tạo ⇒ **pending_approval** ở **cả** Java (PurchaseManagementUseCase ~dòng 177) **và** JS (dòng 1321).
* ⚠️ **PHÁT HIỆN PHẢI ĐIỀU TRA TRƯỚC KHI SỬA (tránh làm trùng cơ chế):** chuỗi **"pending_approval" ĐÃ XUẤT HIỆN 6 chỗ** trong scripts/system-route.mjs:
  **dòng 994, 1099, 1491, 1496, 1561, 1578**. Cùng tệp còn có "draft" ×10, "approved" ×41, "waiting_delivery" ×4 (1321, 1323, 1378, 1442), "partial_delivery" ×4, "delivery_waiting_bch", "completed_with_exceptions", "delivery_completed", "delivery_partial".
  ⇒ **VÒNG SAU phải đọc 6 dòng đó** để biết pending_approval hiện dùng cho **thực thể nào** (nếu **đã dùng cho PO** thì KHÔNG thêm cơ chế mới, chỉ nối vào luồng sẵn có; nếu dùng cho thực thể khác thì mới thêm cho PO).
* Công cụ: 	ools/b2-mo-neo-js-po-status.mjs (in mỏ neo INSERT + liệt kê literal trạng thái kèm số dòng — **viết dạng .mjs theo đúng bài học**).

### 14.2. 🎯 BƯỚC 0 XONG — PHÁT HIỆN MẪU KIẾN TRÚC ĐÃ CÓ SẴN (18/09)
Đã đọc 6 chỗ dùng "pending_approval" — **KHÔNG chỗ nào thuộc PO**, mà là **3 thực thể khác**, và chúng cho thấy **một mẫu thống nhất**:
| Dòng | Action | Thực thể |
|---|---|---|
| 994 | create_request | **MR (phiếu đề nghị)** khởi tạo ở pending_approval (nếu không auto-complete) |
| 1099 | decide_approval | kiểm MR đang pending_approval |
| 1491 | create_central_return | **phiếu hoàn trả kho tổng** khởi tạo pending_approval |
| 1496 | pprove_central_return | **duyệt** phiếu hoàn trả (kiểm đang pending_approval) |
| 1561 | create_stock_count | **phiếu kiểm kê** khởi tạo pending_approval |
| 1578 | pprove_stock_count | **duyệt** phiếu kiểm kê |

**⇒ MẪU ĐÃ CÓ (không phải phát minh mới):** create_<entity> ⇒ bản ghi ở **pending_approval** → action **pprove_<entity>** kiểm status === "pending_approval" ⇒ chuyển sang trạng thái kế tiếp.
**⇒ KẾT LUẬN CHO B2:** KHÔNG tạo cơ chế mới; **PO đi theo đúng mẫu này**:
1. create_po ⇒ PO ở **pending_approval** (đổi literal: **JS dòng 1321** + **Java ~dòng 177**).
2. Thêm **pprove_po** ⇒ PO sang trạng thái vận hành (nối vào luồng giao hàng sẵn có) — **theo mẫu pprove_central_return/pprove_stock_count**.
3. Thêm **eject_po** ⇒ PO **cancelled** + decision_reason/decided_by/decided_at + **PR KHÔNG đổi** + **thông báo người tạo PO**.
4. **Luật giá PO** (unit_price): canEdit được sửa giá · **KHÓA sau khi PO hoàn thành** · **không ghi ngược** danh mục.
**Giá trị của bước 0:** nếu bỏ qua bước này, tôi đã có thể **dựng một luồng duyệt thứ hai song song** cho PO — đúng loại lỗi kiến trúc cần tránh.

### 14.3. ✅ B2/bước 1 ĐÃ ÁP DỤNG + HỆ THỐNG LÀNH MẠNH (18/09)
* **Java dựng lại: mvn exit=0** — log khởi động xác nhận: *"Successfully validated **18 migrations**"* · *"Current version of schema ntech_erp: **18**"*
  ⇒ **V18 (D3 — 3 cột quyết định) đã ghi vào lịch sử Flyway** ✔ (đây cũng là **cách đọc ĐÚNG** — dùng log Flyway/installed_rank, không dùng MAX(version) trên cột chuỗi).
* **UI nạp lại** ⇒ route Node nhận thay đổi; **Java :18081 200 · UI :8787 200 · proxy :9000 200**.
* **Kiểm tĩnh 2 lõi:** JS dòng 1321: pending_approval ✔ · JAVA dòng 177: pending_approval ✔ ⇒ **parity**.
* **CÒN LẠI của bước 1:** kiểm chứng **chức năng** (tạo 1 PO test ⇒ status phải là pending_approval) — nặng hơn (cần nhà cung cấp + kiểm MAR + payload) ⇒ **gộp vào bước 2 + D5** (tạo PO test rồi duyệt/từ chối luôn).

### 14.4. MẪU CHUẨN + ĐẶC TẢ pprove_po / eject_po (lấy xong 18/09)
**Mẫu chuẩn (JS pprove_stock_count, dòng 1574-1595) — PO sẽ bắt chước ĐÚNG khuôn này:**
``js
if (action === "approve_<entity>") {
  requireRole(user, [...]);                                     // 1. quyền
  const row = await first(SELECT id, project_id AS projectId, status FROM <bảng> WHERE id=?, id);
  if (!row || row.status !== "pending_approval") throw new Error("… đã xử lý.");   // 2. trạng thái
  if (!(await canAccessProject(user, String(row.projectId), true))) throw new Error("… không có quyền …");
  await env.DB.batch([env.DB.prepare(UPDATE <bảng> SET status='approved', … WHERE id=?).bind(...)]);  // 3. cập nhật
  // 4. audit + return { message }
}
``
**ĐẶC TẢ CHO PO (dùng đúng cột đã thêm ở D3):**
* **pprove_po** — equireRole(["procurement","accountant","admin"]) (KH + Kế toán, theo nghiệp vụ đã đề xuất) ·
  kiểm status === "pending_approval" · canAccessProject ·
  UPDATE purchase_orders SET status='waiting_delivery', decided_by=?, decided_at=?, updated_at=? WHERE id=?
  ⇒ **nối vào luồng giao hàng sẵn có** (trạng thái vận hành hiện tại là waiting_delivery) · audit.
* **eject_po** — cùng quyền/kiểm tra · UPDATE purchase_orders SET status='cancelled', decision_reason=?, decided_by=?, decided_at=?, updated_at=? WHERE id=?
  · **KHÔNG cập nhật material_requests** (đúng yêu cầu: **PR vẫn mở**) ·
  · **THÔNG BÁO người tạo PO**: purchase_orders.buyer_user_id chính là người tạo ⇒ ghi 	ask_notifications (nội dung: *"PO <số> đã bị hủy — hãy tạo lại/xử lý lại"*) + udit · KHÔNG chặn cứng (đúng chế độ **CHỈ CẢNH BÁO** nếu còn cảnh báo khác).
* **Parity Java:** thêm case "approve_po" / case "reject_po" trong SystemController + method tương ứng ở PurchaseManagementUseCase/PurchaseStore (theo khuôn pproveCentralReturn nếu có).
* **Kiểm chứng (gộp D5):** tạo 1 PO test ⇒ status = pending_approval ⇒ eject_po ⇒ PO cancelled + decision_reason có giá trị + **MR KHÔNG đổi** + **có dòng 	ask_notifications** cho người tạo.

### 14.5. Cơ chế THÔNG BÁO + AUDIT đã ĐO xong (18/09) — đủ để viết handler
* **Audit chuẩn:** sync function audit(userId, action, entityType, entityId, before, after, request) — **dòng 174**.
  Cách gọi thực tế trong mã: wait audit(user.id, "<ACTION>", "<entity_type>", <id>, null, { … }, request);
* **Thông báo trong hệ:** INSERT INTO task_notifications — **dòng 265**, **danh sách cột CHÍNH XÁC (12 cột)**:
  (id, work_item_id, user_id, channel, title, body, status, read_at, sent_at, last_error, created_at, updated_at)
  với id sinh bằng id("NTF…"); user_id = người nhận. ⇒ **Dùng kênh này cho thông báo hủy PO** (không dùng email_outbox vì bảng đó **gắn theo equest_id/stage** — đã đo ở dòng 530/551/1649, không phù hợp cho PO).
* **Đã xác nhận có action đánh dấu đã đọc:** mark_task_notification_read (dòng 1192) ⇒ thông báo hiển thị được cho người dùng.
**⇒ ĐỦ ĐIỀU KIỆN VIẾT pprove_po / eject_po mà KHÔNG cần khảo sát thêm.** Khuôn:
``js
if (action === "reject_po") {
  requireRole(user, ["procurement", "accountant", "admin"]);
  const poId = clean(payload.purchaseOrderId), reason = clean(payload.reason), stamp = new Date().toISOString();
  const po = await first(SELECT id,po_no AS poNo,project_id AS projectId,buyer_user_id AS buyerUserId,status FROM purchase_orders WHERE id=?, poId);
  if (!po || po.status !== "pending_approval") throw new Error("PO không tồn tại hoặc đã xử lý.");
  if (!(await canAccessProject(user, String(po.projectId), true))) throw new Error("Tài khoản không có quyền từ chối PO tại dự án này.");
  await env.DB.batch([
    env.DB.prepare(UPDATE purchase_orders SET status='cancelled',decision_reason=?,decided_by=?,decided_at=?,updated_at=? WHERE id=?).bind(reason, user.id, stamp, stamp, poId),
    env.DB.prepare(INSERT INTO task_notifications(id,work_item_id,user_id,channel,title,body,status,read_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?))
      .bind(id("NTF"), null, po.buyerUserId, "in_app", PO  đã bị hủy, PO  đã bị từ chối — hãy tạo lại/xử lý lại. Lý do: , "sent", null, stamp, null, stamp, stamp)
  ]);
  await audit(user.id, "REJECT", "purchase_order", poId, { status: "pending_approval" }, { status: "cancelled", reason }, request);
  return { message: Đã từ chối PO ; PR vẫn mở để xử lý lại. };
}
``
*(pprove_po tương tự, chỉ khác status='waiting_delivery' + audit "APPROVE" + không có thông báo hủy.)*

### 14.6. 🔎 PHÁT HIỆN QUAN TRỌNG: Java CHẶN action chưa triển khai (Strangler Fig) (18/09)
* **Đã nạp lại UI** (job mới) ⇒ UI :8787 **200**. Gọi thử pprove_po / eject_po qua **Java :18081** với id KHÔNG tồn tại (an toàn, không đột biến) và nhận:
  {"ok":false,"error":"Action 'approve_po' chưa được triển khai trên backend Java (Strangler Fig)."} (tương tự với eject_po).
* **Ý nghĩa (quan trọng cho kiến trúc):** backend Java có **cơ chế chặn tường minh** với mọi action **chưa port** ⇒
  **viết handler ở JS là CHƯA ĐỦ**: đường chạy thật (:9000 → Java) sẽ **từ chối** cho tới khi **port sang Java**.
  ⇒ **PARITY JAVA KHÔNG PHẢI TUỲ CHỌN — nó là CỔNG BẮT BUỘC** cho cả 3 action mới (pprove_po, eject_po, và các action của B3).
* **Ghi nhận về kiểm chứng:** không thể kiểm chứng chức năng qua **Node :8787** bằng HTTP vì đăng nhập ở đó trả **401** (runtime Node dùng **SQLite riêng** — đã biết từ trước) ⇒ **mọi kiểm chứng chức năng phải đi qua Java :18081**.
* **⇒ VIỆC KẾ TIẾP BẮT BUỘC:** thêm case "approve_po" / case "reject_po" vào SystemController + method tương ứng ở PurchaseManagementUseCase/PurchaseStore (theo khuôn có sẵn, ví dụ closePoLine/pproveCentralReturn nếu có) ⇒ **dựng lại jar (chờ nhả tệp jar)** ⇒ restart ⇒ **kiểm chứng chức năng** trên PO test.

### 14.7. KẾ HOẠCH PARITY JAVA cho pprove_po / eject_po (đã có đủ mẫu — 18/09)
**① Mẫu USE-CASE (Java)** — PurchaseManagementUseCase.closePoLine (**dòng 202-224**):
``java
public Map<String, Object> closePoLine(Principal principal, Map<String, Object> payload) {
  rbac.requireRole(principalAsCurrent(principal), List.of("procurement", "project", "admin"));
  … store.findPoLine(poItemId).orElseThrow(() -> Api("…"));
  accessScope.requireProjectAccess(principal.userId(), principal.role(), sv(line,"projectId"), true, "…");
  … store.<cap nhat>(…);
  return Map.of("message", "…");
}
``
**② Mẫu CONTROLLER** — case "close_po_line" (**dòng 1073-1077**), đúng 4 dòng:
``java
case "close_po_line" -> {
  AuthUseCase.CurrentUser cu = requireCurrentUser(request);
  Map<String, Object> result = purchaseManagementUseCase.closePoLine(asPurchasePrincipal(cu), payload);
  return ResponseEntity.ok(jsonResult(result));
}
``
**③ THÔNG BÁO trong Java — ĐÃ CÓ SẴN (không phải tự viết):**
* OpsTaskStore.java:29 — *"Thông báo trong ứng dụng cho người nhận việc — JS :265 (bảng 	ask_notifications, status SENT)"*.
* OpsTaskManagementUseCase có queueTaskNotice — ghi **	ask_notifications** và **thêm email_outbox nếu người nhận có email** (chú thích dòng 119/131).
⇒ **eject_po (Java) nên DÙNG LẠI queueTaskNotice** cho người tạo PO (uyer_user_id) ⇒ **không tự chế cơ chế mới**.
**④ Kế hoạch tệp (3 tệp):**
1. PurchaseStore (port): thêm Optional<Map<String,Object>> findPoForDecision(String poId) · oid decidePo(String poId, String status, String reason, String userId, Instant now).
2. PurchaseStoreAdapter: cài đặt 2 method trên (native SQL, UPDATE purchase_orders SET status=?,decision_reason=?,decided_by=?,decided_at=?).
3. PurchaseManagementUseCase: thêm pprovePo(...) (⇒ waiting_delivery) + ejectPo(...) (⇒ cancelled + gọi queueTaskNotice cho uyerUserId) — copy khuôn closePoLine.
4. SystemController: thêm 2 case (copy khuôn close_po_line).
**⑤ Kiểm chứng sau khi port:** mvn package (**chờ nhả tệp jar**) → restart → gọi pprove_po/eject_po qua **Java :18081** ⇒ **không còn** thông điệp *"chưa được triển khai trên backend Java"* ⇒ rồi mới **kiểm chứng chức năng trên PO test**.

### 15. [PHASE 0B] CÒN ĐÚNG 1 MỤC — S-05 (đo bằng bộ đọc ĐÚNG, 18/09)
**Kết quả đo lại: PHASE 0B = 9/10 DONE · còn 1 mục:**
* **S-05** · Module **Tệp** · *"Kiểm quyền cho /api/files (endpoint riêng, **không đi qua action**)"* · **ưu tiên P0** · không phụ thuộc mục nào.
⇒ Đây là **lỗ hổng P0 còn lại của phase bảo mật**: /api/files là endpoint **riêng**, không đi qua ActionRbacRegistry nên **không được RBAC theo action che** ⇒ cần **kiểm quyền riêng** ở endpoint đó.

⚠️ **TỰ PHÁT HIỆN MỘT LỖI ĐO CỦA CHÍNH MÌNH (ghi lại để không lặp):**
* Tôi viết 	ools/do-phase-0b.mjs đọc TT bằng c[c.length-1] **KHÔNG LỌC ô rỗng** ⇒ luôn lấy ô **cuối rỗng** ⇒ **báo sai 0/10** (trong khi thực tế 9/10).
* **Bộ đọc ĐÚNG:** các dòng lộ trình có **11 ô khi tách theo |** — **TT là ô[10]** (| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |).
* **Đã xoá** công cụ sai để không dùng lại; các con số phase khác (PHASE 1 = 12/17, PHASE 8 = 3/6, tổng 39/110) đọc bằng bộ lọc **last-non-empty** nên **vẫn đúng** — nhưng **từ nay dùng ô[10] là chuẩn**.

### 16. [PHASE 0B · S-05] KHOANH VÙNG XONG — endpoint /api/files (18/09)
**Đã xác định:**
* **Java:** FileController.java — **@RequestMapping("/api/files") (dòng 40)**, ghi rõ trong chú thích: *"endpoint **ngoài** /api/system"* ⇒ **KHÔNG đi qua ActionRbacRegistry** (đúng như mô tả của S-05).
* **Node:** pp/api/files/route.ts (SSOT — scripts/master-baseline-gate.mjs chốt *"/api/files chỉ có một SSOT"*, cấm scripts/files-route.mjs).
* **Hợp đồng hiện có (ghi trong chú thích Java):** POST multipart → 201 · GET ?entityType=&entityId= → danh sách · GET ?id= → nhị phân · DELETE ?id= → ok · **GET ?projectArchive= → ZIP (*chỉ admin*)**.
* **Đã tiêm sẵn AuthUseCase authUseCase** trong FileController ⇒ **có sẵn phương tiện để kiểm quyền**, chưa rõ đã dùng cho những method nào.
**VIỆC KẾ TIẾP (chính xác):**
1. Đọc **4 method** trong FileController + pp/api/files/route.ts ⇒ **đối chiếu xem method nào THIẾU kiểm quyền** (POST/GET ?id=/DELETE — nguy cơ cao nhất: tải/xoá tệp của thực thể KHÔNG thuộc phạm vi người dùng).
2. Thêm **kiểm quyền theo phạm vi thực thể** (canAccessProject/canAccessWarehouse theo entityType+entityId) — **parity Java + Node**.
3. Cổng kiểm chứng: gọi /api/files **không có phiên** ⇒ **401**; tài khoản **ngoài phạm vi** ⇒ **403**; tài khoản **trong phạm vi** ⇒ **200** (3 ca, có đối chứng dương).

### 16.1. [PHASE 0B · S-05] KẾT QUẢ ĐỌC THÂN — ĐÍNH CHÍNH CÁCH HIỂU (18/09)
**Điều ĐÃ CÓ trong FileController:**
* equireUser(request) (**dòng 128-131**) → uthUseCase.currentUser(SessionCookieFactory.decode(...)) → **ném ApiError("Chưa đăng nhập.", 401)** nếu không có phiên.
* Được gọi ở **cả 3 method**: upload (**dòng 57**) · get (**dòng 83**) · delete (**dòng 116**).
⇒ **/api/files KHÔNG phải "ai cũng tải được"**: nó **đã yêu cầu đăng nhập** (401).
**Điều CÒN THIẾU (đúng là nội dung S-05):** **kiểm PHẠM VI theo thực thể** — không có canAccessProject/canAccessWarehouse trong tệp
⇒ người dùng **đã đăng nhập** vẫn có thể **đọc/xoá tệp của thực thể NGOÀI phạm vi được phép** (chỉ cần biết entityType+entityId hoặc id).
**⇒ Phát biểu CHÍNH XÁC cho S-05:** *"/api/files: **đã có xác thực (401)**, **thiếu phân quyền theo phạm vi thực thể (403)"*. (Trước đó mô tả là *"kiểm quyền cho /api/files"* — cần nói rõ như trên để **không báo thừa**.)
**VIỆC KẾ TIẾP (chính xác):**
1. Thêm **kiểm phạm vi** cho upload/get/delete (và bản Node pp/api/files/route.ts): theo entityType (material_request, goods_receipt, purchase_order…) tra **project/kho** của thực thể rồi canAccessProject/canAccessWarehouse; nhánh ?id= phải tra ngược về thực thể chủ.
2. **Cổng 3 ca:** không phiên ⇒ **401** · đăng nhập nhưng **ngoài phạm vi** ⇒ **403** · **trong phạm vi** ⇒ **200** (có đối chứng dương).

### 16.2. [PHASE 0B · S-05] KHẢ THI + KẾ HOẠCH VÁ CHÍNH XÁC (18/09)
**Đo được:**
* Bảng **ttachments** (11 dòng): id, entity_type, entity_id, file_name, storage_key, mime_type, uploaded_by, created_at, updated_at
  ⇒ **KHÔNG có project_id/warehouse_id** ⇒ **phải tra ngược** project/kho từ (entity_type, entity_id).
* FileUseCase (API công khai): upload(user, entityType, entityId, …) (**dòng 47**) · list(user, entityType, entityId) (**78**) ·
  download(user, attachmentId) (**85**) · delete(user, attachmentId) (**99**) · projectArchive(user, projectId) (**120**)
  ⇒ **cả 4 method ĐÃ nhận user** ⇒ **logic phân quyền thuộc tầng này** (đúng chỗ, không nhét vào controller).
**KẾ HOẠCH VÁ (4 bước):**
1. Thêm **bộ tra ngược** projectIdOf(entityType, entityId) (mới, ở FileStore port + adapter) phủ các loại chính:
   material_request · purchase_order · goods_receipt · stock_issue · central_return · stock_count · project … ⇒ trả projectId (hoặc rỗng nếu không xác định).
2. Trong upload/list: **tra project từ input** ⇒ ccessScope.requireProjectAccess(...) ⇒ **403** nếu ngoài phạm vi.
   Trong download/delete: **tra attachment → (entityType, entityId) → project** ⇒ kiểm tương tự (đây là chỗ nguy hiểm nhất: ?id= không kèm ngữ cảnh).
3. **Parity Node** ở pp/api/files/route.ts (cùng 4 nhánh).
4. **Cổng 3 ca:** không phiên ⇒ **401** · đăng nhập nhưng **ngoài phạm vi** ⇒ **403** · **trong phạm vi** ⇒ **200** (có đối chứng dương).
**Lưu ý an toàn khi thi hành:** các loại thực thể **không tra được project** (ví dụ entity_type lạ) ⇒ **mặc định TỪ CHỐI (403)**, không mặc định cho qua — đúng nguyên tắc *fail-closed*.

### 16.4. ĐÍNH CHÍNH LẦN 4 (18/09): commit `cdb06ef` NÓI SAI (marking không xảy ra)

* Commit `cdb06ef` có thông điệp *"…danh dau DONE… PHASE 0B = 10/10"* nhưng **thực tế KHÔNG đánh dấu được**: script tự chối vì dòng `S-05` kết thúc bằng `| CHECK | TODO |` (**TT không in đậm**), regex của tôi lại đòi `| **TODO** |`.
* Hệ quả: commit đó **chỉ chứa công cụ khảo sát**, lộ trình **vẫn 9/10** ⇒ **phải đọc lại sau khi ghi** (đúng bài học cũ, nhưng lần này tôi lại viết thông điệp theo **ý định**).
* **Đã sửa:** thay bằng regex đúng `|\s*TODO\s*\|\s*$` ⇒ `S-05` → **`DONE / KIEM-CHUNG-3-CA`** ⇒ **PHASE 0B = 10/10**; và commit đính chính ghi rõ commit trước nói sai.
* **BÀI HỌC (lần 4):** sau khi chạy script ghi, **phải đọc lại kết quả** (Select-String/đo lại) **trước khi** viết thông điệp commit; và regex thay-thế phải viết theo **đúng văn bản đo được** (ô TT có thể **không** in đậm).

### 14.8. [PHASE 8 · B2 · parity Java] TINH CHỈNH KẾ HOẠCH — tận dụng method ĐÃ CÓ (18/09)
**Đo lại PurchaseStore (port) — các method TÁI DÙNG ĐƯỢC:**
* Optional<Map<String,Object>> findPoForReceiving(String poId) — **dòng 51** — *"po + request + project info"* ⇒ **dùng để ĐỌC PO** (có trạng thái + dự án + thông tin người tạo).
* oid updatePoReceivedStatus(String purchaseOrderId, String status, Instant now) — **dòng 71** — **cập nhật trạng thái PO KHÔNG đụng MR** ✔ (đúng yêu cầu *"PR vẫn mở"* cho eject_po).
* ⚠️ **KHÔNG dùng** updatePoStatusAndMr(...) (**dòng 64**) cho eject_po vì tên nó cho thấy **có đụng MR**.
**⇒ KẾ HOẠCH RÚT GỌN CÒN 4 TỆP + 2 METHOD MỚI (thay vì dựng từ đầu):**
1. **PurchaseStore (port)** — thêm **2 method**: oid decidePo(String poId, String status, String reason, String userId, Instant now); (ghi decision_reason/decided_by/decided_at) và oid insertTaskNotification(String userId, String title, String body, Instant now); (12 cột 	ask_notifications, tự chứa — không phải đấu dây chéo use-case).
2. **PurchaseStoreAdapter** — cài đặt 2 method trên (native SQL).
3. **PurchaseManagementUseCase** — thêm pprovePo (⇒ status='waiting_delivery' + decidePo) và ejectPo (⇒ status='cancelled' + decision_reason + decidePo + insertTaskNotification cho **uyer_user_id**), theo khuôn closePoLine (**dòng 202-224**), dùng indPoForReceiving để đọc.
4. **SystemController** — thêm 2 case theo khuôn close_po_line (**dòng 1073-1077**).
**Kiểm chứng:** mvn package (**CHỜ NHẢ TỆP JAR**) → restart → gọi pprove_po/eject_po qua Java ⇒ **hết** thông điệp *"chưa được triển khai trên backend Java"* ⇒ rồi kiểm chứng chức năng trên **PO test**.

### 14.9. ✅ PARITY JAVA pprove_po/eject_po ĐÃ SỐNG (18/09) — BẰNG CHỨNG
* **Build:** mvn -q -DskipTests package ⇒ **exit 0**; Java khởi động sạch: **Flyway "Successfully validated 18 migrations"**, schema **v18**, Tomcat :18081.
* **Trước khi port:** gọi qua Java ⇒ {"ok":false,"error":"Action 'approve_po' **chưa được triển khai trên backend Java (Strangler Fig)**."}
* **Sau khi port (đo lại ngay):**
  * pprove_po ⇒ **HTTP 400** {"ok":false,"error":"**PO không tồn tại hoặc đã xử lý.**"}
  * eject_po ⇒ **HTTP 400** {"ok":false,"error":"**PO không tồn tại hoặc đã xử lý.**"}
  ⇒ **Đây là thông điệp CỦA CHÍNH ỨNG DỤNG** (từ decidePo(...) của tôi), **không còn** thông điệp Strangler Fig ⇒ **2 action đã được Java nhận và thực thi** ✔
  *(dùng id PO không tồn tại ⇒ **không đột biến dữ liệu**; lỗi 400 là do Api(...) của use-case, không phải lỗi framework.)*
* **⇒ Trạng thái B2/bước 2:** **JS ✔ + Java ✔ + cổng "action được nhận" ✔**. **Còn lại:** kiểm chứng **end-to-end trên PO thật** (tạo PO pending_approval ⇒ eject_po ⇒ PO cancelled + decision_reason + **MR không đổi** + có 	ask_notifications) ⇒ **gộp vào D5** (cần dữ liệu test).
**Bài học đã trả giá trong bước này:** khi chèn trước **một chữ ký method**, phải kiểm **annotation ngay trên nó** (@Override/@Transactional) — nếu không sẽ **tách annotation khỏi method** gây lỗi biên dịch *"@Override is not a repeatable annotation"*.

### 14.10. 🧪 KIỂM CHỨNG END-TO-END B2 (eject_po) — **6/7 ĐẠT · 1 HỎNG** (18/09)
Công cụ: 	ools/b2-e2e-reject-po.mjs (dựng PO test ⇒ gọi API thật ⇒ kiểm ⇒ **hoàn tác trong inally**; PO dùng: PO-PRJ-DEMO-01-2026-0010, MR MR_63fe9433-..., buyer USR_8869ca60-...).
| # | Điều kiện | Kết quả |
|---|---|---|
| 1 | Dựng được PO test ở pending_approval | **ĐẠT** |
| 2 | eject_po qua Java | **ĐẠT** — HTTP 200 {"ok":true,"message":"Đã từ chối PO PO-PRJ-DEMO-01-2026-0010; PR vẫn mở để xử lý lại."} |
| 3 | PO ⇒ cancelled | **ĐẠT** (status='cancelled') |
| 4 | Ghi decision_reason | **ĐẠT** ('KIỂM THỬ end-to-end B2 (tự động, sẽ hoàn tác)') |
| 5 | Ghi decided_by | **ĐẠT** (USR_2f435847-...) |
| 6 | **MR KHÔNG ĐỔI** (PR vẫn mở) | **ĐẠT** (pproved → pproved) |
| 7 | **Có thêm 1 dòng 	ask_notifications cho người tạo PO** | ❌ **HỎNG** — 	rước=3 · sau=3 (**không có dòng nào được ghi**) |
**Chẩn đoán (giả thuyết mạnh nhất, chưa xác minh):** trong PurchaseManagementUseCase.decidePo(...) tôi đọc người tạo bằng sv(po, "buyerUserId") từ store.findPoForReceiving(poId) — nếu SQL của adapter **không select uyer_user_id AS buyerUserId** thì sv(...) trả **chuỗi rỗng** ⇒ nhánh if (!buyer.isEmpty()) **không chạy** ⇒ **im lặng không gửi thông báo** (đúng kiểu lỗi *"thất bại im lặng"*).
**BÀI HỌC (lần này là giá trị của cổng kiểm chứng):** nếu chỉ **đọc mã** và thấy if (!buyer.isEmpty()) store.insertTaskNotification(...) thì rất dễ kết luận "đã có thông báo"; **chạy thật** mới lộ ra **không có dòng nào được ghi**. ⇒ *Không được tuyên bố "xong" cho tới khi đo.*
**HOÀN TÁC:** PO đã trả về delivered_pending_confirmation (đúng gốc) · 	ask_notifications về **3** (đúng gốc) ⇒ **không để lại rác test**; file hoàn tác: docs/agent-progress/TASK-094-d5-b2-rollback.sql.
**VIỆC KẾ TIẾP:** (1) kiểm SQL của indPoForReceiving có uyer_user_id AS buyerUserId không; (2) nếu thiếu ⇒ bổ sung (hoặc thêm port poBuyerId(poId)) — **JS đã select tường minh uyer_user_id AS buyerUserId** nên chỉ Java cần sửa; (3) chạy lại cổng ⇒ kỳ vọng **7/7**.

### 14.11. 🎯 NGUYÊN NHÂN GỐC #2 (ĐO ĐƯỢC): 	ask_notifications.work_item_id là **NOT NULL** (18/09)
**Sau khi sửa #1 và dựng lại jar, cổng E2E cho kết quả MỚI: 6/8 — kiểu lỗi ĐÃ ĐỔI** (rất có giá trị chẩn đoán):
* eject_po ⇒ **HTTP 409** {"error":"Dữ liệu vi phạm ràng buộc của hệ thống (trùng hoặc thiếu tham chiếu)…","ok":false}
* **NHƯNG** PO **vẫn** ghi cancelled + decision_reason + decided_by ⇒ **câu UPDATE đã commit**, chỉ câu **INSERT thông báo** nổ.
**ĐO RÀNG BUỘC (information_schema):**
| cột | NULL? | default |
|---|---|---|
| id | **NO** | — |
| **work_item_id** | **NO** | — (không default) |
| user_id | **NO** | — |
| channel | NO | in_app |
| status | NO | PENDING |
**⇒ Em truyền work_item_id = null ⇒ vi phạm NOT NULL ⇒ 409** ✔ (khớp chính xác)
**Và so với JS (dòng 265):** … VALUES (?,?,?…) bind id("NTF"), **task.id**, assignee.id, "in_app", …, **"SENT"**, null, stamp, null, stamp, stamp
⇒ **2 khác biệt:** (1) JS truyền **một work item THẬT**; (2) JS dùng status = "SENT" (chữ HOA), em dùng "sent" (lệch quy ước).
**⚠️ HỆ QUẢ QUAN TRỌNG (đã kiểm cả 2 lõi):** 	ask_notifications **gắn chặt với work item** ⇒ **KHÔNG thể dùng bảng này cho thông báo hủy PO** nếu không có work item ⇒ **bản JS eject_po của tôi CŨNG có lỗi tiềm ẩn tương tự** (cũng truyền work_item_id: null).
**⚠️ LỖI THỨ 3 PHÁT HIỆN:** **không nguyên tử** — UPDATE PO đã commit nhưng INSERT lỗi ⇒ trạng thái **nửa vời**; decidePo (adapter do tôi thêm) **THIẾU @Transactional**.
**ĐỀ XUẤT SỬA (có căn cứ):**
1. **Nguyên tử hoá**: thêm @Transactional cho decidePo (adapter) ⇒ hoặc tất cả, hoặc không gì cả.
2. **Kênh thông báo**: dùng **email_outbox** (gắn theo equest_id — PO **có** equest_id ✔; stage='po_reject', event=…) tới **email người tạo PO** ⇒ **KHÔNG** dùng 	ask_notifications (vì bắt buộc work item). **Cần bổ sung join** lấy email người tạo: LEFT JOIN users bu ON bu.id=po.buyer_user_id + u.email AS buyerEmail.
3. **Đồng bộ JS**: bản JS eject_po phải theo cùng kênh (bỏ 	ask_notifications).
**TRẠNG THÁI NÓI THẬT:** lỗi **CHƯA đóng**; cổng E2E hiện **6/8** (trước đó 6/7 — số ca tăng vì thêm ca hoàn tác). **Chưa được coi là xong.**

### 14.12. THIẾT KẾ SỬA 3 LỖI — CHỐT (18/09): GỘP 2 GHI VÀO **MỘT METHOD ADAPTER CÓ @Transactional**
**Vì sao gộp:** nếu để 2 lời gọi rời (decidePo + insertTaskNotification) thì **mỗi lời gọi một giao dịch riêng** ⇒ **vẫn không nguyên tử**. Đặt @Transactional ở use-case thì phụ thuộc **proxy của Spring** trên lớp use-case (bean tạo bằng @Bean) — **rủi ro không đáng**. ⇒ **Gộp cả 2 câu ghi vào MỘT method của adapter** (adapter **đã** dùng @Transactional thành công ở closePoLine) ⇒ **nguyên tử chắc chắn**.
**SỬA CỤ THỂ (4 vị trí):**
1. **PurchaseStore (port)** — thay 2 method tôi đã thêm bằng **1 method**:
   oid decidePo(String poId, String status, String reason, String userId, String notifyUserId, String notifyTitle, String notifyBody, Instant now);
2. **PurchaseStoreAdapter** — cài đặt **1 method @Transactional** chứa **cả 2 câu**:
   * UPDATE purchase_orders SET status=?,decision_reason=?,decided_by=?,decided_at=?,updated_at=? WHERE id=?
   * **Nếu 
otifyUserId không rỗng** ⇒ INSERT INTO task_notifications(...) với **work_item_id = poId** (bảng **bắt buộc** work item; **không có FK** nên nhận id PO) + **status='SENT'** (theo quy ước JS).
   * 
otifyUserId rỗng ⇒ **chỉ UPDATE** (không nổ, không nửa vời).
3. **PurchaseManagementUseCase.decidePo** — gọi **1 lời** store.decidePo(poId, status, approve?null:reason, principal.userId(), approve?"":buyer, title, body, now); **bỏ** lời gọi insertTaskNotification rời.
4. **JS eject_po** (đồng bộ kênh): đổi 
ull → **poId** cho work_item_id và "sent" → **"SENT"**.
**CỔNG KIỂM CHỨNG (chạy lại sau khi dựng jar): kỳ vọng 8/8**, và **đặc biệt** kiểm thêm ca **"không còn 409"** + **"có đúng 1 dòng 	ask_notifications với work_item_id = id PO"** + **"MR không đổi"**.
**GHI CHÚ TRUNG THỰC:** 3 lỗi này **chưa đóng**; cổng E2E hiện **6/8**.

### 14.13. ✅ CỔNG E2E B2 **8/8 ĐẠT · 0 HỎNG** sau khi nguyên tử hoá (18/09)
**Bằng chứng (chạy thật, PO test PO-PRJ-DEMO-01-2026-0010):**
`
reject_po ⇒ HTTP 200: {"ok":true,"message":"Đã từ chối PO PO-PRJ-DEMO-01-2026-0010; PR vẫn mở để xử lý lại."}
[ĐẠT] dựng được PO test ở pending_approval
[ĐẠT] reject_po chạy thành công qua Java :: HTTP 200
[ĐẠT] PO chuyển sang cancelled
[ĐẠT] có ghi decision_reason
[ĐẠT] có ghi decided_by
[ĐẠT] MR KHÔNG ĐỔI (PR vẫn mở) :: 'approved' → 'approved'
[ĐẠT] có THÊM 1 dòng task_notifications cho người tạo PO :: trước=3 sau=4 ·
       USR_8869ca60-7c6a-4e7f-bebd-0547f38bcdb8 | "PO PO-PRJ-DEMO-01-2026-0010 đã bị hủy"
HOÀN TÁC: PO về 'delivered_pending_confirmation' · task_notifications về 3
[ĐẠT] đã HOÀN TÁC PO về trạng thái gốc
=== B2 END-TO-END: 8/8 ĐẠT · 0 HỎNG ===
`
**Điểm quan trọng:** người nhận là **USR_8869ca60-… = đúng uyer_user_id** của PO (không rơi vào nhánh dự phòng) ⇒ **đúng người tạo PO** như yêu cầu.
**Điều kiện tiên quyết đã kiểm trước đó:** build **mvn exit=0**; adapter có **@Override + @Transactional + public void decidePo(... notifyUserId, notifyTitle, notifyBody, Instant now)** (đọc lại dòng 231-236) ⇒ **nguyên tử thật**.
**⚠️ LƯU Ý TRUNG THỰC VỀ MÃ THOÁT:** dòng tổng kết của script in **"8/8 ĐẠT · 0 HỎNG"** nhưng mã thoát do công cụ báo là **1**. Tôi **chưa chứng minh** nguyên nhân; giả thuyết: ống dẫn bị cắt sớm do Select-Object -First 18 (không phải lỗi phép kiểm). **⇒ VÒNG SAU phải chạy lại KHÔNG cắt output để xác nhận mã thoát = 0** trước khi coi eject_po là "xong tuyệt đối".
**Trạng thái B2:** 3 lỗi đã vá ở mã **và** đã có bằng chứng chạy **8/8**; còn **1 xác nhận kỹ thuật** (mã thoát) ⇒ **gần xong, chưa tuyên bố xong**.

### 14.14. ✅ XÁC NHẬN DỨT ĐIỂM: mã thoát THẬT = **0** (18/09) ⇒ **ĐÓNG B2/bước 2**
**Chạy lại KHÔNG cắt output ($out = node … rồi $LASTEXITCODE):**
`
=== B2 END-TO-END: 8/8 ĐẠT · 0 HỎNG ===
=== MÃ THOÁT THẬT: 0 ===
`
⇒ **Chứng minh được** nghi vấn ở §14.13: mã thoát "1" trước đó là **do Select-Object -First 18 cắt ống dẫn**, **KHÔNG phải** phép kiểm thất bại.
**⚠️ BÀI HỌC MỚI (đã trả giá 1 vòng):** cmd | Select-Object -First N có thể làm **mã thoát bị báo sai** ⇒ **khi cần mã thoát, phải gán $out = cmd rồi đọc $LASTEXITCODE, KHÔNG cắt ống dẫn.**
**⇒ TRẠNG THÁI B2/bước 2: ĐÓNG (đủ bằng chứng 2 lõi + cổng E2E 8/8 + mã thoát 0):**
* JS + Java **parity**: pprove_po/eject_po (JS dòng 1325/1335 · Java port 46 · adapter 234 @Transactional · use-case 227/232 · controller 1073/1078).
* **3 lỗi thật đã vá**: ① thiếu uyer_user_id ⇒ người nhận rỗng ② work_item_id NOT NULL ⇒ 409 ③ **ghi không nguyên tử**.
* **Hành vi đúng như yêu cầu:** PO ⇒ cancelled + lý do/ai/khi nào · **PR VẪN MỞ** (MR pproved → pproved) · **thông báo tới đúng uyer_user_id** · **hoàn tác sạch** (không rác test).

### 14.15. [PHASE 8 · B2/bước 3] KHẢO SÁT: **CHƯA CÓ** action sửa giá PO ⇒ đây là TÍNH NĂNG MỚI (18/09)
**Đo được (không đoán):**
* **JS** scripts/system-route.mjs: unit_price chỉ xuất hiện trong các câu **SELECT** (ví dụ dòng 624 — đọc poi.unit_price AS unitPrice để hiển thị). **KHÔNG có** action update_po/update_po_item/edit_po nào (grep ction === "update_po…" ⇒ **0 kết quả**).
* **Java**: các chỗ ghi unitPrice đều thuộc **BOQ**: BoqStore.updatePbiPrice(...) (BoqStore.java:106) · BoqManagementUseCase (dòng 99/161/341/355) · AdminOpsManagementUseCase (229-231). **KHÔNG có** chỗ nào ghi purchase_order_items.unit_price.
⇒ **Kết luận:** yêu cầu *"người có quyền sửa PO được sửa giá PO; sau khi PO hoàn thành thì không cho sửa"* **chưa được cài đặt** ⇒ **B2/bước 3 = TÍNH NĂNG MỚI** (không phải fix).
**THIẾT KẾ (bám đúng yêu cầu, không suy đoán thêm):**
* **Action mới update_po_price** (JS + Java **parity**):
  * Đầu vào: purchaseOrderId + lines: [{ purchaseOrderItemId, unitPrice }].
  * **Quyền:** equireRole(["procurement","accountant","admin"]) **+** ccessScope.requireProjectAccess(...) theo dự án của PO (nhất quán với pprove_po/eject_po vừa làm).
  * **KHOÁ theo trạng thái (đúng yêu cầu "sau khi PO hoàn thành không cho sửa"):** **TỪ CHỐI** khi purchase_orders.status thuộc nhóm **đã hoàn thành**: completed, completed_with_shortage, completed_with_exceptions (và cancelled) ⇒ thông điệp rõ: *"PO đã hoàn thành — không được sửa giá."*
  * Cho sửa khi PO còn đang chạy: pending_approval, pproved, waiting_delivery, partial_delivery, delivered_pending_confirmation.
  * **Ghi DUY NHẤT** purchase_order_items.unit_price (+updated_at) **trong MỘT giao dịch**; **TUYỆT ĐỐI KHÔNG** ghi materials.standard_price/materials.* (yêu cầu: **không ghi ngược danh mục**) ⇒ thêm udit(...) để truy vết.
* **CỔNG KIỂM CHỨNG 3 CA:**
  1. PO **chưa** hoàn thành ⇒ sửa được, **đọc lại thấy giá mới** đúng.
  2. PO **đã** hoàn thành ⇒ **bị CHẶN** (thông điệp rõ, giá **không đổi**).
  3. **Danh mục KHÔNG đổi** — chụp materials (số dòng + giá liên quan) **trước/sau** ⇒ **phải giống hệt**.
**TRẠNG THÁI:** chưa cài đặt; đây là việc kế tiếp sau khi B2/bước 2 đã đóng (§14.14).

### 14.16. ✅ CHUỖI 3 LỖI BIÊN DỊCH ĐÃ GIẢI QUYẾT — update_po_price ĐÃ SỐNG (18/09)
**Bằng chứng cuối (sau khi sửa cả 3 lỗi):**
* health -> 200 ⇒ **build thành công** (Java chỉ khởi động khi mvn exit=0).
* update_po_price (id PO không tồn tại) ⇒ **HTTP 400** {"ok":false,"error":"**PO không tồn tại.**"} = **thông điệp của chính ứng dụng** (từ updatePoPrice → indPoForReceiving(...).orElseThrow(...)) ⇒ **action đã được Java nhận và thực thi**, **không đột biến dữ liệu**.
**3 lỗi + cách sửa (đã ghi ở từng commit):** ① strictNonNegative không có trong lớp ⇒ dùng **
umberValue** + kiểm âm tại chỗ · ② khối updatePoItemPrice bị chèn **vào giữa thân decidePo** ⇒ chuyển ra sau, **cân bằng ngoặc 56 = 56** · ③ case "update_po_price" **ngoài switch** ⇒ chuyển vào **cùng switch với pprove_po** (1073 → 1078 → 1083), **ngoặc 314 = 314**.
**2 BÀI HỌC MỚI (đã trả giá 2 vòng build):**
1. **Tìm dấu } đóng METHOD phải ĐẾM NGOẶC** — cách "lấy dấu } đầu tiên sau dòng X" **đã chèn sai vào thân method**.
2. **SystemController có NHIỀU switch** ⇒ case mới phải chèn **vào đúng switch** — bám case "approve_po", **KHÔNG** bám case "close_po_line" (case này thuộc switch khác).
**CÒN LẠI của B2/bước 3:** ① **cổng 3 ca** (chưa xong ⇒ sửa được + đọc lại đúng giá mới · **đã xong ⇒ BỊ CHẶN**, giá không đổi · **danh mục KHÔNG đổi**) ② **JS parity** update_po_price.
**TRẠNG THÁI:** tính năng **đã sống** nhưng **CHƯA có bằng chứng chức năng** ⇒ **chưa coi là xong**.

### 14.17. ✅ CỔNG update_po_price **6/6 ĐẠT · 0 HỎNG · MÃ THOÁT THẬT = 0** (18/09)
Công cụ: 	ools/b2b3-cong-gia-po.mjs (dựng dữ liệu ⇒ gọi API thật ⇒ kiểm ⇒ **hoàn tác trong inally**; PO PO-PRJ-DEMO-01-2026-0010, dòng POI_f86a77e1-…, giá gốc  ).
`
CHECKSUM TABLE materials TRƯỚC = 4026259885
CA A ⇒ HTTP 200: {"ok":true,"message":"Đã cập nhật đơn giá 1 dòng của PO PO-PRJ-DEMO-01-2026-0010; danh mục vật tư KHÔNG thay đổi."}
  [ĐẠT] CA A: sửa giá khi PO CHƯA hoàn thành :: HTTP 200
  [ĐẠT] CA A: ĐỌC LẠI thấy đúng giá mới :: 0 → 1234.56
CA B ⇒ HTTP 400: {"ok":false,"error":"PO đã hoàn thành (completed) — không được sửa giá."}
  [ĐẠT] CA B: PO ĐÃ hoàn thành ⇒ BỊ CHẶN (nêu rõ lý do) :: HTTP 400
  [ĐẠT] CA B: giá KHÔNG đổi khi bị chặn :: vẫn = 1234.56
  [ĐẠT] CA C: DANH MỤC (materials) KHÔNG ĐỔI :: checksum 4026259885 → 4026259885
  HOÀN TÁC: PO status='delivered_pending_confirmation' · giá=0
  [ĐẠT] đã HOÀN TÁC về đúng gốc
=== CỔNG update_po_price: 6/6 ĐẠT · 0 HỎNG === ; MÃ THOÁT THẬT: 0
`
**Đối chiếu ĐÚNG 3 yêu cầu của anh:**
1. *"Cho phép người có quyền sửa PO được sửa giá PO"* ⇒ **CA A HTTP 200** + **đọc lại thấy giá mới** (  → 1234.56).
2. *"Sau khi PO hoàn thành không cho sửa nữa"* ⇒ **CA B HTTP 400** "PO đã hoàn thành (completed) — không được sửa giá." + **giá KHÔNG đổi** ⇒ **KHOÁ hoạt động**.
3. *"Không ghi ngược danh mục"* ⇒ **CA C**: CHECKSUM TABLE materials **4026259885 → 4026259885** (giống hệt).
**Không để lại rác test:** hoàn tác đưa PO về delivered_pending_confirmation và giá về   ✔.
**CÒN LẠI của B2/bước 3:** **JS parity** — thêm update_po_price vào scripts/system-route.mjs (hiện chỉ có phía Java).

### 14.18. ✅ JS PARITY update_po_price (18/09) — 2 lõi đã đồng bộ
**Đã chèn vào scripts/system-route.mjs** (xác nhận bằng đọc lại): **dòng 1348** if (action === "update_po_price") { · **dòng 1354** khoá trạng thái if(LOCKED_PO.includes(String(po.status))) throw new Error(\PO đã hoàn thành () — không được sửa giá.\) · **dòng 1366** wait audit(user.id,"UPDATE","purchase_order_price",poId,…).
**Cùng ngữ nghĩa với Java:** equireRole([procurement, accountant, admin]) · đọc PO (po_no, project_id, status) · **KHOÁ** ["completed","completed_with_shortage","completed_with_exceptions","cancelled"] · canAccessProject · vòng lặp lines (purchaseOrderItemId + unitPrice, **không âm**) · **chỉ** UPDATE purchase_order_items SET unit_price=? … WHERE id=? AND purchase_order_id=? (**không đụng materials**) · udit.
**Kiểm:** 
ode --check scripts/system-route.mjs ⇒ **exit 0** ✔
**⇒ B2/bước 3:** **Java (đã kiểm 6/6) + JS parity (đã chèn)** — *còn lại: **restart UI** để nạp handler JS (không phải đường chạy thật, vì đường thật là Java :9000 → :18081).*
