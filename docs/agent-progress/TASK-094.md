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
